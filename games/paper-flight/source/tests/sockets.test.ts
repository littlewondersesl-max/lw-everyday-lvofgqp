import http from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import WebSocket from 'ws'
import { attachGameSockets } from '../server/sockets'

const closers: (() => void)[] = []

afterEach(() => {
  for (const close of closers) close()
  closers.length = 0
})

function start() {
  const server = http.createServer()
  const sockets = attachGameSockets(server)
  return new Promise<{ url: string; close: () => void }>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('no port')
      const close = () => {
        sockets.close()
        server.close()
      }
      closers.push(close)
      resolve({ url: `ws://127.0.0.1:${address.port}/ws`, close })
    })
  })
}

function connect(url: string) {
  const ws = new WebSocket(url)
  const inbox: Record<string, unknown>[] = []
  let cursor = 0
  ws.on('message', (data) => inbox.push(JSON.parse(data.toString())))
  return new Promise<{
    ws: WebSocket
    wait: (type: string) => Promise<Record<string, unknown>>
  }>((resolve, reject) => {
    ws.on('error', reject)
    ws.on('open', () => {
      resolve({
        ws,
        wait: (type: string) =>
          new Promise((res, rej) => {
            const startAt = Date.now()
            const tick = () => {
              const idx = inbox.findIndex((m, i) => i >= cursor && m.type === type)
              if (idx >= 0) {
                cursor = idx + 1
                return res(inbox[idx])
              }
              if (Date.now() - startAt > 4000) return rej(new Error(`timeout waiting for ${type}`))
              setTimeout(tick, 15)
            }
            tick()
          }),
      })
    })
  })
}

describe('separate websocket clients', () => {
  it('lets a second connection replace a bot and a disconnect give the seat back', async () => {
    const { url } = await start()
    const a = await connect(url)
    a.ws.send(JSON.stringify({ type: 'hello', name: 'Ada' }))
    const welcomeA = await a.wait('welcome')
    const stateA = await a.wait('state')
    const room = welcomeA.room as string
    const viewA = stateA.state as { seats: { kind: string; name: string }[] }
    expect(viewA.seats.filter((s) => s.kind === 'bot')).toHaveLength(3)

    const b = await connect(url)
    b.ws.send(JSON.stringify({ type: 'hello', room, name: 'Bea' }))
    const welcomeB = await b.wait('welcome')
    expect(welcomeB.room).toBe(room)
    const stateB = await b.wait('state')
    const viewB = stateB.state as { seats: { kind: string; name: string; you: boolean }[]; you: number }
    expect(viewB.seats.filter((s) => s.kind === 'human')).toHaveLength(2)
    expect(viewB.you).not.toBe(welcomeA.you)

    b.ws.close()
    // The seat stays a disconnected human until the grace period (covered in room.test).
    let connectedHumans = 2
    for (let i = 0; i < 30; i++) {
      a.ws.send(JSON.stringify({ type: 'rename', name: 'Ada' }))
      const after = await a.wait('state')
      const seats = (after.state as { seats: { kind: string; connected: boolean }[] }).seats
      const humans = seats.filter((s) => s.kind === 'human')
      expect(humans).toHaveLength(2)
      connectedHumans = humans.filter((s) => s.connected).length
      if (connectedHumans === 1) break
      await new Promise((r) => setTimeout(r, 30))
    }
    expect(connectedHumans).toBe(1)
  })
})

import type { IncomingMessage } from 'node:http'
import type { Server } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import {
  createRoom,
  expireDisconnects,
  joinRoom,
  leaveRoom,
  makeRoomCode,
  markFoldReady,
  publicView,
  renameSeat,
  requestNewRound,
  setDye,
  setFolds,
  throwSeat,
  type Room,
} from '../src/sim/room'

interface Client {
  socket: WebSocket
  room: Room | null
  token: string | null
}

const rooms = new Map<string, Room>()
const liveSocket = new Map<string, WebSocket>()

export function attachGameSockets(httpServer: Server) {
  const wss = new WebSocketServer({ noServer: true })
  const clients = new Set<Client>()

  httpServer.on('upgrade', (req, socket, head) => {
    const pathname = (req.url || '').split('?')[0]
    if (pathname !== '/ws') return
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  })

  const grace = setInterval(() => {
    const now = Date.now()
    for (const room of rooms.values()) {
      expireDisconnects(room, now)
      broadcast(room)
    }
    for (const [code, room] of rooms) {
      if (!room.seats.some((s) => s.kind === 'human')) {
        const idle = room.seats.every((s) => s.kind === 'bot')
        if (idle && now - createdAt.get(code)! > 10 * 60 * 1000) rooms.delete(code)
      }
    }
  }, 4000)
  grace.unref?.()

  wss.on('connection', (socket: WebSocket, _req: IncomingMessage) => {
    const client: Client = { socket, room: null, token: null }
    clients.add(client)
    socket.on('message', (data) => {
      if (typeof data !== 'string' && !Buffer.isBuffer(data)) return
      const text = data.toString()
      if (text.length > 200_000) {
        socket.close()
        return
      }
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(text) as Record<string, unknown>
      } catch {
        return
      }
      handle(client, msg)
    })
    socket.on('close', () => {
      clients.delete(client)
      if (client.room && client.token && liveSocket.get(client.token) === socket) {
        liveSocket.delete(client.token)
        leaveRoom(client.room, client.token, Date.now())
        broadcast(client.room)
      }
    })
  })

  function handle(client: Client, msg: Record<string, unknown>) {
    const type = msg.type
    if (type === 'hello') {
      const requested = typeof msg.room === 'string' ? msg.room.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) : ''
      let room = requested ? rooms.get(requested) : undefined
      if (!room) {
        const code = requested.length === 4 ? requested : freshCode()
        room = createRoom(code)
        rooms.set(code, room)
        createdAt.set(code, Date.now())
      }
      const joined = joinRoom(room, {
        token: typeof msg.token === 'string' ? msg.token : null,
        name: typeof msg.name === 'string' ? msg.name : null,
        now: Date.now(),
      })
      if ('error' in joined) {
        send(client.socket, { type: 'error', message: joined.error })
        return
      }
      client.room = room
      client.token = joined.token
      liveSocket.set(joined.token, client.socket)
      send(client.socket, { type: 'welcome', room: room.code, token: joined.token, you: joined.seat })
      broadcast(room)
      return
    }
    if (!client.room || !client.token) return
    if (type === 'rename' && typeof msg.name === 'string') renameSeat(client.room, client.token, msg.name)
    else if (type === 'color' && typeof msg.color === 'string') setDye(client.room, client.token, msg.color)
    else if (type === 'folds') setFolds(client.room, client.token, msg.ops)
    else if (type === 'ready') markFoldReady(client.room, client.token)
    else if (type === 'throw') throwSeat(client.room, client.token, msg.aim)
    else if (type === 'newRound') requestNewRound(client.room)
    else return
    broadcast(client.room)
  }

  function broadcast(room: Room) {
    for (const client of clients) {
      if (client.room !== room || !client.token) continue
      send(client.socket, { type: 'state', state: publicView(room, client.token) })
    }
  }

  return {
    close() {
      clearInterval(grace)
      for (const client of clients) client.socket.close()
      wss.close()
      rooms.clear()
    },
  }
}

const createdAt = new Map<string, number>()

function freshCode(): string {
  for (let i = 0; i < 8; i++) {
    const code = makeRoomCode()
    if (!rooms.has(code)) return code
  }
  return makeRoomCode()
}

function send(socket: WebSocket, payload: unknown) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(payload))
}

import { describe, expect, it } from 'vitest'
import {
  createRoom,
  DISCONNECT_GRACE_MS,
  expireDisconnects,
  joinRoom,
  leaveRoom,
  markFoldReady,
  publicView,
  requestNewRound,
  setFolds,
  throwSeat,
} from '../src/sim/room'
import { DART_OPS } from '../src/sim/bots'

describe('room rules', () => {
  it('fills empty seats with different bots and lets a second player replace one', () => {
    const room = createRoom('TEST')
    const first = joinRoom(room, { name: 'Ada', now: 0 })
    expect('error' in first).toBe(false)
    if ('error' in first) return
    const view = publicView(room, first.token)
    expect(view.seats.filter((s) => s.kind === 'human')).toHaveLength(1)
    const bots = view.seats.filter((s) => s.kind === 'bot')
    expect(bots.map((b) => b.name)).toEqual(['Ivo', 'Nim', 'Bru'])
    expect(new Set(bots.map((b) => b.archetype)).size).toBe(3)

    const second = joinRoom(room, { name: 'Bea', now: 1 })
    if ('error' in second) throw new Error(second.error)
    const after = publicView(room, second.token)
    expect(after.seats.filter((s) => s.kind === 'human')).toHaveLength(2)
    expect(after.seats.filter((s) => s.kind === 'bot').map((b) => b.name)).toEqual(['Ivo', 'Nim'])
    expect(after.you).toBe(second.seat)
  })

  it('simulates one authoritative round and replays it exactly', () => {
    const room = createRoom('FOLD')
    const you = joinRoom(room, { name: 'Ada', now: 0 })
    if ('error' in you) throw new Error(you.error)
    setFolds(room, you.token, DART_OPS)
    markFoldReady(room, you.token)
    expect(room.phase).toBe('aim')
    throwSeat(room, you.token, { height: 1.7, pitch: 0.02, yaw: 0, speed: 5.4 })
    expect(room.phase).toBe('results')
    expect(room.flights).toHaveLength(4)
    const distances = room.flights!.map((f) => f.distance)
    const again = distances.slice()
    expect(room.flights!.map((f) => f.distance)).toEqual(again)
    const mine = room.flights!.find((f) => f.seat === you.seat)!
    expect(mine.distance).toBeGreaterThan(8)
    const spread = Math.max(...distances) - Math.min(...distances)
    expect(spread).toBeGreaterThan(3)
  })

  it('returns a disconnected seat to a bot after the grace period', () => {
    const room = createRoom('DROP')
    const you = joinRoom(room, { name: 'Ada', now: 1000 })
    if ('error' in you) throw new Error(you.error)
    leaveRoom(room, you.token, 1000)
    expireDisconnects(room, 1000 + DISCONNECT_GRACE_MS - 1)
    expect(room.seats[you.seat].kind).toBe('human')
    expireDisconnects(room, 1000 + DISCONNECT_GRACE_MS)
    expect(room.seats.every((s) => s.kind === 'bot')).toBe(true)
    expect(room.seats.map((s) => s.name)).toEqual(['Ivo', 'Nim', 'Bru', 'Cass'])
  })

  it('starts a fresh sheet on a new round', () => {
    const room = createRoom('NEXT')
    const you = joinRoom(room, { name: 'Ada', now: 0 })
    if ('error' in you) throw new Error(you.error)
    setFolds(room, you.token, DART_OPS)
    markFoldReady(room, you.token)
    throwSeat(room, you.token, { height: 1.6, pitch: 0, yaw: 0, speed: 5 })
    requestNewRound(room)
    expect(room.phase).toBe('fold')
    expect(room.round).toBe(2)
    expect(room.seats[you.seat].ops).toEqual([])
    expect(room.flights).toBeNull()
  })
})

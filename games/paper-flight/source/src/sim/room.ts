/**
 * Authoritative room. Fold lists and aim numbers go in; the server replays
 * the same geometry and flight code the client uses, so a result does not
 * depend on which browser threw.
 */

import { LANES, LIMITS, releaseHeight, SHEET } from './constants'
import { DYES, dyeById } from './dyes'
import { BOT_FILL, archetypeById, type ArchetypeId } from './bots'
import { applyOps, netFolds, sanitizeOps, type SheetStep } from './geometry'
import { DEFAULT_STOCK, scaleFoldOp, stockById, STOCKS } from './stock'
import { simulateFlight, type FlightResult, type Launch } from './flight'
import { deriveShape } from './shape'

export type Phase = 'fold' | 'aim' | 'fly' | 'results'

export interface AimInput {
  height: number
  pitch: number
  yaw: number
  speed: number
}

export interface PublicFlight {
  seat: number
  distance: number
  duration: number
  tumbled: boolean
  samples: number[][]
}

export interface PublicSeat {
  index: number
  name: string
  kind: 'human' | 'bot'
  archetype: ArchetypeId | null
  /** Ink, for names and the aim mark. */
  color: string
  /** Sheet color, kept from the fold through the landing. */
  paper: string
  dye: string
  dyeName: string
  connected: boolean
  ready: boolean
  ops: SheetStep[]
  aim: AimInput | null
  you: boolean
  waiting: boolean
}

export interface PublicRoom {
  code: string
  phase: Phase
  round: number
  you: number
  seats: PublicSeat[]
  flights: PublicFlight[] | null
  note: string | null
  stock: string
}

interface Seat {
  token: string | null
  name: string
  kind: 'human' | 'bot'
  archetype: ArchetypeId | null
  dye: string
  connected: boolean
  ready: boolean
  ops: SheetStep[]
  aim: AimInput | null
  disconnectAt: number | null
  /** Human joined after this round was already in the air or on the board. */
  waiting: boolean
}

export interface Room {
  code: string
  round: number
  phase: Phase
  seats: Seat[]
  flights: PublicFlight[] | null
  note: string | null
  stockId: string
}

export const DISCONNECT_GRACE_MS = 12_000

export function createRoom(code: string): Room {
  const room: Room = {
    code,
    round: 1,
    phase: 'fold',
    seats: [],
    flights: null,
    note: null,
    stockId: DEFAULT_STOCK.id,
  }
  for (let i = 0; i < 4; i++) {
    const seat = emptyBot()
    seat.dye = DYES[i].id
    room.seats.push(seat)
  }
  assignBotCast(room)
  return room
}

function emptyBot(): Seat {
  return {
    token: null,
    name: 'Bot',
    kind: 'bot',
    archetype: null,
    dye: DYES[0].id,
    connected: true,
    ready: true,
    ops: [],
    aim: null,
    disconnectAt: null,
    waiting: false,
  }
}

/** Bots currently in the room, in seat order, draw Ivo then Nim, Bru, and Cass. */
function assignBotCast(room: Room) {
  let n = 0
  for (const seat of room.seats) {
    if (seat.kind !== 'bot') continue
    const id = BOT_FILL[n++] ?? 'cass'
    const bot = archetypeById(id)
    const locked =
      room.phase === 'fly' ||
      room.phase === 'results' ||
      (room.phase === 'aim' && seat.ready && seat.aim !== null)
    seat.archetype = id
    seat.token = null
    seat.connected = true
    seat.disconnectAt = null
    seat.kind = 'bot'
    if (locked) continue
    seat.name = bot.name
    const stock = stockById(room.stockId)
    seat.ops = bot.ops.map((op) => scaleFoldOp(op, SHEET, stock))
    seat.aim = room.phase === 'aim' ? { ...bot.aim } : null
    seat.ready = true
    seat.waiting = false
  }
}

export function publicView(room: Room, token: string | null): PublicRoom {
  const you = room.seats.findIndex((s) => s.token === token)
  return {
    code: room.code,
    phase: room.phase,
    round: room.round,
    you,
    note: room.note,
    flights: room.flights,
    stock: room.stockId,
    seats: room.seats.map((s, index) => ({
      index,
      name: s.name,
      kind: s.kind,
      archetype: s.archetype,
      color: dyeById(s.dye).ink,
      paper: dyeById(s.dye).paper,
      dye: dyeById(s.dye).id,
      dyeName: dyeById(s.dye).name,
      connected: s.connected,
      ready: s.ready,
      ops: s.ops,
      aim: s.aim,
      you: s.token === token && token !== null,
      waiting: s.waiting,
    })),
  }
}

export function joinRoom(
  room: Room,
  input: { token?: string | null; name?: string | null; now: number },
): { token: string; seat: number; createdToken: boolean } | { error: string } {
  const token = (input.token || '').slice(0, 40)
  if (token) {
    const existing = room.seats.findIndex((s) => s.token === token)
    if (existing >= 0) {
      const seat = room.seats[existing]
      seat.connected = true
      seat.disconnectAt = null
      seat.kind = 'human'
      if (input.name) seat.name = cleanName(input.name)
      return { token, seat: existing, createdToken: false }
    }
  }
  const open = room.seats.findIndex((s) => s.kind === 'bot')
  if (open < 0) return { error: 'All four seats are taken.' }
  const fresh = !token || token.length < 8 ? randomToken() : token
  const seat = room.seats[open]
  seat.token = fresh
  seat.kind = 'human'
  seat.archetype = null
  seat.name = cleanName(input.name || 'Guest')
  seat.connected = true
  seat.disconnectAt = null
  if (room.phase === 'fold') {
    seat.ops = []
    seat.aim = null
    seat.ready = false
    seat.waiting = false
  } else if (room.phase === 'aim') {
    // Inherit the sheet that was already folded for this seat and throw it.
    seat.ready = false
    seat.waiting = false
    seat.aim = null
  } else {
    seat.waiting = true
    seat.ready = true
  }
  room.note = null
  if (room.phase === 'fold') assignBotCast(room)
  return { token: fresh, seat: open, createdToken: true }
}

export function leaveRoom(room: Room, token: string, now: number) {
  const seat = room.seats.find((s) => s.token === token)
  if (!seat) return
  seat.connected = false
  seat.disconnectAt = now
}

export function expireDisconnects(room: Room, now: number) {
  let changed = false
  for (const seat of room.seats) {
    if (seat.kind === 'human' && !seat.connected && seat.disconnectAt !== null) {
      if (now - seat.disconnectAt >= DISCONNECT_GRACE_MS) {
        changed = true
        const keepSubmission = room.phase === 'fly' || room.phase === 'results' || (room.phase === 'aim' && seat.ready)
        const ops = seat.ops
        const aim = seat.aim
        const ready = seat.ready
        const name = seat.name
        const dye = seat.dye
        Object.assign(seat, emptyBot())
        seat.dye = dye
        if (keepSubmission) {
          seat.ops = ops
          seat.aim = aim
          seat.ready = ready
          seat.name = name
        }
      }
    }
  }
  if (changed) {
    assignBotCast(room)
    maybeAdvance(room)
  }
}

export function setDye(room: Room, token: string, dyeId: string) {
  const seat = room.seats.find((s) => s.token === token && s.kind === 'human')
  if (!seat) return
  const dye = DYES.find((item) => item.id === dyeId)
  if (!dye) return
  if (room.seats.some((other) => other !== seat && other.dye === dye.id)) return
  seat.dye = dye.id
}

export function renameSeat(room: Room, token: string, name: string) {
  const seat = room.seats.find((s) => s.token === token)
  if (!seat || seat.kind !== 'human') return
  seat.name = cleanName(name)
}

export function setStock(room: Room, token: string, stockId: string) {
  if (!STOCKS.some((item) => item.id === stockId) || room.phase !== 'fold') return
  const seat = room.seats.find((s) => s.token === token && s.kind === 'human')
  if (!seat || seat.waiting || netFolds(seat.ops) > 0) return
  if (room.seats.some((other) => other !== seat && other.kind === 'human' && netFolds(other.ops) > 0)) return
  room.stockId = stockId
  assignBotCast(room)
}

/** Clears this player's folds and switches stock. Does not run just because a control changed. */
export function newSheet(room: Room, token: string, stockId: string) {
  if (!STOCKS.some((item) => item.id === stockId) || room.phase !== 'fold') return
  const seat = room.seats.find((s) => s.token === token && s.kind === 'human')
  if (!seat || seat.waiting) return
  if (room.seats.some((other) => other !== seat && other.kind === 'human' && netFolds(other.ops) > 0)) return
  room.stockId = stockId
  seat.ops = []
  seat.ready = false
  seat.aim = null
  assignBotCast(room)
}

export function setFolds(room: Room, token: string, ops: unknown) {
  const seat = room.seats.find((s) => s.token === token)
  if (!seat || room.phase !== 'fold' || seat.waiting) return
  seat.ops = sanitizeOps(ops)
  seat.ready = false
}

export function markFoldReady(room: Room, token: string) {
  const seat = room.seats.find((s) => s.token === token)
  if (!seat || room.phase !== 'fold') return
  seat.ready = true
  seat.ops = sanitizeOps(seat.ops)
  maybeAdvance(room)
}

export function throwSeat(room: Room, token: string, aim: unknown) {
  const seat = room.seats.find((s) => s.token === token)
  if (!seat || room.phase !== 'aim' || seat.waiting) return
  seat.aim = clampThrow(sanitizeAim(aim))
  seat.ready = true
  maybeAdvance(room)
}

export function requestNewRound(room: Room) {
  if (room.phase !== 'results' && room.phase !== 'fly') return
  beginRound(room)
}

function beginRound(room: Room) {
  room.round += 1
  room.phase = 'fold'
  room.flights = null
  room.note = null
  for (const seat of room.seats) {
    seat.waiting = false
    seat.aim = null
    if (seat.kind === 'human') {
      seat.ops = []
      seat.ready = false
    }
  }
  assignBotCast(room)
}

function maybeAdvance(room: Room) {
  if (room.phase === 'fold') {
    if (!room.seats.some((s) => s.kind === 'human')) return
    if (!room.seats.every((s) => s.ready)) return
    room.phase = 'aim'
    room.note = null
    for (const seat of room.seats) {
      if (seat.kind === 'bot' && seat.archetype) {
        seat.aim = { ...archetypeById(seat.archetype).aim }
        seat.ready = true
      } else if (!seat.waiting) {
        seat.ready = false
        seat.aim = null
      }
    }
    if (room.seats.every((s) => s.ready && s.aim)) launch(room)
    return
  }
  if (room.phase === 'aim') {
    if (!room.seats.every((s) => s.ready && s.aim)) return
    launch(room)
  }
}

function launch(room: Room) {
  room.phase = 'fly'
  room.flights = room.seats.map((seat, index) => {
    const aim = clampThrow(seat.aim ?? { height: 0.55, pitch: 0, yaw: 0, speed: 5 })
    const launchAim: Launch = {
      x: 0.06,
      y: LANES[index],
      z: releaseHeight(aim.height),
      pitch: aim.pitch,
      yaw: aim.yaw,
      speed: aim.speed,
    }
    const result: FlightResult = simulateFlight(deriveShape(applyOps(seat.ops, stockById(room.stockId))), launchAim)
    return {
      seat: index,
      distance: result.distance,
      duration: result.duration,
      tumbled: result.tumbled,
      samples: result.samples,
    }
  })
  room.phase = 'results'
}

function clampThrow(aim: AimInput): AimInput {
  return {
    height: clampNum(aim.height, 0.55, LIMITS.minHeight, LIMITS.maxHeight),
    pitch: clampNum(aim.pitch, 0.04, LIMITS.minPitch, LIMITS.maxPitch),
    yaw: clampNum(aim.yaw, 0, -LIMITS.maxYaw, LIMITS.maxYaw),
    speed: clampNum(aim.speed, 5.5, LIMITS.minSpeed, LIMITS.maxSpeed),
  }
}

function clampNum(value: number, fallback: number, lo: number, hi: number) {
  const n = Number.isFinite(value) ? value : fallback
  return Math.max(lo, Math.min(hi, n))
}

function sanitizeAim(input: unknown): AimInput {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  return {
    height: Number(o.height),
    pitch: Number(o.pitch),
    yaw: Number(o.yaw),
    speed: Number(o.speed),
  }
}

export function cleanName(name: string): string {
  const trimmed = name.replace(/\s+/g, ' ').replace(/[^\p{L}\p{N} '\-]/gu, '').trim()
  return (trimmed || 'Guest').slice(0, 16)
}

function randomToken(): string {
  const bytes = new Uint8Array(12)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function makeRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const bytes = new Uint8Array(4)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  for (const b of bytes) code += alphabet[b % alphabet.length]
  return code
}

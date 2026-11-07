/**
 * Same room, fold, and flight code as the WebSocket server, run in the page.
 * Used when no room server answers. One human seat, three bots.
 */

import {
  createRoom,
  joinRoom,
  markFoldReady,
  publicView,
  renameSeat,
  requestNewRound,
  setDye,
  setFolds,
  throwSeat,
  type PublicRoom,
  type Room,
} from './sim/room'

export interface SoloSession {
  room: Room
  token: string
  view: PublicRoom
}

/**
 * Localhost is the optional Node server. Any other host, including GitHub Pages,
 * has no room socket, so the page should not open one.
 * `?online=1` or `?room=` asks for that socket on purpose.
 */
export function shouldTrySocket(here: { hostname: string; search: string }): boolean {
  const host = here.hostname.replace(/^\[|\]$/g, '')
  const local = host === 'localhost' || host === '127.0.0.1' || host === '::1'
  const params = new URLSearchParams(here.search)
  if (params.get('solo') === '1') return false
  return local || params.has('online') || params.has('room')
}

export function openSolo(name: string): SoloSession | { error: string } {
  const room = createRoom('SOLO')
  const joined = joinRoom(room, { name, now: Date.now() })
  if ('error' in joined) return joined
  return { room, token: joined.token, view: publicView(room, joined.token) }
}

/** Applies one client message the way server/sockets.ts does, then returns the public view. */
export function applySolo(session: SoloSession, msg: Record<string, unknown>): PublicRoom {
  const { room, token } = session
  const type = msg.type
  if (type === 'rename' && typeof msg.name === 'string') renameSeat(room, token, msg.name)
  else if (type === 'color' && typeof msg.color === 'string') setDye(room, token, msg.color)
  else if (type === 'folds') setFolds(room, token, msg.ops)
  else if (type === 'ready') markFoldReady(room, token)
  else if (type === 'throw') throwSeat(room, token, msg.aim)
  else if (type === 'newRound') requestNewRound(room)
  session.view = publicView(room, token)
  return session.view
}

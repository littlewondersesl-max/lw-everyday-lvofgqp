import { describe, expect, it } from 'vitest'
import { DART_OPS } from '../src/sim/bots'
import { releaseHeight } from '../src/sim/constants'
import { applySolo, openSolo, shouldTrySocket } from '../src/solo'

describe('solo page', () => {
  it('does not look for a socket on a static host', () => {
    expect(shouldTrySocket({ hostname: 'littlewondersesl-max.github.io', search: '' })).toBe(false)
    expect(shouldTrySocket({ hostname: '127.0.0.1', search: '' })).toBe(true)
    expect(shouldTrySocket({ hostname: '127.0.0.1', search: '?solo=1' })).toBe(false)
    expect(shouldTrySocket({ hostname: 'example.com', search: '?online=1' })).toBe(true)
    expect(shouldTrySocket({ hostname: 'example.com', search: '?room=ABCD' })).toBe(true)
  })

  it('runs one human and three different bots through the same round code', () => {
    const opened = openSolo('Pip')
    if ('error' in opened) throw new Error(opened.error)
    expect(opened.view.code).toBe('SOLO')
    expect(opened.view.seats.filter((seat) => seat.kind === 'human')).toHaveLength(1)
    expect(opened.view.seats.filter((seat) => seat.kind === 'bot').map((seat) => seat.name)).toEqual(['Ivo', 'Nim', 'Bru'])
    expect(new Set(opened.view.seats.map((seat) => seat.archetype)).size).toBe(4)
    expect(new Set(opened.view.seats.map((seat) => seat.paper)).size).toBe(4)

    applySolo(opened, { type: 'folds', ops: DART_OPS })
    applySolo(opened, { type: 'ready' })
    expect(opened.view.phase).toBe('aim')
    applySolo(opened, { type: 'throw', aim: { height: 0.55, pitch: 0.02, yaw: 0, speed: 5.4 } })
    expect(opened.view.phase).toBe('results')
    expect(opened.view.flights).toHaveLength(4)
    const mine = opened.view.flights!.find((flight) => flight.seat === opened.view.you)!
    expect(mine.samples[0][3]).toBeCloseTo(releaseHeight(0.55), 1)
    expect(mine.distance).toBeGreaterThan(1)
    const spread = Math.max(...opened.view.flights!.map((flight) => flight.distance)) - Math.min(...opened.view.flights!.map((flight) => flight.distance))
    expect(spread).toBeGreaterThan(1)
  })
})

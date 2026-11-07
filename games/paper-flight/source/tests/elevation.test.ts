import { describe, expect, it } from 'vitest'
import { ARCHETYPES } from '../src/sim/bots'
import { HALL, releaseHeight } from '../src/sim/constants'
import { applyOps, blankSheet } from '../src/sim/geometry'
import { simulateFlight } from '../src/sim/flight'
import { deriveShape } from '../src/sim/shape'
import { createRoom, joinRoom, publicView, throwSeat, markFoldReady, setFolds } from '../src/sim/room'

describe('platform elevation', () => {
  it('places the deck at the start of the upper third', () => {
    expect(HALL.ledgeHeight / HALL.height).toBeCloseTo(2 / 3, 5)
    expect(HALL.ledgeHeight).toBeGreaterThan(HALL.height / 2)
    expect(HALL.height - HALL.ledgeHeight).toBeCloseTo(HALL.height / 3, 5)
  })

  it('releases at deck height plus hand height, then lands on the hall floor', () => {
    const hand = 0.55
    const z = releaseHeight(hand)
    expect(z).toBeCloseTo(HALL.ledgeHeight + hand, 8)
    const shape = deriveShape(applyOps(ARCHETYPES[0].ops))
    const flight = simulateFlight(shape, {
      x: 0.2,
      y: 0,
      z,
      pitch: 0.02,
      yaw: 0,
      speed: 5.4,
    })
    expect(flight.samples[0][3]).toBeGreaterThan(HALL.ledgeHeight)
    expect(flight.samples[0][3]).toBeLessThan(HALL.height)
    expect(flight.samples.at(-1)![3]).toBeLessThan(0.25)
    expect(flight.distance).toBeGreaterThan(1)
  })

  it('treats the deck as the ground while still over the platform', () => {
    const shape = deriveShape(blankSheet())
    const flight = simulateFlight(
      shape,
      {
        x: -0.9,
        y: 0,
        z: releaseHeight(0.35),
        pitch: 0,
        yaw: 0,
        speed: 0,
      },
      { unclamped: true },
    )
    const landed = flight.samples.at(-1)!
    expect(landed[1]).toBeLessThan(0.15)
    expect(landed[3]).toBeGreaterThan(HALL.ledgeHeight - 0.05)
    expect(landed[3]).toBeLessThan(HALL.ledgeHeight + 0.35)
  })

  it('uses the same release height for a networked throw', () => {
    const room = createRoom('HIGH')
    const you = joinRoom(room, { name: 'Ada', now: 0 })
    if ('error' in you) throw new Error(you.error)
    setFolds(room, you.token, [])
    markFoldReady(room, you.token)
    throwSeat(room, you.token, { height: 0.5, pitch: 0, yaw: 0, speed: 4 })
    const mine = room.flights!.find((flight) => flight.seat === you.seat)!
    expect(mine.samples[0][3]).toBeCloseTo(releaseHeight(0.5), 1)
    expect(mine.samples.at(-1)![3]).toBeLessThan(0.3)
    const view = publicView(room, you.token)
    expect(view.seats.map((seat) => seat.paper).length).toBe(4)
  })
})

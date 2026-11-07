import { describe, expect, it } from 'vitest'
import { ARCHETYPES } from '../src/sim/bots'
import { applyOps, blankSheet } from '../src/sim/geometry'
import { deriveShape } from '../src/sim/shape'
import { aeroProfile, simulateFlight } from '../src/sim/flight'
import { HALL, LANES, releaseHeight } from '../src/sim/constants'

function fly(id: string, y = 0) {
  const bot = ARCHETYPES.find((a) => a.id === id)!
  const shape = deriveShape(applyOps(bot.ops))
  return simulateFlight(
    shape,
    {
      x: 0.06,
      y,
      z: releaseHeight(bot.aim.height),
      pitch: bot.aim.pitch,
      yaw: bot.aim.yaw,
      speed: bot.aim.speed,
    },
    { trace: true },
  )
}

describe('flight model', () => {
  it('is deterministic', () => {
    const a = fly('ivo')
    const b = fly('ivo')
    expect(a.distance).toBe(b.distance)
    expect(a.samples).toEqual(b.samples)
  })

  it('gives a folded dart a real glide and a blank sheet a short drop', () => {
    const ivo = fly('ivo')
    const blank = simulateFlight(deriveShape(blankSheet()), {
      x: 0.06,
      y: 0,
      z: releaseHeight(ARCHETYPES[0].aim.height),
      pitch: ARCHETYPES[0].aim.pitch,
      yaw: ARCHETYPES[0].aim.yaw,
      speed: ARCHETYPES[0].aim.speed,
    })
    const shape = deriveShape(applyOps(ARCHETYPES[0].ops))
    const profile = aeroProfile(shape)
    expect(profile.stable).toBe(true)
    expect(profile.clTrim).toBeGreaterThan(0.05)
    expect(ivo.tumbled).toBe(false)
    expect(ivo.distance).toBeGreaterThan(8)
    expect(ivo.distance).toBeLessThan(HALL.length)
    expect(ivo.distance).toBeGreaterThan(blank.distance + 4)
    expect(blank.distance).toBeLessThan(5)
  })

  it('separates the four archetypes under their own throws', () => {
    const results = Object.fromEntries(ARCHETYPES.map((bot) => [bot.id, fly(bot.id)]))
    expect(results.ivo.distance).toBeGreaterThan(results.nim.distance + 1.2)
    expect(results.ivo.distance).toBeGreaterThan(results.bru.distance + 2)
    expect(results.nim.distance).toBeGreaterThan(results.cass.distance)
    expect(results.bru.tumbled || results.bru.distance < results.ivo.distance - 2).toBe(true)
    expect(results.cass.distance).toBeLessThan(results.ivo.distance - 3)
    // Same launch point, different lanes, still finite and inside a long hall.
    for (const [index, bot] of ARCHETYPES.entries()) {
      const flown = simulateFlight(deriveShape(applyOps(bot.ops)), {
        x: 0.06,
        y: LANES[index],
        z: releaseHeight(bot.aim.height),
        pitch: bot.aim.pitch,
        yaw: bot.aim.yaw,
        speed: bot.aim.speed,
      })
      expect(Number.isFinite(flown.distance)).toBe(true)
      expect(flown.samples.length).toBeGreaterThan(5)
      expect(flown.samples.every((s) => s.every((n) => Number.isFinite(n)))).toBe(true)
    }
  })

  it('stays up longer than a vacuum throw of the same dart', () => {
    const bot = ARCHETYPES[0]
    const shape = deriveShape(applyOps(bot.ops))
    const launch = {
      x: 0.06,
      y: 0,
      z: releaseHeight(bot.aim.height),
      pitch: bot.aim.pitch,
      yaw: bot.aim.yaw,
      speed: bot.aim.speed,
    }
    const glide = simulateFlight(shape, launch)
    const vacuum = simulateFlight(shape, launch, { aero: false })
    expect(glide.duration).toBeGreaterThan(vacuum.duration + 0.4)
  })

  it('falls under gravity from a standstill and does not invent speed', () => {
    const shape = deriveShape(blankSheet())
    const dropped = simulateFlight(
      shape,
      { x: 0.2, y: 0, z: 1.6, pitch: 0, yaw: 0, speed: 0 },
      { unclamped: true, trace: true },
    )
    expect(dropped.distance).toBeLessThan(0.6)
    expect(dropped.duration).toBeGreaterThan(0.35)
    expect(dropped.duration).toBeLessThan(4)
    const early = dropped.trace?.[0]
    expect(early).toBeTruthy()
    // First trace is ~50 ms in. A pure drop has fallen about 1 cm and is moving downward.
    expect(early!.z).toBeLessThan(1.6)
    expect(early!.z).toBeGreaterThan(1.4)
  })
})

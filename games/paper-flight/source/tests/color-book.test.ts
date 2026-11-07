import { describe, expect, it } from 'vitest'
import { DYES, dyeById } from '../src/sim/dyes'
import { applyOps, blankSheet, buildFold, layersAt, materialArea } from '../src/sim/geometry'
import { RECIPES } from '../src/sim/recipes'
import {
  createRoom,
  joinRoom,
  markFoldReady,
  publicView,
  requestNewRound,
  setDye,
  setFolds,
  throwSeat,
} from '../src/sim/room'
import { DART_OPS } from '../src/sim/bots'

describe('sheet colors', () => {
  it('gives every seat a different dye and keeps a chosen one', () => {
    const room = createRoom('DYES')
    const you = joinRoom(room, { name: 'Ada', now: 0 })
    if ('error' in you) throw new Error(you.error)
    const dyes = room.seats.map((seat) => seat.dye)
    expect(new Set(dyes).size).toBe(4)
    expect(dyes.every((id) => DYES.some((dye) => dye.id === id))).toBe(true)

    setDye(room, you.token, 'sea')
    expect(room.seats[you.seat].dye).toBe('sea')
    const taken = room.seats.find((seat) => seat.kind === 'bot')!.dye
    setDye(room, you.token, taken)
    expect(room.seats[you.seat].dye).toBe('sea')

    const view = publicView(room, you.token)
    const mine = view.seats[you.seat]
    expect(mine.paper).toBe(dyeById('sea').paper)
    expect(mine.color).toBe(dyeById('sea').ink)
    expect(mine.dyeName).toBe('Sea')
    expect(new Set(view.seats.map((seat) => seat.paper)).size).toBe(4)

    setFolds(room, you.token, DART_OPS)
    markFoldReady(room, you.token)
    throwSeat(room, you.token, { height: 1.6, pitch: 0.02, yaw: 0, speed: 5.4 })
    requestNewRound(room)
    expect(room.phase).toBe('fold')
    expect(room.seats[you.seat].dye).toBe('sea')
    expect(room.seats[you.seat].ops).toEqual([])
  })
})

describe('book recipes', () => {
  it('reproduces every recipe with the real folder and keeps the paper', () => {
    const original = materialArea(blankSheet())
    for (const recipe of RECIPES) {
      let paper = blankSheet()
      for (const step of recipe.steps) {
        const built = buildFold(paper, step.op)
        expect(built.valid, `${recipe.id} ${step.title}`).toBe(true)
        paper = built.paper
      }
      expect(Math.abs(materialArea(paper) - original) / original).toBeLessThan(1e-8)
      expect(applyOps(recipe.steps.map((step) => step.op)).facets.length).toBeGreaterThan(1)
    }
  })

  it('makes a short hat and a layered envelope, not a second dart', () => {
    const hat = RECIPES.find((recipe) => recipe.id === 'hat')!
    const envelope = RECIPES.find((recipe) => recipe.id === 'envelope')!
    const hatPaper = applyOps(hat.steps.map((step) => step.op))
    const ys = hatPaper.facets.flatMap((facet) => facet.poly.map((point) => point.y))
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.12)
    const env = applyOps(envelope.steps.map((step) => step.op))
    expect(layersAt(env, 0, 0)).toBeGreaterThanOrEqual(1)
    expect(env.facets.some((facet) => facet.layer >= 1)).toBe(true)
  })
})

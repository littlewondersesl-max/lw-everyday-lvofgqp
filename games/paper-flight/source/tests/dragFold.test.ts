import { describe, expect, it } from 'vitest'
import { DART_OPS } from '../src/sim/bots'
import { SHEET } from '../src/sim/constants'
import {
  aimAngle,
  coverSamples,
  creaseAtDepth,
  depthFromDrag,
  depthOf,
  edgeDepth,
  flapMoved,
  foldOpForDrag,
  previewFold,
  reflectFold,
  ridgeOf,
  sampleRidge,
  type Guide,
} from '../src/sim/dragFold'
import { applyOps, blankSheet, lineFrame, materialArea, reflectPoint } from '../src/sim/geometry'

const guide: Guide = { angle: 0.7, ax: 0.01, ay: 0.04, movingSign: 1 }

describe('drag fold', () => {
  it('tilts the fold when the same corner is dragged up instead of down', () => {
    const paper = blankSheet()
    const area = materialArea(paper)
    const corner = { x: -SHEET.width / 2, y: SHEET.height / 2 }
    const lower = { x: corner.x, y: corner.y - 0.05 }
    const upCursor = { x: corner.x + 0.055, y: corner.y - 0.012 }
    const downCursor = { x: corner.x + 0.055, y: corner.y - 0.07 }
    const up = reflectFold(paper, corner, upCursor)
    const down = reflectFold(paper, corner, downCursor)
    expect(up && down).toBeTruthy()
    expect(materialArea(up!.paper)).toBeCloseTo(area, 6)
    expect(materialArea(down!.paper)).toBeCloseTo(area, 6)
    const upOp = foldOpForDrag(corner, upCursor)!
    const downOp = foldOpForDrag(corner, downCursor)!
    const tilt = Math.atan2(Math.sin(upOp.angle - downOp.angle), Math.cos(upOp.angle - downOp.angle))
    expect(Math.abs(tilt)).toBeGreaterThan(0.15)
    const upLower = reflectPoint(lower, lineFrame(upOp.angle, upOp.ax, upOp.ay))
    const downLower = reflectPoint(lower, lineFrame(downOp.angle, downOp.ax, downOp.ay))
    expect(Math.hypot(upLower.x - downLower.x, upLower.y - downLower.y)).toBeGreaterThan(0.01)
    const landed = reflectPoint(corner, lineFrame(upOp.angle, upOp.ax, upOp.ay))
    expect(landed.x).toBeCloseTo(upCursor.x, 5)
    expect(landed.y).toBeCloseTo(upCursor.y, 5)
  })

  it('folds the opposite edge when that edge is the one grabbed', () => {
    const paper = blankSheet()
    const bottom = { x: 0, y: -SHEET.height / 2 }
    const folded = reflectFold(paper, bottom, { x: 0.01, y: bottom.y + 0.06 })
    expect(folded).toBeTruthy()
    expect(Math.min(...folded!.paper.facets.flatMap((facet) => facet.poly.map((p) => p.y)))).toBeGreaterThan(bottom.y + 0.01)
    expect(foldOpForDrag(bottom, { x: bottom.x, y: bottom.y + 0.001 })).toBeNull()
  })

  it('turns the ruler through the 180 degree wrap in small steps', () => {
    const hub = { x: 0, y: 0 }
    let angle = Math.PI - 0.04
    for (let i = 0; i < 8; i++) {
      const next = angle + 0.02
      const pointer = { x: Math.cos(next) * 0.03, y: Math.sin(next) * 0.03 }
      const updated = aimAngle(angle, hub, pointer)
      expect(Math.abs(updated - angle)).toBeLessThan(0.05)
      expect(updated).toBeGreaterThan(angle)
      angle = updated
    }
    expect(angle).toBeGreaterThan(Math.PI)
    expect(aimAngle(1.2, hub, { x: 0, y: 0 })).toBe(1.2)
  })

  it('does not treat the guide itself as a crease when the drag stops short', () => {
    const paper = blankSheet()
    const edge = edgeDepth(paper, guide)
    const grab = edge * 0.92
    const stopped = depthFromDrag(grab, grab * 0.45)
    expect(stopped).toBeGreaterThan(0.01)
    expect(stopped).toBeLessThan(grab)
    expect(flapMoved(grab, stopped)).toBe(true)
    const early = creaseAtDepth(guide, stopped)
    const full = creaseAtDepth(guide, 0)
    expect(Math.hypot(early.ax - full.ax, early.ay - full.ay)).toBeGreaterThan(0.008)
    const earlyPaper = previewFold(paper, guide, stopped)
    const fullPaper = previewFold(paper, guide, 0)
    expect(earlyPaper && fullPaper).toBeTruthy()
    expect(materialArea(earlyPaper!.paper)).toBeCloseTo(materialArea(paper), 6)
    const earlyMax = Math.max(...earlyPaper!.paper.facets.flatMap((facet) => facet.poly.map((p) => depthOf(p, guide))))
    const fullMax = Math.max(...fullPaper!.paper.facets.flatMap((facet) => facet.poly.map((p) => depthOf(p, guide))))
    expect(earlyMax).toBeGreaterThan(fullMax + 0.005)
  })

  it('folds the house tip on a ridge short of a horizontal limit and keeps the corner folds', () => {
    const house = applyOps([DART_OPS[0], DART_OPS[1]])
    const limit: Guide = { angle: 0, ax: 0, ay: SHEET.height / 2 - 0.055, movingSign: 1 }
    const tip = { x: 0, y: SHEET.height / 2 }
    const grab = depthOf(tip, limit)
    expect(grab).toBeGreaterThan(0.02)
    const stopped = depthFromDrag(grab, grab * 0.35)
    expect(stopped).toBeGreaterThan(0)
    const folded = previewFold(house, limit, stopped)
    expect(folded).toBeTruthy()
    expect(materialArea(folded!.paper)).toBeCloseTo(SHEET.width * SHEET.height, 5)
    expect(folded!.paper.facets.some((facet) => facet.layer >= 1)).toBe(true)
    const ridge = ridgeOf(folded!.paper, folded!.op)
    expect(ridge).toBeTruthy()
    const samples = sampleRidge(ridge!)
    const covered = samples.map(() => false)
    const dab = coverSamples(samples, covered, samples[0], 0.008)
    expect(dab).toBeLessThan(0.72)
    for (const sample of samples) coverSamples(samples, covered, sample, 0.008)
    expect(covered.every(Boolean)).toBe(true)
  })
})

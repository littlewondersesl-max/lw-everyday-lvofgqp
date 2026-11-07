import { describe, expect, it } from 'vitest'
import { DART_OPS } from '../src/sim/bots'
import { SHEET } from '../src/sim/constants'
import {
  coverSamples,
  creaseAtDepth,
  depthFromDrag,
  depthOf,
  edgeDepth,
  flapMoved,
  previewFold,
  ridgeOf,
  sampleRidge,
  type Guide,
} from '../src/sim/dragFold'
import { applyOps, materialArea, blankSheet } from '../src/sim/geometry'

const guide: Guide = { angle: 0.7, ax: 0.01, ay: 0.04, movingSign: 1 }

describe('drag fold', () => {
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

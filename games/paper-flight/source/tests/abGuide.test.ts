import { describe, expect, it } from 'vitest'
import { DART_OPS } from '../src/sim/bots'
import { SHEET } from '../src/sim/constants'
import {
  applyNodeEdit,
  assessPair,
  clearedNodes,
  edgePointsOnLine,
  guideForGrab,
  nearestSilhouette,
  removeEndpoint,
  type Endpoints,
} from '../src/sim/abGuide'
import { applyOps, blankSheet, materialArea, netFolds, openCreaseCount } from '../src/sim/geometry'
import { depthOf, previewFold } from '../src/sim/dragFold'

const both: Endpoints = {
  a: { x: -0.1, y: 0.12 },
  b: { x: 0.09, y: -0.11 },
}

describe('A and B', () => {
  it('removes only the point that was asked for', () => {
    const withoutA = removeEndpoint(both, 'a')
    expect(withoutA.a).toBeNull()
    expect(withoutA.b).toEqual(both.b)
    const withoutB = removeEndpoint(both, 'b')
    expect(withoutB.b).toBeNull()
    expect(withoutB.a).toEqual(both.a)
    expect(removeEndpoint(withoutA, 'b')).toEqual({ a: null, b: null })
  })

  it('replaces the missing point and keeps the one that stayed', () => {
    const paper = blankSheet()
    const kept = { x: 0.1, y: -SHEET.height / 2 }
    const removed = applyNodeEdit({ a: { x: -0.1, y: SHEET.height / 2 }, b: kept }, false, { type: 'remove', which: 'a' })
    expect(removed.ends.b).toEqual(kept)
    const next = { x: -SHEET.width / 2, y: 0 }
    const replaced = applyNodeEdit(removed.ends, false, { type: 'place', point: next, paper })
    expect(replaced.ends.a).toEqual(next)
    expect(replaced.ends.b).toEqual(kept)
    expect(replaced.note).toMatch(/Line set/)
  })

  it('refuses a second point that does not cut, and an interior miss is not this function', () => {
    const paper = blankSheet()
    const top = SHEET.height / 2
    const a = { x: -0.04, y: top }
    const sameEdge = applyNodeEdit({ a, b: null }, false, { type: 'place', point: { x: 0.04, y: top }, paper })
    expect(sameEdge.ends).toEqual({ a, b: null })
    expect(sameEdge.note).toMatch(/does not cut/)
    const sameSpot = applyNodeEdit({ a, b: null }, false, { type: 'place', point: { x: a.x + 0.001, y: a.y }, paper })
    expect(sameSpot.ends.b).toBeNull()
    expect(sameSpot.note).toMatch(/same spot/)
  })

  it('leaves a held flap and the sealed paper untouched', () => {
    const sealed = [DART_OPS[0]]
    const paper = applyOps(sealed)
    const area = materialArea(paper)
    const held = applyNodeEdit(both, true, { type: 'reset' })
    expect(held.ends).toEqual(both)
    expect(held.note).toMatch(/Undo the held fold/)
    const removed = applyNodeEdit(both, true, { type: 'remove', which: 'b' })
    expect(removed.ends).toEqual(both)
    const cleared = applyNodeEdit(both, false, { type: 'reset' })
    expect(cleared.ends).toEqual(clearedNodes())
    expect(netFolds(sealed)).toBe(1)
    expect(openCreaseCount(sealed)).toBe(0)
    expect(materialArea(applyOps(sealed))).toBeCloseTo(area, 8)
    expect(paper.creases.length).toBeGreaterThan(0)
  })

  it('lets either side of the line be the one that folds', () => {
    const paper = blankSheet()
    const line = { angle: 0, ax: 0, ay: 0 }
    const top = guideForGrab(line, { x: 0, y: SHEET.height / 2 })
    const bottom = guideForGrab(line, { x: 0, y: -SHEET.height / 2 })
    expect(top?.movingSign).toBe(1)
    expect(bottom?.movingSign).toBe(-1)
    const down = previewFold(paper, top!, SHEET.height / 4)
    const up = previewFold(paper, bottom!, SHEET.height / 4)
    expect(down && up).toBeTruthy()
    expect(depthOf({ x: 0, y: SHEET.height / 2 }, top!)).toBeGreaterThan(0.1)
    expect(Math.max(...down!.paper.facets.flatMap((facet) => facet.poly.map((p) => p.y)))).toBeLessThan(SHEET.height / 2 - 0.01)
    expect(Math.min(...up!.paper.facets.flatMap((facet) => facet.poly.map((p) => p.y)))).toBeGreaterThan(-SHEET.height / 2 + 0.01)
  })

  it('finds the house outline, including a line under the tip', () => {
    const house = applyOps([DART_OPS[0], DART_OPS[1]])
    const peak = nearestSilhouette(house, { x: 0, y: SHEET.height / 2 + 0.01 }, 0.04)
    expect(peak).toBeTruthy()
    expect(peak!.y).toBeGreaterThan(SHEET.height / 2 - 0.03)
    const cut = edgePointsOnLine(house, 0, 0, SHEET.height / 2 - 0.055)
    expect(cut?.a && cut.b).toBeTruthy()
    expect(assessPair(house, cut!.a!, cut!.b!).ok).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { SHEET } from '../src/sim/constants'
import { DART_OPS } from '../src/sim/bots'
import {
  applyOps,
  blankSheet,
  buildFold,
  layersAt,
  materialArea,
  polygonArea,
  suggestCrease,
  type FoldOp,
  type Paper,
} from '../src/sim/geometry'
import { deriveShape } from '../src/sim/shape'

const ORIGINAL = SHEET.width * SHEET.height

function rel(paperArea: number) {
  return Math.abs(paperArea - ORIGINAL) / ORIGINAL
}

function outline(paper: Paper) {
  return paper.facets
    .map((facet) => facet.poly.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`).join(' '))
    .sort()
    .join(';')
}

describe('paper folds', () => {
  it('starts as a single letter sheet', () => {
    const paper = blankSheet()
    expect(paper.facets).toHaveLength(1)
    expect(rel(materialArea(paper))).toBeLessThan(1e-12)
    expect(layersAt(paper, 0, 0)).toBe(1)
  })

  it('folds the smaller side and conserves area on a bisect', () => {
    const paper = blankSheet()
    const op: FoldOp = { angle: Math.PI / 2, ax: 0, ay: 0, side: 1 }
    const built = buildFold(paper, op)
    expect(built.valid).toBe(true)
    expect(built.tie).toBe(true)
    expect(built.movingSign).toBe(1)
    expect(rel(materialArea(built.paper))).toBeLessThan(1e-9)
    // Left half reflected: nothing remains on the left, two layers on the right.
    expect(layersAt(built.paper, -SHEET.width / 4, 0)).toBe(0)
    expect(layersAt(built.paper, SHEET.width / 4, 0)).toBe(2)
    const moved = built.paper.facets.find((f) => f.faceUp < 0)
    expect(moved).toBeTruthy()
    expect(built.paper.facets.every((f) => f.poly.every((p) => p.x >= -1e-8))).toBe(true)
  })

  it('lets the player choose a side when the crease splits the sheet in half', () => {
    const right = buildFold(blankSheet(), { angle: Math.PI / 2, ax: 0, ay: 0, side: -1 })
    expect(right.movingSign).toBe(-1)
    expect(layersAt(right.paper, -SHEET.width / 4, 0)).toBe(2)
    expect(layersAt(right.paper, SHEET.width / 4, 0)).toBe(0)
  })

  it('folds a corner, stacks a layer, and keeps the paper', () => {
    const built = buildFold(blankSheet(), DART_OPS[0])
    expect(built.valid).toBe(true)
    expect(built.tie).toBe(false)
    const small = Math.min(built.areaPos, built.areaNeg)
    const large = Math.max(built.areaPos, built.areaNeg)
    expect(small).toBeLessThan(large)
    expect(rel(materialArea(built.paper))).toBeLessThan(1e-9)
    expect(built.paper.facets.some((f) => f.layer >= 1)).toBe(true)
    // The moved corner sits on top of paper that was already there.
    const stacked = built.paper.facets.filter((f) => f.layer >= 1)
    expect(stacked.length).toBeGreaterThan(0)
    const sample = stacked[0].poly[0]
    expect(layersAt(built.paper, sample.x, sample.y)).toBeGreaterThanOrEqual(1)
  })

  it('conserves area for rotated creases', () => {
    for (const deg of [15, 90, 180, 270, 320]) {
      const angle = (deg * Math.PI) / 180
      const built = buildFold(blankSheet(), { angle, ax: 0.01, ay: -0.02, side: 1 })
      expect(built.valid, `deg ${deg}`).toBe(true)
      expect(rel(materialArea(built.paper)), `deg ${deg}`).toBeLessThan(1e-8)
      for (const f of built.paper.facets) expect(Math.abs(polygonArea(f.poly))).toBeGreaterThan(1e-10)
    }
  })

  it('defaults to the smaller portion, and an explicit side can fold the larger one', () => {
    const angle = 0.4
    const ax = 0.04
    const ay = 0.02
    const sheet = blankSheet()
    const smaller = buildFold(sheet, { angle, ax, ay, side: 1 })
    const ignored = buildFold(sheet, { angle, ax, ay, side: -1 })
    expect(smaller.tie).toBe(false)
    expect(smaller.valid).toBe(true)
    const smallSign: 1 | -1 = smaller.areaPos < smaller.areaNeg ? 1 : -1
    expect(smaller.movingSign).toBe(smallSign)
    expect(ignored.movingSign).toBe(smallSign)
    const larger = buildFold(sheet, { angle, ax, ay, side: smallSign === 1 ? -1 : 1, explicit: true })
    expect(larger.valid).toBe(true)
    expect(larger.movingSign).not.toBe(smallSign)
    expect(outline(smaller.paper)).not.toBe(outline(larger.paper))
    expect(rel(materialArea(larger.paper))).toBeLessThan(1e-8)
    const stored: FoldOp = { angle, ax, ay, side: larger.movingSign, explicit: true }
    expect(outline(applyOps([stored]))).toBe(outline(larger.paper))
  })

  it('places another cutting crease after a fold whose line no longer hits', () => {
    const first = buildFold(blankSheet(), DART_OPS[0])
    expect(first.valid).toBe(true)
    expect(buildFold(first.paper, DART_OPS[0]).valid).toBe(false)
    let paper = first.paper
    let crease = suggestCrease(paper, DART_OPS[0])
    for (let i = 0; i < 5; i++) {
      const built = buildFold(paper, crease)
      expect(built.valid, `fold ${i + 1}`).toBe(true)
      paper = built.paper
      const same = buildFold(paper, crease)
      crease = same.valid ? { ...crease, ay: crease.ay + 0.01, explicit: true, side: built.movingSign === 1 ? -1 : 1 } : suggestCrease(paper, crease)
      if (!buildFold(paper, crease).valid) crease = suggestCrease(paper, crease)
      expect(buildFold(paper, crease).valid, `next ${i + 1}`).toBe(true)
    }
  })

  it('stacks four layers after two successive half folds', () => {
    const first = buildFold(blankSheet(), { angle: Math.PI / 2, ax: 0, ay: 0, side: 1 }).paper
    const quarter = SHEET.width / 4
    const second = buildFold(first, { angle: Math.PI / 2, ax: quarter, ay: 0, side: 1 })
    expect(second.valid).toBe(true)
    expect(rel(materialArea(second.paper))).toBeLessThan(1e-8)
    const xs = second.paper.facets.flatMap((f) => f.poly.map((p) => p.x))
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    expect(maxX - minX).toBeLessThan(SHEET.width / 2 + 1e-6)
    let peak = 0
    for (let i = 0; i < 12; i++) {
      const x = minX + ((i + 0.5) / 12) * (maxX - minX)
      peak = Math.max(peak, layersAt(second.paper, x, 0))
    }
    expect(peak).toBe(4)
  })

  it('keeps area and accumulates layers across a dart recipe', () => {
    const paper = applyOps(DART_OPS)
    expect(rel(materialArea(paper))).toBeLessThan(1e-8)
    const shape = deriveShape(paper)
    expect(shape.meanLayers).toBeGreaterThan(1.3)
    expect(shape.mass).toBeGreaterThan(0.0045)
    expect(shape.mass).toBeLessThan(0.0052)
    expect(shape.bluntness).toBeLessThan(0.45)
    expect(shape.asymmetry).toBeLessThan(0.04)
  })
})

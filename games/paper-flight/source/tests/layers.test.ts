import { describe, expect, it } from 'vitest'
import { SHEET } from '../src/sim/constants'
import { reflectFold } from '../src/sim/dragFold'
import {
  applyOps,
  blankSheet,
  materialArea,
  netFolds,
  openCreaseCount,
  plyAt,
  polygonArea,
  type FoldOp,
} from '../src/sim/geometry'
import { deriveShape } from '../src/sim/shape'
import { canLift, poseFacets, wingHinges } from '../src/sim/wings'

const half: FoldOp = { angle: Math.PI / 2, ax: 0, ay: 0, side: -1, explicit: true }

function polysOf(paper: ReturnType<typeof applyOps>, ply: number) {
  return paper.facets.filter((facet) => facet.ply === ply).map((facet) => facet.poly)
}

describe('layers, flip, and wing lift', () => {
  it('folds only the selected sheet and keeps the other ply still', () => {
    const packet = applyOps([half])
    const area = materialArea(packet)
    const top = packet.facets.find((facet) => facet.ply !== 0)
    expect(top).toBeTruthy()
    const before = polysOf(packet, 0)
    const wing: FoldOp = { angle: 0, ax: 0, ay: 0.03, side: 1, explicit: true, plies: [top!.ply] }
    const folded = applyOps([half, wing])
    expect(materialArea(folded)).toBeCloseTo(area, 6)
    expect(polysOf(folded, 0)).toEqual(before)
    expect(folded.facets.some((facet) => facet.ply !== 0 && facet.ply !== top!.ply)).toBe(true)
    const moved = folded.facets.filter((facet) => facet.ply !== 0 && facet.ply !== top!.ply)
    expect(moved.length).toBeGreaterThan(0)
    expect(new Set(moved.map((facet) => facet.ply)).size).toBe(1)
  })

  it('turns the sheet over and restores it on the second flip', () => {
    const packet = applyOps([half])
    const once = applyOps([half, { flip: true }])
    const twice = applyOps([half, { flip: true }, { flip: true }])
    expect(once.facets[0].faceUp).toBe(-packet.facets[0].faceUp)
    expect(once.facets.map((facet) => facet.poly[0].x)).not.toEqual(packet.facets.map((facet) => facet.poly[0].x))
    expect(twice.facets.map((facet) => facet.poly.map((point) => [point.x, point.y]))).toEqual(
      packet.facets.map((facet) => facet.poly.map((point) => [point.x, point.y])),
    )
    expect(twice.facets.map((facet) => facet.faceUp)).toEqual(packet.facets.map((facet) => facet.faceUp))
    expect(materialArea(twice)).toBeCloseTo(materialArea(blankSheet()), 6)
    expect(netFolds([half, { flip: true }])).toBe(1)
  })

  it('undo drops the last action and unfold opens the latest fold', () => {
    const history = [half, { flip: true }] as const
    expect(netFolds(history.slice(0, -1))).toBe(1)
    expect(applyOps(history.slice(0, -1)).facets[0].faceUp).toBe(1)
    const opened = applyOps([half, { flip: true }, { unfold: true }])
    expect(netFolds([half, { flip: true }, { unfold: true }])).toBe(0)
    expect(openCreaseCount([half, { flip: true }, { unfold: true }])).toBe(1)
    expect(opened.facets).toHaveLength(1)
    expect(materialArea(opened)).toBeCloseTo(SHEET.width * SHEET.height, 6)
  })

  it('lifts a folded wing into a non-flat pose and refuses a blank sheet', () => {
    const w = SHEET.width
    const h = SHEET.height
    let paper = blankSheet()
    const steps: FoldOp[] = []
    const drag = (from: { x: number; y: number }, to: { x: number; y: number }, all = false) => {
      const ply = all ? null : plyAt(paper, from, 0.03)
      const folded = reflectFold(paper, from, to, ply == null ? undefined : [ply])
      expect(folded, `${from.x},${from.y}`).toBeTruthy()
      steps.push(folded!.op)
      paper = folded!.paper
    }
    drag({ x: -w / 2, y: h / 2 }, { x: 0, y: h / 2 - w / 2 })
    drag({ x: w / 2, y: h / 2 }, { x: 0, y: h / 2 - w / 2 })
    drag({ x: -w / 2, y: 0 }, { x: w / 2, y: 0 }, true)
    expect(canLift(paper)).toBe(false)
    drag({ x: w / 2, y: 0 }, { x: 0.02, y: 0 })
    const flat = applyOps(steps)
    expect(canLift(blankSheet())).toBe(false)
    expect(canLift(flat)).toBe(true)
    const hinges = wingHinges(flat)
    expect(hinges).toHaveLength(1)
    expect(hinges[0].ply).not.toBe(0)
    const raised = applyOps([...steps, { lift: 0.4 }])
    expect(materialArea(raised)).toBeCloseTo(materialArea(flat), 6)
    const posed = poseFacets(raised)
    const wingZ = posed.filter((facet) => facet.ply === hinges[0].ply).flatMap((facet) => facet.poly.map((point) => point.z))
    expect(Math.max(...wingZ)).toBeGreaterThan(0.01)
    const body = posed.filter((facet) => facet.ply === 0)
    expect(Math.max(...body.flatMap((facet) => facet.poly.map((point) => point.z)))).toBeLessThan(0.02)
    const shape = deriveShape(raised)
    const flatShape = deriveShape(flat)
    expect(shape.dihedral).toBeCloseTo(0.4)
    expect(shape.span + shape.planformArea).not.toBeCloseTo(flatShape.span + flatShape.planformArea, 4)
    expect(shape.mass).toBeCloseTo(flatShape.mass, 6)
    const posedArea = posed.reduce((sum, facet) => sum + Math.abs(polygonArea(facet.poly.map((point) => ({ x: point.x, y: point.y })))), 0)
    expect(posedArea).toBeLessThan(materialArea(raised))
  })
})

import { describe, expect, it } from 'vitest'
import { applyQuat, bendTarget, partHinges, posePaper, TURN_STEP, turnQuat, withPart } from '../src/sim/adjust'
import { SHEET } from '../src/sim/constants'
import { reflectFold } from '../src/sim/dragFold'
import {
  applyOps,
  blankSheet,
  identityAdjust,
  netFolds,
  pliesForGrab,
  sanitizeOps,
  type FoldOp,
  type Paper,
} from '../src/sim/geometry'

function dart(): { paper: Paper; steps: FoldOp[] } {
  const w = SHEET.width
  const h = SHEET.height
  let paper = blankSheet()
  const steps: FoldOp[] = []
  const drag = (from: { x: number; y: number }, to: { x: number; y: number }, all = false) => {
    const joined = all ? null : pliesForGrab(paper, from, 0.03)
    const folded = reflectFold(paper, from, to, joined ?? undefined)
    if (!folded) throw new Error(`fold ${from.x},${from.y}`)
    steps.push(folded.op)
    paper = folded.paper
  }
  drag({ x: -w / 2, y: h / 2 }, { x: 0, y: h / 2 - w / 2 })
  drag({ x: w / 2, y: h / 2 }, { x: 0, y: h / 2 - w / 2 })
  drag({ x: -w / 2, y: 0 }, { x: w / 2, y: 0 }, true)
  drag({ x: w / 2, y: 0 }, { x: 0.02, y: 0 })
  paper = applyOps([...steps, { flip: true }])
  const from = { x: -w / 2, y: 0 }
  const joined = pliesForGrab(paper, from, 0.03)
  const second = reflectFold(paper, from, { x: -0.02, y: 0 }, joined ?? undefined)
  if (!second) throw new Error('second wing')
  steps.push(second.op)
  return { paper: applyOps([...steps.slice(0, -1), { flip: true }, second.op]), steps }
}

describe('adjust pose', () => {
  it('bends one flap around its crease and leaves the sheet it is joined to', () => {
    const paper: Paper = {
      nextId: 4,
      creases: [{ a: { x: 0, y: -0.05 }, b: { x: 0, y: 0.05 } }],
      facets: [
        {
          id: 1,
          ply: 0,
          plyParent: null,
          layer: 0,
          faceUp: 1,
          poly: [
            { x: -0.08, y: -0.05 },
            { x: 0, y: -0.05 },
            { x: 0, y: 0.05 },
            { x: -0.08, y: 0.05 },
          ],
        },
        {
          id: 2,
          ply: 1,
          plyParent: 0,
          layer: 1,
          faceUp: -1,
          poly: [
            { x: 0, y: -0.05 },
            { x: 0.05, y: -0.05 },
            { x: 0.05, y: 0.05 },
            { x: 0, y: 0.05 },
          ],
        },
        {
          id: 3,
          ply: 2,
          plyParent: 1,
          layer: 2,
          faceUp: 1,
          poly: [
            { x: 0.03, y: 0 },
            { x: 0.04, y: -0.004 },
            { x: 0.04, y: 0.004 },
          ],
        },
      ],
    }
    expect(bendTarget(paper, 2)).toBe(1)
    expect(bendTarget(paper, 0)).toBeNull()
    const flat = posePaper(paper, new Map())
    const raised = posePaper(paper, new Map([[1, Math.PI / 2]]))
    const zOf = (posed: typeof flat, ply: number) =>
      posed.facets.filter((facet) => facet.ply === ply).flatMap((facet) => facet.poly.map((point) => point.z))
    expect(Math.max(...zOf(flat, 0))).toBeLessThan(0.02)
    expect(Math.max(...zOf(raised, 1))).toBeGreaterThan(0.03)
    expect(Math.max(...zOf(raised, 2))).toBeGreaterThan(0.02)
    expect(Math.max(...zOf(raised, 0))).toBeLessThan(0.02)
  })

  it('opens the two dart wings independently', () => {
    const { paper } = dart()
    const hinges = partHinges(paper).sort((a, b) => b.a.y - b.b.y - (a.a.y - a.b.y))
    const wings = hinges.filter((hinge) => Math.hypot(hinge.a.x - hinge.b.x, hinge.a.y - hinge.b.y) > 0.08)
    expect(wings.length).toBeGreaterThanOrEqual(2)
    const [first, second] = wings
    const flat = posePaper(paper, new Map())
    const posed = posePaper(paper, new Map([[first.ply, 0.9]]))
    const maxZ = (posedPaper: typeof flat, ply: number) =>
      Math.max(...posedPaper.facets.filter((facet) => facet.ply === ply).flatMap((facet) => facet.poly.map((point) => point.z)))
    expect(maxZ(posed, first.ply) - maxZ(flat, first.ply)).toBeGreaterThan(0.02)
    expect(Math.abs(maxZ(posed, second.ply) - maxZ(flat, second.ply))).toBeLessThan(0.005)
    expect(Math.abs(maxZ(posed, first.anchor) - maxZ(flat, first.anchor))).toBeLessThan(0.005)
  })

  it('turns the whole sheet a full circle and keeps the pose through sanitize', () => {
    let q = { x: 0, y: 0, z: 0, w: 1 }
    for (let i = 0; i < 6; i++) q = turnQuat(q, 'yaw', -TURN_STEP)
    const nose = applyQuat(q, { x: 0, y: 1, z: 0 })
    expect(nose.x).toBeGreaterThan(0.9)
    expect(Math.abs(nose.y)).toBeLessThan(0.1)
    for (let i = 0; i < 18; i++) q = turnQuat(q, 'yaw', -TURN_STEP)
    const back = applyQuat(q, { x: 0, y: 1, z: 0 })
    expect(back.y).toBeGreaterThan(0.9)
    const pose = withPart({ ...identityAdjust(), qx: q.x, qy: q.y, qz: q.z, qw: q.w }, 3, 0.8)
    const kept = sanitizeOps([pose && { adjust: pose }, { unfold: true }])
    expect(netFolds(kept)).toBe(0)
    expect(kept[0]).toMatchObject({ adjust: { parts: [{ ply: 3, angle: 0.8 }] } })
    const paper = applyOps([{ adjust: pose }])
    expect(paper.adjust?.parts[0].angle).toBeCloseTo(0.8)
    expect(paper.dihedral).toBeCloseTo(0.8)
  })
})

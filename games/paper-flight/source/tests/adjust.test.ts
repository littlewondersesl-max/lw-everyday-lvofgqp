import { describe, expect, it } from 'vitest'
import { applyQuat, bendTarget, clampBend, partHinges, posePaper, TURN_STEP, turnQuat, withPart } from '../src/sim/adjust'
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

function seamGap(
  paper: Paper,
  posed: { facets: { poly: { x: number; y: number; z: number }[] }[] },
  hinge: { ply: number; anchor: number; a: { x: number; y: number }; b: { x: number; y: number } },
) {
  let worst = 0
  paper.facets.forEach((facet, index) => {
    if (facet.ply !== hinge.ply && facet.ply !== hinge.anchor) return
    facet.poly.forEach((point, vertex) => {
      if (segmentDistance(point, hinge.a, hinge.b) > 0.0016) return
      const posedPoint = posed.facets[index].poly[vertex]
      worst = Math.max(worst, hingeDistance(posedPoint, hinge.a, hinge.b))
    })
  })
  return worst
}

function hingeDistance(
  point: { x: number; y: number; z: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const len = Math.hypot(abx, aby) || 1
  const apx = point.x - a.x
  const apy = point.y - a.y
  const cx = aby * point.z
  const cy = -abx * point.z
  const cz = abx * apy - aby * apx
  return Math.hypot(cx, cy, cz) / len
}

function segmentDistance(
  point: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = dx * dx + dy * dy || 1
  let t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / len
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy))
}

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
          plyParent: null,
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

  it('opens the wing folded after the flip off the half it lies on, matching the other wing', () => {
    const w = SHEET.width
    const h = SHEET.height
    let paper = blankSheet()
    const steps: FoldOp[] = []
    const drag = (from: { x: number; y: number }, to: { x: number; y: number }, all = false) => {
      const joined = all ? null : pliesForGrab(paper, from, 0.03)
      const folded = reflectFold(paper, from, to, joined ?? undefined)
      if (!folded) throw new Error('fold')
      steps.push(folded.op)
      paper = folded.paper
    }
    drag({ x: -w / 2, y: h / 2 }, { x: 0, y: h / 2 - w / 2 })
    drag({ x: w / 2, y: h / 2 }, { x: 0, y: h / 2 - w / 2 })
    drag({ x: -w / 2, y: 0 }, { x: w / 2, y: 0 }, true)
    drag({ x: w / 2, y: 0 }, { x: 0, y: 0 })
    paper = applyOps([...steps, { flip: true }])
    const from = { x: -w / 2, y: 0 }
    const second = reflectFold(paper, from, { x: 0, y: 0 }, pliesForGrab(paper, from, 0.03) ?? undefined)
    if (!second) throw new Error('second wing')
    paper = applyOps([...steps, { flip: true }, second.op])
    const wings = partHinges(paper).filter((hinge) => {
      const len = Math.hypot(hinge.a.x - hinge.b.x, hinge.a.y - hinge.b.y)
      return len > 0.16 && len < 0.26
    })
    expect(wings).toHaveLength(2)
    expect(new Set(wings.map((hinge) => hinge.anchor)).size).toBe(2)
    const travel = new Map<number, number>()
    for (const wing of wings) {
      expect(clampBend(paper, identityAdjust(), wing.ply, -1)).toBe(0)
      const opened = clampBend(paper, identityAdjust(), wing.ply, 1.15)
      expect(opened).toBeGreaterThan(1)
      const posed = posePaper(paper, new Map([[wing.ply, opened]]))
      let z = 0
      let count = 0
      for (const facet of posed.facets) {
        if (facet.ply !== wing.ply) continue
        for (const point of facet.poly) {
          z += point.z
          count += 1
        }
      }
      travel.set(wing.ply, z / count)
      expect(seamGap(paper, posed, wing)).toBeLessThan(0.002)
    }
    const [first, secondWing] = [...travel.values()]
    expect(Math.sign(first)).not.toBe(Math.sign(secondWing))
    expect(Math.abs(Math.abs(first) - Math.abs(secondWing))).toBeLessThan(0.008)
  })

  it('opens a dart wing off its crease and refuses to fold it back through the sheet', () => {
    const { paper } = dart()
    const hinges = partHinges(paper)
    const wings = hinges.filter((hinge) => Math.hypot(hinge.a.x - hinge.b.x, hinge.a.y - hinge.b.y) > 0.15 && hinge.ply !== 0)
    expect(wings.length).toBeGreaterThanOrEqual(1)
    const wing = wings[0]
    expect(clampBend(paper, identityAdjust(), wing.ply, -1.2)).toBe(0)
    const opened = clampBend(paper, identityAdjust(), wing.ply, 1.1)
    expect(opened).toBeGreaterThan(0.4)
    const posed = posePaper(paper, new Map([[wing.ply, opened]]))
    expect(seamGap(paper, posed, wing)).toBeLessThan(0.002)
    const flat = posePaper(paper, new Map())
    const travel = (ply: number, sample: typeof posed) => {
      let z = 0
      for (const facet of sample.facets) if (facet.ply === ply) for (const point of facet.poly) z = Math.max(z, Math.abs(point.z))
      return z
    }
    expect(travel(wing.ply, posed)).toBeGreaterThan(travel(wing.ply, flat) + 0.01)
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

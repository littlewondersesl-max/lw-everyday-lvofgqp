/**
 * A fold limit is the straight cut between two points on the current silhouette.
 * The points are not handles: they do not move the line, and editing them does
 * not touch a held or sealed fold.
 */

import type { Guide } from './dragFold'
import { buildFold, lineFrame, pointInConvex, signedDistance, type FoldOp, type Paper, type Vec2 } from './geometry'

export interface Endpoints {
  a: Vec2 | null
  b: Vec2 | null
}

/** Two clicks closer than this are the same spot, not a crease. */
export const MIN_AB = 0.008

export function clearedNodes(): Endpoints {
  return { a: null, b: null }
}

export function removeEndpoint(ends: Endpoints, which: 'a' | 'b'): Endpoints {
  return which === 'a' ? { a: null, b: ends.b } : { a: ends.a, b: null }
}

/** Fill the empty endpoint. The first click is A. A finished pair is left as it is. */
export function setMissingEndpoint(ends: Endpoints, point: Vec2): { ends: Endpoints; placed: 'a' | 'b' | null } {
  if (!ends.a && !ends.b) return { ends: { a: point, b: null }, placed: 'a' }
  if (!ends.a) return { ends: { a: point, b: ends.b }, placed: 'a' }
  if (!ends.b) return { ends: { a: ends.a, b: point }, placed: 'b' }
  return { ends, placed: null }
}

export function endpointHit(ends: Endpoints, point: Vec2, radius: number): 'a' | 'b' | null {
  const da = ends.a ? Math.hypot(point.x - ends.a.x, point.y - ends.a.y) : Infinity
  const db = ends.b ? Math.hypot(point.x - ends.b.x, point.y - ends.b.y) : Infinity
  if (da <= radius && da <= db) return 'a'
  if (db <= radius) return 'b'
  return null
}

export type NodeAction =
  | { type: 'remove'; which: 'a' | 'b' }
  | { type: 'reset' }
  | { type: 'place'; point: Vec2; paper: Paper }

/** Point edits never receive the fold list. A held flap refuses the edit and is returned unchanged. */
export function applyNodeEdit(
  ends: Endpoints,
  holding: boolean,
  action: NodeAction,
): { ends: Endpoints; note: string } {
  if (holding) return { ends, note: 'Undo the held fold before changing the points.' }
  if (action.type === 'reset') return { ends: clearedNodes(), note: 'Points cleared. The folds stay.' }
  if (action.type === 'remove') {
    const next = removeEndpoint(ends, action.which)
    const name = action.which === 'a' ? 'A' : 'B'
    const other = action.which === 'a' ? next.b : next.a
    const note = other
      ? `Point ${name} removed. Click the edge to replace it.`
      : `Point ${name} removed.`
    return { ends: next, note }
  }
  const filled = setMissingEndpoint(ends, action.point)
  if (!filled.placed) return { ends, note: '' }
  if (filled.ends.a && filled.ends.b) {
    const check = assessPair(action.paper, filled.ends.a, filled.ends.b)
    if (!check.ok) return { ends, note: check.reason }
    return { ends: filled.ends, note: 'Line set. Drag either edge inward. The line is the limit.' }
  }
  return {
    ends: filled.ends,
    note: filled.placed === 'a' ? 'Point A. Click another spot on the edge for B.' : 'Point B stays. Click the edge for A.',
  }
}

function pointInPaper(paper: Paper, point: Vec2) {
  return paper.facets.some((facet) => pointInConvex(facet.poly, point.x, point.y))
}

/** Edges with paper on only one side: the outline you can still see, including after folds. */
export function silhouetteEdges(paper: Paper) {
  const edges: { a: Vec2; b: Vec2 }[] = []
  const eps = 0.0012
  for (const facet of paper.facets) {
    const poly = facet.poly
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.hypot(dx, dy)
      if (len < 1e-6) continue
      const nx = -dy / len
      const ny = dx / len
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const left = pointInPaper(paper, { x: mid.x + nx * eps, y: mid.y + ny * eps })
      const right = pointInPaper(paper, { x: mid.x - nx * eps, y: mid.y - ny * eps })
      if (left !== right) edges.push({ a, b })
    }
  }
  return edges
}

export function nearestSilhouette(paper: Paper, point: Vec2, maxDist: number): Vec2 | null {
  let best: Vec2 | null = null
  let bestD = maxDist
  for (const edge of silhouetteEdges(paper)) {
    const hit = closestOnSegment(point, edge.a, edge.b)
    if (hit.dist < bestD) {
      bestD = hit.dist
      best = hit.point
    }
  }
  return best
}

export function assessPair(
  paper: Paper,
  a: Vec2,
  b: Vec2,
): { ok: true; angle: number; ax: number; ay: number } | { ok: false; reason: string } {
  if (Math.hypot(a.x - b.x, a.y - b.y) < MIN_AB) {
    return { ok: false, reason: 'Those two points are the same spot. Click a different place on the edge.' }
  }
  const angle = Math.atan2(b.y - a.y, b.x - a.x)
  const ax = (a.x + b.x) / 2
  const ay = (a.y + b.y) / 2
  const trial = (side: 1 | -1): FoldOp => ({ angle, ax, ay, side, explicit: true })
  const one = buildFold(paper, trial(1))
  const other = buildFold(paper, trial(-1))
  if (!one.valid && !other.valid) {
    return { ok: false, reason: 'That line stays on the edge and does not cut the sheet. Choose two points the crease can cross.' }
  }
  return { ok: true, angle, ax, ay }
}

/** The grabbed edge picks the side. The sign is whichever side of the line that point is on. */
export function guideForGrab(line: { angle: number; ax: number; ay: number }, point: Vec2): Guide | null {
  const frame = lineFrame(line.angle, line.ax, line.ay)
  const signed = signedDistance(point, frame)
  if (Math.abs(signed) < 1e-6) return null
  const movingSign: 1 | -1 = signed > 0 ? 1 : -1
  return { angle: line.angle, ax: line.ax, ay: line.ay, movingSign }
}

/** Where a helper crease meets the current outline, as point A and point B. */
export function edgePointsOnLine(paper: Paper, angle: number, ax: number, ay: number): Endpoints | null {
  const frame = lineFrame(angle, ax, ay)
  const hits: Vec2[] = []
  for (const edge of silhouetteEdges(paper)) {
    const da = signedDistance(edge.a, frame)
    const db = signedDistance(edge.b, frame)
    if (Math.abs(da) < 1e-5 && Math.abs(db) < 1e-5) continue
    if (Math.abs(da) < 1e-5) hits.push(edge.a)
    else if (Math.abs(db) < 1e-5) hits.push(edge.b)
    else if (da * db < 0) {
      const t = da / (da - db)
      hits.push({
        x: edge.a.x + (edge.b.x - edge.a.x) * t,
        y: edge.a.y + (edge.b.y - edge.a.y) * t,
      })
    }
  }
  if (hits.length < 2) return null
  let minT = Infinity
  let maxT = -Infinity
  let a = hits[0]!
  let b = hits[0]!
  for (const hit of hits) {
    const t = (hit.x - ax) * frame.dx + (hit.y - ay) * frame.dy
    if (t < minT) {
      minT = t
      a = hit
    }
    if (t > maxT) {
      maxT = t
      b = hit
    }
  }
  if (Math.hypot(a.x - b.x, a.y - b.y) < MIN_AB) return null
  if (!assessPair(paper, a, b).ok) return null
  return { a, b }
}

function closestOnSegment(p: Vec2, a: Vec2, b: Vec2) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = dx * dx + dy * dy || 1
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len
  t = Math.max(0, Math.min(1, t))
  const point = { x: a.x + t * dx, y: a.y + t * dy }
  return { point, dist: Math.hypot(p.x - point.x, p.y - point.y) }
}

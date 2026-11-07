/**
 * The dashed guide is only a limit. A dragged edge folds on a line parallel
 * to that guide, and stopping early leaves the ridge where the flap stopped.
 */

import { buildFold, lineFrame, signedDistance, type CreaseMark, type FoldOp, type Paper, type Vec2 } from './geometry'

export interface Guide {
  angle: number
  ax: number
  ay: number
  movingSign: 1 | -1
}

export const MIN_FLAP = 0.006
export const SEAL_COVERAGE = 0.72

export function depthOf(point: Vec2, guide: Guide): number {
  const frame = lineFrame(guide.angle, guide.ax, guide.ay)
  return signedDistance(point, frame) * guide.movingSign
}

export function edgeDepth(paper: Paper, guide: Guide): number {
  let max = 0
  for (const facet of paper.facets) {
    for (const point of facet.poly) max = Math.max(max, depthOf(point, guide))
  }
  return max
}

/** Crease parallel to the guide, `depth` meters toward the moving side. Depth 0 is the guide. */
export function creaseAtDepth(guide: Guide, depth: number): FoldOp {
  const frame = lineFrame(guide.angle, guide.ax, guide.ay)
  return {
    angle: guide.angle,
    ax: guide.ax + frame.nx * guide.movingSign * depth,
    ay: guide.ay + frame.ny * guide.movingSign * depth,
    side: guide.movingSign,
    explicit: true,
  }
}

/**
 * The pinched point starts at grabDepth and is pulled to cursorDepth.
 * The ridge is halfway between them, and it cannot cross the guide (depth 0).
 */
export function depthFromDrag(grabDepth: number, cursorDepth: number): number {
  const raw = (cursorDepth + grabDepth) / 2
  return Math.max(0, Math.min(grabDepth, raw))
}

export function flapMoved(grabDepth: number, depth: number): boolean {
  return grabDepth - depth >= MIN_FLAP
}

export function nearestBoundary(paper: Paper, point: Vec2, maxDist: number): Vec2 | null {
  let best: Vec2 | null = null
  let bestD = maxDist
  for (const facet of paper.facets) {
    const poly = facet.poly
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      const hit = closestOnSegment(point, a, b)
      if (hit.dist < bestD) {
        bestD = hit.dist
        best = hit.point
      }
    }
  }
  return best
}

/** The ridge is the crease segment where the folded flap now ends. */
export function ridgeOf(paper: Paper, op: FoldOp): CreaseMark | null {
  const frame = lineFrame(op.angle, op.ax, op.ay)
  const hits: Vec2[] = []
  for (const facet of paper.facets) {
    const poly = facet.poly
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      const da = signedDistance(a, frame)
      const db = signedDistance(b, frame)
      if (Math.abs(da) < 0.0018) hits.push(a)
      if (da === 0 || db === 0 || da * db > 0) continue
      const t = da / (da - db)
      hits.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  if (hits.length < 2) return null
  let minT = Infinity
  let maxT = -Infinity
  let a = hits[0]
  let b = hits[0]
  for (const hit of hits) {
    const t = hit.x * frame.dx + hit.y * frame.dy
    if (t < minT) {
      minT = t
      a = hit
    }
    if (t > maxT) {
      maxT = t
      b = hit
    }
  }
  if (Math.hypot(a.x - b.x, a.y - b.y) < 0.004) return null
  return { a, b }
}

export function sampleRidge(ridge: CreaseMark, count = 28): Vec2[] {
  const out: Vec2[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1)
    out.push({ x: ridge.a.x + (ridge.b.x - ridge.a.x) * t, y: ridge.a.y + (ridge.b.y - ridge.a.y) * t })
  }
  return out
}

/** Mark samples the pointer passes. A stationary dab covers a spot, not the whole ridge. */
export function coverSamples(samples: Vec2[], covered: boolean[], point: Vec2, radius: number): number {
  for (let i = 0; i < samples.length; i++) {
    const dx = samples[i].x - point.x
    const dy = samples[i].y - point.y
    if (dx * dx + dy * dy <= radius * radius) covered[i] = true
  }
  let n = 0
  for (const bit of covered) if (bit) n += 1
  return samples.length ? n / samples.length : 0
}

export function previewFold(base: Paper, guide: Guide, depth: number): { op: FoldOp; paper: Paper } | null {
  const op = creaseAtDepth(guide, depth)
  const built = buildFold(base, op)
  if (!built.valid) return null
  return { op, paper: built.paper }
}

function closestOnSegment(p: Vec2, a: Vec2, b: Vec2): { point: Vec2; dist: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = dx * dx + dy * dy || 1
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len
  t = Math.max(0, Math.min(1, t))
  const point = { x: a.x + t * dx, y: a.y + t * dy }
  return { point, dist: Math.hypot(p.x - point.x, p.y - point.y) }
}

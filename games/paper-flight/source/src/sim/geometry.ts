/**
 * Flat paper folds.
 *
 * The sheet is a stack of convex polygons in the plane. A crease is an
 * infinite line. The line splits every facet. By default the side with
 * less paper is reflected across the line onto the other side. When
 * `explicit` is set, `side` chooses which side moves, even if it is larger.
 * A tie within LIMITS.tieFraction also follows `side`.
 *
 * Reflection reverses the moving stack: what was on top lands against the
 * paper it covers, and the face that was up is now down. Material area is
 * the sum of facet areas and does not change (overlaps are extra layers,
 * not extra paper).
 */

import { LIMITS, SHEET } from './constants'

export interface Vec2 {
  x: number
  y: number
}

export interface Facet {
  id: number
  poly: Vec2[]
  layer: number
  /** +1 original front, -1 original back. */
  faceUp: 1 | -1
}

export interface CreaseMark {
  a: Vec2
  b: Vec2
}

export interface Paper {
  facets: Facet[]
  creases: CreaseMark[]
  nextId: number
}

export interface FoldOp {
  /** Direction of the crease line, radians. Angle and angle+π are the same line. */
  angle: number
  ax: number
  ay: number
  /**
   * Which side of the line moves. Without `explicit`, this is used only when
   * the two areas match. With `explicit`, this side moves even if it is larger.
   */
  side: 1 | -1
  explicit?: boolean
}

const EPS = 1e-8

export function blankSheet(size: { width: number; height: number } = SHEET): Paper {
  const w = size.width / 2
  const h = size.height / 2
  return {
    facets: [
      {
        id: 1,
        poly: [
          { x: -w, y: -h },
          { x: w, y: -h },
          { x: w, y: h },
          { x: -w, y: h },
        ],
        layer: 0,
        faceUp: 1,
      },
    ],
    creases: [],
    nextId: 2,
  }
}

export function lineFrame(angle: number, ax: number, ay: number) {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  const nx = -dy
  const ny = dx
  return { dx, dy, nx, ny, ax, ay }
}

export function signedDistance(
  p: Vec2,
  frame: { nx: number; ny: number; ax: number; ay: number },
): number {
  return (p.x - frame.ax) * frame.nx + (p.y - frame.ay) * frame.ny
}

export function reflectPoint(p: Vec2, frame: ReturnType<typeof lineFrame>): Vec2 {
  const d = signedDistance(p, frame)
  return { x: p.x - 2 * d * frame.nx, y: p.y - 2 * d * frame.ny }
}

export function polygonArea(poly: Vec2[]): number {
  let s = 0
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length
    s += poly[i].x * poly[j].y - poly[j].x * poly[i].y
  }
  return s / 2
}

export function materialArea(paper: Paper): number {
  let a = 0
  for (const f of paper.facets) a += Math.abs(polygonArea(f.poly))
  return a
}

export function facetCentroid(poly: Vec2[]): Vec2 {
  const a = polygonArea(poly)
  if (Math.abs(a) < 1e-14) {
    let x = 0
    let y = 0
    for (const p of poly) {
      x += p.x
      y += p.y
    }
    const n = Math.max(poly.length, 1)
    return { x: x / n, y: y / n }
  }
  let cx = 0
  let cy = 0
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length
    const cross = poly[i].x * poly[j].y - poly[j].x * poly[i].y
    cx += (poly[i].x + poly[j].x) * cross
    cy += (poly[i].y + poly[j].y) * cross
  }
  return { x: cx / (6 * a), y: cy / (6 * a) }
}

/**
 * Area moments about the origin: ∫x² dA, ∫y² dA, ∫xy dA.
 * Polygon must be CCW or the signs follow the winding; we take the
 * absolute area separately and require CCW input.
 */
export function areaMoments(poly: Vec2[]): { a: number; xx: number; yy: number; xy: number } {
  let crossSum = 0
  let xx = 0
  let yy = 0
  let xy = 0
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length
    const xi = poly[i].x
    const yi = poly[i].y
    const xj = poly[j].x
    const yj = poly[j].y
    const cross = xi * yj - xj * yi
    crossSum += cross
    xx += (xi * xi + xi * xj + xj * xj) * cross
    yy += (yi * yi + yi * yj + yj * yj) * cross
    xy += (xi * yj + 2 * xi * yi + 2 * xj * yj + xj * yi) * cross
  }
  return { a: crossSum / 2, xx: xx / 12, yy: yy / 12, xy: xy / 24 }
}

function ensureCCW(poly: Vec2[]): Vec2[] {
  return polygonArea(poly) < 0 ? [...poly].reverse() : poly
}

function clean(poly: Vec2[]): Vec2[] {
  const out: Vec2[] = []
  for (const p of poly) {
    const q = out[out.length - 1]
    if (q && (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y) < 1e-16) continue
    out.push(p)
  }
  if (out.length >= 2) {
    const a = out[0]
    const b = out[out.length - 1]
    if ((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) < 1e-16) out.pop()
  }
  if (out.length < 3) return []
  const stripped: Vec2[] = []
  for (let i = 0; i < out.length; i++) {
    const prev = out[(i + out.length - 1) % out.length]
    const cur = out[i]
    const next = out[(i + 1) % out.length]
    const cr =
      (cur.x - prev.x) * (next.y - cur.y) - (cur.y - prev.y) * (next.x - cur.x)
    if (Math.abs(cr) < 1e-14) continue
    stripped.push(cur)
  }
  if (stripped.length < 3) return []
  const area = Math.abs(polygonArea(stripped))
  if (area < 1e-12) return []
  return ensureCCW(stripped)
}

function clipHalfPlane(
  poly: Vec2[],
  frame: ReturnType<typeof lineFrame>,
  keepPositive: boolean,
): Vec2[] {
  const out: Vec2[] = []
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const pi = poly[i]
    const pj = poly[j]
    const di = signedDistance(pi, frame)
    const dj = signedDistance(pj, frame)
    const inI = keepPositive ? di >= -EPS : di <= EPS
    const inJ = keepPositive ? dj >= -EPS : dj <= EPS
    if (inI && inJ) {
      out.push(pj)
    } else if (inI && !inJ) {
      const t = di / (di - dj)
      out.push({ x: pi.x + t * (pj.x - pi.x), y: pi.y + t * (pj.y - pi.y) })
    } else if (!inI && inJ) {
      const t = di / (di - dj)
      out.push({ x: pi.x + t * (pj.x - pi.x), y: pi.y + t * (pj.y - pi.y) })
      out.push(pj)
    }
  }
  return clean(out)
}

function onLine(p: Vec2, frame: ReturnType<typeof lineFrame>): boolean {
  return Math.abs(signedDistance(p, frame)) <= 1e-6
}

export function convexOverlap(a: Vec2[], b: Vec2[]): boolean {
  const seps = [a, b]
  for (const poly of seps) {
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length
      const nx = poly[j].y - poly[i].y
      const ny = -(poly[j].x - poly[i].x)
      let aMin = Infinity
      let aMax = -Infinity
      let bMin = Infinity
      let bMax = -Infinity
      for (const p of a) {
        const d = p.x * nx + p.y * ny
        if (d < aMin) aMin = d
        if (d > aMax) aMax = d
      }
      for (const p of b) {
        const d = p.x * nx + p.y * ny
        if (d < bMin) bMin = d
        if (d > bMax) bMax = d
      }
      if (aMax < bMin - 1e-9 || bMax < aMin - 1e-9) return false
    }
  }
  return true
}

export function pointInConvex(poly: Vec2[], x: number, y: number): boolean {
  const n = poly.length
  let sign = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const cr =
      (poly[j].x - poly[i].x) * (y - poly[i].y) - (poly[j].y - poly[i].y) * (x - poly[i].x)
    if (Math.abs(cr) <= 1e-12) continue
    const s = cr > 0 ? 1 : -1
    if (sign === 0) sign = s
    else if (s !== sign) return false
  }
  return true
}

export function layersAt(paper: Paper, x: number, y: number): number {
  let n = 0
  for (const f of paper.facets) if (pointInConvex(f.poly, x, y)) n++
  return n
}

export interface FoldBuild {
  valid: boolean
  reason?: string
  tie: boolean
  movingSign: 1 | -1
  areaPos: number
  areaNeg: number
  paper: Paper
  /** Original polygons on the moving side, for the fold animation. */
  moving: Vec2[][]
  resting: { poly: Vec2[]; layer: number; faceUp: 1 | -1 }[]
  nx: number
  ny: number
  ax: number
  ay: number
}

interface Piece {
  poly: Vec2[]
  layer: number
  faceUp: 1 | -1
  sign: 1 | -1
  crease: CreaseMark | null
}

function splitFacet(facet: Facet, frame: ReturnType<typeof lineFrame>): Piece[] {
  const ds = facet.poly.map((p) => signedDistance(p, frame))
  const anyPos = ds.some((d) => d > EPS)
  const anyNeg = ds.some((d) => d < -EPS)
  if (!anyPos && !anyNeg) {
    return [{ poly: facet.poly, layer: facet.layer, faceUp: facet.faceUp, sign: 1, crease: null }]
  }
  if (!anyNeg) {
    return [{ poly: facet.poly, layer: facet.layer, faceUp: facet.faceUp, sign: 1, crease: null }]
  }
  if (!anyPos) {
    return [{ poly: facet.poly, layer: facet.layer, faceUp: facet.faceUp, sign: -1, crease: null }]
  }
  const pos = clipHalfPlane(facet.poly, frame, true)
  const neg = clipHalfPlane(facet.poly, frame, false)
  const crease = creaseOnPiece(pos.length >= neg.length ? pos : neg, frame)
  const parts: Piece[] = []
  if (pos.length >= 3) {
    parts.push({ poly: pos, layer: facet.layer, faceUp: facet.faceUp, sign: 1, crease })
  }
  if (neg.length >= 3) {
    parts.push({ poly: neg, layer: facet.layer, faceUp: facet.faceUp, sign: -1, crease })
  }
  return parts
}

function creaseOnPiece(poly: Vec2[], frame: ReturnType<typeof lineFrame>): CreaseMark | null {
  const pts = poly.filter((p) => onLine(p, frame))
  if (pts.length < 2) return null
  let bestA = pts[0]
  let bestB = pts[1]
  let best = -1
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d =
        (pts[i].x - pts[j].x) * (pts[i].x - pts[j].x) +
        (pts[i].y - pts[j].y) * (pts[i].y - pts[j].y)
      if (d > best) {
        best = d
        bestA = pts[i]
        bestB = pts[j]
      }
    }
  }
  if (best < 1e-10) return null
  return { a: bestA, b: bestB }
}

export function buildFold(paper: Paper, op: FoldOp): FoldBuild {
  const frame = lineFrame(op.angle, op.ax, op.ay)
  const pieces: Piece[] = []
  for (const facet of paper.facets) pieces.push(...splitFacet(facet, frame))
  let areaPos = 0
  let areaNeg = 0
  for (const p of pieces) {
    const a = Math.abs(polygonArea(p.poly))
    if (p.sign > 0) areaPos += a
    else areaNeg += a
  }
  const total = areaPos + areaNeg
  const miss = {
    valid: false as const,
    tie: false,
    movingSign: 1 as const,
    areaPos,
    areaNeg,
    paper,
    moving: [] as Vec2[][],
    resting: [] as { poly: Vec2[]; layer: number; faceUp: 1 | -1 }[],
    nx: frame.nx,
    ny: frame.ny,
    ax: frame.ax,
    ay: frame.ay,
  }
  if (total < 1e-8 || areaPos < 1e-8 || areaNeg < 1e-8) {
    return { ...miss, reason: 'The crease misses the sheet.' }
  }
  const tie = Math.abs(areaPos - areaNeg) / total <= LIMITS.tieFraction
  const smallerSign: 1 | -1 = areaPos <= areaNeg ? 1 : -1
  let movingSign: 1 | -1
  if (op.explicit || tie) movingSign = op.side === -1 ? -1 : 1
  else movingSign = smallerSign

  const movingFraction = (movingSign > 0 ? areaPos : areaNeg) / total
  if (movingFraction < 0.004) {
    return { ...miss, tie, movingSign, reason: 'That crease only nicks the sheet.' }
  }

  const stationary = pieces.filter((p) => p.sign !== movingSign)
  const moving = pieces.filter((p) => p.sign === movingSign)

  const movedPolys: { poly: Vec2[]; layer: number; faceUp: 1 | -1 }[] = moving.map((p) => ({
    poly: ensureCCW(p.poly.map((v) => reflectPoint(v, frame))),
    layer: p.layer,
    faceUp: (p.faceUp * -1) as 1 | -1,
  }))

  // Highest former layer lands first, against whatever it covers.
  const order = movedPolys
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p.layer - a.p.layer || a.i - b.i)

  const placed: { poly: Vec2[]; layer: number; faceUp: 1 | -1 }[] = []
  for (const { p } of order) {
    let base = -1
    for (const s of stationary) {
      if (convexOverlap(p.poly, s.poly)) base = Math.max(base, s.layer)
    }
    for (const s of placed) {
      if (convexOverlap(p.poly, s.poly)) base = Math.max(base, s.layer)
    }
    placed.push({ poly: p.poly, layer: base + 1, faceUp: p.faceUp })
  }

  const creases = transformMarks(paper.creases, frame, movingSign)
  for (const p of pieces) {
    if (p.crease) creases.push(p.crease)
  }

  let nextId = paper.nextId
  const facets: Facet[] = []
  for (const s of stationary) {
    facets.push({
      id: nextId++,
      poly: s.poly,
      layer: s.layer,
      faceUp: s.faceUp,
    })
  }
  for (const s of placed) {
    facets.push({
      id: nextId++,
      poly: s.poly,
      layer: s.layer,
      faceUp: s.faceUp,
    })
  }

  return {
    valid: true,
    tie,
    movingSign,
    areaPos,
    areaNeg,
    paper: { facets, creases, nextId },
    moving: moving.map((p) => p.poly),
    resting: stationary.map((p) => ({ poly: p.poly, layer: p.layer, faceUp: p.faceUp })),
    nx: frame.nx,
    ny: frame.ny,
    ax: frame.ax,
    ay: frame.ay,
  }
}

export interface UnfoldStep {
  unfold: true
}

export type SheetStep = FoldOp | UnfoldStep

export function isUnfold(step: unknown): step is UnfoldStep {
  return !!step && typeof step === 'object' && (step as UnfoldStep).unfold === true
}

/** Still-folded creases. Unfold removes one. Undo removes a history step instead. */
export function netFolds(steps: readonly SheetStep[]): number {
  let n = 0
  for (const step of steps) {
    if (isUnfold(step)) n = Math.max(0, n - 1)
    else n += 1
  }
  return n
}

export function openCreaseCount(steps: readonly SheetStep[]): number {
  let folds = 0
  let opens = 0
  for (const step of steps) {
    if (isUnfold(step)) {
      if (folds > 0) {
        folds -= 1
        opens += 1
      }
    } else folds += 1
  }
  return opens
}

export function longestCrease(marks: CreaseMark[]): CreaseMark | null {
  let best: CreaseMark | null = null
  let bestD = 0
  for (const mark of marks) {
    const d = (mark.a.x - mark.b.x) ** 2 + (mark.a.y - mark.b.y) ** 2
    if (d > bestD) {
      bestD = d
      best = mark
    }
  }
  return best
}

function foldOnly(ops: FoldOp[], size: { width: number; height: number }): Paper {
  let paper = blankSheet(size)
  for (const op of ops) {
    const built = buildFold(paper, op)
    if (built.valid) paper = built.paper
  }
  return paper
}

/**
 * Replay folds and unfolds.
 * Unfold opens only the most recent still-folded crease and keeps that crease
 * as a mark. Later folds carry the mark with the paper that moves.
 */
export function applyOps(steps: readonly SheetStep[], size: { width: number; height: number } = SHEET): Paper {
  const folds: FoldOp[] = []
  const kept: { at: number; marks: CreaseMark[] }[] = []
  for (const step of steps) {
    if (isUnfold(step)) {
      if (!folds.length) continue
      const prior = foldOnly(folds.slice(0, -1), size)
      const built = buildFold(prior, folds[folds.length - 1])
      const added = built.valid ? built.paper.creases.slice(prior.creases.length) : []
      folds.pop()
      kept.push({ at: folds.length, marks: added.map((mark) => ({ a: { ...mark.a }, b: { ...mark.b } })) })
      continue
    }
    if (folds.length >= LIMITS.maxFolds) continue
    const op = sanitizeOp(step) ?? step
    folds.push(op)
  }
  let paper = blankSheet(size)
  const carry: CreaseMark[] = []
  const take = (at: number) => {
    for (const item of kept) if (item.at === at) carry.push(...item.marks)
  }
  for (let i = 0; i < folds.length; i++) {
    take(i)
    if (carry.length) paper = { ...paper, creases: [...paper.creases, ...carry.splice(0)] }
    const built = buildFold(paper, folds[i])
    if (!built.valid) break
    paper = built.paper
  }
  take(folds.length)
  if (carry.length) paper = { ...paper, creases: [...paper.creases, ...carry] }
  return paper
}

/** Split a mark by a crease and reflect the portion on the moving side. */
export function transformMarks(
  marks: CreaseMark[],
  frame: ReturnType<typeof lineFrame>,
  movingSign: 1 | -1,
): CreaseMark[] {
  const out: CreaseMark[] = []
  for (const mark of marks) {
    for (const part of clipSegment(mark, frame)) {
      const da = signedDistance(part.a, frame)
      const db = signedDistance(part.b, frame)
      if (Math.abs(da) < 1e-7 && Math.abs(db) < 1e-7) {
        out.push(part)
        continue
      }
      const sign: 1 | -1 = da + db >= 0 ? 1 : -1
      out.push(sign === movingSign ? { a: reflectPoint(part.a, frame), b: reflectPoint(part.b, frame) } : part)
    }
  }
  return out.filter((mark) => Math.hypot(mark.a.x - mark.b.x, mark.a.y - mark.b.y) > 1e-6)
}

function clipSegment(mark: CreaseMark, frame: ReturnType<typeof lineFrame>): CreaseMark[] {
  const da = signedDistance(mark.a, frame)
  const db = signedDistance(mark.b, frame)
  if (da === 0 || db === 0 || da * db > 0) return [mark]
  const t = da / (da - db)
  const mid = { x: mark.a.x + (mark.b.x - mark.a.x) * t, y: mark.a.y + (mark.b.y - mark.a.y) * t }
  return [
    { a: mark.a, b: mid },
    { a: mid, b: mark.b },
  ]
}

export function sanitizeOp(input: unknown): FoldOp | null {
  if (!input || typeof input !== 'object') return null
  const o = input as Record<string, unknown>
  const angle = Number(o.angle)
  const ax = Number(o.ax)
  const ay = Number(o.ay)
  if (!Number.isFinite(angle) || !Number.isFinite(ax) || !Number.isFinite(ay)) return null
  if (ax * ax + ay * ay > 1.5 * 1.5) return null
  const side: 1 | -1 = o.side === -1 ? -1 : 1
  const op: FoldOp = { angle, ax, ay, side }
  if (o.explicit === true) op.explicit = true
  return op
}

/** A crease that cuts the current sheet, near the previous angle, for the next fold. */
export function suggestCrease(paper: Paper, previous?: FoldOp): FoldOp {
  const pts = paper.facets.flatMap((facet) => facet.poly)
  const angle = previous?.angle ?? 0
  if (!pts.length) return { angle, ax: 0, ay: 0, side: 1 }
  const frame = lineFrame(angle, 0, 0)
  let min = Infinity
  let max = -Infinity
  let cx = 0
  let cy = 0
  for (const p of pts) {
    const d = p.x * frame.nx + p.y * frame.ny
    min = Math.min(min, d)
    max = Math.max(max, d)
    cx += p.x
    cy += p.y
  }
  cx /= pts.length
  cy /= pts.length
  const span = Math.max(1e-6, max - min)
  const candidates: FoldOp[] = []
  for (const frac of [0.3, 0.22, 0.42, 0.58, 0.7]) {
    const d = min + span * frac
    candidates.push({ angle, ax: frame.nx * d, ay: frame.ny * d, side: 1 })
  }
  for (const extra of [0, Math.PI / 2, Math.PI / 5, -Math.PI / 7]) {
    const ang = angle + extra
    const fr = lineFrame(ang, cx, cy)
    for (const shift of [0, 0.018, -0.018, 0.04, -0.04]) {
      candidates.push({ angle: ang, ax: cx + fr.nx * shift, ay: cy + fr.ny * shift, side: 1 })
    }
  }
  for (const op of candidates) {
    if (buildFold(paper, op).valid) return op
  }
  return { angle, ax: cx, ay: cy, side: 1 }
}

export function sanitizeOps(input: unknown): SheetStep[] {
  if (!Array.isArray(input)) return []
  const out: SheetStep[] = []
  for (const item of input.slice(0, LIMITS.maxFolds * 2)) {
    if (isUnfold(item)) {
      out.push({ unfold: true })
      continue
    }
    const op = sanitizeOp(item)
    if (op) out.push(op)
  }
  return out
}

/** Convex hull in CCW order. */
export function convexHull(points: Vec2[]): Vec2[] {
  const uniq: Vec2[] = []
  const pts = [...points].sort((p, q) => p.x - q.x || p.y - q.y)
  for (const p of pts) {
    const q = uniq[uniq.length - 1]
    if (q && Math.abs(q.x - p.x) < 1e-9 && Math.abs(q.y - p.y) < 1e-9) continue
    uniq.push(p)
  }
  if (uniq.length <= 2) return uniq
  const cross = (o: Vec2, a: Vec2, b: Vec2) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower: Vec2[] = []
  for (const p of uniq) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }
  const upper: Vec2[] = []
  for (let i = uniq.length - 1; i >= 0; i--) {
    const p = uniq[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

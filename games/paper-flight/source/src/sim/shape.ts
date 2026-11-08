/**
 * Turn stacked facets into the numbers the flight model needs.
 *
 * Mass follows 80 g/m² across facet area, so stacked layers add mass in
 * the same spot without adding planform. The planform is the union of the
 * facets on a fixed grid. The nose is chosen from the four ends of the
 * principal axes: pointier tips and tips that carry extra folded mass win,
 * so a reinforced point flies forward even if the span is wide.
 */

import { SHEET } from './constants'
import { openedPaper } from './wings'
import {
  areaMoments,
  convexHull,
  facetCentroid,
  materialArea,
  pointInConvex,
  polygonArea,
  type Paper,
  type Vec2,
} from './geometry'

export interface BodyFacet {
  poly: Vec2[]
  layer: number
  faceUp: 1 | -1
}

export interface AeroShape {
  mass: number
  materialArea: number
  planformArea: number
  meanLayers: number
  span: number
  chord: number
  aspect: number
  /** 0 sharp tip, 1 full-width leading edge. */
  bluntness: number
  /** |lateral planform centroid| / span. */
  asymmetry: number
  /** Planform centroid in the body frame. The origin is the center of mass. */
  planformCentroid: Vec2
  /** Wings raised from the sheet, radians. Zero is the flat packet. */
  dihedral: number
  /** Nose is +X. */
  xLead: number
  xTrail: number
  inertia: { xx: number; yy: number; zz: number }
  facets: BodyFacet[]
  creases: { a: Vec2; b: Vec2 }[]
  hull: Vec2[]
}

const CELL = 0.0018

export function deriveShape(input: Paper): AeroShape {
  const dihedral = input.dihedral ?? 0
  const paper = dihedral ? openedPaper(input) : input
  const mArea = Math.max(materialArea(input), 1e-8)
  const mass = SHEET.arealDensity * mArea

  let comX = 0
  let comY = 0
  for (const f of paper.facets) {
    const a = Math.abs(polygonArea(f.poly))
    const c = facetCentroid(f.poly)
    comX += a * c.x
    comY += a * c.y
  }
  comX /= mArea
  comY /= mArea

  let sxx = 0
  let syy = 0
  let sxy = 0
  for (const f of paper.facets) {
    const mom = areaMoments(f.poly)
    sxx += mom.xx
    syy += mom.yy
    sxy += mom.xy
  }
  sxx -= mArea * comX * comX
  syy -= mArea * comY * comY
  sxy -= mArea * comX * comY

  const axes = principalAxes(sxx, syy, sxy)
  const nose = pickNose(paper, comX, comY, axes, mArea)
  const leftX = -nose.y
  const leftY = nose.x

  const toBody = (p: Vec2): Vec2 => {
    const dx = p.x - comX
    const dy = p.y - comY
    return { x: dx * nose.x + dy * nose.y, y: dx * leftX + dy * leftY }
  }

  const facets: BodyFacet[] = paper.facets.map((f) => ({
    poly: f.poly.map(toBody),
    layer: f.layer,
    faceUp: f.faceUp,
  }))
  const creases = paper.creases.map((c) => ({ a: toBody(c.a), b: toBody(c.b) }))

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  const bodyPts: Vec2[] = []
  for (const f of facets) {
    for (const p of f.poly) {
      bodyPts.push(p)
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
  }

  const cols = Math.max(2, Math.ceil((maxX - minX) / CELL))
  const rows = Math.max(2, Math.ceil((maxY - minY) / CELL))
  const cellW = (maxX - minX) / cols || CELL
  const cellH = (maxY - minY) / rows || CELL
  let occupied = 0
  let sumX = 0
  let sumY = 0
  let probeLo = Infinity
  let probeHi = -Infinity
  const probeX = maxX - 0.1 * Math.max(maxX - minX, CELL)

  for (let r = 0; r < rows; r++) {
    const y = minY + (r + 0.5) * cellH
    for (let c = 0; c < cols; c++) {
      const x = minX + (c + 0.5) * cellW
      if (!covered(facets, x, y)) continue
      occupied++
      sumX += x
      sumY += y
    }
    if (covered(facets, probeX, y)) {
      if (y < probeLo) probeLo = y
      if (y > probeHi) probeHi = y
    }
  }

  const planformArea = Math.max(occupied * cellW * cellH, 1e-6)
  const span = Math.max(maxY - minY, 0.012)
  const chord = Math.max(maxX - minX, 0.012)
  const probeWidth = probeHi > probeLo ? probeHi - probeLo + cellH : span
  const bluntness = clamp((probeWidth / span - 0.04) / 0.82, 0, 1)
  const pcy = occupied ? sumY / occupied : 0
  const pcx = occupied ? sumX / occupied : 0

  let ixx = 0
  let iyy = 0
  for (const f of facets) {
    const mom = areaMoments(f.poly)
    iyy += SHEET.arealDensity * Math.abs(mom.xx)
    ixx += SHEET.arealDensity * Math.abs(mom.yy)
  }
  const floorI = mass * 0.004 * 0.004
  ixx = Math.max(ixx, floorI)
  iyy = Math.max(iyy, floorI)
  const izz = Math.max(ixx + iyy, floorI)
  const hull = convexHull(bodyPts)

  return {
    mass,
    materialArea: mArea,
    planformArea,
    meanLayers: mArea / planformArea,
    span,
    chord,
    aspect: clamp((span * span) / planformArea, 0.25, 14),
    bluntness,
    asymmetry: clamp(Math.abs(pcy) / span, 0, 1),
    planformCentroid: { x: pcx, y: pcy },
    xLead: maxX,
    xTrail: minX,
    dihedral,
    inertia: { xx: ixx, yy: iyy, zz: izz },
    facets,
    creases,
    hull: hull.length >= 3 ? hull : bodyPts.slice(0, 6),
  }
}

function covered(facets: BodyFacet[], x: number, y: number): boolean {
  for (const f of facets) if (pointInConvex(f.poly, x, y)) return true
  return false
}

function principalAxes(sxx: number, syy: number, sxy: number): [Vec2, Vec2] {
  if (Math.abs(sxy) < 1e-12 && Math.abs(sxx - syy) < 1e-12) {
    return [
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ]
  }
  const trace = sxx + syy
  const det = sxx * syy - sxy * sxy
  const root = Math.sqrt(Math.max(0, (trace * trace) / 4 - det))
  const long = trace / 2 + root
  let lx: number
  let ly: number
  if (Math.abs(sxy) < 1e-12) {
    if (sxx >= syy) {
      lx = 1
      ly = 0
    } else {
      lx = 0
      ly = 1
    }
  } else {
    lx = sxy
    ly = long - sxx
  }
  const llen = Math.hypot(lx, ly) || 1
  lx /= llen
  ly /= llen
  return [
    { x: lx, y: ly },
    { x: -ly, y: lx },
  ]
}

function pickNose(paper: Paper, comX: number, comY: number, axes: [Vec2, Vec2], mArea: number): Vec2 {
  const dirs = [
    axes[0],
    { x: -axes[0].x, y: -axes[0].y },
    axes[1],
    { x: -axes[1].x, y: -axes[1].y },
  ]
  let best = dirs[0]
  let bestScore = -Infinity
  for (const d of dirs) {
    const score = noseScore(paper, comX, comY, d, mArea)
    if (score > bestScore + 1e-9) {
      bestScore = score
      best = d
    }
  }
  return best
}

function noseScore(paper: Paper, comX: number, comY: number, dir: Vec2, mArea: number): number {
  let minP = Infinity
  let maxP = -Infinity
  const pts: { t: number; n: number }[] = []
  for (const f of paper.facets) {
    for (const p of f.poly) {
      const dx = p.x - comX
      const dy = p.y - comY
      const t = dx * dir.x + dy * dir.y
      const n = dx * -dir.y + dy * dir.x
      pts.push({ t, n })
      if (t < minP) minP = t
      if (t > maxP) maxP = t
    }
  }
  const extent = Math.max(maxP - minP, 1e-6)
  const gate = maxP - 0.14 * extent
  let nMin = Infinity
  let nMax = -Infinity
  let count = 0
  for (const p of pts) {
    if (p.t < gate) continue
    count++
    if (p.n < nMin) nMin = p.n
    if (p.n > nMax) nMax = p.n
  }
  const tipWidth = count ? nMax - nMin : extent
  let perp = 0
  for (const p of pts) perp = Math.max(perp, Math.abs(p.n))
  const span = Math.max(perp * 2, 1e-4)
  const pointiness = 1 - clamp(tipWidth / span, 0, 1)

  const massGate = maxP - 0.22 * extent
  let forward = 0
  for (const f of paper.facets) {
    const c = facetCentroid(f.poly)
    const t = (c.x - comX) * dir.x + (c.y - comY) * dir.y
    if (t >= massGate) forward += Math.abs(polygonArea(f.poly))
  }
  const layerBias = forward / mArea
  return pointiness * 1.7 + layerBias * 1.15 + extent * 0.55
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

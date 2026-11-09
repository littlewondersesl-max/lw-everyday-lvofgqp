/**
 * Adjust pose. The folded sheet stays one piece. Each flap bends around the
 * crease it already has. The whole sheet turns as a separate rigid motion.
 */

import {
  facetCentroid,
  polygonArea,
  type AdjustPose,
  type Paper,
  type Vec2,
} from './geometry'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Quat {
  x: number
  y: number
  z: number
  w: number
}

export interface PartHinge {
  ply: number
  anchor: number
  a: Vec2
  b: Vec2
  axis: Vec3
  outward: Vec2
}

export interface HingeFrame {
  a: Vec3
  b: Vec3
  axis: Vec3
}

export interface PosedFacet {
  ply: number
  layer: number
  faceUp: 1 | -1
  poly: Vec3[]
}

export const TURN_STEP = Math.PI / 12

export function partHinges(paper: Paper): PartHinge[] {
  const area = plyArea(paper)
  const hinges: PartHinge[] = []
  for (const ply of area.keys()) {
    const hinge = hingeFor(paper, ply, area)
    if (hinge) hinges.push(hinge)
  }
  return hinges
}

/** The flap a grab should bend. A joined child with no hinge of its own uses its parent. */
export function bendTarget(paper: Paper, ply: number): number | null {
  const hinged = new Set(partHinges(paper).map((hinge) => hinge.ply))
  if (hinged.has(ply)) return ply
  let current = parentOf(paper, ply)
  const seen = new Set<number>()
  while (current != null && !seen.has(current)) {
    seen.add(current)
    if (hinged.has(current)) return current
    current = parentOf(paper, current)
  }
  return null
}

export function posePaper(
  paper: Paper,
  angles: ReadonlyMap<number, number>,
): { facets: PosedFacet[]; frames: Map<number, HingeFrame> } {
  const hinges = partHinges(paper)
  const xform = new Map<number, (point: Vec3) => Vec3>()
  const frames = new Map<number, HingeFrame>()
  const visiting = new Set<number>()

  const transformOf = (ply: number): ((point: Vec3) => Vec3) => {
    const known = xform.get(ply)
    if (known) return known
    if (visiting.has(ply)) return (point) => point
    visiting.add(ply)
    const hinge = hinges.find((item) => item.ply === ply)
    let made: (point: Vec3) => Vec3
    if (!hinge) {
      const parentId = parentOf(paper, ply)
      made = parentId == null ? (point) => point : transformOf(parentId)
    } else {
      const parent = transformOf(hinge.anchor)
      const a = parent({ x: hinge.a.x, y: hinge.a.y, z: 0 })
      const b = parent({ x: hinge.b.x, y: hinge.b.y, z: 0 })
      const mid = { x: (hinge.a.x + hinge.b.x) / 2, y: (hinge.a.y + hinge.b.y) / 2, z: 0 }
      const origin = parent(mid)
      const spun = parent({ x: mid.x + hinge.axis.x, y: mid.y + hinge.axis.y, z: mid.z + hinge.axis.z })
      const axis = unit(sub(spun, origin))
      frames.set(ply, { a, b, axis })
      const angle = angles.get(ply) ?? 0
      made = (point) => {
        const placed = parent(point)
        return Math.abs(angle) < 1e-6 ? placed : rotateAbout(placed, a, axis, angle)
      }
    }
    xform.set(ply, made)
    visiting.delete(ply)
    return made
  }

  for (const ply of plyArea(paper).keys()) transformOf(ply)

  const carrier = (ply: number): ((point: Vec3) => Vec3) => {
    if (xform.has(ply)) return xform.get(ply)!
    let current = parentOf(paper, ply)
    const seen = new Set<number>([ply])
    while (current != null && !seen.has(current)) {
      seen.add(current)
      if (xform.has(current)) return xform.get(current)!
      current = parentOf(paper, current)
    }
    return (point) => point
  }

  const facets = paper.facets.map((facet) => {
    const place = carrier(facet.ply)
    const lift = 0.0012 + facet.layer * 0.0034
    const poly = facet.poly.map((point) => {
      const base = place({ x: point.x, y: point.y, z: 0 })
      const up = place({ x: point.x, y: point.y, z: 1 })
      const normal = unit(sub(up, base))
      return {
        x: base.x + normal.x * lift,
        y: base.y + normal.y * lift,
        z: base.z + normal.z * lift,
      }
    })
    return { ply: facet.ply, layer: facet.layer, faceUp: facet.faceUp, poly }
  })
  return { facets, frames }
}

export function quatOf(pose: AdjustPose): Quat {
  return normalizeQuat({ x: pose.qx, y: pose.qy, z: pose.qz, w: pose.qw })
}

/** Throw aim applied after the sheet's own orientation. Identity aim leaves the pose unchanged. */
export function composeAim(yaw: number, pitch: number, orient: Quat): Quat {
  const qPitch = axisAngle(0, 1, 0, -pitch)
  const qYaw = axisAngle(0, 0, 1, yaw)
  return mulQuat(mulQuat(qYaw, qPitch), orient)
}

export function turnQuat(q: Quat, axis: 'yaw' | 'pitch' | 'roll', delta: number): Quat {
  const spin =
    axis === 'yaw' ? axisAngle(0, 0, 1, delta) : axis === 'pitch' ? axisAngle(0, 1, 0, delta) : axisAngle(1, 0, 0, delta)
  return normalizeQuat(mulQuat(spin, q))
}

export function withTurn(pose: AdjustPose, axis: 'yaw' | 'pitch' | 'roll', delta: number): AdjustPose {
  const q = turnQuat(quatOf(pose), axis, delta)
  return { ...pose, qx: q.x, qy: q.y, qz: q.z, qw: q.w }
}

export function withPart(pose: AdjustPose, ply: number, angle: number): AdjustPose {
  const next = Math.max(-Math.PI, Math.min(Math.PI, angle))
  const parts = pose.parts.filter((part) => part.ply !== ply)
  if (Math.abs(next) > 1e-3) parts.push({ ply, angle: next })
  return { ...pose, parts }
}

export function applyQuat(q: Quat, point: Vec3): Vec3 {
  const ix = q.w * point.x + q.y * point.z - q.z * point.y
  const iy = q.w * point.y + q.z * point.x - q.x * point.z
  const iz = q.w * point.z + q.x * point.y - q.y * point.x
  const iw = -q.x * point.x - q.y * point.y - q.z * point.z
  return {
    x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
    y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
    z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x,
  }
}

export function axisAngle(x: number, y: number, z: number, angle: number): Quat {
  const h = angle * 0.5
  const s = Math.sin(h)
  return { x: x * s, y: y * s, z: z * s, w: Math.cos(h) }
}

export function mulQuat(a: Quat, b: Quat): Quat {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  }
}

export function normalizeQuat(q: Quat): Quat {
  const n = Math.hypot(q.x, q.y, q.z, q.w) || 1
  return { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n }
}

function hingeFor(paper: Paper, ply: number, area: Map<number, number>): PartHinge | null {
  const mine = area.get(ply) ?? 0
  let best: { a: Vec2; b: Vec2; len: number; anchor: number } | null = null
  for (const facet of paper.facets) {
    if (facet.ply !== ply) continue
    const poly = facet.poly
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      const len = Math.hypot(a.x - b.x, a.y - b.y)
      if (len < 0.03) continue
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const anchor = anchorAt(paper, ply, mid, area, mine)
      if (anchor == null) continue
      if (!best || len > best.len) best = { a, b, len, anchor }
    }
  }
  if (!best) return null
  const mid = { x: (best.a.x + best.b.x) / 2, y: (best.a.y + best.b.y) / 2 }
  const toward = sub2(centroid(paper, ply), mid)
  const edge = unit2({ x: best.b.x - best.a.x, y: best.b.y - best.a.y })
  let outward = { x: -edge.y, y: edge.x }
  if (outward.x * toward.x + outward.y * toward.y < 0) outward = { x: -outward.x, y: -outward.y }
  let axis = { x: edge.x, y: edge.y, z: 0 }
  if (axis.x * outward.y - axis.y * outward.x < 0) axis = { x: -axis.x, y: -axis.y, z: 0 }
  return { ply, anchor: best.anchor, a: best.a, b: best.b, axis, outward }
}

function anchorAt(
  paper: Paper,
  ply: number,
  mid: Vec2,
  area: Map<number, number>,
  mine: number,
): number | null {
  const candidates: number[] = []
  const seen = new Set<number>()
  for (const facet of paper.facets) {
    if (facet.ply === ply || seen.has(facet.ply)) continue
    seen.add(facet.ply)
    if ((area.get(facet.ply) ?? 0) < mine * 1.15) continue
    if (!edgeNearPly(paper, facet.ply, mid)) continue
    candidates.push(facet.ply)
  }
  const parent = parentOf(paper, ply)
  if (parent != null && candidates.includes(parent)) return parent
  let best: number | null = null
  let bestArea = 0
  for (const id of candidates) {
    const size = area.get(id) ?? 0
    if (size > bestArea) {
      best = id
      bestArea = size
    }
  }
  return best
}

function edgeNearPly(paper: Paper, ply: number, mid: Vec2): boolean {
  for (const facet of paper.facets) {
    if (facet.ply !== ply) continue
    const poly = facet.poly
    for (let i = 0; i < poly.length; i++) {
      if (segmentDistance(mid, poly[i], poly[(i + 1) % poly.length]) <= 0.005) return true
    }
  }
  return false
}

function plyArea(paper: Paper): Map<number, number> {
  const area = new Map<number, number>()
  for (const facet of paper.facets) {
    area.set(facet.ply, (area.get(facet.ply) ?? 0) + Math.abs(polygonArea(facet.poly)))
  }
  return area
}

function parentOf(paper: Paper, ply: number): number | null {
  const facet = paper.facets.find((item) => item.ply === ply)
  return facet ? facet.plyParent : null
}

function centroid(paper: Paper, ply: number): Vec2 {
  let x = 0
  let y = 0
  let weight = 0
  for (const facet of paper.facets) {
    if (facet.ply !== ply) continue
    const area = Math.abs(polygonArea(facet.poly))
    const center = facetCentroid(facet.poly)
    x += center.x * area
    y += center.y * area
    weight += area
  }
  if (weight < 1e-8) return { x: 0, y: 0 }
  return { x: x / weight, y: y / weight }
}

function rotateAbout(point: Vec3, origin: Vec3, axis: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const vx = point.x - origin.x
  const vy = point.y - origin.y
  const vz = point.z - origin.z
  const dot = vx * axis.x + vy * axis.y + vz * axis.z
  const cx = axis.y * vz - axis.z * vy
  const cy = axis.z * vx - axis.x * vz
  const cz = axis.x * vy - axis.y * vx
  return {
    x: origin.x + vx * c + cx * s + axis.x * dot * (1 - c),
    y: origin.y + vy * c + cy * s + axis.y * dot * (1 - c),
    z: origin.z + vz * c + cz * s + axis.z * dot * (1 - c),
  }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function sub2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y }
}

function unit(v: Vec3): Vec3 {
  const n = Math.hypot(v.x, v.y, v.z) || 1
  return { x: v.x / n, y: v.y / n, z: v.z / n }
}

function unit2(v: Vec2): Vec2 {
  const n = Math.hypot(v.x, v.y) || 1
  return { x: v.x / n, y: v.y / n }
}

function segmentDistance(p: Vec2, a: Vec2, b: Vec2) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = dx * dx + dy * dy || 1
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

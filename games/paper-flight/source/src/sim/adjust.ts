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
  const hinges: PartHinge[] = []
  for (const ply of plyArea(paper).keys()) {
    const hinge = hingeFor(paper, ply)
    if (hinge) hinges.push(hinge)
  }
  const drop = new Set<number>()
  for (const hinge of hinges) {
    const back = hinges.find((other) => other.ply === hinge.anchor && other.anchor === hinge.ply)
    if (!back || drop.has(hinge.ply) || drop.has(back.ply)) continue
    const keep = meanLayer(paper, hinge.ply) >= meanLayer(paper, back.ply) ? hinge.ply : back.ply
    drop.add(keep === hinge.ply ? back.ply : hinge.ply)
  }
  return hinges.filter((hinge) => !drop.has(hinge.ply))
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
    const poly = facet.poly.map((point) => {
      const base = place({ x: point.x, y: point.y, z: 0 })
      const seam = hinges.some((hinge) => segmentDistance(point, hinge.a, hinge.b) < 0.0016)
      // The crease is one line. A layer's face sits a hair off it, so the
      // stack reads as one sheet instead of a pile of plates.
      const lift = seam ? 0 : 0.00016 * (facet.layer + 1)
      if (lift === 0) return base
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

/** A flap opens away from the sheet it lies on, and stops before it crosses other paper. */
export const BEND_LIMIT = Math.PI * 0.92

export function withPart(pose: AdjustPose, ply: number, angle: number, paper?: Paper): AdjustPose {
  const next = paper ? clampBend(paper, pose, ply, angle) : Math.max(0, Math.min(BEND_LIMIT, angle))
  const parts = pose.parts.filter((part) => part.ply !== ply)
  if (next > 1e-3) parts.push({ ply, angle: next })
  return { ...pose, parts }
}

export function orbitPose(pose: AdjustPose, axis: Vec3, angle: number): AdjustPose {
  const q = normalizeQuat(mulQuat(axisAngle(axis.x, axis.y, axis.z, angle), quatOf(pose)))
  return { ...pose, qx: q.x, qy: q.y, qz: q.z, qw: q.w }
}

export function clampBend(paper: Paper, pose: AdjustPose, ply: number, angle: number): number {
  const proposed = Math.max(0, Math.min(BEND_LIMIT, angle))
  const base = new Map(pose.parts.filter((part) => part.ply !== ply).map((part) => [part.ply, part.angle]))
  const at = (value: number) => {
    const angles = new Map(base)
    if (value > 1e-4) angles.set(ply, value)
    return angles
  }
  if (!crosses(paper, at(proposed), ply)) return proposed
  let lo = 0
  let hi = proposed
  for (let step = 0; step < 10; step++) {
    const mid = (lo + hi) / 2
    if (crosses(paper, at(mid), ply)) hi = mid
    else lo = mid
  }
  return lo
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

function hingeFor(paper: Paper, ply: number): PartHinge | null {
  const parent = parentOf(paper, ply)
  let best: { a: Vec2; b: Vec2; anchor: number; len: number } | null = null
  for (const edge of plyEdges(paper, ply)) {
    if (edge.len < 0.025 || !oneSided(paper, ply, edge.a, edge.b)) continue
    const mid = { x: (edge.a.x + edge.b.x) / 2, y: (edge.a.y + edge.b.y) / 2 }
    let anchor: number | null = null
    if (parent != null && edgeNearPly(paper, parent, mid, 0.0022)) anchor = parent
    else anchor = lyingOn(paper, ply, mid)
    if (anchor == null) continue
    if (!best || edge.len > best.len) best = { a: edge.a, b: edge.b, anchor, len: edge.len }
  }
  if (!best) return null
  const spun = hingeAxis(paper, ply, best.a, best.b)
  // A flap under another sheet opens downward, away from that sheet. A flap on top opens upward.
  if (meanLayer(paper, ply) + 0.25 < meanLayer(paper, best.anchor)) {
    spun.axis = { x: -spun.axis.x, y: -spun.axis.y, z: 0 }
  }
  return { ply, anchor: best.anchor, a: best.a, b: best.b, axis: spun.axis, outward: spun.outward }
}

function plyEdges(paper: Paper, ply: number): { a: Vec2; b: Vec2; len: number }[] {
  const edges: { a: Vec2; b: Vec2; len: number }[] = []
  for (const facet of paper.facets) {
    if (facet.ply !== ply) continue
    const poly = facet.poly
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      edges.push({ a, b, len: Math.hypot(a.x - b.x, a.y - b.y) })
    }
  }
  return edges
}

function oneSided(paper: Paper, ply: number, a: Vec2, b: Vec2): boolean {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const nx = -(b.y - a.y) / len
  const ny = (b.x - a.x) / len
  let min = Infinity
  let max = -Infinity
  for (const facet of paper.facets) {
    if (facet.ply !== ply) continue
    for (const point of facet.poly) {
      const side = (point.x - a.x) * nx + (point.y - a.y) * ny
      min = Math.min(min, side)
      max = Math.max(max, side)
    }
  }
  const tol = 0.002
  return (min < -tol) !== (max > tol) && Math.max(Math.abs(min), max) > 0.004
}

/** The sheet this flap is folded against: the larger ply on this crease whose layer is nearest. */
function lyingOn(paper: Paper, ply: number, mid: Vec2): number | null {
  const mineLayer = meanLayer(paper, ply)
  const mineArea = plyArea(paper).get(ply) ?? 0
  let best: number | null = null
  let bestGap = Infinity
  const seen = new Set<number>()
  for (const facet of paper.facets) {
    if (facet.ply === ply || seen.has(facet.ply)) continue
    seen.add(facet.ply)
    if ((plyArea(paper).get(facet.ply) ?? 0) <= mineArea) continue
    if (!edgeNearPly(paper, facet.ply, mid, 0.0022)) continue
    const gap = Math.abs(meanLayer(paper, facet.ply) - mineLayer)
    if (gap < bestGap - 0.05) {
      best = facet.ply
      bestGap = gap
    }
  }
  return best
}

function meanLayer(paper: Paper, ply: number): number {
  const layers = paper.facets.filter((facet) => facet.ply === ply).map((facet) => facet.layer)
  if (!layers.length) return 0
  return layers.reduce((sum, layer) => sum + layer, 0) / layers.length
}

function hingeAxis(paper: Paper, ply: number, a: Vec2, b: Vec2): { axis: Vec3; outward: Vec2 } {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const toward = sub2(centroid(paper, ply), mid)
  const edge = unit2({ x: b.x - a.x, y: b.y - a.y })
  let outward = { x: -edge.y, y: edge.x }
  if (outward.x * toward.x + outward.y * toward.y < 0) outward = { x: -outward.x, y: -outward.y }
  let axis = { x: edge.x, y: edge.y, z: 0 }
  if (axis.x * outward.y - axis.y * outward.x < 0) axis = { x: -axis.x, y: -axis.y, z: 0 }
  return { axis, outward }
}

function edgeNearPly(paper: Paper, ply: number, mid: Vec2, tol: number): boolean {
  for (const facet of paper.facets) {
    if (facet.ply !== ply) continue
    const poly = facet.poly
    for (let i = 0; i < poly.length; i++) {
      if (segmentDistance(mid, poly[i], poly[(i + 1) % poly.length]) <= tol) return true
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

function crosses(paper: Paper, angles: Map<number, number>, ply: number): boolean {
  const posed = posePaper(paper, angles)
  const moving = movedPlies(partHinges(paper), ply)
  const tris: Tri[] = []
  for (const facet of posed.facets) {
    const poly = facet.poly
    for (let i = 1; i < poly.length - 1; i++) {
      const a = poly[0]
      const b = poly[i]
      const c = poly[i + 1]
      tris.push({ ply: facet.ply, a, b, c, n: triNormal(a, b, c) })
    }
  }
  for (const left of tris) {
    if (!moving.has(left.ply)) continue
    for (const right of tris) {
      if (moving.has(right.ply)) continue
      if (Math.abs(dot3(left.n, right.n)) > 0.96) continue
      if (sharesEdge(left, right)) continue
      if (trianglesCross(left, right)) return true
    }
  }
  return false
}

function movedPlies(hinges: PartHinge[], ply: number): Set<number> {
  const moving = new Set<number>([ply])
  let grew = true
  while (grew) {
    grew = false
    for (const hinge of hinges) {
      if (moving.has(hinge.anchor) && !moving.has(hinge.ply)) {
        moving.add(hinge.ply)
        grew = true
      }
    }
  }
  return moving
}

interface Tri {
  ply: number
  a: Vec3
  b: Vec3
  c: Vec3
  n: Vec3
}

function trianglesCross(left: Tri, right: Tri): boolean {
  const d1 = [side(left.a, right), side(left.b, right), side(left.c, right)]
  if (d1.every((value) => value >= -1e-4) || d1.every((value) => value <= 1e-4)) return false
  const d2 = [side(right.a, left), side(right.b, left), side(right.c, left)]
  if (d2.every((value) => value >= -1e-4) || d2.every((value) => value <= 1e-4)) return false
  return segmentsOverlap(left, d1, right) && segmentsOverlap(right, d2, left)
}

function side(point: Vec3, tri: Tri): number {
  return dot3(tri.n, sub(point, tri.a))
}

function segmentsOverlap(tri: Tri, depth: number[], other: Tri): boolean {
  const points = [tri.a, tri.b, tri.c]
  let a: Vec3 | null = null
  let b: Vec3 | null = null
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3
    if (depth[i] * depth[j] > 0) continue
    const denom = depth[i] - depth[j]
    const t = Math.abs(denom) < 1e-8 ? 0 : depth[i] / denom
    const hit = {
      x: points[i].x + (points[j].x - points[i].x) * t,
      y: points[i].y + (points[j].y - points[i].y) * t,
      z: points[i].z + (points[j].z - points[i].z) * t,
    }
    if (!a) a = hit
    else b = hit
  }
  if (!a || !b) return false
  return pointInTri(a, other) || pointInTri(b, other) || pointInTri(mid3(a, b), other)
}

function pointInTri(point: Vec3, tri: Tri): boolean {
  const area = (p: Vec3, q: Vec3, r: Vec3) => dot3(tri.n, cross(sub(q, p), sub(r, p)))
  const whole = area(tri.a, tri.b, tri.c)
  if (Math.abs(whole) < 1e-12) return false
  const u = area(point, tri.b, tri.c) / whole
  const v = area(tri.a, point, tri.c) / whole
  const w = area(tri.a, tri.b, point) / whole
  return u >= -0.02 && v >= -0.02 && w >= -0.02 && u + v + w <= 1.05
}

function sharesEdge(left: Tri, right: Tri): boolean {
  let close = 0
  for (const p of [left.a, left.b, left.c]) {
    for (const q of [right.a, right.b, right.c]) {
      if ((p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2 < 0.0025 ** 2) {
        close += 1
        break
      }
    }
  }
  return close >= 2
}

function triNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  return unit(cross(sub(b, a), sub(c, a)))
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }
}

function dot3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function mid3(a: Vec3, b: Vec3): Vec3 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }
}

function segmentDistance(p: Vec2, a: Vec2, b: Vec2) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = dx * dx + dy * dy || 1
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

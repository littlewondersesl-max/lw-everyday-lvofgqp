/**
 * Wings are the sheets that were folded back onto the packet.
 * Lifting them rotates those sheets off the packet around the hinge.
 * This is a rigid pose for preview and flight, not a new crease and not a stock airplane.
 */

import { posePaper } from './adjust'
import {
  facetCentroid,
  lineFrame,
  materialArea,
  polygonArea,
  signedDistance,
  type Paper,
  type Vec2,
} from './geometry'

export interface WingHinge {
  ply: number
  a: Vec2
  b: Vec2
  /** Unit direction, in the sheet plane, from the hinge toward the opened wing. */
  outward: Vec2
}

export interface PosedVertex extends Vec2 {
  z: number
}

export function wingHinges(paper: Paper): WingHinge[] {
  const areaOf = new Map<number, number>()
  const box = new Map<number, { minX: number; maxX: number; minY: number; maxY: number }>()
  for (const facet of paper.facets) {
    areaOf.set(facet.ply, (areaOf.get(facet.ply) ?? 0) + Math.abs(polygonArea(facet.poly)))
    const span = box.get(facet.ply) ?? { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    for (const point of facet.poly) {
      span.minX = Math.min(span.minX, point.x)
      span.maxX = Math.max(span.maxX, point.x)
      span.minY = Math.min(span.minY, point.y)
      span.maxY = Math.max(span.maxY, point.y)
    }
    box.set(facet.ply, span)
  }
  let fuselage = 0
  let fuselageArea = -1
  for (const [ply, area] of areaOf) {
    if (area > fuselageArea) {
      fuselage = ply
      fuselageArea = area
    }
  }
  const total = materialArea(paper)
  const body = paper.facets.filter((facet) => facet.ply === fuselage)
  const hinges: WingHinge[] = []
  for (const [ply, area] of areaOf) {
    const frac = area / total
    const span = box.get(ply)
    if (!span || ply === fuselage || frac < 0.08 || frac > 0.28) continue
    const long = Math.max(span.maxX - span.minX, span.maxY - span.minY)
    const short = Math.min(span.maxX - span.minX, span.maxY - span.minY)
    // Nose darts are compact. A wing folded along the body is a long strip.
    if (short < 1e-4 || long / short < 2.4) continue
    const hinge = hingeOf(paper, ply, body)
    if (!hinge) continue
    const hingeLen = Math.hypot(hinge.a.x - hinge.b.x, hinge.a.y - hinge.b.y)
    if (hingeLen < 0.08 || hingeLen / short < 1.6) continue
    hinges.push(hinge)
  }
  return hinges
}

export function canLift(paper: Paper): boolean {
  return wingHinges(paper).length > 0
}

export function poseFacets(paper: Paper): { ply: number; layer: number; faceUp: 1 | -1; poly: PosedVertex[] }[] {
  if (paper.adjust) {
    const angles = new Map(paper.adjust.parts.map((part) => [part.ply, part.angle]))
    return posePaper(paper, angles).facets
  }
  const angle = paper.dihedral ?? 0
  const hinges = angle > 0.01 ? new Map(wingHinges(paper).map((hinge) => [hinge.ply, hinge])) : new Map()
  return paper.facets.map((facet) => {
    const hinge = hinges.get(facet.ply)
    const poly = hinge
      ? facet.poly.map((point) => liftPoint(point, hinge, angle, facet.layer))
      : facet.poly.map((point) => ({ x: point.x, y: point.y, z: 0.0012 + facet.layer * 0.0034 }))
    return { ply: facet.ply, layer: facet.layer, faceUp: facet.faceUp, poly }
  })
}

/** Flat sheet whose wing sheets are drawn in their opened positions. Area of each sheet is unchanged. */
export function openedPaper(paper: Paper): Paper {
  if (!paper.dihedral) return paper
  const posed = poseFacets(paper)
  return {
    ...paper,
    facets: paper.facets.map((facet, index) => ({
      ...facet,
      poly: posed[index].poly.map((point) => ({ x: point.x, y: point.y })),
    })),
  }
}

function hingeOf(paper: Paper, ply: number, body: Paper['facets']): WingHinge | null {
  const wings = paper.facets.filter((facet) => facet.ply === ply)
  let best: { a: Vec2; b: Vec2; len: number } | null = null
  for (const facet of wings) {
    const poly = facet.poly
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      const len = Math.hypot(a.x - b.x, a.y - b.y)
      if (len < 0.03) continue
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const alongCrease = paper.creases.some((mark) => segmentDistance(mid, mark.a, mark.b) < 0.004)
      const alongBody = body.some((facet) =>
        facet.poly.some((start, index) => segmentDistance(mid, start, facet.poly[(index + 1) % facet.poly.length]) < 0.004),
      )
      if (!alongCrease && !alongBody) continue
      if (!best || len > best.len) best = { a, b, len }
    }
  }
  if (!best) return null
  const frame = lineFrame(Math.atan2(best.b.y - best.a.y, best.b.x - best.a.x), best.a.x, best.a.y)
  let cx = 0
  let cy = 0
  let weight = 0
  for (const facet of body) {
    const area = Math.abs(polygonArea(facet.poly))
    const c = facetCentroid(facet.poly)
    cx += c.x * area
    cy += c.y * area
    weight += area
  }
  if (weight < 1e-8) return null
  cx /= weight
  cy /= weight
  const mid = { x: (best.a.x + best.b.x) / 2, y: (best.a.y + best.b.y) / 2 }
  const away = { x: mid.x - cx, y: mid.y - cy }
  const dot = away.x * frame.nx + away.y * frame.ny
  const outward = dot >= 0 ? { x: frame.nx, y: frame.ny } : { x: -frame.nx, y: -frame.ny }
  return { ply, a: best.a, b: best.b, outward }
}

function liftPoint(point: Vec2, hinge: WingHinge, dihedral: number, layer: number): PosedVertex {
  const frame = lineFrame(Math.atan2(hinge.b.y - hinge.a.y, hinge.b.x - hinge.a.x), hinge.a.x, hinge.a.y)
  const d = signedDistance(point, frame)
  const dist = Math.abs(d)
  const onX = point.x - d * frame.nx
  const onY = point.y - d * frame.ny
  const cos = Math.cos(dihedral)
  const sin = Math.sin(dihedral)
  return {
    x: onX + hinge.outward.x * dist * cos,
    y: onY + hinge.outward.y * dist * cos,
    z: dist * sin + 0.002 + layer * 0.0004,
  }
}

function segmentDistance(p: Vec2, a: Vec2, b: Vec2) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = dx * dx + dy * dy || 1
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

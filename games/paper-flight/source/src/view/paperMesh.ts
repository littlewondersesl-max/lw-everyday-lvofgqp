import { dyeUnit, type Dye } from '../sim/dyes'

interface Vec3 {
  x: number
  y: number
  z: number
}

/**
 * One sheet, drawn as faces. A rim is added only on an edge that no neighbour
 * shares, so a crease stays a hinge and an internal boundary is not a cut.
 */
export function fillPaperShell(
  positions: number[],
  colors: number[],
  facets: { faceUp: 1 | -1; layer: number; poly: Vec3[] }[],
  dye: Dye,
) {
  const half = 0.00035
  facets.forEach((facet, index) => {
    const rgb = dyeUnit(facet.faceUp > 0 ? dye.paper : dye.back, facet.layer, facet.faceUp > 0)
    const rim: [number, number, number] = [rgb[0] * 0.55, rgb[1] * 0.55, rgb[2] * 0.55]
    const poly = facet.poly
    if (poly.length < 3) return
    const normal = faceNormal(poly)
    for (let i = 1; i < poly.length - 1; i++) {
      const tri = [poly[0], poly[i], poly[i + 1]]
      const top = tri.map((point) => offset(point, normal, half))
      const bottom = tri.map((point) => offset(point, normal, -half))
      pushTri(positions, colors, top[0], top[1], top[2], rgb)
      pushTri(positions, colors, bottom[0], bottom[2], bottom[1], rgb)
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 0],
      ]
      for (const [a, b] of edges) {
        if (edgeIsShared(tri[a], tri[b], facets, index)) continue
        pushTri(positions, colors, top[a], bottom[a], bottom[b], rim)
        pushTri(positions, colors, top[a], bottom[b], top[b], rim)
      }
    }
  })
}

function edgeIsShared(a: Vec3, b: Vec3, facets: { poly: Vec3[] }[], self: number): boolean {
  for (let index = 0; index < facets.length; index++) {
    if (index === self) continue
    const poly = facets[index].poly
    for (let i = 0; i < poly.length; i++) {
      const c = poly[i]
      const d = poly[(i + 1) % poly.length]
      if (pointOnSegment(a, c, d) && pointOnSegment(b, c, d)) return true
      if (pointOnSegment(c, a, b) && pointOnSegment(d, a, b)) return true
    }
  }
  return false
}

function pointOnSegment(p: Vec3, a: Vec3, b: Vec3): boolean {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const abz = b.z - a.z
  const len = abx * abx + aby * aby + abz * abz || 1
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby + (p.z - a.z) * abz) / len
  t = Math.max(0, Math.min(1, t))
  const dx = p.x - (a.x + abx * t)
  const dy = p.y - (a.y + aby * t)
  const dz = p.z - (a.z + abz * t)
  return dx * dx + dy * dy + dz * dz <= 0.0016 * 0.0016
}

function faceNormal(poly: Vec3[]): Vec3 {
  const a = poly[0]
  const b = poly[1]
  const c = poly[2]
  const ux = b.x - a.x
  const uy = b.y - a.y
  const uz = b.z - a.z
  const vx = c.x - a.x
  const vy = c.y - a.y
  const vz = c.z - a.z
  const x = uy * vz - uz * vy
  const y = uz * vx - ux * vz
  const z = ux * vy - uy * vx
  const n = Math.hypot(x, y, z) || 1
  return { x: x / n, y: y / n, z: z / n }
}

function offset(point: Vec3, normal: Vec3, distance: number): Vec3 {
  return {
    x: point.x + normal.x * distance,
    y: point.y + normal.y * distance,
    z: point.z + normal.z * distance,
  }
}

function pushTri(
  positions: number[],
  colors: number[],
  a: Vec3,
  b: Vec3,
  c: Vec3,
  rgb: [number, number, number] | number[],
) {
  positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
  colors.push(rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2])
}

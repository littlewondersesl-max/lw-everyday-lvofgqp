import { dyeUnit, type Dye } from '../sim/dyes'

interface Vec3 {
  x: number
  y: number
  z: number
}

/** A thin shell so a rotated sheet still has a visible paper face and rim. */
export function fillPaperShell(
  positions: number[],
  colors: number[],
  facets: { faceUp: 1 | -1; layer: number; poly: Vec3[] }[],
  dye: Dye,
) {
  const half = 0.0007
  for (const facet of facets) {
    const rgb = dyeUnit(facet.faceUp > 0 ? dye.paper : dye.back, facet.layer, facet.faceUp > 0)
    const rim: [number, number, number] = [rgb[0] * 0.72, rgb[1] * 0.72, rgb[2] * 0.72]
    const poly = facet.poly
    if (poly.length < 3) continue
    const normal = faceNormal(poly)
    for (let i = 1; i < poly.length - 1; i++) {
      const tri = [poly[0], poly[i], poly[i + 1]]
      const top = tri.map((point) => offset(point, normal, half))
      const bottom = tri.map((point) => offset(point, normal, -half))
      pushTri(positions, colors, top[0], top[1], top[2], rgb)
      pushTri(positions, colors, bottom[0], bottom[2], bottom[1], rgb)
      const sides: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 0],
      ]
      for (const [a, b] of sides) {
        pushTri(positions, colors, top[a], bottom[a], bottom[b], rim)
        pushTri(positions, colors, top[a], bottom[b], top[b], rim)
      }
    }
  }
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

/** Light sheet dyes. The same dye is the paper in the fold view, the hall, and the results. */

export interface Dye {
  id: string
  name: string
  /** Front of the sheet. */
  paper: string
  /** Back, after a fold flips the face. */
  back: string
  /** Darker ink for names, creases, and chips. */
  ink: string
}

export const DYES: Dye[] = [
  { id: 'sage', name: 'Sage', paper: '#d5e3c8', back: '#c3d4b2', ink: '#245c3a' },
  { id: 'clay', name: 'Clay', paper: '#f3d3c4', back: '#e4bfae', ink: '#8a3d28' },
  { id: 'slate', name: 'Slate', paper: '#d4deef', back: '#c2d0e6', ink: '#2a4578' },
  { id: 'straw', name: 'Straw', paper: '#f6e6b4', back: '#e7d49a', ink: '#7a5a16' },
  { id: 'lilac', name: 'Lilac', paper: '#e7d6ee', back: '#d4c2e2', ink: '#64386e' },
  { id: 'sea', name: 'Sea', paper: '#cfe6e3', back: '#b7d6d2', ink: '#1c5c58' },
]

const BY_ID = new Map(DYES.map((dye) => [dye.id, dye]))

export function dyeById(id: string | null | undefined): Dye {
  return BY_ID.get(id || '') ?? DYES[0]
}

export function dyeFill(dye: Dye, faceUp: boolean, layer: number): string {
  const [r, g, b] = rgb(faceUp ? dye.paper : dye.back)
  const shade = Math.min(34, layer * 8)
  return `rgb(${Math.max(36, r - shade)}, ${Math.max(36, g - shade)}, ${Math.max(36, b - shade)})`
}

export function dyeUnit(hex: string, layer: number, faceUp: boolean): [number, number, number] {
  const [r, g, b] = rgb(hex)
  const scale = (faceUp ? 1 : 0.9) * (1 - Math.min(0.22, layer * 0.045))
  return [(r / 255) * scale, (g / 255) * scale, (b / 255) * scale]
}

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

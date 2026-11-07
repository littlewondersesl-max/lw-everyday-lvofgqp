/**
 * Computer opponents use the same fold operations and the same flight
 * integrator as a person. Nothing here calls a language model.
 * A solo player meets Ivo, Nim, and Bru. Cass fills a seat only when
 * two of those are already taken.
 */

import { SHEET } from './constants'
import type { FoldOp } from './geometry'

export type ArchetypeId = 'ivo' | 'nim' | 'bru' | 'cass'

export interface Archetype {
  id: ArchetypeId
  name: string
  ops: FoldOp[]
  aim: { height: number; pitch: number; yaw: number; speed: number }
  blurb: string
}

const top = SHEET.height / 2
const side = SHEET.width / 2

export function creaseThrough(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  sideChoice: 1 | -1 = 1,
): FoldOp {
  return {
    angle: Math.atan2(y1 - y0, x1 - x0),
    ax: (x0 + x1) / 2,
    ay: (y0 + y1) / 2,
    side: sideChoice,
  }
}

/** Pointed nose, three passes. Wings stay wide. This is also the in-game guide. */
export const DART_OPS: FoldOp[] = [
  creaseThrough(0, top, -side, top - side),
  creaseThrough(0, top, side, top - side),
  creaseThrough(0, top - 0.028, -side, top - side - 0.028),
  creaseThrough(0, top - 0.028, side, top - side - 0.028),
  creaseThrough(0, top - 0.05, -side, top - side - 0.05),
  creaseThrough(0, top - 0.05, side, top - side - 0.05),
]

export const GUIDE_STEPS: { title: string; detail: string; op: FoldOp }[] = [
  {
    title: 'Left corner',
    detail: 'Lay the top-left corner across the center so the nose starts to point.',
    op: DART_OPS[0],
  },
  {
    title: 'Right corner',
    detail: 'Match it on the right. The top of the sheet should come to a point.',
    op: DART_OPS[1],
  },
  {
    title: 'Tighten the left edge',
    detail: 'A shallower crease just inside the new left edge. It stacks paper near the nose.',
    op: DART_OPS[2],
  },
  {
    title: 'Tighten the right edge',
    detail: 'Same crease on the right, so the nose stays symmetric.',
    op: DART_OPS[3],
  },
  {
    title: 'Once more on the left',
    detail: 'A last thin fold. More nose mass, still a wide wing.',
    op: DART_OPS[4],
  },
  {
    title: 'Once more on the right',
    detail: 'Mirror the last fold. Then take it to the hall and throw it your own way.',
    op: DART_OPS[5],
  },
]

export const ARCHETYPES: Archetype[] = [
  {
    id: 'ivo',
    name: 'Ivo',
    blurb: 'Full dart, nearly level, a measured throw.',
    ops: DART_OPS,
    aim: { height: 0.66, pitch: (1.2 * Math.PI) / 180, yaw: (0.8 * Math.PI) / 180, speed: 5.55 },
  },
  {
    id: 'nim',
    name: 'Nim',
    blurb: 'Only the first two corners, a softer lofted toss.',
    ops: [DART_OPS[0], DART_OPS[1]],
    aim: { height: 0.54, pitch: (1.6 * Math.PI) / 180, yaw: (-3.2 * Math.PI) / 180, speed: 5.25 },
  },
  {
    id: 'bru',
    name: 'Bru',
    blurb: 'Three crooked creases and a hard, nose-down throw.',
    ops: [
      creaseThrough(-0.09, -0.1, 0.02, 0.05),
      creaseThrough(0.06, -0.08, -0.04, 0.02),
      creaseThrough(-0.02, -0.12, 0.08, 0),
    ],
    aim: { height: 0.56, pitch: (-7 * Math.PI) / 180, yaw: (11 * Math.PI) / 180, speed: 7.9 },
  },
  {
    id: 'cass',
    name: 'Cass',
    blurb: 'Folded into a dense little brick and lofted.',
    ops: [
      { angle: Math.PI / 2, ax: 0, ay: 0, side: 1 },
      { angle: Math.PI / 2, ax: side / 2, ay: 0, side: 1 },
      { angle: 0, ax: 0, ay: top / 2, side: 1 },
    ],
    aim: { height: 0.36, pitch: (16 * Math.PI) / 180, yaw: (-5 * Math.PI) / 180, speed: 4.8 },
  },
]

export function archetypeById(id: ArchetypeId): Archetype {
  return ARCHETYPES.find((a) => a.id === id) ?? ARCHETYPES[0]
}

export const BOT_FILL: ArchetypeId[] = ['ivo', 'nim', 'bru', 'cass']

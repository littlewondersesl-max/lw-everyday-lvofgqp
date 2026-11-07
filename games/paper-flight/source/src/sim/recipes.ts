/**
 * Recipes are crease lists the folding engine can run. Pictures in the book
 * are drawn by applying these same operations, not by swapping in another shape.
 */

import { SHEET } from './constants'
import { DART_OPS, GUIDE_STEPS, creaseThrough } from './bots'
import type { FoldOp } from './geometry'

export interface RecipeStep {
  title: string
  detail: string
  op: FoldOp
}

export interface Recipe {
  id: string
  title: string
  /** What to expect in the hall, in plain language. */
  flight: string
  intro: string
  steps: RecipeStep[]
}

const top = SHEET.height / 2
const side = SHEET.width / 2

export const RECIPES: Recipe[] = [
  {
    id: 'plane',
    title: 'Beginner plane',
    flight: 'This can glide. The two corners make a point and put a little paper in the nose.',
    intro: 'From a fresh sheet, in this order. Place a step, look at the preview, then press Fold.',
    steps: GUIDE_STEPS.slice(0, 2),
  },
  {
    id: 'dart',
    title: 'Pointed dart',
    flight: 'The beginner plane, tightened twice. More of the sheet sits forward, so a level throw carries farther.',
    intro: 'Start fresh, or keep going after the beginner plane. Same creases the guide uses.',
    steps: GUIDE_STEPS,
  },
  {
    id: 'envelope',
    title: 'Envelope',
    flight: 'A letter, not a glider. The corners stack in the middle and the shape stays blunt, so it drops.',
    intro: 'Four corner folds, top pair then bottom pair. Each one is the smaller side, so the engine will fold it.',
    steps: [
      {
        title: 'Top-left corner',
        detail: 'The same corner fold as the plane. It lands inside the sheet.',
        op: DART_OPS[0],
      },
      {
        title: 'Top-right corner',
        detail: 'Match the left so the top comes to a point.',
        op: DART_OPS[1],
      },
      {
        title: 'Bottom-left corner',
        detail: 'Fold the lower left corner up toward the middle.',
        op: creaseThrough(0, -top, -side, -top + side),
      },
      {
        title: 'Bottom-right corner',
        detail: 'The last corner. You get a pointed envelope with a layered center.',
        op: creaseThrough(0, -top, side, -top + side),
      },
    ],
  },
  {
    id: 'hat',
    title: 'Flat hat',
    flight: 'This one is meant to be a hat, and it flies poorly. The sheet becomes a short, heavy band.',
    intro: 'A flat hat: half the sheet first, then a crown and a brim. It stays flat. There is no step that opens it into a hat you could wear.',
    steps: [
      {
        title: 'Fold the top down',
        detail: 'The crease cuts the sheet in half, so you may choose the side. Fold the top onto the bottom.',
        op: { angle: 0, ax: 0, ay: 0, side: 1 },
      },
      {
        title: 'Left crown',
        detail: 'Fold the new top-left corner down toward the center.',
        op: creaseThrough(0, 0, -side, -side),
      },
      {
        title: 'Right crown',
        detail: 'Match it on the right. The top becomes a shallow point.',
        op: creaseThrough(0, 0, side, -side),
      },
      {
        title: 'Brim',
        detail: 'A line near the bottom edge. The lower strip is the smaller side, so it folds up into a brim.',
        op: { angle: 0, ax: 0, ay: -top + 0.045, side: 1 },
      },
    ],
  },
]

export function recipeById(id: string): Recipe | undefined {
  return RECIPES.find((recipe) => recipe.id === id)
}

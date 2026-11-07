import { SHEET } from './constants'
import { lineFrame, type FoldOp } from './geometry'

export interface PaperSize {
  width: number
  height: number
}

export interface Stock extends PaperSize {
  id: string
  shape: 'rectangle' | 'square'
  size: 'small' | 'medium' | 'large'
  name: string
  /** Millimetres, for the label. */
  label: string
}

function mm(meters: number) {
  return Math.round(meters * 1000)
}

function stock(shape: Stock['shape'], size: Stock['size'], width: number, height: number): Stock {
  const name = shape === 'square' ? 'Square' : 'Rectangle'
  return {
    id: `${shape === 'square' ? 'square' : 'rect'}-${size}`,
    shape,
    size,
    width,
    height,
    name,
    label: `${mm(width)} × ${mm(height)} mm`,
  }
}

export const STOCKS: Stock[] = [
  stock('rectangle', 'small', 0.148, 0.21),
  stock('rectangle', 'medium', SHEET.width, SHEET.height),
  stock('rectangle', 'large', 0.297, 0.42),
  stock('square', 'small', 0.15, 0.15),
  stock('square', 'medium', 0.21, 0.21),
  stock('square', 'large', 0.3, 0.3),
]

/** Current letter rectangle. */
export const DEFAULT_STOCK = STOCKS[1]

export function stockById(id: string | null | undefined): Stock {
  return STOCKS.find((item) => item.id === id) ?? DEFAULT_STOCK
}

/** Map a crease drawn on one sheet onto another. Angle changes when the aspect changes. */
export function scaleFoldOp(op: FoldOp, from: PaperSize, to: PaperSize): FoldOp {
  if (from.width === to.width && from.height === to.height) return { ...op }
  const frame = lineFrame(op.angle, op.ax, op.ay)
  const sx = to.width / from.width
  const sy = to.height / from.height
  const x0 = op.ax * sx
  const y0 = op.ay * sy
  const x1 = (op.ax + frame.dx) * sx
  const y1 = (op.ay + frame.dy) * sy
  return { ...op, angle: Math.atan2(y1 - y0, x1 - x0), ax: x0, ay: y0 }
}

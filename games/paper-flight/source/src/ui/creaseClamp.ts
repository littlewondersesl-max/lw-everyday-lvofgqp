import { lineFrame, type FoldOp } from '../sim/geometry'
import type { PaperSize } from '../sim/stock'

/** Round handle sits this many pixels from the hub, along the crease. Not a paper distance. */
export const HANDLE_PX = 36
/** Pixels kept inside the canvas so the handle disc stays grabbable. */
export const HANDLE_MARGIN = 20

export function handleMeters(scale: number) {
  return HANDLE_PX / Math.max(scale, 1)
}

export interface SheetView {
  left: number
  top: number
  pw: number
  ph: number
  scale: number
}

export function fitSheet(w: number, h: number, stock: PaperSize): SheetView {
  const maxW = Math.max(80, w - 160)
  const maxH = Math.max(80, h - 180)
  const aspect = stock.width / stock.height
  let pw = maxW
  let ph = pw / aspect
  if (ph > maxH) {
    ph = maxH
    pw = ph * aspect
  }
  return { left: (w - pw) / 2, top: (h - ph) / 2 - 10, pw, ph, scale: pw / stock.width }
}

export function paperToScreen(view: SheetView, p: { x: number; y: number }, stock: PaperSize) {
  return {
    x: view.left + (p.x + stock.width / 2) * view.scale,
    y: view.top + (stock.height / 2 - p.y) * view.scale,
  }
}

export function screenToPaper(
  width: number,
  height: number,
  x: number,
  y: number,
  stock: PaperSize,
) {
  const view = fitSheet(width, height, stock)
  return {
    x: (x - view.left) / view.scale - stock.width / 2,
    y: stock.height / 2 - (y - view.top) / view.scale,
  }
}

/** Keep the hub and the round handle inside the canvas, including their grab margin. */
export function clampCrease(crease: FoldOp, width: number, height: number, stock: PaperSize): FoldOp {
  if (width < 80 || height < 80) return crease
  const view = fitSheet(width, height, stock)
  const frame = lineFrame(crease.angle, 0, 0)
  let ax = crease.ax
  let ay = crease.ay
  const minX = HANDLE_MARGIN
  const maxX = width - HANDLE_MARGIN
  const minY = HANDLE_MARGIN
  const maxY = height - HANDLE_MARGIN
  for (let pass = 0; pass < 4; pass++) {
    const hub = paperToScreen(view, { x: ax, y: ay }, stock)
    const reach = handleMeters(view.scale)
    const handle = paperToScreen(
      view,
      { x: ax + frame.dx * reach, y: ay + frame.dy * reach },
      stock,
    )
    let dx = 0
    let dy = 0
    for (const p of [hub, handle]) {
      if (p.x + dx < minX) dx = minX - p.x
      if (p.x + dx > maxX) dx = maxX - p.x
      if (p.y + dy < minY) dy = minY - p.y
      if (p.y + dy > maxY) dy = maxY - p.y
    }
    if (Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4) break
    ax += dx / view.scale
    ay -= dy / view.scale
  }
  return { ...crease, ax, ay }
}

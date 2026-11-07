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
  const padX = 78
  const padTop = 22
  const padBottom = 36
  const maxW = Math.max(80, w - padX * 2)
  const maxH = Math.max(80, h - padTop - padBottom)
  const aspect = stock.width / stock.height
  let pw = maxW
  let ph = pw / aspect
  if (ph > maxH) {
    ph = maxH
    pw = ph * aspect
  }
  return {
    left: (w - pw) / 2,
    top: padTop + Math.max(0, (h - padTop - padBottom - ph) / 2),
    pw,
    ph,
    scale: pw / stock.width,
  }
}

/**
 * Centimetre marks measured from the center of the original sheet.
 * Zero is that center. Positive and negative counts run outward, one centimetre apart.
 */
export function boardTickMeters(width: number, height: number, step = 0.01) {
  const along = (half: number) => {
    const n = Math.floor((half + 1e-9) / step)
    const marks: { at: number; cm: number }[] = []
    for (let i = -n; i <= n; i++) marks.push({ at: i * step, cm: i })
    return marks
  }
  return { xs: along(width / 2), ys: along(height / 2) }
}

export interface TickSpan {
  at: number
  from: number
  to: number
  major: boolean
  cm: number | null
}

/** The same sheet coordinate is marked on both opposite board edges, outside the paper. */
export function boardTickSpans(view: SheetView, sheet: { width: number; height: number }) {
  const { xs, ys } = boardTickMeters(sheet.width, sheet.height)
  const gap = 4
  const span = (at: number, from: number, outward: number, cm: number): TickSpan => {
    const major = cm % 5 === 0
    const len = major ? 12 : 6
    return { at, from, to: from + outward * len, major, cm }
  }
  const top: TickSpan[] = xs.map((mark) => {
    const x = paperToScreen(view, { x: mark.at, y: 0 }, sheet).x
    return span(x, view.top - gap, -1, mark.cm)
  })
  const bottom: TickSpan[] = xs.map((mark) => {
    const x = paperToScreen(view, { x: mark.at, y: 0 }, sheet).x
    return span(x, view.top + view.ph + gap, 1, mark.cm)
  })
  const left: TickSpan[] = ys.map((mark) => {
    const y = paperToScreen(view, { x: 0, y: mark.at }, sheet).y
    return span(y, view.left - gap, -1, mark.cm)
  })
  const right: TickSpan[] = left.map((tick) => {
    const len = tick.major ? 12 : 6
    return { at: tick.at, from: view.left + view.pw + gap, to: view.left + view.pw + gap + len, major: tick.major, cm: tick.cm }
  })
  return { top, bottom, left, right }
}

export function paperToScreen(view: SheetView, p: { x: number; y: number }, stock: { width: number; height: number }) {
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

import { SHEET } from '../sim/constants'
import { dyeFill, type Dye } from '../sim/dyes'
import {
  applyOps,
  buildFold,
  lineFrame,
  reflectPoint,
  type FoldOp,
  type Paper,
  type Vec2,
} from '../sim/geometry'

export function drawMini(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ops: FoldOp[],
  dye: Dye,
  crease?: FoldOp,
  showLanding = false,
) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#f3ead8'
  ctx.fillRect(0, 0, w, h)
  const view = fit(w, h, 10)
  const paper = applyOps(ops)
  drawPaper(ctx, view, paper, dye)
  if (!crease) return
  const built = buildFold(paper, crease)
  if (!built.valid) return
  if (showLanding) {
    ctx.save()
    ctx.globalAlpha = 0.72
    for (const poly of built.moving) {
      path(ctx, view, poly.map((p) => reflectPoint(p, lineFrame(crease.angle, crease.ax, crease.ay))))
      ctx.fillStyle = dyeFill(dye, false, 1)
      ctx.fill()
    }
    ctx.restore()
  } else {
    ctx.save()
    ctx.globalAlpha = 0.35
    for (const poly of built.moving) {
      path(ctx, view, poly)
      ctx.fillStyle = dye.ink
      ctx.fill()
    }
    ctx.restore()
  }
  strokeCrease(ctx, view, crease, dye.ink)
}

/** The handle, drawn the same way as on the folding desk. */
export function drawLesson(ctx: CanvasRenderingContext2D, w: number, h: number, kind: 'move' | 'rotate', dye: Dye) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#f3ead8'
  ctx.fillRect(0, 0, w, h)
  const view = fit(w, h, 16)
  drawPaper(ctx, view, applyOps([]), dye)
  const angle = kind === 'move' ? 0.9 : 1.15
  const from = { angle, ax: -0.02, ay: 0.01, side: 1 as const }
  const to =
    kind === 'move'
      ? { ...from, ax: 0.035, ay: -0.03 }
      : { ...from, angle: from.angle + 0.9 }
  strokeCrease(ctx, view, from, dye.ink, 0.35)
  strokeCrease(ctx, view, to, dye.ink, 1)
  const a = paperToScreen(view, { x: from.ax, y: from.ay })
  const b = paperToScreen(view, { x: to.ax, y: to.ay })
  ctx.save()
  ctx.strokeStyle = dye.ink
  ctx.fillStyle = dye.ink
  ctx.lineWidth = 1.5
  if (kind === 'move') {
    arrow(ctx, a.x, a.y, b.x, b.y)
  } else {
    ctx.beginPath()
    ctx.arc(a.x, a.y, 28, from.angle, to.angle, false)
    ctx.stroke()
    const frame = lineFrame(to.angle, to.ax, to.ay)
    const handle = paperToScreen(view, { x: to.ax + frame.dx * 0.12, y: to.ay + frame.dy * 0.12 })
    arrow(ctx, a.x + 26, a.y - 8, handle.x, handle.y)
  }
  ctx.restore()
}

function drawPaper(ctx: CanvasRenderingContext2D, view: View, paper: Paper, dye: Dye) {
  const facets = [...paper.facets].sort((a, b) => a.layer - b.layer)
  for (const facet of facets) {
    path(ctx, view, facet.poly)
    ctx.fillStyle = dyeFill(dye, facet.faceUp > 0, facet.layer)
    ctx.fill()
    ctx.strokeStyle = dye.ink
    ctx.globalAlpha = 0.4
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  ctx.strokeStyle = dye.ink
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 1
  for (const crease of paper.creases) {
    const a = paperToScreen(view, crease.a)
    const b = paperToScreen(view, crease.b)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function strokeCrease(ctx: CanvasRenderingContext2D, view: View, crease: FoldOp, ink: string, alpha = 1) {
  const frame = lineFrame(crease.angle, crease.ax, crease.ay)
  const len = 0.22
  const a = paperToScreen(view, { x: crease.ax - frame.dx * len, y: crease.ay - frame.dy * len })
  const b = paperToScreen(view, { x: crease.ax + frame.dx * len, y: crease.ay + frame.dy * len })
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = ink
  ctx.fillStyle = ink
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.setLineDash([])
  const hub = paperToScreen(view, { x: crease.ax, y: crease.ay })
  ctx.beginPath()
  ctx.arc(hub.x, hub.y, 3.5, 0, Math.PI * 2)
  ctx.fill()
  const handle = paperToScreen(view, { x: crease.ax + frame.dx * 0.07, y: crease.ay + frame.dy * 0.07 })
  ctx.beginPath()
  ctx.arc(handle.x, handle.y, 4.5, 0, Math.PI * 2)
  ctx.fillStyle = '#f7f3ea'
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const ang = Math.atan2(y1 - y0, x1 - x0)
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - 7 * Math.cos(ang - 0.4), y1 - 7 * Math.sin(ang - 0.4))
  ctx.lineTo(x1 - 7 * Math.cos(ang + 0.4), y1 - 7 * Math.sin(ang + 0.4))
  ctx.closePath()
  ctx.fill()
}

interface View {
  left: number
  top: number
  scale: number
}

function fit(w: number, h: number, margin: number): View {
  const maxW = w - margin * 2
  const maxH = h - margin * 2
  const aspect = SHEET.width / SHEET.height
  let pw = maxW
  let ph = pw / aspect
  if (ph > maxH) {
    ph = maxH
    pw = ph * aspect
  }
  return { left: (w - pw) / 2, top: (h - ph) / 2, scale: pw / SHEET.width }
}

function paperToScreen(view: View, p: Vec2) {
  return {
    x: view.left + (p.x + SHEET.width / 2) * view.scale,
    y: view.top + (SHEET.height / 2 - p.y) * view.scale,
  }
}

function path(ctx: CanvasRenderingContext2D, view: View, poly: Vec2[]) {
  ctx.beginPath()
  poly.forEach((p, i) => {
    const s = paperToScreen(view, p)
    if (i === 0) ctx.moveTo(s.x, s.y)
    else ctx.lineTo(s.x, s.y)
  })
  ctx.closePath()
}

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

/** A and B on the edge, or a straight drag toward that limit. */
export function drawLesson(ctx: CanvasRenderingContext2D, w: number, h: number, kind: 'move' | 'rotate', dye: Dye) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#f3ead8'
  ctx.fillRect(0, 0, w, h)
  const view = fit(w, h, 16)
  drawPaper(ctx, view, applyOps([]), dye)
  const a = { x: -SHEET.width / 2, y: 0.04 }
  const b = { x: SHEET.width / 2, y: -0.03 }
  const sa = paperToScreen(view, a)
  const sb = paperToScreen(view, b)
  ctx.save()
  ctx.strokeStyle = dye.ink
  ctx.fillStyle = dye.ink
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(sa.x, sa.y)
  ctx.lineTo(sb.x, sb.y)
  ctx.stroke()
  ctx.setLineDash([])
  for (const [p, label] of [[sa, 'A'], [sb, 'B']] as const) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = '12px sans-serif'
    ctx.fillText(label, p.x + 6, p.y - 6)
  }
  if (kind === 'rotate') {
    const edge = paperToScreen(view, { x: 0, y: SHEET.height / 2 })
    const mid = paperToScreen(view, { x: 0, y: 0.05 })
    arrow(ctx, edge.x, edge.y, mid.x, mid.y)
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

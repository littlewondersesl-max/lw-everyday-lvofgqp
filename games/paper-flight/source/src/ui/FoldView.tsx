import { useEffect, useRef, useState } from 'react'
import { GUIDE_STEPS } from '../sim/bots'
import { LIMITS, SHEET } from '../sim/constants'
import { dyeFill, type Dye } from '../sim/dyes'
import {
  applyOps,
  buildFold,
  facetCentroid,
  lineFrame,
  polygonArea,
  reflectPoint,
  signedDistance,
  suggestCrease,
  type FoldOp,
  type Paper,
  type Vec2,
} from '../sim/geometry'

interface Props {
  ops: FoldOp[]
  dye: Dye
  dyes: Dye[]
  taken: string[]
  onDye: (id: string) => void
  practice: { id: number; op: FoldOp } | null
  onOps: (ops: FoldOp[]) => void
  onDone: () => void
}

type Anim = {
  from: Paper
  op: FoldOp
  started: number
}

export function FoldView({ ops, dye, dyes, taken, onDye, practice, onOps, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [crease, setCrease] = useState<FoldOp>(GUIDE_STEPS[0].op)
  const [guide, setGuide] = useState(false)
  /** null keeps the smaller side. A number forces that side of the line. */
  const [pinned, setPinned] = useState<1 | -1 | null>(null)
  const [busy, setBusy] = useState(false)
  const animRef = useRef<Anim | null>(null)
  const creaseRef = useRef<FoldOp>(crease)
  const opsRef = useRef(ops)
  const dyeRef = useRef(dye)
  opsRef.current = ops
  dyeRef.current = dye

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let frame = 0
    const draw = () => {
      frame = requestAnimationFrame(draw)
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.floor(rect.width * dpr))
      const h = Math.max(1, Math.floor(rect.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paint(ctx, rect.width, rect.height, opsRef.current, creaseRef.current, animRef.current, dyeRef.current)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (document.body.dataset.book === 'open') return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const step = event.shiftKey ? 0 : 0.004
      const turn = ((event.shiftKey ? 15 : 2) * Math.PI) / 180
      if (event.key === 'ArrowLeft') nudge(-step, 0)
      else if (event.key === 'ArrowRight') nudge(step, 0)
      else if (event.key === 'ArrowUp') nudge(0, step)
      else if (event.key === 'ArrowDown') nudge(0, -step)
      else if (event.key === 'q' || event.key === 'Q') turnCrease(turn)
      else if (event.key === 'e' || event.key === 'E') turnCrease(-turn)
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function nudge(dx: number, dy: number) {
    setCrease((c) => ({
      ...c,
      ax: clamp(c.ax + dx, -0.45, 0.45),
      ay: clamp(c.ay + dy, -0.45, 0.45),
    }))
  }
  function turnCrease(delta: number) {
    setCrease((c) => ({ ...c, angle: c.angle + delta }))
  }

  useEffect(() => {
    if (!practice) return
    setCrease(practice.op)
    setPinned(null)
  }, [practice])

  useEffect(() => {
    const paperNow = applyOps(ops)
    const trial: FoldOp = { angle: crease.angle, ax: crease.ax, ay: crease.ay, side: pinned ?? crease.side, ...(pinned != null ? { explicit: true } : {}) }
    if (buildFold(paperNow, trial).valid) return
    const open: FoldOp = { angle: crease.angle, ax: crease.ax, ay: crease.ay, side: crease.side }
    if (pinned != null && buildFold(paperNow, open).valid) {
      setPinned(null)
      return
    }
    const next = suggestCrease(paperNow, crease)
    setCrease(next)
    setPinned(null)
  }, [ops])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let drag: 'anchor' | 'rotate' | 'line' | null = null
    const down = (event: PointerEvent) => {
      if (animRef.current) return
      const p = toPaper(canvas, event.clientX, event.clientY)
      if (!p) return
      const hit = hitHandle(canvas, creaseRef.current, event.clientX, event.clientY)
      if (!hit) return
      drag = hit
      canvas.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      if (!drag) return
      const p = toPaper(canvas, event.clientX, event.clientY)
      if (!p) return
      setCrease((c) => {
        if (drag === 'rotate') {
          let angle = Math.atan2(p.y - c.ay, p.x - c.ax)
          if (event.shiftKey) {
            const step = Math.PI / 12
            angle = Math.round(angle / step) * step
          }
          return { ...c, angle }
        }
        const prev = toPaper(canvas, event.clientX - event.movementX, event.clientY - event.movementY)
        if (!prev) return c
        return {
          ...c,
          ax: clamp(c.ax + (p.x - prev.x), -0.45, 0.45),
          ay: clamp(c.ay + (p.y - prev.y), -0.45, 0.45),
        }
      })
    }
    const up = () => {
      drag = null
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
    }
  }, [])

  const paper = applyOps(ops)
  const previewOp: FoldOp = {
    angle: crease.angle,
    ax: crease.ax,
    ay: crease.ay,
    side: pinned ?? crease.side,
    ...(pinned != null ? { explicit: true } : {}),
  }
  const preview = buildFold(paper, previewOp)
  creaseRef.current = previewOp
  const smallSign: 1 | -1 = preview.areaPos <= preview.areaNeg ? 1 : -1
  const markedIsSmaller = preview.tie || preview.movingSign === smallSign
  const matched = prefixMatch(ops)

  function commit() {
    if (!preview.valid || animRef.current || ops.length >= LIMITS.maxFolds) return
    const op: FoldOp = {
      angle: crease.angle,
      ax: crease.ax,
      ay: crease.ay,
      side: preview.movingSign,
      explicit: true,
    }
    animRef.current = { from: paper, op, started: performance.now() }
    setBusy(true)
    const finish = () => {
      const current = animRef.current
      if (!current) return
      const t = (performance.now() - current.started) / 520
      if (t < 1) {
        requestAnimationFrame(finish)
        return
      }
      animRef.current = null
      setBusy(false)
      onOps([...opsRef.current, op])
    }
    requestAnimationFrame(finish)
  }

  return (
    <div className="fold" data-dye={dye.id} data-folds={ops.length}>
      <canvas ref={canvasRef} className="fold-canvas" />
      <div className="fold-readout">
        <span>{ops.length} {ops.length === 1 ? 'fold' : 'folds'}</span>
        <span>{formatDeg(crease.angle)}</span>
        {preview.valid ? (
          preview.tie ? (
            <span>Sides match. Folding the marked side across the arrow.</span>
          ) : markedIsSmaller ? (
            <span>Folding the marked side across the arrow.</span>
          ) : (
            <span>Folding the larger marked side across the arrow.</span>
          )
        ) : (
          <span>{preview.reason} Drag the line back onto the paper.</span>
        )}
      </div>
      {preview.valid && (
        <div className="side-choice" role="group" aria-label="Which side folds">
          <button
            className={preview.movingSign === 1 ? 'on' : ''}
            aria-pressed={preview.movingSign === 1}
            onClick={() => setPinned(1)}
            type="button"
          >
            {preview.movingSign === 1 ? 'Marked side' : 'Opposite side'}
          </button>
          <button
            className={preview.movingSign === -1 ? 'on' : ''}
            aria-pressed={preview.movingSign === -1}
            onClick={() => setPinned(-1)}
            type="button"
          >
            {preview.movingSign === -1 ? 'Marked side' : 'Opposite side'}
          </button>
        </div>
      )}
      <div className="dyes" role="group" aria-label="Your sheet color">
        {dyes.map((item) => {
          const used = taken.includes(item.id) && item.id !== dye.id
          return (
            <button
              key={item.id}
              type="button"
              className={item.id === dye.id ? 'on' : ''}
              disabled={used}
              style={{ background: item.paper, color: item.ink }}
              aria-label={used ? `${item.name} is taken` : `${item.name} paper`}
              aria-pressed={item.id === dye.id}
              onClick={() => onDye(item.id)}
            >
              <span>{item.name}</span>
            </button>
          )
        })}
      </div>
      <div className="fold-tools">
        <button type="button" onClick={() => onOps(ops.slice(0, -1))} disabled={!ops.length || busy}>
          Undo
        </button>
        <button type="button" onClick={() => onOps([])} disabled={!ops.length}>
          Reset
        </button>
        <button
          type="button"
          className="primary"
          onClick={commit}
          disabled={!preview.valid || busy || ops.length >= LIMITS.maxFolds}
          title={preview.valid ? 'Commit this crease. The sheet stays here for another fold.' : preview.reason}
        >
          Fold
        </button>
        {!preview.valid && (
          <button
            type="button"
            onClick={() => {
              setCrease(suggestCrease(paper, crease))
              setPinned(null)
            }}
          >
            Place on the paper
          </button>
        )}
        <button type="button" className="quiet" onClick={() => setGuide((g) => !g)}>
          {guide ? 'Hide guide' : 'Guide'}
        </button>
        <button type="button" className="go" onClick={onDone}>
          To the hall
        </button>
      </div>
      {guide && (
        <aside className="guide">
          <h2>A dart, if you want one</h2>
          <p>These creases are only a helper. Nudge them, skip them, or fold something shapeless.</p>
          <ol>
            {GUIDE_STEPS.map((step, index) => (
              <li key={step.title} className={index === matched ? 'next' : index < matched ? 'done' : ''}>
                <button
                  type="button"
                  onClick={() => {
                    setCrease(step.op)
                    setPinned(null)
                  }}
                >
                  <strong>
                    {index + 1}. {step.title}
                  </strong>
                  <span>{step.detail}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
      )}
      <p className="fold-hint">Drag the crease and spin the round handle after every fold. To the hall when you are finished. Arrows nudge. Q and E rotate.</p>
    </div>
  )
}

function prefixMatch(ops: FoldOp[]) {
  for (let i = 0; i < ops.length && i < GUIDE_STEPS.length; i++) {
    const op = ops[i]
    const step = GUIDE_STEPS[i].op
    const dAng = Math.atan2(Math.sin(op.angle - step.angle), Math.cos(op.angle - step.angle))
    const undirected = Math.min(Math.abs(dAng), Math.abs(Math.abs(dAng) - Math.PI))
    if (undirected > 0.02 || Math.hypot(op.ax - step.ax, op.ay - step.ay) > 0.004) return -1
  }
  return ops.length
}

function paint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ops: FoldOp[],
  crease: FoldOp,
  anim: Anim | null,
  dye: Dye,
) {
  ctx.clearRect(0, 0, w, h)
  const desk = ctx.createLinearGradient(0, 0, 0, h)
  desk.addColorStop(0, '#d7b48a')
  desk.addColorStop(1, '#b88858')
  ctx.fillStyle = desk
  ctx.fillRect(0, 0, w, h)
  // Soft grain.
  ctx.strokeStyle = 'rgba(90, 50, 20, 0.05)'
  ctx.lineWidth = 2
  for (let y = 12; y < h; y += 7) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y + 2)
    ctx.stroke()
  }

  const view = fit(w, h)
  const paper = anim ? anim.from : applyOps(ops)
  const t = anim ? Math.min(1, (performance.now() - anim.started) / 520) : 1
  const eased = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2
  const swing = anim ? eased * Math.PI : 0

  ctx.save()
  ctx.shadowColor = 'rgba(70, 36, 12, 0.28)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 10
  roundPath(ctx, view.left - 8, view.top - 8, view.pw + 16, view.ph + 16, 4)
  ctx.fillStyle = '#efe4cf'
  ctx.fill()
  ctx.restore()

  if (anim) {
    const built = buildFold(anim.from, anim.op)
    const frame = lineFrame(anim.op.angle, anim.op.ax, anim.op.ay)
    drawFacets(
      ctx,
      view,
      built.resting.map((f) => ({ poly: f.poly, layer: f.layer, faceUp: f.faceUp })),
      dye,
    )
    const swung = built.moving.map((poly) => poly.map((p) => swingPoint(p, frame, swing)))
    drawPolys(ctx, view, swung, dyeFill(dye, true, 1), dye.ink)
  } else {
    drawFacets(ctx, view, paper.facets, dye)
    drawCreases(ctx, view, paper.creases)
    const built = buildFold(paper, crease)
    let landing: Vec2[][] = []
    if (built.valid) {
      ctx.save()
      ctx.globalAlpha = 0.38
      drawPolys(ctx, view, built.moving, dye.ink, dye.ink)
      ctx.restore()
      const frame = lineFrame(crease.angle, crease.ax, crease.ay)
      landing = built.moving.map((poly) => poly.map((p) => reflectPoint(p, frame)))
      ctx.save()
      ctx.globalAlpha = 0.55
      drawPolys(ctx, view, landing, dyeFill(dye, false, 0), dye.ink)
      ctx.restore()
    }
    strokeLine(ctx, view, crease, built.valid ? '#1c1915' : dye.ink)
    if (built.valid) drawFoldArrow(ctx, view, built.moving, landing, '#1c1915')
  }

  drawRuler(ctx, view)
}

function drawFacets(
  ctx: CanvasRenderingContext2D,
  view: View,
  facets: { poly: Vec2[]; layer: number; faceUp: 1 | -1 }[],
  dye: Dye,
) {
  const sorted = [...facets].sort((a, b) => a.layer - b.layer)
  for (const facet of sorted) {
    pathPoly(ctx, view, facet.poly)
    ctx.fillStyle = dyeFill(dye, facet.faceUp > 0, facet.layer)
    ctx.fill()
    ctx.strokeStyle = dye.ink
    ctx.globalAlpha = 0.45
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

function drawPolys(ctx: CanvasRenderingContext2D, view: View, polys: Vec2[][], fill: string, ink: string) {
  for (const poly of polys) {
    pathPoly(ctx, view, poly)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = ink
    ctx.lineWidth = 1.25
    ctx.stroke()
  }
}

function drawCreases(ctx: CanvasRenderingContext2D, view: View, creases: { a: Vec2; b: Vec2 }[]) {
  ctx.save()
  ctx.strokeStyle = 'rgba(90, 60, 30, 0.55)'
  ctx.lineWidth = 1
  for (const c of creases) {
    const a = paperToScreen(view, c.a)
    const b = paperToScreen(view, c.b)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.restore()
}

function areaCentroid(polys: Vec2[][]): Vec2 | null {
  let weight = 0
  let x = 0
  let y = 0
  for (const poly of polys) {
    const area = Math.abs(polygonArea(poly))
    if (area < 1e-12) continue
    const c = facetCentroid(poly)
    weight += area
    x += c.x * area
    y += c.y * area
  }
  if (weight < 1e-12) return null
  return { x: x / weight, y: y / weight }
}

function drawFoldArrow(ctx: CanvasRenderingContext2D, view: View, source: Vec2[][], landing: Vec2[][], ink: string) {
  const from = areaCentroid(source)
  const to = areaCentroid(landing)
  if (!from || !to) return
  const a = paperToScreen(view, from)
  const b = paperToScreen(view, to)
  let ax = a.x
  let ay = a.y
  let bx = b.x
  let by = b.y
  const dx0 = bx - ax
  const dy0 = by - ay
  const len0 = Math.hypot(dx0, dy0) || 1
  if (len0 < 70) {
    const grow = 70 / len0
    const mx = (ax + bx) / 2
    const my = (ay + by) / 2
    ax = mx + (ax - mx) * grow
    ay = my + (ay - my) * grow
    bx = mx + (bx - mx) * grow
    by = my + (by - my) * grow
  }
  const dx = bx - ax
  const dy = by - ay
  const len = Math.hypot(dx, dy) || 1
  const bow = Math.min(78, Math.max(32, len * 0.45))
  const cx = (ax + bx) / 2 + (-dy / len) * bow
  const cy = (ay + by) / 2 + (dx / len) * bow
  const paintCurve = () => {
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.quadraticCurveTo(cx, cy, bx, by)
  }
  ctx.save()
  ctx.lineCap = 'round'
  paintCurve()
  ctx.strokeStyle = '#fffaf2'
  ctx.lineWidth = 10
  ctx.stroke()
  paintCurve()
  ctx.strokeStyle = ink
  ctx.lineWidth = 4
  ctx.stroke()
  const tx = bx - cx
  const ty = by - cy
  const tlen = Math.hypot(tx, ty) || 1
  const ux = tx / tlen
  const uy = ty / tlen
  const head = 22
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.moveTo(bx, by)
  ctx.lineTo(bx - ux * head - uy * 9, by - uy * head + ux * 9)
  ctx.lineTo(bx - ux * head + uy * 9, by - uy * head - ux * 9)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.arc(ax, ay, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#fffaf2'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = ink
  ctx.stroke()
  ctx.restore()
}

function strokeLine(ctx: CanvasRenderingContext2D, view: View, crease: FoldOp, ink: string) {
  const frame = lineFrame(crease.angle, crease.ax, crease.ay)
  const len = 0.55
  const a = paperToScreen(view, { x: crease.ax - frame.dx * len, y: crease.ay - frame.dy * len })
  const b = paperToScreen(view, { x: crease.ax + frame.dx * len, y: crease.ay + frame.dy * len })
  ctx.save()
  ctx.strokeStyle = ink
  ctx.lineWidth = 2
  ctx.setLineDash([7, 6])
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.setLineDash([])
  const anchor = paperToScreen(view, { x: crease.ax, y: crease.ay })
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(anchor.x, anchor.y, 7, 0, Math.PI * 2)
  ctx.fill()
  const handle = paperToScreen(view, {
    x: crease.ax + frame.dx * 0.16,
    y: crease.ay + frame.dy * 0.16,
  })
  ctx.beginPath()
  ctx.arc(handle.x, handle.y, 9, 0, Math.PI * 2)
  ctx.fillStyle = '#f7f3ea'
  ctx.fill()
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
}

function drawRuler(ctx: CanvasRenderingContext2D, view: View) {
  ctx.save()
  ctx.fillStyle = 'rgba(60, 36, 18, 0.7)'
  ctx.font = '12px "Segoe UI", sans-serif'
  const origin = paperToScreen(view, { x: -SHEET.width / 2, y: -SHEET.height / 2 })
  for (let cm = 0; cm <= 21; cm += 1) {
    const x = origin.x + (cm / 100) * view.scale
    const major = cm % 5 === 0
    ctx.strokeStyle = 'rgba(60, 36, 18, 0.45)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, view.top + view.ph + 6)
    ctx.lineTo(x, view.top + view.ph + (major ? 16 : 11))
    ctx.stroke()
    if (major) ctx.fillText(String(cm), x - 4, view.top + view.ph + 28)
  }
  ctx.restore()
}

function swingPoint(p: Vec2, frame: ReturnType<typeof lineFrame>, theta: number): Vec2 {
  const d = signedDistance(p, frame)
  const on = { x: p.x - d * frame.nx, y: p.y - d * frame.ny }
  const flat = Math.cos(theta)
  return { x: on.x + frame.nx * d * flat, y: on.y + frame.ny * d * flat }
}

interface View {
  left: number
  top: number
  pw: number
  ph: number
  scale: number
}

function fit(w: number, h: number): View {
  const maxW = Math.max(80, w - 160)
  const maxH = Math.max(80, h - 180)
  const aspect = SHEET.width / SHEET.height
  let pw = maxW
  let ph = pw / aspect
  if (ph > maxH) {
    ph = maxH
    pw = ph * aspect
  }
  return { left: (w - pw) / 2, top: (h - ph) / 2 - 10, pw, ph, scale: pw / SHEET.width }
}

function paperToScreen(view: View, p: Vec2) {
  return {
    x: view.left + (p.x + SHEET.width / 2) * view.scale,
    y: view.top + (SHEET.height / 2 - p.y) * view.scale,
  }
}

function toPaper(canvas: HTMLCanvasElement, clientX: number, clientY: number): Vec2 | null {
  const rect = canvas.getBoundingClientRect()
  const view = fit(rect.width, rect.height)
  const x = clientX - rect.left
  const y = clientY - rect.top
  return {
    x: (x - view.left) / view.scale - SHEET.width / 2,
    y: SHEET.height / 2 - (y - view.top) / view.scale,
  }
}

function hitHandle(canvas: HTMLCanvasElement, crease: FoldOp, clientX: number, clientY: number): 'anchor' | 'rotate' | 'line' | null {
  const rect = canvas.getBoundingClientRect()
  const view = fit(rect.width, rect.height)
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  const frame = lineFrame(crease.angle, crease.ax, crease.ay)
  const anchor = paperToScreen(view, { x: crease.ax, y: crease.ay })
  const handle = paperToScreen(view, { x: crease.ax + frame.dx * 0.16, y: crease.ay + frame.dy * 0.16 })
  if (Math.hypot(localX - handle.x, localY - handle.y) < 16) return 'rotate'
  if (Math.hypot(localX - anchor.x, localY - anchor.y) < 14) return 'anchor'
  const a = paperToScreen(view, { x: crease.ax - frame.dx, y: crease.ay - frame.dy })
  const b = paperToScreen(view, { x: crease.ax + frame.dx, y: crease.ay + frame.dy })
  const dist = pointSeg(localX, localY, a.x, a.y, b.x, b.y)
  if (dist < 12) return 'line'
  return null
}

function pointSeg(px: number, py: number, x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0
  const dy = y1 - y0
  const l2 = dx * dx + dy * dy || 1
  let t = ((px - x0) * dx + (py - y0) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy))
}

function pathPoly(ctx: CanvasRenderingContext2D, view: View, poly: Vec2[]) {
  ctx.beginPath()
  poly.forEach((p, i) => {
    const s = paperToScreen(view, p)
    if (i === 0) ctx.moveTo(s.x, s.y)
    else ctx.lineTo(s.x, s.y)
  })
  ctx.closePath()
}

function roundPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function formatDeg(angle: number) {
  const deg = Math.round(((angle * 180) / Math.PI) % 360)
  return `${(deg + 360) % 360}°`
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

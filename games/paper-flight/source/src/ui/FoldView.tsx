import { useEffect, useRef, useState } from 'react'
import { nearestSilhouette } from '../sim/abGuide'
import { GUIDE_STEPS } from '../sim/bots'
import { SHEET } from '../sim/constants'
import { dyeFill, type Dye } from '../sim/dyes'
import {
  applyOps,
  buildFold,
  isUnfold,
  lineFrame,
  netFolds,
  openCreaseCount,
  signedDistance,
  type FoldOp,
  type Paper,
  type SheetStep,
  type Vec2,
} from '../sim/geometry'
import { aimAngle, reflectFold } from '../sim/dragFold'
import { scaleFoldOp, STOCKS, stockById, type Stock } from '../sim/stock'
import { boardTickSpans, clampCrease, fitSheet, HANDLE_PX } from './creaseClamp'

const PINCH =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='M9 22c1-6 4-9 7-9 1 2 1 4 0 6 3-4 6-4 8-1 1 2-1 5-3 6l-5 3c-4 2-8 0-7-5z' fill='%23f7f3ea' stroke='%231c1915' stroke-width='1.6' stroke-linejoin='round'/%3E%3Cpath d='M14 14c1-3 3-5 5-4' fill='none' stroke='%231c1915' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E\") 8 8, grab"

interface Props {
  ops: SheetStep[]
  stock: Stock
  dye: Dye
  dyes: Dye[]
  taken: string[]
  onDye: (id: string) => void
  onStock: (id: string) => void
  onNewSheet: (id: string) => void
  practice: { id: number; op: FoldOp } | null
  onOps: (ops: SheetStep[]) => void
  onDone: () => void
}

type Anim = {
  from: Paper
  op: FoldOp
  started: number
}

export function FoldView({ ops, stock, dye, dyes, taken, onDye, onStock, onNewSheet, practice, onOps, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [crease, setCreaseState] = useState<FoldOp>({ angle: 0, ax: 0, ay: 0, side: 1 })
  const creaseRef = useRef<FoldOp>(crease)
  const previewRef = useRef<FoldOp | null>(null)
  const [helperOpen, setHelperOpen] = useState(false)
  const [draftId, setDraftId] = useState(stock.id)
  const [note, setNote] = useState<string | null>(null)
  const busy = false
  const stockRef = useRef(stock)
  stockRef.current = stock
  const animRef = useRef<Anim | null>(null)
  const opsRef = useRef(ops)
  const dyeRef = useRef(dye)
  const onOpsRef = useRef(onOps)
  opsRef.current = ops
  dyeRef.current = dye
  onOpsRef.current = onOps
  function setCrease(raw: FoldOp, lockHub = false) {
    const canvas = canvasRef.current
    const rect = canvas?.getBoundingClientRect()
    const next = !lockHub && rect && rect.width >= 80
      ? clampCrease(raw, rect.width, rect.height, stockRef.current)
      : raw
    creaseRef.current = next
    setCreaseState(next)
  }

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
      paint(ctx, rect.width, rect.height, opsRef.current, creaseRef.current, previewRef.current, animRef.current, dyeRef.current, stockRef.current)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (document.body.dataset.book === 'open') return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const step = event.shiftKey ? 0.012 : 0.004
      const turn = ((event.shiftKey ? 15 : 2) * Math.PI) / 180
      const current = creaseRef.current
      if (event.key === 'ArrowLeft') setCrease({ ...current, ax: current.ax - step })
      else if (event.key === 'ArrowRight') setCrease({ ...current, ax: current.ax + step })
      else if (event.key === 'ArrowUp') setCrease({ ...current, ay: current.ay + step })
      else if (event.key === 'ArrowDown') setCrease({ ...current, ay: current.ay - step })
      else if (event.key === 'q' || event.key === 'Q') setCrease({ ...current, angle: current.angle + turn }, true)
      else if (event.key === 'e' || event.key === 'E') setCrease({ ...current, angle: current.angle - turn }, true)
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!practice) return
    const op = scaleFoldOp(practice.op, SHEET, stockRef.current)
    setCrease({ angle: op.angle, ax: op.ax, ay: op.ay, side: 1 })
    setNote('Ruler placed. Drag a corner or an edge. Letting go folds the paper.')
  }, [practice])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let mode: 'move' | 'rotate' | 'flap' | null = null
    let grab: Vec2 | null = null
    let rotateHub: Vec2 | null = null
    let rotateAngle = 0
    const base = () => applyOps(opsRef.current, stockRef.current)
    const metrics = () => {
      const rect = canvas.getBoundingClientRect()
      const view = fit(rect.width, rect.height, stockRef.current)
      return { view, tol: 16 / Math.max(view.scale, 1) }
    }
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || animRef.current) return
      const p = toPaper(canvas, event.clientX, event.clientY, stockRef.current)
      if (!p) return
      const hit = hitRuler(canvas, creaseRef.current, event.clientX, event.clientY, stockRef.current)
      if (hit === 'rotate') {
        mode = 'rotate'
        rotateHub = { x: creaseRef.current.ax, y: creaseRef.current.ay }
        rotateAngle = creaseRef.current.angle
        canvas.setPointerCapture(event.pointerId)
        return
      }
      if (hit === 'move') {
        mode = 'move'
        canvas.setPointerCapture(event.pointerId)
        return
      }
      const edge = nearestSilhouette(base(), p, metrics().tol)
      if (!edge) return
      mode = 'flap'
      grab = edge
      canvas.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      const p = toPaper(canvas, event.clientX, event.clientY, stockRef.current)
      if (!p) return
      if (!mode) {
        const edge = nearestSilhouette(base(), p, metrics().tol)
        const overHandle = hitRuler(canvas, creaseRef.current, event.clientX, event.clientY, stockRef.current)
        canvas.style.cursor = edge && !overHandle ? PINCH : 'crosshair'
        return
      }
      const current = creaseRef.current
      if (mode === 'rotate' && rotateHub) {
        rotateAngle = aimAngle(rotateAngle, rotateHub, p)
        setCrease({ ...current, ax: rotateHub.x, ay: rotateHub.y, angle: rotateAngle }, true)
        return
      }
      if (mode === 'move') {
        const prev = toPaper(canvas, event.clientX - event.movementX, event.clientY - event.movementY, stockRef.current)
        if (!prev) return
        setCrease({ ...current, ax: current.ax + (p.x - prev.x), ay: current.ay + (p.y - prev.y) })
        return
      }
      if (mode === 'flap' && grab) {
        previewRef.current = reflectFold(base(), grab, p)?.op ?? null
      }
    }
    const up = () => {
      if (mode === 'flap') {
        const op = previewRef.current
        previewRef.current = null
        if (op) {
          setNote('Folded.')
          onOpsRef.current([...opsRef.current, op])
        }
      }
      mode = null
      grab = null
      rotateHub = null
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
    }
  }, [])

  const folds = netFolds(ops)
  const opens = openCreaseCount(ops)
  const draft = stockById(draftId)
  const stockDirty = draft.id !== stock.id
  const matched = prefixMatch(ops, stock)
  const last = lastFold(ops)

  function chooseStock(id: string) {
    setDraftId(id)
    if (netFolds(opsRef.current) === 0) onStock(id)
  }

  function placeHelper(op: FoldOp) {
    setCrease({ angle: op.angle, ax: op.ax, ay: op.ay, side: 1 })
    setNote('Ruler placed. Drag a corner or an edge. Letting go folds the paper.')
  }

  function unfold() {
    if (netFolds(opsRef.current) === 0 || animRef.current) return
    onOps([...opsRef.current, { unfold: true }])
    setNote('Opened the last fold. Its crease stays on the paper. Unfold again for the one before it.')
  }

  return (
    <div className="fold" data-dye={dye.id} data-folds={folds} data-open={opens} data-stock={stock.id} data-ax={crease.ax} data-ay={crease.ay} data-angle={crease.angle} data-fold-angle={last ? last.angle : ''}>
      <div className="fold-bar">
      <div className="fold-readout">
        <span>{folds} {folds === 1 ? 'fold' : 'folds'}</span>
        <span>{formatDeg(crease.angle)}</span>
        <span>Drag a corner or an edge. Letting go folds it. The ruler only shows a straight line.</span>
        {opens > 0 && <span>{opens} open {opens === 1 ? 'crease' : 'creases'}</span>}
      </div>
      {note && <p className="fold-note" role="status">{note}</p>}
      <p className="fold-hint">Slide the filled circle to move the ruler. Turn it with the arrows. Pinch any edge and drag. Up and down tilt the fold.</p>
      </div>
      <div className="fold-stage">
      <canvas ref={canvasRef} className="fold-canvas" />
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
      {helperOpen && (
        <aside className="guide">
          <h2>A dart, if you want one</h2>
          <p>Each of these sets the ruler. Drag the corner yourself. Moving the ruler does not fold the paper.</p>
          <ol>
            {GUIDE_STEPS.map((step, index) => (
              <li key={step.title} className={index === matched ? 'next' : index < matched ? 'done' : ''}>
                <button
                  type="button"
                  onClick={() => placeHelper(scaleFoldOp(step.op, SHEET, stock))}
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
      <fieldset className="stock">
        <legend>Sheet</legend>
        <div className="stock-row" role="group" aria-label="Sheet shape">
          {(['rectangle', 'square'] as const).map((shape) => (
            <button key={shape} type="button" className={draft.shape === shape ? 'on' : ''} aria-pressed={draft.shape === shape} onClick={() => chooseStock(STOCKS.find((item) => item.shape === shape && item.size === draft.size)?.id || draft.id)}>
              {shape === 'square' ? 'Square' : 'Rectangle'}
            </button>
          ))}
        </div>
        <div className="stock-row" role="group" aria-label="Sheet size">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button key={size} type="button" className={draft.size === size ? 'on' : ''} aria-pressed={draft.size === size} onClick={() => chooseStock(STOCKS.find((item) => item.shape === draft.shape && item.size === size)?.id || draft.id)}>
              {size === 'small' ? 'Small' : size === 'medium' ? 'Medium' : 'Large'}
            </button>
          ))}
        </div>
        <p>{draft.name} · {draft.label}{stockDirty ? '' : ' · this sheet'}</p>
        {stockDirty && folds > 0 && (
          <button type="button" onClick={() => { setNote(null); onNewSheet(draft.id) }}>New sheet</button>
        )}
        {stockDirty && folds > 0 && <p>New sheet clears these folds.</p>}
      </fieldset>
      </div>
      <div className="fold-dock">
      <div className="fold-tools">
        <button type="button" onClick={() => { setNote(null); onOps(ops.slice(0, -1)) }} disabled={!ops.length || busy} title="Take back the last fold">
          Undo
        </button>
        <button type="button" className="unfold" onClick={unfold} disabled={folds === 0 || busy} title="Open the last fold and keep its crease on the paper">
          Unfold
        </button>
        <button type="button" onClick={() => { setNote(null); onOps([]) }} disabled={!ops.length || busy} title="Clear every fold and every open crease">
          Reset
        </button>
        <button type="button" className="quiet" onClick={() => setHelperOpen((g) => !g)}>
          {helperOpen ? 'Hide guide' : 'Guide'}
        </button>
        <button type="button" className="go" onClick={() => onDone()}>
          To the hall
        </button>
      </div>
      </div>
    </div>
  )
}

function lastFold(steps: SheetStep[]): FoldOp | null {
  const ops: FoldOp[] = []
  for (const step of steps) {
    if (isUnfold(step)) ops.pop()
    else ops.push(step)
  }
  return ops.length ? ops[ops.length - 1] : null
}

function prefixMatch(steps: SheetStep[], stock: Stock) {
  const ops: FoldOp[] = []
  for (const step of steps) {
    if (isUnfold(step)) ops.pop()
    else ops.push(step)
  }
  const guide = GUIDE_STEPS.map((step) => scaleFoldOp(step.op, SHEET, stock))
  for (let i = 0; i < ops.length && i < guide.length; i++) {
    const op = ops[i]
    const step = guide[i]
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
  ops: SheetStep[],
  crease: FoldOp,
  preview: FoldOp | null,
  anim: Anim | null,
  dye: Dye,
  stock: Stock,
) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#2c2825'
  ctx.fillRect(0, 0, w, h)

  const view = fit(w, h, stock)
  const paper = anim ? anim.from : applyOps(ops, stock)
  const t = anim ? Math.min(1, (performance.now() - anim.started) / 520) : 1
  const eased = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2
  const swing = anim ? eased * Math.PI : 0

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
  ctx.shadowBlur = 22
  ctx.shadowOffsetY = 10
  roundPath(ctx, view.left, view.top, view.pw, view.ph, 2)
  ctx.fillStyle = '#2c2825'
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
    const shown = preview ? buildFold(paper, preview) : null
    const drawing = shown?.valid ? shown.paper : paper
    drawFacets(ctx, view, drawing.facets, dye)
    drawCreases(ctx, view, shown?.valid ? shown.paper.creases : paper.creases)
    drawRuler(ctx, view, crease, stock, w, h)
  }

  drawBoardTicks(ctx, view)
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
    ctx.strokeStyle = '#1a1612'
    ctx.globalAlpha = 1
    ctx.lineWidth = 1.4
    ctx.stroke()
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

function drawRuler(
  ctx: CanvasRenderingContext2D,
  view: View,
  crease: FoldOp,
  stock: Stock,
  width: number,
  height: number,
) {
  const frame = lineFrame(crease.angle, crease.ax, crease.ay)
  const span = clipToSheet(crease.ax, crease.ay, frame.dx, frame.dy, stock.width / 2, stock.height / 2)
  const a = span ? span[0] : { x: crease.ax - frame.dx * 0.08, y: crease.ay - frame.dy * 0.08 }
  const b = span ? span[1] : { x: crease.ax + frame.dx * 0.08, y: crease.ay + frame.dy * 0.08 }
  const sa = paperToScreen(view, a)
  const sb = paperToScreen(view, b)
  const dx = sb.x - sa.x
  const dy = sb.y - sa.y
  const len = Math.hypot(dx, dy) || 1
  const px = -dy / len
  const py = dx / len
  const half = 7
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(sa.x + px * half, sa.y + py * half)
  ctx.lineTo(sb.x + px * half, sb.y + py * half)
  ctx.lineTo(sb.x - px * half, sb.y - py * half)
  ctx.lineTo(sa.x - px * half, sa.y - py * half)
  ctx.closePath()
  ctx.fillStyle = 'rgba(244, 239, 228, 0.22)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(244, 239, 228, 0.7)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.strokeStyle = 'rgba(28, 25, 21, 0.55)'
  for (let cm = -30; cm <= 30; cm++) {
    const point = { x: crease.ax + frame.dx * cm * 0.01, y: crease.ay + frame.dy * cm * 0.01 }
    if (Math.abs(point.x) > stock.width / 2 + 0.002 || Math.abs(point.y) > stock.height / 2 + 0.002) continue
    const s = paperToScreen(view, point)
    const tick = cm % 5 === 0 ? 6 : 3
    ctx.beginPath()
    ctx.moveTo(s.x - px * tick, s.y - py * tick)
    ctx.lineTo(s.x + px * tick, s.y + py * tick)
    ctx.stroke()
  }
  ctx.restore()
  const hub = paperToScreen(view, { x: crease.ax, y: crease.ay })
  const handle = rotateOnScreen(view, crease, width, height)
  ctx.save()
  ctx.strokeStyle = '#f4efe4'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(hub.x, hub.y)
  ctx.lineTo(handle.x, handle.y)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(hub.x, hub.y, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#f4efe4'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(handle.x, handle.y, 11, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(247, 243, 234, 0.92)'
  ctx.fill()
  ctx.stroke()
  drawSpinArrows(ctx, handle.x, handle.y)
  ctx.restore()
}

function rotateOnScreen(view: View, crease: FoldOp, width: number, height: number) {
  const frame = lineFrame(crease.angle, crease.ax, crease.ay)
  let reach = HANDLE_PX / Math.max(view.scale, 1)
  const margin = 18
  for (let i = 0; i < 8; i++) {
    const s = paperToScreen(view, { x: crease.ax + frame.dx * reach, y: crease.ay + frame.dy * reach })
    if (s.x >= margin && s.x <= width - margin && s.y >= margin && s.y <= height - margin) return s
    reach *= 0.72
  }
  return paperToScreen(view, { x: crease.ax, y: crease.ay })
}

function drawSpinArrows(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = '#1c1915'
  ctx.fillStyle = '#1c1915'
  ctx.lineWidth = 1.3
  for (const turn of [0, Math.PI]) {
    ctx.beginPath()
    ctx.arc(0, 0, 6, turn + 0.35, turn + 2.15)
    ctx.stroke()
    const a = turn + 2.15
    const px = Math.cos(a) * 6
    const py = Math.sin(a) * 6
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px - 4 * Math.cos(a + 0.9), py - 4 * Math.sin(a + 0.9))
    ctx.lineTo(px - 4 * Math.cos(a - 0.2), py - 4 * Math.sin(a - 0.2))
    ctx.fill()
  }
  ctx.restore()
}

function hitRuler(
  canvas: HTMLCanvasElement,
  crease: FoldOp,
  clientX: number,
  clientY: number,
  stock: Stock,
): 'move' | 'rotate' | null {
  const rect = canvas.getBoundingClientRect()
  const view = fit(rect.width, rect.height, stock)
  const x = clientX - rect.left
  const y = clientY - rect.top
  const hub = paperToScreen(view, { x: crease.ax, y: crease.ay })
  const handle = rotateOnScreen(view, crease, rect.width, rect.height)
  if (Math.hypot(x - handle.x, y - handle.y) < 12) return 'rotate'
  if (Math.hypot(x - hub.x, y - hub.y) < 11) return 'move'
  return null
}

function clipToSheet(ax: number, ay: number, dx: number, dy: number, halfW: number, halfH: number): [Vec2, Vec2] | null {
  let t0 = -1e6
  let t1 = 1e6
  const slabs: [number, number, number, number][] = [
    [dx, ax, -halfW, halfW],
    [dy, ay, -halfH, halfH],
  ]
  for (const [d, p, min, max] of slabs) {
    if (Math.abs(d) < 1e-9) {
      if (p < min || p > max) return null
      continue
    }
    let a = (min - p) / d
    let b = (max - p) / d
    if (a > b) {
      const swap = a
      a = b
      b = swap
    }
    t0 = Math.max(t0, a)
    t1 = Math.min(t1, b)
    if (t0 > t1) return null
  }
  return [
    { x: ax + dx * t0, y: ay + dy * t0 },
    { x: ax + dx * t1, y: ay + dy * t1 },
  ]
}

function drawBoardTicks(ctx: CanvasRenderingContext2D, view: View) {
  const spans = boardTickSpans(view, { width: view.sheetW, height: view.sheetH })
  ctx.save()
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(244, 239, 228, 0.55)'
  ctx.fillStyle = 'rgba(244, 239, 228, 0.72)'
  ctx.font = '10px "Segoe UI", sans-serif'
  ctx.textBaseline = 'middle'
  spans.top.forEach((tick, i) => {
    const bottom = spans.bottom[i]!
    ctx.beginPath()
    ctx.moveTo(tick.at, tick.from)
    ctx.lineTo(tick.at, tick.to)
    ctx.moveTo(bottom.at, bottom.from)
    ctx.lineTo(bottom.at, bottom.to)
    ctx.stroke()
    if (bottom.major && bottom.cm != null) {
      ctx.textAlign = 'center'
      ctx.fillText(String(bottom.cm), bottom.at, bottom.to + 8)
    }
  })
  spans.left.forEach((tick, i) => {
    const right = spans.right[i]!
    ctx.beginPath()
    ctx.moveTo(tick.from, tick.at)
    ctx.lineTo(tick.to, tick.at)
    ctx.moveTo(right.from, right.at)
    ctx.lineTo(right.to, right.at)
    ctx.stroke()
    if (tick.major && tick.cm != null) {
      ctx.textAlign = 'right'
      ctx.fillText(String(tick.cm), tick.to - 4, tick.at)
    }
  })
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
  sheetW: number
  sheetH: number
}

function fit(w: number, h: number, stock: Stock): View {
  const base = fitSheet(w, h, stock)
  return { ...base, sheetW: stock.width, sheetH: stock.height }
}

function paperToScreen(view: View, p: Vec2) {
  return {
    x: view.left + (p.x + view.sheetW / 2) * view.scale,
    y: view.top + (view.sheetH / 2 - p.y) * view.scale,
  }
}

function toPaper(canvas: HTMLCanvasElement, clientX: number, clientY: number, stock: Stock): Vec2 | null {
  const rect = canvas.getBoundingClientRect()
  const view = fit(rect.width, rect.height, stock)
  const x = clientX - rect.left
  const y = clientY - rect.top
  return {
    x: (x - view.left) / view.scale - stock.width / 2,
    y: stock.height / 2 - (y - view.top) / view.scale,
  }
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


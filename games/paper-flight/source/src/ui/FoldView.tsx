import { useEffect, useRef, useState } from 'react'
import {
  applyNodeEdit,
  assessPair,
  clearedNodes,
  edgePointsOnLine,
  endpointHit,
  guideForGrab,
  nearestSilhouette,
  type Endpoints,
} from '../sim/abGuide'
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
import {
  coverSamples,
  depthFromDrag,
  depthOf,
  edgeDepth,
  flapMoved,
  previewFold,
  ridgeOf,
  sampleRidge,
  SEAL_COVERAGE,
  type Guide,
} from '../sim/dragFold'
import { scaleFoldOp, STOCKS, stockById, type Stock } from '../sim/stock'
import { boardTickSpans, fitSheet } from './creaseClamp'

const PINCH =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='M9 22c1-6 4-9 7-9 1 2 1 4 0 6 3-4 6-4 8-1 1 2-1 5-3 6l-5 3c-4 2-8 0-7-5z' fill='%23f7f3ea' stroke='%231c1915' stroke-width='1.6' stroke-linejoin='round'/%3E%3Cpath d='M14 14c1-3 3-5 5-4' fill='none' stroke='%231c1915' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E\") 8 8, grab"

interface Hold {
  op: FoldOp
  depth: number
  grabDepth: number
}

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
  const [ends, setEndsState] = useState<Endpoints>(clearedNodes())
  const endsRef = useRef<Endpoints>(clearedNodes())
  const cursorRef = useRef<Vec2 | null>(null)
  const [helperOpen, setHelperOpen] = useState(false)
  /** null keeps the smaller side for Hold at the line. A drag uses the side you grab. */
  const [pinned, setPinned] = useState<1 | -1 | null>(null)
  const [draftId, setDraftId] = useState(stock.id)
  const [note, setNote] = useState<string | null>(null)
  const busy = false
  const stockRef = useRef(stock)
  stockRef.current = stock
  const holdRef = useRef<Hold | null>(null)
  const [hold, setHoldState] = useState<Hold | null>(null)
  const [seal, setSeal] = useState(0)
  const traceRef = useRef<{ samples: Vec2[]; covered: boolean[] } | null>(null)
  function setHold(next: Hold | null) {
    holdRef.current = next
    setHoldState(next)
    if (!next) {
      traceRef.current = null
      setSeal(0)
    }
  }
  function setEnds(next: Endpoints) {
    endsRef.current = next
    setEndsState(next)
  }
  const animRef = useRef<Anim | null>(null)
  const opsRef = useRef(ops)
  const dyeRef = useRef(dye)
  const onOpsRef = useRef(onOps)
  opsRef.current = ops
  dyeRef.current = dye
  onOpsRef.current = onOps

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
      paint(ctx, rect.width, rect.height, opsRef.current, endsRef.current, cursorRef.current, animRef.current, dyeRef.current, stockRef.current, holdRef.current, traceRef.current)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (document.body.dataset.book === 'open') return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key !== 'Escape') return
      event.preventDefault()
      const edit = applyNodeEdit(endsRef.current, !!holdRef.current, { type: 'reset' })
      if (edit.ends === endsRef.current && !holdRef.current) return
      setEnds(edit.ends)
      setNote(edit.note)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!practice) return
    if (holdRef.current) {
      setNote('Undo the held fold before placing a line.')
      return
    }
    const paperNow = applyOps(opsRef.current, stockRef.current)
    const op = scaleFoldOp(practice.op, SHEET, stockRef.current)
    const pts = edgePointsOnLine(paperNow, op.angle, op.ax, op.ay)
    if (!pts?.a || !pts.b) {
      setNote('That line does not cut this sheet.')
      return
    }
    setEnds(pts)
    setPinned(null)
    setNote('Line set. Drag either edge inward. The line is the limit.')
  }, [practice])

  const opsSeen = useRef(ops)
  const stockSeen = useRef(stock.id)
  useEffect(() => {
    if (opsSeen.current !== ops) {
      opsSeen.current = ops
      setEnds(clearedNodes())
    }
  }, [ops])
  useEffect(() => {
    if (stockSeen.current !== stock.id) {
      stockSeen.current = stock.id
      setEnds(clearedNodes())
    }
  }, [stock.id])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let mode: 'flap' | 'trace' | null = null
    let grabDepth = 0
    let dragGuide: Guide | null = null
    let samples: Vec2[] = []
    let covered: boolean[] = []
    let travel = 0
    let last: Vec2 | null = null
    const base = () => applyOps(opsRef.current, stockRef.current)
    const metrics = () => {
      const rect = canvas.getBoundingClientRect()
      const view = fit(rect.width, rect.height, stockRef.current)
      return { rect, view, tol: 16 / Math.max(view.scale, 1), nodeR: 14 / Math.max(view.scale, 1) }
    }
    const limitOf = (paperNow: Paper): { angle: number; ax: number; ay: number } | null => {
      const ends = endsRef.current
      if (!ends.a || !ends.b) return null
      const check = assessPair(paperNow, ends.a, ends.b)
      return check.ok ? check : null
    }
    const down = (event: PointerEvent) => {
      if (animRef.current) return
      const p = toPaper(canvas, event.clientX, event.clientY, stockRef.current)
      if (!p) return
      const { tol, nodeR } = metrics()
      const paperNow = base()
      if (event.button === 2) {
        const which = endpointHit(endsRef.current, p, nodeR)
        if (!which) return
        const edit = applyNodeEdit(endsRef.current, !!holdRef.current, { type: 'remove', which })
        setEnds(edit.ends)
        setNote(edit.note)
        return
      }
      if (event.button !== 0) return
      const limit = limitOf(paperNow)
      const held = holdRef.current
      if (held && limit) {
        const built = buildFold(paperNow, held.op)
        const ridge = built.valid ? ridgeOf(built.paper, held.op) : null
        if (ridge && segmentDistance(p, ridge.a, ridge.b) < 0.022) {
          mode = 'trace'
          samples = sampleRidge(ridge)
          covered = samples.map(() => false)
          traceRef.current = { samples, covered }
          travel = 0
          last = p
          setSeal(coverSamples(samples, covered, p, 0.01))
          canvas.setPointerCapture(event.pointerId)
          return
        }
        const movingSign: 1 | -1 = held.op.side === -1 ? -1 : 1
        const holdLimit: Guide = { angle: limit.angle, ax: limit.ax, ay: limit.ay, movingSign }
        if (depthOf(p, holdLimit) < held.depth && !endpointHit(endsRef.current, p, nodeR)) {
          mode = 'flap'
          dragGuide = holdLimit
          grabDepth = held.grabDepth
          canvas.setPointerCapture(event.pointerId)
          return
        }
      }
      if (endpointHit(endsRef.current, p, nodeR)) return
      if (limit && !held) {
        const edge = nearestSilhouette(paperNow, p, tol)
        const grabbed = edge ? guideForGrab(limit, edge) : null
        const depth = edge && grabbed ? depthOf(edge, grabbed) : 0
        if (edge && grabbed && depth >= 0.01) {
          mode = 'flap'
          dragGuide = grabbed
          grabDepth = depth
          canvas.setPointerCapture(event.pointerId)
          return
        }
      }
      if (held) return
      const edge = nearestSilhouette(paperNow, p, tol)
      if (!edge) {
        const aiming = (endsRef.current.a || endsRef.current.b) && !(endsRef.current.a && endsRef.current.b)
        if (aiming) setNote('Click the edge of the paper.')
        return
      }
      if (endsRef.current.a && endsRef.current.b) return
      const edit = applyNodeEdit(endsRef.current, false, { type: 'place', point: edge, paper: paperNow })
      setEnds(edit.ends)
      if (edit.note) setNote(edit.note)
    }
    const move = (event: PointerEvent) => {
      const p = toPaper(canvas, event.clientX, event.clientY, stockRef.current)
      if (!p) return
      cursorRef.current = p
      if (!mode) {
        const { tol } = metrics()
        const paperNow = base()
        const limit = limitOf(paperNow)
        const edge = limit ? nearestSilhouette(paperNow, p, tol) : null
        const grabbed = edge && limit ? guideForGrab(limit, edge) : null
        const pinch = !!(edge && grabbed && depthOf(edge, grabbed) > 0.01)
        canvas.style.cursor = pinch ? PINCH : 'crosshair'
        return
      }
      if (mode === 'flap') {
        const guide = dragGuide
        if (!guide) return
        const depth = depthFromDrag(grabDepth, depthOf(p, guide))
        const preview = flapMoved(grabDepth, depth) ? previewFold(base(), guide, depth) : null
        holdRef.current = preview ? { op: preview.op, depth, grabDepth } : null
        return
      }
      if (mode === 'trace' && last) {
        const step = Math.hypot(p.x - last.x, p.y - last.y)
        if (step > 0.0012) {
          travel += step
          last = p
          setSeal(coverSamples(samples, covered, p, 0.012))
        }
      }
    }
    const up = () => {
      if (mode === 'flap') {
        const next = holdRef.current
        if (next && flapMoved(next.grabDepth, next.depth)) setHold(next)
        else setHold(null)
        setNote(next && flapMoved(next.grabDepth, next.depth) ? 'Fold held. Drag it again, or press along the new ridge.' : null)
      }
      if (mode === 'trace' && holdRef.current) {
        const frac = covered.length ? covered.filter(Boolean).length / covered.length : 0
        const span = samples.length > 1 ? Math.hypot(samples[samples.length - 1].x - samples[0].x, samples[samples.length - 1].y - samples[0].y) : 0
        setSeal(frac)
        if (frac >= SEAL_COVERAGE && travel >= Math.max(0.012, span * 0.62)) {
          const op = holdRef.current.op
          setHold(null)
          setEnds(clearedNodes())
          setNote('Crease pressed in.')
          onOpsRef.current([...opsRef.current, op])
        } else setNote('Keep pressing along the ridge. A tap does not set it.')
      }
      mode = null
      dragGuide = null
    }
    const menu = (event: MouseEvent) => {
      event.preventDefault()
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    canvas.addEventListener('contextmenu', menu)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      canvas.removeEventListener('contextmenu', menu)
    }
  }, [])

  const paper = applyOps(ops, stock)
  const folds = netFolds(ops)
  const opens = openCreaseCount(ops)
  const heldPaper = hold ? buildFold(paper, hold.op) : null
  const heldRidge = heldPaper?.valid && hold ? ridgeOf(heldPaper.paper, hold.op) : null
  const draft = stockById(draftId)
  const stockDirty = draft.id !== stock.id
  const line = ends.a && ends.b ? assessPair(paper, ends.a, ends.b) : null
  const guideLine = line && line.ok ? line : null
  const previewOp: FoldOp | null = guideLine
    ? { angle: guideLine.angle, ax: guideLine.ax, ay: guideLine.ay, side: pinned ?? 1, ...(pinned != null ? { explicit: true } : {}) }
    : null
  const preview = previewOp ? buildFold(paper, previewOp) : null
  const matched = prefixMatch(ops, stock)
  const pointLabel = (point: Vec2 | null) => point ? `${point.x.toFixed(4)} ${point.y.toFixed(4)}` : ''

  function chooseStock(id: string) {
    setDraftId(id)
    if (netFolds(opsRef.current) === 0) onStock(id)
  }

  function resetNodes() {
    const edit = applyNodeEdit(endsRef.current, !!holdRef.current, { type: 'reset' })
    setEnds(edit.ends)
    setNote(edit.note)
  }

  function placeHelper(op: FoldOp) {
    if (holdRef.current) {
      setNote('Undo the held fold before placing a line.')
      return
    }
    const pts = edgePointsOnLine(applyOps(opsRef.current, stockRef.current), op.angle, op.ax, op.ay)
    if (!pts?.a || !pts.b) {
      setNote('That helper line does not cut this sheet.')
      return
    }
    setEnds(pts)
    setPinned(null)
    setNote('Line set. Drag either edge inward. The line is the limit.')
  }

  function unfold() {
    if (netFolds(opsRef.current) === 0 || animRef.current) return
    const next: SheetStep[] = [...opsRef.current, { unfold: true }]
    onOps(next)
    setNote('Opened the last fold. Its crease stays on the paper. Unfold again for the one before it.')
  }

  return (
    <div className="fold" data-dye={dye.id} data-folds={folds} data-open={opens} data-provisional={hold ? '1' : '0'} data-seal={seal.toFixed(2)} data-stock={stock.id} data-guide={guideLine ? 'set' : ends.a || ends.b ? 'aim' : 'idle'} data-a={pointLabel(ends.a)} data-b={pointLabel(ends.b)} data-ax={guideLine?.ax ?? ''} data-ay={guideLine?.ay ?? ''} data-angle={guideLine?.angle ?? ''} data-rx1={heldRidge?.a.x ?? ''} data-ry1={heldRidge?.a.y ?? ''} data-rx2={heldRidge?.b.x ?? ''} data-ry2={heldRidge?.b.y ?? ''}>
      <div className="fold-bar">
      <div className="fold-readout">
        <span>{folds} {folds === 1 ? 'fold' : 'folds'}</span>
        {guideLine && <span>{formatDeg(guideLine.angle)}</span>}
        {hold ? (
          <span>Held fold. Press along the ridge. {Math.round(seal * 100)}%</span>
        ) : guideLine ? (
          <span>Drag an edge on either side. The line is the limit.</span>
        ) : ends.a || ends.b ? (
          <span>Click the edge again for the other point.</span>
        ) : (
          <span>Click an edge for point A, then another for point B.</span>
        )}
        {opens > 0 && <span>{opens} open {opens === 1 ? 'crease' : 'creases'}</span>}
      </div>
      {note && <p className="fold-note" role="status">{note}</p>}
      <p className="fold-hint">Click two edge points. Drag either side inward, and stop short if you want. Then press along the new ridge. Right-click a point to remove it.</p>
      </div>
      <div className="fold-stage">
      <canvas ref={canvasRef} className="fold-canvas" />
      {preview?.valid && (
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
      {helperOpen && (
        <aside className="guide">
          <h2>A dart, if you want one</h2>
          <p>Each of these places point A and point B. Drag either edge after that, or fold something else.</p>
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
        <button type="button" onClick={() => { setNote(null); if (holdRef.current) { setHold(null); return } onOps(ops.slice(0, -1)) }} disabled={(!ops.length && !hold) || busy} title="Drop a held fold, or take back the last sealed action">
          Undo
        </button>
        <button type="button" className="unfold" onClick={unfold} disabled={folds === 0 || busy} title="Open the last fold and keep its crease on the paper">
          Unfold
        </button>
        <button type="button" onClick={() => { setHold(null); setNote(null); onOps([]) }} disabled={(!ops.length && !hold) || busy} title="Clear every fold and every open crease">
          Reset
        </button>
        <button type="button" onClick={resetNodes} disabled={(!ends.a && !ends.b) || busy} title="Clear points A and B. Folds and creases stay.">
          Reset nodes
        </button>
        <button
          type="button"
          className="primary"
          onClick={() => {
            if (!preview?.valid || !previewOp) return
            const guide = { angle: previewOp.angle, ax: previewOp.ax, ay: previewOp.ay, movingSign: preview.movingSign }
            const previewHold = previewFold(paper, guide, 0)
            if (!previewHold) return
            setHold({ op: previewHold.op, depth: 0, grabDepth: Math.max(0.02, edgeDepth(paper, guide)) })
            setNote('Held at the line. Press along the ridge to set the crease.')
          }}
          disabled={!preview?.valid || busy || !!hold}
          title="Hold the fold at the limit line. You still press along the ridge."
        >
          Hold at the line
        </button>
        <button type="button" className="quiet" onClick={() => setHelperOpen((g) => !g)}>
          {helperOpen ? 'Hide guide' : 'Guide'}
        </button>
        <button type="button" className="go" onClick={() => { if (holdRef.current) { setNote('Press along the new crease before the hall.'); return } onDone() }}>
          To the hall
        </button>
      </div>
      </div>
    </div>
  )
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
  ends: Endpoints,
  cursor: Vec2 | null,
  anim: Anim | null,
  dye: Dye,
  stock: Stock,
  hold: Hold | null,
  trace: { samples: Vec2[]; covered: boolean[] } | null,
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
    const shown = hold ? buildFold(paper, hold.op) : null
    const drawing = shown?.valid ? shown.paper : paper
    drawFacets(ctx, view, drawing.facets, dye)
    drawCreases(ctx, view, paper.creases)
    if (shown?.valid) {
      const ridge = ridgeOf(shown.paper, hold!.op)
      if (ridge) drawRidge(ctx, view, ridge, trace)
    }
    drawEndpoints(ctx, view, paper, ends, cursor)
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

function drawEndpoints(
  ctx: CanvasRenderingContext2D,
  view: View,
  paper: Paper,
  ends: Endpoints,
  cursor: Vec2 | null,
) {
  const pair = ends.a && ends.b ? assessPair(paper, ends.a, ends.b) : null
  ctx.save()
  ctx.lineWidth = 2
  ctx.setLineDash([7, 6])
  ctx.strokeStyle = '#f4efe4'
  ctx.lineCap = 'round'
  if (pair && pair.ok && ends.a && ends.b) {
    const a = paperToScreen(view, ends.a)
    const b = paperToScreen(view, ends.b)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  } else if (cursor && (ends.a || ends.b)) {
    const from = paperToScreen(view, (ends.a || ends.b)!)
    const to = paperToScreen(view, cursor)
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }
  ctx.restore()
  if (ends.a) drawPoint(ctx, view, ends.a, 'A')
  if (ends.b) drawPoint(ctx, view, ends.b, 'B')
}

function drawPoint(ctx: CanvasRenderingContext2D, view: View, point: Vec2, label: string) {
  const s = paperToScreen(view, point)
  ctx.save()
  ctx.beginPath()
  ctx.arc(s.x, s.y, 4, 0, Math.PI * 2)
  ctx.fillStyle = '#f4efe4'
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = '#1c1915'
  ctx.stroke()
  ctx.fillStyle = '#f4efe4'
  ctx.font = '12px "Segoe UI", sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  ctx.fillText(label, s.x + 6, s.y - 4)
  ctx.restore()
}

function drawRidge(
  ctx: CanvasRenderingContext2D,
  view: View,
  ridge: { a: Vec2; b: Vec2 },
  trace: { samples: Vec2[]; covered: boolean[] } | null,
) {
  const a = paperToScreen(view, ridge.a)
  const b = paperToScreen(view, ridge.b)
  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#e2b15a'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  if (trace) {
    ctx.fillStyle = '#1c1915'
    for (let i = 0; i < trace.samples.length; i++) {
      if (!trace.covered[i]) continue
      const p = paperToScreen(view, trace.samples[i])
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function segmentDistance(p: Vec2, a: Vec2, b: Vec2) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = dx * dx + dy * dy || 1
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/** Paired ticks on the board, outside the sheet, at the same sheet coordinates on opposite edges. */
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


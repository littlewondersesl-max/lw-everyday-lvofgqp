import { useEffect, useRef, useState } from 'react'
import { GUIDE_STEPS } from '../sim/bots'
import { SHEET } from '../sim/constants'
import { dyeFill, type Dye } from '../sim/dyes'
import {
  applyOps,
  buildFold,
  facetCentroid,
  isUnfold,
  lineFrame,
  longestCrease,
  netFolds,
  openCreaseCount,
  polygonArea,
  reflectPoint,
  signedDistance,
  suggestCrease,
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
  nearestBoundary,
  previewFold,
  ridgeOf,
  sampleRidge,
  SEAL_COVERAGE,
  type Guide,
} from '../sim/dragFold'
import { scaleFoldOp, STOCKS, stockById, type Stock } from '../sim/stock'
import { boardTickSpans, clampCrease, fitSheet, HANDLE_PX } from './creaseClamp'

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
  const [crease, setCrease] = useState<FoldOp>(GUIDE_STEPS[0].op)
  const [guide, setGuide] = useState(false)
  /** null keeps the smaller side. A number forces that side of the line. */
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
      paint(ctx, rect.width, rect.height, opsRef.current, creaseRef.current, animRef.current, dyeRef.current, stockRef.current, holdRef.current, traceRef.current)
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

  function placeCrease(next: FoldOp | ((current: FoldOp) => FoldOp)) {
    setCrease((current) => {
      const raw = typeof next === 'function' ? next(current) : next
      const canvas = canvasRef.current
      const rect = canvas?.getBoundingClientRect()
      const clamped = !rect || rect.width < 80 ? raw : clampCrease(raw, rect.width, rect.height, stockRef.current)
      if (clamped.ax === current.ax && clamped.ay === current.ay && clamped.angle === current.angle && clamped.side === current.side && clamped.explicit === current.explicit) {
        return current
      }
      return clamped
    })
  }
  function nudge(dx: number, dy: number) {
    placeCrease((c) => ({ ...c, ax: c.ax + dx, ay: c.ay + dy }))
  }
  function turnCrease(delta: number) {
    placeCrease((c) => ({ ...c, angle: c.angle + delta }))
  }

  useEffect(() => {
    if (!practice) return
    placeCrease(scaleFoldOp(practice.op, SHEET, stockRef.current))
    setPinned(null)
  }, [practice])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => placeCrease((c) => c))
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const paperNow = applyOps(ops, stock)
    const trial: FoldOp = { angle: crease.angle, ax: crease.ax, ay: crease.ay, side: pinned ?? crease.side, ...(pinned != null ? { explicit: true } : {}) }
    if (buildFold(paperNow, trial).valid) return
    const open: FoldOp = { angle: crease.angle, ax: crease.ax, ay: crease.ay, side: crease.side }
    if (pinned != null && buildFold(paperNow, open).valid) {
      setPinned(null)
      return
    }
    const next = suggestCrease(paperNow, crease)
    placeCrease(next)
    setPinned(null)
  }, [ops, stock])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let mode: 'guide' | 'flap' | 'trace' | null = null
    let guideDrag: 'anchor' | 'rotate' | 'line' | null = null
    let grabDepth = 0
    let samples: Vec2[] = []
    let covered: boolean[] = []
    let travel = 0
    let last: Vec2 | null = null
    const base = () => applyOps(opsRef.current, stockRef.current)
    const guideOf = (): Guide | null => {
      const op = creaseRef.current
      const built = buildFold(base(), op)
      if (!built.valid) return null
      return { angle: op.angle, ax: op.ax, ay: op.ay, movingSign: built.movingSign }
    }
    const down = (event: PointerEvent) => {
      if (animRef.current) return
      const p = toPaper(canvas, event.clientX, event.clientY, stockRef.current)
      if (!p) return
      const hit = hitHandle(canvas, creaseRef.current, event.clientX, event.clientY, stockRef.current)
      if (hit) {
        mode = 'guide'
        guideDrag = hit
        setHold(null)
        canvas.setPointerCapture(event.pointerId)
        return
      }
      const guide = guideOf()
      const held = holdRef.current
      if (held && guide) {
        const built = buildFold(base(), held.op)
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
      }
      if (!guide) return
      const edge = nearestBoundary(base(), p, 0.018)
      const depth = edge ? depthOf(edge, guide) : 0
      const fromHold = held && depthOf(p, guide) < held.depth
      if (fromHold && held) {
        mode = 'flap'
        grabDepth = held.grabDepth
        canvas.setPointerCapture(event.pointerId)
        return
      }
      if (!edge || depth < 0.01) return
      mode = 'flap'
      grabDepth = depth
      canvas.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      const p = toPaper(canvas, event.clientX, event.clientY, stockRef.current)
      if (!p) return
      if (!mode) {
        const guide = guideOf()
        const edge = guide ? nearestBoundary(base(), p, 0.018) : null
        const pinch = !!(edge && guide && depthOf(edge, guide) > 0.01)
        canvas.style.cursor = pinch ? PINCH : 'crosshair'
        return
      }
      if (mode === 'guide' && guideDrag) {
        placeCrease((c) => {
          if (guideDrag === 'rotate') {
            let angle = Math.atan2(p.y - c.ay, p.x - c.ax)
            if (event.shiftKey) angle = Math.round(angle / (Math.PI / 12)) * (Math.PI / 12)
            return { ...c, angle }
          }
          const prev = toPaper(canvas, event.clientX - event.movementX, event.clientY - event.movementY, stockRef.current)
          if (!prev) return c
          return { ...c, ax: c.ax + (p.x - prev.x), ay: c.ay + (p.y - prev.y) }
        })
        return
      }
      const guide = guideOf()
      if (!guide) return
      if (mode === 'flap') {
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
          setNote('Crease pressed in.')
          onOps([...opsRef.current, op])
        } else setNote('Keep pressing along the ridge. A tap does not set it.')
      }
      mode = null
      guideDrag = null
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

  const paper = applyOps(ops, stock)
  const folds = netFolds(ops)
  const opens = openCreaseCount(ops)
  const heldPaper = hold ? buildFold(paper, hold.op) : null
  const heldRidge = heldPaper?.valid && hold ? ridgeOf(heldPaper.paper, hold.op) : null
  const draft = stockById(draftId)
  const stockDirty = draft.id !== stock.id
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
  const matched = prefixMatch(ops, stock)

  function chooseStock(id: string) {
    setDraftId(id)
    if (netFolds(opsRef.current) === 0) onStock(id)
  }

  function unfold() {
    if (netFolds(opsRef.current) === 0 || animRef.current) return
    const next: SheetStep[] = [...opsRef.current, { unfold: true }]
    onOps(next)
    const opened = applyOps(next, stockRef.current)
    const mark = longestCrease(opened.creases)
    if (mark) {
      placeCrease({
        angle: Math.atan2(mark.b.y - mark.a.y, mark.b.x - mark.a.x),
        ax: (mark.a.x + mark.b.x) / 2,
        ay: (mark.a.y + mark.b.y) / 2,
        side: 1,
      })
      setPinned(null)
    }
    setNote('Opened the last fold. Its crease stays on the paper. Unfold again for the one before it.')
  }

  return (
    <div className="fold" data-dye={dye.id} data-folds={folds} data-open={opens} data-provisional={hold ? '1' : '0'} data-seal={seal.toFixed(2)} data-stock={stock.id} data-ax={crease.ax} data-ay={crease.ay} data-angle={crease.angle} data-rx1={heldRidge?.a.x ?? ''} data-ry1={heldRidge?.a.y ?? ''} data-rx2={heldRidge?.b.x ?? ''} data-ry2={heldRidge?.b.y ?? ''}>
      <div className="fold-bar">
      <div className="fold-readout">
        <span>{folds} {folds === 1 ? 'fold' : 'folds'}</span>
        <span>{formatDeg(crease.angle)}</span>
        {hold ? (
          <span>Held fold. Press along the ridge. {Math.round(seal * 100)}%</span>
        ) : preview.valid ? (
          <span>{markedIsSmaller ? 'Drag an edge on the marked side. The line is the limit.' : 'The larger side is marked. Drag that edge inward.'}</span>
        ) : (
          <span>{preview.reason} Drag the line back onto the paper.</span>
        )}
        {opens > 0 && <span>{opens} open {opens === 1 ? 'crease' : 'creases'}</span>}
      </div>
      {note && <p className="fold-note" role="status">{note}</p>}
      <p className="fold-hint">Pinch an edge and drag. Stop short if you want. Then press along the new ridge. The dashed line is only the limit.</p>
      </div>
      <div className="fold-stage">
      <canvas ref={canvasRef} className="fold-canvas" />
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
                    placeCrease(scaleFoldOp(step.op, SHEET, stock))
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
        <button
          type="button"
          className="primary"
          onClick={() => {
            if (!preview.valid) return
            const guide = { angle: previewOp.angle, ax: previewOp.ax, ay: previewOp.ay, movingSign: preview.movingSign }
            const previewHold = previewFold(paper, guide, 0)
            if (!previewHold) return
            setHold({ op: previewHold.op, depth: 0, grabDepth: Math.max(0.02, edgeDepth(paper, guide)) })
            setNote('Held at the line. Press along the ridge to set the crease.')
          }}
          disabled={!preview.valid || busy || !!hold}
          title="Hold the fold at the limit line. You still press along the ridge."
        >
          Hold at the line
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
  crease: FoldOp,
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
    strokeLine(ctx, view, crease, '#f4efe4')
    const guideBuilt = buildFold(paper, crease)
    if (guideBuilt.valid) {
      const frame = lineFrame(crease.angle, crease.ax, crease.ay)
      const landing = guideBuilt.moving.map((poly) => poly.map((p) => reflectPoint(p, frame)))
      drawFoldArrow(ctx, view, guideBuilt.moving, landing, 'rgba(244,239,228,0.9)')
    }
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
  const reach = HANDLE_PX / Math.max(view.scale, 1)
  const handle = paperToScreen(view, {
    x: crease.ax + frame.dx * reach,
    y: crease.ay + frame.dy * reach,
  })
  ctx.strokeStyle = ink
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(anchor.x, anchor.y)
  ctx.lineTo(handle.x, handle.y)
  ctx.stroke()
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(anchor.x, anchor.y, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(handle.x, handle.y, 11, 0, Math.PI * 2)
  ctx.fillStyle = '#f7f3ea'
  ctx.fill()
  ctx.lineWidth = 1.6
  ctx.stroke()
  drawSpinArrows(ctx, handle.x, handle.y)
  ctx.restore()
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

function hitHandle(canvas: HTMLCanvasElement, crease: FoldOp, clientX: number, clientY: number, stock: Stock): 'anchor' | 'rotate' | 'line' | null {
  const rect = canvas.getBoundingClientRect()
  const view = fit(rect.width, rect.height, stock)
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  const frame = lineFrame(crease.angle, crease.ax, crease.ay)
  const anchor = paperToScreen(view, { x: crease.ax, y: crease.ay })
  const reach = HANDLE_PX / Math.max(view.scale, 1)
  const handle = paperToScreen(view, { x: crease.ax + frame.dx * reach, y: crease.ay + frame.dy * reach })
  if (Math.hypot(localX - handle.x, localY - handle.y) < 12) return 'rotate'
  if (Math.hypot(localX - anchor.x, localY - anchor.y) < 11) return 'anchor'
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


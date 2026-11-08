import { useEffect, useRef, useState } from 'react'
import { nearestSilhouette } from '../sim/abGuide'
import { dyeFill, type Dye } from '../sim/dyes'
import {
  applyOps,
  buildFold,
  isLift,
  lineFrame,
  netFolds,
  openCreaseCount,
  pliesForGrab,
  signedDistance,
  type FoldOp,
  type Paper,
  type SheetStep,
  type Vec2,
} from '../sim/geometry'
import { reflectFold } from '../sim/dragFold'
import { STOCKS, stockById, type Stock } from '../sim/stock'
import { canLift, poseFacets } from '../sim/wings'
import { boardTickSpans, fitSheet } from './creaseClamp'

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

export function FoldView({ ops, stock, dye, dyes, taken, onDye, onStock, onNewSheet, onOps, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<FoldOp | null>(null)
  const [allLayers, setAllLayers] = useState(false)
  const allRef = useRef(false)
  allRef.current = allLayers
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
      paint(ctx, rect.width, rect.height, opsRef.current, previewRef.current, animRef.current, dyeRef.current, stockRef.current)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let mode: 'flap' | null = null
    let grab: Vec2 | null = null
    let plies: number[] | undefined
    const base = () => applyOps(opsRef.current, stockRef.current)
    const tolOf = () => {
      const rect = canvas.getBoundingClientRect()
      const view = fit(rect.width, rect.height, stockRef.current)
      return 16 / Math.max(view.scale, 1)
    }
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || animRef.current) return
      const p = toPaper(canvas, event.clientX, event.clientY, stockRef.current)
      if (!p) return
      const paperNow = base()
      const tol = tolOf()
      const edge = nearestSilhouette(paperNow, p, tol)
      if (!edge) return
      const joined = allRef.current ? null : pliesForGrab(paperNow, edge, tol)
      if (!allRef.current && !joined) return
      mode = 'flap'
      grab = edge
      plies = joined ?? undefined
      canvas.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      const p = toPaper(canvas, event.clientX, event.clientY, stockRef.current)
      if (!p) return
      if (!mode) {
        const edge = nearestSilhouette(base(), p, tolOf())
        canvas.style.cursor = edge ? PINCH : 'crosshair'
        return
      }
      if (grab) previewRef.current = reflectFold(base(), grab, p, plies)?.op ?? null
    }
    const up = () => {
      if (mode === 'flap') {
        const op = previewRef.current
        previewRef.current = null
        if (op) {
          setNote(op.plies ? 'Folded the top sheet only.' : 'Folded every layer on that side.')
          onOpsRef.current([...opsRef.current, op])
        }
      }
      mode = null
      grab = null
      plies = undefined
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
  const paperNow = applyOps(ops, stock)
  const wingsReady = canLift(paperNow)
  const lifted = paperNow.dihedral ?? 0

  function chooseStock(id: string) {
    setDraftId(id)
    if (netFolds(opsRef.current) === 0) onStock(id)
  }

  function unfold() {
    if (netFolds(opsRef.current) === 0 || animRef.current) return
    onOps([...opsRef.current, { unfold: true }])
    setNote('Opened the last fold. Its crease stays on the paper. Unfold again for the one before it.')
  }

  function setLift(radians: number) {
    const kept = ops.filter((step) => !isLift(step))
    if (radians <= 0.02) {
      onOps(kept)
      setNote('Wings laid flat on the packet.')
      return
    }
    if (!canLift(applyOps(kept, stock))) {
      setNote('Fold a wing back first. Lift wings opens those sheets. It does not invent a plane.')
      return
    }
    onOps([...kept, { lift: radians }])
    setNote('Wings opened on their hinges. The hall flies this same shape.')
  }

  return (
    <div className="fold" data-dye={dye.id} data-folds={folds} data-open={opens} data-stock={stock.id} data-dihedral={lifted.toFixed(3)} data-layers={allLayers ? 'all' : 'top'} data-wings={wingsReady ? '1' : '0'}>
      <div className="fold-bar">
      <div className="fold-readout">
        <span>{folds} {folds === 1 ? 'fold' : 'folds'}</span>
        <span>{allLayers ? 'All layers' : 'Top sheet'}</span>
        <span>{lifted > 0.02 ? `Wings ${Math.round((lifted * 180) / Math.PI)}°` : 'Drag a corner or an edge. Letting go folds it.'}</span>
        {opens > 0 && <span>{opens} open {opens === 1 ? 'crease' : 'creases'}</span>}
      </div>
      {note && <p className="fold-note" role="status">{note}</p>}
      <p className="fold-hint">Top sheet grabs the face you see. All layers folds the packet. Flip turns it over. Lift wings opens folded wings into the shape that flies.</p>
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
        <button type="button" className={allLayers ? 'on' : ''} aria-pressed={allLayers} onClick={() => setAllLayers((value) => !value)} title="Top sheet folds only the face you see. All layers folds every sheet on that side.">
          {allLayers ? 'All layers' : 'Top sheet'}
        </button>
        <button type="button" onClick={() => { setNote('Turned the sheet over, left to right. The other face is on top.'); onOps([...ops, { flip: true }]) }} disabled={!ops.length || busy} title="Turn the sheet over so the other half is on top">
          Flip paper
        </button>
        <button type="button" onClick={() => setLift(lifted > 0.02 ? 0 : 0.4)} disabled={!wingsReady && lifted <= 0.02} title={wingsReady || lifted > 0.02 ? 'Open the folded wings on their hinges' : 'Fold a wing back before lifting'}>
          {lifted > 0.02 ? 'Lay wings flat' : 'Lift wings'}
        </button>
        <label className="wing-lift">
          Lift
          <input type="range" min={0} max={40} step={1} value={Math.round((lifted * 180) / Math.PI)} disabled={!wingsReady && lifted <= 0.02} aria-label="Wing opening angle" onChange={(event) => setLift((Number(event.target.value) * Math.PI) / 180)} />
        </label>
        <button type="button" className="go" onClick={() => onDone()}>
          To the hall
        </button>
      </div>
      </div>
    </div>
  )
}

function paint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ops: SheetStep[],
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
    if (!preview && (drawing.dihedral ?? 0) > 0.02) drawPosed(ctx, view, drawing, dye)
    else {
      drawFacets(ctx, view, drawing.facets, dye)
      drawCreases(ctx, view, drawing.creases)
    }
  }

  drawBoardTicks(ctx, view)
}

function drawFacets(
  ctx: CanvasRenderingContext2D,
  view: View,
  facets: { poly: Vec2[]; layer: number; faceUp: 1 | -1; ply?: number }[],
  dye: Dye,
) {
  const top = facets.reduce((max, facet) => Math.max(max, facet.layer), 0)
  const sorted = [...facets].sort((a, b) => a.layer - b.layer)
  for (const facet of sorted) {
    pathPoly(ctx, view, facet.poly)
    ctx.fillStyle = dyeFill(dye, facet.faceUp > 0, facet.layer)
    ctx.fill()
    ctx.strokeStyle = facet.layer === top && top > 0 ? '#1a1612' : 'rgba(26, 22, 18, 0.55)'
    ctx.lineWidth = facet.layer === top && top > 0 ? 2.2 : 1.1
    ctx.stroke()
  }
}

function drawPosed(
  ctx: CanvasRenderingContext2D,
  view: View,
  paper: Paper,
  dye: Dye,
) {
  const posed = poseFacets(paper).slice().sort((a, b) => {
    const az = a.poly.reduce((sum, point) => sum + point.z, 0)
    const bz = b.poly.reduce((sum, point) => sum + point.z, 0)
    return az - bz
  })
  for (const facet of posed) {
    ctx.beginPath()
    facet.poly.forEach((point, index) => {
      const flat = paperToScreen(view, point)
      const x = flat.x + point.z * view.scale * 0.7
      const y = flat.y - point.z * view.scale * 0.95
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = dyeFill(dye, facet.faceUp > 0, facet.layer)
    ctx.fill()
    ctx.strokeStyle = '#1a1612'
    ctx.lineWidth = 1.6
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



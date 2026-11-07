import { describe, expect, it } from 'vitest'
import { SHEET } from '../src/sim/constants'
import {
  applyOps,
  blankSheet,
  materialArea,
  netFolds,
  openCreaseCount,
  type CreaseMark,
  type FoldOp,
} from '../src/sim/geometry'
import { DEFAULT_STOCK, scaleFoldOp, STOCKS } from '../src/sim/stock'
import { deriveShape } from '../src/sim/shape'
import { boardTickSpans, clampCrease, fitSheet, HANDLE_PX } from '../src/ui/creaseClamp'

const corner: FoldOp = { angle: 0.9, ax: 0, ay: SHEET.height / 2 - 0.04, side: 1, explicit: true }
const across: FoldOp = { angle: Math.PI / 2, ax: 0.02, ay: 0, side: 1, explicit: true }

function near(mark: CreaseMark, point: { x: number; y: number }, tol = 0.004) {
  const dx = mark.b.x - mark.a.x
  const dy = mark.b.y - mark.a.y
  const len = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((point.x - mark.a.x) * dx + (point.y - mark.a.y) * dy) / len))
  const x = mark.a.x + t * dx
  const y = mark.a.y + t * dy
  return Math.hypot(point.x - x, point.y - y) < tol
}

describe('unfold', () => {
  it('opens the latest fold, restores the sheet, and keeps the crease', () => {
    const folded = applyOps([corner])
    const opened = applyOps([corner, { unfold: true }])
    expect(netFolds([corner, { unfold: true }])).toBe(0)
    expect(openCreaseCount([corner, { unfold: true }])).toBe(1)
    expect(materialArea(opened)).toBeCloseTo(materialArea(blankSheet()), 8)
    expect(opened.facets).toHaveLength(1)
    expect(opened.creases.length).toBeGreaterThan(0)
    expect(folded.facets.length).toBeGreaterThan(1)
  })

  it('opens folds from the latest backward and keeps every crease', () => {
    const steps = [corner, across, { unfold: true }, { unfold: true }] as const
    const paper = applyOps(steps)
    expect(netFolds(steps)).toBe(0)
    expect(openCreaseCount(steps)).toBe(2)
    expect(materialArea(paper)).toBeCloseTo(SHEET.width * SHEET.height, 6)
    expect(paper.creases.length).toBeGreaterThanOrEqual(2)
  })

  it('carries an open crease onto paper that is folded again', () => {
    const opened = applyOps([corner, { unfold: true }])
    const mark = opened.creases[0]
    const again = applyOps([corner, { unfold: true }, across])
    const moved = again.creases.some((crease) => !near(crease, mark.a) && !near(crease, mark.b))
    expect(again.creases.length).toBeGreaterThan(0)
    expect(moved || again.creases.some((crease) => near(crease, { x: mark.a.x, y: mark.a.y }))).toBe(true)
    expect(materialArea(again)).toBeCloseTo(materialArea(opened), 6)
  })

  it('treats undo as removing the last action, not as unfolding', () => {
    const history = [corner, { unfold: true }] as const
    const undone = history.slice(0, -1)
    expect(netFolds(undone)).toBe(1)
    expect(openCreaseCount(undone)).toBe(0)
    expect(applyOps(undone).facets.length).toBeGreaterThan(1)
    expect(applyOps([]).creases).toHaveLength(0)
    expect(materialArea(applyOps([]))).toBeCloseTo(SHEET.width * SHEET.height, 8)
  })
})

describe('sheet stock', () => {
  it('uses real width and height for area and mass', () => {
    const square = STOCKS.find((item) => item.id === 'square-small')!
    const letter = deriveShape(blankSheet(DEFAULT_STOCK))
    const small = deriveShape(blankSheet(square))
    expect(small.mass).toBeLessThan(letter.mass * 0.6)
    expect(materialArea(blankSheet(square))).toBeCloseTo(0.15 * 0.15, 8)
    const scaled = scaleFoldOp(corner, DEFAULT_STOCK, square)
    const folded = applyOps([scaled], square)
    expect(folded.facets.length).toBeGreaterThan(1)
    expect(materialArea(folded)).toBeCloseTo(0.15 * 0.15, 6)
  })
})

describe('crease handles', () => {
  it('keeps a horizontal tip crease near the tip while the handle stays on screen', () => {
    const tip = clampCrease({ angle: 0, ax: 0, ay: 0.12, side: 1 }, 1440, 900, DEFAULT_STOCK)
    expect(tip.angle).toBeCloseTo(0)
    expect(Math.abs(tip.ay - 0.12)).toBeLessThan(0.04)
    expect(Math.abs(tip.ax)).toBeLessThan(0.05)
  })

  it('keeps the hub and the round handle inside a desktop canvas', () => {
    const stock = DEFAULT_STOCK
    const wild: FoldOp = { angle: 0.4, ax: -2, ay: 3, side: 1 }
    for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 3]) {
      const clamped = clampCrease({ ...wild, angle }, 1440, 900, stock)
      const again = clampCrease(clamped, 800, 500, stock)
      for (const size of [
        { crease: clamped, w: 1440, h: 900 },
        { crease: again, w: 800, h: 500 },
      ]) {
        const view = {
          left: 0,
          top: 0,
          scale: 1,
          sheetW: stock.width,
          sheetH: stock.height,
          pw: 0,
          ph: 0,
        }
        void view
        const hub = point(size.crease, size.w, size.h, stock, 0)
        const handle = point(size.crease, size.w, size.h, stock, HANDLE_PX / hub.scale)
        expect(hub.x).toBeGreaterThanOrEqual(19)
        expect(hub.x).toBeLessThanOrEqual(size.w - 19)
        expect(hub.y).toBeGreaterThanOrEqual(19)
        expect(hub.y).toBeLessThanOrEqual(size.h - 19)
        expect(handle.x).toBeGreaterThanOrEqual(19)
        expect(handle.y).toBeGreaterThanOrEqual(19)
        expect(handle.x).toBeLessThanOrEqual(size.w - 19)
        expect(handle.y).toBeLessThanOrEqual(size.h - 19)
        expect(size.crease.angle).toBeCloseTo(angle)
      }
    }
  })
})

describe('board ticks', () => {
  it('matches the same sheet coordinate on opposite edges, outside the paper', () => {
    for (const stock of [DEFAULT_STOCK, STOCKS.find((item) => item.id === 'square-medium')!]) {
      const view = fitSheet(1280, 800, stock)
      const marks = boardTickSpans(view, stock)
      expect(marks.top.length).toBe(marks.bottom.length)
      expect(marks.left.length).toBe(marks.right.length)
      expect(marks.top.length).toBeGreaterThan(4)
      marks.top.forEach((tick, i) => {
        const opposite = marks.bottom[i]!
        expect(opposite.at).toBeCloseTo(tick.at, 6)
        expect(tick.cm).toBe(opposite.cm)
        expect(Math.max(tick.from, tick.to)).toBeLessThan(view.top)
        expect(Math.min(opposite.from, opposite.to)).toBeGreaterThan(view.top + view.ph)
      })
      marks.left.forEach((tick, i) => {
        const opposite = marks.right[i]!
        expect(opposite.at).toBeCloseTo(tick.at, 6)
        expect(tick.cm).toBe(opposite.cm)
        expect(Math.max(tick.from, tick.to)).toBeLessThan(view.left)
        expect(Math.min(opposite.from, opposite.to)).toBeGreaterThan(view.left + view.pw)
      })
      const square = stock.width === stock.height
      if (square) expect(marks.top.filter((tick) => tick.major).map((tick) => tick.cm)).toEqual(marks.left.filter((tick) => tick.major).map((tick) => tick.cm))
    }
  })
})

function point(crease: FoldOp, w: number, h: number, stock: typeof DEFAULT_STOCK, offset: number) {
  const clamped = crease
  const frameX = Math.cos(clamped.angle)
  const frameY = Math.sin(clamped.angle)
  const x = clamped.ax + frameX * offset
  const y = clamped.ay + frameY * offset
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
  const left = (w - pw) / 2
  const top = padTop + Math.max(0, (h - padTop - padBottom - ph) / 2)
  const scale = pw / stock.width
  return {
    x: left + (x + stock.width / 2) * scale,
    y: top + (stock.height / 2 - y) * scale,
    scale,
  }
}

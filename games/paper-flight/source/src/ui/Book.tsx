import { useEffect, useRef } from 'react'
import { SHEET } from '../sim/constants'
import type { Dye } from '../sim/dyes'
import type { FoldOp } from '../sim/geometry'
import { RECIPES, type Recipe } from '../sim/recipes'
import { drawLesson, drawMini } from './miniSheet'

const RULE: FoldOp = { angle: 0, ax: 0, ay: SHEET.height / 2 - 0.055, side: 1 }

type Page =
  | { kind: 'move' }
  | { kind: 'rotate' }
  | { kind: 'rule' }
  | { kind: 'recipe'; recipe: Recipe }
  | { kind: 'why' }

const PAGES: Page[] = [
  { kind: 'move' },
  { kind: 'rotate' },
  { kind: 'rule' },
  ...RECIPES.map((recipe) => ({ kind: 'recipe' as const, recipe })),
  { kind: 'why' },
]

interface Props {
  open: boolean
  page: number
  dye: Dye
  canPractice: boolean
  onPage: (page: number) => void
  onClose: () => void
  onPlace: (op: FoldOp) => void
}

export function Book({ open, page, dye, canPractice, onPage, onClose, onPlace }: Props) {
  const index = Math.max(0, Math.min(PAGES.length - 1, page))
  useEffect(() => {
    if (!open) {
      delete document.body.dataset.book
      return
    }
    document.body.dataset.book = 'open'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight') onPage(Math.min(PAGES.length - 1, index + 1))
      else if (event.key === 'ArrowLeft') onPage(Math.max(0, index - 1))
      else return
      event.preventDefault()
      event.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      delete document.body.dataset.book
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open, index, onClose, onPage])

  if (!open) return null
  const current = PAGES[index]
  return (
    <div className="book-scrim" onClick={onClose}>
      <section
        className="book"
        role="dialog"
        aria-modal="true"
        aria-label="Folding book"
        data-page={index + 1}
        data-pages={PAGES.length}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="book-spine" />
        <div className="book-body">
          <header>
            <p>
              Page {index + 1} of {PAGES.length}
            </p>
            <button type="button" data-book="close" onClick={onClose}>
              Close
            </button>
          </header>
          <div className="book-page">
            {current.kind === 'move' && <MovePage dye={dye} />}
            {current.kind === 'rotate' && <RotatePage dye={dye} />}
            {current.kind === 'rule' && <RulePage dye={dye} />}
            {current.kind === 'recipe' && (
              <RecipePage recipe={current.recipe} dye={dye} canPractice={canPractice} onPlace={onPlace} />
            )}
            {current.kind === 'why' && <WhyPage />}
          </div>
          <footer>
            <button type="button" data-book="prev" onClick={() => onPage(index - 1)} disabled={index === 0}>
              Previous
            </button>
            <span className="book-dots" aria-hidden="true">
              {PAGES.map((_, i) => (
                <i key={i} className={i === index ? 'on' : ''} />
              ))}
            </span>
            <button
              type="button"
              data-book="next"
              onClick={() => onPage(index + 1)}
              disabled={index === PAGES.length - 1}
            >
              Next
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}

export const BOOK_PAGE_COUNT = PAGES.length

function MovePage({ dye }: { dye: Dye }) {
  return (
    <>
      <h2>Move the crease</h2>
      <p>
        The dashed line is the crease. Drag the line itself, or the filled hub, and the whole line slides. It can sit anywhere on the sheet, including off a corner.
      </p>
      <Sketch kind="move" dye={dye} />
      <p>The pale line is where it was. The dark line is where you moved it. Arrows on the keyboard nudge it by a few millimeters.</p>
    </>
  )
}

function RotatePage({ dye }: { dye: Dye }) {
  return (
    <>
      <h2>Turn the crease</h2>
      <p>
        The open circle is the handle. Drag it and the line pivots through a full turn, all 360 degrees, around the hub. Hold Shift to snap to 15 degree steps. Q and E rotate it from the keyboard.
      </p>
      <Sketch kind="rotate" dye={dye} />
      <p>A line at 0 degrees and the same line at 180 degrees cut the sheet in the same place. Turning past that swaps which side is which.</p>
    </>
  )
}

function RulePage({ dye }: { dye: Dye }) {
  return (
    <>
      <h2>The smaller side folds over</h2>
      <p>
        These three pictures are the real folder, not a sketch of a different rule. A line near the top cuts off a small strip. That strip is the lighter side, so it flips across the line and lands on the sheet. The larger part stays put.
      </p>
      <div className="book-trio">
        <Mini ops={[]} dye={dye} label="Before" />
        <Mini ops={[]} crease={RULE} dye={dye} label="Crease" />
        <Mini ops={[RULE]} dye={dye} label="After" />
      </div>
      <p>
        If the two sides match, within a small tolerance, you choose the side. Otherwise the choice is made for you: smaller over larger. Folded paper stacks. The back of the sheet shows as a deeper shade of the same color.
      </p>
    </>
  )
}

function RecipePage({
  recipe,
  dye,
  canPractice,
  onPlace,
}: {
  recipe: Recipe
  dye: Dye
  canPractice: boolean
  onPlace: (op: FoldOp) => void
}) {
  return (
    <>
      <h2>{recipe.title}</h2>
      <p>{recipe.intro}</p>
      <p className="book-flight">{recipe.flight}</p>
      <ol className="book-steps">
        {recipe.steps.map((step, index) => {
          const prior = recipe.steps.slice(0, index).map((item) => item.op)
          return (
            <li key={step.title}>
              <Mini ops={prior} dye={dye} label="Before" />
              <Mini ops={prior} crease={step.op} dye={dye} label="Crease" />
              <Mini ops={[...prior, step.op]} dye={dye} label="After" />
              <div>
                <strong>
                  {index + 1}. {step.title}
                </strong>
                <p>{step.detail}</p>
                <button type="button" disabled={!canPractice} onClick={() => onPlace(step.op)}>
                  {canPractice ? 'Place this crease' : 'Place it while folding'}
                </button>
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}

function WhyPage() {
  return (
    <>
      <h2>Some folds are not for flying</h2>
      <p>
        The hall does not score a shape by its name. Mass, outline, and where the paper sits all come from the folds you committed. A pointed sheet with paper in the nose can hold a shallow angle and glide. A short, heavy, or lopsided one stalls, banks, or drops.
      </p>
      <ul>
        <li>The beginner plane and the pointed dart are for the hall.</li>
        <li>The envelope stacks its corners in the middle. It is a letter. Thrown, it falls steeply.</li>
        <li>The flat hat is a short band with a brim. There is no step here that opens it into three dimensions, so it meets the air face-on and does not glide.</li>
      </ul>
      <p>Finish as whatever you folded. A bad landing is a real result.</p>
    </>
  )
}

function Sketch({ kind, dye }: { kind: 'move' | 'rotate'; dye: Dye }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = 2
    canvas.width = 420 * dpr
    canvas.height = 220 * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawLesson(ctx, 420, 220, kind, dye)
  }, [kind, dye])
  return <canvas ref={ref} className="book-sketch" width={420} height={220} />
}

function Mini({
  ops,
  crease,
  dye,
  label,
}: {
  ops: FoldOp[]
  crease?: FoldOp
  dye: Dye
  label: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const signature = JSON.stringify(ops) + (crease ? JSON.stringify(crease) : '') + dye.id + label
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = 2
    canvas.width = 92 * dpr
    canvas.height = 120 * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawMini(ctx, 92, 120, ops, dye, label === 'Crease' ? crease : undefined, false)
  }, [signature, crease, dye, label, ops])
  return (
    <figure className="book-mini">
      <canvas ref={ref} width={92} height={120} />
      <figcaption>{label}</figcaption>
    </figure>
  )
}

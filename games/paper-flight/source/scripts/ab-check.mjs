import puppeteer from 'puppeteer-core'

const base = process.env.BASE || 'http://127.0.0.1:8765'
const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: process.env.HEADED ? false : 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('WebSocket') && !msg.text().includes('Failed to load resource')) errors.push(msg.text())
})
await page.goto(`${base}/games/paper-flight/index.html?solo=1`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.fold-canvas')
await page.waitForFunction(() => (document.body.textContent || '').includes('Solo') || (document.body.textContent || '').includes('SOLO'))

const info = () => page.$eval('.fold', (el) => ({
  folds: el.getAttribute('data-folds'),
  open: el.getAttribute('data-open'),
  provisional: el.getAttribute('data-provisional'),
  seal: el.getAttribute('data-seal'),
  guide: el.getAttribute('data-guide'),
  a: el.getAttribute('data-a'),
  b: el.getAttribute('data-b'),
  ax: el.getAttribute('data-ax'),
  ay: el.getAttribute('data-ay'),
  rx1: Number(el.getAttribute('data-rx1')),
  ry1: Number(el.getAttribute('data-ry1')),
  rx2: Number(el.getAttribute('data-rx2')),
  ry2: Number(el.getAttribute('data-ry2')),
  note: document.querySelector('.fold-note')?.textContent || '',
}))

async function paperScreen(x, y) {
  return page.evaluate((x, y) => {
    const canvas = document.querySelector('.fold-canvas').getBoundingClientRect()
    const stock = { width: 0.2159, height: 0.2794 }
    const padX = 78
    const padTop = 22
    const padBottom = 36
    const maxW = Math.max(80, canvas.width - padX * 2)
    const maxH = Math.max(80, canvas.height - padTop - padBottom)
    const aspect = stock.width / stock.height
    let pw = maxW
    let ph = pw / aspect
    if (ph > maxH) { ph = maxH; pw = ph * aspect }
    const left = (canvas.width - pw) / 2
    const top = padTop + Math.max(0, (canvas.height - padTop - padBottom - ph) / 2)
    const scale = pw / stock.width
    return {
      x: canvas.left + left + (x + stock.width / 2) * scale,
      y: canvas.top + top + (stock.height / 2 - y) * scale,
    }
  }, x, y)
}

async function clickPaper(x, y, button = 'left') {
  const s = await paperScreen(x, y)
  await page.mouse.click(s.x, s.y, { button })
  await new Promise((r) => setTimeout(r, 50))
}

async function dragPaper(x0, y0, x1, y1) {
  const a = await paperScreen(x0, y0)
  const b = await paperScreen(x1, y1)
  await page.mouse.move(a.x, a.y)
  await page.mouse.down()
  await page.mouse.move(b.x, b.y, { steps: 14 })
  await page.mouse.up()
  await new Promise((r) => setTimeout(r, 80))
}

function fail(label, extra) {
  throw new Error(`${label} ${JSON.stringify(extra)}`)
}

const halfW = 0.10795
const halfH = 0.1397

await clickPaper(-halfW, 0)
let state = await info()
if (state.guide !== 'aim' || !state.a || state.b) fail('point A', state)
await clickPaper(0, 0)
state = await info()
if (state.guide !== 'aim' || state.b) fail('interior click completed B', state)

await clickPaper(halfW, 0)
state = await info()
if (state.guide !== 'set' || state.folds !== '0') fail('A-B line', state)
const savedB = state.b
await page.screenshot({ path: '/tmp/ab-line.jpg', type: 'jpeg', quality: 74 })

await dragPaper(0, halfH, 0, 0.05)
state = await info()
if (state.provisional !== '1' || state.folds !== '0') fail('top drag', state)
if (!((state.ry1 + state.ry2) / 2 > 0.01)) fail('top ridge', state)
const firstRidge = (state.ry1 + state.ry2) / 2
await dragPaper(0, firstRidge * 0.45, 0, 0.01)
state = await info()
if (state.provisional !== '1') fail('adjust', state)
if ((state.ry1 + state.ry2) / 2 >= firstRidge - 0.005) fail('ridge did not move', state)
await page.click('button::-p-text(Undo)')
await new Promise((r) => setTimeout(r, 40))

await dragPaper(0, -halfH, 0, -0.05)
state = await info()
if (state.provisional !== '1' || (state.ry1 + state.ry2) / 2 >= -0.01) fail('bottom drag', state)
await page.click('button::-p-text(Undo)')
await new Promise((r) => setTimeout(r, 40))

const before = await info()
await dragPaper(0, halfH, 0, -halfH)
state = await info()
if (state.provisional !== '1' || state.folds !== '0') fail('full limit', state)
if (state.a !== before.a || state.b !== before.b) fail('drag moved nodes', state)
const start = await paperScreen(state.rx1 + (state.rx2 - state.rx1) * 0.12, state.ry1 + (state.ry2 - state.ry1) * 0.12)
const end = await paperScreen(state.rx1 + (state.rx2 - state.rx1) * 0.9, state.ry1 + (state.ry2 - state.ry1) * 0.9)
await page.mouse.move(start.x, start.y)
await page.mouse.down()
const mid = await info()
if (mid.provisional !== '1' || mid.folds !== '0' || mid.a !== before.a) fail('ridge press reset the fold', mid)
await page.mouse.move(end.x, end.y, { steps: 24 })
await page.mouse.up()
await new Promise((r) => setTimeout(r, 150))
state = await info()
if (state.folds !== '1' || state.guide !== 'idle' || state.provisional !== '0') fail('seal', state)

await clickPaper(-halfW, -0.04)
await clickPaper(halfW, -0.04)
state = await info()
if (state.guide !== 'set' || state.folds !== '1') fail('second line on folded sheet', state)
await dragPaper(0, -halfH, 0, -0.08)
state = await info()
if (state.provisional !== '1' || state.folds !== '1') fail('second grab', state)
const during = state
await clickPaper(-halfW, -0.04, 'right')
state = await info()
if (state.a !== during.a || state.provisional !== '1') fail('right-click during hold', state)
await page.click('button::-p-text(Undo)')
await new Promise((r) => setTimeout(r, 40))
state = await info()
if (state.folds !== '1' || state.provisional !== '0') fail('undo hold kept the crease', state)

const both = await info()
await clickPaper(-halfW, -0.04, 'right')
state = await info()
if (state.a || state.b !== both.b || state.folds !== '1') fail('remove A only', state)
await clickPaper(-halfW, -0.02)
state = await info()
if (!state.a || state.b !== both.b || state.guide !== 'set') fail('replace A', state)
await clickPaper(halfW, -0.04, 'right')
state = await info()
if (state.b || !state.a || state.folds !== '1') fail('remove B only', state)
const keptA = state.a
await clickPaper(-halfW, -0.02, 'right')
state = await info()
if (state.a || state.b || state.folds !== '1') fail('remove both', { state, keptA })
await clickPaper(-halfW, -0.02)
await clickPaper(halfW, -0.02)
state = await info()
if (state.guide !== 'set') fail('reset setup', state)
await page.click('button::-p-text(Reset nodes)')
await new Promise((r) => setTimeout(r, 40))
state = await info()
if (state.guide !== 'idle' || state.a || state.b || state.folds !== '1') fail('reset nodes', state)

async function placeGuide(step) {
  if (!(await page.$('.guide'))) await page.click('button::-p-text(Guide)')
  await page.waitForSelector('.guide li button')
  const buttons = await page.$$('.guide li button')
  await buttons[step].click()
  await new Promise((r) => setTimeout(r, 40))
  if (await page.$('.guide')) await page.click('button::-p-text(Hide guide)')
}

async function sealHeld() {
  const ridge = await info()
  const t0 = await paperScreen(ridge.rx1 + (ridge.rx2 - ridge.rx1) * 0.15, ridge.ry1 + (ridge.ry2 - ridge.ry1) * 0.15)
  const t1 = await paperScreen(ridge.rx1 + (ridge.rx2 - ridge.rx1) * 0.85, ridge.ry1 + (ridge.ry2 - ridge.ry1) * 0.85)
  await page.mouse.move(t0.x, t0.y)
  await page.mouse.down()
  await page.mouse.move(t1.x, t1.y, { steps: 16 })
  await page.mouse.up()
  await new Promise((r) => setTimeout(r, 80))
}

await page.click('button::-p-text(Reset)')
await new Promise((r) => setTimeout(r, 40))
await placeGuide(0)
await page.click('button::-p-text(Hold at the line)')
await new Promise((r) => setTimeout(r, 40))
state = await info()
if (state.provisional !== '1') fail('corner hold', state)
await sealHeld()
await placeGuide(1)
await page.click('button::-p-text(Hold at the line)')
await new Promise((r) => setTimeout(r, 40))
state = await info()
if (state.provisional !== '1' || state.folds !== '1') fail('second corner', state)
await sealHeld()
state = await info()
if (state.folds !== '2') fail('two corners', state)
await clickPaper(-0.055, 0.0847)
await clickPaper(0.055, 0.0847)
state = await info()
if (state.guide !== 'set') fail('tip line', state)
await dragPaper(0, halfH, 0, 0.09)
state = await info()
if (state.provisional !== '1' || state.folds !== '2') fail('tip after corners', state)

console.log(JSON.stringify({ ok: true, folds: state.folds, errors }, null, 2))
await browser.close()
if (errors.length) process.exit(1)

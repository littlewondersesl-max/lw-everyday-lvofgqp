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
await page.waitForFunction(() => document.body.textContent.includes('Solo'))

const info = () => page.$eval('.fold', (el) => ({
  folds: el.getAttribute('data-folds'),
  open: el.getAttribute('data-open'),
  provisional: el.getAttribute('data-provisional'),
  seal: el.getAttribute('data-seal'),
  ax: Number(el.getAttribute('data-ax')),
  ay: Number(el.getAttribute('data-ay')),
  angle: Number(el.getAttribute('data-angle')),
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

async function assertChromeOutsidePaper() {
  const layout = await page.evaluate(() => {
    const canvas = document.querySelector('.fold-canvas').getBoundingClientRect()
    const hits = {}
    for (const name of ['.fold-bar', '.fold-readout', '.fold-hint', '.fold-note', '.fold-dock', '.fold-tools']) {
      const el = document.querySelector(name)
      if (!el) {
        hits[name] = null
        continue
      }
      const r = el.getBoundingClientRect()
      hits[name] = r.left < canvas.right && r.right > canvas.left && r.top < canvas.bottom && r.bottom > canvas.top
    }
    return { bar: hits, canvasTop: canvas.top, canvasHeight: canvas.height }
  })
  const missing = ['.fold-bar', '.fold-readout', '.fold-hint', '.fold-dock', '.fold-tools'].filter((name) => layout.bar[name] == null)
  const overlap = Object.entries(layout.bar).filter(([, hit]) => hit)
  if (missing.length || overlap.length) throw new Error(`status overlaps the sheet ${JSON.stringify(layout)}`)
  return layout
}

async function placeGuide(step) {
  if (!(await page.$('.guide'))) await page.click('button::-p-text(Guide)')
  await page.waitForSelector('.guide')
  const buttons = await page.$$('.guide li button')
  await buttons[step].click()
  await new Promise((r) => setTimeout(r, 40))
  if (await page.$('.guide')) await page.click('button::-p-text(Hide guide)')
}

console.log('chrome', await assertChromeOutsidePaper())
for (let i = 0; i < 16; i++) {
  const angle = await page.$eval('.fold', (el) => Number(el.dataset.angle))
  const deg = Math.atan2(Math.sin(angle), Math.cos(angle)) * 180 / Math.PI
  if (Math.min(Math.abs(deg), 180 - Math.abs(deg)) < 1) break
  await page.keyboard.down('Shift')
  await page.keyboard.press(Math.abs(deg) <= 90 ? (deg < 0 ? 'KeyQ' : 'KeyE') : (deg > 0 ? 'KeyE' : 'KeyQ'))
  await page.keyboard.up('Shift')
  await new Promise((r) => setTimeout(r, 30))
}
await page.screenshot({ path: '/tmp/fold-board.jpg', type: 'jpeg', quality: 74 })

await placeGuide(0)
const guide = await info()
if (guide.folds !== '0') throw new Error('guide created a fold')
const corner = await paperScreen(-0.10795, 0.1397)
const dx = Math.cos(guide.angle)
const dy = Math.sin(guide.angle)
const nx = -dy
const ny = dx
const vx = -0.10795 - guide.ax
const vy = 0.1397 - guide.ay
const dist = vx * nx + vy * ny
const onLine = await paperScreen(-0.10795 - nx * dist, 0.1397 - ny * dist)
console.log('drag', corner, onLine, 'guide', guide)
await page.screenshot({ path: '/tmp/fold-before-drag.jpg', type: 'jpeg', quality: 60 })
await page.mouse.move(corner.x, corner.y)
await page.mouse.down()
await page.mouse.move(onLine.x, onLine.y, { steps: 12 })
await page.mouse.up()
await new Promise((r) => setTimeout(r, 200))
console.log('after drag', await info())
await page.screenshot({ path: '/tmp/fold-after-drag.jpg', type: 'jpeg', quality: 60 })
const held = await info()
if (held.folds !== '0') throw new Error('provisional became a real fold')
await page.screenshot({ path: '/tmp/fold-provisional.jpg', type: 'jpeg', quality: 74 })

const start = await paperScreen(held.rx1 + (held.rx2 - held.rx1) * 0.12, held.ry1 + (held.ry2 - held.ry1) * 0.12)
const end = await paperScreen(held.rx1 + (held.rx2 - held.rx1) * 0.9, held.ry1 + (held.ry2 - held.ry1) * 0.9)
console.log('trace', start, end)
const diag = await page.evaluate((sx, sy) => {
  const canvas = document.querySelector('.fold-canvas').getBoundingClientRect()
  const fold = document.querySelector('.fold')
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
  const x = sx - canvas.left
  const y = sy - canvas.top
  return {
    paper: { x: (x - left) / scale - stock.width / 2, y: stock.height / 2 - (y - top) / scale },
    rx: [fold.getAttribute('data-rx1'), fold.getAttribute('data-ry1'), fold.getAttribute('data-rx2'), fold.getAttribute('data-ry2')],
    canvas: { left: canvas.left, top: canvas.top, w: canvas.width, h: canvas.height },
  }
}, start.x, start.y)
console.log('diag', diag)
await page.mouse.move(start.x, start.y)
await page.mouse.down()
await page.mouse.move(end.x, end.y, { steps: 24 })
await page.mouse.up()
await new Promise((r) => setTimeout(r, 250))
console.log('after trace', await info(), await page.$eval('.fold', (el) => el.dataset.hit))
const sealed = await info()
await page.screenshot({ path: '/tmp/fold-sealed.jpg', type: 'jpeg', quality: 74 })
await page.click('button.unfold')
await new Promise((r) => setTimeout(r, 300))
const unfolded = await info()
if (unfolded.folds !== '0' || unfolded.open !== '1') throw new Error(`unfold ${JSON.stringify(unfolded)}`)

await placeGuide(0)
await page.click('button.primary')
await page.waitForFunction(() => document.querySelector('.fold-note')?.textContent?.includes('Held at the line'))
const tap = await paperScreen((await info()).rx1, (await info()).ry1)
await page.mouse.click(tap.x, tap.y)
await new Promise((r) => setTimeout(r, 200))
const afterTap = await info()
if (afterTap.folds !== '0') throw new Error('a tap sealed the ridge')

await page.setViewport({ width: 800, height: 640 })
await new Promise((r) => setTimeout(r, 250))
console.log('chrome-narrow', await assertChromeOutsidePaper())
await page.screenshot({ path: '/tmp/fold-board-narrow.jpg', type: 'jpeg', quality: 74 })

console.log(JSON.stringify({ guideFolds: guide.folds, held: { folds: held.folds, provisional: held.provisional, note: held.note }, sealed: sealed.folds, afterTap, errors }, null, 2))
await browser.close()
if (errors.length) process.exit(1)

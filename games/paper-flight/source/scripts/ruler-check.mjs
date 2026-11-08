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
await page.waitForFunction(() => (document.body.textContent || '').toUpperCase().includes('SOLO'))

const info = () => page.$eval('.fold', (el) => ({
  folds: el.getAttribute('data-folds'),
  open: el.getAttribute('data-open'),
  ax: Number(el.getAttribute('data-ax')),
  ay: Number(el.getAttribute('data-ay')),
  angle: Number(el.getAttribute('data-angle')),
  foldAngle: el.getAttribute('data-fold-angle'),
  text: document.querySelector('.fold-readout')?.textContent || '',
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
      scale,
    }
  }, x, y)
}

async function dragPaper(x0, y0, x1, y1) {
  const a = await paperScreen(x0, y0)
  const b = await paperScreen(x1, y1)
  await page.mouse.move(a.x, a.y)
  await page.mouse.down()
  await page.mouse.move(b.x, b.y, { steps: 16 })
  await page.mouse.up()
  await new Promise((r) => setTimeout(r, 80))
}

function fail(label, extra) {
  throw new Error(`${label} ${JSON.stringify(extra)}`)
}

const halfW = 0.10795
const halfH = 0.1397
let state = await info()
if (state.folds !== '0' || Math.abs(state.ax) > 0.002 || Math.abs(state.ay) > 0.002) fail('ruler starts at center', state)
if ((await page.$('button::-p-text(Reset nodes)')) || (await page.$('button::-p-text(Hold at the line)'))) fail('old controls remain', state)
await page.screenshot({ path: '/tmp/ruler.jpg', type: 'jpeg', quality: 74 })

const hub = await paperScreen(0, 0)
const moved = await paperScreen(0.03, 0.02)
await page.mouse.move(hub.x, hub.y)
await page.mouse.down()
await page.mouse.move(moved.x, moved.y, { steps: 8 })
await page.mouse.up()
await new Promise((r) => setTimeout(r, 40))
state = await info()
if (state.folds !== '0' || Math.hypot(state.ax - 0.03, state.ay - 0.02) > 0.012) fail('move ruler', state)

const spin = await paperScreen(state.ax + 36 / (await paperScreen(0, 0)).scale, state.ay)
await page.mouse.move(spin.x, spin.y)
await page.mouse.down()
await page.mouse.move(spin.x, spin.y - 28, { steps: 8 })
await page.mouse.up()
await new Promise((r) => setTimeout(r, 40))
const turned = await info()
if (turned.folds !== '0' || Math.abs(turned.angle - state.angle) < 0.02) fail('rotate ruler', { before: state.angle, after: turned.angle, folds: turned.folds })

const corner = { x: -halfW, y: halfH }
await page.click('button::-p-text(Reset)')
await dragPaper(corner.x, corner.y, corner.x + 0.055, corner.y - 0.012)
state = await info()
if (state.folds !== '1' || state.foldAngle === '') fail('up drag commits', state)
const upAngle = Number(state.foldAngle)
await page.screenshot({ path: '/tmp/ruler-up.jpg', type: 'jpeg', quality: 74 })

await page.click('button::-p-text(Reset)')
await new Promise((r) => setTimeout(r, 40))
await dragPaper(corner.x, corner.y, corner.x + 0.055, corner.y - 0.07)
state = await info()
if (state.folds !== '1') fail('down drag commits', state)
const downAngle = Number(state.foldAngle)
const tilt = Math.atan2(Math.sin(upAngle - downAngle), Math.cos(upAngle - downAngle))
if (Math.abs(tilt) < 0.15) fail('drags match', { upAngle, downAngle, tilt })
await page.screenshot({ path: '/tmp/ruler-down.jpg', type: 'jpeg', quality: 74 })

await page.click('button::-p-text(Reset)')
await dragPaper(0, -halfH, 0.01, -halfH + 0.06)
state = await info()
if (state.folds !== '1') fail('bottom side', state)
await page.click('button::-p-text(Undo)')
await new Promise((r) => setTimeout(r, 40))
state = await info()
if (state.folds !== '0') fail('undo', state)

await dragPaper(corner.x, corner.y, corner.x + 0.05, corner.y - 0.04)
await page.click('button.unfold')
await new Promise((r) => setTimeout(r, 40))
state = await info()
if (state.folds !== '0' || state.open !== '1') fail('unfold', state)

async function placeGuide(step) {
  if (!(await page.$('.guide'))) await page.click('button::-p-text(Guide)')
  await page.waitForSelector('.guide li button')
  const buttons = await page.$$('.guide li button')
  await buttons[step].click()
  await new Promise((r) => setTimeout(r, 30))
  if (await page.$('.guide')) await page.click('button::-p-text(Hide guide)')
}
await page.click('button::-p-text(Reset)')
await placeGuide(0)
await dragPaper(-halfW, halfH, -0.04, 0.09)
await placeGuide(1)
await dragPaper(halfW, halfH, 0.04, 0.09)
await dragPaper(0, halfH, 0.01, 0.07)
state = await info()
if (state.folds !== '3') fail('corner corner tip', state)

console.log(JSON.stringify({ ok: true, upAngle, downAngle, tilt, errors }, null, 2))
await browser.close()
if (errors.length) process.exit(1)

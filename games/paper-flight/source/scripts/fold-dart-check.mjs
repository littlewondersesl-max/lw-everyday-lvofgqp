import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

mkdirSync('/opt/cursor/artifacts', { recursive: true })
const base = process.env.BASE || 'http://127.0.0.1:8765'
const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(err.message))
await page.goto(`${base}/games/paper-flight/index.html?solo=1`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.fold-canvas')

const info = () => page.$eval('.fold', (el) => ({
  folds: el.getAttribute('data-folds'),
  open: el.getAttribute('data-open'),
  creases: el.getAttribute('data-creases'),
  layers: el.getAttribute('data-layers'),
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

async function dragPaper(x0, y0, x1, y1) {
  const a = await paperScreen(x0, y0)
  const b = await paperScreen(x1, y1)
  await page.mouse.move(a.x, a.y)
  await page.mouse.down()
  await page.mouse.move(b.x, b.y, { steps: 16 })
  await page.mouse.up()
  await new Promise((r) => setTimeout(r, 120))
}

async function shot(name) {
  const path = `/opt/cursor/artifacts/${name}.jpg`
  await page.screenshot({ path, type: 'jpeg', quality: 78 })
  console.log(name, await info())
}

const halfW = 0.10795
const halfH = 0.1397

await dragPaper(-halfW, halfH, 0, halfH - halfW)
await page.click('button::-p-text(Unfold)')
await new Promise((r) => setTimeout(r, 80))
await shot('fold-1-unfold')

await page.click('button::-p-text(Reset)')
await new Promise((r) => setTimeout(r, 80))
const cleared = await info()
if (cleared.folds !== '0' || cleared.creases !== '0') {
  console.log(JSON.stringify({ cleared, errors }, null, 2))
  throw new Error('reset left creases')
}

await dragPaper(-halfW, halfH, 0, halfH - halfW)
await dragPaper(halfW, halfH, 0, halfH - halfW)
await shot('fold-2-corners')

await page.click('button::-p-text(Top sheet)')
await dragPaper(-halfW, 0, halfW, 0)
await shot('fold-3-half')

await page.click('button::-p-text(All layers)')
await dragPaper(halfW, 0, 0, 0)
await shot('fold-4-wing')
await shot('fold-5-wing-still')

await page.click('button::-p-text(Flip paper)')
await new Promise((r) => setTimeout(r, 80))
await dragPaper(-halfW, 0, 0, 0)
await shot('fold-6-second-wing')

for (let i = 0; i < 6; i++) {
  const now = await info()
  if (now.folds === '0') break
  await page.click('button::-p-text(Unfold)')
  await new Promise((r) => setTimeout(r, 60))
}
await shot('fold-7-unfold-all')
console.log(JSON.stringify({ ok: errors.length === 0, errors }, null, 2))
await browser.close()
if (errors.length) process.exit(1)

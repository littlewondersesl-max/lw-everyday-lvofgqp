import puppeteer from 'puppeteer-core'

const base = process.env.BASE || 'http://127.0.0.1:8765'
const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900'],
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

const read = () => page.evaluate(() => {
  const fold = document.querySelector('.fold')
  return {
    folds: fold?.getAttribute('data-folds'),
    open: fold?.getAttribute('data-open'),
    stock: fold?.getAttribute('data-stock'),
    ax: Number(fold?.getAttribute('data-ax')),
    ay: Number(fold?.getAttribute('data-ay')),
    angle: Number(fold?.getAttribute('data-angle')),
    note: document.querySelector('.fold-note')?.textContent || '',
    label: document.querySelector('.stock p')?.textContent || '',
    newSheet: [...document.querySelectorAll('.stock button')].some((b) => b.textContent.includes('New sheet')),
    unfoldDisabled: [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Unfold')?.disabled,
  }
})

const start = await read()
if (start.stock !== 'rect-medium' || !start.label.includes('216') || start.unfoldDisabled !== true) {
  throw new Error(`start ${JSON.stringify(start)}`)
}
await page.click('button.primary')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-folds') === '1')
await page.click('button.unfold')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-folds') === '0' && document.querySelector('.fold')?.getAttribute('data-open') === '1')
const opened = await read()
if (!opened.note.includes('crease stays')) throw new Error(opened.note)
await page.screenshot({ path: '/tmp/pf-unfold.jpg', type: 'jpeg', quality: 74 })
await page.click('button.primary')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-folds') === '1')

const corner = await page.evaluate(() => {
  const canvas = document.querySelector('.fold-canvas')
  const rect = canvas.getBoundingClientRect()
  const ctx = canvas.getContext('2d')
  const outside = ctx.getImageData(8, 8, 1, 1).data
  const inside = ctx.getImageData(rect.width / 2, rect.height / 2, 1, 1).data
  return {
    outside: [...outside],
    inside: [...inside],
    w: rect.width,
    h: rect.height,
  }
})
if (corner.outside[0] > 80 || corner.outside[1] > 80 || corner.outside[2] > 80) throw new Error(`desk not dark ${corner.outside}`)
if (corner.inside[1] < 140) throw new Error(`paper not light ${corner.inside}`)

await page.mouse.move(200, 200)
const beforeDrag = await read()
const canvasBox = await page.$eval('.fold-canvas', (el) => {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
})
await page.mouse.move(canvasBox.left + canvasBox.width * 0.5, canvasBox.top + canvasBox.height * 0.45)
await page.mouse.down()
await page.mouse.move(2, 2, { steps: 8 })
await page.mouse.up()
const dragged = await read()
if (dragged.ax === beforeDrag.ax && dragged.ay === beforeDrag.ay) {
  // The pointer may have missed the handle. Nudge with keys toward a corner, then clamp is what we assert.
  for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowLeft')
  for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowUp')
}
const edged = await read()
const pos = await page.evaluate((state) => {
  const canvas = document.querySelector('.fold-canvas')
  const rect = canvas.getBoundingClientRect()
  const stock = { width: 0.2159, height: 0.2794 }
  const maxW = Math.max(80, rect.width - 160)
  const maxH = Math.max(80, rect.height - 180)
  const aspect = stock.width / stock.height
  let pw = maxW
  let ph = pw / aspect
  if (ph > maxH) { ph = maxH; pw = ph * aspect }
  const left = (rect.width - pw) / 2
  const top = (rect.height - ph) / 2 - 10
  const scale = pw / stock.width
  const frameX = Math.cos(state.angle)
  const frameY = Math.sin(state.angle)
  const screen = (ox, oy) => ({
    x: left + (state.ax + frameX * ox + stock.width / 2) * scale,
    y: top + (stock.height / 2 - (state.ay + frameY * oy)) * scale,
  })
  return { hub: screen(0, 0), handle: screen(0.16, 0), w: rect.width, h: rect.height }
}, edged)
for (const p of [pos.hub, pos.handle]) {
  if (p.x < 20 || p.y < 20 || p.x > pos.w - 20 || p.y > pos.h - 20) {
    throw new Error(`handle escaped ${JSON.stringify(pos)}`)
  }
}

await page.click('button::-p-text(Square)')
await page.click('button::-p-text(Small)')
await page.waitForFunction(() => (document.querySelector('.stock p')?.textContent || '').includes('150 × 150'))
const squareLabel = await page.$eval('.stock p', (el) => el.textContent)
const blocked = await read()
if (blocked.folds !== '1') throw new Error('size change cleared folds')
if (!blocked.newSheet) throw new Error('missing New sheet')
await page.click('button::-p-text(New sheet)')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-stock') === 'square-small' && document.querySelector('.fold')?.getAttribute('data-folds') === '0')

console.log(JSON.stringify({ start: start.stock, opened, squareLabel, desk: corner.outside.slice(0, 3), paper: corner.inside.slice(0, 3), pos, errors }, null, 2))
await browser.close()
if (errors.length) process.exit(1)

import puppeteer from 'puppeteer-core'

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
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('WebSocket') && !msg.text().includes('Failed to load resource')) errors.push(msg.text())
})
await page.goto(`${base}/games/paper-flight/index.html?solo=1`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.fold-canvas')
await page.waitForFunction(() => document.body.textContent.includes('Solo'))

async function foldGuide(n) {
  if (!(await page.$('.guide'))) await page.click('button::-p-text(Guide)')
  await page.waitForSelector('.guide')
  const buttons = await page.$$('.guide li button')
  await buttons[n].click()
  await new Promise((r) => setTimeout(r, 30))
  await page.click('button.primary')
  await new Promise((r) => setTimeout(r, 640))
}
await foldGuide(0)
await foldGuide(1)
if (await page.$('.guide')) await page.click('button::-p-text(Hide guide)')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-folds') === '2')

const locate = () => page.evaluate(() => {
  const fold = document.querySelector('.fold')
  const canvas = document.querySelector('.fold-canvas').getBoundingClientRect()
  const ax = Number(fold.getAttribute('data-ax'))
  const ay = Number(fold.getAttribute('data-ay'))
  const angle = Number(fold.getAttribute('data-angle'))
  const stock = { width: 0.2159, height: 0.2794 }
  const maxW = Math.max(80, canvas.width - 160)
  const maxH = Math.max(80, canvas.height - 180)
  let pw = maxW
  let ph = pw / (stock.width / stock.height)
  if (ph > maxH) { ph = maxH; pw = ph * (stock.width / stock.height) }
  const left = (canvas.width - pw) / 2
  const top = (canvas.height - ph) / 2 - 10
  const scale = pw / stock.width
  const screen = (x, y) => ({
    x: canvas.left + left + (x + stock.width / 2) * scale,
    y: canvas.top + top + (stock.height / 2 - y) * scale,
  })
  const hub = screen(ax, ay)
  const reach = 58 / scale
  const handle = screen(ax + Math.cos(angle) * reach, ay + Math.sin(angle) * reach)
  const foldBtn = [...document.querySelectorAll('.fold-tools button')].find((b) => b.textContent.trim() === 'Fold')
  return {
    readout: document.querySelector('.fold-readout')?.innerText,
    folds: fold.getAttribute('data-folds'),
    open: fold.getAttribute('data-open'),
    ax, ay, angle,
    hub, handle,
    dist: Math.hypot(handle.x - hub.x, handle.y - hub.y),
    foldDisabled: foldBtn?.disabled,
  }
})

const parked = await locate()
if (parked.dist > 80) throw new Error(`handle still far from hub ${parked.dist}`)
const before = parked.angle
await page.mouse.move(parked.handle.x, parked.handle.y)
await page.mouse.down()
await page.mouse.move(parked.hub.x + 70, parked.hub.y, { steps: 8 })
await page.mouse.up()
const dragged = await locate()
if (Math.abs(dragged.angle - before) < 0.2) throw new Error(`drag did not rotate ${before} -> ${dragged.angle}`)

for (let i = 0; i < 24; i++) {
  const now = await locate()
  const deg = ((now.angle * 180) / Math.PI + 360) % 360
  if (deg < 12 || deg > 348) break
  await page.keyboard.press(deg > 180 ? 'KeyE' : 'KeyQ')
}
for (let i = 0; i < 40; i++) {
  const now = await locate()
  if (now.ay > 0.1) break
  await page.keyboard.press('ArrowUp')
}
let ready = await locate()
if (ready.foldDisabled) {
  const opposite = await page.$('button::-p-text(Opposite side)')
  if (opposite) await opposite.click()
  ready = await locate()
}
if (ready.foldDisabled) throw new Error(`tip fold blocked ${ready.readout}`)
await page.click('button.primary')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-folds') === '3', { timeout: 4000 })
await page.screenshot({ path: '/tmp/tip-folded.jpg', type: 'jpeg', quality: 74 })
const folded = await locate()
await page.click('button.unfold')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-folds') === '2' && document.querySelector('.fold')?.getAttribute('data-open') === '1')
const opened = await locate()
console.log(JSON.stringify({ parkedDist: parked.dist, dragged: dragged.angle, ready: ready.readout, folded: folded.folds, opened }, null, 2))
await browser.close()
if (errors.length || folded.folds !== '3' || opened.folds !== '2' || opened.open !== '1') process.exit(1)

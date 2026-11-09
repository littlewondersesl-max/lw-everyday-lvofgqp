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
await page.waitForFunction(() => (document.body.textContent || '').toUpperCase().includes('SOLO'))

const info = () => page.$eval('.fold', (el) => ({
  folds: el.getAttribute('data-folds'),
  adjust: el.getAttribute('data-adjust'),
  hinges: el.getAttribute('data-hinges'),
  parts: el.getAttribute('data-parts'),
  qx: el.getAttribute('data-qx'),
  qy: el.getAttribute('data-qy'),
  qz: el.getAttribute('data-qz'),
  qw: el.getAttribute('data-qw'),
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
await dragPaper(-halfW, halfH, 0, halfH - halfW)
await dragPaper(halfW, halfH, 0, halfH - halfW)
await page.click('button::-p-text(Top sheet)')
await dragPaper(-halfW, 0, halfW, 0)
await page.click('button::-p-text(All layers)')
await dragPaper(halfW, 0, 0.02, 0)
await page.click('button::-p-text(Flip paper)')
await new Promise((r) => setTimeout(r, 40))
await dragPaper(-halfW, 0, -0.02, 0)
let state = await info()
if (state.folds !== '5') fail('dart folds', state)

await page.click('button::-p-text(Adjust)')
await page.waitForSelector('.adjust-canvas')
await new Promise((r) => setTimeout(r, 200))
state = await info()
if (state.adjust !== '1' || Number(state.hinges) < 2) fail('adjust', state)
for (let i = 0; i < 4; i++) await page.click('button::-p-text(Yaw right)')
await new Promise((r) => setTimeout(r, 150))
await page.screenshot({ path: '/tmp/adjust-turned.jpg', type: 'jpeg', quality: 76 })

function wingPlies(hingeList) {
  return hingeList.split(',').filter(Boolean).map((item) => {
    const [ply, len] = item.split(':')
    return { ply, len: Number(len) }
  }).filter((hinge) => hinge.len > 0.14 && hinge.len < 0.25).map((hinge) => hinge.ply)
}

async function pullWing(direction, done, wantSign) {
  const listed = await page.$eval('.fold', (el) => el.getAttribute('data-hinge-list') || '')
  const wings = new Set(wingPlies(listed))
  const box = await page.$eval('.adjust-canvas', (el) => {
    const rect = el.getBoundingClientRect()
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
  })
  for (let ix = 0; ix <= 12; ix++) {
    for (let iy = 0; iy <= 10; iy++) {
      const fx = 0.32 + ix * 0.03
      const fy = 0.4 + iy * 0.035
      const x = box.x + box.width * fx
      const y = box.y + box.height * fy
      await page.mouse.move(x, y)
      await page.mouse.down()
      const hot = await page.$eval('.fold', (el) => el.dataset.hot || '')
      await page.mouse.up()
      if (!wings.has(hot) || done.has(hot)) continue
      const angleOf = async () => {
        const now = await info()
        const part = now.parts.split(',').find((item) => item.startsWith(`${hot}:`))
        return part ? Number(part.split(':')[1]) : 0
      }
      const drag = async (pixels) => {
        await page.mouse.move(x, y)
        await page.mouse.down()
        const nowHot = await page.$eval('.fold', (el) => el.dataset.hot || '')
        if (nowHot !== hot) {
          await page.mouse.up()
          return angleOf()
        }
        await page.mouse.move(x + 24, y + pixels, { steps: 12 })
        await page.mouse.up()
        await new Promise((r) => setTimeout(r, 30))
        return angleOf()
      }
      let angle = await drag(direction * 140)
      if (Math.sign(angle) !== wantSign || Math.abs(angle) < 0.45) angle = await drag(-direction * 180)
      if (Math.abs(angle) > 0.45 && Math.abs(angle) < 2.8) {
        done.add(hot)
        return info()
      }
    }
  }
  return info()
}

const done = new Set()
state = await pullWing(-1, done, 1)
if (done.size < 1) fail('first wing pull', state)
for (let i = 0; i < 12; i++) await page.click('button::-p-text(Roll left)')
await new Promise((r) => setTimeout(r, 120))
state = await pullWing(1, done, -1)
const opened = state.parts.split(',').filter(Boolean)
if (opened.length < 2) fail('second wing pull', state)
for (let i = 0; i < 12; i++) await page.click('button::-p-text(Roll left)')
for (let i = 0; i < 3; i++) await page.click('button::-p-text(Pitch up)')
await new Promise((r) => setTimeout(r, 150))
await page.screenshot({ path: '/tmp/adjust-wings.jpg', type: 'jpeg', quality: 76 })
state = await info()

await page.click('button::-p-text(Go to hall)')
await page.waitForSelector('.hall-canvas', { timeout: 4000 })
await new Promise((r) => setTimeout(r, 500))
await page.screenshot({ path: '/tmp/adjust-hall.jpg', type: 'jpeg', quality: 76 })
console.log(JSON.stringify({ ok: true, state, errors }, null, 2))
await browser.close()
if (errors.length) process.exit(1)

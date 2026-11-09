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
await dragPaper(halfW, 0, 0, 0)
await page.click('button::-p-text(Flip paper)')
await new Promise((r) => setTimeout(r, 40))
await dragPaper(-halfW, 0, 0, 0)
let state = await info()
if (state.folds !== '5') fail('dart folds', state)

await page.click('button::-p-text(Adjust)')
await page.waitForSelector('.adjust-canvas')
await new Promise((r) => setTimeout(r, 200))
state = await info()
if (state.adjust !== '1' || Number(state.hinges) < 2) fail('adjust', state)
await page.screenshot({ path: '/tmp/adjust-flat.jpg', type: 'jpeg', quality: 74 })

function hingeRows(list) {
  return list.split(',').filter(Boolean).map((item) => {
    const [ply, len] = item.split(':')
    return { ply, len: Number(len) }
  })
}

function wingPlies(list) {
  return hingeRows(list).filter((hinge) => hinge.len > 0.16 && hinge.len < 0.26).map((hinge) => hinge.ply)
}

const box = await page.$eval('.adjust-canvas', (el) => {
  const rect = el.getBoundingClientRect()
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
})
const wings = new Set(wingPlies(await page.$eval('.fold', (el) => el.getAttribute('data-hinge-list') || '')))
if (wings.size < 2) fail('wing hinges', await info())

async function probe(fx, fy) {
  const x = box.x + box.width * fx
  const y = box.y + box.height * fy
  await page.mouse.move(x, y)
  await page.mouse.down()
  const hot = await page.$eval('.fold', (el) => el.dataset.hot || '')
  await page.mouse.up()
  return { x, y, fx, fy, hot }
}

async function angleOf(ply) {
  const part = (await info()).parts.split(',').find((item) => item.startsWith(`${ply}:`))
  return part ? Number(part.split(':')[1]) : 0
}

async function dragHot(spot, pixels) {
  await page.mouse.move(spot.x, spot.y)
  await page.mouse.down()
  const hot = await page.$eval('.fold', (el) => el.dataset.hot || '')
  if (hot !== spot.hot) {
    await page.mouse.up()
    return hot
  }
  await page.mouse.move(spot.x, spot.y + pixels, { steps: 14 })
  await page.mouse.up()
  await new Promise((r) => setTimeout(r, 40))
  return hot
}

const spots = []
for (let ix = 0; ix <= 10; ix++) {
  for (let iy = 0; iy <= 8; iy++) spots.push(await probe(0.34 + ix * 0.03, 0.38 + iy * 0.04))
}
const wingSpots = []
for (const spot of spots) {
  if (wings.has(spot.hot) && !wingSpots.some((item) => item.hot === spot.hot)) wingSpots.push(spot)
}
if (wingSpots.length < 1) fail('no wing under the pointer', await info())

const wrong = wingSpots[0]
await dragHot(wrong, -200)
if ((await angleOf(wrong.hot)) > 0.15) await dragHot(wrong, 360)
await dragHot(wrong, 200)
if ((await angleOf(wrong.hot)) > 0.15) await dragHot(wrong, -360)
const stopped = await angleOf(wrong.hot)
if (stopped < -0.02) fail('wing passed through', { stopped, ...(await info()) })
await page.screenshot({ path: '/tmp/adjust-wrong.jpg', type: 'jpeg', quality: 76 })

async function findOne(ply) {
  const seen = new Set()
  for (let ix = 0; ix <= 14; ix++) {
    for (let iy = 0; iy <= 12; iy++) {
      const spot = await probe(0.18 + ix * 0.045, 0.22 + iy * 0.045)
      if (spot.hot) seen.add(spot.hot)
      if (spot.hot === ply) return spot
    }
  }
  console.log('miss', ply, [...seen].join(','))
  return null
}

async function openWing(ply) {
  const spot = await findOne(ply)
  console.log('find', ply, !!spot)
  if (!spot) return false
  let cursor = spot
  const nudge = async (pixels) => {
    for (const dx of [0, 0.03, -0.03, 0.06, -0.06]) {
      for (const dy of [0, 0.03, -0.03]) {
        const next = await probe(cursor.fx + dx, cursor.fy + dy)
        if (next.hot !== ply) continue
        cursor = next
        await dragHot(cursor, pixels)
        return
      }
    }
  }
  await nudge(-8)
  let dir = (await angleOf(ply)) > 0.04 ? -8 : 8
  if ((await angleOf(ply)) < 0.04) await nudge(dir)
  for (let step = 0; step < 18 && (await angleOf(ply)) < 1.0; step++) {
    const before = await angleOf(ply)
    await nudge(dir)
    const after = await angleOf(ply)
    if (after > 1.35) break
    if (after + 0.008 < before) dir = -dir
  }
  for (let step = 0; step < 8 && (await angleOf(ply)) > 1.35; step++) await nudge(-Math.sign(dir) * 4)
  console.log('opened', ply, await angleOf(ply))
  return (await angleOf(ply)) > 0.5
}

const ids = [...wings]
await openWing(wingSpots[0].hot)
const emptyX = box.x + box.width * 0.86
const emptyY = box.y + box.height * 0.28
await page.mouse.move(emptyX, emptyY)
await page.mouse.down()
await page.mouse.move(emptyX, emptyY + 340, { steps: 18 })
await page.mouse.up()
await new Promise((r) => setTimeout(r, 60))
const openedSecond = await openWing(ids.find((id) => id !== wingSpots[0].hot))
if (!openedSecond) console.log('second wing stayed low', await info())
await page.mouse.move(emptyX, emptyY + 340)
await page.mouse.down()
await page.mouse.move(emptyX, emptyY + 160, { steps: 14 })
await page.mouse.up()
await new Promise((r) => setTimeout(r, 80))
await page.screenshot({ path: '/tmp/adjust-wings.jpg', type: 'jpeg', quality: 76 })
state = await info()

await page.click('button::-p-text(Go to hall)')
try {
  await page.waitForSelector('.hall-canvas', { timeout: 4000 })
} catch (err) {
  console.log(JSON.stringify({ errors, text: await page.evaluate(() => document.body.innerText.slice(0, 500)) }, null, 2))
  throw err
}
await new Promise((r) => setTimeout(r, 500))
await page.screenshot({ path: '/tmp/adjust-hall.jpg', type: 'jpeg', quality: 76 })
console.log(JSON.stringify({ ok: true, state, errors }, null, 2))
await browser.close()
if (errors.length) process.exit(1)

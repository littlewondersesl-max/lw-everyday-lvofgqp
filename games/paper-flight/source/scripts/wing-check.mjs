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
  dihedral: el.getAttribute('data-dihedral'),
  layers: el.getAttribute('data-layers'),
  wings: el.getAttribute('data-wings'),
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
  await new Promise((r) => setTimeout(r, 90))
}

function fail(label, extra) {
  throw new Error(`${label} ${JSON.stringify(extra)}`)
}

if (await page.$('button::-p-text(Guide)')) fail('guide remains', await info())
const halfW = 0.10795
const halfH = 0.1397
let state = await info()
if (state.wings !== '0') fail('blank can lift', state)

await dragPaper(-halfW, halfH, 0, halfH - halfW)
await dragPaper(halfW, halfH, 0, halfH - halfW)
state = await info()
if (state.folds !== '2') fail('nose folds', state)
await page.screenshot({ path: '/tmp/wing-nose.jpg', type: 'jpeg', quality: 74 })

await page.click('button::-p-text(Top sheet)')
await dragPaper(-halfW, 0, halfW, 0)
state = await info()
if (state.folds !== '3' || state.layers !== 'all' || state.wings !== '0') fail('packet', state)
await page.click('button::-p-text(All layers)')
await page.screenshot({ path: '/tmp/wing-packet.jpg', type: 'jpeg', quality: 74 })

await dragPaper(halfW, 0, 0.02, 0)
state = await info()
if (state.folds !== '4' || state.wings !== '1') fail('first wing', state)
await page.screenshot({ path: '/tmp/wing-one.jpg', type: 'jpeg', quality: 74 })

await page.click('button::-p-text(Flip paper)')
await new Promise((r) => setTimeout(r, 50))
await dragPaper(-halfW, 0, -0.02, 0)
state = await info()
if (state.folds !== '5') fail('second wing', state)
await page.screenshot({ path: '/tmp/wing-two.jpg', type: 'jpeg', quality: 74 })

if (state.wings !== '1') fail('wings not recognized', state)
await page.click('button::-p-text(Lift wings)')
await new Promise((r) => setTimeout(r, 80))
state = await info()
if (Number(state.dihedral) < 0.2) fail('lift', state)
await page.screenshot({ path: '/tmp/wing-lift.jpg', type: 'jpeg', quality: 74 })

await page.click('button::-p-text(To the hall)')
await page.waitForSelector('.hall-canvas', { timeout: 4000 })
await new Promise((r) => setTimeout(r, 400))
await page.screenshot({ path: '/tmp/wing-hall.jpg', type: 'jpeg', quality: 74 })

console.log(JSON.stringify({ ok: true, state, errors }, null, 2))
await browser.close()
if (errors.length) process.exit(1)

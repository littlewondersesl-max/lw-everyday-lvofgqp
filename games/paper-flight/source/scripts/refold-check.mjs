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

async function state() {
  return page.evaluate(() => {
    const fold = document.querySelector('.fold')
    const buttons = [...document.querySelectorAll('.fold-tools button')].map((b) => ({
      t: b.textContent.trim(),
      disabled: b.disabled,
    }))
    const sides = [...document.querySelectorAll('.side-choice button')].map((b) => ({
      t: b.textContent.trim(),
      pressed: b.getAttribute('aria-pressed'),
    }))
    return {
      folds: fold?.getAttribute('data-folds'),
      readout: document.querySelector('.fold-readout')?.innerText,
      buttons,
      sides,
      hall: !!document.querySelector('.hall'),
    }
  })
}

const before = await state()
if (before.buttons.find((b) => b.t === 'Fold')?.disabled) throw new Error('Fold started disabled')
if (!before.sides.some((s) => s.t === 'Opposite side')) throw new Error(`no side choice at start ${JSON.stringify(before.sides)}`)

await page.click('button::-p-text(Opposite side)')
const larger = await state()
if (!larger.readout.includes('larger')) throw new Error(`opposite did not mark the larger side: ${larger.readout}`)
await page.click('button::-p-text(Opposite side)')
const backSmall = await state()
if (backSmall.readout.includes('larger')) throw new Error(`switching back still says larger: ${backSmall.readout}`)

await page.click('button.primary')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-folds') === '1')
await page.waitForFunction(() => {
  const fold = [...document.querySelectorAll('.fold-tools button')].find((b) => b.textContent.trim() === 'Fold')
  const text = document.querySelector('.fold-readout')?.textContent || ''
  return fold && !fold.disabled && !text.includes('misses')
})
const angle1 = (await state()).readout
for (let i = 0; i < 8; i++) await page.keyboard.press('KeyE')
await new Promise((r) => setTimeout(r, 80))
const angle2 = (await state()).readout
if (angle1 === angle2) throw new Error(`rotate did nothing ${angle1}`)

async function foldOnce() {
  let now = await state()
  if (now.buttons.find((b) => b.t === 'Fold')?.disabled) {
    const place = now.buttons.find((b) => b.t === 'Place on the paper')
    if (!place) throw new Error(`stranded ${JSON.stringify(now)}`)
    await page.click('button::-p-text(Place on the paper)')
    await page.waitForFunction(() => {
      const fold = [...document.querySelectorAll('.fold-tools button')].find((b) => b.textContent.trim() === 'Fold')
      return fold && !fold.disabled
    })
  }
  await page.click('button.primary')
  await new Promise((r) => setTimeout(r, 620))
}

for (let n = 2; n <= 5; n++) {
  if (n % 2 === 0) await page.keyboard.press('ArrowRight')
  await foldOnce()
  await page.waitForFunction((n) => document.querySelector('.fold')?.getAttribute('data-folds') === String(n), {}, n)
  const now = await state()
  if (now.hall) throw new Error('fold advanced to the hall')
  if (now.buttons.find((b) => b.t === 'Fold')?.disabled && now.readout.includes('misses') && !now.buttons.find((b) => b.t === 'Place on the paper')) {
    throw new Error(`stranded after ${n}: ${JSON.stringify(now)}`)
  }
}
await page.screenshot({ path: '/tmp/pf-refold-five.jpg', type: 'jpeg', quality: 72 })
const five = await state()

await page.click('button::-p-text(Undo)')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-folds') === '4')
await page.click('button::-p-text(Reset)')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-folds') === '0')
const reset = await state()
if (reset.buttons.find((b) => b.t === 'Fold')?.disabled) throw new Error(`reset stranded ${reset.readout}`)

await page.click('.book-tab')
await page.waitForSelector('.book')
for (let i = 0; i < 6; i++) await page.click('[data-book="next"]')
await page.waitForFunction(() => document.querySelector('.book h2')?.textContent === 'Flat hat')
const placed = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('.book button')]
  const hit = buttons.find((b) => b.textContent.includes('Place this crease'))
  hit?.click()
  return !!hit
})
if (!placed) throw new Error('could not place the half-fold crease')
await page.waitForFunction(() => !document.querySelector('.book'))
const equal = await state()
if (!equal.readout.includes('Sides match')) throw new Error(`expected an equal cut: ${equal.readout}`)
await page.click('button::-p-text(Opposite side)')
const equalFlip = await state()
if (equalFlip.sides.find((s) => s.pressed === 'true')?.t !== 'Marked side') throw new Error(JSON.stringify(equalFlip.sides))
await page.click('button.primary')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-folds') === '1')

await page.click('button::-p-text(Reset)')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-folds') === '0')
await page.click('button.primary')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-folds') === '1')
await page.click('button.go')
await page.waitForFunction(() => document.body.innerText.includes('Deck is 6 m'))
await page.keyboard.press('ArrowUp')
await page.click('.throw')
await page.waitForFunction(() => document.body.innerText.includes('lands') || document.body.innerText.includes('tie'), { timeout: 25000 })
const results = await page.$eval('.results', (el) => el.innerText)
await page.screenshot({ path: '/tmp/pf-refold-results.jpg', type: 'jpeg', quality: 70 })
console.log(JSON.stringify({ before: before.readout, five: five.readout, fiveSides: five.sides, reset: reset.folds, equal: equal.readout, results, errors }, null, 2))
await browser.close()
if (errors.length) {
  console.error(errors)
  process.exit(1)
}
if (!results.includes('(you)') || !results.includes('Ivo')) process.exit(1)

import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const out = '/tmp/pip-shots'
fs.mkdirSync(out, { recursive: true })
const chrome = '/usr/bin/google-chrome-stable'
const errors = []

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900'],
  defaultViewport: { width: 1440, height: 900 },
})

function watch(page, label) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`${label} console: ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`${label} pageerror: ${err.message}`))
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (url.includes('favicon')) return
    errors.push(`${label} request failed: ${url} ${req.failure()?.errorText}`)
  })
}

const page = await browser.newPage()
watch(page, 'a')
await page.goto('http://127.0.0.1:43123/', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.fold-canvas', { timeout: 8000 })
await page.waitForFunction(() => document.body.innerText.includes('Folding') || document.body.innerText.includes('Sides match'))
await page.screenshot({ path: `${out}/01-fold.png` })

await page.click('button::-p-text(Guide)')
await page.waitForSelector('.guide')
const steps = await page.$$('.guide li button')
for (let i = 0; i < steps.length; i++) {
  const buttons = await page.$$('.guide li button')
  await buttons[i].click()
  await page.click('button.primary')
  await new Promise((r) => setTimeout(r, 650))
}
await page.screenshot({ path: `${out}/02-folded.png` })
await page.click('button.go')
await page.waitForSelector('.hall-canvas', { timeout: 8000 })
await new Promise((r) => setTimeout(r, 700))
const box = await page.$eval('.hall-canvas', (el) => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width * 0.28, y: r.top + r.height * 0.72 }
})
await page.mouse.click(box.x, box.y)
await new Promise((r) => setTimeout(r, 250))
await page.screenshot({ path: `${out}/03-aim.png` })

await page.click('.throw')
await page.waitForFunction(() => document.body.innerText.includes('lands') || document.body.innerText.includes('tie'), { timeout: 20000 })
await new Promise((r) => setTimeout(r, 500))
await page.screenshot({ path: `${out}/04-results.png` })
const results = await page.$eval('.results', (el) => el.innerText)

const room = await page.$eval('.room-chip strong', (el) => el.textContent)
const link = `http://127.0.0.1:43123/?room=${room}`
const contextB = await browser.createBrowserContext()
const pageB = await contextB.newPage()
watch(pageB, 'b')
await pageB.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 })
await page.waitForFunction(() => {
  const seats = [...document.querySelectorAll('.seat')].map((n) => n.textContent || '')
  return seats.filter((s) => s.includes('here')).length >= 2
})
await page.screenshot({ path: `${out}/05-second-player.png` })
const joined = await page.$$eval('.seat', (nodes) => nodes.map((n) => n.innerText.replace(/\s+/g, ' ')))
await pageB.close()
await page.waitForFunction(() => {
  const seats = [...document.querySelectorAll('.seat')].map((n) => n.textContent || '')
  return seats.some((s) => s.includes('away'))
})
await page.screenshot({ path: `${out}/06-disconnect.png` })
const seats = await page.$$eval('.seat', (nodes) => nodes.map((n) => n.innerText.replace(/\s+/g, ' ')))
await browser.close()
const report = { room, results, joined, seats, errors }
fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))

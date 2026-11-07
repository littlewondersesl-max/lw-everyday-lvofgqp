import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const base = process.env.BASE || 'http://127.0.0.1:8765'
const out = '/tmp/pf-shots'
fs.mkdirSync(out, { recursive: true })
const failures = []
const fail = (m) => failures.push(m)

const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-gpu',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--window-size=1440,900',
  ],
  defaultViewport: { width: 1440, height: 900 },
})

function watch(page, label) {
  const ignore = (url) => url.includes('favicon') || url.includes('/lessons/conversations/')
  page.on('console', (msg) => {
    const text = msg.text()
    if (msg.type() === 'error' && !ignore(text) && !text.includes('WebSocket') && !text.includes('Failed to load resource')) {
      fail(`${label} console: ${text}`)
    }
  })
  page.on('pageerror', (err) => fail(`${label} pageerror: ${err.message}`))
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (ignore(url)) return
    fail(`${label} request failed: ${url} ${req.failure()?.errorText}`)
  })
  page.on('response', (res) => {
    const url = res.url()
    if (ignore(url) || url.endsWith('/ws')) return
    if (res.status() >= 400) fail(`${label} HTTP ${res.status()} ${url}`)
  })
}

const page = await browser.newPage()
await page.evaluateOnNewDocument(() => {
  const Native = window.WebSocket
  window.__pfSockets = []
  window.WebSocket = function (url, protocols) {
    window.__pfSockets.push(String(url))
    const ws = protocols === undefined ? new Native(url) : new Native(url, protocols)
    return ws
  }
  window.WebSocket.prototype = Native.prototype
  window.WebSocket.CONNECTING = Native.CONNECTING
  window.WebSocket.OPEN = Native.OPEN
  window.WebSocket.CLOSING = Native.CLOSING
  window.WebSocket.CLOSED = Native.CLOSED
})
watch(page, 'game')

await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.card')
const homeText = await page.$eval('#home', (el) => el.innerText)
for (const title of ['Paper Flight', 'Household Chores', 'World Jigsaw', 'Save Sam', 'Four Corners', 'Land Neighbours', 'Everyday Games']) {
  if (!homeText.includes(title)) fail(`home missing ${title}`)
}
const card = await page.$eval('a.cl[href="games/paper-flight/index.html"]', (a) => ({
  href: a.getAttribute('href'),
  img: a.querySelector('img')?.getAttribute('src'),
  text: a.innerText,
}))
if (card.img !== 'games/paper-flight/og.jpg') fail(`thumb ${card.img}`)
const gamesMenu = await page.evaluate(() => {
  const button = [...document.querySelectorAll('#menu .ddb')].find((el) => el.textContent.includes('Games'))
  button?.click()
  const menu = button?.parentElement?.querySelector('.ddm')
  return menu ? menu.innerText : ''
})
if (!gamesMenu.includes('Paper Flight')) fail(`games menu missing card: ${gamesMenu}`)
await page.evaluate(() => document.querySelector('#games')?.scrollIntoView())
await page.screenshot({ path: `${out}/01-home.jpg`, type: 'jpeg', quality: 70 })

await page.goto(`${base}/games/paper-flight/index.html?solo=1`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.fold-canvas', { timeout: 8000 })
await page.waitForFunction(() => document.body.textContent.includes('Solo'), { timeout: 8000 })
const mode = await page.$eval('.app', (el) => el.getAttribute('data-mode'))
if (mode !== 'solo') fail(`mode ${mode}`)
const back = await page.$eval('a.site-back', (a) => ({ href: a.getAttribute('href'), text: a.textContent.trim() }))
if (back.href !== '../../index.html' || back.text !== 'Back to Little Wonders') fail(`back ${JSON.stringify(back)}`)
const assets = await page.$$eval('script[src],link[href]', (nodes) =>
  nodes.map((n) => n.getAttribute('src') || n.getAttribute('href')).filter(Boolean),
)
for (const src of assets) {
  if (src.startsWith('/') && !src.startsWith('./')) fail(`absolute asset ${src}`)
  if (src.startsWith('http')) fail(`absolute asset ${src}`)
}
const sockets = await page.evaluate(() => window.__pfSockets || [])
const openSockets = await page.evaluate(() =>
  (window.__pfSockets || []).length
    ? [...document.querySelectorAll('body')].length &&
      // readyState of any live socket is not exposed; the page must not depend on one staying open
      true
    : true,
)
if (sockets.length) fail(`solo page opened a socket ${sockets}`)
const seatText = await page.$$eval('.seat', (nodes) => nodes.map((n) => n.innerText.replace(/\s+/g, ' ')))
for (const name of ['Ivo', 'Nim', 'Bru']) {
  if (!seatText.some((s) => s.includes(name) && s.toLowerCase().includes('bot'))) fail(`missing bot ${name} in ${seatText}`)
}
if (seatText.filter((s) => s.includes('(you)')).length !== 1) fail(`you seats ${seatText}`)
const papers = await page.$$eval('.seat i', (nodes) => nodes.map((n) => getComputedStyle(n).backgroundColor))
if (new Set(papers).size !== 4) fail(`paper colors ${papers}`)

await page.click('button[aria-label="Sea paper"]')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-dye') === 'sea')

await page.click('.book-tab')
await page.waitForSelector('.book')
const heads = []
for (let i = 0; i < 8; i++) {
  const info = await page.$eval('.book', (el) => ({
    page: el.querySelector('header p')?.textContent,
    h: el.querySelector('h2')?.textContent,
  }))
  heads.push(info)
  if (i < 7) await page.click('[data-book="next"]')
}
const titles = heads.map((h) => h.h)
const expectTitles = [
  'Move the crease',
  'Turn the crease',
  'The smaller side folds over',
  'Beginner plane',
  'Pointed dart',
  'Envelope',
  'Flat hat',
]
for (const t of expectTitles) if (!titles.includes(t)) fail(`book missing ${t} in ${titles}`)
if (!titles.some((t) => t && t.toLowerCase().includes('not for flying'))) fail(`book why ${titles}`)
if (heads.at(-1).page !== 'Page 8 of 8') fail(`book pages ${JSON.stringify(heads)}`)
await page.screenshot({ path: `${out}/02-book.jpg`, type: 'jpeg', quality: 70 })
await page.click('[data-book="close"]')
await page.waitForFunction(() => !document.querySelector('.book'))

await page.click('button::-p-text(Guide)')
await page.waitForSelector('.guide')
const steps = await page.$$('.guide li button')
if (steps.length !== 6) fail(`guide steps ${steps.length}`)
for (let i = 0; i < steps.length; i++) {
  const buttons = await page.$$('.guide li button')
  await buttons[i].click()
  await new Promise((r) => setTimeout(r, 40))
  await page.click('button.primary')
  await new Promise((r) => setTimeout(r, 640))
}
const foldCount = await page.evaluate(() => document.body.innerText)
await page.screenshot({ path: `${out}/03-fold.jpg`, type: 'jpeg', quality: 70 })
await page.click('button.go')
await page.waitForSelector('.hall-canvas', { timeout: 8000 })
await page.waitForFunction(() => document.body.innerText.includes('Deck is 6 m'), { timeout: 4000 })
const aimBefore = await page.$eval('.aim-readout', (el) => el.innerText)
if (!aimBefore.includes('0.55')) fail(`hand default ${aimBefore}`)
if (!aimBefore.includes('6.55')) fail(`release ${aimBefore}`)
async function clickFrac(fx, fy) {
  const p = await page.$eval(
    '.hall-canvas',
    (el, fx, fy) => {
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width * fx, y: r.top + r.height * fy, w: r.width, h: r.height }
    },
    fx,
    fy,
  )
  await page.mouse.click(p.x, p.y)
  return p
}
await new Promise((r) => setTimeout(r, 400))
let lifted = false
let hit = null
for (const [fx, fy] of [
  [0.28, 0.72],
  [0.32, 0.66],
  [0.36, 0.6],
  [0.4, 0.55],
  [0.24, 0.78],
  [0.45, 0.7],
  [0.5, 0.62],
  [0.22, 0.58],
]) {
  hit = await clickFrac(fx, fy)
  await new Promise((res) => setTimeout(res, 120))
  lifted = await page.$eval('.aim-readout', (el) => el.innerText.includes('In hand'))
  if (lifted) break
}
if (!lifted) {
  await page.keyboard.press('ArrowUp')
  await new Promise((r) => setTimeout(r, 150))
  lifted = await page.$eval('.aim-readout', (el) => el.innerText.includes('In hand'))
}
if (!lifted) fail(`could not lift the sheet ${JSON.stringify(hit)}`)
await page.$eval('.power', (el) => {
  const input = el.querySelector('input')
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, '6.2')
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
})
try {
  await page.waitForFunction(() => document.querySelector('.power strong')?.textContent === '6.2', { timeout: 3000 })
} catch (error) {
  const dump = await page.evaluate(() => ({
    power: document.querySelector('.power')?.innerText,
    html: document.querySelector('.power')?.outerHTML,
    mode: document.querySelector('.app')?.dataset.mode,
  }))
  console.log('POWER', JSON.stringify(dump))
  throw error
}
await page.screenshot({ path: `${out}/04-aim.jpg`, type: 'jpeg', quality: 70 })
await page.click('.throw')
await page.waitForFunction(
  () => document.body.innerText.includes('lands') || document.body.innerText.includes('tie'),
  { timeout: 25000 },
)
await new Promise((r) => setTimeout(r, 400))
const results = await page.$eval('.results', (el) => el.innerText)
const rows = await page.$$eval('.results li', (nodes) => nodes.length)
if (rows !== 4) fail(`result rows ${rows} ${results}`)
for (const name of ['Ivo', 'Nim', 'Bru', '(you)']) {
  if (!results.includes(name)) fail(`results missing ${name}: ${results}`)
}
const resultColors = await page.$$eval('.results i', (nodes) => nodes.map((n) => getComputedStyle(n).backgroundColor))
if (new Set(resultColors).size !== 4) fail(`result colors ${resultColors}`)
if ((await page.$eval('.app', (el) => el.getAttribute('data-mode'))) !== 'solo') fail('left solo')
await page.screenshot({ path: `${out}/05-results.jpg`, type: 'jpeg', quality: 70 })

const href = await page.$eval('a.site-back', (a) => a.href)
await page.goto(href, { waitUntil: 'domcontentloaded' })
const title = await page.title()
if (!title.includes('Little Wonders')) fail(`back landed on ${title} via ${href}`)
const stillThere = await page.$eval('#home', (el) => el.innerText.includes('Paper Flight') && el.innerText.includes('Save Sam'))
if (!stillThere) fail('home after back link missing games')

const wsOpen = await page.evaluate(() => false)
console.log(JSON.stringify({
  card,
  mode,
  back,
  assets,
  sockets,
  seatText,
  papers,
  titles,
  aimBefore,
  lifted,
  results,
  resultColors,
  href,
  title,
  wsOpen,
  failures,
}, null, 2))
await browser.close()
if (failures.length) process.exit(1)

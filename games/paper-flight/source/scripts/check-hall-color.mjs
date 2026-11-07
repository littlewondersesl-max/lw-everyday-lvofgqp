import puppeteer from 'puppeteer-core'

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
await page.goto('http://127.0.0.1:43123/', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.dyes')
await page.click('button[aria-label="Sea paper"]')
await page.waitForFunction(() => document.querySelector('.fold')?.getAttribute('data-dye') === 'sea')
await page.click('.book-tab')
await page.waitForSelector('.book')
for (let i = 0; i < 5; i++) await page.click('button[data-book="next"]')
await page.screenshot({ path: '/tmp/pip-shots/10-book-envelope.png' })
await page.click('button[data-book="close"]')
await page.click('button.go')
await page.waitForSelector('.hall-canvas')
await new Promise((r) => setTimeout(r, 700))
await page.screenshot({ path: '/tmp/pip-shots/11-hall-colors.png' })
await browser.close()
console.log(JSON.stringify({ errors }))

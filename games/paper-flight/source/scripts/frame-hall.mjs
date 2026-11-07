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
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
await page.goto('http://127.0.0.1:43123/', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('button.go')
await page.click('button.go')
await page.waitForSelector('.hall-canvas')
await new Promise((r) => setTimeout(r, 800))
await page.screenshot({ path: '/tmp/pip-shots/03-aim.png' })
await browser.close()
console.log(errors)

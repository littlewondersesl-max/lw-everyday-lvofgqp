import puppeteer from 'puppeteer-core'

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: false,
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900', '--window-position=0,0'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
await page.goto('http://127.0.0.1:43123/', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.fold-canvas')
await new Promise((r) => setTimeout(r, 600))
await page.click('button::-p-text(Guide)')
await page.waitForSelector('.guide li button')
for (let i = 0; i < 4; i++) {
  const buttons = await page.$$('.guide li button')
  await buttons[i].click()
  await new Promise((r) => setTimeout(r, 280))
  await page.click('button.primary')
  await new Promise((r) => setTimeout(r, 700))
}
await page.click('button.go')
await page.waitForSelector('.hall-canvas')
const found = await page.$('button.throw')
if (!found) {
  console.log(await page.evaluate(() => document.body.innerText))
  await page.screenshot({ path: '/tmp/pip-shots/headed-fail.png' })
  await browser.close()
  process.exit(1)
}
await new Promise((r) => setTimeout(r, 900))
await page.click('button.throw')
await page.waitForFunction(() => document.body.innerText.includes('lands') || document.body.innerText.includes('tie'), {
  timeout: 20000,
})
await new Promise((r) => setTimeout(r, 1200))
await browser.close()

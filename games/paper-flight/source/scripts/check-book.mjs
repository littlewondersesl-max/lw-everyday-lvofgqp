import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const out = '/tmp/pip-shots'
fs.mkdirSync(out, { recursive: true })
const errors = []
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('pageerror', (err) => errors.push(err.message))
await page.goto('http://127.0.0.1:43123/', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.fold[data-dye]')
await page.waitForSelector('.book-tab')
const before = await page.$eval('.fold', (el) => el.getAttribute('data-dye'))
const choice = await page.$eval('.dyes button:not(.on):not([disabled])', (el) => el.getAttribute('aria-label'))
await page.click('.dyes button:not(.on):not([disabled])')
await page.waitForFunction((prev) => document.querySelector('.fold')?.getAttribute('data-dye') !== prev, {}, before)
const after = await page.$eval('.fold', (el) => el.getAttribute('data-dye'))
const seatDye = await page.$eval('.seat.you i', (el) => el.getAttribute('title'))
await page.screenshot({ path: `${out}/07-color.png` })

await page.click('.book-tab')
await page.waitForSelector('.book')
const opened = await page.$eval('.book', (el) => el.getAttribute('data-page'))
await page.click('button[data-book="next"]')
await page.click('button[data-book="next"]')
const mid = await page.$eval('.book', (el) => el.getAttribute('data-page'))
await page.screenshot({ path: `${out}/08-book-rule.png` })
await page.click('button[data-book="prev"]')
const back = await page.$eval('.book', (el) => el.getAttribute('data-page'))
const last = await page.$eval('.book', (el) => el.getAttribute('data-pages'))
while ((await page.$eval('.book', (el) => el.getAttribute('data-page'))) !== last) {
  await page.click('button[data-book="next"]')
}
const atEnd = await page.$eval('button[data-book="next"]', (el) => el.disabled)
const endPage = await page.$eval('.book', (el) => el.getAttribute('data-page'))
await page.screenshot({ path: `${out}/09-book-end.png` })
await page.click('button[data-book="close"]')
await page.waitForSelector('.book', { hidden: true })
const closed = (await page.$('.book')) === null
await page.click('.book-tab')
await page.waitForSelector('.book')
const reopened = await page.$eval('.book', (el) => el.getAttribute('data-page'))
await page.click('button[data-book="close"]')
await page.waitForSelector('.book', { hidden: true })

const report = { before, choice, after, seatDye, opened, mid, back, last, endPage, atEnd, closed, reopened, errors }
console.log(JSON.stringify(report, null, 2))
if (before === after || mid === opened || back === mid || !closed || reopened !== endPage || !atEnd || errors.length) {
  await browser.close()
  process.exit(1)
}
await browser.close()

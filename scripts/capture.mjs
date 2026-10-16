import { chromium } from '@playwright/test'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
await page.goto('http://127.0.0.1:5173')
await page.locator('.loading.is-ready').waitFor({ timeout: 60000 })
await page.waitForTimeout(4000)
const frameTimes = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const samples = []
      let previous = performance.now()
      const tick = (now) => {
        samples.push(now - previous)
        previous = now
        if (samples.length < 90) requestAnimationFrame(tick)
        else resolve(samples.slice(5))
      }
      requestAnimationFrame(tick)
    }),
)
frameTimes.sort((a, b) => a - b)
await page.screenshot({ path: 'artifacts/desktop.png' })
await page.getByRole('button', { name: '01 Royal palace ALUBARNA ↗', exact: true }).click()
await page.waitForTimeout(2500)
await page.screenshot({ path: 'artifacts/palace.png' })
console.log(
  JSON.stringify(
    {
      errors,
      frameTimeMs: {
        median: Math.round(frameTimes[Math.floor(frameTimes.length * 0.5)]),
        p95: Math.round(frameTimes[Math.floor(frameTimes.length * 0.95)]),
      },
    },
    null,
    2,
  ),
)
await browser.close()

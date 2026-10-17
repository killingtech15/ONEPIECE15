import { test, expect } from '@playwright/test'

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
})

test('phone map, pinch zoom, island stories and touch return', async ({ page, context }) => {
  test.setTimeout(120000)
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await expect(page.locator('.chart-sidebar')).toBeHidden()
  expect((await page.locator('.chart-surface').boundingBox())!.width).toBe(390)
  await page.screenshot({ path: 'artifacts/mobile-map.png' })
  const cdp = await context.newCDPSession(page)
  const initial = await page.getByRole('status', { name: 'Map zoom' }).textContent()
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: 130, y: 400 },
      { x: 230, y: 400 },
    ],
  })
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { x: 70, y: 400 },
      { x: 290, y: 400 },
    ],
  })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.getByRole('status', { name: 'Map zoom' })).not.toHaveText(initial!)
  await page.getByRole('button', { name: 'Browse', exact: true }).tap()
  await page.getByRole('textbox', { name: 'Find a place' }).fill('Alabasta')
  await page.locator('.chart-results button').tap()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('.scene canvas')).toBeVisible()
  await page.screenshot({ path: 'artifacts/mobile-intro.png' })
  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: 844 })
    for (let i = 0; i < 8; i++) {
      await page.locator('.landmark').nth(i).tap()
      await page.waitForTimeout(1400)
      const card = (await page.locator('.story').boundingBox())!
      expect(card.x).toBeGreaterThanOrEqual(0)
      expect(card.x + card.width).toBeLessThanOrEqual(width)
      expect(await page.locator('.story').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
        true,
      )
      const marker = (await page.locator('.map-marker').nth(i).boundingBox())!
      expect(marker.y + marker.height).toBeLessThan(card.y)
      if (i === 4) await page.screenshot({ path: `artifacts/mobile-story-${width}.png` })
      await page.getByRole('button', { name: 'Return to the journey ESC' }).tap()
      await expect(page.locator('.story')).toHaveCount(0)
    }
  }
  await page.locator('.landmark').nth(4).tap()
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 180, y: 200 }],
  })
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 180, y: 300 }],
  })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.locator('.story')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.setViewportSize({ width: 844, height: 390 })
  await page.locator('.landmark').nth(4).tap()
  await page.screenshot({ path: 'artifacts/mobile-landscape.png' })
  await expect(page.getByRole('button', { name: 'Return to the journey ESC' })).toBeVisible()
  expect(await page.locator('.story').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.getByRole('button', { name: 'Return to the journey ESC' }).tap()
  await page.getByRole('button', { name: 'The atlas', exact: true }).tap()
  await expect(page.locator('.loading')).toBeHidden()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).tap()
  await expect(page.locator('.world-dialog')).toHaveCount(0)
})

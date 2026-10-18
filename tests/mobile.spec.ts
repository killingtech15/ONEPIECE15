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
  await expect(page.locator('.marker-layer')).toBeHidden()
  await page.getByRole('button', { name: 'Enter the kingdom' }).tap()
  await expect(page.locator('.app')).toHaveClass(/has-departed/)
  await page.waitForTimeout(1600)
  const caption = (await page.locator('.travel-caption').boundingBox())!
  const masthead = (await page.locator('.masthead').boundingBox())!
  expect(caption.y).toBeGreaterThanOrEqual(masthead.y + masthead.height)
  await page.screenshot({ path: 'artifacts/mobile-journey.png' })
  for (const width of [390, 360]) {
    await page.setViewportSize({ width, height: width === 360 ? 640 : 740 })
    for (let i = 0; i < 8; i++) {
      await page.locator('.landmark').nth(i).tap()
      await page.waitForTimeout(1400)
      const card = (await page.locator('.story').boundingBox())!
      expect(card.x).toBeGreaterThanOrEqual(0)
      expect(card.x + card.width).toBeLessThanOrEqual(width)
      expect(await page.locator('.story').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
        true,
      )
      expect(
        await page.locator('.story').evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
      ).toBe(true)
      expect(card.y).toBeGreaterThan(100)
      await expect(page.locator('.story .next-story')).toBeInViewport()
      await expect(page.locator('.marker-layer')).toBeHidden()
      if (i === 0) await page.screenshot({ path: `artifacts/mobile-palace-${width}.png` })
      if (i === 4) await page.screenshot({ path: `artifacts/mobile-story-${width}.png` })
      await page.getByRole('button', { name: /^Return to the journey/ }).tap()
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
  await expect(page.getByRole('button', { name: /^Return to the journey/ })).toBeVisible()
  expect(await page.locator('.story').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.getByRole('button', { name: /^Return to the journey/ }).tap()
  await page.getByRole('button', { name: 'The atlas', exact: true }).tap()
  await expect(page.locator('.loading')).toBeHidden()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).tap()
  await expect(page.locator('.world-dialog')).toHaveCount(0)
})

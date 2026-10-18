import { test, expect } from '@playwright/test'

test('Water 7 has fourteen usable stops and can switch back to Alabasta', async ({ page }) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Water 7', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('.scene canvas')).toBeVisible()
  await expect(page.locator('#island-title')).toHaveText('Water 7')
  await expect(page.locator('.landmark')).toHaveCount(14)
  await expect(page.locator('.marker-layer')).toBeHidden()
  await expect(page.locator('.marker-layer .map-marker').first()).toBeHidden()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'artifacts/water7-desktop.png' })
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 740 },
    { width: 360, height: 640 },
  ]) {
    await page.setViewportSize(viewport)
    for (let i = 0; i < 14; i++) {
      await page.locator('.landmark').nth(i).click()
      await expect(page.locator('#story-title')).not.toBeEmpty()
      await expect(page.locator('.loading')).toBeHidden()
      const bounds = (await page.locator('.story').boundingBox())!
      expect(bounds.x).toBeGreaterThanOrEqual(0)
      expect(bounds.y).toBeGreaterThan(65)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width)
      if (viewport.width < 760)
        expect(
          await page.locator('.story').evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
        ).toBe(true)
      await expect(page.locator('.story .next-story')).toBeInViewport()
      if (i === 4 || i === 5 || i === 6 || i === 8 || i === 11 || i === 13) {
        await page.waitForTimeout(1400)
        await page.screenshot({ path: `artifacts/water7-${viewport.width}-${i}.png` })
      }
      await page.getByRole('button', { name: /^Return to the journey/ }).click()
    }
  }
  await page.locator('.landmark').nth(4).click()
  await page.locator('.rain-story').click()
  await expect(page.locator('.rain-story')).toHaveText(/Calm the sea/)
  await expect(page.locator('.loading')).toBeHidden()
  await page.mouse.move(180, 160)
  await page.mouse.wheel(0, -180)
  await expect(page.locator('.story')).toHaveCount(0)
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('#island-title')).toHaveText('Alabasta')
  await expect(page.locator('.landmark')).toHaveCount(8)
  expect(errors).toEqual([])
})

test('a missing Water 7 model still allows travel to Alabasta', async ({ page }) => {
  await page.route('**/models/water7.glb', (route) => route.abort())
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Water 7', exact: true }).click()
  await expect(page.locator('.scene-fallback')).toBeVisible({ timeout: 45000 })
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('.scene-fallback')).toHaveCount(0)
  await expect(page.locator('.scene canvas')).toBeVisible()
  await expect(page.locator('.landmark')).toHaveCount(8)
})

import { test, expect } from '@playwright/test'

test('all landmark views fit beside the story and reverse scroll restores the journey', async ({ page }) => {
  test.setTimeout(120000)
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('.scene canvas')).toBeVisible()
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport)
    for (let i = 0; i < 8; i++) {
      await page.locator('.landmark').nth(i).click()
      await page.waitForTimeout(1500)
      const story = (await page.locator('.story').boundingBox())!
      const marker = (await page.locator('.map-marker').nth(i).boundingBox())!
      expect(marker.x).toBeGreaterThan(story.x + story.width)
      expect(marker.x + marker.width).toBeLessThan(viewport.width)
      await page.screenshot({ path: `artifacts/landmark-${viewport.width}-${i}.png` })
      await page.mouse.move(viewport.width - 80, 300)
      await page.mouse.wheel(0, -100)
      await expect(page.locator('.story')).toHaveCount(0)
      await expect(page.locator('.loading')).toBeHidden()
      await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/)
    }
  }
})

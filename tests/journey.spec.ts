import { test, expect } from '@playwright/test'
import { chartPlaces } from '../src/atlas'

test('desktop markers stay steady, readable, and the ship opens a working chart', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')
  await expect(page.locator('.loading')).toHaveClass(/is-ready/, { timeout: 45000 })
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).click()
  await expect(page.locator('.loading')).toHaveClass(/is-ready/, { timeout: 45000 })
  await page.waitForTimeout(2000)
  const markers = page.locator('.map-marker')
  await expect(markers).toHaveCount(9)
  const samples = await page.evaluate(async () => {
    const snapshots: { x: number; y: number; visible: boolean }[][] = []
    for (let frame = 0; frame < 60; frame++) {
      await new Promise(requestAnimationFrame)
      snapshots.push(
        Array.from(document.querySelectorAll('.map-marker')).map((el) => {
          const r = el.getBoundingClientRect()
          return { x: r.x, y: r.y, visible: getComputedStyle(el).visibility === 'visible' }
        }),
      )
    }
    return snapshots
  })
  for (const sample of samples)
    sample.forEach((marker, i) => {
      expect(marker.visible).toBe(true)
      expect(Math.abs(marker.x - samples[0][i].x)).toBeLessThan(1)
      expect(Math.abs(marker.y - samples[0][i].y)).toBeLessThan(1)
    })
  expect(
    await page.locator('.intro-copy').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16)
  expect(
    (await page.locator('.marker-number').first().boundingBox())!.width,
  ).toBeGreaterThanOrEqual(44)
  const bounds = await page.evaluate(() => ({
    scene: document.querySelector('.scene')!.getBoundingClientRect().bottom,
    dock: document.querySelector('.island-dock')!.getBoundingClientRect().top,
    markers: document.querySelector('.marker-layer')!.getBoundingClientRect().bottom,
  }))
  expect(Math.abs(bounds.scene - bounds.dock)).toBeLessThan(1)
  expect(Math.abs(bounds.markers - bounds.dock)).toBeLessThan(1)
  await page
    .getByRole('button', { name: 'Board the Going Merry and open the world map', exact: true })
    .click()
  await expect(page.locator('.world-dialog')).toBeVisible()
  const surface = page.locator('.chart-surface')
  const transform = await page
    .locator('.chart-paper')
    .evaluate((el) => (el as HTMLElement).style.left)
  await surface.focus()
  await page.keyboard.press('ArrowLeft')
  expect(
    await page.locator('.chart-paper').evaluate((el) => (el as HTMLElement).style.left),
  ).not.toBe(transform)
  await page.getByRole('checkbox', { name: 'Straw Hat route' }).uncheck()
  await expect(page.locator('.chart-geography polyline')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.locator('.world-dialog')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Board the Going Merry and open the world map', exact: true }),
  ).toBeFocused()
})

test('desktop journey: focus, return, weather, atlas and reduced motion', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await expect(page.locator('.loading')).toHaveClass(/is-ready/, { timeout: 45000 })
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).click()
  await expect(page.locator('.loading')).toHaveClass(/is-ready/, { timeout: 45000 })
  await expect(page.getByRole('heading', { name: 'Alabasta', exact: true })).toBeAttached()
  await page.getByRole('button', { name: 'Enter the kingdom', exact: true }).click()
  await expect(page.locator('.app')).toHaveClass(/has-departed/)
  await page.waitForTimeout(2500)
  const scrollBefore = await page.evaluate(() => scrollY)

  const stops = [
    ['01 Royal palace ALUBARNA ↗', 'Royal palace'],
    ['02 The clock tower PALACE SQUARE ↗', 'The clock tower'],
    ['03 Rain Dinners RAINBASE ↗', 'Rain Dinners'],
    ['04 Sandora River A FINAL FAREWELL ↗', 'Sandora River'],
    ['05 Nanohana ARRIVAL PORT ↗', 'Nanohana'],
    ['06 Yuba THE DRY OASIS ↗', 'Yuba'],
    ['07 Erumalu THE ABANDONED CITY ↗', 'Erumalu'],
    ['08 Katorea THE REBEL BASE ↗', 'Katorea'],
  ]
  for (const [button, title] of stops) {
    await page.getByRole('button', { name: button, exact: true }).click()
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(page.locator('html')).toHaveClass(/lenis-stopped/)
    const held = await page.evaluate(() => scrollY)
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(200)
    expect(await page.evaluate(() => scrollY)).toBe(held)
    await page.keyboard.press('Escape')
    await expect(page.locator('.story')).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/)
  }
  expect(Math.abs((await page.evaluate(() => scrollY)) - scrollBefore)).toBeLessThan(3)
  await page.getByRole('button', { name: '01 Royal palace ALUBARNA ↗', exact: true }).click()
  await page.getByRole('button', { name: 'Let the rain return', exact: true }).click()
  await expect(page.getByRole('button', { name: 'The rain returns', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Set sail on the Going Merry', exact: false }).click()
  const chart = page.getByRole('dialog', { name: 'An ocean of stories.' })
  await expect(chart).toBeVisible()
  await expect(chart.locator('.chart-place')).toHaveCount(
    chartPlaces.filter((p) => p.position !== 'unknown').length,
  )
  await page.getByRole('textbox', { name: 'Find a place' }).fill('Water 7')
  await page.locator('.chart-results button').click()
  await expect(chart.getByRole('heading', { name: 'Water 7', exact: true })).toBeVisible()
  await expect(page.locator('.chart-status')).toHaveText('Chart entry · 3D island to come')
  const previousZoom = await page.locator('.chart-tools output').textContent()
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  expect(await page.locator('.chart-tools output').textContent()).not.toBe(previousZoom)
  await page.getByRole('button', { name: 'Fit chart', exact: true }).click()
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).click()
  await expect(chart).toHaveCount(0)
  expect(Math.abs((await page.evaluate(() => scrollY)) - scrollBefore)).toBeLessThan(3)
  await page.getByRole('button', { name: 'Experience settings', exact: true }).click()
  await page.getByRole('checkbox', { name: /Reduced motion/ }).check()
  await page.getByRole('checkbox', { name: /High visual quality/ }).check()
  await page.waitForTimeout(500)
  await page.getByRole('checkbox', { name: /High visual quality/ }).uncheck()
  await expect(page.locator('.app')).toHaveClass(/reduced-motion/)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page
    .getByRole('button', { name: 'Grand Line Atlas, return to the world map', exact: true })
    .click()
  await expect(chart).toBeVisible()
  await expect(chart.locator('.chart-header button')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('missing model gives a recoverable error and leaves stories usable', async ({ page }) => {
  await page.route('**/models/alabasta-baked.glb', (route) =>
    route.fulfill({ status: 404, body: 'Unavailable' }),
  )
  await page.goto('/')
  await expect(page.locator('.loading')).toHaveClass(/is-ready/, { timeout: 45000 })
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'The sea needs another moment.' })).toBeVisible({
    timeout: 30000,
  })
  await expect(page.locator('.loading')).toHaveClass(/is-ready/)
  await page
    .getByRole('button', { name: '02 The clock tower PALACE SQUARE ↗', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'The clock tower', exact: true })).toBeVisible()
})

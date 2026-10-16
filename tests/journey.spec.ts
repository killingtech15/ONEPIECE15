import { test, expect } from '@playwright/test'

test('desktop journey: focus, return, weather, atlas and reduced motion', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
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
    ['04 The eastern coast A FINAL FAREWELL ↗', 'The eastern coast'],
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

  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: '03 · Rain Dinners', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Rain Dinners', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Experience settings', exact: true }).click()
  await page.getByRole('checkbox', { name: /Reduced motion/ }).check()
  await page.getByRole('checkbox', { name: /High visual quality/ }).uncheck()
  await expect(page.locator('.app')).toHaveClass(/reduced-motion/)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page
    .getByRole('button', { name: 'Grand Line Atlas, return to the beginning', exact: true })
    .click()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  expect(errors).toEqual([])
})

test('missing model gives a recoverable error and leaves stories usable', async ({ page }) => {
  await page.route('**/models/alabasta-baked.glb', (route) =>
    route.fulfill({ status: 404, body: 'Unavailable' }),
  )
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'The sea needs another moment.' })).toBeVisible({
    timeout: 30000,
  })
  await expect(page.locator('.loading')).toHaveClass(/is-ready/)
  await page
    .getByRole('button', { name: '02 The clock tower PALACE SQUARE ↗', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'The clock tower', exact: true })).toBeVisible()
})

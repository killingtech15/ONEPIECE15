import { test, expect } from '@playwright/test'

test('Enies Lobby: all landmarks fit, scene changes work, stories never load or scroll internally', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Enies Lobby', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('#island-title')).toHaveText('Enies Lobby')
  await expect(page.locator('.landmark')).toHaveCount(14)
  await expect(page.locator('.marker-layer')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Perpetual daylight' })).toHaveCount(0)
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 740 },
    { width: 360, height: 640 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport)
    for (let i = 0; i < 14; i++) {
      await page.locator('.landmark').nth(i).click()
      await expect(page.locator('.loading')).toBeHidden()
      await expect(page.locator('#story-title')).not.toBeEmpty()
      const b = (await page.locator('.story').boundingBox())!
      expect(b.x).toBeGreaterThanOrEqual(0)
      const header = (await page.locator('.masthead').boundingBox())!
      expect(b.y).toBeGreaterThanOrEqual(header.y + header.height)
      expect(b.x + b.width).toBeLessThanOrEqual(viewport.width)
      expect(b.y + b.height).toBeLessThanOrEqual(viewport.height)
      await expect(page.locator('.story .next-story')).toBeInViewport()
      expect(
        await page.locator('.story').evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
      ).toBe(true)
      if (
        viewport.width === 1440 ||
        viewport.width === 390 ||
        (viewport.width === 320 && [8, 12].includes(i))
      ) {
        await page.waitForTimeout(500)
        await page.screenshot({ path: `artifacts/enies-${viewport.width}-${i}.png` })
      }
      await page.getByRole('button', { name: /Return to the journey/ }).click()
    }
    await page.waitForTimeout(300)
    await page.screenshot({ path: `artifacts/enies-intro-${viewport.width}.png` })
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('button', { name: 'Cross the first gate' }).click()
  await page.waitForTimeout(500)
  const before = await page.evaluate(() => scrollY)
  await page.locator('.landmark').nth(8).click()
  await page.mouse.move(1200, 300)
  await page.mouse.wheel(0, -180)
  await expect(page.locator('.story')).toHaveCount(0)
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(3)
  await page.getByRole('button', { name: 'Grand Line Atlas, return to the world map' }).click()
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Water 7', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('#island-title')).toHaveText('Water 7')
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('.landmark')).toHaveCount(8)
  expect(errors).toEqual([])
})

test('failed Enies Lobby model permits returning to the atlas', async ({ page }) => {
  await page.route('**/models/enies-lobby.glb', (route) => route.abort())
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Enies Lobby', exact: true }).click()
  await expect(page.locator('.scene-fallback')).toBeVisible({ timeout: 45000 })
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.locator('.world-dialog')).toBeVisible()
})

test('live ocean follows each scene camera; Enies touch return preserves the journey', async ({
  page,
  context,
}) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 390, height: 740 })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  for (const name of ['Enies Lobby', 'Water 7', 'Alabasta']) {
    if (!(await page.getByRole('textbox', { name: 'Find a place' }).isVisible()))
      await page.getByRole('button', { name: 'Browse', exact: true }).click()
    await page.getByRole('textbox', { name: 'Find a place' }).fill(name)
    await page.locator('.chart-results button').first().click()
    await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
    const readOcean = () =>
      page.evaluate(async () => {
        const moduleUrl = '/node_modules/.vite/deps/@react-three_fiber.js'
        const { _roots } = await import(moduleUrl)
        const { camera, scene } = [..._roots.values()][0].store.getState()
        let sample = { near: 0, far: 0, cameraNear: camera.near, cameraFar: camera.far, time: 0 }
        scene.traverse((object: any) => {
          const u = object.material?.uniforms
          if (u?.uHoleRadius)
            sample = { ...sample, near: u.uNear.value, far: u.uFar.value, time: u.uTime.value }
        })
        return sample
      })
    const first = await readOcean()
    expect(first.near).toBe(first.cameraNear)
    expect(first.far).toBe(first.cameraFar)
    await expect.poll(async () => (await readOcean()).time).toBeGreaterThan(first.time)
    if (name === 'Enies Lobby') {
      await page.getByRole('button', { name: 'Cross the first gate' }).click()
      await page.waitForTimeout(1600)
      const before = await page.evaluate(() => scrollY)
      await page.locator('.landmark').nth(8).click()
      await page.waitForTimeout(1500)
      await page.screenshot({ path: 'artifacts/enies-normal-phone.png' })
      const cdp = await context.newCDPSession(page)
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: 180, y: 170 }],
      })
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 180, y: 270 }],
      })
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await expect(page.locator('.story')).toHaveCount(0)
      expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(3)
    }
    await page.getByRole('button', { name: 'Grand Line Atlas, return to the world map' }).click()
    await expect(page.locator('.loading')).toBeHidden()
  }
})

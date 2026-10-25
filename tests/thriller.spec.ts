import { test, expect } from '@playwright/test'

test('Thriller Bark: all landmarks fit, scene changes work, stories never load or scroll internally', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Thriller Bark', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('#island-title')).toHaveText('Thriller Bark')
  await expect(page.locator('.landmark')).toHaveCount(16)
  await expect(page.locator('.marker-layer')).toBeHidden()
  await page.getByRole('button', { name: 'Florian mist', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Clearer view', exact: true })).toBeVisible()
  await expect(page.locator('.loading')).toBeHidden()
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 740 },
    { width: 360, height: 640 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport)
    for (let i = 0; i < 16; i++) {
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
        await page.waitForTimeout(700)
        await page.screenshot({ path: `artifacts/thriller-${viewport.width}-${i}.png` })
      }
      await page.getByRole('button', { name: /Return to the journey/ }).click()
    }
    await page.waitForTimeout(300)
    await page.screenshot({ path: `artifacts/thriller-intro-${viewport.width}.png` })
  }
  await page.setViewportSize({ width: 1640, height: 900 })
  await page.getByRole('button', { name: 'Enter the haunted ship' }).click()
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

test('failed Thriller Bark model permits returning to the atlas', async ({ page }) => {
  await page.route('**/models/thriller-bark.glb', (route) => route.abort())
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Thriller Bark', exact: true }).click()
  await expect(page.locator('.scene-fallback')).toBeVisible({ timeout: 45000 })
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.locator('.world-dialog')).toBeVisible()
})

test('Thriller cutaways restore, Sunny stays afloat, and normal-motion touch return keeps progress', async ({
  page,
  context,
}) => {
  test.setTimeout(90000)
  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().endsWith('/thriller-bark.glb')) requests.push(r.url())
  })
  await page.setViewportSize({ width: 390, height: 740 })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'Browse', exact: true }).click()
  if (!(await page.getByRole('textbox', { name: 'Find a place' }).isVisible()))
    await page.getByRole('button', { name: 'Browse', exact: true }).click()
  await page.getByRole('textbox', { name: 'Find a place' }).fill('Thriller Bark')
  await page.locator('.chart-results button').first().click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  const inspect = () =>
    page.evaluate(async () => {
      const url = '/node_modules/.vite/deps/@react-three_fiber.js'
      const { _roots } = await import(url)
      const { scene, camera } = [..._roots.values()][0].store.getState()
      const rooms: string[] = [],
        shells: string[] = [],
        movingLayers: number[] = []
      let bob = 0,
        near = 0,
        far = 0,
        time = 0
      scene.traverse((o: any) => {
        if (o.name.startsWith('room-') && o.visible) rooms.push(o.name.split('-')[1])
        if (o.name.startsWith('shell-') && o.visible) shells.push(o.name.split('-')[1])
        if (o.name.startsWith('ship-')) movingLayers.push(o.layers.mask)
        if (o.name === 'Sunny motion') bob = o.position.y
        const u = o.material?.uniforms
        if (u?.uHoleRadius) {
          near = u.uNear.value
          far = u.uFar.value
          time = u.uTime.value
        }
      })
      return {
        rooms: [...new Set(rooms)],
        shells: [...new Set(shells)],
        movingLayers,
        bob,
        near,
        far,
        time,
        cameraNear: camera.near,
        cameraFar: camera.far,
      }
    })
  for (const [i, key] of [
    [6, 'lab'],
    [8, 'perona'],
    [9, 'freezer'],
    [10, 'chapel'],
  ] as const) {
    await page.locator('.landmark').nth(i).click()
    await expect.poll(async () => (await inspect()).rooms).toEqual([key])
    expect((await inspect()).shells).not.toContain(key)
    await page.getByRole('button', { name: /Return to the journey/ }).click()
    await expect.poll(async () => (await inspect()).rooms).toEqual([])
    expect((await inspect()).shells.sort()).toEqual(['chapel', 'freezer', 'lab', 'perona'])
  }
  const first = await inspect()
  expect(first.movingLayers.length).toBeGreaterThan(0)
  expect(first.movingLayers.every((n) => n === 1)).toBe(true)
  expect(first.near).toBe(first.cameraNear)
  expect(first.far).toBe(first.cameraFar)
  await expect.poll(async () => (await inspect()).time).toBeGreaterThan(first.time)
  expect(Math.abs((await inspect()).bob)).toBeLessThanOrEqual(0.1)
  await page.getByRole('button', { name: 'Enter the haunted ship' }).click()
  await page.waitForTimeout(1700)
  const before = await page.evaluate(() => scrollY)
  await page.locator('.landmark').nth(9).click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'artifacts/thriller-normal-phone.png' })
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
  await page.getByRole('button', { name: 'Grand Line Atlas, return to the world map' }).click()
  await expect(page.locator('.loading')).toBeHidden()
  if (!(await page.getByRole('textbox', { name: 'Find a place' }).isVisible()))
    await page.getByRole('button', { name: 'Browse', exact: true }).click()
  await page.getByRole('textbox', { name: 'Find a place' }).fill('Enies Lobby')
  await page.locator('.chart-results button').first().click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await page.getByRole('button', { name: 'Grand Line Atlas, return to the world map' }).click()
  await expect(page.locator('.loading')).toBeHidden()
  if (!(await page.getByRole('textbox', { name: 'Find a place' }).isVisible()))
    await page.getByRole('button', { name: 'Browse', exact: true }).click()
  await page.getByRole('textbox', { name: 'Find a place' }).fill('Thriller Bark')
  await page.locator('.chart-results button').first().click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  expect((await inspect()).rooms).toEqual([])
  expect((await inspect()).shells).toHaveLength(4)
  expect(requests).toHaveLength(1)
})

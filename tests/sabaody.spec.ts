import { test, expect } from '@playwright/test'

test('Sabaody Archipelago: all landmarks fit, scene changes work, stories never load or scroll internally', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Sabaody Archipelago', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('#island-title')).toHaveText('Sabaody Archipelago')
  await expect(page.locator('.landmark')).toHaveCount(16)
  await expect(page.locator('.marker-layer')).toBeHidden()
  await page.getByRole('button', { name: 'Drifting bubbles', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Quiet canopy', exact: true })).toBeVisible()
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
        await page.screenshot({ path: `artifacts/sabaody-${viewport.width}-${i}.png` })
      }
      await page.getByRole('button', { name: /Return to the journey/ }).click()
    }
    await page.waitForTimeout(300)
    await page.screenshot({ path: `artifacts/sabaody-intro-${viewport.width}.png` })
  }
  await page.setViewportSize({ width: 1640, height: 900 })
  await page.getByRole('button', { name: 'Enter the groves' }).click()
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

test('failed Sabaody Archipelago model permits returning to the atlas', async ({ page }) => {
  await page.route('**/models/sabaody.glb', (route) => route.abort())
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Sabaody Archipelago', exact: true }).click()
  await expect(page.locator('.scene-fallback')).toBeVisible({ timeout: 45000 })
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.locator('.world-dialog')).toBeVisible()
})

test('Sabaody cutaway restore, Sunny stays afloat, and normal-motion touch return keeps progress', async ({
  page,
  context,
}) => {
  test.setTimeout(90000)
  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().endsWith('/sabaody.glb')) requests.push(r.url())
  })
  await page.setViewportSize({ width: 390, height: 740 })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'Browse', exact: true }).click()
  if (!(await page.getByRole('textbox', { name: 'Find a place' }).isVisible()))
    await page.getByRole('button', { name: 'Browse', exact: true }).click()
  await page.getByRole('textbox', { name: 'Find a place' }).fill('Sabaody Archipelago')
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
        wheelAngle = 0,
        gondolasUpright = false,
        near = 0,
        far = 0,
        time = 0
      scene.traverse((o: any) => {
        if (o.name.startsWith('room-') && o.visible) rooms.push(o.name.split('-')[1])
        if (o.name.startsWith('shell-') && o.visible) shells.push(o.name.split('-')[1])
        if (o.name.startsWith('ship-')) movingLayers.push(o.layers.mask)
        if (o.name === 'Sabaody Sunny motion') bob = o.position.y
        if (o.name === 'Sabaody wheel') wheelAngle = o.children[0].rotation.z
        if (o.name === 'Level bubble gondolas') {
          const a = o.instanceMatrix.array
          gondolasUpright = Array.from({ length: o.count }, (_, i) => i * 16).every(
            (i) =>
              Math.abs(a[i] - 1) < 0.0001 &&
              Math.abs(a[i + 5] - 1) < 0.0001 &&
              Math.abs(a[i + 10] - 1) < 0.0001,
          )
        }
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
        wheelAngle,
        gondolasUpright,
        near,
        far,
        time,
        cameraNear: camera.near,
        cameraFar: camera.far,
      }
    })
  for (const [i, key] of [[5, 'auction']] as const) {
    await page.locator('.landmark').nth(i).click()
    await expect.poll(async () => (await inspect()).rooms).toEqual([key])
    expect((await inspect()).shells).not.toContain(key)
    await page.getByRole('button', { name: /Return to the journey/ }).click()
    await expect.poll(async () => (await inspect()).rooms).toEqual([])
    expect((await inspect()).shells.sort()).toEqual(['auction', 'bar'])
  }
  const first = await inspect()
  expect(first.movingLayers.length).toBeGreaterThan(0)
  expect(first.movingLayers.every((n) => n === 1)).toBe(true)
  expect(first.near).toBe(first.cameraNear)
  expect(first.far).toBe(first.cameraFar)
  await expect.poll(async () => (await inspect()).time).toBeGreaterThan(first.time)
  await expect.poll(async () => (await inspect()).wheelAngle).toBeGreaterThan(first.wheelAngle)
  expect((await inspect()).gondolasUpright).toBe(true)
  expect(Math.abs((await inspect()).bob)).toBeLessThanOrEqual(0.1)
  await page.getByRole('button', { name: 'Enter the groves' }).click()
  await page.waitForTimeout(1700)
  const before = await page.evaluate(() => scrollY)
  await page.locator('.landmark').nth(9).click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'artifacts/sabaody-normal-phone.png' })
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
  await page.getByRole('textbox', { name: 'Find a place' }).fill('Sabaody Archipelago')
  await page.locator('.chart-results button').first().click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  expect((await inspect()).rooms).toEqual([])
  expect((await inspect()).shells).toHaveLength(2)
  expect(requests).toHaveLength(1)
  await page.getByRole('button', { name: 'Experience settings', exact: true }).click()
  await page.getByRole('checkbox', { name: /Reduced motion/ }).check()
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await expect.poll(async () => (await inspect()).wheelAngle).toBe(0)
  expect((await inspect()).gondolasUpright).toBe(true)
})

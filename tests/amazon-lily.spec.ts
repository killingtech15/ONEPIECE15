import { test, expect } from '@playwright/test'

test('Amazon Lily: all landmarks fit, scene changes work, stories never load or scroll internally', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Amazon Lily', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('#island-title')).toHaveText('Amazon Lily')
  await expect(page.locator('.landmark')).toHaveCount(12)
  await expect(page.locator('.marker-layer')).toBeHidden()
  await page.getByRole('button', { name: 'Calm Belt', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Still waters', exact: true })).toBeVisible()
  await expect(page.locator('.loading')).toBeHidden()
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 740 },
    { width: 360, height: 640 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport)
    for (let i = 0; i < 12; i++) {
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
        await page.screenshot({ path: `artifacts/amazon-lily-${viewport.width}-${i}.png` })
      }
      await page.getByRole('button', { name: /Return to the journey/ }).click()
    }
    await page.waitForTimeout(300)
    await page.screenshot({ path: `artifacts/amazon-lily-intro-${viewport.width}.png` })
  }
  await page.setViewportSize({ width: 1240, height: 900 })
  await page.getByRole('button', { name: 'Enter the valley' }).click()
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

test('failed Amazon Lily model permits returning to the atlas', async ({ page }) => {
  await page.route('**/models/amazon-lily.glb', (route) => route.abort())
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Amazon Lily', exact: true }).click()
  await expect(page.locator('.scene-fallback')).toBeVisible({ timeout: 45000 })
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.locator('.world-dialog')).toBeVisible()
})

test('Amazon Lily keeps water calm, routes cameras over terrain, and restores cached touch navigation', async ({
  page,
  context,
}) => {
  test.setTimeout(120000)
  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().endsWith('/amazon-lily.glb')) requests.push(r.url())
  })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Amazon Lily', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  const inspect = () =>
    page.evaluate(async () => {
      const url = '/node_modules/.vite/deps/@react-three_fiber.js'
      const { _roots } = await import(url)
      const { scene, camera } = [..._roots.values()][0].store.getState()
      let amplitude = 0,
        speed = 0,
        bob = 0,
        movingStatic = false
      scene.traverse((o: any) => {
        if (o.name === 'Perfume Yuda moored motion') bob = o.position.y
        if (o.name.startsWith('ship-') && o.layers.mask & 2) movingStatic = true
        if (o.material?.uniforms?.uAmplitude) {
          amplitude = o.material.uniforms.uAmplitude.value
          speed = o.material.uniforms.uSpeed.value
        }
      })
      return { amplitude, speed, bob, movingStatic, eye: camera.position.toArray() }
    })
  await expect.poll(async () => (await inspect()).amplitude).toBe(0.12)
  expect((await inspect()).speed).toBe(0.2)
  expect((await inspect()).movingStatic).toBe(false)
  expect(Math.abs((await inspect()).bob)).toBeLessThanOrEqual(0.06)
  // Sample actual camera travel against the authored terrain and sculpture.
  await page.evaluate(async () => {
    const fiberUrl = '/node_modules/.vite/deps/@react-three_fiber.js',
      threeUrl = '/node_modules/.vite/deps/three.js'
    const { _roots } = await import(fiberUrl),
      T = await import(threeUrl)
    const root = [..._roots.values()][0],
      state = root.store.getState()
    const terrain: any[] = []
    state.scene.traverse((o: any) => {
      if (o.isMesh && /^(terrain|sculpture)-/.test(o.name)) terrain.push(o)
    })
    const ray = new T.Raycaster(),
      samples: any[] = []
    const cancel = state.internal.subscribe(
      {
        current: () => {
          const p = state.camera.position
          ray.set(new T.Vector3(p.x, 1000, p.z), new T.Vector3(0, -1, 0))
          const hit = ray.intersectObjects(terrain, false)[0]
          samples.push({ eye: p.toArray(), clearance: hit ? p.y - hit.point.y : null })
        },
      },
      -2,
      root.store,
    )
    ;(window as any).amazonAudit = { samples, cancel }
  })
  for (const i of [3, 10, 6, 0]) {
    await page.locator('.landmark').nth(i).click()
    await page.waitForTimeout(2000)
    await expect(page.locator('.loading')).toBeHidden()
  }
  const audit = await page.evaluate(() => {
    const a = (window as any).amazonAudit
    a.cancel()
    return {
      count: a.samples.length,
      min: Math.min(
        ...a.samples.filter((p: any) => p.clearance !== null).map((p: any) => p.clearance),
      ),
    }
  })
  expect(audit.count).toBeGreaterThan(20)
  expect(audit.min).toBeGreaterThan(2)
  await page.getByRole('button', { name: /Return to the journey/ }).click()
  await page.setViewportSize({ width: 390, height: 740 })
  await page.getByRole('button', { name: 'Enter the valley' }).click()
  await page.waitForTimeout(1700)
  const before = await page.evaluate(() => scrollY)
  await page.locator('.landmark').nth(6).click()
  await page.waitForTimeout(1800)
  await page.screenshot({ path: 'artifacts/amazon-normal-phone.png' })
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
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('button', { name: 'View Amazon Lily', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden()
  expect(requests).toHaveLength(1)
  await page.getByRole('button', { name: 'Experience settings', exact: true }).click()
  await page.getByRole('checkbox', { name: /Reduced motion/ }).check()
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await expect.poll(async () => (await inspect()).amplitude).toBe(0)
  expect((await inspect()).bob).toBe(0)
})

import { test, expect } from '@playwright/test'

test('Marineford: all landmarks fit, scene changes work, stories never load or scroll internally', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Marineford', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('#island-title')).toHaveText('Marineford')
  await expect(page.locator('.landmark')).toHaveCount(14)
  await expect(page.locator('.marker-layer')).toBeHidden()
  await page.getByRole('button', { name: 'Harbor breeze', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Still harbor', exact: true })).toBeVisible()
  await expect(page.locator('.loading')).toBeHidden()
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
      if (viewport.width <= 760) expect(b.y - 76).toBeGreaterThan(85)
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
        await page.screenshot({ path: `artifacts/marineford-${viewport.width}-${i}.png` })
      }
      await page.getByRole('button', { name: /Return to the journey/ }).click()
    }
    await page.waitForTimeout(300)
    await page.screenshot({ path: `artifacts/marineford-intro-${viewport.width}.png` })
  }
  await page.setViewportSize({ width: 1240, height: 900 })
  await page.getByRole('button', { name: 'Enter the harbor' }).click()
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

test('failed Marineford model permits returning to the atlas', async ({ page }) => {
  await page.route('**/models/marineford.glb', (route) => route.abort())
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Marineford', exact: true }).click()
  await expect(page.locator('.scene-fallback')).toBeVisible({ timeout: 45000 })
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.locator('.world-dialog')).toBeVisible()
})

test('Marineford camera paths, touch return and cached re-entry', async ({ page, context }) => {
  test.setTimeout(150000)
  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().endsWith('/marineford.glb')) requests.push(r.url())
  })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Marineford', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await page.waitForTimeout(1500)
  await page.evaluate(async () => {
    const ru = '/node_modules/.vite/deps/@react-three_fiber.js',
      tu = '/node_modules/.vite/deps/three.js'
    const { _roots } = await import(ru),
      T = await import(tu),
      root = [..._roots.values()][0],
      s = root.store.getState()
    const ray = new T.Raycaster(),
      prev = s.camera.position.clone(),
      dir = new T.Vector3(),
      collisions: any[] = []
    let count = 0
    const meshes: any[] = []
    s.scene.traverse((o: any) => {
      if (
        o.isMesh &&
        /^(ground|hq|pinnacle|town|terrace|scaffold|wall|quay|fleet|ship)-/.test(o.name)
      )
        meshes.push(o)
    })
    const cancel = s.internal.subscribe(
      {
        current: () => {
          const p = s.camera.position
          dir.copy(p).sub(prev)
          const distance = dir.length()
          if (distance > 0.001) {
            ray.set(prev, dir.normalize())
            ray.near = 0.01
            ray.far = distance
            const hits = ray.intersectObjects(meshes, false)
            if (hits.length) collisions.push({ mesh: hits[0].object.name, eye: p.toArray() })
          }
          prev.copy(p)
          count++
        },
      },
      -2,
      root.store,
    )
    ;(window as any).marineAudit = { collisions, cancel, count: () => count }
  })
  for (const i of [0, 3, 8, 9, 10, 11, 12, 4, 5, 6, 7, 2, 1, 13]) {
    await page.locator('.landmark').nth(i).click()
    await page.waitForTimeout(1900)
    await expect(page.locator('.loading')).toBeHidden()
  }
  const audit = await page.evaluate(() => {
    const a = (window as any).marineAudit
    a.cancel()
    return { collisions: a.collisions, count: a.count() }
  })
  expect(audit.count).toBeGreaterThan(50)
  expect(audit.collisions).toEqual([])
  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 390, height: 740 })
  await page.getByRole('button', { name: 'Enter the harbor', exact: true }).click()
  await page.waitForTimeout(1600)
  const before = await page.evaluate(() => scrollY)
  await page.locator('.landmark').nth(8).click()
  await page.waitForTimeout(1700)
  await page.screenshot({ path: 'artifacts/marineford-normal-phone.png' })
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 180, y: 110 }],
  })
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 180, y: 210 }],
  })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.locator('.story')).toHaveCount(0)
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(3)
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Marineford', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden()
  expect(requests).toHaveLength(1)
  await expect(page.locator('#island-title')).toHaveText('Marineford')
})

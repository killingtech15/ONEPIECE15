import { test, expect } from '@playwright/test'

test('Impel Down: all landmarks fit, scene changes work, stories never load or scroll internally', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Impel Down', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('#island-title')).toHaveText('Impel Down')
  await expect(page.locator('.landmark')).toHaveCount(14)
  await expect(page.locator('.marker-layer')).toBeHidden()
  const picker = page.getByRole('combobox', { name: 'Choose Impel Down landmark or level' })
  await expect(picker).toBeVisible()
  await picker.selectOption('10')
  await expect(page.locator('#story-title')).toHaveText('Newkama Land')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: /Return to the journey/ }).click()
  await page.getByRole('button', { name: 'Prison atmosphere', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Quiet prison', exact: true })).toBeVisible()
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
      await page
        .getByRole('combobox', { name: 'Choose Impel Down landmark or level' })
        .selectOption(String(i))
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
        await page.screenshot({ path: `artifacts/impel-down-${viewport.width}-${i}.png` })
      }
      await page.getByRole('button', { name: /Return to the journey/ }).click()
    }
    await page.waitForTimeout(300)
    await page.screenshot({ path: `artifacts/impel-down-intro-${viewport.width}.png` })
  }
  await page.setViewportSize({ width: 1240, height: 900 })
  await page.getByRole('button', { name: 'Enter the prison' }).click()
  await page.waitForTimeout(500)
  const before = await page.evaluate(() => scrollY)
  await page
    .getByRole('combobox', { name: 'Choose Impel Down landmark or level' })
    .selectOption(String(8))
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

test('failed Impel Down model permits returning to the atlas', async ({ page }) => {
  await page.route('**/models/impel-down.glb', (route) => route.abort())
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Impel Down', exact: true }).click()
  await expect(page.locator('.scene-fallback')).toBeVisible({ timeout: 45000 })
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.locator('.world-dialog')).toBeVisible()
})

test('Impel floor visibility, water separation, safe travel and cached touch returns', async ({
  page,
  context,
}) => {
  test.setTimeout(120000)
  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().endsWith('/impel-down.glb')) requests.push(r.url())
  })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Impel Down', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  const inspect = () =>
    page.evaluate(async () => {
      const url = '/node_modules/.vite/deps/@react-three_fiber.js'
      const { _roots } = await import(url)
      const { scene, camera } = [..._roots.values()][0].store.getState()
      let mode = '',
        water = 0,
        bob = 0,
        movingStatic = false
      const floors: string[] = []
      scene.traverse((o: any) => {
        if (o.userData.presentation) mode = o.userData.presentation
        if (o.material?.uniforms?.uAmplitude) water++
        if (o.isMesh && o.visible && o.name.startsWith('floor')) floors.push(o.name.split('-')[0])
        if (o.name === 'Marine vessel moored motion') bob = o.position.y
        if (o.name.startsWith('ship-') && o.layers.mask & 2) movingStatic = true
      })
      return {
        mode,
        water,
        bob,
        movingStatic,
        floors: [...new Set(floors)],
        eye: camera.position.toArray(),
      }
    })
  expect((await inspect()).water).toBe(1)
  expect((await inspect()).movingStatic).toBe(false)
  await page.evaluate(async () => {
    const url = '/node_modules/.vite/deps/@react-three_fiber.js',
      tu = '/node_modules/.vite/deps/three.js'
    const { _roots } = await import(url),
      T = await import(tu)
    const root = [..._roots.values()][0],
      s = root.store.getState(),
      ray = new T.Raycaster(),
      previous = s.camera.position.clone(),
      direction = new T.Vector3()
    const collisions: any[] = [],
      samples: any[] = []
    const cancel = s.internal.subscribe(
      {
        current: () => {
          const p = s.camera.position
          direction.copy(p).sub(previous)
          const distance = direction.length()
          const meshes: any[] = []
          s.scene.traverse((o: any) => {
            if (o.isMesh && o.visible && /^(floor|surface|structure|ship-)/.test(o.name))
              meshes.push(o)
          })
          if (distance > 0.001) {
            ray.set(previous, direction.normalize())
            ray.near = 0.01
            ray.far = distance
            const hits = ray.intersectObjects(meshes, false)
            if (hits.length) collisions.push({ eye: p.toArray(), mesh: hits[0].object.name })
          }
          previous.copy(p)
          samples.push(p.toArray())
        },
      },
      -2,
      root.store,
    )
    ;(window as any).impelAudit = { collisions, samples, cancel }
  })
  for (const [i, mode] of [
    [2, 'section'],
    [3, '1'],
    [11, '6'],
    [10, '55'],
    [6, '4'],
    [13, 'surface'],
  ] as const) {
    await page
      .getByRole('combobox', { name: 'Choose Impel Down landmark or level' })
      .selectOption(String(i))
    await page.waitForTimeout(1800)
    const state = await inspect()
    expect(state.mode).toBe(mode)
    expect(state.water).toBe(mode === 'surface' ? 1 : 0)
    if (!['section', 'surface'].includes(mode)) expect(state.floors).toEqual(['floor' + mode])
    await expect(page.locator('.loading')).toBeHidden()
  }
  const audit = await page.evaluate(() => {
    const a = (window as any).impelAudit
    a.cancel()
    return { count: a.samples.length, collisions: a.collisions }
  })
  expect(audit.count).toBeGreaterThan(20)
  expect(audit.collisions).toEqual([])
  await page.getByRole('button', { name: /Return to the journey/ }).click()
  await page.setViewportSize({ width: 390, height: 740 })
  await page.getByRole('button', { name: 'Enter the prison', exact: true }).click()
  await page.waitForTimeout(1700)
  const before = await page.evaluate(() => scrollY)
  await page
    .getByRole('combobox', { name: 'Choose Impel Down landmark or level' })
    .selectOption(String(10))
  await page.waitForTimeout(1700)
  await page.screenshot({ path: 'artifacts/impel-normal-phone.png' })
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
  for (const i of [11, 3, 8, 0]) {
    await page
      .getByRole('combobox', { name: 'Choose Impel Down landmark or level' })
      .selectOption(String(i))
    await page.waitForTimeout(100)
  }
  await page.waitForTimeout(1800)
  expect((await inspect()).mode).toBe('surface')
  await page.keyboard.press('Escape')
  await expect(page.locator('.story')).toHaveCount(0)
  const savedMode = (await inspect()).mode
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Impel Down', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden()
  expect(requests).toHaveLength(1)
  expect((await inspect()).mode).toBe(savedMode)
  expect((await inspect()).water).toBe(savedMode === 'surface' ? 1 : 0)
})

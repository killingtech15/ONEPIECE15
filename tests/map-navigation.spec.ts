import { test, expect } from '@playwright/test'

test('phone atlas keeps all 3D touch controls separate', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  const boxes = await page
    .locator('.chart-place.current')
    .evaluateAll((es) =>
      es.map((e) => ({
        name: e.getAttribute('aria-label'),
        ...e.getBoundingClientRect().toJSON(),
      })),
    )
  for (let i = 0; i < boxes.length; i++) {
    expect(boxes[i].width).toBeGreaterThanOrEqual(44)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i],
        b = boxes[j]
      expect(
        a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top,
        `${a.name} overlaps ${b.name}`,
      ).toBe(true)
    }
  }
  await page.screenshot({ path: 'artifacts/atlas-phone-spaced-pins.png' })
  await page.getByRole('button', { name: 'View Impel Down', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(
    page.getByRole('combobox', { name: 'Choose Impel Down landmark or level' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByRole('button', { name: 'View Marineford', exact: true }).click()
  await expect(page.locator('.loading')).toBeHidden({ timeout: 45000 })
  await expect(page.locator('#island-title')).toHaveText('Marineford')
})

test('map first, direct Alabasta entry and repeat transitions', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const modelRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('.glb')) modelRequests.push(request.url())
  })
  await page.goto('/')
  const loader = page.locator('.loading')
  await expect(loader).toHaveClass(/is-ready/)
  await expect(page.getByRole('dialog', { name: 'An ocean of stories.' })).toBeVisible()
  expect(modelRequests).toEqual([])
  expect(
    await page
      .locator('.chart-preload')
      .evaluate((image) => (image as HTMLImageElement).naturalWidth),
  ).toBe(7000)
  await page.screenshot({ path: 'artifacts/map-reference-desktop.png' })
  const alabasta = page.getByRole('button', { name: 'View Alabasta', exact: true })
  await expect(alabasta.locator('.chart-place-label')).toHaveCSS('opacity', '0')
  await alabasta.hover()
  await expect(alabasta.locator('.chart-place-label')).toHaveCSS('opacity', '1')
  await page.mouse.move(0, 0)
  await expect(alabasta.locator('.chart-place-label')).toHaveCSS('opacity', '0')
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).click()
  await expect(loader).not.toHaveClass(/is-ready/)
  await expect(page.locator('.world-dialog')).toHaveCount(0)
  await expect(loader).toHaveClass(/is-ready/, { timeout: 45000 })
  await expect(page.locator('.scene canvas')).toBeVisible()
  await page.getByRole('button', { name: 'The atlas', exact: true }).click()
  await expect(loader).not.toHaveClass(/is-ready/)
  await expect(loader).toHaveClass(/is-ready/)
  await expect(page.locator('.world-dialog')).toBeVisible()
  await page.getByRole('textbox', { name: 'Find a place' }).fill('Alabasta')
  await page.locator('.chart-results button').click()
  await expect(loader).not.toHaveClass(/is-ready/)
  await expect(page.locator('.world-dialog')).toHaveCount(0)
  await expect(loader).toHaveClass(/is-ready/)
  await page.locator('.landmark').first().click()
  await expect(loader).toHaveClass(/is-ready/)
  await expect(page.locator('#story-title')).toHaveText('Royal palace')
  await expect(loader).toHaveClass(/is-ready/)
  await page.keyboard.press('Escape')
  await expect(loader).toHaveClass(/is-ready/)
  await expect(page.locator('.story')).toHaveCount(0)
  await expect(loader).toHaveClass(/is-ready/)
  expect(errors).toEqual([])
})

test('map failure does not trap the loader and offers island navigation', async ({ page }) => {
  await page.route('**/maps/onepiece-world.jpg', (route) =>
    route.fulfill({ status: 404, body: '' }),
  )
  await page.goto('/')
  await expect(page.locator('.loading')).toHaveClass(/is-ready/)
  await expect(page.getByRole('alert')).toContainText('The world chart could not load')
  await expect(
    page.getByRole('alert').getByRole('button', { name: 'Explore Alabasta' }),
  ).toBeEnabled()
})

test('zoom uses native resolution lossless tiles without scaling a cached layer', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('.loading')).toHaveClass(/is-ready/)
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).hover()
  await page.mouse.wheel(0, -1100)
  await expect.poll(() => page.locator('.chart-tile').count()).toBeGreaterThan(0)
  await expect
    .poll(() =>
      page
        .locator('.chart-tile')
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true)
  expect(
    await page
      .locator('.chart-tile')
      .first()
      .evaluate((image) => (image as HTMLImageElement).naturalWidth),
  ).toBe(1024)
  expect(
    await page.locator('.chart-paper').evaluate((paper) => getComputedStyle(paper).transform),
  ).toBe('none')
  await page.screenshot({ path: 'artifacts/map-reference-zoom.png' })
})

test('reduced motion and keyboard entry keep the chart accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.loading')).toHaveClass(/is-ready/)
  await page.getByRole('button', { name: 'View Alabasta', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.world-dialog')).toHaveCount(0)
  await expect(page.locator('.loading')).toHaveClass(/is-ready/, { timeout: 45000 })
  await expect(page.locator('.app')).toHaveClass(/reduced-motion/)
})

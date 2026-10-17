import { test, expect } from '@playwright/test'
import { chartPlaces, newWorldRoute } from '../src/atlas'

test('expanded geography has unique entries and safe chart positions', () => {
  expect(chartPlaces.length).toBeGreaterThan(200)
  expect(new Set(chartPlaces.map((p) => p.id)).size).toBe(chartPlaces.length)
  for (const place of chartPlaces.filter((p) => p.position !== 'unknown')) {
    expect(place.x, place.name).toBeGreaterThanOrEqual(0)
    expect(place.x, place.name).toBeLessThanOrEqual(3000)
    expect(place.y, place.name).toBeGreaterThanOrEqual(0)
    expect(place.y, place.name).toBeLessThanOrEqual(1500)
  }
  for (const id of newWorldRoute) expect(chartPlaces.some((p) => p.id === id)).toBe(true)
  console.log(
    `${chartPlaces.length} locations; ${chartPlaces.filter((p) => p.kind === 'Country').length} countries / kingdoms; ${chartPlaces.filter((p) => p.position !== 'unknown').length} pins`,
  )
})

test('countries, later arcs, aliases and uncharted destinations are discoverable', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('.loading')).toBeHidden()
  await page.getByLabel('Sea or region', { exact: true }).selectOption('New World')
  await page.getByLabel('Location type', { exact: true }).selectOption('Country')
  await expect(page.getByRole('button', { name: 'View Wano Country', exact: true })).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'View Goa Kingdom', exact: true })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Find a place' }).fill('Warland')
  await page.locator('.chart-results button').click()
  await expect(page.locator('.chart-entry h2')).toHaveText('Elbaph')
  await expect(page.locator('.chart-entry')).toContainText('Treasure Tree Adam')
  await page.getByLabel('Sea or region', { exact: true }).selectOption('All seas')
  await page.getByLabel('Location type', { exact: true }).selectOption('All places')
  for (const name of ['Egghead', 'Whole Cake Island', 'Sorbet Kingdom', 'Laugh Tale']) {
    await page.getByRole('textbox', { name: 'Find a place' }).fill(name)
    await page.locator('.chart-results button').click()
    await expect(page.locator('.chart-entry h2')).toHaveText(name)
  }
  await expect(page.locator('.chart-entry')).toContainText('Position unknown / not plotted')
  await expect(page.getByRole('button', { name: 'View Laugh Tale', exact: true })).toHaveCount(0)
  await page.getByLabel('Sea or region', { exact: true }).selectOption('South Blue')
  await page.locator('.chart-directory summary').click()
  await expect(page.locator('.chart-directory')).toContainText('Briss Kingdom')
  await expect(page.locator('.new-world-route')).toHaveCount(1)
})

test('voyage loader shows clouds, sea and ship, and respects reduced motion', async ({ page }) => {
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/maps/onepiece-world.jpg', async (route) => {
    await gate
    await route.continue()
  })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.voyage-loading')).toBeVisible()
  await expect(page.locator('.voyage-ship')).toBeVisible()
  expect(
    await page.locator('.voyage-boat').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('voyage-bob')
  await page.screenshot({ path: 'artifacts/voyage-loader.png' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(
    await page.locator('.voyage-boat').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none')
  release()
  await expect(page.locator('.loading')).toBeHidden()
  await page.screenshot({ path: 'artifacts/expanded-atlas.png' })
})

import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  timeout: 90000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 900 },
    channel: 'chrome',
    headless: true,
  },
  reporter: 'list',
  outputDir: 'artifacts/test-results',
})

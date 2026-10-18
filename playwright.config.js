import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:4173/',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /touch\.spec/ },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7 landscape'] },
      testMatch: /touch\.spec/,
    },
  ],
  webServer: {
    command: 'node scripts/serve.mjs dist 4173',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
  },
});

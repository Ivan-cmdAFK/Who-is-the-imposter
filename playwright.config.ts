import { defineConfig, devices } from '@playwright/test';

// WebKit is Safari's engine; the device profiles give an iPhone-sized touch screen.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173/Who-is-the-imposter/',
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'iPhone 13', use: { ...devices['iPhone 13'] } },
    { name: 'iPhone SE', use: { ...devices['iPhone SE'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/Who-is-the-imposter/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

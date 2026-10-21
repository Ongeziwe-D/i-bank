import { defineConfig, devices } from '@playwright/test';

// The tests sign in with the demo account, so they need a build that includes the mock backend:
// either the dev server (started automatically) or a demo image, e.g.
//   docker run --rm -p 8080:8080 i-bank:demo
//   E2E_BASE_URL=http://localhost:8080 npm run e2e
const externalBaseUrl = process.env['E2E_BASE_URL'];
const isCI = !!process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: externalBaseUrl ?? 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'npm start -- --port 4200',
        url: 'http://localhost:4200',
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});

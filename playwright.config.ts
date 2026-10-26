import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  workers: 1,
  fullyParallel: false,
  retries: 1,
  timeout: 120_000,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: process.env.BASE_URL,
    locale: 'ru-RU',
    screenshot: 'only-on-failure',
    trace: 'off',
    video: 'off',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'space-setup',
      testMatch: /space\.setup\.ts/,
      dependencies: ['setup'],
      use: { storageState: 'auth/session.json' },
    },
    {
      name: 'smoke',
      testMatch: /SM-\d+.*\.spec\.ts/,
      dependencies: ['space-setup'],
      use: { storageState: 'auth/session.json' },
    },
    // Запускается только явно: bunx playwright test --project=cleanup --no-deps
    {
      name: 'cleanup',
      testMatch: /space\.cleanup\.ts/,
      use: { storageState: 'auth/session.json' },
    },
  ],
});

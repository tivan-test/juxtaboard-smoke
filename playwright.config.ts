import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  // У каждого проекта своя папка: tests/setup, tests/smoke, tests/regress
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
    { name: 'setup', testDir: './tests/setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'space-setup',
      testDir: './tests/setup',
      testMatch: /space\.setup\.ts/,
      dependencies: ['setup'],
      use: { storageState: 'auth/session.json' },
    },
    {
      name: 'smoke',
      testDir: './tests/smoke',
      testMatch: /SM-\d+.*\.spec\.ts/,
      dependencies: ['space-setup'],
      use: { storageState: 'auth/session.json' },
    },
    // Регресс зависит только от пространства прогона, не от smoke: падение смоука не отключает регресс
    {
      name: 'regress',
      testDir: './tests/regress',
      testMatch: /RG-\d+.*\.spec\.ts/,
      dependencies: ['space-setup'],
      use: { storageState: 'auth/session.json' },
    },
    // Запускается только явно: bunx playwright test --project=cleanup --no-deps
    {
      name: 'cleanup',
      testDir: './tests/setup',
      testMatch: /space\.cleanup\.ts/,
      use: { storageState: 'auth/session.json' },
    },
  ],
});

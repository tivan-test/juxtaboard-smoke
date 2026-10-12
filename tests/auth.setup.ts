import { test as setup, expect } from '@playwright/test';

// Входим один раз перед прогоном и сохраняем сессию: остальные тесты стартуют уже залогиненными
setup('вход и сохранение сессии', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(process.env.JB_EMAIL!);
  await page.getByLabel('Пароль').fill(process.env.JB_PASSWORD!);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();

  // Вход бывает медленным (10-20 с), поэтому ждём до 60 с
  await expect(page).toHaveURL(/\/projects/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Пространства', exact: true })).toBeVisible({ timeout: 30_000 });

  await page.context().storageState({ path: 'auth/session.json' });
});

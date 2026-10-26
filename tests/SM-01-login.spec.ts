import { test, expect } from '@playwright/test';

// SM-01 проверяет сам вход, поэтому стартует без сохранённой сессии
test.use({ storageState: { cookies: [], origins: [] } });

test('SM-01 Вход в аккаунт', async ({ page }) => {
  await test.step('Шаг 1. Открыть страницу входа', async () => {
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: 'Войти' })).toBeVisible();
  });

  await test.step('Шаги 2–3. Ввести почту и пароль из .env; Нажать «Войти»', async () => {
    await page.getByLabel('Email').fill(process.env.JB_EMAIL!);
    await page.getByLabel('Пароль').fill(process.env.JB_PASSWORD!);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();

    // Ожидание: открылся список пространств. Вход бывает медленным, ждём до 60 с
    await expect(page).toHaveURL(/\/projects/, { timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Пространства', exact: true })).toBeVisible({ timeout: 30_000 });
  });
});

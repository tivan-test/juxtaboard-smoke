import { test, expect } from '@playwright/test';

test('SM-29 Возврат из «Мои задачи»', async ({ page }) => {
  await test.step('Шаг 1. Открыть /me/work', async () => {
    await page.goto('/me/work');
  });

  await test.step('Шаг 2. Нажать «← Проекты»', async () => {
    await page.getByRole('banner').getByRole('link', { name: 'Проекты' }).click({ timeout: 60_000 });

    // Ожидание: адрес /projects, виден заголовок «Проекты»
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole('heading', { name: 'Проекты', exact: true })).toBeVisible({ timeout: 30_000 });
  });
});

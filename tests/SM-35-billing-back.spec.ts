import { test, expect } from '@playwright/test';

test('SM-35 Возврат из оплаты', async ({ page }) => {
  await test.step('Шаг 1. Открыть /account/billing', async () => {
    await page.goto('/account/billing');
  });

  await test.step('Шаг 2. Нажать «К проектам»', async () => {
    await page.getByRole('link', { name: 'К проектам' }).click({ timeout: 60_000 });

    // Ожидание: адрес /projects, виден заголовок «Проекты»
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole('heading', { name: 'Проекты', exact: true })).toBeVisible({ timeout: 30_000 });
  });
});

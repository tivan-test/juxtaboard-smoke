import { test, expect } from '@playwright/test';

test('SM-35 Возврат из оплаты', async ({ page }) => {
  // Шаг 1. Открыть /account/billing
  await page.goto('/account/billing');

  // Шаг 2. Нажать «К проектам»
  await page.getByRole('link', { name: 'К проектам' }).click({ timeout: 60_000 });

  // Ожидание: адрес /projects, виден заголовок «Пространства»
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { name: 'Пространства', exact: true })).toBeVisible({ timeout: 30_000 });
});

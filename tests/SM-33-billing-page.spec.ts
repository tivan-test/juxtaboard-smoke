import { test, expect } from '@playwright/test';

test('SM-33 «Оплата и использование»', async ({ page }) => {
  // Шаг 1. Открыть /projects → кнопка профиля
  await page.goto('/projects');
  await page.getByRole('banner').getByRole('button', { name: 'AT', exact: true }).click({ timeout: 60_000 });

  // Шаг 2. Нажать «Оплата и использование»
  await page.getByRole('dialog').getByRole('link', { name: 'Оплата и использование' }).click();

  // Ожидание 1: адрес /account/billing
  await expect(page).toHaveURL(/\/account\/billing/);

  // Ожидание 2: видны «Текущий тариф», «Метрики использования», «Доступные тарифы» (только смотрим, ничего не нажимаем)
  await expect(page.getByText('Текущий тариф', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: /^Метрики использования/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Доступные тарифы' })).toBeVisible();
});

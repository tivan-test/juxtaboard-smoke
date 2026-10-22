import { test, expect } from '@playwright/test';

test('SM-03 Главный экран', async ({ page }) => {
  // Шаг 1. Открыть /projects
  await page.goto('/projects');

  // Ожидание 1: виден заголовок «Пространства»
  await expect(page.getByRole('heading', { name: 'Пространства', exact: true })).toBeVisible({ timeout: 60_000 });

  // Ожидание 2: видны надписи «Активных пространств» и «Скрытых пространств»
  await expect(page.getByRole('link', { name: /^Активных пространств/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Скрытых пространств/ })).toBeVisible();

  // Ожидание 3: видно поле поиска «Название пространства или документа…»
  await expect(page.getByRole('textbox', { name: 'Название пространства или документа…' })).toBeVisible();

  // Ожидание 4: на карточках видны кнопки «Навигатор», «Схема», «Автоматизации»
  await expect(page.getByRole('button', { name: 'Навигатор', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Схема', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Автоматизации', exact: true }).first()).toBeVisible();
});

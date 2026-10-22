import { test, expect } from '@playwright/test';

test('SM-04 Счётчики пространств не врут', async ({ page }) => {
  // Шаг 1. Открыть /projects, запомнить N из «Активных пространств: N» и M из «Скрытых пространств: M»
  await page.goto('/projects');
  const activeLink = page.getByRole('link', { name: /^Активных пространств: \d+$/ });
  const hiddenLink = page.getByRole('link', { name: /^Скрытых пространств: \d+$/ });
  await expect(activeLink).toBeVisible({ timeout: 60_000 });
  const n = Number((await activeLink.textContent())!.match(/\d+/)![0]);
  const m = Number((await hiddenLink.textContent())!.match(/\d+/)![0]);

  // Шаг 2. Нажать «Показать ещё»
  await page.getByRole('button', { name: /^Показать ещё/ }).click();

  // Шаг 3. Посчитать карточки в разделе «Активные пространства» (у каждой карточки заголовок с названием)
  // Ожидание 1: карточек в активных ровно N
  await expect(page.locator('#active-spaces').getByRole('heading', { level: 3 })).toHaveCount(n);

  // Шаг 4. Раскрыть «Скрытые пространства»
  await page.getByRole('button', { name: /^Скрытые пространства/ }).click();

  // Шаг 5. Посчитать карточки в разделе скрытых
  // Ожидание 2: карточек в скрытых ровно M
  await expect(page.locator('#hidden-spaces').getByRole('heading', { level: 3 })).toHaveCount(m);
});

import { test, expect } from '@playwright/test';

test('SM-11 «Показать ещё»', async ({ page }) => {
  // Шаг 1. Открыть /projects и посчитать карточки в «Активные пространства»
  await page.goto('/projects');
  const activeCards = page.locator('#active-spaces').getByRole('heading', { level: 3 });
  await expect(activeCards.first()).toBeVisible({ timeout: 60_000 });
  const before = await activeCards.count();

  // Шаг 2. Нажать «Показать ещё»
  await page.getByRole('button', { name: /^Показать ещё/ }).click();

  // Ожидание: карточек стало больше
  await expect.poll(() => activeCards.count(), { message: 'карточек стало больше' }).toBeGreaterThan(before);
});

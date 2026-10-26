import { test, expect } from '@playwright/test';
import { activeSpaces, spaceCardTitles } from './support/projects';

test('SM-11 «Показать ещё»', async ({ page }) => {
  // Шаг 1. Открыть /projects и посчитать карточки в «Активные пространства»
  await page.goto('/projects');
  const activeCards = spaceCardTitles(activeSpaces(page));
  await expect(activeCards).not.toHaveCount(0, { timeout: 60_000 });
  const before = await activeCards.count();

  // Шаг 2. Нажать «Показать ещё»
  await page.getByRole('button', { name: /^Показать ещё/ }).click();

  // Ожидание: карточек стало больше
  await expect.poll(() => activeCards.count(), { message: 'карточек стало больше' }).toBeGreaterThan(before);
});

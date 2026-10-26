import { test, expect } from '@playwright/test';
import { activeSpaces, spaceCardTitles } from './support/projects';

test('SM-11 «Показать ещё»', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let activeCards, before;

  await test.step('Шаг 1. Открыть /projects и посчитать карточки в «Активные пространства»', async () => {
    await page.goto('/projects');
    activeCards = spaceCardTitles(activeSpaces(page));
    await expect(activeCards).not.toHaveCount(0, { timeout: 60_000 });
    before = await activeCards.count();
  });

  await test.step('Шаг 2. Нажать «Показать ещё»', async () => {
    await page.getByRole('button', { name: /^Показать ещё/ }).click();

    // Ожидание: карточек стало больше
    await expect.poll(() => activeCards.count(), { message: 'карточек стало больше' }).toBeGreaterThan(before);
  });
});

import { test, expect, type Locator } from '@playwright/test';
import { activeSpaces, hiddenSpaces, spaceCardTitles } from '../support/projects';

test('SM-04 Счётчики пространств не врут', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let activeLink: Locator, hiddenLink: Locator, n: number, m: number;

  await test.step('Шаг 1. Открыть /projects, запомнить число N из «Активных проектов: N» и число M из «Скрытых проектов: M»', async () => {
    await page.goto('/projects');
    activeLink = page.getByRole('link', { name: /^Активных проектов: \d+$/ });
    hiddenLink = page.getByRole('link', { name: /^Скрытых проектов: \d+$/ });
    await expect(activeLink).toBeVisible({ timeout: 60_000 });
    n = Number((await activeLink.textContent())!.match(/\d+/)![0]);
    m = Number((await hiddenLink.textContent())!.match(/\d+/)![0]);
  });

  await test.step('Шаг 2. Нажать «Показать ещё»', async () => {
    await page.getByRole('button', { name: /^Показать ещё/ }).click();
  });

  await test.step('Шаг 3. Посчитать карточки в разделе «Активные проекты»', async () => {
    // Ожидание 1: карточек в активных ровно N (раздел скрытых пока свёрнут, его карточек на странице нет)
    await expect(spaceCardTitles(activeSpaces(page))).toHaveCount(n);
  });

  await test.step('Шаг 4. Раскрыть «Скрытые проекты»', async () => {
    await page.getByRole('button', { name: /^Скрытые проекты/ }).click();
  });

  await test.step('Шаг 5. Посчитать карточки в разделе скрытых', async () => {
    // Ожидание 2: карточек в скрытых ровно M
    await expect(spaceCardTitles(hiddenSpaces(page))).toHaveCount(m);
  });
});

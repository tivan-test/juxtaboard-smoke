import { test, expect } from '@playwright/test';
import { hiddenSpaces, spaceCardTitles } from './support/projects';

test('SM-12 Переход к скрытым пространствам', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let hiddenLink;

  await test.step('Шаг 1. Открыть /projects', async () => {
    await page.goto('/projects');
    hiddenLink = page.getByRole('link', { name: /^Скрытых пространств: \d+$/ });
    await expect(hiddenLink).toBeVisible({ timeout: 60_000 });
  });

  await test.step('Шаг 2. Нажать на надпись «Скрытых пространств: M»', async () => {
    await hiddenLink.click();

    // Ожидание: раздел «Скрытые пространства» раскрыт, в нём есть хотя бы одна карточка
    // (карточки раздела появляются на странице, только когда он раскрыт)
    await expect(page.getByRole('button', { name: /^Скрытые пространства/ })).toHaveAttribute('aria-expanded', 'true');
    await expect(spaceCardTitles(hiddenSpaces(page))).not.toHaveCount(0);
  });
});

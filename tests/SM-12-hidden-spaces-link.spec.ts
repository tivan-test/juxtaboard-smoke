import { test, expect } from '@playwright/test';

test('SM-12 Переход к скрытым пространствам', async ({ page }) => {
  // Шаг 1. Открыть /projects
  await page.goto('/projects');
  const hiddenLink = page.getByRole('link', { name: /^Скрытых пространств: \d+$/ });
  await expect(hiddenLink).toBeVisible({ timeout: 60_000 });

  // Шаг 2. Нажать на надпись «Скрытых пространств: M»
  await hiddenLink.click();

  // Ожидание: раздел «Скрытые пространства» раскрыт, в нём видна хотя бы одна карточка
  await expect(page.getByRole('button', { name: /^Скрытые пространства/ })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#hidden-spaces').getByRole('heading', { level: 3 }).first()).toBeVisible();
});

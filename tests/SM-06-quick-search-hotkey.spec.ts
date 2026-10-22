import { test, expect } from '@playwright/test';

test('SM-06 Быстрый поиск по Ctrl+K', async ({ page }) => {
  // Шаг 1. Открыть /projects
  await page.goto('/projects');
  const search = page.getByRole('textbox', { name: 'Название пространства или документа…' });
  await expect(search).toBeVisible({ timeout: 60_000 });

  // Шаг 2. Нажать Ctrl+K
  await page.keyboard.press('Control+k');

  // Ожидание: курсор стоит в поле «Название пространства или документа…»
  await expect(search).toBeFocused();
});

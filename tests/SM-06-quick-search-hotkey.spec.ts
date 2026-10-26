import { test, expect } from '@playwright/test';

test('SM-06 Быстрый поиск по Ctrl+K', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let search;

  await test.step('Шаг 1. Открыть /projects', async () => {
    await page.goto('/projects');
    search = page.getByRole('textbox', { name: 'Название пространства или документа…' });
    await expect(search).toBeVisible({ timeout: 60_000 });
  });

  await test.step('Шаг 2. Нажать Ctrl+K', async () => {
    await page.keyboard.press('Control+k');

    // Ожидание: курсор стоит в поле «Название пространства или документа…»
    await expect(search).toBeFocused();
  });
});

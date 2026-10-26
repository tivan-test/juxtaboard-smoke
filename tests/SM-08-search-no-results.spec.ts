import { test, expect } from '@playwright/test';

test('SM-08 Поиск без результатов', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let search;

  await test.step('Шаг 1. Открыть /projects', async () => {
    await page.goto('/projects');
    search = page.getByRole('textbox', { name: 'Название пространства или документа…' });
    await expect(search).toBeVisible({ timeout: 60_000 });
  });

  await test.step('Шаг 2. Ввести в поиск «qqzzxx999»', async () => {
    await search.fill('qqzzxx999');

    // Ожидание: видно «Ничего не найдено»
    await expect(page.getByText('Ничего не найдено')).toBeVisible({ timeout: 30_000 });
  });
});

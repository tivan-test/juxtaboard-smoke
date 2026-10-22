import { test, expect } from '@playwright/test';

test('SM-08 Поиск без результатов', async ({ page }) => {
  // Шаг 1. Открыть /projects
  await page.goto('/projects');
  const search = page.getByRole('textbox', { name: 'Название пространства или документа…' });
  await expect(search).toBeVisible({ timeout: 60_000 });

  // Шаг 2. Ввести в поиск «qqzzxx999»
  await search.fill('qqzzxx999');

  // Ожидание: видно «Ничего не найдено»
  await expect(page.getByText('Ничего не найдено')).toBeVisible({ timeout: 30_000 });
});

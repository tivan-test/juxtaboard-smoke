import { test, expect } from '@playwright/test';

test('SM-09 Очистка поиска', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let search;

  await test.step('Шаг 1. Открыть /projects', async () => {
    await page.goto('/projects');
    search = page.getByRole('textbox', { name: 'Название пространства или документа…' });
    await expect(search).toBeVisible({ timeout: 60_000 });
  });

  await test.step('Шаг 2. Ввести в поиск «qqzzxx999»', async () => {
    await search.fill('qqzzxx999');
    await expect(page.getByText('Ничего не найдено')).toBeVisible({ timeout: 30_000 });
  });

  await test.step('Шаг 3. Нажать крестик в поле', async () => {
    await page.getByRole('button', { name: 'Clear' }).click();

    // Ожидание 1: поле поиска пустое
    await expect(search).toHaveValue('');

    // Ожидание 2: надписи «Ничего не найдено» нет
    await expect(page.getByText('Ничего не найдено')).toBeHidden();
  });
});

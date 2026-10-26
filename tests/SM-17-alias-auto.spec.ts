import { test, expect } from '@playwright/test';

test('SM-17 Автоалиас', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let dialog;

  await test.step('Шаг 1. Открыть /projects → «Добавить пространство»', async () => {
    await page.goto('/projects');
    await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click({ timeout: 60_000 });
    dialog = page.getByRole('dialog', { name: 'Добавить пространство' });
  });

  await test.step('Шаг 2. Ввести название «TEST_Проверка алиаса»', async () => {
    await dialog.getByRole('textbox', { name: 'Название' }).fill('TEST_Проверка алиаса');

    // Ожидание: в поле «Алиас» «test-proverka-aliasa» и надпись «Доступен»
    await expect(dialog.getByRole('textbox', { name: 'Алиас' })).toHaveValue('test-proverka-aliasa');
    await expect(dialog.getByText('Доступен')).toBeVisible({ timeout: 15_000 });
  });

  await test.step('Шаг 3. Закрыть окно клавишей Esc', async () => {
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

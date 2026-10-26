import { test, expect } from '@playwright/test';

test('SM-21 Алиас «12345»', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let dialog;

  await test.step('Шаг 1. Открыть /projects → «Добавить пространство»', async () => {
    await page.goto('/projects');
    await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click({ timeout: 60_000 });
    dialog = page.getByRole('dialog', { name: 'Добавить пространство' });
  });

  await test.step('Шаг 2. Ввести в «Алиас» «12345»', async () => {
    await dialog.getByRole('textbox', { name: 'Алиас' }).fill('12345');

    // Ожидание: видно «Должна быть хотя бы одна буква»
    await expect(dialog.getByText('Должна быть хотя бы одна буква')).toBeVisible({ timeout: 15_000 });
  });

  await test.step('Шаг 3. Закрыть окно клавишей Esc', async () => {
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

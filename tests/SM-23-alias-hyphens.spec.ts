import { test, expect } from '@playwright/test';

test('SM-23 Алиас «-abc--def-»', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let dialog;

  await test.step('Шаг 1. Открыть /projects → «Добавить пространство»', async () => {
    await page.goto('/projects');
    await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click({ timeout: 60_000 });
    dialog = page.getByRole('dialog', { name: 'Добавить пространство' });
  });

  await test.step('Шаг 2. Ввести в «Алиас» «-abc--def-»', async () => {
    await dialog.getByRole('textbox', { name: 'Алиас' }).fill('-abc--def-');

    // Ожидание: видно «Нельзя начинать или заканчивать дефисом и использовать «--»»
    await expect(dialog.getByText('Нельзя начинать или заканчивать дефисом и использовать «--»')).toBeVisible({ timeout: 15_000 });
  });

  await test.step('Шаг 3. Закрыть окно клавишей Esc', async () => {
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

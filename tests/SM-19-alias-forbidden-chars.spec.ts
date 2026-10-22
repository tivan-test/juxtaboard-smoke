import { test, expect } from '@playwright/test';

test('SM-19 Алиас «Абв Test_1»', async ({ page }) => {
  // Шаг 1. Открыть /projects → «Добавить пространство»
  await page.goto('/projects');
  await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click({ timeout: 60_000 });
  const dialog = page.getByRole('dialog', { name: 'Добавить пространство' });

  // Шаг 2. Ввести в «Алиас» «Абв Test_1»
  await dialog.getByRole('textbox', { name: 'Алиас' }).fill('Абв Test_1');

  // Ожидание: в поле «Алиас» «test1» и надпись «Доступен»
  await expect(dialog.getByRole('textbox', { name: 'Алиас' })).toHaveValue('test1');
  await expect(dialog.getByText('Доступен')).toBeVisible({ timeout: 15_000 });

  // Шаг 3. Закрыть окно клавишей Esc (пространство не создаётся)
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

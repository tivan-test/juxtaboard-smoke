import { test, expect } from '@playwright/test';

test('SM-21 Алиас «12345»', async ({ page }) => {
  // Шаг 1. Открыть /projects → «Добавить пространство»
  await page.goto('/projects');
  await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click({ timeout: 60_000 });
  const dialog = page.getByRole('dialog', { name: 'Добавить пространство' });

  // Шаг 2. Ввести в «Алиас» «12345»
  await dialog.getByRole('textbox', { name: 'Алиас' }).fill('12345');

  // Ожидание: видно «Должна быть хотя бы одна буква»
  await expect(dialog.getByText('Должна быть хотя бы одна буква')).toBeVisible({ timeout: 15_000 });

  // Шаг 3. Закрыть окно клавишей Esc (пространство не создаётся)
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

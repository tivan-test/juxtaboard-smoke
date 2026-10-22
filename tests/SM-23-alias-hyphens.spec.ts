import { test, expect } from '@playwright/test';

test('SM-23 Алиас «-abc--def-»', async ({ page }) => {
  // Шаг 1. Открыть /projects → «Добавить пространство»
  await page.goto('/projects');
  await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click({ timeout: 60_000 });
  const dialog = page.getByRole('dialog', { name: 'Добавить пространство' });

  // Шаг 2. Ввести в «Алиас» «-abc--def-»
  await dialog.getByRole('textbox', { name: 'Алиас' }).fill('-abc--def-');

  // Ожидание: видно «Нельзя начинать или заканчивать дефисом и использовать «--»»
  await expect(dialog.getByText('Нельзя начинать или заканчивать дефисом и использовать «--»')).toBeVisible({ timeout: 15_000 });

  // Шаг 3. Закрыть окно клавишей Esc (пространство не создаётся)
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

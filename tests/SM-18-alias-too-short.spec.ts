import { test, expect } from '@playwright/test';

test('SM-18 Алиас «ab»', async ({ page }) => {
  // Шаг 1. Открыть /projects → «Добавить пространство»
  await page.goto('/projects');
  await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click({ timeout: 60_000 });
  const dialog = page.getByRole('dialog', { name: 'Добавить пространство' });

  // Шаг 2. Ввести в «Алиас» «ab»
  await dialog.getByRole('textbox', { name: 'Алиас' }).fill('ab');

  // Ожидание: видно «Минимум 3 символа»
  await expect(dialog.getByText('Минимум 3 символа')).toBeVisible({ timeout: 15_000 });

  // Шаг 3. Закрыть окно клавишей Esc (пространство не создаётся)
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

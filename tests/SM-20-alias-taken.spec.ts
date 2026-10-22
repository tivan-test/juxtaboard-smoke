import { test, expect } from '@playwright/test';

test('SM-20 Алиас «juxt»', async ({ page }) => {
  // Шаг 1. Открыть /projects → «Добавить пространство»
  await page.goto('/projects');
  await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click({ timeout: 60_000 });
  const dialog = page.getByRole('dialog', { name: 'Добавить пространство' });

  // Шаг 2. Ввести в «Алиас» «juxt»
  await dialog.getByRole('textbox', { name: 'Алиас' }).fill('juxt');

  // Ожидание: видно «Этот алиас уже занят»
  await expect(dialog.getByText('Этот алиас уже занят')).toBeVisible({ timeout: 15_000 });

  // Шаг 3. Закрыть окно клавишей Esc (пространство не создаётся)
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

import { test, expect } from '@playwright/test';

test('SM-24 Сброс формы по Esc', async ({ page }) => {
  // Шаг 1. Открыть /projects → «Добавить пространство»
  await page.goto('/projects');
  const addButton = page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' });
  await addButton.click({ timeout: 60_000 });
  const dialog = page.getByRole('dialog', { name: 'Добавить пространство' });

  // Шаг 2. Ввести название «TEST_Сброс формы»
  await dialog.getByRole('textbox', { name: 'Название' }).fill('TEST_Сброс формы');

  // Шаг 3. Нажать Esc (пространство не создаётся)
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // Шаг 4. Снова нажать «Добавить пространство»
  await addButton.click();

  // Ожидание: поля «Название» и «Алиас» пустые
  await expect(dialog.getByRole('textbox', { name: 'Название' })).toHaveValue('');
  await expect(dialog.getByRole('textbox', { name: 'Алиас' })).toHaveValue('');
});

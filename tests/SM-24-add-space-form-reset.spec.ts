import { test, expect } from '@playwright/test';

test('SM-24 Сброс формы по Esc', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let addButton, dialog;

  await test.step('Шаг 1. Открыть /projects → «Добавить пространство»', async () => {
    await page.goto('/projects');
    addButton = page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' });
    await addButton.click({ timeout: 60_000 });
    dialog = page.getByRole('dialog', { name: 'Добавить пространство' });
  });

  await test.step('Шаг 2. Ввести название «TEST_Сброс формы»', async () => {
    await dialog.getByRole('textbox', { name: 'Название' }).fill('TEST_Сброс формы');
  });

  await test.step('Шаг 3. Нажать Esc', async () => {
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  await test.step('Шаг 4. Снова нажать «Добавить пространство»', async () => {
    await addButton.click();

    // Ожидание: поля «Название» и «Алиас» пустые
    await expect(dialog.getByRole('textbox', { name: 'Название' })).toHaveValue('');
    await expect(dialog.getByRole('textbox', { name: 'Алиас' })).toHaveValue('');
  });
});

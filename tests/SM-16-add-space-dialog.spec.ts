import { test, expect, type Locator } from '@playwright/test';

test('SM-16 Окно «Добавить пространство»', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let dialog: Locator;

  await test.step('Шаг 1. Открыть /projects', async () => {
    await page.goto('/projects');
  });

  await test.step('Шаг 2. Нажать «Добавить пространство»', async () => {
    await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click({ timeout: 60_000 });

    // Ожидание: в окне есть поля «Название» и «Алиас», кнопки «Создать пустым» и «Создать и настроить»
    dialog = page.getByRole('dialog', { name: 'Добавить пространство' });
    await expect(dialog.getByRole('textbox', { name: 'Название' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Алиас' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Создать пустым' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Создать и настроить' })).toBeVisible();
  });
});

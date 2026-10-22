import { test, expect } from '@playwright/test';

test('SM-16 Окно «Добавить пространство»', async ({ page }) => {
  // Шаг 1. Открыть /projects
  await page.goto('/projects');

  // Шаг 2. Нажать «Добавить пространство»
  await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click({ timeout: 60_000 });

  // Ожидание: в окне есть поля «Название» и «Алиас», кнопки «Создать пустым» и «Создать и настроить»
  const dialog = page.getByRole('dialog', { name: 'Добавить пространство' });
  await expect(dialog.getByRole('textbox', { name: 'Название' })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Алиас' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Создать пустым' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Создать и настроить' })).toBeVisible();
});

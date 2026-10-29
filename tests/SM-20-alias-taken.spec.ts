import { test, expect, type Locator } from '@playwright/test';

test('SM-20 Алиас «juxt»', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let dialog: Locator;

  await test.step('Шаг 1. Открыть /projects → «Добавить проект»', async () => {
    await page.goto('/projects');
    await page.getByRole('banner').getByRole('button', { name: 'Добавить проект' }).click({ timeout: 60_000 });
    dialog = page.getByRole('dialog', { name: 'Добавить проект' });
  });

  await test.step('Шаг 2. Ввести в «Алиас» «juxt»', async () => {
    await dialog.getByRole('textbox', { name: 'Алиас' }).fill('juxt');

    // Ожидание: видно «Этот алиас уже занят»
    await expect(dialog.getByText('Этот алиас уже занят')).toBeVisible({ timeout: 15_000 });
  });

  await test.step('Шаг 3. Закрыть окно клавишей Esc', async () => {
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

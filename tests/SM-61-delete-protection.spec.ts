import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-61 Защита удаления, без удаления', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let admin: Locator, dialog: Locator, deleteButton: Locator;

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Администрирование» → «Удалить проект»', async () => {
    await page.goto(url);
    admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
    await expect(admin).toBeVisible({ timeout: 60_000 });
    await admin.click();
    await page.getByRole('menuitem', { name: 'Удалить проект', exact: true }).click();
    dialog = page.getByRole('alertdialog', { name: 'Вы уверены?' });
    // Кнопку «Удалить проект» в этом тесте никогда не нажимаем
    deleteButton = dialog.getByRole('button', { name: 'Удалить проект' });

    // Ожидание 1: кнопка «Удалить проект» неактивна
    await expect(deleteButton).toBeDisabled();
  });

  await test.step('Шаг 2. Ввести в поле подтверждения «TEST_не_то_название»', async () => {
    await dialog.getByRole('textbox', { name: /^Введите название проекта для подтверждения/ }).fill('TEST_не_то_название');

    // Ожидание 2: кнопка «Удалить проект» неактивна
    await expect(deleteButton).toBeDisabled();
  });

  await test.step('Шаг 3. Нажать «Отмена»', async () => {
    await dialog.getByRole('button', { name: 'Отмена' }).click();

    // Ожидание 3: навигатор пространства прогона открыт
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('banner').getByRole('button', { name: 'Сменить проект' }).filter({ hasText: name })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-81 Переименование папки с иконкой', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const oldRow = page.locator('[data-folder-id]').filter({ hasText: 'TEST_SM81_Папка' });
  const newRow = page.locator('[data-folder-id]').filter({ hasText: 'TEST_SM81_Новое' });

  await test.step('Предусловие (SM-79): создать свою папку TEST_SM81_Папка', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «Папка», ввести «TEST_SM81_Папка», нажать Enter
    await page.getByRole('main').getByRole('button', { name: 'Папка', exact: true }).click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM81_Папка');
    await page.keyboard.press('Enter');
    await expect(oldRow).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM81_Папка → «Переименовать»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке папки
  await oldRow.hover();
  await oldRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Переименовать' }).click();

  // Шаг 2. Ввести «TEST_SM81_Новое», выбрать любую иконку (здесь «customers»)
  const dialog = page.getByRole('dialog', { name: 'Переименовать папку' });
  await dialog.getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM81_Новое');
  await dialog.getByRole('button', { name: 'customers', exact: true }).click();

  // Шаг 3. Нажать «Переименовать»
  await dialog.getByRole('button', { name: 'Переименовать', exact: true }).click();
  await expect(dialog).toBeHidden();

  // Шаг 4. Перезагрузить страницу
  await page.reload();

  // Ожидание: в дереве «TEST_SM81_Новое»
  await expect(newRow).toBeVisible({ timeout: 60_000 });

  // Ожидание: «TEST_SM81_Папка» в дереве нет
  await expect(oldRow).toHaveCount(0);
});

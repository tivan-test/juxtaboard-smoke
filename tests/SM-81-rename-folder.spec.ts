import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, openTreeItemActions, treeItem } from './support/navigator';

test('SM-81 Переименование папки с иконкой', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const oldFolder = treeItem(page, 'TEST_SM81_Папка');
  const newFolder = treeItem(page, 'TEST_SM81_Новое');

  await test.step('Предусловие (SM-79): создать свою папку TEST_SM81_Папка', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «Папка», ввести «TEST_SM81_Папка», нажать Enter
    await navigatorButton(page, 'Папка').click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM81_Папка');
    await page.keyboard.press('Enter');
    await expect(oldFolder).toBeVisible();
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let dialog: Locator;

  await test.step('Шаг 1. ⋮ у TEST_SM81_Папка → «Переименовать»', async () => {
    await openTreeItemActions(oldFolder);
    await page.getByRole('menuitem', { name: 'Переименовать' }).click();
  });

  await test.step('Шаг 2. Ввести «TEST_SM81_Новое», выбрать любую иконку', async () => {
    dialog = page.getByRole('dialog', { name: 'Переименовать папку' });
    await dialog.getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM81_Новое');
    await dialog.getByRole('button', { name: 'customers', exact: true }).click();
  });

  await test.step('Шаг 3. Нажать «Переименовать»', async () => {
    await dialog.getByRole('button', { name: 'Переименовать', exact: true }).click();
    await expect(dialog).toBeHidden();
  });

  await test.step('Шаг 4. Перезагрузить страницу', async () => {
    await page.reload();

    // Ожидание: в дереве «TEST_SM81_Новое»
    await expect(newFolder).toBeVisible({ timeout: 60_000 });

    // Ожидание: «TEST_SM81_Папка» в дереве нет
    await expect(oldFolder).toHaveCount(0);
  });
});

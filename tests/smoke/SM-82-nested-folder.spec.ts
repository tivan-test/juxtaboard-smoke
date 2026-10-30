import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { childTreeItem, navigatorButton, openSpace, openTreeItemActions, treeItem } from '../support/navigator';

test('SM-82 Вложенная папка', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const folder = treeItem(page, 'TEST_SM82_Папка');

  await test.step('Предусловие (SM-79): создать свою папку TEST_SM82_Папка', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «Папка», ввести «TEST_SM82_Папка», нажать Enter
    await navigatorButton(page, 'Папка').click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM82_Папка');
    await page.keyboard.press('Enter');
    await expect(folder).toBeVisible();
  });

  await test.step('Шаг 1. ⋮ у TEST_SM82_Папка → «Создать» → «Новая папка»', async () => {
    await openTreeItemActions(folder);
    await page.getByRole('menuitem', { name: 'Создать' }).hover();
    await page.getByRole('menu', { name: 'Создать' }).getByRole('menuitem', { name: 'Новая папка' }).click();
  });

  await test.step('Шаг 2. Ввести «TEST_SM82_Вложенная», нажать Enter', async () => {
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM82_Вложенная');
    await page.keyboard.press('Enter');
  });

  await test.step('Шаг 3. Раскрыть TEST_SM82_Папка', async () => {
    // (повторное нажатие «Свернуть» свернуло бы её)

    // Ожидание: внутри папки есть «TEST_SM82_Вложенная»
    await expect(childTreeItem(folder, 'TEST_SM82_Вложенная')).toBeVisible();
  });
});

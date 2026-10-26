import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { childTreeItem, navigatorButton, openSpace, openTreeItemActions, treeItem } from './support/navigator';

test('SM-80 Документ в папке', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const folder = treeItem(page, 'TEST_SM80_Папка');

  await test.step('Предусловие (SM-79): создать свою папку TEST_SM80_Папка', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «Папка», ввести «TEST_SM80_Папка», нажать Enter
    await navigatorButton(page, 'Папка').click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM80_Папка');
    await page.keyboard.press('Enter');
    await expect(folder).toBeVisible();
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let createDialog: Locator;

  await test.step('Шаг 1. ⋮ у TEST_SM80_Папка → «Создать» → «Новый документ»', async () => {
    await openTreeItemActions(folder);
    await page.getByRole('menuitem', { name: 'Создать' }).hover();
    await page.getByRole('menu', { name: 'Создать' }).getByRole('menuitem', { name: 'Новый документ' }).click();
  });

  await test.step('Шаг 2. Ввести «TEST_SM80_Документ», нажать «Создать»', async () => {
    createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM80_Документ');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(createDialog).toBeHidden();

    // Папка раскрывается сама после создания документа внутри неё, поэтому отдельного шага «Раскрыть» нет

    // Ожидание: внутри папки есть «TEST_SM80_Документ»
    await expect(childTreeItem(folder, 'TEST_SM80_Документ')).toBeVisible();
  });
});

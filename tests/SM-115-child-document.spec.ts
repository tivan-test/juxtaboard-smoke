import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { childTreeItem, navigatorButton, openSpace, openTreeItemActions, treeItem } from './support/navigator';

test('SM-115 ⋮ → «Создать» → «Добавить дочерний документ»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.getByRole('textbox', { name: 'Текст документа' });
  const parent = treeItem(page, 'TEST_SM115_Родитель');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM115_Родитель', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM115_Родитель», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM115_Родитель');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(parent).toBeVisible();
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let childDialog;

  await test.step('Шаг 1. ⋮ у TEST_SM115_Родитель → «Создать» → «Добавить дочерний документ»', async () => {
    await openTreeItemActions(parent);
    await page.getByRole('menuitem', { name: 'Создать' }).hover();
    await page.getByRole('menu', { name: 'Создать' }).getByRole('menuitem', { name: 'Добавить дочерний документ' }).click();
  });

  await test.step('Шаг 2. Ввести «TEST_SM115_Дочерний», нажать «Создать»', async () => {
    childDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await childDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM115_Дочерний');
    await childDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(childDialog).toBeHidden();

    // Родитель раскрывается сам после создания дочернего документа, поэтому отдельного шага «Раскрыть» нет

    // Ожидание: «TEST_SM115_Дочерний» в дереве внутри TEST_SM115_Родитель
    await expect(childTreeItem(parent, 'TEST_SM115_Дочерний')).toBeVisible();
  });
});

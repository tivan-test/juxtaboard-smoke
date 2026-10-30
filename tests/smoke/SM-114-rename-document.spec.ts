import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, openTreeItemActions, treeItem } from '../support/navigator';

test('SM-114 ⋮ → «Редактировать»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.getByRole('textbox', { name: 'Текст документа' });
  const oldDoc = treeItem(page, 'TEST_SM114_Текст');
  const newDoc = treeItem(page, 'TEST_SM114_Новое');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM114_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM114_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM114_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(oldDoc).toBeVisible();
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let editDialog: Locator;

  await test.step('Шаг 1. ⋮ у TEST_SM114_Текст → «Редактировать»', async () => {
    await openTreeItemActions(oldDoc);
    await page.getByRole('menuitem', { name: 'Редактировать' }).click();
  });

  await test.step('Шаг 2. Ввести «TEST_SM114_Новое», нажать «Сохранить»', async () => {
    editDialog = page.getByRole('dialog', { name: 'Редактировать документ' });
    await editDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM114_Новое');
    await editDialog.getByRole('button', { name: 'Сохранить' }).click();

    // Ожидание 1: в дереве «TEST_SM114_Новое»
    await expect(newDoc).toBeVisible();
    // Ожидание 2: «TEST_SM114_Текст» в дереве нет
    await expect(oldDoc).toHaveCount(0);
  });
});

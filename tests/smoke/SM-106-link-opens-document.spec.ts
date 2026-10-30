import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, treeItem, treeRow } from '../support/navigator';

test('SM-106 Новая ссылка', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.getByRole('textbox', { name: 'Текст документа' });
  const textDoc = treeItem(page, 'TEST_SM106_Текст');
  const link = treeItem(page, 'TEST_SM106_Ссылка');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM106_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM106_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM106_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(textDoc).toBeVisible();
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let linkDialog: Locator, textId: string | null, linkId: string | null;

  await test.step('Шаг 1. Стрелка ▾ у «+ Документ» → «Новая ссылка», название «TEST_SM106_Ссылка», выбрать TEST_SM106_Текст, создать', async () => {
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая ссылка', exact: true }).click();
    linkDialog = page.getByRole('dialog', { name: 'Новая ссылка' });
    await linkDialog.getByRole('textbox', { name: 'Название ссылки' }).fill('TEST_SM106_Ссылка');
    await linkDialog.getByRole('textbox', { name: 'Фильтр по имени или #тегу…' }).fill('TEST_SM106_Текст');
    // Выбор цели в окне — то же дерево документов, что и в навигаторе
    await treeRow(linkDialog.getByRole('treeitem', { name: 'TEST_SM106_Текст', exact: true })).click();
    await linkDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(linkDialog).toBeHidden();
    await expect(link).toBeVisible();
  });

  await test.step('Шаг 2. Нажать «TEST_SM106_Ссылка» в дереве', async () => {
    // id документа — data-tree-id элемента дерева (контракт дерева в приложении)
    textId = await textDoc.getAttribute('data-tree-id');
    linkId = await link.getAttribute('data-tree-id');
    await treeRow(link).click();

    // Ожидание: открылся документ «TEST_SM106_Текст»
    // Названия документа на странице нет, поэтому смотрим на адрес: docId — это TEST_SM106_Текст, linkId — нажатая ссылка
    await expect(page).toHaveURL(new RegExp(`docId=${textId}&linkId=${linkId}$`));
    await expect(editor).toBeVisible();
  });
});

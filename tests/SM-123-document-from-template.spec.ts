import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { chooseViewMode, navigatorButton, openSpace, treeItem, treeRow } from './support/navigator';

test('SM-123 Шаблон и документ из шаблона', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.getByRole('textbox', { name: 'Текст документа' });
  const createDialog = page.getByRole('dialog', { name: 'Создать документ' });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let urlBefore;

  await test.step('Шаг 1. «Режимы отображения» → «Шаблоны» → «+ Шаблон», название «TEST_SM123_Шаблон», «Создать»', async () => {
    await openSpace(page, url);
    await chooseViewMode(page, 'Шаблоны');
    await navigatorButton(page, 'Шаблон').click();
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM123_Шаблон');
    await createDialog.getByRole('button', { name: 'Создать', exact: true }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
  });

  await test.step('Шаг 2. В шаблоне ввести «Текст из шаблона»', async () => {
    await editor.click();
    await page.keyboard.type('Текст из шаблона');
    // Текст сохраняется не сразу: перезагрузка гарантирует, что он сохранён до создания документа из шаблона
    await page.reload();
    await expect(editor).toContainText('Текст из шаблона', { timeout: 60_000 });
  });

  await test.step('Шаг 3. «Режимы отображения» → «Документы» → «+ Документ», название «TEST_SM123_Документ»', async () => {
    await chooseViewMode(page, 'Документы');
    await navigatorButton(page, 'Документ').click();
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM123_Документ');
  });

  await test.step('Шаг 4. «Использовать шаблон» → выбрать «TEST_SM123_Шаблон», нажать «Создать»', async () => {
    await createDialog.getByRole('button', { name: 'Использовать шаблон' }).click();
    // Шаблоны в окне — то же дерево документов, что и в навигаторе (в режиме «Шаблоны»)
    await treeRow(createDialog.getByRole('treeitem', { name: 'TEST_SM123_Шаблон', exact: true })).click();

    // Ожидание 1: справа от «Использовать шаблон» выбран «TEST_SM123_Шаблон»
    await expect(createDialog.getByRole('button', { name: 'Использовать шаблон TEST_SM123_Шаблон' })).toBeVisible();

    urlBefore = page.url();
    await createDialog.getByRole('button', { name: 'Создать', exact: true }).click();
    // Пока адрес не сменился, в редакторе ещё шаблон с тем же текстом
    await expect(page).not.toHaveURL(urlBefore);

    // Ожидание 2: в документе «TEST_SM123_Документ» текст «Текст из шаблона»
    await expect(treeItem(page, 'TEST_SM123_Документ')).toBeVisible();
    await expect(editor).toContainText('Текст из шаблона');
  });
});

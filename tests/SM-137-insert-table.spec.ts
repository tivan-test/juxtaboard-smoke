import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, treeItem } from './support/navigator';
import { documentEditor, editorToolbarButton } from './support/editor';

test('SM-137 «Вставить таблицу»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = documentEditor(page);
  const insertTableButton = editorToolbarButton(page, 'Вставить таблицу');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM137_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM137_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM137_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
  });

  await test.step('Шаг 1. Открыть TEST_SM137_Текст, поставить курсор в новую строку', async () => {
    await treeItem(page, 'TEST_SM137_Текст').click();
    await expect(editor).toBeVisible();
    await editor.click();
  });

  await test.step('Шаг 2. Нажать «Вставить таблицу»', async () => {
    await insertTableButton.click();

    // Ожидание: в документе появилась таблица
    await expect(editor.getByRole('table')).toBeVisible();
  });
});

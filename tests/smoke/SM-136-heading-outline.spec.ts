import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, treeItem } from '../support/navigator';
import { documentEditor, editorToolbarButton } from '../support/editor';

test('SM-136 «Стиль абзаца» и «Структура документа»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = documentEditor(page);
  const outlineButton = editorToolbarButton(page, 'Структура документа');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM136_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM136_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM136_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
  });

  await test.step('Шаг 1. Открыть TEST_SM136_Текст, поставить курсор в новую строку', async () => {
    await treeItem(page, 'TEST_SM136_Текст').click();
    await expect(editor).toBeVisible();
    await editor.click();
  });

  await test.step('Шаг 2. «Стиль абзаца» → «Заголовок 1», ввести «TEST заголовок»', async () => {
    await page.getByRole('button', { name: 'Стиль абзаца' }).click();
    await page.getByRole('menuitem', { name: 'Заголовок 1', exact: true }).click();
    await page.keyboard.type('TEST заголовок');
    await expect(editor.getByRole('heading', { level: 1 })).toHaveText('TEST заголовок');
  });

  await test.step('Шаг 3. Нажать «Структура документа»', async () => {
    await outlineButton.click();

    // Ожидание: в структуре есть «TEST заголовок»
    await expect(page.getByRole('dialog').getByText('TEST заголовок')).toBeVisible();
  });
});

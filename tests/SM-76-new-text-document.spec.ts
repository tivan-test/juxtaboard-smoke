import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, treeItem } from './support/navigator';
import { documentEditor } from './support/editor';

test('SM-76 Новый документ с текстом', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = documentEditor(page);

  // Объявлено до шагов, потому что используется в нескольких шагах
  let createDialog;

  await test.step('Шаг 1. Открыть навигатор пространства прогона', async () => {
    await openSpace(page, url);
  });

  await test.step('Шаг 2. Нажать «+ Документ», ввести название «TEST_SM76_Текст», нажать «Создать»', async () => {
    await navigatorButton(page, 'Документ').click();
    createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM76_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();

    // Ожидание 1: открылся редактор, «TEST_SM76_Текст» есть в дереве
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(treeItem(page, 'TEST_SM76_Текст')).toBeVisible();
  });

  await test.step('Шаг 3. В редакторе ввести «Проверка смоук текста 123»', async () => {
    await editor.click();
    await page.keyboard.type('Проверка смоук текста 123');
  });

  await test.step('Шаг 4. Перезагрузить страницу', async () => {
    await page.reload();

    // Ожидание 2: в документе «Проверка смоук текста 123»
    await expect(editor).toContainText('Проверка смоук текста 123', { timeout: 60_000 });
  });
});

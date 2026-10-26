import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, treeItem } from './support/navigator';
import { documentEditor, editorToolbarButton } from './support/editor';

test('SM-132 «Версии»: сохранить и откатить', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = documentEditor(page);
  const versionsButton = editorToolbarButton(page, 'Версии');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM132_Текст с текстом «строка один»', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM132_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM132_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    // Шаг 3. В редакторе ввести «строка один»
    await editor.click();
    await page.keyboard.type('строка один');
    await expect(editor).toContainText('строка один');
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let versionsDialog: Locator;

  await test.step('Шаг 1. Открыть TEST_SM132_Текст → «Версии» → «Сохранить версию»', async () => {
    await treeItem(page, 'TEST_SM132_Текст').click();
    await expect(editor).toContainText('строка один');
    await versionsButton.click();
    versionsDialog = page.getByRole('dialog');
    await versionsDialog.getByRole('button', { name: 'Сохранить версию' }).click();

    // Ожидание 1: в списке версия «v1»
    await expect(versionsDialog.getByText('v1')).toBeVisible();
  });

  await test.step('Шаг 2. Дописать новую строку «строка два»', async () => {
    await page.keyboard.press('Escape');
    await expect(versionsDialog).toBeHidden();
    await editor.click();
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('строка два');
    await expect(editor).toContainText('строка два');
  });

  await test.step('Шаг 3. «Версии» → у v1 «Откатить» → «Да»', async () => {
    await versionsButton.click();
    await page.getByRole('button', { name: 'Откатиться к версии 1' }).click();
    await page.getByRole('button', { name: 'Да', exact: true }).click();

    // Ожидание 2: в документе «строка один», «строки два» нет
    await expect(editor).toContainText('строка один');
    await expect(editor).not.toContainText('строка два');
  });
});

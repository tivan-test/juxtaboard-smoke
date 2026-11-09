// Источник: Ввод ручных tests, строка c2ce6514-df9f-4a72-96aa-244cef8cbf95
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace } from '../support/navigator';
import { documentEditor, editorToolbarButton } from '../support/editor';

test('RG-02 Курсив в редакторе документа', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = documentEditor(page);

  await test.step('Предусловие (SM-76): открыть пространство прогона', async () => {
    await openSpace(page, url);
  });

  await test.step('Шаг 1. Создать документ', async () => {
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_RG02_Курсив');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
  });

  await test.step('Шаг 2. Ввести текст «Проверка курсива»', async () => {
    await editor.click();
    await page.keyboard.type('Проверка курсива');
    await expect(editor).toContainText('Проверка курсива');
  });

  await test.step('Шаг 3. Выделить этот текст', async () => {
    await page.keyboard.press('ControlOrMeta+a');
  });

  await test.step('Шаг 4. Нажать кнопку «Курсив» на панели редактора', async () => {
    await editorToolbarButton(page, 'Курсив').click();

    // Ожидание 1: выделенный текст отображается курсивом (<em>, роль emphasis)
    await expect(editor.getByRole('emphasis')).toHaveText('Проверка курсива');
  });
});

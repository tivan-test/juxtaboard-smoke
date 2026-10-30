import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, treeItem } from '../support/navigator';
import { documentEditor, editorToolbarButton } from '../support/editor';

test('SM-134 «Найти / Заменить»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = documentEditor(page);
  // Кнопка «Найти / Заменить»: в её названии (= подсказке) указаны сочетания клавиш
  const searchButton = editorToolbarButton(page, 'Найти (Ctrl+F) / Заменить (Ctrl+H)');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM134_Текст с текстом «строка один»', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM134_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM134_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    // Шаг 3. В редакторе ввести «строка один»
    await editor.click();
    await page.keyboard.type('строка один');
    await expect(editor).toContainText('строка один');
  });

  await test.step('Шаг 1. Открыть TEST_SM134_Текст → «Найти / Заменить»', async () => {
    await treeItem(page, 'TEST_SM134_Текст').click();
    await expect(editor).toContainText('строка один');
    await searchButton.click();
  });

  await test.step('Шаг 2. Ввести «один»', async () => {
    await page.getByRole('textbox', { name: 'Найти…' }).fill('один');

    // Ожидание 1: видно «1 / 1»
    await expect(page.getByText('1 / 1')).toBeVisible();
  });

  await test.step('Шаг 3. Вкладка «Заменить», ввести «1», нажать «Заменить»', async () => {
    await page.getByRole('button', { name: 'Заменить', exact: true }).click();
    await page.getByRole('textbox', { name: 'Заменить на…' }).fill('1');
    await page.getByRole('button', { name: 'Заменить текущее' }).click();

    // Ожидание 2: в документе «строка 1»
    await expect(editor).toContainText('строка 1');
  });

  await test.step('Шаг 4. Закрыть поиск, нажать «Отменить» (↶) на панели редактора', async () => {
    await page.getByRole('button', { name: 'Закрыть (Esc)' }).click();
    await editorToolbarButton(page, 'Отменить').click();

    // Ожидание 3: в документе «строка один»
    await expect(editor).toContainText('строка один');
  });
});

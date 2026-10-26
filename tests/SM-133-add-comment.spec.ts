import { test, expect, type Response } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, treeItem } from './support/navigator';
import { documentEditor, editorToolbarButton } from './support/editor';

test('SM-133 «Добавить комментарий»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = documentEditor(page);

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM133_Текст с текстом', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM133_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM133_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    // Шаг 3. В редакторе ввести «Проверка смоук текста 123»
    await editor.click();
    await page.keyboard.type('Проверка смоук текста 123');
    await expect(editor).toContainText('Проверка смоук текста 123');
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let saved: Promise<Response>;

  await test.step('Шаг 1. Открыть TEST_SM133_Текст, выделить слово «Проверка»', async () => {
    await treeItem(page, 'TEST_SM133_Текст').click();
    await expect(editor).toContainText('Проверка смоук текста 123');
    await editor.evaluate((el) => {
      const text = el.querySelector('p')!.firstChild!;
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, 'Проверка'.length);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
    });
  });

  await test.step('Шаг 2. Во всплывающей панели нажать «Добавить комментарий»', async () => {
    await page.getByRole('button', { name: 'Добавить комментарий' }).click();
  });

  await test.step('Шаг 3. Ввести «TEST комментарий», нажать «Добавить»', async () => {
    await page.getByPlaceholder(/Ответить команде/).fill('TEST комментарий');
    saved = page.waitForResponse((r) => r.request().method() === 'POST' && /\/documents\/\d+\/comments/.test(r.url()));
    await page.getByRole('button', { name: 'Добавить', exact: true }).click();
    expect((await saved).ok()).toBe(true);
  });

  await test.step('Шаг 4. Перезагрузить страницу, нажать «Комментарии»', async () => {
    await page.reload();
    await expect(editor).toBeVisible({ timeout: 60_000 });
    await editorToolbarButton(page, 'Комментарии').click();

    // Ожидание: виден комментарий «TEST комментарий»
    await expect(page.getByText('TEST комментарий')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-133 «Добавить комментарий»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM133_Текст с текстом', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM133_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM133_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    // Шаг 3. В редакторе ввести «Проверка смоук текста 123»
    await editor.click();
    await page.keyboard.type('Проверка смоук текста 123');
    await expect(editor).toContainText('Проверка смоук текста 123');
  });

  // Шаг 1. Открыть TEST_SM133_Текст, выделить слово «Проверка» (первые 8 букв первого абзаца)
  await page.locator('[data-document-id]').filter({ hasText: 'TEST_SM133_Текст' }).click();
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

  // Шаг 2. Во всплывающей панели нажать «Добавить комментарий»
  await page.getByRole('button', { name: 'Добавить комментарий' }).click();

  // Шаг 3. Ввести «TEST комментарий», нажать «Добавить» (ждём ответ сервера о сохранении)
  await page.getByPlaceholder(/Ответить команде/).fill('TEST комментарий');
  const saved = page.waitForResponse((r) => r.request().method() === 'POST' && /\/documents\/\d+\/comments/.test(r.url()));
  await page.getByRole('button', { name: 'Добавить', exact: true }).click();
  expect((await saved).ok()).toBe(true);

  // Шаг 4. Перезагрузить страницу, нажать «Комментарии»
  await page.reload();
  await expect(editor).toBeVisible({ timeout: 60_000 });
  // У кнопки «Комментарии» нет названия (подсказка видна только при наведении), находим по иконке.
  // TODO для разработчиков: добавить кнопке «Комментарии» aria-label
  await page.getByRole('main').getByRole('button').filter({ has: page.locator('svg.lucide-message-circle') }).click();

  // Ожидание: виден комментарий «TEST комментарий»
  await expect(page.getByText('TEST комментарий')).toBeVisible();
});

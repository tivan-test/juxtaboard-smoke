import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-77 Жирный шрифт', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.locator('[contenteditable="true"]');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM77_Текст с текстом', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM77_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM77_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    // Шаг 3. В редакторе ввести «Проверка смоук текста 123»
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await editor.click();
    await page.keyboard.type('Проверка смоук текста 123');
  });

  // Шаг 1. Открыть TEST_SM77_Текст
  await page.locator('[data-document-id]').filter({ hasText: 'TEST_SM77_Текст' }).click();
  await expect(editor).toContainText('Проверка смоук текста 123');

  // Шаг 2. Выделить слово «Проверка» (первые 8 букв первого абзаца)
  await editor.evaluate((el) => {
    const text = el.querySelector('p')!.firstChild!;
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 'Проверка'.length);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  });

  // Шаг 3. Нажать Ctrl+B (на Mac — Cmd+B)
  await page.keyboard.press('ControlOrMeta+b');

  // Ожидание: слово «Проверка» жирное
  await expect(editor.locator('strong', { hasText: 'Проверка' })).toHaveText('Проверка');
});

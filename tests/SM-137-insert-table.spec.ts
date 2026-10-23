import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-137 «Вставить таблицу»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  // У кнопки «Вставить таблицу» нет названия (подсказка видна только при наведении), находим по иконке.
  // TODO для разработчиков: добавить кнопке «Вставить таблицу» aria-label
  const insertTableButton = page.getByRole('main').getByRole('button').filter({ has: page.locator('svg.lucide-table') });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM137_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM137_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM137_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
  });

  // Шаг 1. Открыть TEST_SM137_Текст, поставить курсор в новую строку (документ пустой — просто клик в редактор)
  await page.locator('[data-document-id]').filter({ hasText: 'TEST_SM137_Текст' }).click();
  await expect(editor).toBeVisible();
  await editor.click();

  // Шаг 2. Нажать «Вставить таблицу»
  await insertTableButton.click();

  // Ожидание: в документе появилась таблица
  await expect(editor.getByRole('table')).toBeVisible();
});

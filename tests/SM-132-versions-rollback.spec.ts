import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-132 «Версии»: сохранить и откатить', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  // У кнопок панели инструментов редактора нет названий (подсказка видна только при наведении), находим по иконке.
  // TODO для разработчиков: добавить кнопке «Версии» aria-label
  const versionsButton = page.getByRole('main').getByRole('button').filter({ has: page.locator('svg.lucide-history') });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM132_Текст с текстом «строка один»', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM132_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM132_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    // Шаг 3. В редакторе ввести «строка один»
    await editor.click();
    await page.keyboard.type('строка один');
    await expect(editor).toContainText('строка один');
  });

  // Шаг 1. Открыть TEST_SM132_Текст → «Версии» → «Сохранить версию»
  await page.locator('[data-document-id]').filter({ hasText: 'TEST_SM132_Текст' }).click();
  await expect(editor).toContainText('строка один');
  await versionsButton.click();
  const versionsDialog = page.getByRole('dialog');
  await versionsDialog.getByRole('button', { name: 'Сохранить версию' }).click();

  // Ожидание 1: в списке версия «v1»
  await expect(versionsDialog.getByText('v1')).toBeVisible();

  // Шаг 2. Дописать новую строку «строка два» (сначала закрываем окно версий)
  await page.keyboard.press('Escape');
  await expect(versionsDialog).toBeHidden();
  await editor.click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('строка два');
  await expect(editor).toContainText('строка два');

  // Шаг 3. «Версии» → у v1 «Откатить» (кнопка называется «Откатиться к версии 1») → «Да»
  await versionsButton.click();
  await page.getByRole('button', { name: 'Откатиться к версии 1' }).click();
  await page.getByRole('button', { name: 'Да', exact: true }).click();

  // Ожидание 2: в документе «строка один», «строки два» нет
  await expect(editor).toContainText('строка один');
  await expect(editor).not.toContainText('строка два');
});

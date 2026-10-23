import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-135 «Экспорт / Импорт», без скачивания', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  // У кнопки «Экспорт / Импорт» нет названия (подсказка видна только при наведении), находим по иконке.
  // TODO для разработчиков: добавить кнопке «Экспорт / Импорт» aria-label
  const exportButton = page.getByRole('main').getByRole('button').filter({ has: page.locator('svg.lucide-arrow-up-down') });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM135_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM135_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM135_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
  });

  // Шаг 1. Открыть TEST_SM135_Текст → «Экспорт / Импорт» (только открыть меню, ничего не скачиваем)
  await page.locator('[data-document-id]').filter({ hasText: 'TEST_SM135_Текст' }).click();
  await expect(editor).toBeVisible();
  await exportButton.click();

  // Ожидание: видны «Скачать как HTML», «Скачать как Markdown», «Скачать как DOCX», «Скачать как PDF», «Импорт содержимого»
  for (const item of ['Скачать как HTML', 'Скачать как Markdown', 'Скачать как DOCX', 'Скачать как PDF', 'Импорт содержимого']) {
    await expect(page.getByRole('menuitem', { name: item, exact: true })).toBeVisible();
  }

  // Шаг 2. Нажать Esc
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
});

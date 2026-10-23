import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-134 «Найти / Заменить»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  // У кнопки «Найти / Заменить» нет названия (подсказка видна только при наведении), находим по иконке.
  // TODO для разработчиков: добавить кнопке «Найти / Заменить» aria-label
  const searchButton = page.getByRole('main').getByRole('button').filter({ has: page.locator('svg.lucide-search') });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM134_Текст с текстом «строка один»', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM134_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM134_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    // Шаг 3. В редакторе ввести «строка один»
    await editor.click();
    await page.keyboard.type('строка один');
    await expect(editor).toContainText('строка один');
  });

  // Шаг 1. Открыть TEST_SM134_Текст → «Найти / Заменить»
  await page.locator('[data-document-id]').filter({ hasText: 'TEST_SM134_Текст' }).click();
  await expect(editor).toContainText('строка один');
  await searchButton.click();

  // Шаг 2. Ввести «один»
  await page.getByRole('textbox', { name: 'Найти…' }).fill('один');

  // Ожидание 1: видно «1 / 1»
  await expect(page.getByText('1 / 1')).toBeVisible();

  // Шаг 3. Вкладка «Заменить», ввести «1», нажать «Заменить» (кнопка называется «Заменить текущее»)
  await page.getByRole('button', { name: 'Заменить', exact: true }).click();
  await page.getByRole('textbox', { name: 'Заменить на…' }).fill('1');
  await page.getByRole('button', { name: 'Заменить текущее' }).click();

  // Ожидание 2: в документе «строка 1»
  await expect(editor).toContainText('строка 1');

  // Шаг 4. Закрыть поиск, нажать «Отменить» (↶) на панели редактора
  // У кнопки «Отменить» нет названия (только подсказка), находим её по иконке.
  // TODO для разработчиков: добавить кнопке aria-label «Отменить»
  await page.getByRole('button', { name: 'Закрыть (Esc)' }).click();
  await page.getByRole('main').getByRole('button').filter({ has: page.locator('svg.lucide-undo') }).click();

  // Ожидание 3: в документе «строка один»
  await expect(editor).toContainText('строка один');
});

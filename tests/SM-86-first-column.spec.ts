import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { columnHeader, dataGrid, setUpDataTable } from './support/data-table';

test('SM-86 Первый столбец', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await test.step('Предусловие (SM-85): создать свою таблицу TEST_SM86_Таблица', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM86_Таблица' });
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let fieldDialog: Locator;

  await test.step('Шаг 1. Открыть TEST_SM86_Таблица', async () => {
    await treeItem(page, 'TEST_SM86_Таблица').click();
  });

  await test.step('Шаг 2. Нажать «Добавить первый столбец»', async () => {
    await page.getByRole('main').getByRole('button', { name: 'Добавить первый столбец' }).click();
  });

  await test.step('Шаг 3. Ввести название поля «Название», тип «Текст», нажать «Создать поле»', async () => {
    fieldDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
    await fieldDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Название');
    await fieldDialog.getByRole('button', { name: /^Текст Одна строка/ }).click();
    await fieldDialog.getByRole('button', { name: 'Создать поле' }).click();

    // Ожидание: в таблице есть столбец «Название»
    await expect(columnHeader(dataGrid(page), 'Название')).toBeVisible();
  });
});

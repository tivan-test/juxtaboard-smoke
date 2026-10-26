import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { columnHeader, dataGrid, setUpDataTable } from './support/data-table';

test('SM-86 Первый столбец', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await test.step('Предусловие (SM-85): создать свою таблицу TEST_SM86_Таблица', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM86_Таблица' });
  });

  // Шаг 1. Открыть TEST_SM86_Таблица
  await treeItem(page, 'TEST_SM86_Таблица').click();

  // Шаг 2. Нажать «Добавить первый столбец»
  await page.getByRole('main').getByRole('button', { name: 'Добавить первый столбец' }).click();

  // Шаг 3. Ввести название поля «Название», тип «Текст», нажать «Создать поле»
  const fieldDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
  await fieldDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Название');
  await fieldDialog.getByRole('button', { name: /^Текст Одна строка/ }).click();
  await fieldDialog.getByRole('button', { name: 'Создать поле' }).click();

  // Ожидание: в таблице есть столбец «Название»
  await expect(columnHeader(dataGrid(page), 'Название')).toBeVisible();
});

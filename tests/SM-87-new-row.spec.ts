import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { addRow, dataGrid, gridCell, gridRow, setUpDataTable, typeIntoCell } from './support/data-table';

test('SM-87 Новая строка', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  const grid = dataGrid(page);

  await test.step('Предусловие (SM-85, SM-86): создать свою таблицу TEST_SM87_Таблица со столбцом «Название»', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM87_Таблица', withTitleColumn: true });
  });

  // Шаг 1. Открыть TEST_SM87_Таблица
  await treeItem(page, 'TEST_SM87_Таблица').click();

  // Шаг 2. Нажать «Добавить строку», ввести в «Название» «Строка смоук», нажать Enter
  const row = await addRow(page);
  // Двойной клик по ячейке открывает ввод, фокус сразу в нём
  const cell = await gridCell(grid, row, 'Название');
  await cell.dblclick();
  await page.keyboard.type('Строка смоук');
  await page.keyboard.press('Enter');
  // Ждём, пока значение появится в ячейке (запись сохранена), и только потом перезагружаем
  await expect(cell).toContainText('Строка смоук');

  // Шаг 3. Перезагрузить страницу
  await page.reload();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });

  // Ожидание 1: в строке «Строка смоук»
  await expect(gridRow(grid, 'Строка смоук')).toBeVisible();

  // Ожидание 2: размер таблицы «1×1»
  await expect(main.getByText('1×1')).toBeVisible();
});

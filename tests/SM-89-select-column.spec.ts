import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { addColumn, dataGrid, gridCell, gridRow, openColumnActions, setUpDataTable } from './support/data-table';

test('SM-89 Столбец «Выбор»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const grid = dataGrid(page);

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM89_Таблица со строкой «Строка выбор»', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM89_Таблица', rows: ['Строка выбор'] });
  });

  // Шаг 1. Открыть TEST_SM89_Таблица
  await treeItem(page, 'TEST_SM89_Таблица').click();

  // Шаг 2. Нажать «+» в шапке, название «Статус», тип «Выбор», нажать «Создать поле»
  await addColumn(page, 'Статус', /^Выбор Выбор одного/);

  // Шаг 3. ⋮ у столбца «Статус» → «Настройки поля» (окно со списком вариантов)
  await openColumnActions(grid, 'Статус');
  await page.getByRole('menuitem', { name: 'Настройки поля', exact: true }).click();

  // Шаг 4. Добавить варианты «Новый» и «Готово», нажать «Сохранить»
  const optionsDialog = page.getByRole('dialog', { name: 'Настройки поля(список)' });
  await optionsDialog.getByRole('textbox', { name: 'Новый вариант…' }).fill('Новый');
  await optionsDialog.getByRole('button', { name: 'Добавить', exact: true }).click();
  await optionsDialog.getByRole('textbox', { name: 'Новый вариант…' }).fill('Готово');
  await optionsDialog.getByRole('button', { name: 'Добавить', exact: true }).click();
  await optionsDialog.getByRole('button', { name: 'Сохранить' }).click();
  await expect(optionsDialog).toBeHidden();

  // Шаг 5. Открыть ячейку «Статус» в строке и выбрать «Новый»
  // Двойной клик по ячейке открывает список вариантов
  const statusCell = await gridCell(grid, gridRow(grid, 'Строка выбор'), 'Статус');
  await statusCell.dblclick();
  await page.getByRole('button', { name: 'Новый', exact: true }).click();

  // Ожидание: в ячейке «Новый»
  await expect(statusCell).toContainText('Новый');
});

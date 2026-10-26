import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { addColumn, dataGrid, gridCell, gridRow, openColumnActions, setUpDataTable } from './support/data-table';

test('SM-90 Вид «Канбан»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  const grid = dataGrid(page);

  await test.step('Предусловие (SM-85, SM-86, SM-87, SM-89): создать свою таблицу TEST_SM90_Таблица: строка «Строка канбан», столбец «Статус» со значением «Новый»', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM90_Таблица', rows: ['Строка канбан'] });
    // Нажать «+» в шапке, название «Статус», тип «Выбор», нажать «Создать поле»
    await addColumn(page, 'Статус', /^Выбор Выбор одного/);
    // ⋮ у столбца «Статус» → «Настройки поля» (окно со списком вариантов)
    await openColumnActions(grid, 'Статус');
    await page.getByRole('menuitem', { name: 'Настройки поля', exact: true }).click();
    // Добавить варианты «Новый» и «Готово», нажать «Сохранить»
    const optionsDialog = page.getByRole('dialog', { name: 'Настройки поля(список)' });
    await optionsDialog.getByRole('textbox', { name: 'Новый вариант…' }).fill('Новый');
    await optionsDialog.getByRole('button', { name: 'Добавить', exact: true }).click();
    await optionsDialog.getByRole('textbox', { name: 'Новый вариант…' }).fill('Готово');
    await optionsDialog.getByRole('button', { name: 'Добавить', exact: true }).click();
    await optionsDialog.getByRole('button', { name: 'Сохранить' }).click();
    await expect(optionsDialog).toBeHidden();
    // Открыть ячейку «Статус» в строке (двойной клик открывает список вариантов) и выбрать «Новый»
    const statusCell = await gridCell(grid, gridRow(grid, 'Строка канбан'), 'Статус');
    await statusCell.dblclick();
    await page.getByRole('button', { name: 'Новый', exact: true }).click();
    await expect(statusCell).toContainText('Новый');
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let newLane, uncategorizedLane;

  await test.step('Шаг 1. Открыть TEST_SM90_Таблица', async () => {
    await treeItem(page, 'TEST_SM90_Таблица').click();
  });

  await test.step('Шаг 2. Вид «По умолчанию» → «Канбан»', async () => {
    await main.getByRole('button', { name: 'По умолчанию' }).click();
    await page.getByRole('button', { name: 'Канбан', exact: true }).click();
  });

  await test.step('Шаг 3. «Группировать по» → «Статус»', async () => {
    await main.getByRole('button', { name: /^Группировать по/ }).click();
    await page.getByRole('menuitem', { name: 'Статус', exact: true }).click();

    // Ожидание 1: видны колонки «Новый», «Готово», «Без категории»
    // Колонка канбана — группа (group), названная по значению
    newLane = main.getByRole('group', { name: 'Новый', exact: true });
    uncategorizedLane = main.getByRole('group', { name: 'Без категории', exact: true });
    await expect(newLane).toBeVisible();
    await expect(main.getByRole('group', { name: 'Готово', exact: true })).toBeVisible();
    await expect(uncategorizedLane).toBeVisible();

    // Ожидание 2: карточка «Строка канбан» в колонке «Новый»
    await expect(newLane.getByRole('button', { name: 'Строка канбан' })).toBeVisible();
    await expect(uncategorizedLane.getByRole('button', { name: 'Строка канбан' })).toHaveCount(0);
  });
});

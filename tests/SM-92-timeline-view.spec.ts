import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { addColumn, dataGrid, gridCell, gridRow, setUpDataTable } from './support/data-table';

test('SM-92 Вид «Таймлайн»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  const grid = dataGrid(page);

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayCell = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

  await test.step('Предусловие (SM-85, SM-86, SM-87, SM-91): создать свою таблицу TEST_SM92_Таблица: строка «Строка таймлайн» с сегодняшней датой', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM92_Таблица', rows: ['Строка таймлайн'] });
    // Нажать «+» в шапке, название «Дата», тип «Дата», нажать «Создать поле»
    await addColumn(page, 'Дата', /^Дата Календарная/);
    // В ячейку «Дата» ввести сегодняшнюю дату (двойной клик открывает поле даты)
    const dateCell = await gridCell(grid, gridRow(grid, 'Строка таймлайн'), 'Дата');
    await dateCell.dblclick();
    // eslint-disable-next-line playwright/no-raw-locators -- у поля даты в ячейке нет названия (пробел в приложении), находим по типу input внутри ячейки
    await dateCell.locator('input[type="date"]').fill(todayIso);
    await page.keyboard.press('Enter');
    await expect(dateCell).toContainText(todayCell);
  });

  // Шаг 1. Открыть TEST_SM92_Таблица
  await treeItem(page, 'TEST_SM92_Таблица').click();

  // Шаг 2. Вид «По умолчанию» → «Таймлайн»
  await main.getByRole('button', { name: 'По умолчанию' }).click();
  await page.getByRole('button', { name: 'Таймлайн', exact: true }).click();

  // Ожидание: в списке слева видна «Строка таймлайн»
  // Строка есть и в списке слева, и в виде полоски на шкале; список слева идёт первым в документе
  // eslint-disable-next-line playwright/no-nth-methods -- у списка слева в таймлайне нет роли и названия (пробел в приложении)
  await expect(main.getByRole('button', { name: /^Строка таймлайн/ }).first()).toBeVisible();
});

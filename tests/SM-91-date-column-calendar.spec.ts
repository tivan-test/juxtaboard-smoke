import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { addColumn, dataGrid, gridCell, gridRow, setUpDataTable } from './support/data-table';

test('SM-91 Столбец «Дата» и вид «Календарь»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  const grid = dataGrid(page);

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayCell = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
  // Клетка дня в календаре названа полной датой: «26 октября 2026 г.»
  const todayLabel = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM91_Таблица со строкой «Строка календарь»', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM91_Таблица', rows: ['Строка календарь'] });
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let dateCell, dayCell, card;

  await test.step('Шаг 1. Открыть TEST_SM91_Таблица', async () => {
    await treeItem(page, 'TEST_SM91_Таблица').click();
  });

  await test.step('Шаг 2. Нажать «+» в шапке, название «Дата», тип «Дата», нажать «Создать поле»', async () => {
    await addColumn(page, 'Дата', /^Дата Календарная/);
  });

  await test.step('Шаг 3. В ячейку «Дата» ввести сегодняшнюю дату', async () => {
    // Двойной клик по ячейке открывает поле даты
    dateCell = await gridCell(grid, gridRow(grid, 'Строка календарь'), 'Дата');
    await dateCell.dblclick();
    // eslint-disable-next-line playwright/no-raw-locators -- у поля даты в ячейке нет названия (пробел в приложении), находим по типу input внутри ячейки
    await dateCell.locator('input[type="date"]').fill(todayIso);
    await page.keyboard.press('Enter');
    await expect(dateCell).toContainText(todayCell);
  });

  await test.step('Шаг 4. Вид «По умолчанию» → «Календарь»', async () => {
    await main.getByRole('button', { name: 'По умолчанию' }).click();
    await page.getByRole('button', { name: 'Календарь', exact: true }).click();

    // Ожидание: «Строка календарь» видна в клетке сегодняшнего дня
    dayCell = main.getByRole('group', { name: todayLabel, exact: true });
    card = main.getByRole('button', { name: 'Строка календарь' });
    // Карточка нарисована поверх недели, не внутри клетки, поэтому сравниваем положение на экране
    await expect.poll(async () => {
      const c = await card.boundingBox();
      const d = await dayCell.boundingBox();
      return c !== null && d !== null
        && c.x >= d.x - 1 && c.x + c.width <= d.x + d.width + 1
        && c.y >= d.y && c.y + c.height <= d.y + d.height + 1;
    }).toBe(true);
  });
});

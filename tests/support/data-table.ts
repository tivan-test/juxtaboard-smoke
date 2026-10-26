import { expect, type Locator, type Page } from '@playwright/test';
import { openSpace, treeItem } from './navigator';

// Таблица данных — ARIA-сетка (grid): строки role=row с data-row-id, ячейки
// role=gridcell, шапка role=columnheader. У ячейки и у заголовка её столбца
// один и тот же data-column-id: по названию столбца берём id, по id — ячейку.

/** Сетка открытой таблицы данных */
export function dataGrid(page: Page) {
  return page.getByRole('main').getByRole('grid');
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Заголовок столбца по названию. В имя заголовка входят и его кнопки
 * (⋮ «Действия»), поэтому сравниваем начало имени, а не всё имя.
 */
export function columnHeader(grid: Locator, column: string) {
  return grid.getByRole('columnheader', { name: new RegExp(`^${escapeRegExp(column)}(\\s|$)`) });
}

/** Открыть ⋮ «Действия» в заголовке столбца (кнопка видна при наведении на заголовок) */
export async function openColumnActions(grid: Locator, column: string) {
  const header = columnHeader(grid, column);
  await header.hover();
  await header.getByRole('button', { name: 'Действия', exact: true }).click();
}

/** Строка данных, в которой есть текст */
export function gridRow(grid: Locator, text: string) {
  return grid.getByRole('row', { name: new RegExp(escapeRegExp(text)) });
}

/**
 * Ячейка строки в столбце с названием column. Строка закрепляется по её
 * data-row-id: ячейка остаётся той же, даже когда правка меняет текст, по
 * которому строку нашли.
 */
export async function gridCell(grid: Locator, row: Locator, column: string) {
  const columnId = await columnHeader(grid, column).getAttribute('data-column-id');
  expect(columnId, `у заголовка «${column}» есть data-column-id`).toBeTruthy();
  const rowId = await row.getAttribute('data-row-id');
  expect(rowId, 'у строки есть data-row-id').toBeTruthy();
  // Ячейка и заголовок связаны только data-column-id, строка — data-row-id (контракт сетки в приложении)
  return grid.locator(`[role="row"][data-row-id="${rowId}"] [data-column-id="${columnId}"]`);
}

/** id строк данных (строки шапки id не имеют) */
async function rowIds(grid: Locator) {
  // eslint-disable-next-line playwright/no-raw-locators -- строки данных отличает только data-row-id (контракт сетки в приложении)
  return grid.locator('[role="row"][data-row-id]').evaluateAll((rows) => rows.map((r) => r.getAttribute('data-row-id')!));
}

/**
 * «Добавить строку» и вернуть именно новую строку: ту, чьего id не было до нажатия.
 * Порядок строк и пустые ячейки ни о чём не говорят, а id — да.
 */
export async function addRow(page: Page) {
  const grid = dataGrid(page);
  const before = await rowIds(grid);
  await page.getByRole('main').getByRole('button', { name: 'Добавить строку' }).click();
  let added: string | undefined;
  await expect.poll(async () => (added = (await rowIds(grid)).find((id) => !before.includes(id)))).toBeTruthy();
  // Новая строка — по её data-row-id, см. rowIds
  return grid.locator(`[role="row"][data-row-id="${added}"]`);
}

/**
 * Ввести текст в ячейку: двойной клик открывает ввод (фокус сразу в нём), Enter сохраняет.
 * Ячейка показывает значение сразу, а пишется оно запросом PATCH /table-rows/<id>;
 * ждём ответа, иначе перезагрузка или журнал успевают раньше записи.
 */
export async function typeIntoCell(page: Page, cell: Locator, text: string) {
  await cell.dblclick();
  await page.keyboard.type(text);
  const saved = page.waitForResponse((r) => r.request().method() === 'PATCH' && /\/table-rows\//.test(r.url()));
  await page.keyboard.press('Enter');
  expect((await saved).ok(), 'значение ячейки сохранено').toBe(true);
  await expect(cell).toContainText(text);
}

/** «Добавить строку» и ввести text в её столбец column */
export async function addRowWithText(page: Page, column: string, text: string) {
  const row = await addRow(page);
  await typeIntoCell(page, await gridCell(dataGrid(page), row, column), text);
  return row;
}

/**
 * Добавить столбец: «Добавить первый столбец» в пустой таблице, иначе «+» в шапке.
 * type — начало имени кнопки типа в окне, например /^Текст Одна строка/.
 */
export async function addColumn(page: Page, name: string, type: RegExp, { first = false } = {}) {
  const main = page.getByRole('main');
  await main.getByRole('button', { name: first ? 'Добавить первый столбец' : 'Добавить столбец' }).click();
  const dialog = page.getByRole('dialog', { name: 'Добавить колонку' });
  await dialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill(name);
  await dialog.getByRole('button', { name: type }).click();
  await dialog.getByRole('button', { name: 'Создать поле' }).click();
  await expect(columnHeader(dataGrid(page), name)).toBeVisible();
}

/** Стрелка ▾ у «+ Документ» → «Новая таблица данных», ввести название, «Создать» */
export async function createDataTable(page: Page, name: string) {
  // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
  await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
  await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
  await dialog.getByRole('textbox', { name: 'Название таблицы' }).fill(name);
  await dialog.getByRole('button', { name: 'Создать' }).click();
  await expect(treeItem(page, name)).toBeVisible();
}

/**
 * Общее предусловие табличных проверок (SM-85, SM-86, SM-87): в пространстве
 * прогона создать свою таблицу и открыть её; со столбцом «Название» (тип «Текст»)
 * — если withTitleColumn или есть rows; затем по строке на каждое значение rows.
 */
export async function setUpDataTable(
  page: Page,
  url: string,
  { name, withTitleColumn = false, rows = [] }: { name: string; withTitleColumn?: boolean; rows?: string[] },
) {
  await openSpace(page, url);
  await createDataTable(page, name);
  if (!withTitleColumn && rows.length === 0) return;
  await treeItem(page, name).click();
  await addColumn(page, 'Название', /^Текст Одна строка/, { first: true });
  for (const text of rows) await addRowWithText(page, 'Название', text);
}

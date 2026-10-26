import { test, expect, type Locator, type Response } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { dataGrid, gridCell, gridRow, setUpDataTable } from './support/data-table';

test('SM-98 История строки и «Отменить»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const grid = dataGrid(page);

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM98_Таблица со строкой «Было»', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM98_Таблица', rows: ['Было'] });
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let titleCell: Locator, rowSaved: Promise<Response>, history: Locator, change: Locator, entry: Locator, historyWindow: Locator;

  await test.step('Шаг 1. Открыть TEST_SM98_Таблица, заменить «Было» на «Стало»', async () => {
    await treeItem(page, 'TEST_SM98_Таблица').click();
    // Двойной клик открывает ввод с текстом ячейки; выделяем всё и печатаем новое значение
    titleCell = await gridCell(grid, gridRow(grid, 'Было'), 'Название');
    await titleCell.dblclick();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('Стало');
    // Правка сохраняется запросом PATCH /table-rows/<id>; ждём его, иначе журнал может открыться раньше записи
    rowSaved = page.waitForResponse((r) => r.request().method() === 'PATCH' && /\/table-rows\//.test(r.url()));
    await page.keyboard.press('Enter');
    expect((await rowSaved).ok()).toBe(true);
    await expect(titleCell).toContainText('Стало');
  });

  await test.step('Шаг 2. Правый клик по строке → «История» → вкладка «Журнал»', async () => {
    await titleCell.click({ button: 'right' });
    // Контекстное меню строки — menu с пунктами menuitem
    await page.getByRole('menuitem', { name: 'История', exact: true }).click();
    history = page.getByRole('dialog', { name: 'Стало' });
    await history.getByRole('tab', { name: 'Журнал' }).click();

    // Ожидание 1: после шага 2 в журнале правка «Было → Стало»
    // Журнал — список (ol) записей; запись — listitem со своим списком правок по полям,
    // поэтому правка — listitem без вложенных listitem
    // Стрелка и значения лежат в отдельных span, поэтому ищем по тексту с произвольными пробелами
    change = page.getByRole('listitem').filter({ hasText: /Было\s*→\s*Стало$/, hasNot: page.getByRole('listitem') });
    entry = history.getByRole('listitem').filter({ has: change });
    await expect(entry).toBeVisible();
  });

  await test.step('Шаг 3. У правки «Было → Стало» нажать «Отменить», затем «Отменить изменения»', async () => {
    // «Отменить» стоит в заголовке записи журнала, в которой есть эта правка
    await entry.getByRole('button', { name: 'Отменить', exact: true }).click();
    await page.getByRole('button', { name: 'Отменить изменения' }).click();

    // Ожидание 2: после шага 3 уведомление «Отменено, изменено строк: 1»
    await expect(page.getByText('Отменено, изменено строк: 1')).toBeVisible();

    // Ожидание 3: в строке снова «Было»
    // Окно истории закрывает таблицу от проверки, поэтому сначала закрываем его кнопкой ✕ (Esc закрывает не всегда)
    historyWindow = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Предыдущая запись' }) });
    await historyWindow.getByRole('button', { name: /^(Close|Закрыть)$/ }).click();
    await expect(historyWindow).toBeHidden();
    await expect(titleCell).toContainText('Было');
  });
});

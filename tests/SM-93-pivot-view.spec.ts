import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { setUpDataTable } from './support/data-table';

test('SM-93 Вид «Сводная»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  const tableItem = treeItem(page, 'TEST_SM93_Таблица');

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM93_Таблица с двумя строками', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM93_Таблица', rows: ['Строка один', 'Строка два'] });
  });

  await test.step('Шаг 1. Открыть TEST_SM93_Таблица', async () => {
    await tableItem.click();
  });

  await test.step('Шаг 2. Вид «По умолчанию» → «Сводная»', async () => {
    await main.getByRole('button', { name: 'По умолчанию' }).click();
    await page.getByRole('button', { name: 'Сводная', exact: true }).click();
  });

  await test.step('Шаг 3. В «Строки» нажать «Добавить поле», выбрать «Название»', async () => {
    // Кнопок «Добавить поле» три (Строки, Столбцы, Значения); нужна первая, из блока «Строки»
    // «Название» подставляется в «Строки» само (единственный столбец), отдельного выбора из списка не видно
    // eslint-disable-next-line playwright/no-nth-methods -- блоки «Строки»/«Столбцы»/«Значения» не названы группами (пробел в приложении)
    await main.getByRole('button', { name: 'Добавить поле' }).first().click();

    // Ожидание: видны столбец «Количество» и строка «Общий итог» со значением 2
    await expect(main.getByRole('columnheader', { name: /^Количество/ })).toBeVisible();
    await expect(main.getByRole('row', { name: /^Общий итог/ }).getByRole('cell', { name: '2', exact: true })).toBeVisible();
  });
});

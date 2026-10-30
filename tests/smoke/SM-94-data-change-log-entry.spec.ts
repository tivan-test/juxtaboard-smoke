import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from '../support/navigator';
import { setUpDataTable } from '../support/data-table';

test('SM-94 «Данные» → «Журнал изменений»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  const tableItem = treeItem(page, 'TEST_SM94_Таблица');

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM94_Таблица со строкой «Строка журнал»', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM94_Таблица', rows: ['Строка журнал'] });
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let journal: Locator, change: Locator;

  await test.step('Шаг 1. Открыть TEST_SM94_Таблица', async () => {
    await tableItem.click();
  });

  await test.step('Шаг 2. Нажать «Данные» → «Журнал изменений»', async () => {
    await main.getByRole('button', { name: 'Данные', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Журнал изменений', exact: true }).click();

    // Ожидание: есть запись «ИЗМЕНЕНО» со значением «Строка журнал»
    journal = page.getByRole('dialog', { name: 'Журнал изменений' });
    // «Изменено» есть и как пункт фильтра «Операция» (скрытый), поэтому берём только видимое
    await expect(journal.getByText('Изменено', { exact: true }).filter({ visible: true })).toBeVisible();
    // Запись журнала — listitem со своим списком правок (тоже listitem); проверяем запись, где есть правка со значением
    change = page.getByRole('listitem').filter({ hasText: 'Строка журнал', hasNot: page.getByRole('listitem') });
    await expect(journal.getByRole('listitem').filter({ has: change })).toBeVisible();
  });
});

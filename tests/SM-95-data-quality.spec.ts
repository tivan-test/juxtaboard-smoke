import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { setUpDataTable } from './support/data-table';

test('SM-95 «Данные» → «Качество данных…»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  const tableItem = treeItem(page, 'TEST_SM95_Таблица');

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM95_Таблица с одной строкой', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM95_Таблица', rows: ['Строка качество'] });
  });

  // Шаг 1. Открыть TEST_SM95_Таблица
  await tableItem.click();

  // Шаг 2. Нажать «Данные» → «Качество данных…»
  await main.getByRole('button', { name: 'Данные', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Качество данных…', exact: true }).click();
  const quality = page.getByRole('dialog', { name: 'Качество данных' });

  // Ожидание 1: «Строк» 1
  // Показатель — группа (group), названная по подписи: в ней подпись и число
  await expect(quality.getByRole('group', { name: 'Строк', exact: true })).toHaveText(/^Строк\s*1$/);

  // Ожидание 2: у столбца «Название» заполнено 100%
  await expect(quality.getByRole('row', { name: /^Название/ }).getByRole('cell', { name: '100%' })).toBeVisible();
});

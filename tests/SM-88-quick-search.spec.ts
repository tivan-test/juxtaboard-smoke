import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { dataGrid, gridRow, setUpDataTable } from './support/data-table';

test('SM-88 Поиск «Быстрый»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  const grid = dataGrid(page);

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM88_Таблица со строками «Строка смоук» и «Другая строка»', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM88_Таблица', rows: ['Строка смоук', 'Другая строка'] });
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let quickSearch: Locator;

  await test.step('Шаг 1. Открыть TEST_SM88_Таблица', async () => {
    await treeItem(page, 'TEST_SM88_Таблица').click();
  });

  await test.step('Шаг 2. Ввести в поле «Быстрый» «смоук»', async () => {
    // Поле называется «Быстрый поиск» (в таблице так подписано)
    quickSearch = main.getByRole('textbox', { name: 'Быстрый поиск' });
    await quickSearch.fill('смоук');

    // Ожидание 1: после шага 2 видна только строка «Строка смоук»
    await expect(gridRow(grid, 'Строка смоук')).toBeVisible();
    await expect(gridRow(grid, 'Другая строка')).toBeHidden();
  });

  await test.step('Шаг 3. Заменить текст в поле на «неттакого»', async () => {
    await quickSearch.fill('неттакого');

    // Ожидание 2: после шага 3 строк не видно
    await expect(main.getByRole('button', { name: 'Открыть запись' })).toHaveCount(0);
  });
});

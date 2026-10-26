import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openTreeItemActions, treeItem } from './support/navigator';
import { dataGrid, gridRow, setUpDataTable } from './support/data-table';

test('SM-97 Создать правило и запустить по строке', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  const tableItem = treeItem(page, 'TEST_SM97_Таблица');
  const grid = dataGrid(page);

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM97_Таблица со строкой «Строка до»', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM97_Таблица', rows: ['Строка до'] });
  });

  // Шаг 1. ⋮ у TEST_SM97_Таблица → «Автоматизации…» → «Новое правило»
  await openTreeItemActions(tableItem);
  await page.getByRole('menuitem', { name: 'Автоматизации…', exact: true }).click();
  await main.getByRole('button', { name: 'Новое правило' }).click();

  // Шаг 2. Название «TEST_SM97_Правило», триггер «Вручную»
  await page.getByRole('textbox', { name: 'напр. Уведомить владельца о статусе Won' }).fill('TEST_SM97_Правило');
  await page.getByRole('button', { name: 'Вручную', exact: true }).click();

  // Шаг 3. «Добавить действие» (по умолчанию «Установить поля этой строки»), «Добавить поле»: «Название» = «Строка после»
  await page.getByRole('button', { name: 'Добавить действие' }).click();
  await page.getByRole('button', { name: 'Добавить поле' }).click();
  // У выпадающего списка колонок нет названия, находим его по пункту «колонка…»
  await page.getByRole('combobox').filter({ has: page.getByRole('option', { name: 'колонка…' }) }).selectOption('Название');
  // Поле значения — редактор с подстановками (textbox) без названия (пробел в приложении), других вариантов нет
  // eslint-disable-next-line playwright/no-raw-locators -- у поля значения нет названия, оно единственное редактируемое поле правила
  await page.locator('[contenteditable="true"]').fill('Строка после');

  // Шаг 4. Нажать «Создать»
  await page.getByRole('button', { name: 'Создать', exact: true }).click();

  // Ожидание 1: после шага 4 правило «TEST_SM97_Правило» в списке, включено
  const ruleRow = main.getByRole('row', { name: /TEST_SM97_Правило/ });
  await expect(ruleRow).toBeVisible();
  await expect(ruleRow.getByRole('switch')).toBeChecked();

  // Шаг 5. Открыть TEST_SM97_Таблица заново по адресу (перезагрузкой)
  // Сначала открываем таблицу из дерева, чтобы в адресе появился её номер, затем перезагружаем страницу
  await tableItem.click();
  await expect(main.getByRole('button', { name: 'Добавить строку' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await expect(gridRow(grid, 'Строка до')).toBeVisible();

  // Шаг 6. Правый клик по строке → «Запустить автоматизацию» → «TEST_SM97_Правило»
  await gridRow(grid, 'Строка до').click({ button: 'right' });
  // Контекстное меню строки — menu с пунктами menuitem; «Запустить автоматизацию» открывает вложенное меню с тем же названием
  await page.getByRole('menuitem', { name: 'Запустить автоматизацию' }).click();
  await page.getByRole('menu', { name: 'Запустить автоматизацию' }).getByRole('menuitem', { name: 'TEST_SM97_Правило' }).click();

  // Ожидание 2: после шага 6 уведомление «Выполнено «TEST_SM97_Правило»»
  await expect(page.getByText('Выполнено «TEST_SM97_Правило»')).toBeVisible();

  // Ожидание 3: в строке «Строка после»
  await expect(gridRow(grid, 'Строка после')).toBeVisible();
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { dataGrid, gridRow, setUpDataTable } from './support/data-table';

test('SM-105 Форма пишет в таблицу', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const tableItem = treeItem(page, 'TEST_SM105_Таблица');

  await test.step('Предусловие (SM-85, SM-86): создать свою таблицу TEST_SM105_Таблица со столбцом «Название»', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM105_Таблица', withTitleColumn: true });
  });

  // Шаг 1. Стрелка ▾ у «+ Документ» → «Новая форма», ввести «TEST_SM105_Форма», нажать «Создать»
  await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
  await page.getByRole('menuitem', { name: 'Новая форма', exact: true }).click();
  const formDialog = page.getByRole('dialog', { name: 'Новая форма' });
  await formDialog.getByRole('textbox', { name: 'Название формы' }).fill('TEST_SM105_Форма');
  await formDialog.getByRole('button', { name: 'Создать' }).click();
  // Шаг 2. Нажать «TEST_SM105_Форма» в дереве (после создания она сама не открывается)
  await treeItem(page, 'TEST_SM105_Форма').click();

  // Шаг 3. «Редактировать» → «Целевая таблица» → TEST_SM105_Таблица
  await page.getByRole('button', { name: 'Редактировать' }).click();
  await page.getByRole('combobox').click();
  // Выбор сохраняется с задержкой (PUT /forms/<id>); без ожидания «Просмотр» показывает «Form has no target table»
  const targetSaved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/forms\//.test(r.url()));
  await page.getByRole('option', { name: 'TEST_SM105_Таблица', exact: true }).click();
  expect((await targetSaved).ok()).toBe(true);

  // Шаг 4. «Добавить поле» → «Название»
  // Форму не публикуем: переключатель «Опубликовать форму» не трогаем
  await page.getByRole('button', { name: 'Добавить поле', exact: true }).click();
  const fieldSaved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/forms\//.test(r.url()));
  await page.getByRole('menuitem', { name: 'Название', exact: true }).click();
  expect((await fieldSaved).ok()).toBe(true);

  // Шаг 5. Нажать «Просмотр», ввести «Из формы», нажать «Отправить»
  await page.getByRole('button', { name: 'Просмотр' }).click();
  // У поля в просмотре нет имени (подпись не связана с полем), берём последнее поле ввода в основной области (первое — фильтр дерева)
  // eslint-disable-next-line playwright/no-nth-methods -- подпись поля формы не связана с полем ввода (пробел в приложении)
  await page.getByRole('main').getByRole('textbox').last().fill('Из формы');
  await page.getByRole('button', { name: 'Отправить' }).click();

  // Ожидание 1: после шага 5 видно «Спасибо!»
  await expect(page.getByRole('heading', { name: 'Спасибо!' })).toBeVisible();

  // Шаг 6. Открыть TEST_SM105_Таблица
  await tableItem.click();

  // Ожидание 2: после шага 6 есть строка «Из формы»
  await expect(gridRow(dataGrid(page), 'Из формы')).toBeVisible();
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-86 Первый столбец', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  // Строка дерева документов: у строк дерева нет роли, ищем по атрибуту data-document-id
  const treeItem = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM86_Таблица' });

  await test.step('Предусловие (SM-85): создать свою таблицу TEST_SM86_Таблица', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await main.getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM86_Таблица», нажать «Создать»
    const createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM86_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(treeItem).toBeVisible();
  });

  // Шаг 1. Открыть TEST_SM86_Таблица
  await treeItem.click();

  // Шаг 2. Нажать «Добавить первый столбец»
  await main.getByRole('button', { name: 'Добавить первый столбец' }).click();

  // Шаг 3. Ввести название поля «Название», тип «Текст», нажать «Создать поле»
  const fieldDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
  await fieldDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Название');
  await fieldDialog.getByRole('button', { name: /^Текст Одна строка/ }).click();
  await fieldDialog.getByRole('button', { name: 'Создать поле' }).click();

  // Ожидание: в таблице есть столбец «Название»
  await expect(main.getByText('Название', { exact: true })).toBeVisible();
});

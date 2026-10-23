import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-87 Новая строка', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  // Строка дерева документов: у строк дерева нет роли, ищем по атрибуту data-document-id
  const treeItem = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM87_Таблица' });

  await test.step('Предусловие (SM-85, SM-86): создать свою таблицу TEST_SM87_Таблица со столбцом «Название»', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await main.getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM87_Таблица», нажать «Создать»
    const createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM87_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(treeItem).toBeVisible();
    // Шаг 4. Открыть TEST_SM87_Таблица
    await treeItem.click();
    // Шаг 5. Нажать «Добавить первый столбец»
    await main.getByRole('button', { name: 'Добавить первый столбец' }).click();
    // Шаг 6. Ввести название поля «Название», тип «Текст», нажать «Создать поле»
    const fieldDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
    await fieldDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Название');
    await fieldDialog.getByRole('button', { name: /^Текст Одна строка/ }).click();
    await fieldDialog.getByRole('button', { name: 'Создать поле' }).click();
    await expect(main.getByText('Название', { exact: true })).toBeVisible();
  });

  // Шаг 1. Открыть TEST_SM87_Таблица
  await treeItem.click();

  // Шаг 2. Нажать «Добавить строку», ввести в «Название» «Строка смоук», нажать Enter
  await main.getByRole('button', { name: 'Добавить строку' }).click();
  // Пустая ячейка новой строки показывает «—»; двойной клик открывает ввод, фокус сразу в нём
  await main.getByText('—', { exact: true }).dblclick();
  await page.keyboard.type('Строка смоук');
  await page.keyboard.press('Enter');
  // Ждём, пока значение появится в ячейке (запись сохранена), и только потом перезагружаем
  await expect(main.getByText('Строка смоук')).toBeVisible();

  // Шаг 3. Перезагрузить страницу
  await page.reload();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });

  // Ожидание 1: в строке «Строка смоук»
  await expect(main.getByText('Строка смоук')).toBeVisible();

  // Ожидание 2: размер таблицы «1×1»
  await expect(main.getByText('1×1')).toBeVisible();
});

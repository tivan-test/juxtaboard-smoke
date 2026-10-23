import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-93 Вид «Сводная»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  // Строка дерева документов: у строк дерева нет роли, ищем по атрибуту data-document-id
  const treeItem = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM93_Таблица' });

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM93_Таблица с двумя строками', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await main.getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM93_Таблица», нажать «Создать»
    const createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM93_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(treeItem).toBeVisible();
    // Шаг 4. Открыть TEST_SM93_Таблица
    await treeItem.click();
    // Шаг 5. Нажать «Добавить первый столбец»
    await main.getByRole('button', { name: 'Добавить первый столбец' }).click();
    // Шаг 6. Ввести название поля «Название», тип «Текст», нажать «Создать поле»
    const fieldDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
    await fieldDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Название');
    await fieldDialog.getByRole('button', { name: /^Текст Одна строка/ }).click();
    await fieldDialog.getByRole('button', { name: 'Создать поле' }).click();
    await expect(main.getByText('Название', { exact: true })).toBeVisible();
    // Шаг 7. Нажать «Добавить строку», ввести в «Название» «Строка один», нажать Enter
    await main.getByRole('button', { name: 'Добавить строку' }).click();
    // Пустая ячейка новой строки показывает «—»; двойной клик открывает ввод, фокус сразу в нём
    await main.getByText('—', { exact: true }).dblclick();
    await page.keyboard.type('Строка один');
    await page.keyboard.press('Enter');
    await expect(main.getByText('Строка один', { exact: true })).toBeVisible();
    // Шаг 8. Нажать «Добавить строку», ввести в «Название» «Строка два», нажать Enter
    await main.getByRole('button', { name: 'Добавить строку' }).click();
    // Пустая ячейка новой строки показывает «—»; двойной клик открывает ввод, фокус сразу в нём
    await main.getByText('—', { exact: true }).dblclick();
    await page.keyboard.type('Строка два');
    await page.keyboard.press('Enter');
    await expect(main.getByText('Строка два', { exact: true })).toBeVisible();
  });

  // Шаг 1. Открыть TEST_SM93_Таблица
  await treeItem.click();

  // Шаг 2. Вид «По умолчанию» → «Сводная»
  await main.getByRole('button', { name: 'По умолчанию' }).click();
  await page.getByRole('button', { name: 'Сводная', exact: true }).click();

  // Шаг 3. В «Строки» нажать «Добавить поле», выбрать «Название»
  // Кнопок «Добавить поле» три (Строки, Столбцы, Значения); нужна первая, из блока «Строки»
  // «Название» подставляется в «Строки» само (единственный столбец), отдельного выбора из списка не видно
  await main.getByRole('button', { name: 'Добавить поле' }).first().click();

  // Ожидание: видны столбец «Количество» и строка «Общий итог» со значением 2
  await expect(main.getByRole('columnheader', { name: /^Количество/ })).toBeVisible();
  await expect(main.getByRole('row', { name: /^Общий итог/ }).getByRole('cell', { name: '2', exact: true })).toBeVisible();
});

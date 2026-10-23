import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-89 Столбец «Выбор»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  // Строка дерева документов: у строк дерева нет роли, ищем по атрибуту data-document-id
  const treeItem = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM89_Таблица' });

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM89_Таблица со строкой «Строка выбор»', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await main.getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM89_Таблица», нажать «Создать»
    const createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM89_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(treeItem).toBeVisible();
    // Шаг 4. Открыть TEST_SM89_Таблица
    await treeItem.click();
    // Шаг 5. Нажать «Добавить первый столбец»
    await main.getByRole('button', { name: 'Добавить первый столбец' }).click();
    // Шаг 6. Ввести название поля «Название», тип «Текст», нажать «Создать поле»
    const fieldDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
    await fieldDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Название');
    await fieldDialog.getByRole('button', { name: /^Текст Одна строка/ }).click();
    await fieldDialog.getByRole('button', { name: 'Создать поле' }).click();
    await expect(main.getByText('Название', { exact: true })).toBeVisible();
    // Шаг 7. Нажать «Добавить строку», ввести в «Название» «Строка выбор», нажать Enter
    await main.getByRole('button', { name: 'Добавить строку' }).click();
    // Пустая ячейка новой строки показывает «—»; двойной клик открывает ввод, фокус сразу в нём
    await main.getByText('—', { exact: true }).dblclick();
    await page.keyboard.type('Строка выбор');
    await page.keyboard.press('Enter');
    await expect(main.getByText('Строка выбор')).toBeVisible();
  });

  // Шаг 1. Открыть TEST_SM89_Таблица
  await treeItem.click();

  // Шаг 2. Нажать «+» в шапке, название «Статус», тип «Выбор», нажать «Создать поле»
  await main.getByRole('button', { name: 'Добавить столбец' }).click();
  const statusDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
  await statusDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Статус');
  await statusDialog.getByRole('button', { name: /^Выбор Выбор одного/ }).click();
  await statusDialog.getByRole('button', { name: 'Создать поле' }).click();
  await expect(main.getByText('Статус', { exact: true })).toBeVisible();

  // Шаг 3. ⋮ у столбца «Статус» → «Настройки поля» (окно со списком вариантов)
  // У ⋮ в шапке столбца нет названия, это кнопка с выпадающим меню в ячейке шапки
  const statusHead = main.getByText('Статус', { exact: true }).locator('xpath=..');
  await statusHead.hover();
  await statusHead.locator('button[aria-haspopup="menu"]').click();
  // В меню два пункта «Настройки поля» (так в продукте), берём первый: он открывает окно со списком вариантов
  await page.getByRole('menuitem', { name: 'Настройки поля' }).first().click();
  // Шаг 4. Добавить варианты «Новый» и «Готово», нажать «Сохранить»
  const optionsDialog = page.getByRole('dialog', { name: 'Настройки поля(список)' });
  await optionsDialog.getByRole('textbox', { name: 'Новый вариант…' }).fill('Новый');
  await optionsDialog.getByRole('button', { name: 'Добавить', exact: true }).click();
  await optionsDialog.getByRole('textbox', { name: 'Новый вариант…' }).fill('Готово');
  await optionsDialog.getByRole('button', { name: 'Добавить', exact: true }).click();
  await optionsDialog.getByRole('button', { name: 'Сохранить' }).click();
  await expect(optionsDialog).toBeHidden();

  // Шаг 5. Открыть ячейку «Статус» в строке и выбрать «Новый»
  // В строке одна пустая ячейка «—» (столбец «Статус»); двойной клик открывает список вариантов
  await main.getByText('—', { exact: true }).dblclick();
  await page.getByRole('button', { name: 'Новый', exact: true }).click();

  // Ожидание: в ячейке «Новый»
  await expect(main.getByText('Новый', { exact: true })).toBeVisible();
});

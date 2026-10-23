import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-88 Поиск «Быстрый»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  // Строка дерева документов: у строк дерева нет роли, ищем по атрибуту data-document-id
  const treeItem = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM88_Таблица' });

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM88_Таблица со строками «Строка смоук» и «Другая строка»', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await main.getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM88_Таблица», нажать «Создать»
    const createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM88_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(treeItem).toBeVisible();
    // Шаг 4. Открыть TEST_SM88_Таблица
    await treeItem.click();
    // Шаг 5. Нажать «Добавить первый столбец»
    await main.getByRole('button', { name: 'Добавить первый столбец' }).click();
    // Шаг 6. Ввести название поля «Название», тип «Текст», нажать «Создать поле»
    const fieldDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
    await fieldDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Название');
    await fieldDialog.getByRole('button', { name: /^Текст Одна строка/ }).click();
    await fieldDialog.getByRole('button', { name: 'Создать поле' }).click();
    await expect(main.getByText('Название', { exact: true })).toBeVisible();
    // Шаг 7. Нажать «Добавить строку», ввести в «Название» «Строка смоук», нажать Enter
    await main.getByRole('button', { name: 'Добавить строку' }).click();
    // Пустая ячейка новой строки показывает «—»; двойной клик открывает ввод, фокус сразу в нём
    await main.getByText('—', { exact: true }).dblclick();
    await page.keyboard.type('Строка смоук');
    await page.keyboard.press('Enter');
    await expect(main.getByText('Строка смоук')).toBeVisible();
    // Шаг 8. Нажать «Добавить строку», ввести в «Название» «Другая строка», нажать Enter
    await main.getByRole('button', { name: 'Добавить строку' }).click();
    // Пустая ячейка новой строки показывает «—»; двойной клик открывает ввод, фокус сразу в нём
    await main.getByText('—', { exact: true }).dblclick();
    await page.keyboard.type('Другая строка');
    await page.keyboard.press('Enter');
    await expect(main.getByText('Другая строка')).toBeVisible();
  });

  // Шаг 1. Открыть TEST_SM88_Таблица
  await treeItem.click();

  // Шаг 2. Ввести в поле «Быстрый» «смоук»
  // Поле называется «Быстрый поиск» (в таблице так подписано)
  const quickSearch = main.getByRole('textbox', { name: 'Быстрый поиск' });
  await quickSearch.fill('смоук');

  // Ожидание 1: после шага 2 видна только строка «Строка смоук»
  await expect(main.getByText('Строка смоук')).toBeVisible();
  await expect(main.getByText('Другая строка')).toBeHidden();

  // Шаг 3. Заменить текст в поле на «неттакого»
  await quickSearch.fill('неттакого');

  // Ожидание 2: после шага 3 строк не видно
  await expect(main.getByRole('button', { name: 'Открыть запись' })).toHaveCount(0);
});

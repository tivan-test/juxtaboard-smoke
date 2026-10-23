import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-95 «Данные» → «Качество данных…»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  // Строка дерева документов: у строк дерева нет роли, ищем по атрибуту data-document-id
  const treeItem = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM95_Таблица' });

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM95_Таблица с одной строкой', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await main.getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM95_Таблица», нажать «Создать»
    const createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM95_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(treeItem).toBeVisible();
    // Шаг 4. Открыть TEST_SM95_Таблица
    await treeItem.click();
    // Шаг 5. Нажать «Добавить первый столбец»
    await main.getByRole('button', { name: 'Добавить первый столбец' }).click();
    // Шаг 6. Ввести название поля «Название», тип «Текст», нажать «Создать поле»
    const fieldDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
    await fieldDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Название');
    await fieldDialog.getByRole('button', { name: /^Текст Одна строка/ }).click();
    await fieldDialog.getByRole('button', { name: 'Создать поле' }).click();
    await expect(main.getByText('Название', { exact: true })).toBeVisible();
    // Шаг 7. Нажать «Добавить строку», ввести в «Название» «Строка качество», нажать Enter
    await main.getByRole('button', { name: 'Добавить строку' }).click();
    // Пустая ячейка новой строки показывает «—»; двойной клик открывает ввод, фокус сразу в нём
    await main.getByText('—', { exact: true }).dblclick();
    await page.keyboard.type('Строка качество');
    await page.keyboard.press('Enter');
    await expect(main.getByText('Строка качество', { exact: true })).toBeVisible();
  });

  // Шаг 1. Открыть TEST_SM95_Таблица
  await treeItem.click();

  // Шаг 2. Нажать «Данные» → «Качество данных…»
  await main.getByRole('button', { name: 'Данные', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Качество данных…', exact: true }).click();
  const quality = page.getByRole('dialog', { name: 'Качество данных' });

  // Ожидание 1: «Строк» 1
  // Подпись «Строк» и число лежат рядом в двух span, число идёт следом за подписью
  await expect(quality.getByText('Строк', { exact: true }).locator('xpath=following-sibling::span')).toHaveText('1');

  // Ожидание 2: у столбца «Название» заполнено 100%
  await expect(quality.getByRole('row', { name: /^Название/ }).getByRole('cell', { name: '100%' })).toBeVisible();
});

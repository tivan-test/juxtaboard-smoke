import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-105 Форма пишет в таблицу', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const tableRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM105_Таблица' });
  const formRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM105_Форма' });

  await test.step('Предусловие (SM-85, SM-86): создать свою таблицу TEST_SM105_Таблица со столбцом «Название»', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM105_Таблица», нажать «Создать»
    const createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM105_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(tableRow).toBeVisible();
    // Шаг 4. Открыть TEST_SM105_Таблица
    await tableRow.click();
    // Шаг 5. Нажать «Добавить первый столбец»
    await page.getByRole('button', { name: 'Добавить первый столбец' }).click();
    // Шаг 6. Ввести название поля «Название», тип «Текст», нажать «Создать поле»
    const columnDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
    // У поля названия нет имени, есть только подсказка внутри
    await columnDialog.getByPlaceholder('напр. Статус, Ответственный, Срок').fill('Название');
    await columnDialog.getByRole('button', { name: 'Текст Одна строка' }).click();
    await columnDialog.getByRole('button', { name: 'Создать поле' }).click();
    await expect(page.getByRole('main').getByText('Название', { exact: true })).toBeVisible();
  });

  // Шаг 1. Стрелка ▾ у «+ Документ» → «Новая форма», ввести «TEST_SM105_Форма», нажать «Создать»
  await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
  await page.getByRole('menuitem', { name: 'Новая форма', exact: true }).click();
  const formDialog = page.getByRole('dialog', { name: 'Новая форма' });
  await formDialog.getByRole('textbox', { name: 'Название формы' }).fill('TEST_SM105_Форма');
  await formDialog.getByRole('button', { name: 'Создать' }).click();
  // Шаг 2. Нажать «TEST_SM105_Форма» в дереве (после создания она сама не открывается)
  await formRow.click();

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
  await page.getByRole('main').getByRole('textbox').last().fill('Из формы');
  await page.getByRole('button', { name: 'Отправить' }).click();

  // Ожидание 1: после шага 5 видно «Спасибо!»
  await expect(page.getByRole('heading', { name: 'Спасибо!' })).toBeVisible();

  // Шаг 6. Открыть TEST_SM105_Таблица
  await tableRow.click();

  // Ожидание 2: после шага 6 есть строка «Из формы»
  await expect(page.getByText('Из формы', { exact: true })).toBeVisible();
});

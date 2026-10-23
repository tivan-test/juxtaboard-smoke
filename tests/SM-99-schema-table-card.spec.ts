import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-99 «Схема» с таблицей', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  // Строка дерева документов: у строк дерева нет роли, ищем по атрибуту data-document-id
  const treeItem = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM99_Таблица' });

  await test.step('Предусловие (SM-85, SM-86): создать свою таблицу TEST_SM99_Таблица со столбцом «Название»', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await main.getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM99_Таблица», нажать «Создать»
    const createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM99_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(treeItem).toBeVisible();
    // Шаг 4. Открыть TEST_SM99_Таблица
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

  // Шаг 1. Открыть /projects, «Показать ещё»
  await page.goto('/projects');
  await page.getByRole('button', { name: /^Показать ещё/ }).click({ timeout: 60_000 });

  // Шаг 2. На карточке пространства прогона нажать «Схема»
  const card = page.locator('#active-spaces [data-slot="card"]').filter({ has: page.getByRole('heading', { name, exact: true }) });
  await card.getByRole('link', { name: 'Схема' }).click();

  // Ожидание: видна карточка «TEST_SM99_Таблица» с полем «Название»
  // Карточка таблицы на схеме — group внутри области схемы (application)
  const tableCard = page.getByRole('application').getByRole('group').filter({ hasText: 'TEST_SM99_Таблица' });
  await expect(tableCard).toBeVisible({ timeout: 60_000 });
  await expect(tableCard.getByRole('listitem').filter({ hasText: 'Название' })).toBeVisible();
});

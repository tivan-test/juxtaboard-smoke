import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-96 ⋮ таблицы → «Автоматизации…»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  // Строка дерева документов: у строк дерева нет роли, ищем по атрибуту data-document-id
  const treeItem = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM96_Таблица' });

  await test.step('Предусловие (SM-85): создать свою таблицу TEST_SM96_Таблица', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await main.getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM96_Таблица», нажать «Создать»
    const createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM96_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(treeItem).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM96_Таблица в дереве → «Автоматизации…»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке дерева
  await treeItem.hover();
  await treeItem.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Автоматизации…', exact: true }).click();

  // Ожидание 1: открылся раздел «Автоматизации»
  await expect(main.getByText('Автоматизации', { exact: true })).toBeVisible();

  // Ожидание 2: видно «Фильтр по таблице: TEST_SM96_Таблица»
  await expect(main.getByText('Фильтр по таблице: TEST_SM96_Таблица')).toBeVisible();
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-108 ⋮ доски → «Открыть на весь экран»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const boardRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM108_Доска' });

  await test.step('Предусловие (SM-107): создать свою доску TEST_SM108_Доска', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая доска», ввести «TEST_SM108_Доска», нажать «Создать»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая доска', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Новая доска' });
    await createDialog.getByRole('textbox', { name: 'Название доски' }).fill('TEST_SM108_Доска');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(boardRow).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM108_Доска → «Открыть на весь экран»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке дерева
  await boardRow.hover();
  await boardRow.locator('button[aria-haspopup="menu"]').click();
  const [newPage] = await Promise.all([
    page.context().waitForEvent('page'),
    page.getByRole('menuitem', { name: 'Открыть на весь экран' }).click(),
  ]);

  // Ожидание: открылась новая вкладка с адресом, который заканчивается на /fullscreen
  await expect(newPage).toHaveURL(/\/fullscreen$/);

  // Закрыть открытую вкладку
  await newPage.close();
});

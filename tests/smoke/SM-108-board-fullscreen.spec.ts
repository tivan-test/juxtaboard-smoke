import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openSpace, openTreeItemActions, treeItem } from '../support/navigator';

test('SM-108 ⋮ доски → «Открыть на весь экран»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const boardItem = treeItem(page, 'TEST_SM108_Доска');

  await test.step('Предусловие (SM-107): создать свою доску TEST_SM108_Доска', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая доска», ввести «TEST_SM108_Доска», нажать «Создать»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая доска', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Новая доска' });
    await createDialog.getByRole('textbox', { name: 'Название доски' }).fill('TEST_SM108_Доска');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(boardItem).toBeVisible();
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let newPage: Page;

  await test.step('Шаг 1. ⋮ у TEST_SM108_Доска → «Открыть на весь экран»', async () => {
    await openTreeItemActions(boardItem);
    [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.getByRole('menuitem', { name: 'Открыть на весь экран' }).click(),
    ]);

    // Ожидание: открылась новая вкладка с адресом, который заканчивается на /fullscreen
    await expect(newPage).toHaveURL(/\/fullscreen$/);

    // Закрыть открытую вкладку
    await newPage.close();
  });
});

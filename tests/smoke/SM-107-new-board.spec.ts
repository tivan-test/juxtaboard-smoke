import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openSpace, treeItem } from '../support/navigator';

test('SM-107 Новая доска', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await openSpace(page, url);

  // Объявлено до шагов, потому что используется в нескольких шагах
  let createDialog: Locator;

  await test.step('Шаг 1. Стрелка ▾ у «+ Документ» → «Новая доска», ввести «TEST_SM107_Доска», нажать «Создать»', async () => {
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая доска', exact: true }).click();
    createDialog = page.getByRole('dialog', { name: 'Новая доска' });
    await createDialog.getByRole('textbox', { name: 'Название доски' }).fill('TEST_SM107_Доска');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
  });

  await test.step('Шаг 2. Нажать «TEST_SM107_Доска» в дереве', async () => {
    await treeItem(page, 'TEST_SM107_Доска').click();

    // Ожидание: открылся холст доски с панелью инструментов
    // Холст — это canvas без роли; панель инструментов — кнопки с названиями
    // eslint-disable-next-line playwright/no-raw-locators -- холст доски (@wboard/core) — <canvas> без роли и имени
    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Выбрать (V)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Перо (P)' })).toBeVisible();
  });
});

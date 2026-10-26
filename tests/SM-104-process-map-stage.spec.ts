import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { treeItem } from './support/navigator';
import { setUpDataTable } from './support/data-table';

test('SM-104 Новая карта процесса', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Карта процесса строится по таблицам проекта: без таблиц вместо «Новый этап» видно «В этом проекте пока нет таблиц.»
  await test.step('Предусловие (SM-85): создать свою таблицу TEST_SM104_Таблица', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM104_Таблица' });
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let createDialog;

  await test.step('Шаг 1. Стрелка ▾ у «+ Документ» → «Новая карта процесса», ввести «TEST_SM104_Карта», нажать «Создать»', async () => {
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая карта процесса', exact: true }).click();
    createDialog = page.getByRole('dialog', { name: 'Новая карта процесса' });
    await createDialog.getByRole('textbox', { name: 'Название карты процесса' }).fill('TEST_SM104_Карта');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
  });

  await test.step('Шаг 2. Нажать «TEST_SM104_Карта» в дереве', async () => {
    await treeItem(page, 'TEST_SM104_Карта').click();
  });

  await test.step('Шаг 3. Нажать «Новый этап», ввести «Этап 1»', async () => {
    await page.getByRole('button', { name: 'Новый этап' }).click();
    await page.getByRole('textbox', { name: 'Название этапа…' }).fill('Этап 1');
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === 'POST' && r.ok()),
      page.keyboard.press('Enter'),
    ]);
  });

  await test.step('Шаг 4. Перезагрузить страницу', async () => {
    await page.reload();

    // Ожидание: виден этап «Этап 1»
    await expect(page.getByRole('heading', { name: 'Этап 1' })).toBeVisible({ timeout: 60_000 });
  });
});

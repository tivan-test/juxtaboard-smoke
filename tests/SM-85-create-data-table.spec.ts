import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openSpace, treeItem } from './support/navigator';

test('SM-85 Новая таблица данных', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let createDialog;

  await test.step('Шаг 1. Открыть навигатор пространства прогона', async () => {
    await openSpace(page, url);
  });

  await test.step('Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»', async () => {
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
  });

  await test.step('Шаг 3. Ввести «TEST_SM85_Таблица», нажать «Создать»', async () => {
    createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM85_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();

    // Ожидание: в дереве есть «TEST_SM85_Таблица»
    await expect(treeItem(page, 'TEST_SM85_Таблица')).toBeVisible();
  });
});

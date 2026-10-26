import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openSpace, treeItem } from './support/navigator';

test('SM-100 Новая электронная таблица', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let createDialog;

  await test.step('Шаг 1. Открыть навигатор пространства прогона', async () => {
    await openSpace(page, url);
  });

  await test.step('Шаг 2. Стрелка ▾ у «+ Документ» → «Новая электронная таблица», ввести «TEST_SM100_Электронная», нажать «Создать»', async () => {
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая электронная таблица', exact: true }).click();
    createDialog = page.getByRole('dialog', { name: 'Новая электронная таблица' });
    await createDialog.getByRole('textbox', { name: 'Название электронной таблицы' }).fill('TEST_SM100_Электронная');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
  });

  await test.step('Шаг 3. Нажать «TEST_SM100_Электронная» в дереве', async () => {
    await treeItem(page, 'TEST_SM100_Электронная').click();

    // Ожидание: открылся редактор: вкладки «Начало», «Вставка», «Формулы», лист «Sheet1» (загрузка до 10 секунд)
    // «Вкладки» в продукте — это кнопки, лист — вкладка внутри списка «Sheet tabs»
    await expect(page.getByRole('button', { name: 'Начало', exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Вставка', exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Формулы', exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('tab', { name: 'Sheet1' })).toBeVisible({ timeout: 10_000 });
  });
});

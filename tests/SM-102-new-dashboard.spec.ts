import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openSpace, treeItem } from './support/navigator';

test('SM-102 Новый дашборд', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const dashItem = treeItem(page, 'TEST_SM102_Дашборд');

  await openSpace(page, url);

  // Шаг 1. Стрелка ▾ у «+ Документ» → «Новый дашборд», ввести «TEST_SM102_Дашборд», нажать «Создать»
  // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
  await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
  await page.getByRole('menuitem', { name: 'Новый дашборд', exact: true }).click();
  const createDialog = page.getByRole('dialog', { name: 'Новый дашборд' });
  await createDialog.getByRole('textbox', { name: 'Название дашборда' }).fill('TEST_SM102_Дашборд');
  await createDialog.getByRole('button', { name: 'Создать' }).click();

  // Шаг 2. Нажать «TEST_SM102_Дашборд» в дереве (после создания он сам не открывается)
  await dashItem.click();

  // Шаг 3. Нажать «Начать редактирование»
  await page.getByRole('button', { name: 'Начать редактирование' }).click();

  // Ожидание: видны «Добавить метрику», «Добавить текст», «Готово»
  await expect(page.getByRole('button', { name: 'Добавить метрику' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Добавить текст' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Готово' })).toBeVisible();
});

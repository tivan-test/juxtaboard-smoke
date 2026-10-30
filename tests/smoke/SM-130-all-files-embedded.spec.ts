import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-130 «Показать встроенные файлы»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');

  await test.step('Шаг 1. «Все файлы» → «Показать встроенные файлы»', async () => {
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    await panel.getByRole('button', { name: 'Все файлы' }).click();
    await panel.getByRole('button', { name: 'Показать встроенные файлы', exact: true }).click();

    // Ожидание 1: видны столбцы «Размер» и «Загружен»
    await expect(panel.getByRole('columnheader', { name: 'Размер', exact: true })).toBeVisible();
    await expect(panel.getByRole('columnheader', { name: 'Загружен', exact: true })).toBeVisible();
  });

  await test.step('Шаг 2. Нажать «Показать встроенные файлы» ещё раз', async () => {
    await panel.getByRole('button', { name: 'Показать встроенные файлы', exact: true }).click();

    // Ожидание 2: этих столбцов нет
    await expect(panel.getByRole('columnheader', { name: 'Размер', exact: true })).toBeHidden();
    await expect(panel.getByRole('columnheader', { name: 'Загружен', exact: true })).toBeHidden();
  });
});

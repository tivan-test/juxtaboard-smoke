import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-128 «Показать архив»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');

  // Шаг 1. «Все файлы» → «Показать архив»
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await panel.getByRole('button', { name: 'Все файлы' }).click();
  await panel.getByRole('button', { name: 'Показать архив', exact: true }).click();

  // Ожидание 1: видны столбцы «Архивирован» и «Кем архивирован»
  await expect(panel.getByRole('columnheader', { name: 'Архивирован', exact: true })).toBeVisible();
  await expect(panel.getByRole('columnheader', { name: 'Кем архивирован', exact: true })).toBeVisible();

  // Шаг 2. Нажать «Показать архив» ещё раз
  await panel.getByRole('button', { name: 'Показать архив', exact: true }).click();

  // Ожидание 2: этих столбцов нет
  await expect(panel.getByRole('columnheader', { name: 'Архивирован', exact: true })).toBeHidden();
  await expect(panel.getByRole('columnheader', { name: 'Кем архивирован', exact: true })).toBeHidden();
});

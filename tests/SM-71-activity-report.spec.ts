import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-71 «Отчёт активности»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона → «Инструменты» → «Отчёт активности»
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await page.getByRole('banner').getByRole('button', { name: 'Инструменты' }).click();
  await page.getByRole('menuitem', { name: 'Отчёт активности' }).click();
  const dialog = page.getByRole('dialog', { name: 'Отчёт активности' });

  // Ожидание 1: видны «Добавлено», «Удалено», «Участники»
  await expect(dialog.getByText('Добавлено', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Удалено', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Участники', { exact: true })).toBeVisible();

  // Шаг 2. Нажать «7d»
  await dialog.getByRole('button', { name: '7d' }).click();

  // Шаг 3. Нажать «Пересчитать статистику»
  await dialog.getByRole('button', { name: 'Пересчитать статистику' }).click();

  // Ожидание 2: видно «Последний пересчёт»
  await expect(dialog.getByText(/Последний пересчёт/)).toBeVisible({ timeout: 30_000 });
});

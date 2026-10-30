import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-71 «Отчёт активности»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let dialog: Locator;

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Инструменты» → «Отчёт активности»', async () => {
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('banner').getByRole('button', { name: 'Инструменты' }).click();
    await page.getByRole('menuitem', { name: 'Отчёт активности' }).click();
    dialog = page.getByRole('dialog', { name: 'Отчёт активности' });

    // Ожидание 1: видны «Добавлено», «Удалено», «Участники»
    await expect(dialog.getByText('Добавлено', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Удалено', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Участники', { exact: true })).toBeVisible();
  });

  await test.step('Шаг 2. Нажать «7d»', async () => {
    await dialog.getByRole('button', { name: '7d' }).click();
  });

  await test.step('Шаг 3. Нажать «Пересчитать статистику»', async () => {
    await dialog.getByRole('button', { name: 'Пересчитать статистику' }).click();

    // Ожидание 2: видно «Последний пересчёт»
    await expect(dialog.getByText(/Последний пересчёт/)).toBeVisible({ timeout: 30_000 });
  });
});

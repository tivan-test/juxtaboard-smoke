import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-58 «Журнал изменений данных»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let admin: Locator;

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Администрирование»', async () => {
    await page.goto(url);
    admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
    await expect(admin).toBeVisible({ timeout: 60_000 });
    await admin.click();
  });

  await test.step('Шаг 2. Нажать «Журнал изменений данных»', async () => {
    await page.getByRole('menuitem', { name: 'Журнал изменений данных', exact: true }).click();

    // Ожидание: открылся раздел «Журнал изменений данных» с фильтрами
    await expect(page.getByRole('main').getByText('Журнал изменений данных', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Все таблицы' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Только мои' })).toBeVisible();
  });
});

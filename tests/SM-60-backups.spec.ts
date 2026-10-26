import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-60 «Резервные копии»', async ({ page }) => {
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

  await test.step('Шаг 2. Нажать «Резервные копии»', async () => {
    await page.getByRole('menuitem', { name: 'Резервные копии', exact: true }).click();

    // Ожидание: видно «Резервное копирование — платная функция»
    await expect(page.getByRole('heading', { name: 'Резервное копирование — платная функция' })).toBeVisible();
  });
});

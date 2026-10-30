import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-46 «Инструменты»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let admin: Locator;

  await test.step('Шаг 1. Открыть навигатор пространства прогона', async () => {
    await page.goto(url);
    admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
    await expect(admin).toBeVisible({ timeout: 60_000 });
  });

  await test.step('Шаг 2. Нажать «Инструменты»', async () => {
    await page.getByRole('banner').getByRole('button', { name: 'Инструменты' }).click();

    // Ожидание: видны «Отчёт активности» и «Настройки уведомлений»
    await expect(page.getByRole('menuitem', { name: 'Отчёт активности' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Настройки уведомлений' })).toBeVisible();
  });
});

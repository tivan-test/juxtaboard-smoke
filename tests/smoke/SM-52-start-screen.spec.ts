import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-52 «Стартовый экран»', async ({ page }) => {
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

  await test.step('Шаг 2. Нажать «Стартовый экран»', async () => {
    await page.getByRole('menuitem', { name: 'Стартовый экран', exact: true }).click();

    // Ожидание: видно «Плиток пока нет»
    await expect(page.getByRole('dialog', { name: 'Стартовый экран' }).getByText('Плиток пока нет')).toBeVisible();
  });
});

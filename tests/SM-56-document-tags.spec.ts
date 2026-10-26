import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-56 «Теги документов»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let admin;

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Администрирование»', async () => {
    await page.goto(url);
    admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
    await expect(admin).toBeVisible({ timeout: 60_000 });
    await admin.click();
  });

  await test.step('Шаг 2. Нажать «Теги документов»', async () => {
    await page.getByRole('menuitem', { name: 'Теги документов', exact: true }).click();

    // Ожидание: открылось окно «Document Tags»
    await expect(page.getByRole('dialog', { name: 'Document Tags' })).toBeVisible();
  });
});

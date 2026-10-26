import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-44 «Уведомления»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let admin;

  await test.step('Шаг 1. Открыть навигатор пространства прогона', async () => {
    await page.goto(url);
    admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
    await expect(admin).toBeVisible({ timeout: 60_000 });
  });

  await test.step('Шаг 2. Нажать «Уведомления»', async () => {
    await page.getByRole('banner').getByRole('button', { name: 'Уведомления', exact: true }).click();

    // Ожидание: открылась панель «Уведомления» с кнопкой «Отметить всё как прочитанное» (кнопку не нажимаем)
    await expect(page.getByRole('heading', { name: 'Уведомления', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Отметить всё как прочитанное' })).toBeVisible();
  });
});

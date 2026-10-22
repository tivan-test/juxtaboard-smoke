import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-54 «Онлайн-чат»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона → «Администрирование»
  await page.goto(url);
  const admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
  await expect(admin).toBeVisible({ timeout: 60_000 });
  await admin.click();

  // Шаг 2. Нажать «Онлайн-чат»
  await page.getByRole('menuitem', { name: 'Онлайн-чат', exact: true }).click();

  // Ожидание: открылось окно «Live chat»
  await expect(page.getByRole('dialog', { name: `Live chat — ${name}`, exact: true })).toBeVisible();
});

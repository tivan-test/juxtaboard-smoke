import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-43 «Настройки» во входящих', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона → «Входящие»
  await page.goto(url);
  const admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
  await expect(admin).toBeVisible({ timeout: 60_000 });
  await page.getByRole('banner').getByRole('link', { name: 'Входящие' }).click();

  // Шаг 2. Нажать «Настройки»
  await page.getByRole('button', { name: 'Настройки', exact: true }).click({ timeout: 30_000 });

  // Ожидание: открылось окно «Подпись в письме»
  const dialog = page.getByRole('dialog', { name: 'Подпись в письме' });
  await expect(dialog).toBeVisible();

  // Шаг 3. Закрыть окно (ничего не сохраняем)
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
});

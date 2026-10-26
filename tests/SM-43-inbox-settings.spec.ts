import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-43 «Настройки» во входящих', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let admin: Locator, dialog: Locator;

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Входящие»', async () => {
    await page.goto(url);
    admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
    await expect(admin).toBeVisible({ timeout: 60_000 });
    await page.getByRole('banner').getByRole('link', { name: 'Входящие' }).click();
  });

  await test.step('Шаг 2. Нажать «Настройки»', async () => {
    await page.getByRole('button', { name: 'Настройки', exact: true }).click({ timeout: 30_000 });

    // Ожидание: открылось окно «Подпись в письме»
    dialog = page.getByRole('dialog', { name: 'Подпись в письме' });
    await expect(dialog).toBeVisible();
  });

  await test.step('Шаг 3. Закрыть окно', async () => {
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });
});

import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-59 «Экспорт / Импорт», без экспорта', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let admin: Locator, dialog: Locator;

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Администрирование»', async () => {
    await page.goto(url);
    admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
    await expect(admin).toBeVisible({ timeout: 60_000 });
    await admin.click();
  });

  await test.step('Шаг 2. Нажать «Экспорт / Импорт»', async () => {
    await page.getByRole('menuitem', { name: 'Экспорт / Импорт', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Экспорт / импорт пространства' });

    // Ожидание: видны вкладки «Экспорт» и «Импорт» (экспорт не запускаем)
    await expect(dialog.getByRole('button', { name: 'Экспорт', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Импорт', exact: true })).toBeVisible();
  });

  await test.step('Шаг 3. Закрыть окно', async () => {
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });
});

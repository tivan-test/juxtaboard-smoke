import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-59 «Экспорт / Импорт», без экспорта', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона → «Администрирование»
  await page.goto(url);
  const admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
  await expect(admin).toBeVisible({ timeout: 60_000 });
  await admin.click();

  // Шаг 2. Нажать «Экспорт / Импорт»
  await page.getByRole('menuitem', { name: 'Экспорт / Импорт', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Экспорт / импорт пространства' });

  // Ожидание: видны вкладки «Экспорт» и «Импорт» (экспорт не запускаем)
  await expect(dialog.getByRole('button', { name: 'Экспорт', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Импорт', exact: true })).toBeVisible();

  // Шаг 3. Закрыть окно
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
});

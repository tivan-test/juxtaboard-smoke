import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-72 «Настройки уведомлений»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона → «Инструменты» → «Настройки уведомлений»
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await page.getByRole('banner').getByRole('button', { name: 'Инструменты' }).click();
  await page.getByRole('menuitem', { name: 'Настройки уведомлений' }).click();
  const dialog = page.getByRole('dialog', { name: 'Настройки уведомлений' });

  // Ожидание: видны «По умолчанию для этого проекта», «Мои документы», «Другие документы» (ничего не меняем)
  await expect(dialog.getByRole('button', { name: /^По умолчанию для этого проекта/ })).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'Мои документы' })).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'Другие документы' })).toBeVisible();

  // Шаг 2. Закрыть окно
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
});

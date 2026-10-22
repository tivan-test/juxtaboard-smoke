import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-50 «Внешние пользователи»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона → «Администрирование»
  await page.goto(url);
  const admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
  await expect(admin).toBeVisible({ timeout: 60_000 });
  await admin.click();

  // Шаг 2. Нажать «Внешние пользователи»
  await page.getByRole('menuitem', { name: 'Внешние пользователи', exact: true }).click();

  // Ожидание: видны вкладки «Приглашения», «Пользователи», «Группы», «Настройки» (никого не приглашаем)
  const dialog = page.getByRole('dialog', { name: `Внешние пользователи — ${name}`, exact: true });
  await expect(dialog.getByRole('tab', { name: 'Приглашения' })).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'Пользователи' })).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'Группы' })).toBeVisible();
  await expect(dialog.getByRole('tab', { name: 'Настройки' })).toBeVisible();
});

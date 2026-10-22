import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-41 «Входящие»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона
  await page.goto(url);
  const admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
  await expect(admin).toBeVisible({ timeout: 60_000 });

  // Шаг 2. Нажать «Входящие»
  await page.getByRole('banner').getByRole('link', { name: 'Входящие' }).click();

  // Ожидание 1: адрес содержит /inbox
  await expect(page).toHaveURL(/\/inbox/, { timeout: 30_000 });

  // Ожидание 2: видны кнопка «Новое сообщение» и надпись «Нет переписок»
  await expect(page.getByRole('button', { name: 'Новое сообщение' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Нет переписок')).toBeVisible();
});

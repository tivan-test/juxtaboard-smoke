import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-42 «Новое сообщение», без отправки', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона → «Входящие»
  await page.goto(url);
  const admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
  await expect(admin).toBeVisible({ timeout: 60_000 });
  await page.getByRole('banner').getByRole('link', { name: 'Входящие' }).click();

  // Шаг 2. Нажать «Новое сообщение»
  await page.getByRole('button', { name: 'Новое сообщение' }).click({ timeout: 30_000 });
  const dialog = page.getByRole('dialog', { name: 'Новое сообщение' });

  // Ожидание: в окне видны поля «Кому», «Тема», «Сообщение» и кнопка «Отправить» (ничего не отправляем)
  await expect(dialog.getByText('Кому', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Тема' })).toBeVisible();
  await expect(dialog.getByText('Сообщение', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Отправить' })).toBeVisible();

  // Шаг 3. Нажать «Отмена»
  await dialog.getByRole('button', { name: 'Отмена' }).click();
  await expect(dialog).toBeHidden();
});

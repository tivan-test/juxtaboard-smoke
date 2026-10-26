import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-53 «Входящие сообщения»', async ({ page }) => {
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

  await test.step('Шаг 2. Нажать «Входящие сообщения»', async () => {
    await page.getByRole('menuitem', { name: 'Входящие сообщения', exact: true }).click();

    // Ожидание: видны варианты подключения email, Telegram, MAX, WhatsApp (ничего не подключаем)
    dialog = page.getByRole('dialog', { name: `Входящие сообщения — ${name}`, exact: true });
    await expect(dialog.getByRole('button', { name: 'Добавить email-адрес' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Добавить Telegram-бота' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Добавить MAX-бота' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Добавить номер WhatsApp' })).toBeVisible();
  });
});

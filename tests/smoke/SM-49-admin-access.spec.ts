import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-49 «Пользователи и права»', async ({ page }) => {
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

  await test.step('Шаг 2. Нажать «Пользователи и права»', async () => {
    await page.getByRole('menuitem', { name: 'Пользователи и права', exact: true }).click();

    // Ожидание: открылось окно «Управление доступом» с вкладками «Пользователи», «Пригласить участников», «Группы», «Права групп»
    dialog = page.getByRole('dialog', { name: `Управление доступом — ${name}`, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Пользователи', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Пригласить участников', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Группы', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Права групп', exact: true })).toBeVisible();
  });
});

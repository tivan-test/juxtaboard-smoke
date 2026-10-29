import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-47 «Администрирование»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let admin: Locator, menu: Locator;

  await test.step('Шаг 1. Открыть навигатор пространства прогона', async () => {
    await page.goto(url);
    admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
    await expect(admin).toBeVisible({ timeout: 60_000 });
  });

  await test.step('Шаг 2. Нажать «Администрирование»', async () => {
    await admin.click();

    // Ожидание: видны «Редактировать», «Журнал изменений», «Журнал изменений данных», «Удалить проект» (ничего не нажимаем)
    menu = page.getByRole('menu', { name: 'Администрирование' });
    await expect(menu.getByRole('menuitem', { name: 'Редактировать', exact: true })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Журнал изменений', exact: true })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Журнал изменений данных', exact: true })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Удалить проект', exact: true })).toBeVisible();
  });
});

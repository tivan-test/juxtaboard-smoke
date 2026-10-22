import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-47 «Администрирование»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона
  await page.goto(url);
  const admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
  await expect(admin).toBeVisible({ timeout: 60_000 });

  // Шаг 2. Нажать «Администрирование»
  await admin.click();

  // Ожидание: видны «Редактировать», «Журнал изменений», «Журнал изменений данных», «Удалить пространство» (ничего не нажимаем)
  const menu = page.getByRole('menu', { name: 'Администрирование' });
  await expect(menu.getByRole('menuitem', { name: 'Редактировать', exact: true })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Журнал изменений', exact: true })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Журнал изменений данных', exact: true })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Удалить пространство', exact: true })).toBeVisible();
});

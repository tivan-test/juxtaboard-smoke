import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-57 «Журнал изменений»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона → «Администрирование»
  await page.goto(url);
  const admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
  await expect(admin).toBeVisible({ timeout: 60_000 });
  await admin.click();

  // Шаг 2. Нажать «Журнал изменений»
  await page.getByRole('menuitem', { name: 'Журнал изменений', exact: true }).click();

  // Ожидание: открылся раздел «Журнал изменений» с фильтрами
  await expect(page.getByRole('main').getByText('Журнал изменений', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Поиск по названию документа…' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Всё время' })).toBeVisible();
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-51 «Внешние порталы»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона → «Администрирование»
  await page.goto(url);
  const admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
  await expect(admin).toBeVisible({ timeout: 60_000 });
  await admin.click();

  // Шаг 2. Нажать «Внешние порталы»
  await page.getByRole('menuitem', { name: 'Внешние порталы', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `Внешний портал — ${name}`, exact: true });

  // Ожидание 1: на вкладке «Обзор» видно «URL ПОРТАЛА» (заглавными буквы делает оформление, в тексте «URL портала»)
  await expect(dialog.getByText(/^URL портала$/i)).toBeVisible();

  // Шаг 3. Открыть вкладку «Настройки CORS»
  await dialog.getByRole('button', { name: 'Настройки CORS' }).click();

  // Ожидание 2: видно «Разрешённые источники (CORS)»
  await expect(dialog.getByText('Разрешённые источники (CORS)')).toBeVisible();

  // Шаг 4. Открыть вкладку «Письмо для входа»
  await dialog.getByRole('button', { name: 'Письмо для входа' }).click();

  // Ожидание 3: видно «Отображаемое название»
  await expect(dialog.getByText('Отображаемое название')).toBeVisible();
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-70 «Сборка из модулей», без установки', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона → «Структуры проекта» → «Сборка из модулей»
  // («Установить выбранные» не нажимаем: создаёт таблицы без префикса TEST_)
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await page.getByRole('banner').getByRole('button', { name: 'Структуры проекта' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Сборка из модулей' }).click();
  const dialog = page.getByRole('dialog', { name: 'Сборка из модулей' });

  // Ожидание 1: на вкладке «По типу бизнеса» видны категории, например «КРАСОТА И УХОД»
  // (заглавными буквы делает оформление, в тексте «Красота и уход»)
  await expect(dialog.getByText(/^Красота и уход$/i)).toBeVisible();

  // Шаг 2. Открыть вкладку «По модулям»
  await dialog.getByRole('button', { name: 'По модулям' }).click();

  // Ожидание 2: виден модуль «Воронка продаж (CRM)»
  await expect(dialog.getByText('Воронка продаж (CRM)')).toBeVisible();

  // Шаг 3. Нажать «Отмена»
  await dialog.getByRole('button', { name: 'Отмена' }).click();
  await expect(dialog).toBeHidden();
});

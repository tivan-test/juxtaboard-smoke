import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-70 «Сборка из модулей», без установки', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let dialog: Locator;

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Структуры проекта» → «Сборка из модулей»', async () => {
    // («Установить выбранные» не нажимаем: создаёт таблицы без префикса TEST_)
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('banner').getByRole('button', { name: 'Структуры проекта' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Сборка из модулей' }).click();
    dialog = page.getByRole('dialog', { name: 'Сборка из модулей' });

    // Ожидание 1: на вкладке «По типу бизнеса» видны категории, например «КРАСОТА И УХОД»
    // (заглавными буквы делает оформление, в тексте «Красота и уход»)
    await expect(dialog.getByText(/^Красота и уход$/i)).toBeVisible();
  });

  await test.step('Шаг 2. Открыть вкладку «По модулям»', async () => {
    await dialog.getByRole('button', { name: 'По модулям' }).click();

    // Ожидание 2: виден модуль «Воронка продаж (CRM)»
    await expect(dialog.getByText('Воронка продаж (CRM)')).toBeVisible();
  });

  await test.step('Шаг 3. Нажать «Отмена»', async () => {
    await dialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(dialog).toBeHidden();
  });
});

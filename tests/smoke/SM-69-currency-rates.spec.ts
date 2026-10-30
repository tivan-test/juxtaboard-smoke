import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-69 «Курсы валют», только открыть', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let dialog: Locator;

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Структуры проекта» → «Курсы валют»', async () => {
    // (кнопку «Создать таблицу курсов валют» не нажимаем: она создаёт таблицу без префикса TEST_)
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('banner').getByRole('button', { name: 'Структуры проекта' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Курсы валют' }).click();
    dialog = page.getByRole('dialog', { name: 'Курсы валют' });

    // Ожидание 1: видны вкладки «Курсы» и «Настройки»
    await expect(dialog.getByRole('tab', { name: 'Курсы' })).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'Настройки' })).toBeVisible();
  });

  await test.step('Шаг 2. Открыть вкладку «Настройки»', async () => {
    await dialog.getByRole('tab', { name: 'Настройки' }).click();

    // Ожидание 2: видно «Базовая валюта»
    await expect(dialog.getByText('Базовая валюта')).toBeVisible();
  });

  await test.step('Шаг 3. Закрыть окно', async () => {
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });
});

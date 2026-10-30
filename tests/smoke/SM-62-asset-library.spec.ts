import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-62 Библиотека ресурсов', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Структуры проекта» → «Библиотека ресурсов»', async () => {
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('banner').getByRole('button', { name: 'Структуры проекта' }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Библиотека ресурсов' }).click();

    // Ожидание 1: адрес содержит /assets, видны кнопки «Загрузить» и «Неиспользуемые»
    await expect(page).toHaveURL(/\/assets/, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Загрузить' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Неиспользуемые' })).toBeVisible();
  });

  await test.step('Шаг 2. Нажать «Проверить сроки»', async () => {
    await page.getByRole('button', { name: 'Проверить сроки' }).click();

    // Ожидание 2: уведомление «Истёкших ресурсов не найдено»
    await expect(page.getByText('Истёкших ресурсов не найдено')).toBeVisible();
  });
});

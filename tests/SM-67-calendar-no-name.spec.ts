import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-67 Рабочий календарь без названия', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Структуры проекта» → «Рабочие календари»', async () => {
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('banner').getByRole('button', { name: 'Структуры проекта' }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Рабочие календари' }).click();
  });

  await test.step('Шаг 2. Нажать «Новый календарь»', async () => {
    await page.getByRole('button', { name: 'Новый календарь' }).click({ timeout: 30_000 });
  });

  await test.step('Шаг 3. Нажать «Сохранить»', async () => {
    await page.getByRole('button', { name: 'Сохранить' }).click();

    // Ожидание: видно «Укажите название»
    await expect(page.getByText('Укажите название')).toBeVisible();
  });
});

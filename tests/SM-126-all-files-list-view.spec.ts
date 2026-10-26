import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-126 «Список»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Все файлы»', async () => {
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    await panel.getByRole('button', { name: 'Все файлы' }).click();
  });

  await test.step('Шаг 2. Нажать «Список»', async () => {
    await panel.getByRole('button', { name: 'Список', exact: true }).click();

    // Ожидание 1: видны столбцы «Название», «Теги», «Создан», «Изменён», «Состояние»
    for (const column of ['Название', 'Теги', 'Создан', 'Изменён', 'Состояние']) {
      await expect(panel.getByRole('columnheader', { name: column, exact: true })).toBeVisible();
    }
  });

  await test.step('Шаг 3. Нажать «Плитки»', async () => {
    await panel.getByRole('button', { name: 'Плитки', exact: true }).click();

    // Ожидание 2: столбцов нет, снова карточки (кнопка снова «Список»)
    await expect(panel.getByRole('columnheader')).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Список', exact: true })).toBeVisible();
  });
});

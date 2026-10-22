import { test, expect } from '@playwright/test';

test('SM-27 «Мои задачи»', async ({ page }) => {
  // Шаг 1. Открыть /projects
  await page.goto('/projects');

  // Шаг 2. Нажать «Мои задачи»
  await page.getByRole('banner').getByRole('link', { name: 'Мои задачи' }).click({ timeout: 60_000 });

  // Ожидание 1: адрес /me/work
  await expect(page).toHaveURL(/\/me\/work/);

  // Ожидание 2: виден заголовок «Задачи и комментарии» (на странице это надпись без роли заголовка)
  await expect(page.getByText('Задачи и комментарии', { exact: true })).toBeVisible({ timeout: 30_000 });

  // Ожидание 3: видны вкладки «Назначено мне», «Запрошено мной», «Наблюдаю» (в названии вкладки ещё и счётчик)
  await expect(page.getByRole('button', { name: /^Назначено мне/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Запрошено мной/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Наблюдаю/ })).toBeVisible();
});

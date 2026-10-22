import { test, expect } from '@playwright/test';

test('SM-05 Логотип возвращает к началу', async ({ page }) => {
  // Шаг 1. Открыть /projects
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Пространства', exact: true })).toBeVisible({ timeout: 60_000 });

  // Шаг 2. Прокрутить страницу вниз до конца
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY), { message: 'страница прокрутилась вниз' }).toBeGreaterThan(0);

  // Ожидание 1: шапка видна
  await expect(page.getByRole('banner')).toBeInViewport();

  // Шаг 3. Нажать логотип JB в шапке
  await page.getByRole('banner').getByRole('link', { name: 'JB Juxtaboard' }).click();

  // Ожидание 2: страница в самом начале, адрес /projects
  await expect.poll(() => page.evaluate(() => window.scrollY), { message: 'страница вернулась в начало' }).toBe(0);
  await expect(page).toHaveURL(/\/projects$/);
});

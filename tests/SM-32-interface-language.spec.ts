import { test, expect } from '@playwright/test';

test('SM-32 Язык EN и возврат на RU', async ({ page }) => {
  const profileButton = page.getByRole('banner').getByRole('button', { name: 'AT', exact: true });
  const menu = page.getByRole('dialog');
  const pageTitle = page.getByRole('main').getByRole('heading', { level: 1 });

  // Шаг 1. Открыть /projects → кнопка профиля
  await page.goto('/projects');
  await expect(pageTitle).toHaveText('Пространства', { timeout: 60_000 });
  await profileButton.click();

  // Шаг 2. В «Язык интерфейса» выбрать «EN»
  await menu.getByRole('button', { name: 'EN', exact: true }).click();

  // Ожидание 1: заголовок «Пространства» сменился английским
  await expect(pageTitle).toHaveText(/^[A-Za-z ]+$/);

  // Шаг 3. Кнопка профиля → «Язык интерфейса» → «RU»
  await page.keyboard.press('Escape');
  await profileButton.click();
  await menu.getByRole('button', { name: 'RU', exact: true }).click();

  // Ожидание 2: снова виден заголовок «Пространства»
  await expect(pageTitle).toHaveText('Пространства');
});

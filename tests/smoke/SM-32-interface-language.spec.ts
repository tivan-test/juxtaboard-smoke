import { test, expect } from '@playwright/test';

test('SM-32 Язык EN и возврат на RU', async ({ page }) => {
  const profileButton = page.getByRole('banner').getByRole('button', { name: 'AT', exact: true });
  const menu = page.getByRole('dialog');
  const pageTitle = page.getByRole('main').getByRole('heading', { level: 1 });

  await test.step('Шаг 1. Открыть /projects → кнопка профиля', async () => {
    await page.goto('/projects');
    await expect(pageTitle).toHaveText('Проекты', { timeout: 60_000 });
    await profileButton.click();
  });

  await test.step('Шаг 2. В «Язык интерфейса» выбрать «EN»', async () => {
    // На кнопках видно «EN» и «RU», а их доступные имена — «English» и «Русский»
    await menu.getByRole('button', { name: 'English', exact: true }).click();

    // Ожидание 1: заголовок «Проекты» сменился английским
    await expect(pageTitle).toHaveText(/^[A-Za-z ]+$/);
  });

  await test.step('Шаг 3. Кнопка профиля → «Язык интерфейса» → «RU»', async () => {
    await page.keyboard.press('Escape');
    await profileButton.click();
    await menu.getByRole('button', { name: 'Русский', exact: true }).click();

    // Ожидание 2: снова виден заголовок «Проекты»
    await expect(pageTitle).toHaveText('Проекты');
  });
});

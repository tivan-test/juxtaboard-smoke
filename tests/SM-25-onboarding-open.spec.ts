import { test, expect } from '@playwright/test';

test('SM-25 «Пошаговая настройка»', async ({ page }) => {
  await test.step('Шаг 1. Открыть /projects', async () => {
    await page.goto('/projects');
  });

  await test.step('Шаг 2. Нажать «Добавить проект»', async () => {
    await page.getByRole('banner').getByRole('button', { name: 'Добавить проект' }).click({ timeout: 60_000 });
  });

  await test.step('Шаг 3. Нажать «Пошаговая настройка»', async () => {
    await page.getByRole('dialog', { name: 'Добавить проект' }).getByRole('button', { name: /^Пошаговая настройка/ }).click();

    // Ожидание 1: адрес /projects?onboarding=1
    await expect(page).toHaveURL(/\/projects\?onboarding=1$/);

    // Ожидание 2: видно «С чего хотите начать?»
    await expect(page.getByRole('heading', { name: 'С чего хотите начать?' })).toBeVisible();
  });
});

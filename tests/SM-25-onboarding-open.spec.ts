import { test, expect } from '@playwright/test';

test('SM-25 «Пошаговая настройка»', async ({ page }) => {
  // Шаг 1. Открыть /projects
  await page.goto('/projects');

  // Шаг 2. Нажать «Добавить пространство»
  await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click({ timeout: 60_000 });

  // Шаг 3. Нажать «Пошаговая настройка»
  await page.getByRole('dialog', { name: 'Добавить пространство' }).getByRole('button', { name: /^Пошаговая настройка/ }).click();

  // Ожидание 1: адрес /projects?onboarding=1
  await expect(page).toHaveURL(/\/projects\?onboarding=1$/);

  // Ожидание 2: видно «С чего хотите начать?»
  await expect(page.getByRole('heading', { name: 'С чего хотите начать?' })).toBeVisible();
});

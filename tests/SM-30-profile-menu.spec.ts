import { test, expect } from '@playwright/test';

test('SM-30 Меню профиля', async ({ page }) => {
  // Шаг 1. Открыть /projects
  await page.goto('/projects');

  // Шаг 2. Нажать кнопку профиля (инициалы справа вверху)
  await page.getByRole('banner').getByRole('button', { name: 'AT', exact: true }).click({ timeout: 60_000 });
  const menu = page.getByRole('dialog');

  // Ожидание 1: видна почта аккаунта из .env
  await expect(menu.getByText(process.env.JB_EMAIL!, { exact: true })).toBeVisible();

  // Ожидание 2: видны пункты меню (ни один не нажимаем)
  await expect(menu.getByText('Оформление', { exact: true })).toBeVisible();
  await expect(menu.getByText('Язык интерфейса', { exact: true })).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Оплата и использование' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Редактировать профиль' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Подключить внешний агент' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Сменить пароль' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Выйти' })).toBeVisible();
});

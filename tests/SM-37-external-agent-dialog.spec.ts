import { test, expect } from '@playwright/test';

test('SM-37 «Подключить внешний агент», только открыть', async ({ page }) => {
  // Шаг 1. Открыть /projects → кнопка профиля
  await page.goto('/projects');
  await page.getByRole('banner').getByRole('button', { name: 'AT', exact: true }).click({ timeout: 60_000 });

  // Шаг 2. Нажать «Подключить внешний агент»
  await page.getByRole('button', { name: 'Подключить внешний агент' }).click();
  const dialog = page.getByRole('dialog', { name: 'Подключить внешний агент' });

  // Ожидание 1: кнопка «Создать токен» неактивна (токен не создаём)
  await expect(dialog.getByRole('button', { name: 'Создать токен' })).toBeDisabled();

  // Ожидание 2: видны вкладки «Claude Code», «OpenAI Codex», «Промпты для агентов»
  await expect(dialog.getByRole('button', { name: 'Claude Code', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'OpenAI Codex', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Промпты для агентов', exact: true })).toBeVisible();

  // Шаг 3. Закрыть окно
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
});

import { test, expect } from '@playwright/test';
import { activeSpaces } from './support/projects';

test('SM-03 Главный экран', async ({ page }) => {
  // Шаг 1. Открыть /projects
  await page.goto('/projects');

  // Ожидание 1: виден заголовок «Пространства»
  await expect(page.getByRole('heading', { name: 'Пространства', exact: true })).toBeVisible({ timeout: 60_000 });

  // Ожидание 2: видны надписи «Активных пространств» и «Скрытых пространств»
  await expect(page.getByRole('link', { name: /^Активных пространств/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Скрытых пространств/ })).toBeVisible();

  // Ожидание 3: видно поле поиска «Название пространства или документа…»
  await expect(page.getByRole('textbox', { name: 'Название пространства или документа…' })).toBeVisible();

  // Ожидание 4: на карточках видны кнопки «Навигатор», «Схема», «Автоматизации»
  // («Схема» и «Автоматизации» есть только на карточках, где пользователь владелец)
  for (const name of ['Навигатор', 'Схема', 'Автоматизации']) {
    const buttons = activeSpaces(page).getByRole('button', { name, exact: true });
    await expect(buttons, `на карточках есть «${name}»`).not.toHaveCount(0);
    for (const button of await buttons.all()) await expect(button).toBeVisible();
  }
});

import { test, expect } from '@playwright/test';
import { activeSpaces } from '../support/projects';

test('SM-03 Главный экран', async ({ page }) => {
  await test.step('Шаг 1. Открыть /projects', async () => {
    await page.goto('/projects');

    // Ожидание 1: виден заголовок «Проекты»
    await expect(page.getByRole('heading', { name: 'Проекты', exact: true })).toBeVisible({ timeout: 60_000 });

    // Ожидание 2: видны надписи «Активных проектов» и «Скрытых проектов»
    await expect(page.getByRole('link', { name: /^Активных проектов/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Скрытых проектов/ })).toBeVisible();

    // Ожидание 3: видно поле поиска «Название проекта или документа…»
    await expect(page.getByRole('textbox', { name: 'Название проекта или документа…' })).toBeVisible();

    // Ожидание 4: на карточках видны кнопки «Навигатор», «Схема», «Автоматизации»
    // («Схема» и «Автоматизации» есть только на карточках, где пользователь владелец)
    for (const name of ['Навигатор', 'Схема', 'Автоматизации']) {
      const buttons = activeSpaces(page).getByRole('button', { name, exact: true });
      await expect(buttons, `на карточках есть «${name}»`).not.toHaveCount(0);
      for (const button of await buttons.all()) await expect(button).toBeVisible();
    }
  });
});

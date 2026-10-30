import { test, expect } from '@playwright/test';

test('SM-26 «Смотреть примеры»', async ({ page }) => {
  await test.step('Шаг 1. Открыть /projects → «Добавить проект» → «Пошаговая настройка»', async () => {
    await page.goto('/projects');
    await page.getByRole('banner').getByRole('button', { name: 'Добавить проект' }).click({ timeout: 60_000 });
    await page.getByRole('dialog', { name: 'Добавить проект' }).getByRole('button', { name: /^Пошаговая настройка/ }).click();
  });

  await test.step('Шаг 2. Нажать «Смотреть примеры»', async () => {
    await page.getByRole('button', { name: /Смотреть примеры$/ }).click();

    // Ожидание 1: видно «Что ближе всего к вашему бизнесу?»
    await expect(page.getByRole('heading', { name: 'Что ближе всего к вашему бизнесу?' })).toBeVisible();

    // Ожидание 2: видна карточка «Legereco Beans Co» (пример только для чтения, не открываем)
    await expect(page.getByRole('heading', { name: 'Legereco Beans Co', level: 3 })).toBeVisible();
  });
});

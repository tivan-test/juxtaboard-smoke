import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-34 Переход из оплаты в проект', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let paidProjects;

  await test.step('Шаг 1. Открыть /account/billing', async () => {
    await page.goto('/account/billing');
    paidProjects = page.getByRole('list', { name: 'Проекты, которые вы оплачиваете' });
  });

  await test.step('Шаг 2. В «Проекты, которые вы оплачиваете» нажать пространство прогона', async () => {
    await paidProjects.getByRole('link', { name, exact: true }).click({ timeout: 60_000 });

    // Ожидание 1: открылся навигатор пространства прогона
    // Адрес навигатора может дополняться параметрами (?explorerMode=docs), поэтому сравниваем начало адреса
    await expect(page).toHaveURL(new RegExp(`^${url.replace(/[.?]/g, '\\$&')}`));
    await expect(page.getByRole('button', { name: 'Сменить пространство' }).filter({ hasText: name })).toBeVisible({ timeout: 60_000 });
  });

  await test.step('Шаг 3. Нажать «Назад» в браузере', async () => {
    await page.goBack();

    // Ожидание 2: адрес /account/billing
    await expect(page).toHaveURL(/\/account\/billing/);
  });
});

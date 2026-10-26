import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-38 «Сменить пространство»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await test.step('Шаг 1. Открыть навигатор пространства прогона', async () => {
    await page.goto(url);
  });

  await test.step('Шаг 2. Нажать «Сменить пространство»', async () => {
    await page.getByRole('button', { name: 'Сменить пространство' }).filter({ hasText: name }).click({ timeout: 60_000 });

    // Ожидание: открылся список пространств с поиском, в нём есть пространство прогона
    await expect(page.getByRole('textbox', { name: 'Фильтр по имени или #тегу…' })).toBeVisible();
    await expect(page.getByRole('listbox').getByRole('option', { name, exact: true })).toBeVisible();
  });
});

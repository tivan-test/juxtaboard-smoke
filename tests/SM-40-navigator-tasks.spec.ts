import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-40 «Задачи» в шапке навигатора', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона
  await page.goto(url);

  // Шаг 2. Нажать «Задачи»
  await page.getByRole('banner').getByRole('button', { name: 'Задачи', exact: true }).click({ timeout: 60_000 });

  // Ожидание: открылась панель «Задачи и комментарии»
  await expect(page.getByText('Задачи и комментарии', { exact: true })).toBeVisible();
});

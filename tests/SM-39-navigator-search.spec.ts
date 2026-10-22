import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-39 «Поиск» в шапке навигатора', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона
  await page.goto(url);

  // Шаг 2. Нажать «Поиск»
  await page.getByRole('banner').getByRole('button', { name: 'Поиск', exact: true }).click({ timeout: 60_000 });

  // Ожидание: видно поле «Поиск документов…»
  await expect(page.getByPlaceholder('Поиск документов…')).toBeVisible();
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-07 Поиск пространства', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть /projects
  await page.goto('/projects');
  const search = page.getByRole('textbox', { name: 'Название пространства или документа…' });
  await expect(search).toBeVisible({ timeout: 60_000 });

  // Шаг 2. Ввести в поиск название пространства прогона
  await search.fill(name);

  // Ожидание: в группе «Пространства» есть пространство прогона
  const spacesGroup = page.getByRole('list', { name: 'Пространства' });
  await expect(spacesGroup.getByRole('link', { name: new RegExp(`^${name} `) })).toBeVisible({ timeout: 30_000 });
});

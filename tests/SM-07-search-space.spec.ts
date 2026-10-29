import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-07 Поиск пространства', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let search: Locator, spacesGroup: Locator;

  await test.step('Шаг 1. Открыть /projects', async () => {
    await page.goto('/projects');
    search = page.getByRole('textbox', { name: 'Название проекта или документа…' });
    await expect(search).toBeVisible({ timeout: 60_000 });
  });

  await test.step('Шаг 2. Ввести в поиск название пространства прогона', async () => {
    await search.fill(name);

    // Ожидание: в группе «Проекты» есть пространство прогона
    spacesGroup = page.getByRole('list', { name: 'Проекты' });
    await expect(spacesGroup.getByRole('link', { name: new RegExp(`^${name} `) })).toBeVisible({ timeout: 30_000 });
  });
});

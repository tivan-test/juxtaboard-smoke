import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { setUpDataTable } from './support/data-table';
import { activeSpaces, spaceCard } from './support/projects';

test('SM-99 «Схема» с таблицей', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await test.step('Предусловие (SM-85, SM-86): создать свою таблицу TEST_SM99_Таблица со столбцом «Название»', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM99_Таблица', withTitleColumn: true });
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let card, tableCard;

  await test.step('Шаг 1. Открыть /projects, «Показать ещё»', async () => {
    await page.goto('/projects');
    await page.getByRole('button', { name: /^Показать ещё/ }).click({ timeout: 60_000 });
  });

  await test.step('Шаг 2. На карточке пространства прогона нажать «Схема»', async () => {
    card = spaceCard(activeSpaces(page), name);
    await card.getByRole('link', { name: 'Схема' }).click();

    // Ожидание: видна карточка «TEST_SM99_Таблица» с полем «Название»
    // Карточка таблицы на схеме — group внутри области схемы (application)
    tableCard = page.getByRole('application').getByRole('group').filter({ hasText: 'TEST_SM99_Таблица' });
    await expect(tableCard).toBeVisible({ timeout: 60_000 });
    await expect(tableCard.getByRole('listitem').filter({ hasText: 'Название' })).toBeVisible();
  });
});

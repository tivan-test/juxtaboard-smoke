import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { activeSpaces, openSpaceCardActions, spaceCard } from './support/projects';

test('SM-13 Меню ⋯ пространства', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let menu;

  await test.step('Шаг 1. Открыть /projects и нажать «Показать ещё»', async () => {
    await page.goto('/projects');
    await page.getByRole('button', { name: /^Показать ещё/ }).click({ timeout: 60_000 });
  });

  await test.step('Шаг 2. Навести на карточку пространства прогона и нажать ⋯', async () => {
    await openSpaceCardActions(spaceCard(activeSpaces(page), name));

    // Ожидание: в меню есть «Редактировать», «Пользователи и права», «Скрыть из моего списка», «Удалить пространство»
    menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem', { name: 'Редактировать', exact: true })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Пользователи и права', exact: true })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Скрыть из моего списка', exact: true })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Удалить пространство', exact: true })).toBeVisible();
  });
});

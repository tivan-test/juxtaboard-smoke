import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { activeSpaces, spaceCard } from '../support/projects';

test('SM-14 «+» у участников → «Управление доступом»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let card: Locator, dialog: Locator;

  await test.step('Шаг 1. Открыть /projects и нажать «Показать ещё»', async () => {
    await page.goto('/projects');
    await page.getByRole('button', { name: /^Показать ещё/ }).click({ timeout: 60_000 });
  });

  await test.step('Шаг 2. На карточке пространства прогона нажать «+» рядом с участниками', async () => {
    card = spaceCard(activeSpaces(page), name);
    await card.getByRole('button', { name: 'Пользователи и права' }).click();

    // Ожидание 1: открылось окно «Управление доступом — <название пространства прогона>»
    dialog = page.getByRole('dialog', { name: `Управление доступом — ${name}`, exact: true });
    await expect(dialog).toBeVisible();

    // Ожидание 2: видны вкладки «Пользователи», «Пригласить участников», «Группы», «Права групп»
    await expect(dialog.getByRole('button', { name: 'Пользователи', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Пригласить участников', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Группы', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Права групп', exact: true })).toBeVisible();
  });
});

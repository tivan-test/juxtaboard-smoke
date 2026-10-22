import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-14 «+» у участников → «Управление доступом»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть /projects и нажать «Показать ещё»
  await page.goto('/projects');
  await page.getByRole('button', { name: /^Показать ещё/ }).click({ timeout: 60_000 });

  // Шаг 2. На карточке пространства прогона нажать «+» рядом с участниками (у «+» название «Пользователи и права»)
  const card = page.locator('#active-spaces [data-slot="card"]').filter({ has: page.getByRole('heading', { name, exact: true }) });
  await card.getByRole('button', { name: 'Пользователи и права' }).click();

  // Ожидание 1: открылось окно «Управление доступом — <название пространства прогона>»
  const dialog = page.getByRole('dialog', { name: `Управление доступом — ${name}`, exact: true });
  await expect(dialog).toBeVisible();

  // Ожидание 2: видны вкладки «Пользователи», «Пригласить участников», «Группы», «Права групп»
  await expect(dialog.getByRole('button', { name: 'Пользователи', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Пригласить участников', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Группы', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Права групп', exact: true })).toBeVisible();
});

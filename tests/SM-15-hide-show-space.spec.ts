import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-15 Скрыть и показать пространство', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const runSpaceTitle = page.getByRole('heading', { name, exact: true });
  const active = page.locator('#active-spaces');
  const hidden = page.locator('#hidden-spaces');

  // Шаг 1. Открыть /projects, нажать «Показать ещё»
  await page.goto('/projects');
  await page.getByRole('button', { name: /^Показать ещё/ }).click({ timeout: 60_000 });

  // Шаг 2. ⋯ на карточке пространства прогона → «Скрыть из моего списка»
  // У ⋯ нет названия, это единственная кнопка с выпадающим меню на карточке
  const activeCard = active.locator('[data-slot="card"]').filter({ has: runSpaceTitle });
  await activeCard.hover();
  await activeCard.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Скрыть из моего списка', exact: true }).click();

  // Ожидание 1: карточки нет среди активных (раздел скрытых свёрнут)
  await expect(active.getByRole('heading', { name, exact: true })).toHaveCount(0);

  // Шаг 3. Раскрыть «Скрытые пространства»
  await page.getByRole('button', { name: /^Скрытые пространства/ }).click();

  // Ожидание 2: карточка есть среди скрытых
  const hiddenCard = hidden.locator('[data-slot="card"]').filter({ has: runSpaceTitle });
  await expect(hiddenCard).toBeVisible();

  // Шаг 4. ⋯ на карточке пространства прогона в скрытых → «Показать в моём списке»
  await hiddenCard.hover();
  await hiddenCard.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Показать в моём списке', exact: true }).click();

  // Ожидание 3: карточка снова среди активных
  await expect(hidden.getByRole('heading', { name, exact: true })).toHaveCount(0);
  await expect(activeCard).toBeVisible();
});

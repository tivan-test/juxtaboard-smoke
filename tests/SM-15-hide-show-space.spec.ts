import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { activeSpaces, hiddenSpaces, openSpaceCardActions, spaceCard } from './support/projects';

test('SM-15 Скрыть и показать пространство', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const active = activeSpaces(page);
  const hidden = hiddenSpaces(page);

  // Шаг 1. Открыть /projects, нажать «Показать ещё»
  await page.goto('/projects');
  await page.getByRole('button', { name: /^Показать ещё/ }).click({ timeout: 60_000 });

  // Шаг 2. ⋯ («Действия») на карточке пространства прогона → «Скрыть из моего списка»
  const activeCard = spaceCard(active, name);
  await openSpaceCardActions(activeCard);
  await page.getByRole('menuitem', { name: 'Скрыть из моего списка', exact: true }).click();

  // Ожидание 1: карточки нет среди активных (раздел скрытых свёрнут)
  await expect(active.getByRole('heading', { name, exact: true })).toHaveCount(0);

  // Шаг 3. Раскрыть «Скрытые пространства»
  await page.getByRole('button', { name: /^Скрытые пространства/ }).click();

  // Ожидание 2: карточка есть среди скрытых
  const hiddenCard = spaceCard(hidden, name);
  await expect(hiddenCard).toBeVisible();

  // Шаг 4. ⋯ на карточке пространства прогона в скрытых → «Показать в моём списке»
  await openSpaceCardActions(hiddenCard);
  await page.getByRole('menuitem', { name: 'Показать в моём списке', exact: true }).click();

  // Ожидание 3: карточка снова среди активных
  await expect(hidden.getByRole('heading', { name, exact: true })).toHaveCount(0);
  await expect(activeCard).toBeVisible();
});

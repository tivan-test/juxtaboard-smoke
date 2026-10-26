import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { activeSpaces, hiddenSpaces, openSpaceCardActions, spaceCard } from './support/projects';

test('SM-15 Скрыть и показать пространство', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const active = activeSpaces(page);
  const hidden = hiddenSpaces(page);

  // Объявлено до шагов, потому что используется в нескольких шагах
  let activeCard: Locator, hiddenCard: Locator;

  await test.step('Шаг 1. Открыть /projects, нажать «Показать ещё»', async () => {
    await page.goto('/projects');
    await page.getByRole('button', { name: /^Показать ещё/ }).click({ timeout: 60_000 });
  });

  await test.step('Шаг 2. ⋯ на карточке пространства прогона → «Скрыть из моего списка»', async () => {
    activeCard = spaceCard(active, name);
    await openSpaceCardActions(activeCard);
    await page.getByRole('menuitem', { name: 'Скрыть из моего списка', exact: true }).click();

    // Ожидание 1: карточки нет среди активных (раздел скрытых свёрнут)
    await expect(active.getByRole('heading', { name, exact: true })).toHaveCount(0);
  });

  await test.step('Шаг 3. Раскрыть «Скрытые пространства»', async () => {
    await page.getByRole('button', { name: /^Скрытые пространства/ }).click();

    // Ожидание 2: карточка есть среди скрытых
    hiddenCard = spaceCard(hidden, name);
    await expect(hiddenCard).toBeVisible();
  });

  await test.step('Шаг 4. ⋯ на карточке пространства прогона в скрытых → «Показать в моём списке»', async () => {
    await openSpaceCardActions(hiddenCard);
    await page.getByRole('menuitem', { name: 'Показать в моём списке', exact: true }).click();

    // Ожидание 3: карточка снова среди активных
    await expect(hidden.getByRole('heading', { name, exact: true })).toHaveCount(0);
    await expect(activeCard).toBeVisible();
  });
});

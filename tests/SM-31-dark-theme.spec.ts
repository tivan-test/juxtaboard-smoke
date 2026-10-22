import { test, expect } from '@playwright/test';

test('SM-31 Тёмная тема и возврат', async ({ page }) => {
  const profileButton = page.getByRole('banner').getByRole('button', { name: 'AT', exact: true });
  const menu = page.getByRole('dialog');
  const themes = ['Системная', 'Светлая', 'Тёмная'];
  // Тему страницы видно по свойству color-scheme у <html>
  const html = page.locator('html');

  // Шаг 1. Открыть /projects → кнопка профиля, запомнить выбранную тему в «Оформление»
  await page.goto('/projects');
  await profileButton.click({ timeout: 60_000 });
  await expect(menu.getByRole('button', { name: 'Тёмная' })).toBeVisible();
  const pressed = await menu.getByRole('button', { pressed: true }).allTextContents();
  const originalTheme = pressed.find((t) => themes.includes(t))!;

  // Шаг 2. В «Оформление» выбрать «Тёмная»
  await menu.getByRole('button', { name: 'Тёмная' }).click();

  // Ожидание 1: страница в тёмной теме
  await expect(html).toHaveCSS('color-scheme', 'dark');

  // Шаг 3. Перезагрузить страницу
  await page.reload();

  // Ожидание 2: страница в тёмной теме
  await expect(page.getByRole('heading', { name: 'Пространства', exact: true })).toBeVisible({ timeout: 60_000 });
  await expect(html).toHaveCSS('color-scheme', 'dark');

  // Шаг 4. Кнопка профиля → «Оформление» → исходная тема из шага 1
  await profileButton.click();
  await menu.getByRole('button', { name: originalTheme, exact: true }).click();

  // Ожидание 3: в «Оформление» снова выбрана исходная тема
  await expect(menu.getByRole('button', { name: originalTheme, exact: true })).toHaveAttribute('aria-pressed', 'true');
});

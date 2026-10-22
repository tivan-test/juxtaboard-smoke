import { test as setup, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

// Создаём одно пространство прогона TEST_ГГГГММДД_ЧЧммсс (шаги 1-3 из SM-02)
// и сохраняем его название и адрес навигатора в run-space.json
setup('создание пространства прогона', async ({ page }) => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const name = `TEST_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  // Шаг 1. На странице /projects нажать «Добавить пространство»
  await page.goto('/projects');
  await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click();
  const dialog = page.getByRole('dialog', { name: 'Добавить пространство' });

  // Шаг 2. Ввести название
  await dialog.getByRole('textbox', { name: 'Название' }).fill(name);

  // Шаг 3. Нажать «Создать пустым»: открывается навигатор нового пространства
  await dialog.getByRole('button', { name: 'Создать пустым' }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+\/navigator/, { timeout: 60_000 });

  const url = page.url().split('?')[0];
  writeFileSync('run-space.json', JSON.stringify({ name, url }, null, 2) + '\n');
});

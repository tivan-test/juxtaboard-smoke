import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-112 Поиск папки с главной', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await test.step('Предусловие (SM-79): создать свою папку TEST_SM112_Папка', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «Папка», ввести «TEST_SM112_Папка», нажать Enter
    await page.getByRole('main').getByRole('button', { name: 'Папка', exact: true }).click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM112_Папка');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-folder-id]').filter({ hasText: 'TEST_SM112_Папка' })).toBeVisible();
  });

  // Шаг 1. Открыть /projects, ввести в поиск «TEST_SM112»
  await page.goto('/projects');
  const search = page.getByRole('textbox', { name: 'Название пространства или документа…' });
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.fill('TEST_SM112');

  // Ожидание 1: «TEST_SM112_Папка» в группе «Документы», под ней название пространства прогона
  // (название ссылки состоит из названия папки и названия пространства)
  const docsGroup = page.getByRole('paragraph').filter({ hasText: /^Документы$/ }).locator('xpath=following-sibling::ul');
  const result = docsGroup.getByRole('link', { name: `TEST_SM112_Папка ${name}`, exact: true });
  await expect(result).toBeVisible({ timeout: 30_000 });

  // Шаг 2. Нажать найденную «TEST_SM112_Папка»
  await result.click();

  // Ожидание 2: открылся навигатор пространства прогона, видно название «TEST_SM112_Папка»
  await expect(page).toHaveURL(/\/projects\/[^/]+\/navigator/, { timeout: 60_000 });
  await expect(page.locator('[data-folder-id]').filter({ hasText: 'TEST_SM112_Папка' })).toBeVisible({ timeout: 60_000 });
});

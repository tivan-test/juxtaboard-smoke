import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, treeItem } from '../support/navigator';

test('SM-112 Поиск папки с главной', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await test.step('Предусловие (SM-79): создать свою папку TEST_SM112_Папка', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «Папка», ввести «TEST_SM112_Папка», нажать Enter
    await navigatorButton(page, 'Папка').click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM112_Папка');
    await page.keyboard.press('Enter');
    await expect(treeItem(page, 'TEST_SM112_Папка')).toBeVisible();
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let search: Locator, docsGroup: Locator, result: Locator;

  await test.step('Шаг 1. Открыть /projects, ввести в поиск «TEST_SM112»', async () => {
    await page.goto('/projects');
    search = page.getByRole('textbox', { name: 'Название проекта или документа…' });
    await expect(search).toBeVisible({ timeout: 60_000 });
    await search.fill('TEST_SM112');

    // Ожидание 1: «TEST_SM112_Папка» в группе «Документы», под ней название пространства прогона
    // (название ссылки состоит из названия папки и названия пространства)
    docsGroup = page.getByRole('list', { name: 'Документы' });
    result = docsGroup.getByRole('link', { name: `TEST_SM112_Папка ${name}`, exact: true });
    await expect(result).toBeVisible({ timeout: 30_000 });
  });

  await test.step('Шаг 2. Нажать найденную «TEST_SM112_Папка»', async () => {
    await result.click();

    // Ожидание 2: открылся навигатор пространства прогона, видно название «TEST_SM112_Папка»
    await expect(page).toHaveURL(/\/projects\/[^/]+\/navigator/, { timeout: 60_000 });
    await expect(treeItem(page, 'TEST_SM112_Папка')).toBeVisible({ timeout: 60_000 });
  });
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-111 Поиск документа с главной', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM111_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM111_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).first().click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM111_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(page.locator('[data-document-id]').filter({ hasText: 'TEST_SM111_Текст' })).toBeVisible({ timeout: 30_000 });
  });

  // Шаг 1. Открыть /projects, ввести в поиск «TEST_SM111»
  await page.goto('/projects');
  const search = page.getByRole('textbox', { name: 'Название пространства или документа…' });
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.fill('TEST_SM111');

  // Ожидание 1: «TEST_SM111_Текст» в группе «Документы», под ним название пространства прогона
  // (название ссылки состоит из названия документа и названия пространства)
  const docsGroup = page.getByRole('paragraph').filter({ hasText: /^Документы$/ }).locator('xpath=following-sibling::ul');
  const result = docsGroup.getByRole('link', { name: `TEST_SM111_Текст ${name}`, exact: true });
  await expect(result).toBeVisible({ timeout: 30_000 });

  // Шаг 2. Нажать найденный «TEST_SM111_Текст»
  await result.click();

  // Ожидание 2: открылся документ «TEST_SM111_Текст» (в заголовке вкладки его название, виден редактор)
  await expect(page).toHaveTitle(new RegExp(`^TEST_SM111_Текст`), { timeout: 60_000 });
  // Редактор текста — область с contenteditable (ролей у неё нет)
  await expect(page.locator('[contenteditable="true"]')).toBeVisible({ timeout: 30_000 });
});

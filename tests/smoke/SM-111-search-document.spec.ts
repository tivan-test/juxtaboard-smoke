import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, treeItem } from '../support/navigator';
import { documentEditor } from '../support/editor';

test('SM-111 Поиск документа с главной', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM111_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM111_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM111_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(treeItem(page, 'TEST_SM111_Текст')).toBeVisible({ timeout: 30_000 });
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let search: Locator, docsGroup: Locator, result: Locator;

  await test.step('Шаг 1. Открыть /projects, ввести в поиск «TEST_SM111»', async () => {
    await page.goto('/projects');
    search = page.getByRole('textbox', { name: 'Название проекта или документа…' });
    await expect(search).toBeVisible({ timeout: 60_000 });
    await search.fill('TEST_SM111');

    // Ожидание 1: «TEST_SM111_Текст» в группе «Документы», под ним название пространства прогона
    // (название ссылки состоит из названия документа и названия пространства)
    docsGroup = page.getByRole('list', { name: 'Документы' });
    result = docsGroup.getByRole('link', { name: `TEST_SM111_Текст ${name}`, exact: true });
    await expect(result).toBeVisible({ timeout: 30_000 });
  });

  await test.step('Шаг 2. Нажать найденный «TEST_SM111_Текст»', async () => {
    await result.click();

    // Ожидание 2: открылся документ «TEST_SM111_Текст» (в заголовке вкладки его название, виден редактор)
    await expect(page).toHaveTitle(new RegExp(`^TEST_SM111_Текст`), { timeout: 60_000 });
    await expect(documentEditor(page)).toBeVisible({ timeout: 30_000 });
  });
});

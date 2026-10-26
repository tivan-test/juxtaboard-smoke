import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, treeItem } from './support/navigator';
import { documentEditor } from './support/editor';

test('SM-78 «Черновик» → «На согласовании»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = documentEditor(page);

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM78_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM78_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM78_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
  });

  // Шаг 1. Открыть TEST_SM78_Текст
  await treeItem(page, 'TEST_SM78_Текст').click();

  // Шаг 2. Нажать состояние «Черновик» на панели редактора, выбрать «На согласовании»
  await page.getByRole('main').getByRole('button', { name: 'Черновик', exact: true }).click();
  await page.getByRole('menuitem', { name: 'На согласовании' }).click();

  // Ожидание 1: состояние «На согласовании»
  await expect(page.getByRole('main').getByRole('button', { name: 'На согласовании', exact: true })).toBeVisible();

  // Шаг 3. Перезагрузить страницу
  await page.reload();

  // Ожидание 2: состояние «На согласовании»
  await expect(page.getByRole('main').getByRole('button', { name: 'На согласовании', exact: true })).toBeVisible({ timeout: 60_000 });
});

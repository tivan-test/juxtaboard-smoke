import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { docTree, navigatorButton, openSpace, treeFilter, treeItem } from './support/navigator';

test('SM-122 Тег при создании и фильтр #тег', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.getByRole('textbox', { name: 'Текст документа' });

  // Шаг 1. Открыть навигатор пространства прогона, нажать «+ Документ», ввести название «TEST_SM122_Тег»
  await openSpace(page, url);
  await navigatorButton(page, 'Документ').click();
  const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
  await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM122_Тег');

  // Шаг 2. В «Теги» ввести «TEST_sm122», нажать «Создать «TEST_sm122»», затем «Создать»
  await createDialog.getByRole('combobox').click();
  await page.keyboard.type('TEST_sm122');
  await page.getByRole('button', { name: 'Создать «TEST_sm122»' }).click();
  // Тег добавляется не мгновенно: без этого ожидания документ создаётся без тега
  await expect(createDialog.getByText('TEST_sm122', { exact: true })).toBeVisible();
  await createDialog.getByRole('button', { name: 'Создать', exact: true }).click();
  await expect(editor).toBeVisible({ timeout: 30_000 });

  // Шаг 3. Перезагрузить страницу
  await page.reload();

  // Шаг 4. Ввести в «Фильтр по имени или #тегу…» «#TEST_sm122»
  await treeFilter(page).fill('#TEST_sm122');

  // Ожидание: в дереве только «TEST_SM122_Тег»
  await expect(treeItem(page, 'TEST_SM122_Тег')).toBeVisible({ timeout: 60_000 });
  await expect(docTree(page).getByRole('treeitem')).toHaveCount(1);
});

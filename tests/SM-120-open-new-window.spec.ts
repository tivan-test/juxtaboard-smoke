import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, openTreeItemActions, treeItem } from './support/navigator';

test('SM-120 ⋮ → «Открыть в новом окне»', async ({ page, context }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.getByRole('textbox', { name: 'Текст документа' });
  const doc = treeItem(page, 'TEST_SM120_Текст');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM120_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM120_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM120_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(doc).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM120_Текст → «Открыть в новом окне»
  await openTreeItemActions(doc);
  const newPagePromise = context.waitForEvent('page');
  await page.getByRole('menuitem', { name: 'Открыть в новом окне' }).click();
  const newPage = await newPagePromise;

  // Ожидание: открылась новая вкладка с заголовком «TEST_SM120_Текст — <пространство прогона>»
  await expect(newPage).toHaveTitle(`TEST_SM120_Текст — ${name}`, { timeout: 60_000 });

  // Закрыть новую вкладку
  await newPage.close();
});

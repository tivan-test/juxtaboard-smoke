import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { chooseViewMode, navigatorButton, openSpace, openTreeItemActions, treeItem } from '../support/navigator';

test('SM-121 Архив и восстановление документа', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.getByRole('textbox', { name: 'Текст документа' });
  const doc = treeItem(page, 'TEST_SM121_Текст');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM121_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM121_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM121_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(doc).toBeVisible();
  });

  await test.step('Шаг 1. ⋮ у TEST_SM121_Текст → «Архивировать»', async () => {
    await openTreeItemActions(doc);
    await page.getByRole('menuitem', { name: 'Архивировать' }).click();

    // Ожидание 1: TEST_SM121_Текст нет в дереве
    await expect(doc).toHaveCount(0);
  });

  await test.step('Шаг 2. «Режимы отображения» → «Архив»', async () => {
    await chooseViewMode(page, 'Архив');

    // Ожидание 2: TEST_SM121_Текст есть в архиве
    await expect(doc).toBeVisible();
  });

  await test.step('Шаг 3. ⋮ у TEST_SM121_Текст в архиве → «Восстановить»', async () => {
    await openTreeItemActions(doc);
    await page.getByRole('menuitem', { name: 'Восстановить' }).click();
  });

  await test.step('Шаг 4. «Режимы отображения» → «Документы»', async () => {
    await chooseViewMode(page, 'Документы');

    // Ожидание 3: TEST_SM121_Текст снова в дереве
    await expect(doc).toBeVisible();
  });
});

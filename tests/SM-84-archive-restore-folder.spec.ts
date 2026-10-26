import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { childTreeItem, chooseViewMode, navigatorButton, openSpace, openTreeItemActions, treeItem, treeRow } from './support/navigator';

test('SM-84 Архив и восстановление папки', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const folder = treeItem(page, 'TEST_SM84_Папка');
  const nested = childTreeItem(folder, 'TEST_SM84_Вложенная');

  await test.step('Предусловие (SM-79, SM-82): создать свою папку TEST_SM84_Папка с вложенной TEST_SM84_Вложенная', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «Папка», ввести «TEST_SM84_Папка», нажать Enter
    await navigatorButton(page, 'Папка').click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM84_Папка');
    await page.keyboard.press('Enter');
    await expect(folder).toBeVisible();
    // Шаг 3. ⋮ у TEST_SM84_Папка → «Создать» → «Новая папка»
    await openTreeItemActions(folder);
    await page.getByRole('menuitem', { name: 'Создать' }).hover();
    await page.getByRole('menu', { name: 'Создать' }).getByRole('menuitem', { name: 'Новая папка' }).click();
    // Шаг 4. Ввести «TEST_SM84_Вложенная», нажать Enter
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM84_Вложенная');
    await page.keyboard.press('Enter');
    await expect(nested).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM84_Папка → «Архивировать»
  await openTreeItemActions(folder);
  await page.getByRole('menuitem', { name: 'Архивировать' }).click();

  // Ожидание 1: TEST_SM84_Папка нет в дереве
  await expect(folder).toHaveCount(0);

  // Шаг 2. «Режимы отображения» → «Архив»
  await chooseViewMode(page, 'Архив');

  // Ожидание 2: TEST_SM84_Папка есть в архиве
  await expect(folder).toBeVisible();

  // Шаг 3. ⋮ у TEST_SM84_Папка в архиве → «Восстановить» (только «Восстановить», «Удалить навсегда» не трогаем)
  await openTreeItemActions(folder);
  await page.getByRole('menuitem', { name: 'Восстановить' }).click();
  await expect(folder).toHaveCount(0);

  // Шаг 4. «Режимы отображения» → «Документы», раскрыть TEST_SM84_Папка (после восстановления папка свёрнута)
  await chooseViewMode(page, 'Документы');
  await expect(folder).toBeVisible();
  await treeRow(folder).getByRole('button', { name: 'Развернуть' }).click();

  // Ожидание 3: TEST_SM84_Папка в дереве, внутри TEST_SM84_Вложенная
  await expect(folder).toBeVisible();
  await expect(nested).toBeVisible();
});

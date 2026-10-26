import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { childTreeItem, navigatorButton, openSpace, openTreeItemActions, treeItem } from './support/navigator';

test('SM-117 ⋮ → «Переместить…»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.getByRole('textbox', { name: 'Текст документа' });
  const doc = treeItem(page, 'TEST_SM117_Текст');
  const folder = treeItem(page, 'TEST_SM117_Папка');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM117_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM117_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM117_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(doc).toBeVisible();
  });

  await test.step('Предусловие (SM-79): создать свою папку TEST_SM117_Папка', async () => {
    // Шаг 1. Нажать «Папка», ввести «TEST_SM117_Папка», нажать Enter
    await navigatorButton(page, 'Папка').click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM117_Папка');
    await page.keyboard.press('Enter');
    await expect(folder).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM117_Текст → «Переместить…»
  await openTreeItemActions(doc);
  await page.getByRole('menuitem', { name: 'Переместить…' }).click();

  // Шаг 2. Выбрать TEST_SM117_Папка, нажать «Переместить сюда»
  const moveDialog = page.getByRole('dialog', { name: 'Переместить «TEST_SM117_Текст»' });
  // Места назначения в окне — просто текст без ролей
  await moveDialog.getByText('TEST_SM117_Папка', { exact: true }).click();
  await moveDialog.getByRole('button', { name: 'Переместить сюда' }).click();
  await expect(moveDialog).toBeHidden();

  // Шаг 3. Раскрыть TEST_SM117_Папка
  // Папка раскрывается сама после переноса документа в неё, поэтому отдельного нажатия нет

  // Ожидание: TEST_SM117_Текст внутри TEST_SM117_Папка
  await expect(childTreeItem(folder, 'TEST_SM117_Текст')).toBeVisible();
});

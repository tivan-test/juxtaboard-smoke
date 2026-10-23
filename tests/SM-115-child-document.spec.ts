import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-115 ⋮ → «Создать» → «Добавить дочерний документ»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  const parentRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM115_Родитель' });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM115_Родитель', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM115_Родитель», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).first().click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM115_Родитель');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-document-id]').filter({ hasText: 'TEST_SM115_Родитель' })).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM115_Родитель → «Создать» → «Добавить дочерний документ»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке дерева
  await parentRow.hover();
  await parentRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Создать' }).hover();
  await page.getByRole('menu', { name: 'Создать' }).getByRole('menuitem', { name: 'Добавить дочерний документ' }).click();

  // Шаг 2. Ввести «TEST_SM115_Дочерний», нажать «Создать»
  const childDialog = page.getByRole('dialog', { name: 'Создать документ' });
  await childDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM115_Дочерний');
  await childDialog.getByRole('button', { name: 'Создать' }).click();
  await expect(childDialog).toBeHidden();

  // Родитель раскрывается сам после создания дочернего документа, поэтому отдельного шага «Раскрыть» нет
  // Дочерние строки лежат в том же контейнере, что и строка родителя
  const childRow = parentRow.locator('xpath=..').locator('[data-document-id]').filter({ hasText: 'TEST_SM115_Дочерний' });

  // Ожидание: «TEST_SM115_Дочерний» в дереве внутри TEST_SM115_Родитель
  await expect(childRow).toBeVisible();
});

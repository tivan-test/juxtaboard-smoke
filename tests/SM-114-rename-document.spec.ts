import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-114 ⋮ → «Редактировать»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  const oldRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM114_Текст' });
  const newRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM114_Новое' });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM114_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM114_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).first().click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM114_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-document-id]').filter({ hasText: 'TEST_SM114_Текст' })).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM114_Текст → «Редактировать»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке дерева
  await oldRow.hover();
  await oldRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Редактировать' }).click();

  // Шаг 2. Ввести «TEST_SM114_Новое», нажать «Сохранить»
  const editDialog = page.getByRole('dialog', { name: 'Редактировать документ' });
  await editDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM114_Новое');
  await editDialog.getByRole('button', { name: 'Сохранить' }).click();

  // Ожидание 1: в дереве «TEST_SM114_Новое»
  await expect(newRow).toBeVisible();
  // Ожидание 2: «TEST_SM114_Текст» в дереве нет
  await expect(oldRow).toHaveCount(0);
});

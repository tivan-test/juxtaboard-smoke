import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-113 Дублировать документ', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  // Исходный документ ищем по точному названию, чтобы не спутать с копией «(2)»
  const original = page.locator('[data-document-id]').filter({ hasText: /^TEST_SM113_Текст$/ });
  const copy = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM113_Текст (2)' });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM113_Текст с текстом', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM113_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).first().click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM113_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-document-id]').filter({ hasText: 'TEST_SM113_Текст' })).toBeVisible();
    // Шаг 3. В редакторе ввести «Проверка смоук текста 123»
    await editor.click();
    await page.keyboard.type('Проверка смоук текста 123');
    // Шаг 4. Перезагрузить страницу (текст сохраняется не сразу, перезагрузка гарантирует, что он сохранён до дублирования)
    await page.reload();
    await expect(editor).toContainText('Проверка смоук текста 123', { timeout: 60_000 });
    await expect(original).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM113_Текст → «Дублировать»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке дерева
  await original.hover();
  await original.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Дублировать' }).click();

  // Ожидание 1: в дереве «TEST_SM113_Текст (2)»
  await expect(copy).toBeVisible();

  // Шаг 2. Открыть «TEST_SM113_Текст (2)»
  const urlBefore = page.url();
  await copy.click();
  // Пока адрес не сменился, в редакторе ещё исходный документ с тем же текстом
  await expect(page).not.toHaveURL(urlBefore);

  // Ожидание 2: в копии тот же текст
  await expect(editor).toContainText('Проверка смоук текста 123');
});

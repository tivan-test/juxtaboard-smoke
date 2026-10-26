import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, openTreeItemActions, treeItem, treeRow } from './support/navigator';

test('SM-113 Дублировать документ', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.getByRole('textbox', { name: 'Текст документа' });
  // Название сравнивается целиком, поэтому исходный документ не спутать с копией «(2)»
  const original = treeItem(page, 'TEST_SM113_Текст');
  const copy = treeItem(page, 'TEST_SM113_Текст (2)');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM113_Текст с текстом', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM113_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM113_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(original).toBeVisible();
    // Шаг 3. В редакторе ввести «Проверка смоук текста 123»
    await editor.click();
    await page.keyboard.type('Проверка смоук текста 123');
    // Шаг 4. Перезагрузить страницу (текст сохраняется не сразу, перезагрузка гарантирует, что он сохранён до дублирования)
    await page.reload();
    await expect(editor).toContainText('Проверка смоук текста 123', { timeout: 60_000 });
    await expect(original).toBeVisible();
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let urlBefore;

  await test.step('Шаг 1. ⋮ у TEST_SM113_Текст → «Дублировать»', async () => {
    await openTreeItemActions(original);
    await page.getByRole('menuitem', { name: 'Дублировать' }).click();

    // Ожидание 1: в дереве «TEST_SM113_Текст (2)»
    await expect(copy).toBeVisible();
  });

  await test.step('Шаг 2. Открыть «TEST_SM113_Текст (2)»', async () => {
    urlBefore = page.url();
    await treeRow(copy).click();
    // Пока адрес не сменился, в редакторе ещё исходный документ с тем же текстом
    await expect(page).not.toHaveURL(urlBefore);

    // Ожидание 2: в копии тот же текст
    await expect(editor).toContainText('Проверка смоук текста 123');
  });
});

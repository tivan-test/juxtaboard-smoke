import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-117 ⋮ → «Переместить…»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  const docRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM117_Текст' });
  const folderRow = page.locator('[data-folder-id]').filter({ hasText: 'TEST_SM117_Папка' });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM117_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM117_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).first().click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM117_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-document-id]').filter({ hasText: 'TEST_SM117_Текст' })).toBeVisible();
  });

  await test.step('Предусловие (SM-79): создать свою папку TEST_SM117_Папка', async () => {
    // Шаг 1. Нажать «Папка», ввести «TEST_SM117_Папка», нажать Enter
    await page.getByRole('main').getByRole('button', { name: 'Папка', exact: true }).click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM117_Папка');
    await page.keyboard.press('Enter');
    await expect(folderRow).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM117_Текст → «Переместить…»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке дерева
  await docRow.hover();
  await docRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Переместить…' }).click();

  // Шаг 2. Выбрать TEST_SM117_Папка, нажать «Переместить сюда»
  const moveDialog = page.getByRole('dialog', { name: 'Переместить «TEST_SM117_Текст»' });
  // Места назначения в окне — просто текст без ролей
  await moveDialog.getByText('TEST_SM117_Папка', { exact: true }).click();
  await moveDialog.getByRole('button', { name: 'Переместить сюда' }).click();
  await expect(moveDialog).toBeHidden();

  // Шаг 3. Раскрыть TEST_SM117_Папка
  // Папка раскрывается сама после переноса документа в неё, поэтому отдельного нажатия нет
  const childDoc = folderRow.locator('xpath=..').locator('[data-document-id]').filter({ hasText: 'TEST_SM117_Текст' });

  // Ожидание: TEST_SM117_Текст внутри TEST_SM117_Папка
  await expect(childDoc).toBeVisible();
});

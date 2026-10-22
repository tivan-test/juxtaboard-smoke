import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-80 Документ в папке', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const folderRow = page.locator('[data-folder-id]').filter({ hasText: 'TEST_SM80_Папка' });

  await test.step('Предусловие (SM-79): создать свою папку TEST_SM80_Папка', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «Папка», ввести «TEST_SM80_Папка», нажать Enter
    await page.getByRole('main').getByRole('button', { name: 'Папка', exact: true }).click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM80_Папка');
    await page.keyboard.press('Enter');
    await expect(folderRow).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM80_Папка → «Создать» → «Новый документ»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке папки
  await folderRow.hover();
  await folderRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Создать' }).hover();
  await page.getByRole('menu', { name: 'Создать' }).getByRole('menuitem', { name: 'Новый документ' }).click();

  // Шаг 2. Ввести «TEST_SM80_Документ», нажать «Создать»
  const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
  await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM80_Документ');
  await createDialog.getByRole('button', { name: 'Создать' }).click();
  await expect(createDialog).toBeHidden();

  // Папка раскрывается сама после создания документа внутри неё, поэтому отдельного шага «Раскрыть» нет
  const childDoc = folderRow.locator('xpath=..').locator('[data-document-id]').filter({ hasText: 'TEST_SM80_Документ' });

  // Ожидание: внутри папки есть «TEST_SM80_Документ»
  await expect(childDoc).toBeVisible();
});

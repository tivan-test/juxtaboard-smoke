import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-84 Архив и восстановление папки', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');
  const folderRow = page.locator('[data-folder-id]').filter({ hasText: 'TEST_SM84_Папка' });
  const nestedRow = page.locator('[data-folder-id]').filter({ hasText: 'TEST_SM84_Вложенная' });
  // У кнопки «Режимы отображения» нет названия, находим её по иконке.
  // Когда открыта папка, в панели есть и другие кнопки с такими иконками, нужная — первая.
  // TODO для разработчиков: добавить кнопке aria-label «Режимы отображения»
  const viewModes = panel.getByRole('button').filter({ has: page.locator('svg.lucide-folder-open, svg.lucide-archive, svg.lucide-files, svg.lucide-paperclip') }).first();
  const chooseMode = async (mode: string) => {
    await viewModes.click();
    await page.getByRole('menuitem', { name: mode, exact: true }).click();
  };

  await test.step('Предусловие (SM-79, SM-82): создать свою папку TEST_SM84_Папка с вложенной TEST_SM84_Вложенная', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «Папка», ввести «TEST_SM84_Папка», нажать Enter
    await panel.getByRole('button', { name: 'Папка', exact: true }).click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM84_Папка');
    await page.keyboard.press('Enter');
    await expect(folderRow).toBeVisible();
    // Шаг 3. ⋮ у TEST_SM84_Папка → «Создать» → «Новая папка»
    await folderRow.hover();
    await folderRow.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole('menuitem', { name: 'Создать' }).hover();
    await page.getByRole('menu', { name: 'Создать' }).getByRole('menuitem', { name: 'Новая папка' }).click();
    // Шаг 4. Ввести «TEST_SM84_Вложенная», нажать Enter
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM84_Вложенная');
    await page.keyboard.press('Enter');
    await expect(nestedRow).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM84_Папка → «Архивировать»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке папки
  await folderRow.hover();
  await folderRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Архивировать' }).click();

  // Ожидание 1: TEST_SM84_Папка нет в дереве
  await expect(folderRow).toHaveCount(0);

  // Шаг 2. «Режимы отображения» → «Архив»
  await chooseMode('Архив');

  // Ожидание 2: TEST_SM84_Папка есть в архиве
  await expect(folderRow).toBeVisible();

  // Шаг 3. ⋮ у TEST_SM84_Папка в архиве → «Восстановить» (только «Восстановить», «Удалить навсегда» не трогаем)
  await folderRow.hover();
  await folderRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Восстановить' }).click();
  await expect(folderRow).toHaveCount(0);

  // Шаг 4. «Режимы отображения» → «Документы», раскрыть TEST_SM84_Папка
  await chooseMode('Документы');
  await expect(folderRow).toBeVisible();
  // Стрелка раскрытия — первая кнопка в строке папки, у неё нет названия (после восстановления папка свёрнута)
  await folderRow.getByRole('button').first().click();

  // Ожидание 3: TEST_SM84_Папка в дереве, внутри TEST_SM84_Вложенная
  await expect(folderRow).toBeVisible();
  await expect(nestedRow).toBeVisible();
});

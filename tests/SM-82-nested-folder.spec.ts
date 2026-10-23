import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-82 Вложенная папка', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const folderRow = page.locator('[data-folder-id]').filter({ hasText: 'TEST_SM82_Папка' });

  await test.step('Предусловие (SM-79): создать свою папку TEST_SM82_Папка', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «Папка», ввести «TEST_SM82_Папка», нажать Enter
    await page.getByRole('main').getByRole('button', { name: 'Папка', exact: true }).click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM82_Папка');
    await page.keyboard.press('Enter');
    await expect(folderRow).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM82_Папка → «Создать» → «Новая папка»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке папки
  await folderRow.hover();
  await folderRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Создать' }).hover();
  await page.getByRole('menu', { name: 'Создать' }).getByRole('menuitem', { name: 'Новая папка' }).click();

  // Шаг 2. Ввести «TEST_SM82_Вложенная», нажать Enter
  await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM82_Вложенная');
  await page.keyboard.press('Enter');

  // Шаг 3. Раскрыть TEST_SM82_Папка — папка раскрывается сама после создания внутри неё, отдельного клика нет
  // (повторный клик по стрелке свернул бы её). Вложенные строки лежат рядом со строкой папки в общем контейнере
  const nested = folderRow.locator('xpath=..').locator('[data-folder-id]').filter({ hasText: 'TEST_SM82_Вложенная' });

  // Ожидание: внутри папки есть «TEST_SM82_Вложенная»
  await expect(nested).toBeVisible();
});

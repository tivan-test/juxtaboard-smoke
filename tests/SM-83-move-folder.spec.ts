import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-83 Переместить папку', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const targetRow = page.locator('[data-folder-id]').filter({ hasText: 'TEST_SM83_Куда' });
  const movedRow = page.locator('[data-folder-id]').filter({ hasText: 'TEST_SM83_Что' });

  await test.step('Предусловие (SM-79): создать свои папки TEST_SM83_Куда и TEST_SM83_Что', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «Папка», ввести «TEST_SM83_Куда», нажать Enter
    await page.getByRole('main').getByRole('button', { name: 'Папка', exact: true }).click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM83_Куда');
    await page.keyboard.press('Enter');
    await expect(targetRow).toBeVisible();
    // Шаг 3. Нажать «Папка», ввести «TEST_SM83_Что», нажать Enter
    await page.getByRole('main').getByRole('button', { name: 'Папка', exact: true }).click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM83_Что');
    await page.keyboard.press('Enter');
    await expect(movedRow).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM83_Что → «Переместить…»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке папки
  await movedRow.hover();
  await movedRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Переместить…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Переместить «TEST_SM83_Что»' });
  const moveHere = dialog.getByRole('button', { name: 'Переместить сюда' });

  // Ожидание 1: саму TEST_SM83_Что в окне выбрать нельзя — после клика по ней «Переместить сюда» остаётся недоступной
  // (у пункта в списке нет роли, поэтому кликаем по тексту; сам пункт приглушён и клик игнорируется)
  await dialog.getByText('TEST_SM83_Что', { exact: true }).click({ force: true });
  await expect(moveHere).toBeDisabled();

  // Шаг 2. Выбрать TEST_SM83_Куда, нажать «Переместить сюда»
  await dialog.getByText('TEST_SM83_Куда', { exact: true }).click();
  await moveHere.click();
  await expect(dialog).toBeHidden();

  // Шаг 3. Раскрыть TEST_SM83_Куда — после переноса папка уже раскрыта, отдельного клика нет
  // (повторный клик по стрелке свернул бы её). Вложенные строки лежат рядом со строкой папки в общем контейнере
  const inside = targetRow.first().locator('xpath=..').locator('[data-folder-id]').filter({ hasText: 'TEST_SM83_Что' });

  // Ожидание 2: TEST_SM83_Что внутри TEST_SM83_Куда
  await expect(inside).toBeVisible();
});

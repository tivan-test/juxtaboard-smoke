import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { childTreeItem, navigatorButton, openSpace, openTreeItemActions, treeItem } from './support/navigator';

test('SM-83 Переместить папку', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const target = treeItem(page, 'TEST_SM83_Куда');
  const moved = treeItem(page, 'TEST_SM83_Что');

  await test.step('Предусловие (SM-79): создать свои папки TEST_SM83_Куда и TEST_SM83_Что', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «Папка», ввести «TEST_SM83_Куда», нажать Enter
    await navigatorButton(page, 'Папка').click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM83_Куда');
    await page.keyboard.press('Enter');
    await expect(target).toBeVisible();
    // Шаг 3. Нажать «Папка», ввести «TEST_SM83_Что», нажать Enter
    await navigatorButton(page, 'Папка').click();
    await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM83_Что');
    await page.keyboard.press('Enter');
    await expect(moved).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM83_Что → «Переместить…»
  await openTreeItemActions(moved);
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
  // (повторное нажатие «Свернуть» свернуло бы её)

  // Ожидание 2: TEST_SM83_Что внутри TEST_SM83_Куда
  await expect(childTreeItem(target, 'TEST_SM83_Что')).toBeVisible();
});

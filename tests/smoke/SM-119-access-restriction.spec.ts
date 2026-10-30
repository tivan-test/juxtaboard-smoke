import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, openTreeItemActions, treeItem } from '../support/navigator';

test('SM-119 ⋮ → «Управление доступом…»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.getByRole('textbox', { name: 'Текст документа' });
  const doc = treeItem(page, 'TEST_SM119_Текст');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM119_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM119_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM119_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(doc).toBeVisible();
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let accessDialog: Locator, restrict: Locator;

  await test.step('Шаг 1. ⋮ у TEST_SM119_Текст → «Управление доступом…»', async () => {
    await openTreeItemActions(doc);
    await page.getByRole('menuitem', { name: 'Управление доступом…' }).click();
    accessDialog = page.getByRole('dialog', { name: 'Доступ — TEST_SM119_Текст' });
    // У переключателя «Ограничить доступ» нет названия (подпись рядом с ним не связана с ним), в окне он единственный
    // TODO для разработчиков: связать переключатель с подписью «Ограничить доступ» (aria-label или aria-labelledby)
    restrict = accessDialog.getByRole('switch');
  });

  await test.step('Шаг 2. Включить «Ограничить доступ»', async () => {
    await restrict.click();

    // Ожидание 1: видны вкладки «Пользователи», «Права групп» и почта аккаунта с «Владелец проекта»
    await expect(accessDialog.getByRole('button', { name: 'Пользователи' })).toBeVisible();
    await expect(accessDialog.getByRole('button', { name: 'Права групп' })).toBeVisible();
    await expect(accessDialog.getByRole('row').filter({ hasText: process.env.JB_EMAIL! }).filter({ hasText: 'Владелец проекта' })).toBeVisible();
  });

  await test.step('Шаг 3. Выключить «Ограничить доступ»', async () => {
    await restrict.click();

    // Ожидание 2: видно «Этот элемент наследует доступ от проекта»
    await expect(restrict).not.toBeChecked();
    await expect(accessDialog.getByText('Этот элемент наследует доступ от проекта')).toBeVisible();
  });
});

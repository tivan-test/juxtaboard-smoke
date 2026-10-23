import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-119 ⋮ → «Управление доступом…»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  const docRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM119_Текст' });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM119_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM119_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).first().click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM119_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-document-id]').filter({ hasText: 'TEST_SM119_Текст' })).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM119_Текст → «Управление доступом…»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке дерева
  await docRow.hover();
  await docRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Управление доступом…' }).click();
  const accessDialog = page.getByRole('dialog', { name: 'Доступ — TEST_SM119_Текст' });
  // У переключателя «Ограничить доступ» нет названия, в окне он единственный
  // TODO для разработчиков: добавить переключателю aria-label «Ограничить доступ»
  const restrict = accessDialog.getByRole('switch');

  // Шаг 2. Включить «Ограничить доступ»
  await restrict.click();

  // Ожидание 1: видны вкладки «Пользователи», «Права групп» и почта аккаунта с «Владелец проекта»
  await expect(accessDialog.getByRole('button', { name: 'Пользователи' })).toBeVisible();
  await expect(accessDialog.getByRole('button', { name: 'Права групп' })).toBeVisible();
  await expect(accessDialog.getByRole('row').filter({ hasText: process.env.JB_EMAIL! }).filter({ hasText: 'Владелец проекта' })).toBeVisible();

  // Шаг 3. Выключить «Ограничить доступ»
  await restrict.click();

  // Ожидание 2: видно «Этот элемент наследует доступ от проекта»
  await expect(restrict).not.toBeChecked();
  await expect(accessDialog.getByText('Этот элемент наследует доступ от проекта')).toBeVisible();
});

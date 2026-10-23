import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-106 Новая ссылка', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  const textRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM106_Текст' });
  const linkRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM106_Ссылка' });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM106_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM106_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM106_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(textRow).toBeVisible();
  });

  // Шаг 1. Стрелка ▾ у «+ Документ» → «Новая ссылка», название «TEST_SM106_Ссылка», выбрать TEST_SM106_Текст, создать
  // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
  await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
  await page.getByRole('menuitem', { name: 'Новая ссылка', exact: true }).click();
  const linkDialog = page.getByRole('dialog', { name: 'Новая ссылка' });
  await linkDialog.getByRole('textbox', { name: 'Название ссылки' }).fill('TEST_SM106_Ссылка');
  await linkDialog.getByRole('textbox', { name: 'Фильтр по имени или #тегу…' }).fill('TEST_SM106_Текст');
  // Строки списка документов в окне — просто текст без роли
  await linkDialog.getByText('TEST_SM106_Текст', { exact: true }).click();
  await linkDialog.getByRole('button', { name: 'Создать' }).click();
  await expect(linkDialog).toBeHidden();
  await expect(linkRow).toBeVisible();

  // Шаг 2. Нажать «TEST_SM106_Ссылка» в дереве
  const textId = await textRow.getAttribute('data-document-id');
  const linkId = await linkRow.getAttribute('data-document-id');
  await linkRow.click();

  // Ожидание: открылся документ «TEST_SM106_Текст»
  // Названия документа на странице нет, поэтому смотрим на адрес: docId — это TEST_SM106_Текст, linkId — нажатая ссылка
  await expect(page).toHaveURL(new RegExp(`docId=${textId}&linkId=${linkId}$`));
  await expect(editor).toBeVisible();
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-122 Тег при создании и фильтр #тег', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');

  // Шаг 1. Открыть навигатор пространства прогона, нажать «+ Документ», ввести название «TEST_SM122_Тег»
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).first().click();
  const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
  await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM122_Тег');

  // Шаг 2. В «Теги» ввести «TEST_sm122», нажать «Создать «TEST_sm122»», затем «Создать»
  await createDialog.getByRole('combobox').click();
  await page.keyboard.type('TEST_sm122');
  await page.getByRole('button', { name: 'Создать «TEST_sm122»' }).click();
  // Тег добавляется не мгновенно: без этого ожидания документ создаётся без тега
  await expect(createDialog.getByText('TEST_sm122', { exact: true })).toBeVisible();
  await createDialog.getByRole('button', { name: 'Создать', exact: true }).click();
  await expect(editor).toBeVisible({ timeout: 30_000 });

  // Шаг 3. Перезагрузить страницу
  await page.reload();

  // Шаг 4. Ввести в «Фильтр по имени или #тегу…» «#TEST_sm122»
  await page.getByRole('textbox', { name: 'Фильтр по имени или #тегу…' }).fill('#TEST_sm122');

  // Ожидание: в дереве только «TEST_SM122_Тег»
  await expect(page.locator('[data-document-id]').filter({ hasText: 'TEST_SM122_Тег' })).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-document-id], [data-folder-id]')).toHaveCount(1);
});

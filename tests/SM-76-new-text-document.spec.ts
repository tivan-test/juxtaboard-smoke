import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-76 Новый документ с текстом', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');

  // Шаг 1. Открыть навигатор пространства прогона
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });

  // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM76_Текст», нажать «Создать»
  await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).click();
  const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
  await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM76_Текст');
  await createDialog.getByRole('button', { name: 'Создать' }).click();

  // Ожидание 1: открылся редактор, «TEST_SM76_Текст» есть в дереве
  await expect(editor).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-document-id]').filter({ hasText: 'TEST_SM76_Текст' })).toBeVisible();

  // Шаг 3. В редакторе ввести «Проверка смоук текста 123»
  await editor.click();
  await page.keyboard.type('Проверка смоук текста 123');

  // Шаг 4. Перезагрузить страницу
  await page.reload();

  // Ожидание 2: в документе «Проверка смоук текста 123»
  await expect(editor).toContainText('Проверка смоук текста 123', { timeout: 60_000 });
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-110 Фильтр дерева', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM110_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM110_Текст», нажать «Создать»
    await panel.getByRole('button', { name: 'Документ', exact: true }).first().click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM110_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    // Текстовый документ после создания открывается сам; ждём редактор (строка в длинном дереве может быть вне видимой части)
    await expect(page.locator('[contenteditable="true"]')).toBeVisible({ timeout: 30_000 });
  });

  // Шаг 1. Открыть навигатор пространства прогона
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });

  // Шаг 2. Ввести в «Фильтр по имени или #тегу…» «SM110»
  await panel.getByRole('textbox', { name: 'Фильтр по имени или #тегу…' }).first().fill('SM110');

  // Ожидание: в дереве только «TEST_SM110_Текст» (одна строка документа, папок нет)
  await expect(page.locator('[data-document-id]')).toHaveCount(1);
  await expect(page.locator('[data-document-id]').filter({ hasText: 'TEST_SM110_Текст' })).toBeVisible();
  await expect(page.locator('[data-folder-id]')).toHaveCount(0);
});

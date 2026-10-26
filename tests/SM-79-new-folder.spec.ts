import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, treeItem } from './support/navigator';

test('SM-79 Новая папка', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона
  await openSpace(page, url);

  // Шаг 2. Нажать «Папка», ввести «TEST_SM79_Папка», нажать Enter
  await navigatorButton(page, 'Папка').click();
  await page.getByRole('dialog', { name: 'Создать папку' }).getByRole('textbox', { name: 'Название папки' }).fill('TEST_SM79_Папка');
  await page.keyboard.press('Enter');

  // Ожидание: в дереве есть папка «TEST_SM79_Папка»
  await expect(treeItem(page, 'TEST_SM79_Папка')).toBeVisible();
});

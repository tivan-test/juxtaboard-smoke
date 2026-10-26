import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openTreeItemActions, treeItem } from './support/navigator';
import { setUpDataTable } from './support/data-table';

test('SM-96 ⋮ таблицы → «Автоматизации…»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');

  await test.step('Предусловие (SM-85): создать свою таблицу TEST_SM96_Таблица', async () => {
    await setUpDataTable(page, url, { name: 'TEST_SM96_Таблица' });
  });

  // Шаг 1. ⋮ у TEST_SM96_Таблица в дереве → «Автоматизации…»
  await openTreeItemActions(treeItem(page, 'TEST_SM96_Таблица'));
  await page.getByRole('menuitem', { name: 'Автоматизации…', exact: true }).click();

  // Ожидание 1: открылся раздел «Автоматизации»
  await expect(main.getByText('Автоматизации', { exact: true })).toBeVisible();

  // Ожидание 2: видно «Фильтр по таблице: TEST_SM96_Таблица»
  await expect(main.getByText('Фильтр по таблице: TEST_SM96_Таблица')).toBeVisible();
});

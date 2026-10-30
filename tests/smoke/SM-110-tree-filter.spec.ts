import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { docTree, navigatorButton, openSpace, treeFilter, treeItem } from '../support/navigator';

test('SM-110 Фильтр дерева', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM110_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM110_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM110_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    // Текстовый документ после создания открывается сам; ждём редактор (строка в длинном дереве может быть вне видимой части)
    await expect(page.getByRole('textbox', { name: 'Текст документа' })).toBeVisible({ timeout: 30_000 });
  });

  await test.step('Шаг 1. Открыть навигатор пространства прогона', async () => {
    await openSpace(page, url);
  });

  await test.step('Шаг 2. Ввести в «Фильтр по имени или #тегу…» «SM110»', async () => {
    await treeFilter(page).fill('SM110');

    // Ожидание: в дереве только «TEST_SM110_Текст» (один элемент, папок нет)
    await expect(docTree(page).getByRole('treeitem')).toHaveCount(1);
    await expect(treeItem(page, 'TEST_SM110_Текст')).toBeVisible();
  });
});

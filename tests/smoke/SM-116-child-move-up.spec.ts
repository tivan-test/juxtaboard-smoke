import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { childTreeItem, docTree, navigatorButton, openSpace, openTreeItemActions, treeItem, treeRow } from '../support/navigator';

test('SM-116 «Переместить на уровень выше»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.getByRole('textbox', { name: 'Текст документа' });
  const parent = treeItem(page, 'TEST_SM116_Родитель');
  const child = childTreeItem(parent, 'TEST_SM116_Дочерний');

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM116_Родитель', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM116_Родитель», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM116_Родитель');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(parent).toBeVisible();
  });

  await test.step('Предусловие (SM-115): создать дочерний документ TEST_SM116_Дочерний', async () => {
    // Шаг 1. ⋮ у TEST_SM116_Родитель → «Создать» → «Добавить дочерний документ»
    await openTreeItemActions(parent);
    await page.getByRole('menuitem', { name: 'Создать' }).hover();
    await page.getByRole('menu', { name: 'Создать' }).getByRole('menuitem', { name: 'Добавить дочерний документ' }).click();
    // Шаг 2. Ввести «TEST_SM116_Дочерний», нажать «Создать»
    const childDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await childDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM116_Дочерний');
    await childDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(childDialog).toBeHidden();
    await expect(child).toBeVisible();
  });

  await test.step('Шаг 1. ⋮ у TEST_SM116_Дочерний → «Переместить на уровень выше»', async () => {
    await openTreeItemActions(child);
    await page.getByRole('menuitem', { name: 'Переместить на уровень выше' }).click();

    // Ожидание 1: TEST_SM116_Дочерний на верхнем уровне дерева, внутри родителя никого не осталось
    await expect(docTree(page).getByRole('treeitem', { name: 'TEST_SM116_Дочерний', exact: true, level: 1 })).toBeVisible();
    await expect(parent.getByRole('group').getByRole('treeitem')).toHaveCount(0);

    // Ожидание 2: у TEST_SM116_Родитель нет стрелки раскрытия
    await expect(treeRow(parent).getByRole('button', { name: /^(Развернуть|Свернуть)$/ })).toHaveCount(0);
  });
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { docTree, navigatorButton, openSpace, treeItem } from './support/navigator';
import { documentEditor } from './support/editor';

test('SM-131 «Режим сортировки»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');
  // Элементы дерева документов в порядке показа
  const treeItems = docTree(page).getByRole('treeitem');
  // Порядок в дереве: true, если обе строки найдены и «первая» стоит выше «второй»
  const isAbove = async (first: string, second: string) => {
    const texts = await treeItems.allInnerTexts();
    const indexFirst = texts.findIndex((t) => t.includes(first));
    const indexSecond = texts.findIndex((t) => t.includes(second));
    return indexFirst >= 0 && indexSecond > indexFirst;
  };

  await test.step('Предусловие (SM-76): создать свои документы TEST_SM131_Б и затем TEST_SM131_А', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    for (const docName of ['TEST_SM131_Б', 'TEST_SM131_А']) {
      // Шаг 2. Нажать «+ Документ», ввести название, нажать «Создать»
      await navigatorButton(page, 'Документ').click();
      const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
      await createDialog.getByRole('textbox', { name: 'Название документа' }).fill(docName);
      await createDialog.getByRole('button', { name: 'Создать' }).click();
      await expect(documentEditor(page)).toBeVisible({ timeout: 30_000 });
      await expect(treeItem(page, docName)).toBeVisible();
    }
  });

  await test.step('Шаг 1. Открыть навигатор пространства прогона', async () => {
    await openSpace(page, url);
    await expect(treeItem(page, 'TEST_SM131_А')).toBeVisible();
  });

  await test.step('Шаг 2. «Режим сортировки» (⋮ у фильтра) → «Сортировка А–Я»', async () => {
    await panel.getByRole('button', { name: 'Режим сортировки' }).click();
    await page.getByRole('menuitem', { name: 'Сортировка А–Я' }).click();

    // Ожидание 1: TEST_SM131_А выше TEST_SM131_Б
    await expect.poll(() => isAbove('TEST_SM131_А', 'TEST_SM131_Б')).toBe(true);
  });

  await test.step('Шаг 3. «Режим сортировки» → «Ручной порядок»', async () => {
    await panel.getByRole('button', { name: 'Режим сортировки' }).click();
    await page.getByRole('menuitem', { name: 'Ручной порядок' }).click();

    // Ожидание 2: TEST_SM131_Б выше TEST_SM131_А (ручной порядок — это и исходная настройка)
    await expect.poll(() => isAbove('TEST_SM131_Б', 'TEST_SM131_А')).toBe(true);
  });
});

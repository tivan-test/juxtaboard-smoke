import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, treeItem } from './support/navigator';
import { documentEditor } from './support/editor';

test('SM-127 «Сортировка»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');
  const rows = panel.getByRole('table').getByRole('row');

  // Выбор пункта в меню «Сортировка»: меню закрывается после каждого пункта, поэтому открываем его заново
  const chooseSort = async (item: string) => {
    await panel.getByRole('button', { name: 'Сортировка', exact: true }).click();
    await page.getByRole('menuitem', { name: item, exact: true }).click();
    await expect(page.getByRole('menu')).toBeHidden();
  };

  await test.step('Предусловие (SM-76): создать свои документы TEST_SM127_А и затем TEST_SM127_Б', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    for (const docName of ['TEST_SM127_А', 'TEST_SM127_Б']) {
      // Шаг 2. Нажать «+ Документ», ввести название, нажать «Создать»
      await navigatorButton(page, 'Документ').click();
      const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
      await createDialog.getByRole('textbox', { name: 'Название документа' }).fill(docName);
      await createDialog.getByRole('button', { name: 'Создать' }).click();
      await expect(documentEditor(page)).toBeVisible({ timeout: 30_000 });
      await expect(treeItem(page, docName)).toBeVisible();
    }
  });

  // Шаг 1. «Все файлы» → «Список»
  // После предусловия открыт документ, а «Все файлы» есть только на главной навигатора, поэтому открываем навигатор заново
  await page.goto(url);
  await panel.getByRole('button', { name: 'Все файлы' }).click({ timeout: 60_000 });
  await panel.getByRole('button', { name: 'Список', exact: true }).click();
  await expect(panel.getByRole('table')).toBeVisible();

  // Шаг 2. «Сортировка» → «Дата создания», «По убыванию»
  await chooseSort('Дата создания');
  await chooseSort('По убыванию');

  // Ожидание: TEST_SM127_Б выше TEST_SM127_А (индекс строки Б меньше индекса строки А, обе найдены)
  await expect.poll(async () => {
    const texts = await rows.allInnerTexts();
    const indexB = texts.findIndex((t) => t.includes('TEST_SM127_Б'));
    const indexA = texts.findIndex((t) => t.includes('TEST_SM127_А'));
    return indexB >= 0 && indexA > indexB;
  }).toBe(true);

  // Шаг 3. «Сортировка» → «Название», «По возрастанию», затем нажать «Плитки» (вернуть карточки)
  // Это возврат исходных настроек просмотра
  await chooseSort('Название');
  await chooseSort('По возрастанию');
  await panel.getByRole('button', { name: 'Плитки', exact: true }).click();
  await expect(panel.getByRole('table')).toBeHidden();
});

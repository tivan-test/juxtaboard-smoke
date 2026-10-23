import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-118 ⋮ → «Свойства документа»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  const docRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM118_Текст' });
  const propsDialog = page.getByRole('dialog', { name: 'Свойства документа' });
  const openProps = async () => {
    // У ⋮ нет названия, это кнопка с выпадающим меню в строке дерева
    await docRow.hover();
    await docRow.locator('button[aria-haspopup="menu"]').click();
    await page.getByRole('menuitem', { name: 'Свойства документа' }).click();
  };

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM118_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM118_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).first().click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM118_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-document-id]').filter({ hasText: 'TEST_SM118_Текст' })).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM118_Текст → «Свойства документа»
  await openProps();

  // Шаг 2. В блоке «Свойства документа» ввести имя «TEST_свойство», значение «42», нажать «+»
  // В окне два блока: «Свойства проекта» (первый) и «Свойства документа» (последний). Нужен последний, проектные не трогаем.
  await propsDialog.getByRole('textbox', { name: 'Имя' }).last().fill('TEST_свойство');
  await propsDialog.getByRole('textbox', { name: 'Значение' }).last().fill('42');
  // У кнопки «+» нет названия, находим её по иконке; последняя — в блоке документа
  // TODO для разработчиков: добавить кнопке «+» aria-label
  const saved = page.waitForResponse((r) => r.request().method() === 'POST' && /\/document-properties/.test(r.url()));
  await propsDialog.getByRole('button').filter({ has: page.locator('svg.lucide-plus') }).last().click();
  expect((await saved).ok()).toBe(true);

  // Шаг 3. Закрыть окно, перезагрузить страницу, снова открыть «Свойства документа»
  await propsDialog.getByRole('button', { name: 'Закрыть' }).click();
  await expect(propsDialog).toBeHidden();
  await page.reload();
  await expect(docRow).toBeVisible({ timeout: 60_000 });
  await openProps();

  // Ожидание: видно «TEST_свойство» = «42»
  await expect(propsDialog).toContainText(/TEST_свойство\s*=\s*42/);
});

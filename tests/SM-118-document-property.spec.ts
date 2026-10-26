import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace, openTreeItemActions, treeItem } from './support/navigator';

test('SM-118 ⋮ → «Свойства документа»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editor = page.getByRole('textbox', { name: 'Текст документа' });
  const doc = treeItem(page, 'TEST_SM118_Текст');
  const propsDialog = page.getByRole('dialog', { name: 'Свойства документа' });
  const openProps = async () => {
    await openTreeItemActions(doc);
    await page.getByRole('menuitem', { name: 'Свойства документа' }).click();
  };

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM118_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM118_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM118_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(doc).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM118_Текст → «Свойства документа»
  await openProps();

  // Шаг 2. В блоке «Свойства документа» ввести имя «TEST_свойство», значение «42», нажать «+» («Добавить»)
  // В окне два блока: «Свойства проекта» (первый) и «Свойства документа» (последний). Нужен последний, проектные не трогаем.
  // У блоков нет роли и названия (заголовок блока — простой текст), поэтому отличить их можно только по порядку.
  // eslint-disable-next-line playwright/no-nth-methods -- пробел приложения: блок «Свойства документа» без роли/названия
  await propsDialog.getByRole('textbox', { name: 'Имя' }).last().fill('TEST_свойство');
  // eslint-disable-next-line playwright/no-nth-methods -- пробел приложения: блок «Свойства документа» без роли/названия
  await propsDialog.getByRole('textbox', { name: 'Значение' }).last().fill('42');
  const saved = page.waitForResponse((r) => r.request().method() === 'POST' && /\/document-properties/.test(r.url()));
  // eslint-disable-next-line playwright/no-nth-methods -- пробел приложения: блок «Свойства документа» без роли/названия
  await propsDialog.getByRole('button', { name: 'Добавить', exact: true }).last().click();
  expect((await saved).ok()).toBe(true);

  // Шаг 3. Закрыть окно, перезагрузить страницу, снова открыть «Свойства документа»
  await propsDialog.getByRole('button', { name: 'Закрыть' }).click();
  await expect(propsDialog).toBeHidden();
  await page.reload();
  await expect(doc).toBeVisible({ timeout: 60_000 });
  await openProps();

  // Ожидание: видно «TEST_свойство» = «42»
  await expect(propsDialog).toContainText(/TEST_свойство\s*=\s*42/);
});

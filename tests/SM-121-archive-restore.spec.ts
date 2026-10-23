import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-121 Архив и восстановление документа', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  const docRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM121_Текст' });
  const panel = page.getByRole('main');
  // У кнопки «Режимы отображения» нет названия, находим её по иконке.
  // Иконка зависит от режима: папка (Документы), архив, файлы (Шаблоны), скрепка (Вложенные файлы).
  // TODO для разработчиков: добавить кнопке aria-label «Режимы отображения»
  const viewModes = panel.getByRole('button').filter({ has: page.locator('svg.lucide-folder-open, svg.lucide-archive, svg.lucide-files, svg.lucide-paperclip') });
  const chooseMode = async (mode: string) => {
    await viewModes.click();
    await page.getByRole('menuitem', { name: mode, exact: true }).click();
  };

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM121_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM121_Текст», нажать «Создать»
    await page.getByRole('main').getByRole('button', { name: 'Документ', exact: true }).first().click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM121_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(editor).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-document-id]').filter({ hasText: 'TEST_SM121_Текст' })).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM121_Текст → «Архивировать»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке дерева
  await docRow.hover();
  await docRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Архивировать' }).click();

  // Ожидание 1: TEST_SM121_Текст нет в дереве
  await expect(docRow).toHaveCount(0);

  // Шаг 2. «Режимы отображения» → «Архив»
  await chooseMode('Архив');

  // Ожидание 2: TEST_SM121_Текст есть в архиве
  await expect(docRow).toBeVisible();

  // Шаг 3. ⋮ у TEST_SM121_Текст в архиве → «Восстановить» (только «Восстановить», «Удалить навсегда» не трогаем)
  await docRow.hover();
  await docRow.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Восстановить' }).click();

  // Шаг 4. «Режимы отображения» → «Документы»
  await chooseMode('Документы');

  // Ожидание 3: TEST_SM121_Текст снова в дереве
  await expect(docRow).toBeVisible();
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-123 Шаблон и документ из шаблона', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  // Редактор текста — область с contenteditable (ролей у неё нет)
  const editor = page.locator('[contenteditable="true"]');
  const panel = page.getByRole('main');
  // У кнопки «Режимы отображения» нет названия, находим её по иконке.
  // Иконка зависит от режима: папка (Документы), архив, файлы (Шаблоны), скрепка (Вложенные файлы).
  // TODO для разработчиков: добавить кнопке aria-label «Режимы отображения»
  const viewModes = panel.getByRole('button').filter({ has: page.locator('svg.lucide-folder-open, svg.lucide-archive, svg.lucide-files, svg.lucide-paperclip') });
  const chooseMode = async (mode: string) => {
    await viewModes.click();
    await page.getByRole('menuitem', { name: mode, exact: true }).click();
  };
  const createDialog = page.getByRole('dialog', { name: 'Создать документ' });

  // Шаг 1. Открыть навигатор, «Режимы отображения» → «Шаблоны» → «+ Шаблон», название «TEST_SM123_Шаблон», «Создать»
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await chooseMode('Шаблоны');
  await panel.getByRole('button', { name: 'Шаблон', exact: true }).click();
  await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM123_Шаблон');
  await createDialog.getByRole('button', { name: 'Создать', exact: true }).click();
  await expect(editor).toBeVisible({ timeout: 30_000 });

  // Шаг 2. В шаблоне ввести «Текст из шаблона»
  await editor.click();
  await page.keyboard.type('Текст из шаблона');
  // Текст сохраняется не сразу: перезагрузка гарантирует, что он сохранён до создания документа из шаблона
  await page.reload();
  await expect(editor).toContainText('Текст из шаблона', { timeout: 60_000 });

  // Шаг 3. «Режимы отображения» → «Документы» → «+ Документ», название «TEST_SM123_Документ»
  await chooseMode('Документы');
  await panel.getByRole('button', { name: 'Документ', exact: true }).first().click();
  await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM123_Документ');

  // Шаг 4. «Использовать шаблон» → выбрать «TEST_SM123_Шаблон», нажать «Создать»
  await createDialog.getByRole('button', { name: 'Использовать шаблон' }).click();
  // Шаблоны в списке — просто текст без ролей
  await createDialog.getByText('TEST_SM123_Шаблон', { exact: true }).click();

  // Ожидание 1: справа от «Использовать шаблон» выбран «TEST_SM123_Шаблон»
  await expect(createDialog.getByRole('button', { name: 'Использовать шаблон TEST_SM123_Шаблон' })).toBeVisible();

  const urlBefore = page.url();
  await createDialog.getByRole('button', { name: 'Создать', exact: true }).click();
  // Пока адрес не сменился, в редакторе ещё шаблон с тем же текстом
  await expect(page).not.toHaveURL(urlBefore);

  // Ожидание 2: в документе «TEST_SM123_Документ» текст «Текст из шаблона»
  await expect(page.locator('[data-document-id]').filter({ hasText: 'TEST_SM123_Документ' })).toBeVisible();
  await expect(editor).toContainText('Текст из шаблона');
});

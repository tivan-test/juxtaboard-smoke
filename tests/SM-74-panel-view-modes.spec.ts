import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-74 Архив, Шаблоны, Вложенные файлы', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');
  // У кнопки «Режимы отображения» нет названия, находим её по иконке.
  // Иконка зависит от режима: папка (Документы), архив, файлы (Шаблоны), скрепка (Вложенные файлы).
  // TODO для разработчиков: добавить кнопке aria-label «Режимы отображения»
  const viewModes = panel.getByRole('button').filter({ has: page.locator('svg.lucide-folder-open, svg.lucide-archive, svg.lucide-files, svg.lucide-paperclip') });
  const chooseMode = async (mode: string) => {
    await viewModes.click();
    await page.getByRole('menuitem', { name: mode, exact: true }).click();
  };

  // Шаг 1. Открыть навигатор пространства прогона
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });

  // Шаг 2. Нажать «Режимы отображения» (иконка папки) → «Архив»
  await chooseMode('Архив');

  // Ожидание 1: вверху панели «Архив»
  await expect(panel.getByText('Архив', { exact: true })).toBeVisible();

  // Шаг 3. «Режимы отображения» → «Шаблоны»
  await chooseMode('Шаблоны');

  // Ожидание 2: видна кнопка «Шаблон»
  await expect(panel.getByRole('button', { name: 'Шаблон', exact: true })).toBeVisible();

  // Шаг 4. «Режимы отображения» → «Вложенные файлы»
  await chooseMode('Вложенные файлы');

  // Ожидание 3: вверху панели «Вложенные файлы»
  await expect(panel.getByText('Вложенные файлы', { exact: true })).toBeVisible();

  // Шаг 5. «Режимы отображения» → «Документы»
  await chooseMode('Документы');

  // Ожидание 4: видна кнопка «Документ» (вторая такая же кнопка есть на пустой странице пространства, кнопка панели — первая)
  await expect(panel.getByRole('button', { name: 'Документ', exact: true }).first()).toBeVisible();
});

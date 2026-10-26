import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace } from './support/navigator';

test('SM-74 Архив, Шаблоны, Вложенные файлы', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');
  // Иконка кнопки зависит от режима, а название одно: «Режимы отображения»
  const chooseMode = async (mode: string) => {
    await panel.getByRole('button', { name: 'Режимы отображения', exact: true }).click();
    await page.getByRole('menuitem', { name: mode, exact: true }).click();
  };

  // Шаг 1. Открыть навигатор пространства прогона
  await openSpace(page, url);

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

  // Ожидание 4: видна кнопка «Документ» на панели
  await expect(navigatorButton(page, 'Документ')).toBeVisible();
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace } from '../support/navigator';

test('SM-74 Архив, Шаблоны, Вложенные файлы', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');
  // Иконка кнопки зависит от режима, а название одно: «Режимы отображения»
  const chooseMode = async (mode: string) => {
    await panel.getByRole('button', { name: 'Режимы отображения', exact: true }).click();
    await page.getByRole('menuitem', { name: mode, exact: true }).click();
  };

  await test.step('Шаг 1. Открыть навигатор пространства прогона', async () => {
    await openSpace(page, url);
  });

  await test.step('Шаг 2. Нажать «Режимы отображения» (иконка папки) → «Архив»', async () => {
    await chooseMode('Архив');

    // Ожидание 1: вверху панели «Архив»
    await expect(panel.getByText('Архив', { exact: true })).toBeVisible();
  });

  await test.step('Шаг 3. «Режимы отображения» → «Шаблоны»', async () => {
    await chooseMode('Шаблоны');

    // Ожидание 2: видна кнопка «Шаблон»
    await expect(panel.getByRole('button', { name: 'Шаблон', exact: true })).toBeVisible();
  });

  await test.step('Шаг 4. «Режимы отображения» → «Вложенные файлы»', async () => {
    await chooseMode('Вложенные файлы');

    // Ожидание 3: вверху панели «Вложенные файлы»
    await expect(panel.getByText('Вложенные файлы', { exact: true })).toBeVisible();
  });

  await test.step('Шаг 5. «Режимы отображения» → «Документы»', async () => {
    await chooseMode('Документы');

    // Ожидание 4: видна кнопка «Документ» на панели
    await expect(navigatorButton(page, 'Документ')).toBeVisible();
  });
});

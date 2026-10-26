import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openSpace } from './support/navigator';

test('SM-129 «Настроить столбцы»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');
  // Пока открыто меню столбцов, остальная страница помечена скрытой для доступности (aria-hidden),
  // поэтому заголовок столбца ищем с includeHidden; видимость на экране toBeVisible проверяет сам
  const createdColumn = page.getByRole('columnheader', { name: 'Создан', exact: true, includeHidden: true });

  await test.step('Шаг 1. «Все файлы» → «Список» → «Настроить столбцы»', async () => {
    await openSpace(page, url);
    await panel.getByRole('button', { name: 'Все файлы' }).click();
    await panel.getByRole('button', { name: 'Список', exact: true }).click();
    await expect(createdColumn).toBeVisible();
    await page.getByRole('button', { name: 'Настроить столбцы' }).click();
  });

  await test.step('Шаг 2. Снять галочку «Создан»', async () => {
    await page.getByRole('menuitemcheckbox', { name: 'Создан', exact: true }).click();

    // Ожидание 1: столбца «Создан» нет
    await expect(createdColumn).toHaveCount(0);
  });

  await test.step('Шаг 3. Поставить галочку «Создан»', async () => {
    await page.getByRole('menuitemcheckbox', { name: 'Создан', exact: true }).click();

    // Ожидание 2: столбец «Создан» есть
    await expect(createdColumn).toBeVisible();
  });

  await test.step('Шаг 4. Закрыть меню, нажать «Плитки» (вернуть карточки)', async () => {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toBeHidden();
    await panel.getByRole('button', { name: 'Плитки', exact: true }).click();
    await expect(panel.getByRole('table')).toBeHidden();
  });
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-129 «Настроить столбцы»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');
  // Пока открыто меню столбцов, вся страница помечена как скрытая для доступности (aria-hidden),
  // поэтому поиск по ролям внутри панели не работает. Заголовок столбца ищем по тексту в thead.
  const createdColumn = page.locator('thead').getByText('Создан', { exact: true });

  // Шаг 1. «Все файлы» → «Список» → «Настроить столбцы»
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await panel.getByRole('button', { name: 'Все файлы' }).click();
  await panel.getByRole('button', { name: 'Список', exact: true }).click();
  await expect(createdColumn).toBeVisible();
  await page.getByRole('button', { name: 'Настроить столбцы' }).click();

  // Шаг 2. Снять галочку «Создан»
  await page.getByRole('menuitemcheckbox', { name: 'Создан', exact: true }).click();

  // Ожидание 1: столбца «Создан» нет
  await expect(createdColumn).toHaveCount(0);

  // Шаг 3. Поставить галочку «Создан»
  await page.getByRole('menuitemcheckbox', { name: 'Создан', exact: true }).click();

  // Ожидание 2: столбец «Создан» есть
  await expect(createdColumn).toBeVisible();

  // Шаг 4. Закрыть меню, нажать «Плитки» (вернуть карточки)
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await panel.getByRole('button', { name: 'Плитки', exact: true }).click();
  await expect(panel.getByRole('table')).toBeHidden();
});

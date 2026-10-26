import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openSpace } from './support/navigator';

test('SM-66 Справочник сотрудников', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Шаг 1. Открыть навигатор пространства прогона → «Структуры проекта» → «Справочники сотрудников»
  await openSpace(page, url);
  await page.getByRole('banner').getByRole('button', { name: 'Структуры проекта' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Справочники сотрудников' }).click();

  // Шаг 2. Нажать «Назначить новый», ввести название «TEST_SM66_Сотрудники», нажать «Назначить»
  await page.getByRole('button', { name: 'Назначить новый' }).click({ timeout: 30_000 });
  const dialog = page.getByRole('dialog', { name: 'Назначить справочник сотрудников' });
  await dialog.getByRole('textbox', { name: 'Название' }).fill('TEST_SM66_Сотрудники');
  await dialog.getByRole('button', { name: 'Назначить' }).click();

  // Ожидание 1: уведомление «Справочник сотрудников назначен»
  await expect(page.getByText('Справочник сотрудников назначен')).toBeVisible();

  // Ожидание 2: в списке «TEST_SM66_Сотрудники» с меткой «основной»
  await expect(page.getByRole('main').getByText('TEST_SM66_Сотрудники')).toBeVisible();
  await expect(page.getByRole('main').getByText('основной', { exact: true })).toBeVisible();

  // Шаг 3. Нажать «Открыть таблицу»
  await page.getByRole('main').getByRole('link', { name: 'Открыть таблицу' }).click();

  // Ожидание 3: открылась таблица «TEST_SM66_Сотрудники» с меткой «Справочник людей»
  // (название открытого документа навигатор ставит в начало заголовка вкладки: «<документ> — <пространство>»)
  await expect(page.getByText('Справочник людей')).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveTitle(/^TEST_SM66_Сотрудники — /);
});

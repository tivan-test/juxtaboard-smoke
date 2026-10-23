import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-104 Новая карта процесса', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const mapRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM104_Карта' });

  // Карта процесса строится по таблицам проекта: без таблиц вместо «Новый этап» видно «В этом проекте пока нет таблиц.»
  await test.step('Предусловие (SM-85): создать свою таблицу TEST_SM104_Таблица', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM104_Таблица», нажать «Создать»
    const tableDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await tableDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM104_Таблица');
    await tableDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(tableDialog).toBeHidden();
  });

  // Шаг 1. Стрелка ▾ у «+ Документ» → «Новая карта процесса», ввести «TEST_SM104_Карта», нажать «Создать»
  // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
  await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
  await page.getByRole('menuitem', { name: 'Новая карта процесса', exact: true }).click();
  const createDialog = page.getByRole('dialog', { name: 'Новая карта процесса' });
  await createDialog.getByRole('textbox', { name: 'Название карты процесса' }).fill('TEST_SM104_Карта');
  await createDialog.getByRole('button', { name: 'Создать' }).click();

  // Шаг 2. Нажать «TEST_SM104_Карта» в дереве (после создания она сама не открывается)
  await mapRow.click();

  // Шаг 3. Нажать «Новый этап», ввести «Этап 1» (Enter сохраняет этап, ждём ответ сервера)
  await page.getByRole('button', { name: 'Новый этап' }).click();
  await page.getByRole('textbox', { name: 'Название этапа…' }).fill('Этап 1');
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'POST' && r.ok()),
    page.keyboard.press('Enter'),
  ]);

  // Шаг 4. Перезагрузить страницу
  await page.reload();

  // Ожидание: виден этап «Этап 1»
  await expect(page.getByRole('heading', { name: 'Этап 1' })).toBeVisible({ timeout: 60_000 });
});

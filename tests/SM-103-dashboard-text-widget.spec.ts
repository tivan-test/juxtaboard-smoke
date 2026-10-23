import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-103 Виджет «Текст»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const dashRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM103_Дашборд' });

  await test.step('Предусловие (SM-102): создать свой дашборд TEST_SM103_Дашборд', async () => {
    // Шаг 1. Стрелка ▾ у «+ Документ» → «Новый дашборд», ввести «TEST_SM103_Дашборд», нажать «Создать»
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новый дашборд', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Новый дашборд' });
    await createDialog.getByRole('textbox', { name: 'Название дашборда' }).fill('TEST_SM103_Дашборд');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(dashRow).toBeVisible();
  });

  // Шаг 1. Открыть TEST_SM103_Дашборд → «Начать редактирование»
  await dashRow.click();
  await page.getByRole('button', { name: 'Начать редактирование' }).click();

  // Шаг 2. «Добавить текст», заменить текст виджета на «Заголовок дашборда»
  await page.getByRole('button', { name: 'Добавить текст' }).click();
  await page.getByRole('textbox', { name: 'Введите подпись или заметку…' }).fill('Заголовок дашборда');

  // Шаг 3. Нажать «Готово»
  // Кнопка «Редактировать» появляется сразу, а сохранение идёт следом запросом PUT /dashboards/<id> — ждём его
  const dashboardSaved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/dashboards\//.test(r.url()));
  await page.getByRole('button', { name: 'Готово' }).click();
  expect((await dashboardSaved).ok()).toBe(true);

  // Шаг 4. Перезагрузить страницу
  await page.reload();

  // Ожидание: виден текст «Заголовок дашборда»
  await expect(page.getByText('Заголовок дашборда')).toBeVisible({ timeout: 60_000 });
});

import { test, expect, type FileChooser } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Картинка 1×1 PNG, создаётся в коде (без файлов с компьютера)
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test('SM-63 Загрузка ресурса', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let chooser: FileChooser;

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Структуры проекта» → «Библиотека ресурсов»', async () => {
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('banner').getByRole('button', { name: 'Структуры проекта' }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Библиотека ресурсов' }).click();
  });

  await test.step('Шаг 2. Нажать «Загрузить» и выбрать картинку TEST_SM63.png (тест создаёт её сам)', async () => {
    [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Загрузить' }).click()]);
    await chooser.setFiles({ name: 'TEST_SM63.png', mimeType: 'image/png', buffer: PNG });

    // Ожидание 1: уведомление «Загружен 1 ресурс»
    await expect(page.getByText('Загружен 1 ресурс')).toBeVisible();

    // Ожидание 2: видна карточка «TEST_SM63.png»
    await expect(page.getByRole('button', { name: /^TEST_SM63\.png/ })).toBeVisible();
  });
});

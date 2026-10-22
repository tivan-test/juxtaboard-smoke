import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Картинка 1×1 PNG, создаётся в коде (без файлов с компьютера)
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test('SM-65 Поиск ресурса по #тегу', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const card = page.getByRole('button', { name: /^TEST_SM65\.png/ });

  await test.step('Предусловие (SM-63): загрузить свой ресурс TEST_SM65.png', async () => {
    // Шаг 1. Открыть навигатор пространства прогона → «Структуры проекта» → «Библиотека ресурсов»
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('banner').getByRole('button', { name: 'Структуры проекта' }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Библиотека ресурсов' }).click();
    // Шаг 2. Нажать «Загрузить» и выбрать картинку TEST_SM65.png (тест создаёт её сам)
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Загрузить' }).click()]);
    await chooser.setFiles({ name: 'TEST_SM65.png', mimeType: 'image/png', buffer: PNG });
    await expect(card).toBeVisible();
  });

  await test.step('Предусловие (SM-64): поставить ресурсу тег TEST_sm65', async () => {
    // Шаг 1. Открыть карточку TEST_SM65.png
    await card.click();
    // Шаг 2. Ввести «Альт-текст»: «TEST alt», «Теги»: «TEST_sm65»
    await page.getByRole('textbox', { name: 'Альт-текст' }).fill('TEST alt');
    await page.getByRole('textbox', { name: 'Теги (через запятую)' }).fill('TEST_sm65');
    // Шаг 3. Нажать «Сохранить»
    // Подтверждения на экране нет: ждём ответа сервера на сохранение карточки
    const saved = page.waitForResponse((r) => r.request().method() === 'PATCH' && /\/assets\//.test(r.url()));
    await page.getByRole('button', { name: 'Сохранить' }).click();
    expect((await saved).ok()).toBe(true);
  });

  // Шаг 1. Открыть «Библиотека ресурсов»
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await page.getByRole('banner').getByRole('button', { name: 'Структуры проекта' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Библиотека ресурсов' }).click();

  // Шаг 2. Ввести в поиск «#TEST_sm65»
  await page.getByRole('textbox', { name: 'Поиск по имени или группе · #тег — фильтр' }).fill('#TEST_sm65');

  // Ожидание 1: видно «Показано 1 из 1»
  await expect(page.getByText('Показано 1 из 1')).toBeVisible();

  // Ожидание 2: видна карточка «TEST_SM65.png»
  await expect(card).toBeVisible();
});

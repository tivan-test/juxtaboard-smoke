import { test, expect, type Response } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Картинка 1×1 PNG, создаётся в коде (без файлов с компьютера)
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test('SM-64 Альт-текст и теги ресурса', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const card = page.getByRole('button', { name: /^TEST_SM64\.png/ });

  await test.step('Предусловие (SM-63): загрузить свой ресурс TEST_SM64.png', async () => {
    // Шаг 1. Открыть навигатор пространства прогона → «Структуры проекта» → «Библиотека ресурсов»
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('banner').getByRole('button', { name: 'Структуры проекта' }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Библиотека ресурсов' }).click();
    // Шаг 2. Нажать «Загрузить» и выбрать картинку TEST_SM64.png (тест создаёт её сам)
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Загрузить' }).click()]);
    await chooser.setFiles({ name: 'TEST_SM64.png', mimeType: 'image/png', buffer: PNG });
    await expect(card).toBeVisible();
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let saved: Promise<Response>;

  await test.step('Шаг 1. Открыть карточку TEST_SM64.png', async () => {
    await card.click();
  });

  await test.step('Шаг 2. Ввести «Альт-текст»: «TEST alt», «Теги»: «TEST_sm64»', async () => {
    await page.getByRole('textbox', { name: 'Альт-текст' }).fill('TEST alt');
    await page.getByRole('textbox', { name: 'Теги (через запятую)' }).fill('TEST_sm64');
  });

  await test.step('Шаг 3. Нажать «Сохранить»', async () => {
    // Подтверждения на экране нет: ждём ответа сервера на сохранение карточки
    saved = page.waitForResponse((r) => r.request().method() === 'PATCH' && /\/assets\//.test(r.url()));
    await page.getByRole('button', { name: 'Сохранить' }).click();
    expect((await saved).ok()).toBe(true);
  });

  await test.step('Шаг 4. Перезагрузить страницу и открыть карточку TEST_SM64.png', async () => {
    await page.reload();
    await card.click({ timeout: 60_000 });

    // Ожидание: в «Альт-текст» «TEST alt», в «Теги» «TEST_sm64»
    await expect(page.getByRole('textbox', { name: 'Альт-текст' })).toHaveValue('TEST alt');
    await expect(page.getByRole('textbox', { name: 'Теги (через запятую)' })).toHaveValue('TEST_sm64');
  });
});

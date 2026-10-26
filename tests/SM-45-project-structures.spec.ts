import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-45 «Структуры проекта»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let admin: Locator, panel: Locator;

  await test.step('Шаг 1. Открыть навигатор пространства прогона', async () => {
    await page.goto(url);
    admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
    await expect(admin).toBeVisible({ timeout: 60_000 });
  });

  await test.step('Шаг 2. Нажать «Структуры проекта»', async () => {
    await page.getByRole('banner').getByRole('button', { name: 'Структуры проекта' }).click();
    panel = page.getByRole('dialog');

    // Ожидание: видны «Библиотека ресурсов», «Справочники сотрудников», «Рабочие календари», «Курсы валют», «Внешние порталы», «Сборка из модулей»
    await expect(panel.getByRole('link', { name: 'Библиотека ресурсов' })).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Справочники сотрудников' })).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Рабочие календари' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Курсы валют' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Внешние порталы' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Сборка из модулей' })).toBeVisible();
  });
});

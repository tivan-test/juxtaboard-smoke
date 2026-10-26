import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-109 «Новый пакет сбора данных», без создания', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let packageDialog;

  await test.step('Шаг 1. Стрелка ▾ у «+ Документ» → «Дополнительно» → «Новый пакет сбора данных»', async () => {
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Дополнительно' }).hover();
    await page.getByRole('menuitem', { name: 'Новый пакет сбора данных' }).click();
    packageDialog = page.getByRole('dialog', { name: 'Новый пакет сбора данных' });

    // Ожидание: после шага 1 видна кнопка «Создать пакет»
    await expect(packageDialog.getByRole('button', { name: 'Создать пакет' })).toBeVisible();
  });

  await test.step('Шаг 2. Закрыть окно', async () => {
    await packageDialog.getByRole('button', { name: 'Close' }).click();
  });
});

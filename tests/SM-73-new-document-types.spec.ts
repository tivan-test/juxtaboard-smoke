import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-73 Стрелка ▾ у «+ Документ»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let menu;

  await test.step('Шаг 1. Открыть навигатор пространства прогона', async () => {
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  });

  await test.step('Шаг 2. Нажать стрелку ▾ рядом с «+ Документ»', async () => {
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    menu = page.getByRole('menu');

    // Ожидание: видны типы документов (ничего не создаём)
    for (const item of ['Новый документ', 'Новая таблица данных', 'Новая электронная таблица', 'Новый дашборд', 'Новая карта процесса', 'Новая форма', 'Новая ссылка', 'Новая доска', 'Дополнительно']) {
      await expect(menu.getByRole('menuitem', { name: item, exact: true })).toBeVisible();
    }
  });
});

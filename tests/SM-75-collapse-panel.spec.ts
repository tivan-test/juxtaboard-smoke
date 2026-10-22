import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-75 «Свернуть панель»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const filter = page.getByRole('textbox', { name: 'Фильтр по имени или #тегу…' });
  // У стрелок «<» и «>» нет названий, находим их по иконке.
  // TODO для разработчиков: добавить кнопкам aria-label «Свернуть панель» / «Развернуть панель»
  const collapse = page.getByRole('main').getByRole('button').filter({ has: page.locator('svg.lucide-chevron-left') });
  const expand = page.getByRole('main').getByRole('button').filter({ has: page.locator('svg.lucide-chevron-right') });
  // При свёрнутой панели поле остаётся на странице, его обрезает край панели.
  // Поэтому «видно» проверяем так, как видит человек: поле находится в своей точке экрана
  const filterSeen = () => filter.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && el.contains(hit);
  });

  // Шаг 1. Открыть навигатор пространства прогона
  await page.goto(url);
  await expect(filter).toBeVisible({ timeout: 60_000 });

  // Шаг 2. Нажать «Свернуть панель» (стрелка «<» вверху панели)
  await collapse.click();

  // Ожидание 1: поле «Фильтр по имени или #тегу…» не видно
  await expect.poll(filterSeen, { message: 'поле фильтра скрыто' }).toBe(false);

  // Шаг 3. Нажать стрелку «>» на узкой полосе слева
  await expand.click();

  // Ожидание 2: поле «Фильтр по имени или #тегу…» снова видно
  await expect.poll(filterSeen, { message: 'поле фильтра снова видно' }).toBe(true);
});

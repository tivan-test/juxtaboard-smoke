import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Значение ячейки рисуется на canvas и в DOM его нет, поэтому читаем его через копирование ячейки в буфер обмена
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('SM-101 Формула «=2+3»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const sheetRow = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM101_Электронная' });

  await test.step('Предусловие (SM-100): создать свою электронную таблицу TEST_SM101_Электронная', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая электронная таблица», ввести «TEST_SM101_Электронная», нажать «Создать»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await page.getByRole('main').getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая электронная таблица', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Новая электронная таблица' });
    await createDialog.getByRole('textbox', { name: 'Название электронной таблицы' }).fill('TEST_SM101_Электронная');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(sheetRow).toBeVisible();
  });

  // Шаг 1. Открыть TEST_SM101_Электронная
  // Электронная таблица после создания сама не открывается, поэтому нажимаем на неё в дереве
  await sheetRow.click();
  await expect(page.getByRole('tab', { name: 'Sheet1' })).toBeVisible({ timeout: 30_000 });

  // Шаг 2. В ячейку A1 ввести «=2+3», нажать Enter
  // Ячейки нарисованы без ролей и текста; после открытия листа ячейка A1 уже выделена,
  // поэтому вводим формулу с клавиатуры. Ждём поле адреса (безымянное поле ввода) со значением «A1»
  await expect.poll(() => page.getByRole('textbox').evaluateAll((els) => els.some((e) => (e as HTMLInputElement).value === 'A1')), { message: 'выделена ячейка A1' }).toBe(true);
  await page.keyboard.type('=2+3');
  await page.keyboard.press('Enter');

  // Ожидание: в A1 «5»
  // Значение нарисовано без текста в странице: копируем A1 и читаем буфер обмена.
  // Таблица кладёт в буфер то обычный текст, то только HTML — читаем что есть.
  // После Enter выделение уходит на A2 — стрелкой вверх возвращаемся на A1
  await page.keyboard.press('ArrowUp');
  // Каждая попытка сначала читает буфер, а потом копирует A1 заново (для следующей попытки):
  // так чтение не пересекается с записью в буфер
  const copiedA1 = async () => {
    const text = await page.evaluate(async () => {
      try {
        const [item] = await navigator.clipboard.read();
        if (!item) return '';
        if (item.types.includes('text/plain')) return (await (await item.getType('text/plain')).text()).trim();
        if (!item.types.includes('text/html')) return '';
        const box = document.createElement('div');
        box.innerHTML = await (await item.getType('text/html')).text();
        return (box.textContent ?? '').trim();
      } catch {
        return '';
      }
    });
    await page.keyboard.press('ControlOrMeta+c');
    return text;
  };
  await expect.poll(copiedA1, { message: 'в A1 значение 5' }).toBe('5');
});

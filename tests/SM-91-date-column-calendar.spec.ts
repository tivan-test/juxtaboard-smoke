import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-91 Столбец «Дата» и вид «Календарь»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  // Строка дерева документов: у строк дерева нет роли, ищем по атрибуту data-document-id
  const treeItem = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM91_Таблица' });

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayCell = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM91_Таблица со строкой «Строка календарь»', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await main.getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM91_Таблица», нажать «Создать»
    const createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM91_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(treeItem).toBeVisible();
    // Шаг 4. Открыть TEST_SM91_Таблица
    await treeItem.click();
    // Шаг 5. Нажать «Добавить первый столбец»
    await main.getByRole('button', { name: 'Добавить первый столбец' }).click();
    // Шаг 6. Ввести название поля «Название», тип «Текст», нажать «Создать поле»
    const fieldDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
    await fieldDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Название');
    await fieldDialog.getByRole('button', { name: /^Текст Одна строка/ }).click();
    await fieldDialog.getByRole('button', { name: 'Создать поле' }).click();
    await expect(main.getByText('Название', { exact: true })).toBeVisible();
    // Шаг 7. Нажать «Добавить строку», ввести в «Название» «Строка календарь», нажать Enter
    await main.getByRole('button', { name: 'Добавить строку' }).click();
    // Пустая ячейка новой строки показывает «—»; двойной клик открывает ввод, фокус сразу в нём
    await main.getByText('—', { exact: true }).dblclick();
    await page.keyboard.type('Строка календарь');
    await page.keyboard.press('Enter');
    await expect(main.getByText('Строка календарь')).toBeVisible();
  });

  // Шаг 1. Открыть TEST_SM91_Таблица
  await treeItem.click();

  // Шаг 2. Нажать «+» в шапке, название «Дата», тип «Дата», нажать «Создать поле»
  await main.getByRole('button', { name: 'Добавить столбец' }).click();
  const dateDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
  await dateDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Дата');
  await dateDialog.getByRole('button', { name: /^Дата Календарная/ }).click();
  await dateDialog.getByRole('button', { name: 'Создать поле' }).click();
  await expect(main.getByText('Дата', { exact: true })).toBeVisible();

  // Шаг 3. В ячейку «Дата» ввести сегодняшнюю дату
  // В строке одна пустая ячейка «—» (столбец «Дата»); двойной клик открывает поле даты
  await main.getByText('—', { exact: true }).dblclick();
  // У поля даты в ячейке нет названия, находим по типу input
  await main.locator('input[type="date"]').fill(todayIso);
  await page.keyboard.press('Enter');
  await expect(main.getByText(todayCell)).toBeVisible();

  // Шаг 4. Вид «По умолчанию» → «Календарь»
  await main.getByRole('button', { name: 'По умолчанию' }).click();
  await page.getByRole('button', { name: 'Календарь', exact: true }).click();

  // Ожидание: «Строка календарь» видна в клетке сегодняшнего дня
  // Число дня в клетке: у чисел 28–31 есть дубль из соседнего месяца (берём последнее), у 1–6 — тоже (берём первое)
  const dayNumbers = main.getByText(String(now.getDate()), { exact: true });
  const dayNumber = now.getDate() <= 6 ? dayNumbers.first() : dayNumbers.last();
  // У клетки календаря нет роли: клетка — это контейнер на два уровня выше числа
  const dayCell = dayNumber.locator('xpath=../..');
  const card = main.getByRole('button', { name: 'Строка календарь' });
  // Карточка нарисована поверх недели, не внутри клетки, поэтому сравниваем положение на экране
  await expect.poll(async () => {
    const c = await card.boundingBox();
    const d = await dayCell.boundingBox();
    return c !== null && d !== null
      && c.x >= d.x - 1 && c.x + c.width <= d.x + d.width + 1
      && c.y >= d.y && c.y + c.height <= d.y + d.height + 1;
  }).toBe(true);
});

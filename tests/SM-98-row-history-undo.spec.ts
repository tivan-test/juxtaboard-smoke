import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-98 История строки и «Отменить»', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  // Строка дерева документов: у строк дерева нет роли, ищем по атрибуту data-document-id
  const treeItem = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM98_Таблица' });

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM98_Таблица со строкой «Было»', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await main.getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM98_Таблица», нажать «Создать»
    const createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM98_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(treeItem).toBeVisible();
    // Шаг 4. Открыть TEST_SM98_Таблица
    await treeItem.click();
    // Шаг 5. Нажать «Добавить первый столбец»
    await main.getByRole('button', { name: 'Добавить первый столбец' }).click();
    // Шаг 6. Ввести название поля «Название», тип «Текст», нажать «Создать поле»
    const fieldDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
    await fieldDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Название');
    await fieldDialog.getByRole('button', { name: /^Текст Одна строка/ }).click();
    await fieldDialog.getByRole('button', { name: 'Создать поле' }).click();
    await expect(main.getByText('Название', { exact: true })).toBeVisible();
    // Шаг 7. Нажать «Добавить строку», ввести в «Название» «Было», нажать Enter
    await main.getByRole('button', { name: 'Добавить строку' }).click();
    // Пустая ячейка новой строки показывает «—»; двойной клик открывает ввод, фокус сразу в нём
    await main.getByText('—', { exact: true }).dblclick();
    await page.keyboard.type('Было');
    await page.keyboard.press('Enter');
    await expect(main.getByText('Было', { exact: true })).toBeVisible();
  });

  // Шаг 1. Открыть TEST_SM98_Таблица, заменить «Было» на «Стало»
  await treeItem.click();
  // Двойной клик открывает ввод с текстом ячейки; выделяем всё и печатаем новое значение
  await main.getByText('Было', { exact: true }).dblclick();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('Стало');
  // Правка сохраняется запросом PATCH /table-rows/<id>; ждём его, иначе журнал может открыться раньше записи
  const rowSaved = page.waitForResponse((r) => r.request().method() === 'PATCH' && /\/table-rows\//.test(r.url()));
  await page.keyboard.press('Enter');
  expect((await rowSaved).ok()).toBe(true);
  await expect(main.getByText('Стало', { exact: true })).toBeVisible();

  // Шаг 2. Правый клик по строке → «История» → вкладка «Журнал»
  await main.getByText('Стало', { exact: true }).click({ button: 'right' });
  // Пункты контекстного меню строки — это обычные кнопки (роли menuitem у них нет)
  await page.getByRole('button', { name: 'История', exact: true }).click();
  const history = page.getByRole('dialog', { name: 'Стало' });
  await history.getByRole('tab', { name: 'Журнал' }).click();

  // Ожидание 1: после шага 2 в журнале правка «Было → Стало»
  // Стрелка и значения лежат в отдельных span, поэтому ищем по тексту с произвольными пробелами
  const edit = history.getByRole('listitem').filter({ hasText: /Было\s*→\s*Стало$/ });
  await expect(edit).toBeVisible();

  // Шаг 3. У правки «Было → Стало» нажать «Отменить», затем «Отменить изменения»
  // «Отменить» стоит в заголовке записи журнала, а список правки лежит тремя уровнями ниже, поднимаемся к записи целиком
  await edit.locator('xpath=../../..').getByRole('button', { name: 'Отменить', exact: true }).click();
  await page.getByRole('button', { name: 'Отменить изменения' }).click();

  // Ожидание 2: после шага 3 уведомление «Отменено, изменено строк: 1»
  await expect(page.getByText('Отменено, изменено строк: 1')).toBeVisible();

  // Ожидание 3: в строке снова «Было»
  // Окно истории закрывает таблицу от проверки, поэтому сначала закрываем его кнопкой ✕ (Esc закрывает не всегда)
  const historyWindow = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Предыдущая запись' }) });
  await historyWindow.getByRole('button', { name: /^(Close|Закрыть)$/ }).click();
  await expect(historyWindow).toBeHidden();
  await expect(main.getByText('Было', { exact: true })).toBeVisible();
});

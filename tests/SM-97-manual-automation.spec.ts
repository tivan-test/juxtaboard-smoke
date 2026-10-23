import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-97 Создать правило и запустить по строке', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const main = page.getByRole('main');
  // Строка дерева документов: у строк дерева нет роли, ищем по атрибуту data-document-id
  const treeItem = page.locator('[data-document-id]').filter({ hasText: 'TEST_SM97_Таблица' });

  await test.step('Предусловие (SM-85, SM-86, SM-87): создать свою таблицу TEST_SM97_Таблица со строкой «Строка до»', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Стрелка ▾ у «+ Документ» → «Новая таблица данных»
    // У стрелки название «Новая таблица данных» (так в продукте), по нему и находим
    await main.getByRole('button', { name: 'Новая таблица данных' }).click();
    await page.getByRole('menuitem', { name: 'Новая таблица данных', exact: true }).click();
    // Шаг 3. Ввести «TEST_SM97_Таблица», нажать «Создать»
    const createDialog = page.getByRole('dialog', { name: 'Новая таблица данных' });
    await createDialog.getByRole('textbox', { name: 'Название таблицы' }).fill('TEST_SM97_Таблица');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(treeItem).toBeVisible();
    // Шаг 4. Открыть TEST_SM97_Таблица
    await treeItem.click();
    // Шаг 5. Нажать «Добавить первый столбец»
    await main.getByRole('button', { name: 'Добавить первый столбец' }).click();
    // Шаг 6. Ввести название поля «Название», тип «Текст», нажать «Создать поле»
    const fieldDialog = page.getByRole('dialog', { name: 'Добавить колонку' });
    await fieldDialog.getByRole('textbox', { name: 'напр. Статус, Ответственный, Срок' }).fill('Название');
    await fieldDialog.getByRole('button', { name: /^Текст Одна строка/ }).click();
    await fieldDialog.getByRole('button', { name: 'Создать поле' }).click();
    await expect(main.getByText('Название', { exact: true })).toBeVisible();
    // Шаг 7. Нажать «Добавить строку», ввести в «Название» «Строка до», нажать Enter
    await main.getByRole('button', { name: 'Добавить строку' }).click();
    // Пустая ячейка новой строки показывает «—»; двойной клик открывает ввод, фокус сразу в нём
    await main.getByText('—', { exact: true }).dblclick();
    await page.keyboard.type('Строка до');
    await page.keyboard.press('Enter');
    await expect(main.getByText('Строка до', { exact: true })).toBeVisible();
  });

  // Шаг 1. ⋮ у TEST_SM97_Таблица → «Автоматизации…» → «Новое правило»
  // У ⋮ нет названия, это кнопка с выпадающим меню в строке дерева
  await treeItem.hover();
  await treeItem.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Автоматизации…', exact: true }).click();
  await main.getByRole('button', { name: 'Новое правило' }).click();

  // Шаг 2. Название «TEST_SM97_Правило», триггер «Вручную»
  await page.getByRole('textbox', { name: 'напр. Уведомить владельца о статусе Won' }).fill('TEST_SM97_Правило');
  await page.getByRole('button', { name: 'Вручную', exact: true }).click();

  // Шаг 3. «Добавить действие» (по умолчанию «Установить поля этой строки»), «Добавить поле»: «Название» = «Строка после»
  await page.getByRole('button', { name: 'Добавить действие' }).click();
  await page.getByRole('button', { name: 'Добавить поле' }).click();
  // У выпадающего списка колонок нет названия, находим его по пункту «колонка…»
  await page.getByRole('combobox').filter({ has: page.getByRole('option', { name: 'колонка…' }) }).selectOption('Название');
  // Поле значения не имеет названия и это не обычный input (редактор с подстановками), других вариантов нет
  await page.locator('[contenteditable="true"]').fill('Строка после');

  // Шаг 4. Нажать «Создать»
  await page.getByRole('button', { name: 'Создать', exact: true }).click();

  // Ожидание 1: после шага 4 правило «TEST_SM97_Правило» в списке, включено
  const ruleRow = main.getByRole('row', { name: /TEST_SM97_Правило/ });
  await expect(ruleRow).toBeVisible();
  await expect(ruleRow.getByRole('switch')).toBeChecked();

  // Шаг 5. Открыть TEST_SM97_Таблица заново по адресу (перезагрузкой)
  // Сначала открываем таблицу из дерева, чтобы в адресе появился её номер, затем перезагружаем страницу
  await treeItem.click();
  await expect(main.getByRole('button', { name: 'Добавить строку' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await expect(main.getByText('Строка до', { exact: true })).toBeVisible();

  // Шаг 6. Правый клик по строке → «Запустить автоматизацию» → «TEST_SM97_Правило»
  await main.getByText('Строка до', { exact: true }).click({ button: 'right' });
  // Пункты контекстного меню строки — это обычные кнопки (роли menuitem у них нет)
  await page.getByRole('button', { name: 'Запустить автоматизацию' }).click();
  await page.getByRole('button', { name: 'TEST_SM97_Правило' }).click();

  // Ожидание 2: после шага 6 уведомление «Выполнено «TEST_SM97_Правило»»
  await expect(page.getByText('Выполнено «TEST_SM97_Правило»')).toBeVisible();

  // Ожидание 3: в строке «Строка после»
  await expect(main.getByText('Строка после', { exact: true })).toBeVisible();
});

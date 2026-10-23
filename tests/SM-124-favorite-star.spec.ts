import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-124 Звёздочка на главной пространства', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');
  // Разделы главной — это теги section без названия, ролей у них нет; находим по заголовку внутри
  const recent = panel.locator('section').filter({ has: page.getByRole('heading', { name: 'Недавно открытые', exact: true }) });
  const favorites = panel.locator('section').filter({ has: page.getByRole('heading', { name: 'Избранное', exact: true }) });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM124_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM124_Текст», нажать «Создать»
    await panel.getByRole('button', { name: 'Документ', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM124_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(page.locator('[contenteditable="true"]')).toBeVisible({ timeout: 30_000 });
  });

  // Шаг 1. Открыть навигатор пространства прогона → «Главная»
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await panel.getByRole('button', { name: 'Главная' }).click();

  // Карточка документа в «Недавно открытые»: блок, где есть и название, и кнопка «Убрать из недавних»
  // (последний подходящий блок — самый вложенный, то есть сама карточка)
  const card = recent
    .locator('div')
    .filter({ has: page.getByText('TEST_SM124_Текст', { exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'Убрать из недавних' }) })
    .last();
  await expect(card).toBeVisible({ timeout: 30_000 });

  // Шаг 2. На карточке TEST_SM124_Текст в «Недавно открытые» нажать «В избранное»
  await card.hover();
  await card.getByRole('button', { name: 'В избранное' }).click();

  // Ожидание 1: TEST_SM124_Текст в разделе «Избранное»
  await expect(favorites.getByText('TEST_SM124_Текст', { exact: true })).toBeVisible();

  // Шаг 3. Нажать звёздочку ещё раз
  await card.hover();
  await card.getByRole('button', { name: 'Убрать из избранного' }).click();

  // Ожидание 2: в «Избранном» TEST_SM124_Текст нет (звёздочка снята — исходное состояние восстановлено)
  await expect(favorites.getByText('TEST_SM124_Текст', { exact: true })).toBeHidden();
});

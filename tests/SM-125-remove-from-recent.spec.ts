import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-125 «×» на карточке', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');
  // Раздел главной — тег section без названия, роли у него нет; находим по заголовку внутри
  const recent = panel.locator('section').filter({ has: page.getByRole('heading', { name: 'Недавно открытые', exact: true }) });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM125_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await page.goto(url);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM125_Текст», нажать «Создать»
    await panel.getByRole('button', { name: 'Документ', exact: true }).click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM125_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(page.locator('[contenteditable="true"]')).toBeVisible({ timeout: 30_000 });
  });

  // Шаг 1. Открыть навигатор пространства прогона → «Главная»
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await panel.getByRole('button', { name: 'Главная' }).click();

  // Карточка документа: блок, где есть и название, и кнопка «Убрать из недавних» (последний подходящий — сама карточка)
  const card = recent
    .locator('div')
    .filter({ has: page.getByText('TEST_SM125_Текст', { exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'Убрать из недавних' }) })
    .last();
  await expect(card).toBeVisible({ timeout: 30_000 });

  // Шаг 2. На карточке TEST_SM125_Текст нажать «×» (кнопка называется «Убрать из недавних»)
  await card.hover();
  await card.getByRole('button', { name: 'Убрать из недавних' }).click();

  // Ожидание: TEST_SM125_Текст в «Недавно открытые» нет
  await expect(recent.getByText('TEST_SM125_Текст', { exact: true })).toBeHidden();
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace } from './support/navigator';

test('SM-125 «×» на карточке', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');
  // Раздел главной — тег section без названия, роли у него нет; находим по заголовку внутри
  // eslint-disable-next-line playwright/no-raw-locators -- пробел приложения: у раздела главной нет названия (section без aria-labelledby)
  const recent = panel.locator('section').filter({ has: page.getByRole('heading', { name: 'Недавно открытые', exact: true }) });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM125_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM125_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM125_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(page.getByRole('textbox', { name: 'Текст документа' })).toBeVisible({ timeout: 30_000 });
  });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let card;

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Главная»', async () => {
    await openSpace(page, url);
    await panel.getByRole('button', { name: 'Главная' }).click();

    // Карточка документа: блок, где есть и название, и кнопка «Убрать из недавних»
    // (у карточки нет роли; последний подходящий блок — самый вложенный, то есть сама карточка)
    // eslint-disable-next-line playwright/no-raw-locators, playwright/no-nth-methods -- пробел приложения: карточка недавнего документа — div без роли и названия
    card = recent.locator('div').filter({ has: page.getByText('TEST_SM125_Текст', { exact: true }) }).filter({ has: page.getByRole('button', { name: 'Убрать из недавних' }) }).last();
    await expect(card).toBeVisible({ timeout: 30_000 });
  });

  await test.step('Шаг 2. На карточке TEST_SM125_Текст нажать «×»', async () => {
    await card.hover();
    await card.getByRole('button', { name: 'Убрать из недавних' }).click();

    // Ожидание: TEST_SM125_Текст в «Недавно открытые» нет
    await expect(recent.getByText('TEST_SM125_Текст', { exact: true })).toBeHidden();
  });
});

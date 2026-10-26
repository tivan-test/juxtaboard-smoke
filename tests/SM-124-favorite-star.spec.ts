import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { navigatorButton, openSpace } from './support/navigator';

test('SM-124 Звёздочка на главной пространства', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const panel = page.getByRole('main');
  // Разделы главной — теги section без названия, ролей у них нет; находим по заголовку внутри
  // eslint-disable-next-line playwright/no-raw-locators -- пробел приложения: у раздела главной нет названия (section без aria-labelledby)
  const recent = panel.locator('section').filter({ has: page.getByRole('heading', { name: 'Недавно открытые', exact: true }) });
  // eslint-disable-next-line playwright/no-raw-locators -- пробел приложения: у раздела главной нет названия (section без aria-labelledby)
  const favorites = panel.locator('section').filter({ has: page.getByRole('heading', { name: 'Избранное', exact: true }) });

  await test.step('Предусловие (SM-76): создать свой документ TEST_SM124_Текст', async () => {
    // Шаг 1. Открыть навигатор пространства прогона
    await openSpace(page, url);
    // Шаг 2. Нажать «+ Документ», ввести название «TEST_SM124_Текст», нажать «Создать»
    await navigatorButton(page, 'Документ').click();
    const createDialog = page.getByRole('dialog', { name: 'Создать документ' });
    await createDialog.getByRole('textbox', { name: 'Название документа' }).fill('TEST_SM124_Текст');
    await createDialog.getByRole('button', { name: 'Создать' }).click();
    await expect(page.getByRole('textbox', { name: 'Текст документа' })).toBeVisible({ timeout: 30_000 });
  });

  // Шаг 1. Открыть навигатор пространства прогона → «Главная»
  await openSpace(page, url);
  await panel.getByRole('button', { name: 'Главная' }).click();

  // Карточка документа в «Недавно открытые»: блок, где есть и название, и кнопка «Убрать из недавних»
  // (у карточки нет роли; последний подходящий блок — самый вложенный, то есть сама карточка)
  // eslint-disable-next-line playwright/no-raw-locators, playwright/no-nth-methods -- пробел приложения: карточка недавнего документа — div без роли и названия
  const card = recent.locator('div').filter({ has: page.getByText('TEST_SM124_Текст', { exact: true }) }).filter({ has: page.getByRole('button', { name: 'Убрать из недавних' }) }).last();
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

import type { Locator, Page } from '@playwright/test';

// Главная /projects. У разделов пространств и у карточек нет ролей: раздел —
// безымянная <section>/<div>, карточка — <div data-slot="card"> (shadcn Card).
// Поэтому раздел берём по его якорю (на #active-spaces / #hidden-spaces ведут
// ссылки-счётчики под заголовком страницы), а карточку — по её заголовку h3
// с названием пространства. Внутри карточки всё уже по ролям.

/** Раздел «Активные пространства». Раздел скрытых лежит внутри него */
export function activeSpaces(page: Page) {
  // eslint-disable-next-line playwright/no-raw-locators -- у раздела нет роли и имени; #active-spaces — якорь ссылки «Активных пространств: N»
  return page.locator('#active-spaces');
}

/** Раздел «Скрытые пространства» (карточки в нём есть, только когда он раскрыт) */
export function hiddenSpaces(page: Page) {
  // eslint-disable-next-line playwright/no-raw-locators -- у раздела нет роли и имени; #hidden-spaces — якорь ссылки «Скрытых пространств: M»
  return page.locator('#hidden-spaces');
}

/** Заголовки карточек раздела: у каждой карточки ровно один h3 с названием */
export function spaceCardTitles(section: Locator) {
  return section.getByRole('heading', { level: 3 });
}

/** Карточка пространства по точному названию */
export function spaceCard(section: Locator, name: string) {
  const title = section.page().getByRole('heading', { level: 3, name, exact: true });
  // eslint-disable-next-line playwright/no-raw-locators -- у карточки нет роли: это div data-slot="card"
  return section.locator('[data-slot="card"]').filter({ has: title });
}

/** Открыть ⋮ «Действия» карточки (кнопка видна при наведении на карточку) */
export async function openSpaceCardActions(card: Locator) {
  await card.hover();
  await card.getByRole('button', { name: 'Действия', exact: true }).click();
}

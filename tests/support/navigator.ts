import { expect, type Locator, type Page } from '@playwright/test';

// Навигатор пространства: дерево документов — это ARIA-дерево «Документы».
// Элемент дерева (treeitem) назван по документу или папке; его раскрытые дети
// лежат внутри него, в role=group.

/** Открыть навигатор пространства прогона и дождаться загрузки */
export async function openSpace(page: Page, url: string) {
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
}

// У панели навигатора нет своего ориентира (landmark) с названием, а одноимённые
// элементы бывают и в правой части страницы: в пустом пространстве экран «Давайте
// настроим пространство» показывает свои «Документ» и «Папка», а «Все файлы» —
// своё поле «Фильтр по имени или #тегу…». Панель навигатора в DOM раньше — берём первое.

/** Кнопка панели навигатора: «Папка», «Документ», «Шаблон» */
export function navigatorButton(page: Page, name: string) {
  // eslint-disable-next-line playwright/no-nth-methods -- пробел приложения: у панели навигатора нет ориентира, по которому её отличить от экрана пустого пространства
  return page.getByRole('main').getByRole('button', { name, exact: true }).first();
}

/** Поле «Фильтр по имени или #тегу…» над деревом */
export function treeFilter(page: Page) {
  // eslint-disable-next-line playwright/no-nth-methods -- пробел приложения: у панели навигатора нет ориентира, по которому её отличить от «Все файлы»
  return page.getByRole('main').getByRole('textbox', { name: 'Фильтр по имени или #тегу…' }).first();
}

/** «Режимы отображения» → режим («Документы», «Архив», «Шаблоны», «Вложенные файлы») */
export async function chooseViewMode(page: Page, mode: string) {
  await page.getByRole('main').getByRole('button', { name: 'Режимы отображения' }).click();
  await page.getByRole('menuitem', { name: mode, exact: true }).click();
}

/** Дерево документов навигатора */
export function docTree(page: Page) {
  return page.getByRole('tree', { name: 'Документы' });
}

/** Документ или папка в дереве (на любом уровне) по точному названию */
export function treeItem(page: Page, name: string) {
  return docTree(page).getByRole('treeitem', { name, exact: true });
}

/** Дочерний элемент: дети раскрытого элемента лежат в его role=group */
export function childTreeItem(parent: Locator, name: string) {
  return parent.getByRole('group').getByRole('treeitem', { name, exact: true });
}

/**
 * Строка самого элемента, без его раскрытых детей. Кликать, наводить и искать
 * ⋮ «Действия» и стрелку «Развернуть»/«Свернуть» нужно в строке: у раскрытой
 * папки середина элемента приходится на детей, а их ⋮ тоже называются «Действия».
 * Строка — первый потомок элемента с data-tree-row (контракт дерева в приложении).
 */
export function treeRow(item: Locator) {
  // eslint-disable-next-line playwright/no-raw-locators -- у строки дерева нет своей роли; data-tree-row — её метка в контракте дерева
  return item.locator(':scope > [data-tree-row]');
}

/** Открыть ⋮ «Действия» у элемента дерева (кнопка видна при наведении на строку) */
export async function openTreeItemActions(item: Locator) {
  const row = treeRow(item);
  await row.hover();
  await row.getByRole('button', { name: 'Действия', exact: true }).click();
}

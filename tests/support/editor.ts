import type { Page } from '@playwright/test';

// Текстовый документ: тело редактора — многострочное поле «Текст документа»,
// у кнопок-иконок панели инструментов название равно тексту подсказки.

/** Тело редактора текстового документа */
export function documentEditor(page: Page) {
  return page.getByRole('textbox', { name: 'Текст документа', exact: true });
}

/** Кнопка панели инструментов редактора по названию (= текст подсказки) */
export function editorToolbarButton(page: Page, name: string) {
  return page.getByRole('main').getByRole('button', { name, exact: true });
}

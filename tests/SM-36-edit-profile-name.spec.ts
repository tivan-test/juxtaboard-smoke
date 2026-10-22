import { test, expect } from '@playwright/test';

test('SM-36 Редактирование профиля и возврат', async ({ page }) => {
  const profileButton = page.getByRole('banner').getByRole('button', { name: 'AT', exact: true });
  const menu = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Редактировать профиль' }) });
  const editDialog = page.getByRole('dialog', { name: 'Редактировать профиль' });
  const firstName = editDialog.getByRole('textbox', { name: 'Имя' });
  const lastName = editDialog.getByRole('textbox', { name: 'Фамилия' });

  // Шаг 1. Открыть /projects → кнопка профиля → «Редактировать профиль»
  await page.goto('/projects');
  await profileButton.click({ timeout: 60_000 });
  await menu.getByRole('button', { name: 'Редактировать профиль' }).click();

  // Шаг 2. Запомнить имя и фамилию, дописать к имени «1»
  const originalFirst = await firstName.inputValue();
  const originalLast = await lastName.inputValue();
  await firstName.fill(`${originalFirst}1`);

  // Шаг 3. Нажать «Сохранить»
  await editDialog.getByRole('button', { name: 'Сохранить' }).click();

  // Ожидание 1: видно уведомление «Профиль обновлён.»
  await expect(page.getByText('Профиль обновлён.', { exact: true })).toBeVisible();

  // Шаг 4. Открыть кнопку профиля (уведомление висит ~4 с и может закрывать кнопку — клик дождётся)
  await profileButton.click();

  // Ожидание 2: в меню имя с «1» на конце
  await expect(menu.getByText(`${originalFirst}1 ${originalLast}`, { exact: true })).toBeVisible();

  // Шаг 5. Закрыть меню, снова «Редактировать профиль», вернуть исходное имя и нажать «Сохранить»
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await profileButton.click();
  await menu.getByRole('button', { name: 'Редактировать профиль' }).click();
  await firstName.fill(originalFirst);
  await editDialog.getByRole('button', { name: 'Сохранить' }).click();
  await expect(editDialog).toBeHidden();

  // Ожидание 3: в меню исходное имя
  await profileButton.click();
  await expect(menu.getByText(`${originalFirst} ${originalLast}`, { exact: true })).toBeVisible();
});

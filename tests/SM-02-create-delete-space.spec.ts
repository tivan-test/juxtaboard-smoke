import { test, expect } from '@playwright/test';

test('SM-02 Создание и удаление пространства', async ({ page }) => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const name = `TEST_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}_SM02`;

  // Шаг 1. На странице /projects нажать «Добавить пространство»
  await page.goto('/projects');
  await page.getByRole('banner').getByRole('button', { name: 'Добавить пространство' }).click();
  const createDialog = page.getByRole('dialog', { name: 'Добавить пространство' });

  // Шаг 2. Ввести название TEST_ГГГГММДД_ЧЧммсс_SM02
  await createDialog.getByRole('textbox', { name: 'Название' }).fill(name);

  // Шаг 3. Нажать «Создать пустым»
  await createDialog.getByRole('button', { name: 'Создать пустым' }).click();

  // Ожидание 1: открылся навигатор нового пространства, видно «Документов пока нет»
  await expect(page).toHaveURL(/\/projects\/[^/]+\/navigator/, { timeout: 60_000 });
  await expect(page.getByText('Документов пока нет')).toBeVisible({ timeout: 30_000 });

  // Шаг 4. В шапке навигатора нажать «Администрирование» → «Удалить пространство»
  await page.getByRole('button', { name: 'Администрирование' }).click();
  await page.getByRole('menuitem', { name: 'Удалить пространство' }).click();
  const deleteDialog = page.getByRole('alertdialog', { name: 'Вы уверены?' });
  const deleteButton = deleteDialog.getByRole('button', { name: 'Удалить пространство' });

  // Ожидание 2: кнопка «Удалить пространство» неактивна
  await expect(deleteButton).toBeDisabled();

  // Защита: удаляем только своё пространство с префиксом TEST_, найденное по точному названию
  expect(name).toMatch(/^TEST_/);
  const confirm = deleteDialog.getByRole('textbox', { name: `Введите название проекта для подтверждения: ${name}`, exact: true });

  // Шаг 5. Ввести название пространства в поле подтверждения
  await confirm.fill(name);

  // Ожидание 3: кнопка «Удалить пространство» активна
  await expect(deleteButton).toBeEnabled();

  // Шаг 6. Нажать «Удалить пространство»
  await deleteButton.click();
  await expect(deleteDialog).toBeHidden({ timeout: 30_000 });

  // Шаг 7. Открыть /projects и ввести название в поиск
  await page.goto('/projects');
  await page.getByRole('textbox', { name: 'Название пространства или документа…' }).fill(name);

  // Ожидание 4: видно «Ничего не найдено»
  await expect(page.getByText('Ничего не найдено')).toBeVisible({ timeout: 30_000 });
});

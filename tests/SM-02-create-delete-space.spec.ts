import { test, expect, type Locator } from '@playwright/test';

test('SM-02 Создание и удаление пространства', async ({ page }) => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const name = `TEST_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}_SM02`;

  // Объявлено до шагов, потому что используется в нескольких шагах
  let createDialog: Locator, deleteDialog: Locator, deleteButton: Locator, confirm: Locator;

  await test.step('Шаг 1. На странице /projects нажать «Добавить проект»', async () => {
    await page.goto('/projects');
    await page.getByRole('banner').getByRole('button', { name: 'Добавить проект' }).click();
    createDialog = page.getByRole('dialog', { name: 'Добавить проект' });
  });

  await test.step('Шаг 2. Ввести название TEST_ГГГГММДД_ЧЧммсс_SM02', async () => {
    await createDialog.getByRole('textbox', { name: 'Название' }).fill(name);
  });

  await test.step('Шаг 3. Нажать «Создать пустым»', async () => {
    await createDialog.getByRole('button', { name: 'Создать пустым' }).click();

    // Ожидание 1: открылся навигатор нового пространства, видно «Документов пока нет»
    await expect(page).toHaveURL(/\/projects\/[^/]+\/navigator/, { timeout: 60_000 });
    await expect(page.getByText('Документов пока нет')).toBeVisible({ timeout: 30_000 });
  });

  await test.step('Шаг 4. В шапке навигатора нажать «Администрирование» → «Удалить проект»', async () => {
    await page.getByRole('button', { name: 'Администрирование' }).click();
    await page.getByRole('menuitem', { name: 'Удалить проект' }).click();
    deleteDialog = page.getByRole('alertdialog', { name: 'Вы уверены?' });
    deleteButton = deleteDialog.getByRole('button', { name: 'Удалить проект' });

    // Ожидание 2: кнопка «Удалить проект» неактивна
    await expect(deleteButton).toBeDisabled();

    // Защита: удаляем только своё пространство с префиксом TEST_, найденное по точному названию
    expect(name).toMatch(/^TEST_/);
    confirm = deleteDialog.getByRole('textbox', { name: `Введите название проекта для подтверждения: ${name}`, exact: true });
  });

  await test.step('Шаг 5. Ввести название пространства в поле подтверждения', async () => {
    await confirm.fill(name);

    // Ожидание 3: кнопка «Удалить проект» активна
    await expect(deleteButton).toBeEnabled();
  });

  await test.step('Шаг 6. Нажать «Удалить проект»', async () => {
    await deleteButton.click();
    await expect(deleteDialog).toBeHidden({ timeout: 30_000 });
  });

  await test.step('Шаг 7. Открыть /projects и ввести название в поиск «Название проекта или документа…»', async () => {
    await page.goto('/projects');
    await page.getByRole('textbox', { name: 'Название проекта или документа…' }).fill(name);

    // Ожидание 4: видно «Ничего не найдено»
    await expect(page.getByText('Ничего не найдено')).toBeVisible({ timeout: 30_000 });
  });
});

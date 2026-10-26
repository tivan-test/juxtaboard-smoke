import { test, expect, type Locator } from '@playwright/test';

test('SM-10 Сортировка «По названию» и возврат', async ({ page }) => {
  // Объявлено до шагов, потому что используется в нескольких шагах
  let sorting: Locator;

  await test.step('Шаг 1. Открыть /projects', async () => {
    await page.goto('/projects');
    // На странице один выпадающий список — «Сортировка»
    sorting = page.getByRole('combobox');
    await expect(sorting).toBeVisible({ timeout: 60_000 });
  });

  await test.step('Шаг 2. Нажать «Сортировка»', async () => {
    await sorting.click();

    // Ожидание 1: видны варианты «По последней активности», «По названию», «По моей роли», «Сначала новые»
    await expect(page.getByRole('option', { name: 'По последней активности' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'По названию' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'По моей роли' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Сначала новые' })).toBeVisible();
  });

  await test.step('Шаг 3. Выбрать «По названию»', async () => {
    await page.getByRole('option', { name: 'По названию' }).click();

    // Ожидание 2: выбран вариант «По названию»
    await expect(sorting).toHaveText('По названию');
  });

  await test.step('Шаг 4. Нажать «Сортировка» и выбрать «По последней активности»', async () => {
    await sorting.click();
    await page.getByRole('option', { name: 'По последней активности' }).click();

    // Ожидание 3: выбран вариант «По последней активности»
    await expect(sorting).toHaveText('По последней активности');
  });
});

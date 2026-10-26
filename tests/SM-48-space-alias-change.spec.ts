import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-48 Смена алиаса и возврат', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const editDialog = page.getByRole('dialog', { name: 'Редактировать пространство' });
  const alias = editDialog.getByRole('textbox', { name: 'Алиас' });

  // Объявлено до шагов, потому что используется в нескольких шагах
  let admin: Locator, originalAlias: string;

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Администрирование» → «Редактировать»', async () => {
    await page.goto(url);
    admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
    await expect(admin).toBeVisible({ timeout: 60_000 });
    await admin.click();
    await page.getByRole('menuitem', { name: 'Редактировать', exact: true }).click();
  });

  await test.step('Шаг 2. Запомнить алиас, дописать к нему «-sm48»', async () => {
    await expect(alias).not.toHaveValue('');
    originalAlias = await alias.inputValue();
    await alias.fill(`${originalAlias}-sm48`);
  });

  await test.step('Шаг 3. Нажать «Сохранить изменения»', async () => {
    await editDialog.getByRole('button', { name: 'Сохранить изменения' }).click();
    await expect(editDialog).toBeHidden({ timeout: 30_000 });
  });

  await test.step('Шаг 4. Снова открыть «Администрирование» → «Редактировать»', async () => {
    await admin.click();
    await page.getByRole('menuitem', { name: 'Редактировать', exact: true }).click();

    // Ожидание 1: в поле «Алиас» значение с «-sm48»
    await expect(alias).toHaveValue(`${originalAlias}-sm48`);
  });

  await test.step('Шаг 5. Вернуть исходный алиас и нажать «Сохранить изменения»', async () => {
    await alias.fill(originalAlias);
    await editDialog.getByRole('button', { name: 'Сохранить изменения' }).click();
    await expect(editDialog).toBeHidden({ timeout: 30_000 });
  });

  await test.step('Шаг 6. Снова открыть «Администрирование» → «Редактировать»', async () => {
    await admin.click();
    await page.getByRole('menuitem', { name: 'Редактировать', exact: true }).click();

    // Ожидание 2: в поле «Алиас» исходное значение
    await expect(alias).toHaveValue(originalAlias);
  });
});

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-55 Состояния документов: добавить и отменить', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const dialog = page.getByRole('dialog', { name: 'Состояния документа' });
  // Названия всех состояний (значения полей «Название состояния»)
  const stateNames = () => dialog.getByRole('textbox', { name: 'Название состояния' }).evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));

  // Объявлено до шагов, потому что используется в нескольких шагах
  let admin;

  await test.step('Шаг 1. Открыть навигатор пространства прогона → «Администрирование» → «Состояния документов»', async () => {
    await page.goto(url);
    admin = page.getByRole('banner').getByRole('button', { name: 'Администрирование' });
    await expect(admin).toBeVisible({ timeout: 60_000 });
    await admin.click();
    await page.getByRole('menuitem', { name: 'Состояния документов', exact: true }).click();

    // Ожидание 1: видны состояния «Черновик», «На согласовании», «Согласовано»
    await expect.poll(stateNames, { message: 'видны три стандартных состояния' }).toEqual(expect.arrayContaining(['Черновик', 'На согласовании', 'Согласовано']));
  });

  await test.step('Шаг 2. Нажать «Добавить состояние»', async () => {
    await dialog.getByRole('button', { name: 'Добавить состояние' }).click();

    // Ожидание 2: появилась строка «Новое состояние»
    await expect.poll(stateNames, { message: 'появилась строка «Новое состояние»' }).toContain('Новое состояние');
  });

  await test.step('Шаг 3. Нажать «Отмена»', async () => {
    await dialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(dialog).toBeHidden();
  });

  await test.step('Шаг 4. Снова открыть «Администрирование» → «Состояния документов»', async () => {
    await admin.click();
    await page.getByRole('menuitem', { name: 'Состояния документов', exact: true }).click();

    // Ожидание 3: строки «Новое состояние» нет
    await expect.poll(stateNames, { message: 'состояния загрузились' }).toContain('Черновик');
    await expect.poll(stateNames, { message: 'строки «Новое состояние» нет' }).not.toContain('Новое состояние');
  });
});

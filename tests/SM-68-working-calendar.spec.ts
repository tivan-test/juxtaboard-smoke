import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('SM-68 Создание рабочего календаря', async ({ page }) => {
  // Пространство прогона (SM-02) создано перед прогоном
  const { url } = JSON.parse(readFileSync('run-space.json', 'utf8'));
  const name = page.getByPlaceholder('Например, Россия 2026');
  const hours = page.getByRole('main').getByRole('spinbutton');
  const holiday = page.getByPlaceholder('Например, Новый год');
  // У дней недели нет признака «выбран»: сравниваем вычисленный цвет фона кнопок
  const dayColor = (day: string) => page.getByRole('button', { name: day, exact: true }).evaluate((e) => getComputedStyle(e).backgroundColor);

  // Шаг 1. Открыть «Рабочие календари» → «Новый календарь»
  await page.goto(url);
  await expect(page.getByRole('banner').getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });
  await page.getByRole('banner').getByRole('button', { name: 'Структуры проекта' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Рабочие календари' }).click();
  await page.getByRole('button', { name: 'Новый календарь' }).click({ timeout: 30_000 });

  // Шаг 2. Название «TEST_SM68_Календарь», «Рабочих часов в день» 8
  await name.fill('TEST_SM68_Календарь');
  await hours.fill('8');

  // Шаг 3. В «Выходные дни» включить «Пт»
  await page.getByRole('button', { name: 'Пт', exact: true }).click();

  // Шаг 4. Нажать «Добавить день», ввести название праздника «TEST праздник»
  await page.getByRole('button', { name: 'Добавить день' }).click();
  await holiday.fill('TEST праздник');

  // Шаг 5. Нажать «Сохранить»
  await page.getByRole('button', { name: 'Сохранить' }).click();

  // Ожидание 1: уведомление «Сохранено»
  await expect(page.getByText('Сохранено', { exact: true })).toBeVisible();

  // Шаг 6. Перезагрузить страницу и открыть «TEST_SM68_Календарь»
  await page.reload();
  await page.getByRole('complementary').getByRole('button', { name: /^TEST_SM68_Календарь/ }).click({ timeout: 60_000 });
  await page.mouse.move(0, 0); // убираем курсор, чтобы наведение не меняло цвет кнопок

  // Ожидание 2: видны название, 8 часов, «Пт» выделен так же, как «Сб» (выходной), и праздник «TEST праздник»
  await expect(name).toHaveValue('TEST_SM68_Календарь');
  await expect(hours).toHaveValue('8');
  await expect.poll(() => dayColor('Пт'), { message: '«Пт» выделен так же, как «Сб»' }).toBe(await dayColor('Сб'));
  await expect.poll(() => dayColor('Пт'), { message: '«Пт» выделен иначе, чем рабочий «Чт»' }).not.toBe(await dayColor('Чт'));
  await expect(holiday).toHaveValue('TEST праздник');
});

import { test, expect } from '@playwright/test';

test('SM-28 Фильтр «Все» в «Мои задачи»', async ({ page }) => {
  // Задача — кнопка-строка в группе списка задач. Роли list/table у списка нет, группы — безымянные
  // <section>; именованная <section> на странице — полоса очередей, её строки задачами не считаем
  // eslint-disable-next-line playwright/no-raw-locators -- у списка задач (TaskList) нет роли и имени, строки отличает только безымянная группа-section
  const taskItems = page.getByRole('main').locator('section:not([aria-label])').getByRole('button');

  // Шаг 1. Открыть /me/work
  await page.goto('/me/work');
  // Список задач приходит с сервера после открытия страницы, фильтры работают уже в браузере: ждём окончания загрузки
  await page.waitForLoadState('networkidle');

  // Шаг 2. Нажать фильтр «Все»
  await page.getByRole('button', { name: 'Все', exact: true }).click({ timeout: 60_000 });

  // Ожидание 1: виден хотя бы один элемент задачи
  await expect(taskItems).not.toHaveCount(0);
  const allCount = await taskItems.count();

  // Шаг 3. Нажать фильтр «Открытые»
  await page.getByRole('button', { name: 'Открытые', exact: true }).click();

  // Ожидание 2: задач в списке меньше, чем после шага 2
  await expect.poll(() => taskItems.count(), { message: 'задач после «Открытые» меньше, чем после «Все»' }).toBeLessThan(allCount);
});

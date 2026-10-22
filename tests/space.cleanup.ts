import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Удаляем пространство прогона из run-space.json. Запускается только явно и только после зелёного прогона:
// npx playwright test --project=cleanup --no-deps
test('удаление пространства прогона', async ({ page }) => {
  const { name, url } = JSON.parse(readFileSync('run-space.json', 'utf8'));

  // Защита: удаляем только пространство с префиксом TEST_
  expect(name, 'название пространства прогона должно начинаться с TEST_').toMatch(/^TEST_/);

  // Открываем навигатор пространства прогона
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Администрирование' })).toBeVisible({ timeout: 60_000 });

  // «Администрирование» → «Удалить пространство»
  await page.getByRole('button', { name: 'Администрирование' }).click();
  await page.getByRole('menuitem', { name: 'Удалить пространство' }).click();

  // Окно подтверждения должно быть именно про это пространство (точное название)
  const dialog = page.getByRole('alertdialog', { name: 'Вы уверены?' });
  const confirm = dialog.getByRole('textbox', { name: `Введите название проекта для подтверждения: ${name}`, exact: true });
  await expect(confirm).toBeVisible();

  // Вводим точное название и удаляем
  await confirm.fill(name);
  await dialog.getByRole('button', { name: 'Удалить пространство' }).click();

  // Ждём, пока закроется окно подтверждения
  await expect(dialog).toBeHidden({ timeout: 30_000 });

  // Пространство удалено: его адрес отвечает «У вас нет доступа к этому пространству»
  // (поиск на главной обновляется с задержкой, поэтому по нему не проверяем)
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'У вас нет доступа к этому пространству' })).toBeVisible({ timeout: 60_000 });
});

import { test, expect } from '@playwright/test';

test('SM-138 Языки EN, ES, PT и возврат на RU', async ({ page }) => {
  const menu = page.getByRole('dialog');
  const pageTitle = page.getByRole('main').getByRole('heading', { level: 1 });
  // На кнопках видны «EN», «ES», «PT», «RU», а их доступные имена — полные названия языков
  const english = menu.getByRole('button', { name: 'English', exact: true });
  const spanish = menu.getByRole('button', { name: 'Español', exact: true });
  const portuguese = menu.getByRole('button', { name: 'Português (Brasil)', exact: true });
  const russian = menu.getByRole('button', { name: 'Русский', exact: true });

  await test.step('Шаг 1. Открыть /projects → кнопка профиля', async () => {
    await page.goto('/projects');
    await expect(pageTitle).toHaveText('Проекты', { timeout: 60_000 });
    await page.getByRole('banner').getByRole('button', { name: 'AT', exact: true }).click();

    // Ожидание 1: в «Язык интерфейса» видны кнопки «EN», «ES», «PT», «RU»
    await expect(english).toHaveText('EN');
    await expect(spanish).toHaveText('ES');
    await expect(portuguese).toHaveText('PT');
    await expect(russian).toHaveText('RU');
  });

  await test.step('Шаг 2. В «Язык интерфейса» выбрать «EN»', async () => {
    await english.click();

    // Ожидание 2: заголовок «Projects»
    await expect(pageTitle).toHaveText('Projects');
  });

  await test.step('Шаг 3. Выбрать «ES»', async () => {
    await spanish.click();

    // Ожидание 3: заголовок «Proyectos»
    await expect(pageTitle).toHaveText('Proyectos');
  });

  await test.step('Шаг 4. Выбрать «PT»', async () => {
    await portuguese.click();

    // Ожидание 4: заголовок «Projetos»
    await expect(pageTitle).toHaveText('Projetos');
  });

  // Последний шаг возвращает исходный язык
  await test.step('Шаг 5. Выбрать «RU»', async () => {
    await russian.click();

    // Ожидание 5: заголовок «Проекты»
    await expect(pageTitle).toHaveText('Проекты');
  });
});

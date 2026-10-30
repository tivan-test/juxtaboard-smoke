import { test as setup, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

// Сначала пробуем сохранённую сессию: лишние входы сайт ограничивает («Слишком много попыток»)
setup.use({ storageState: existsSync('auth/session.json') ? 'auth/session.json' : { cookies: [], origins: [] } });

setup('вход и сохранение сессии', async ({ page }) => {
  await page.goto('/projects');
  const projectsHeading = page.getByRole('heading', { name: 'Проекты', exact: true });
  const emailField = page.getByLabel('Email');

  // Либо остались на /projects (сессия жива), либо сайт перекинул на /auth/login
  await expect(projectsHeading.or(emailField)).toBeVisible({ timeout: 60_000 });

  if (await emailField.isVisible()) {
    // Сессия устарела: входим заново
    await page.getByLabel('Email').fill(process.env.JB_EMAIL!);
    await page.getByLabel('Пароль').fill(process.env.JB_PASSWORD!);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();

    // Вход бывает медленным (10-20 с), поэтому ждём до 60 с
    await expect(page).toHaveURL(/\/projects/, { timeout: 60_000 });
    await expect(projectsHeading).toBeVisible({ timeout: 30_000 });
  }

  await page.context().storageState({ path: 'auth/session.json' });
});

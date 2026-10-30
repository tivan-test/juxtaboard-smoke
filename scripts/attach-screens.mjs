// Вставляет скриншоты упавших тестов в документ журнала Juxtaboard через интерфейс.
// Коннектор не умеет загружать картинки с компьютера, поэтому делаем это как человек: кнопкой «Вставить изображение».
//
// Запуск: node scripts/attach-screens.mjs <documentUrl> <runFolder> [--headed]
// Пример: node scripts/attach-screens.mjs "https://juxtaboard.com/projects/ZmC0w0/navigator?explorerMode=docs&docId=1726" runs/2026-10-12_2116
//
// По умолчанию браузер невидимый (headless). Флаг --headed открывает видимое окно, только для отладки.

import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const JOURNAL_FOLDER = 'Журнал прогона автотестов';
const PLACEHOLDER = /^\[\[((?:SM|RG)-\d{2,3})\.png\]\]$/;
// Считаем только загруженные картинки: у них адрес /api/files/...
const UPLOADED_IMG = 'img[src*="/api/files/"]';

const args = process.argv.slice(2);
const headed = args.includes('--headed');
const [documentUrl, runFolder] = args.filter((a) => a !== '--headed');

function stop(message) {
  console.error(`ОСТАНОВКА: ${message}`);
  process.exit(1);
}

if (!documentUrl || !runFolder) {
  stop('нужно два аргумента: node scripts/attach-screens.mjs <documentUrl> <runFolder> [--headed]');
}

// Проверка 1: адрес похож на документ Juxtaboard и в нём есть номер документа
let url;
try {
  url = new URL(documentUrl);
} catch {
  stop(`это не адрес: ${documentUrl}`);
}
const docId = url.searchParams.get('docId');
if (url.hostname !== 'juxtaboard.com' || !/^\/projects\/[^/]+\/navigator$/.test(url.pathname) || !/^\d+$/.test(docId ?? '')) {
  stop(`адрес не похож на документ Juxtaboard: ${documentUrl}`);
}

if (!fs.existsSync(runFolder)) {
  stop(`нет папки прогона: ${runFolder}`);
}

const browser = await chromium.launch({ headless: !headed });
const context = await browser.newContext({ storageState: 'auth/session.json', locale: 'ru-RU' });
const page = await context.newPage();

try {
  await page.goto(documentUrl, { timeout: 60_000 });

  // Проверка 2: документ лежит внутри папки «Журнал прогона автотестов».
  // В дереве слева блок папки содержит ряды своих документов, ищем наш docId внутри него.
  // Ряды дерева не имеют ролей и подписей, поэтому используются атрибуты data-folder-id / data-document-id.
  const folderRow = page.locator('[data-folder-id]').filter({ hasText: new RegExp(`^${JOURNAL_FOLDER}$`) });
  await expect(folderRow, `в дереве нет папки «${JOURNAL_FOLDER}»`).toHaveCount(1, { timeout: 60_000 });
  const docInFolder = folderRow.locator('xpath=..').locator(`[data-document-id="${docId}"]`);
  if ((await docInFolder.count()) !== 1) {
    throw new Error(`документ ${docId} не лежит в папке «${JOURNAL_FOLDER}», ничего не меняю`);
  }

  const editor = page.locator('.ProseMirror[contenteditable="true"]');
  await expect(editor, 'редактор документа открылся').toBeVisible({ timeout: 60_000 });

  // Собираем заполнители [[SM-XX.png]] и [[RG-XX.png]] и проверяем, что для каждого есть файл
  const placeholders = (await editor.locator('p').allInnerTexts())
    .map((t) => t.trim())
    .filter((t) => PLACEHOLDER.test(t));
  if (placeholders.length === 0) {
    console.log('Заполнителей [[SM-XX.png]] в документе нет, вставлять нечего.');
  }

  const inserted = [];
  const skipped = [];

  for (const text of placeholders) {
    const testId = text.match(PLACEHOLDER)[1];
    const file = path.join(runFolder, `${testId}.png`);
    if (!fs.existsSync(file)) {
      skipped.push(`${testId}: нет файла ${file}, заполнитель оставлен`);
      continue;
    }

    // Ставим курсор в строку заполнителя и стираем её текст: строка остаётся пустой, курсор в ней
    const line = editor.getByText(text, { exact: true });
    await line.click();
    // Выделить строку целиком и стереть: на macOS Cmd+→ / Cmd+Shift+← / Backspace,
    // на Linux (контейнер) End / Shift+Home / Delete. Ctrl+→ на Linux двигает по словам, а не до конца строки,
    // а выделенную строку редактор сайта на Linux стирает только клавишей Delete (Backspace её не трогает)
    const mac = process.platform === 'darwin';
    await page.keyboard.press(mac ? 'Meta+ArrowRight' : 'End');
    await page.keyboard.press(mac ? 'Shift+Meta+ArrowLeft' : 'Shift+Home');
    await page.keyboard.press(mac ? 'Backspace' : 'Delete');
    await expect(line, `${testId}: текст заполнителя стёрт`).toHaveCount(0);

    const imagesBefore = await editor.locator(UPLOADED_IMG).count();

    // У кнопки «Вставить изображение» нет доступного имени (aria-label), подпись есть только во всплывающей подсказке.
    // Поэтому ищем её по классу иконки Lucide. Попросить разработчиков добавить кнопке aria-label.
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-image') }).click();

    const dialog = page.getByRole('dialog', { name: 'Вставить изображение' });
    await expect(dialog, `${testId}: открылось окно «Вставить изображение»`).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'Загрузить' }), `${testId}: открыта вкладка «Загрузить»`).toHaveAttribute('aria-selected', 'true');

    // Скрытое поле выбора файла видно в дереве доступности как кнопка «Choose File»
    await dialog.getByRole('button', { name: 'Choose File' }).setInputFiles(file);

    const insertButton = dialog.getByRole('button', { name: 'Вставить', exact: true });
    await expect(insertButton, `${testId}: кнопка «Вставить» стала активной`).toBeEnabled({ timeout: 60_000 });
    await insertButton.click();
    await expect(dialog, `${testId}: окно закрылось после вставки`).toBeHidden({ timeout: 60_000 });
    await expect(editor.locator(UPLOADED_IMG), `${testId}: загруженных картинок в редакторе стало на одну больше`).toHaveCount(imagesBefore + 1, { timeout: 60_000 });

    inserted.push(`${testId}: вставлен ${file}`);
  }

  // Проверяем, что изменения сохранились на сервере: открываем документ заново в отдельной вкладке
  if (inserted.length > 0) {
    const imagesTotal = await editor.locator(UPLOADED_IMG).count();
    const check = await context.newPage();
    await expect(async () => {
      await check.goto(documentUrl, { timeout: 60_000 });
      const checkEditor = check.locator('.ProseMirror[contenteditable="true"]');
      await expect(checkEditor, 'проверка сохранения: документ открылся заново').toBeVisible({ timeout: 60_000 });
      for (const line of inserted) {
        const testId = line.split(':')[0];
        await expect(checkEditor.getByText(`[[${testId}.png]]`, { exact: true }), `проверка сохранения: заполнителя ${testId} нет`).toHaveCount(0);
      }
      await expect(checkEditor.locator(UPLOADED_IMG), 'проверка сохранения: все загруженные картинки на месте').toHaveCount(imagesTotal);
    }).toPass({ timeout: 90_000 });
    await check.close();
  }

  console.log('Вставлено:');
  console.log(inserted.length ? inserted.map((s) => `  ${s}`).join('\n') : '  ничего');
  if (skipped.length) {
    console.log('Пропущено:');
    console.log(skipped.map((s) => `  ${s}`).join('\n'));
  }
} catch (error) {
  // Печатаем, какая проверка упала, и что ожидали / что нашли (без цветовых кодов и длинного лога)
  const lines = error.message.replace(/\u001b\[[0-9;]*m/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
  console.error(`ОШИБКА: ${lines[0]}`);
  for (const l of lines.filter((l) => /^(Expected|Received|Timeout)/.test(l))) console.error(`  ${l}`);
  console.error('Заполнители, которые не успели обработать, остались в документе.');
  process.exitCode = 1;
} finally {
  await browser.close();
}

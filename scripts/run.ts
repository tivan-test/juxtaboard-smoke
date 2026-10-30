// Полный прогон без агента: смоук → регресс в том же пространстве → удаление пространства → отчёт.
// Запуск: bun scripts/run.ts [--only smoke|regress] [-g "<шаблон>"] [--publish [--dry-run]]
//   --publish            — после отчёта записать статусы в таблицы Juxtaboard и создать документ журнала (нужен JUXT_TOKEN)
//   --publish --dry-run  — только показать, что было бы записано
//   bun run test:all                      — смоук и регресс
//   bun run test:all -- -g "SM-03 "       — один тест
//   docker compose run --rm tests -- -g "SM-0[1-5] |RG-01"
// Код выхода: 0 — всё прошло, 1 — есть падения (или пространство не удалось удалить), 130 — прерван.
import { spawn, type ChildProcess } from 'node:child_process';
import { appendFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { publish } from './publish';
import { screenshots, writeReport, type Part } from './report';

// ---------- параметры ----------
const args = process.argv.slice(2).filter((a) => a !== '--');
let only: 'smoke' | 'regress' | undefined;
let grep: string | undefined;
let publishOn = false;
let dryRun = false;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--publish') publishOn = true;
  else if (a === '--dry-run') dryRun = true;
  else if (a === '--only') only = args[++i] as typeof only;
  else if (a.startsWith('--only=')) only = a.slice(7) as typeof only;
  else if (a === '-g' || a === '--grep') grep = args[++i];
  else if (a.startsWith('--grep=')) grep = a.slice(7);
  else {
    console.error(`Неизвестный параметр: ${a}\nЗапуск: bun scripts/run.ts [--only smoke|regress] [-g "<шаблон>"] [--publish [--dry-run]]`);
    process.exit(2);
  }
}
if (dryRun && !publishOn) {
  console.error('--dry-run работает только вместе с --publish');
  process.exit(2);
}
if (only && only !== 'smoke' && only !== 'regress') {
  console.error('--only принимает smoke или regress');
  process.exit(2);
}

// ---------- папка отчёта и лог ----------
const pad = (n: number) => String(n).padStart(2, '0');
const startedAt = new Date();
const stamp = `${startedAt.getFullYear()}-${pad(startedAt.getMonth() + 1)}-${pad(startedAt.getDate())}_${pad(startedAt.getHours())}${pad(startedAt.getMinutes())}`;
const runDir = path.join('runs', stamp);
mkdirSync(runDir, { recursive: true });
mkdirSync('auth', { recursive: true });
const logFile = path.join(runDir, 'run.log');
const log = createWriteStream(logFile);
const say = (s: string) => {
  process.stdout.write(s + '\n');
  log.write(s + '\n');
};

// Старые результаты и старое пространство прогона не должны попасть в этот отчёт
rmSync('test-results', { recursive: true, force: true });
rmSync('run-space.json', { force: true });

// ---------- запуск Playwright ----------
let current: ChildProcess | undefined;
let interrupted = false;
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    if (interrupted) return;
    interrupted = true;
    say(`\nПолучен ${sig}: останавливаю тесты, затем удаляю пространство прогона и пишу отчёт.`);
    current?.kill('SIGTERM');
  });
}

function playwright(label: string, pwArgs: string[], jsonFile?: string): Promise<number> {
  const full = ['playwright', 'test', ...pwArgs];
  say(`\n=== ${label}: bunx ${full.join(' ')}`);
  return new Promise((resolve) => {
    const env: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: '0' };
    if (jsonFile) env.PLAYWRIGHT_JSON_OUTPUT_FILE = jsonFile;
    current = spawn('bunx', full, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    current.stdout?.on('data', (b: Buffer) => { process.stdout.write(b); log.write(b); });
    current.stderr?.on('data', (b: Buffer) => { process.stderr.write(b); log.write(b); });
    current.on('close', (code) => { current = undefined; resolve(code ?? 1); });
    current.on('error', (e) => { say(`Не удалось запустить Playwright: ${e.message}`); current = undefined; resolve(1); });
  });
}

// У каждой части свой JSON и своя папка вывода: вторая часть не стирает скрины и результаты первой
const grepArgs = grep ? ['-g', grep] : [];
const common = ['--reporter=list,json', '--pass-with-no-tests', ...grepArgs];
const smokeJson = 'test-results/smoke.json';
const regressJson = 'test-results/regress.json';
const smoke: Part = { label: 'Смоук', jsonFile: smokeJson, ran: false };
const regress: Part = { label: 'Регресс', jsonFile: regressJson, ran: false };
const codes: number[] = [];

const spaceName = (): string | undefined => {
  if (!existsSync('run-space.json')) return undefined;
  return (JSON.parse(readFileSync('run-space.json', 'utf8')) as { name?: string }).name;
};

let spaceLine = 'не создано';
let cleanupFailed = false;

try {
  if (only !== 'regress') {
    // Смоук с зависимостями: вход и создание пространства прогона
    smoke.ran = true;
    codes.push(await playwright('Смоук', ['--project=smoke', '--output=test-results/smoke', ...common], smokeJson));
  }
  if (only !== 'smoke' && !interrupted) {
    if (only === 'regress') {
      // Только регресс: вход и пространство создаются его зависимостями
      regress.ran = true;
      codes.push(await playwright('Регресс', ['--project=regress', '--output=test-results/regress', ...common], regressJson));
    } else if (spaceName()) {
      // Регресс в том же пространстве, что и смоук
      regress.ran = true;
      codes.push(await playwright('Регресс', ['--project=regress', '--no-deps', '--output=test-results/regress', ...common], regressJson));
    } else {
      regress.note = 'пространство прогона не создано (упал вход или создание пространства)';
      codes.push(1);
    }
  }
  if (interrupted) {
    if (!smoke.ran) smoke.note = 'прогон прерван';
    if (!regress.ran && !regress.note) regress.note = 'прогон прерван';
  }
} finally {
  // Пространство прогона удаляется всегда: и после падений, и после прерывания
  const name = spaceName();
  if (name) {
    const code = await playwright('Удаление пространства прогона', ['--project=cleanup', '--no-deps', '--reporter=list', '--output=test-results/cleanup']);
    cleanupFailed = code !== 0;
    spaceLine = cleanupFailed ? `${name} не удалено — удалите вручную` : `${name} удалено`;
  }
}

if (!smoke.ran && only !== 'regress') smoke.note ??= 'не запускался';
const parts = [only !== 'regress' ? smoke : undefined, only !== 'smoke' ? regress : undefined].filter((p): p is Part => !!p);
const reportFile = writeReport({ runDir, startedAt, space: spaceLine, parts });

// Публикация в Juxtaboard (только с --publish). Её ошибка не меняет результат тестов и код выхода
if (publishOn && !interrupted) {
  let lines: string[];
  try {
    const { summary, warnings } = await publish({
      runDir,
      startedAt,
      smoke: only !== 'regress' ? smoke : undefined,
      regress: only !== 'smoke' ? regress : undefined,
      dryRun,
      say,
    });
    lines = [...warnings.map((w) => `Публикация, предупреждение: ${w}`), `Публикация: ${summary}`];
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const token = process.env.JUXT_TOKEN;
    lines = [`Публикация: ошибка — ${token ? message.split(token).join('***') : message}`];
  }
  appendFileSync(reportFile, '\n' + lines.join('\n') + '\n');
  for (const l of lines) say(l);
}

const failed = codes.some((c) => c !== 0) || cleanupFailed;
say(`\nОтчёт: ${reportFile}`);
const pngs = screenshots(runDir);
if (pngs.length) say(`Скрины: ${pngs.join(', ')}`);
say(`Пространство прогона: ${spaceLine}`);
say(interrupted ? 'Итог: прогон прерван' : failed ? 'Итог: есть падения' : 'Итог: всё прошло');

// Пароль и ключ Juxtaboard не должны попасть ни в отчёт, ни в лог
await new Promise<void>((resolve) => log.end(resolve));
const secrets = [process.env.JB_PASSWORD, process.env.JUXT_TOKEN].filter((s): s is string => !!s && s.length >= 4);
if (secrets.length) {
  const leaked = [reportFile, logFile].filter((f) => {
    const text = readFileSync(f, 'utf8');
    return secrets.some((s) => text.includes(s));
  });
  if (leaked.length) {
    console.error(`ВНИМАНИЕ: пароль или ключ найден в ${leaked.join(', ')}. Не пересылайте эти файлы.`);
    process.exit(1);
  }
  console.log('Проверка: пароля и ключа в отчёте и логе нет.');
}

process.exit(interrupted ? 130 : failed ? 1 : 0);

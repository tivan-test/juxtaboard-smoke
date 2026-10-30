// Отчёт прогона runs/<ГГГГ-ММ-ДД_ЧЧММ>/report.md в том же виде, что пишет /smoke-run.
// Источник — только JSON-результаты Playwright и файлы тестов: без таблиц Juxtaboard и без агента.
//   Шаги воспроизведения — из названий test.step («Шаг N. …», «Шаги N–M. …»);
//   Предусловие — из step «Предусловие (…)» и чтения run-space.json (пространство прогона);
//   Ожидание — из комментариев «// Ожидание N: …» / «// Ожидание: …»;
//   Фактически — сообщение ошибки Playwright без стека; Скрин — PNG упавшей попытки.
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type Step = { title: string; error?: unknown; steps?: Step[] };
type Attachment = { name: string; path?: string; contentType: string };
type ErrorInfo = { message?: string };
type Result = { status: string; error?: ErrorInfo; errors?: ErrorInfo[]; steps?: Step[]; attachments?: Attachment[] };
type PwTest = { projectName: string; status: string; results: Result[] };
type Spec = { title: string; file: string; tests: PwTest[] };
type Suite = { specs?: Spec[]; suites?: Suite[] };

export type Part = {
  label: string; // «Смоук» / «Регресс»
  jsonFile: string; // JSON-результаты этой части
  ran: boolean; // часть запускалась
  note?: string; // почему не запускалась
};

export type ReportInput = {
  runDir: string;
  startedAt: Date;
  space: string; // строка после «Пространство прогона:»
  parts: Part[];
};

type TestRow = { id: string; title: string; file: string; status: string; results: Result[] };

const pad = (n: number) => String(n).padStart(2, '0');
const stripAnsi = (s: string) => s.replace(/\u001b\[[0-9;]*m/g, '');

// Номер теста из названия: «SM-65 Поиск ресурса…» → SM-65, сортировка по числу
const idOf = (title: string) => title.match(/^((?:SM|RG)-\d+)/)?.[1] ?? title;
const byId = (a: string, b: string) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, ''));

function collect(suites: Suite[] = [], out: TestRow[] = []): TestRow[] {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests) {
        // Вход и создание пространства тоже попадают в JSON — в отчёт идут только SM/RG
        if (!/^(SM|RG)-\d+/.test(spec.title)) continue;
        out.push({ id: idOf(spec.title), title: spec.title, file: spec.file, status: t.status, results: t.results });
      }
    }
    collect(suite.suites, out);
  }
  return out;
}

// Файл теста ищем по имени в tests/smoke и tests/regress
function readTestSource(file: string): string {
  const base = path.basename(file);
  for (const dir of ['tests/smoke', 'tests/regress']) {
    const p = path.join(dir, base);
    if (existsSync(p)) return readFileSync(p, 'utf8');
  }
  return '';
}

function stepTitles(source: string): string[] {
  return [...source.matchAll(/test\.step\('((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"));
}

function preconditionOf(source: string): string {
  const ids: string[] = [];
  const texts: string[] = [];
  if (source.includes("readFileSync('run-space.json'")) {
    ids.push('SM-02');
    texts.push('Пространство прогона');
  }
  for (const t of stepTitles(source)) {
    const m = t.match(/^Предусловие \(([^)]*)\):\s*(.*)$/);
    if (!m) continue;
    for (const id of m[1].split(/,\s*/)) if (!ids.includes(id)) ids.push(id);
    texts.push(m[2]);
  }
  if (!ids.length && !texts.length) return 'нет';
  return `(${ids.join(', ')}) ${texts.join('; ')}`;
}

// «Шаг 2. Текст» → 2. Текст; «Шаги 2–3. А; Б» → 2. А / 3. Б
function stepLines(source: string): string[] {
  const lines: string[] = [];
  for (const t of stepTitles(source)) {
    const one = t.match(/^Шаг (\d+)\.\s*(.*)$/);
    if (one) {
      lines.push(`${one[1]}. ${one[2]}`);
      continue;
    }
    const many = t.match(/^Шаги (\d+)[–-](\d+)\.\s*(.*)$/);
    if (many) {
      const [from, to] = [Number(many[1]), Number(many[2])];
      const parts = many[3].split(/;\s*/);
      if (parts.length === to - from + 1) parts.forEach((p, i) => lines.push(`${from + i}. ${p}`));
      else lines.push(`${from}–${to}. ${many[3]}`);
    }
  }
  return lines;
}

function expectations(source: string): string[] {
  // В комментариях ожидания написаны со строчной буквы, в отчёте — как в таблице, с заглавной
  return [...source.matchAll(/\/\/ Ожидание(?: \d+)?:\s*(.+)$/gm)].map((m) => {
    const text = m[1].trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
  });
}

// Упавший test.step последней попытки: «Шаг N. …», «Шаги N–M. …» или «Предусловие (…)»
function failedStep(result: Result): string | undefined {
  return (result.steps ?? []).find((s) => s.error)?.title;
}

function shortError(result: Result): string {
  const errors = result.errors?.length ? result.errors : result.error ? [result.error] : [];
  const parts: string[] = [];
  for (const e of errors) {
    const lines = stripAnsi(e.message ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    parts.push(lines[0].replace(/^Error:\s*/, ''));
    for (const l of lines.slice(1)) {
      if (/^(Locator|Expected|Received|Error|- waiting for)/.test(l) && !/^Call log/.test(l)) parts.push(l.replace(/^- /, ''));
      if (parts.length >= 6) break;
    }
  }
  const text = [...new Set(parts)].join('; ');
  return text.length > 400 ? `${text.slice(0, 400)}…` : text || 'сообщение об ошибке пустое';
}

function bugBlock(t: TestRow, runDir: string): string[] {
  const source = readTestSource(t.file);
  const last = t.results[t.results.length - 1];
  const out: string[] = [`### ${t.title}`];
  out.push(`**Предусловие:** ${preconditionOf(source)}`);
  out.push('**Шаги воспроизведения:**', ...stepLines(source));

  const step = failedStep(last);
  const pre = step?.match(/^Предусловие \(([^)]*)\)/);
  const num = step?.match(/^Шаги? (\d+(?:[–-]\d+)?)\.\s*(.*)$/);
  if (num) out.push(`**Упал на шаге:** ${num[1]} — ${num[2]}`);
  else if (pre) out.push('**Упал на шаге:** предусловие');
  else out.push('**Упал на шаге:** не определён');

  const exp = expectations(source);
  if (exp.length === 1) out.push(`**Ожидание:** ${exp[0]}`);
  else out.push('**Ожидание:**', ...exp.map((e, i) => `${i + 1}. ${e}`));

  out.push(pre ? `**Фактически:** упал на предусловии (${pre[1]})` : `**Фактически:** ${shortError(last)}`);
  out.push(`**Прохождение ещё раз:** ${t.results.length > 1 ? 'упал снова' : 'не было'}`);

  // Скрин упавшей попытки рядом с report.md как <ID>.png
  const shot = [...(last.attachments ?? [])].reverse().find((a) => a.name === 'screenshot' && a.path && existsSync(a.path));
  if (shot?.path) {
    copyFileSync(shot.path, path.join(runDir, `${t.id}.png`));
    out.push(`Скрин: ${t.id}.png`);
  }
  return out;
}

function partSection(part: Part, runDir: string): string[] {
  const out = [`## ${part.label}`];
  if (!part.ran) {
    out.push(`Не запускался: ${part.note ?? 'причина неизвестна'}`);
    return out;
  }
  if (!existsSync(part.jsonFile)) {
    out.push(`Нет результатов Playwright (${part.jsonFile}): прогон прервался до конца`);
    return out;
  }
  const json = JSON.parse(readFileSync(part.jsonFile, 'utf8')) as { suites?: Suite[] };
  const tests = collect(json.suites).sort((a, b) => byId(a.id, b.id));
  if (!tests.length) return []; // в этой части по шаблону -g ничего не нашлось: раздела нет

  const passed = tests.filter((t) => t.status === 'expected' || t.status === 'flaky');
  const failed = tests.filter((t) => t.status === 'unexpected');
  const notRun = tests.filter((t) => t.status === 'skipped');
  const flaky = tests.filter((t) => t.status === 'flaky');

  out.push(`Выполнены тесты: ${passed.length} из ${tests.length}`);
  out.push(`Пройденные тесты: ${passed.map((t) => t.id).join(', ')}`);
  if (failed.length || notRun.length) {
    out.push(`Невыполненные тесты: ${[...failed, ...notRun].map((t) => t.id).join(', ')}`);
    out.push('Баги:', '');
    for (const t of failed) out.push(...bugBlock(t, runDir), '');
    if (notRun.length) out.push(`Не запускались (прогон прерван): ${notRun.map((t) => t.id).join(', ')}`, '');
  }
  if (flaky.length) out.push(`Прошли со второй попытки: ${flaky.map((t) => t.id).join(', ')}`);
  return out;
}

export function writeReport(input: ReportInput): string {
  const d = input.startedAt;
  const lines = [
    `Дата: ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    `Пространство прогона: ${input.space}`,
  ];
  for (const part of input.parts) {
    const section = partSection(part, input.runDir);
    if (section.length) lines.push('', ...section);
  }
  const file = path.join(input.runDir, 'report.md');
  writeFileSync(file, lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n');
  return file;
}

// Список PNG в папке отчёта — для итоговой строки в консоли
export function screenshots(runDir: string): string[] {
  return readdirSync(runDir).filter((f) => f.endsWith('.png'));
}

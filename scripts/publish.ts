// Публикация результатов прогона в Juxtaboard (флаг --publish у scripts/run.ts).
// 1. Статусы: для каждого теста этого прогона — строка с тем же ID в «Таблица AutoSmoke v1» / «Таблица AutoReg v1»;
//    меняются ТОЛЬКО «Фактический прогон» и «Последняя проверка». Нет строки — ничего не создаём, пишем предупреждение.
// 2. Журнал: новый документ «ДД.ММ.ГГГГ ЧЧ:ММ» в папке «Журнал прогона автотестов» с текстом report.md;
//    скрины вставляет scripts/attach-screens.mjs через интерфейс сайта (API картинки с диска не загружает).
// --dry-run: только показать, что было бы записано.
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { COL, JOURNAL_FOLDER_ID, Juxt, PROJECT, TABLES } from './juxt';
import { partResults, type Part } from './report';

type Say = (s: string) => void;

export type PublishInput = {
  runDir: string;
  startedAt: Date;
  smoke?: Part;
  regress?: Part;
  dryRun: boolean;
  say: Say;
};

export type PublishResult = { summary: string; warnings: string[] };

const pad = (n: number) => String(n).padStart(2, '0');

// Время прогона в формате колонки datetime: 2026-10-30T04:27:00+03:00
function isoWithOffset(d: Date): string {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const tz = `${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${tz}`;
}

const docName = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

// report.md → текст документа журнала в том же виде, что у прежних документов:
// подписи жирным, каждая строка отдельным абзацем, нумерованные списки подряд, «Скрин: X.png» → [[X.png]]
export function journalBody(report: string, warnings: string[]): string {
  const out: string[] = [];
  let inList = false;
  for (const raw of report.split('\n')) {
    const line = raw.trimEnd();
    if (!line) continue;
    const isList = /^\d+(?:–\d+)?\. /.test(line);
    if (!isList && inList) out.push('');
    inList = isList;
    if (isList) {
      out.push(line);
      continue;
    }
    const shot = line.match(/^Скрин: ((?:SM|RG)-\d+\.png)$/);
    if (shot) out.push(`[[${shot[1]}]]`);
    else if (/^#{2,3} /.test(line) || /^\*\*/.test(line)) out.push(line);
    else if (line === 'Баги:') out.push('**Баги:**');
    else {
      const m = line.match(/^([^:]{2,40}):\s*(.*)$/);
      out.push(m ? `**${m[1]}:** ${m[2]}` : line);
    }
    out.push('');
  }
  for (const w of warnings) out.push(`**Предупреждение публикации:** ${w}`, '');
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// Вставка скринов через интерфейс: скрипт часто вставляет не всё за раз, поэтому до 3 попыток
async function attachScreens(docId: number, runDir: string, say: Say): Promise<string> {
  const url = `https://juxtaboard.com/projects/${PROJECT}/navigator?explorerMode=docs&docId=${docId}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const output = await new Promise<string>((resolve) => {
      let text = '';
      const child = spawn('node', ['scripts/attach-screens.mjs', url, runDir], { stdio: ['ignore', 'pipe', 'pipe'] });
      child.stdout.on('data', (b: Buffer) => (text += b.toString()));
      child.stderr.on('data', (b: Buffer) => (text += b.toString()));
      child.on('close', () => resolve(text));
      child.on('error', (e) => resolve(`не удалось запустить attach-screens.mjs: ${e.message}`));
    });
    say(`attach-screens, попытка ${attempt}:\n${output.trim()}`);
    if (output.includes('в документе нет, вставлять нечего')) return 'скрины вставлены';
  }
  return 'скрины вставлены не все — в документе остались заполнители [[XX-NN.png]]';
}

export async function publish(input: PublishInput): Promise<PublishResult> {
  const { runDir, startedAt, dryRun, say } = input;
  const warnings: string[] = [];
  const checkedAt = isoWithOffset(startedAt);
  const suites = [
    { part: input.smoke, table: TABLES.smoke, tableName: '«Таблица AutoSmoke v1»' },
    { part: input.regress, table: TABLES.regress, tableName: '«Таблица AutoReg v1»' },
  ];

  const juxt = new Juxt();
  await juxt.connect();

  // 1. План записи статусов
  const plan: { table: number; tableName: string; rows: { rowId: string; id: string; status: string }[] }[] = [];
  for (const s of suites) {
    if (!s.part) continue;
    const results = partResults(s.part);
    if (!results.length) continue;
    const byId = new Map<string, string>();
    for (let offset = 0; ; offset += 200) {
      const page = await juxt.call<{ rows: { id: string; data: Record<string, unknown> }[]; hasMore: boolean }>('datatable_get_rows', {
        documentId: s.table,
        limit: 200,
        offset,
        columns: JSON.stringify([COL.id]),
      });
      for (const r of page.rows) byId.set(String(r.data[COL.id] ?? ''), r.id);
      if (!page.hasMore) break;
    }
    const rows: { rowId: string; id: string; status: string }[] = [];
    for (const r of results) {
      const rowId = byId.get(r.id);
      if (!rowId) warnings.push(`нет строки ${r.id} в ${s.tableName} — статус не записан`);
      else rows.push({ rowId, id: r.id, status: r.passed ? 'Работает' : 'Упал' });
    }
    if (rows.length) plan.push({ table: s.table, tableName: s.tableName, rows });
  }

  const report = readFileSync(path.join(runDir, 'report.md'), 'utf8');
  const body = journalBody(report, warnings);
  const name = docName(startedAt);
  const pngs = readdirSync(runDir).filter((f) => f.endsWith('.png'));
  const rowsTotal = plan.reduce((n, p) => n + p.rows.length, 0);

  say('\n=== Публикация в Juxtaboard' + (dryRun ? ' (пробный режим: ничего не отправляется)' : ''));
  for (const p of plan) {
    say(`${p.tableName} (docId ${p.table}): «Фактический прогон» и «Последняя проверка» = ${checkedAt}`);
    for (const r of p.rows) say(`  ${r.id} → ${r.status}`);
  }
  for (const w of warnings) say(`Предупреждение: ${w}`);
  say(`Документ «${name}» в папке «Журнал прогона автотестов» (${JOURNAL_FOLDER_ID}), скрины: ${pngs.length ? pngs.join(', ') : 'нет'}`);
  say('--- текст документа:\n' + body + '--- конец текста');

  if (dryRun) return { summary: `пробный режим, ничего не отправлено (строк к обновлению: ${rowsTotal}, документ «${name}»)`, warnings };

  // 2. Статусы
  for (const p of plan) {
    for (let i = 0; i < p.rows.length; i += 100) {
      const chunk = p.rows.slice(i, i + 100);
      await juxt.call('datatable_update_row', {
        documentId: p.table,
        rows: chunk.map((r) => ({ rowId: r.rowId, data: { [COL.status]: r.status, [COL.checkedAt]: checkedAt } })),
      });
    }
  }
  say(`Статусы записаны: ${rowsTotal} строк`);

  // 3. Документ журнала
  const doc = await juxt.call<{ documentId: number }>('doc_upsert', {
    project: PROJECT,
    type: 'document',
    name,
    parentId: JOURNAL_FOLDER_ID,
    body,
    format: 'markdown',
  });
  say(`Документ журнала создан: «${name}», docId ${doc.documentId}`);

  let screens = '';
  if (pngs.length) screens = `, ${await attachScreens(doc.documentId, runDir, say)}`;
  return { summary: `строк обновлено ${rowsTotal}, документ «${name}» создан (docId ${doc.documentId})${screens}`, warnings };
}

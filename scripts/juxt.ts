// Клиент Juxtaboard MCP по HTTP для публикации результатов без агента.
// Ключ — из JUXT_TOKEN. Ключ нигде не печатается: все тексты ошибок проходят через hide().
//
// БЕЛЫЙ СПИСОК. Вызвать можно только эти инструменты и только с такими аргументами:
//   datatable_get_rows   — чтение строк «Таблица AutoSmoke v1» (1713) / «Таблица AutoReg v1» (3013);
//   datatable_update_row — обновление строк этих таблиц, только колонки «Фактический прогон» и «Последняя проверка»;
//   doc_upsert           — создание документа в папке «Журнал прогона автотестов» (1715)
//                          и запись текста только в документ, созданный в этом же запуске.
// Загрузки картинок через API нет: asset_register_from_url скачивает только по публичной https-ссылке,
// поэтому скрины вставляет scripts/attach-screens.mjs через интерфейс сайта.
// Любой другой инструмент или аргумент — ошибка в коде, запрос не отправляется.
// Удаление, архивирование, ACL, приглашения, создание проектов — запрещены (их нет в списке).

const URL_MCP = 'https://juxtaboard.com/api/mcp';

export const TABLES = { smoke: 1713, regress: 3013 } as const;
export const JOURNAL_FOLDER_ID = 1715;
export const PROJECT = 'ZmC0w0'; // пространство Autotest
// Колонки одинаковые в обеих таблицах
export const COL = {
  id: 'nhsm4lykzkpmv58v1lx', // ID
  status: '8zluqzspnxwmv58o3b9', // Фактический прогон: «Работает» / «Упал»
  checkedAt: 'q9wlzud7kwamv58mcgd', // Последняя проверка
} as const;

const TABLE_IDS: number[] = Object.values(TABLES);
const WRITABLE_COLUMNS: string[] = [COL.status, COL.checkedAt];

type Args = Record<string, unknown>;
type RpcResponse = { result?: Record<string, unknown>; error?: { code: number; message: string } };

export class JuxtError extends Error {}

export class Juxt {
  private readonly token: string;
  private sessionId?: string;
  private nextId = 1;
  private readonly createdDocs = new Set<number>();

  constructor(token = process.env.JUXT_TOKEN ?? '') {
    if (!token) throw new JuxtError('JUXT_TOKEN не задан в .env');
    this.token = token;
  }

  hide(s: string): string {
    return s.split(this.token).join('***');
  }

  // Проверка белого списка: бросает ошибку ДО отправки запроса
  private guard(tool: string, args: Args): void {
    const deny = (why: string): never => {
      throw new JuxtError(`запрещённый вызов ${tool}: ${why}`);
    };
    switch (tool) {
      case 'datatable_get_rows':
        if (!TABLE_IDS.includes(args.documentId as number)) deny('читать можно только таблицы 1713 и 3013');
        return;
      case 'datatable_update_row': {
        if (!TABLE_IDS.includes(args.documentId as number)) deny('писать можно только в таблицы 1713 и 3013');
        if ('data' in args || 'rowId' in args) deny('только пакетный режим rows');
        const rows = args.rows as { rowId?: unknown; data?: Args }[] | undefined;
        if (!Array.isArray(rows) || rows.length === 0 || rows.length > 100) deny('rows: от 1 до 100 строк');
        for (const r of rows as { rowId?: unknown; data?: Args }[]) {
          if (typeof r.rowId !== 'string') deny('у строки нет rowId');
          const keys = Object.keys(r.data ?? {});
          if (!keys.length || keys.some((k) => !WRITABLE_COLUMNS.includes(k))) {
            deny('менять можно только «Фактический прогон» и «Последнюю проверку»');
          }
        }
        return;
      }
      case 'doc_upsert': {
        const allowed = ['documentId', 'name', 'type', 'parentId', 'body', 'format', 'project'];
        const extra = Object.keys(args).filter((k) => !allowed.includes(k));
        if (extra.length) deny(`лишние аргументы: ${extra.join(', ')}`);
        if (args.documentId === undefined) {
          if (args.type !== 'document' || args.parentId !== JOURNAL_FOLDER_ID) deny('создавать можно только документ в папке журнала 1715');
        } else if (!this.createdDocs.has(args.documentId as number)) {
          deny('писать текст можно только в документ, созданный в этом запуске');
        }
        return;
      }
      default:
        deny('инструмента нет в белом списке');
    }
  }

  private async rpc(method: string, params: Args = {}, notification = false): Promise<RpcResponse | undefined> {
    const body = notification ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: this.nextId++, method, params };
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${this.token}`,
    };
    if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;
    const res = await fetch(URL_MCP, { method: 'POST', headers, body: JSON.stringify(body) });
    this.sessionId = res.headers.get('mcp-session-id') ?? this.sessionId;
    const text = await res.text();
    if (!res.ok) throw new JuxtError(this.hide(`${method}: HTTP ${res.status} ${res.statusText}: ${text.slice(0, 500)}`));
    const parsed = parseBody(res.headers.get('content-type') ?? '', text);
    if (parsed?.error) throw new JuxtError(this.hide(`${method}: JSON-RPC ${parsed.error.code} ${parsed.error.message}`));
    return parsed;
  }

  async connect(): Promise<void> {
    await this.rpc('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'juxtaboard-smoke-publish', version: '1.0' },
    });
    await this.rpc('notifications/initialized', {}, true);
  }

  // Вызов инструмента: сначала белый список, потом запрос. Возвращает JSON из текстового ответа
  async call<T = Record<string, unknown>>(tool: string, args: Args): Promise<T> {
    this.guard(tool, args);
    const res = await this.rpc('tools/call', { name: tool, arguments: args });
    const content = (res?.result?.content as { type: string; text?: string }[] | undefined) ?? [];
    const text = content.map((c) => c.text ?? '').join('\n');
    if (res?.result?.isError) throw new JuxtError(this.hide(`${tool}: ${text.slice(0, 500)}`));
    const parsed = (text ? JSON.parse(text) : {}) as T;
    if (tool === 'doc_upsert' && args.documentId === undefined) {
      const id = (parsed as { documentId?: number }).documentId;
      if (typeof id === 'number') this.createdDocs.add(id);
    }
    return parsed;
  }
}

// Ответ бывает обычным JSON или потоком SSE (строки «data: {...}»)
function parseBody(contentType: string, text: string): RpcResponse | undefined {
  if (!text.trim()) return undefined;
  if (contentType.includes('text/event-stream')) {
    const data = text.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).filter(Boolean);
    return data.length ? (JSON.parse(data[data.length - 1]) as RpcResponse) : undefined;
  }
  return JSON.parse(text) as RpcResponse;
}

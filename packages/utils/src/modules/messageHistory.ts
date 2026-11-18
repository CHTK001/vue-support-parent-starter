/**
 * 消息历史存储（IndexedDB + AES 加密）
 *
 * <p>会话页与生图页都需要「输入框按 ↑ 翻回上次发过的话」。此前这份历史用
 * localStorage 明文保存，任何人打开开发者工具都能直接读到整段对话内容。</p>
 *
 * <p>这里把同一份能力下沉到 utils，记录写进 IndexedDB（容量远大于 localStorage，
 * 不会因为一条长文本把其它键挤掉），文本先用 {@link encrypt}（AES/ECB/Pkcs7，
 * 密钥见 {@link secretKey}）加密再落盘，读取时再解密。</p>
 *
 * <p>隔离口径：按「用户 + scope」分组，同一浏览器多账号互不串内容；
 * scope 缺省 {@link DEFAULT_SCOPE}，生图页传 generate。每个分组只保留最新 N 条，
 * N 由 {@link getMessageHistoryLimit} 给出（默认 {@link DEFAULT_MESSAGE_HISTORY_LIMIT}，
 * 可在「设置 → 会话配置 → 输入历史记录数量」调整，
 * 取值范围 1-{@link MAX_MESSAGE_HISTORY_LIMIT}）。</p>
 *
 * <p>边界说明：这是浏览器端的便利功能，不是保密存储——密钥随前端包一起下发，
 * 能挡住的是「随手翻 localStorage / 被同步盘打包上传」这类明文泄漏，挡不住
 * 已经拿到本机控制权的人。IndexedDB 不可用（隐私模式、配额满、非浏览器环境）时
 * 自动降级到内存：本次页面生命周期内仍能翻历史，刷新后即失效。</p>
 */
import { IndexedDBStore } from "../indexeddb";
import { decrypt, encrypt, secretKey } from "./aes";

/** 默认每个分组保留的条数 */
export const DEFAULT_MESSAGE_HISTORY_LIMIT = 100;
/** 条数上限：档位配置异常时不至于把本机存储写爆 */
export const MAX_MESSAGE_HISTORY_LIMIT = 1000;

/** 本机配置（条数）在 localStorage 里的键 */
const LIMIT_STORAGE_KEY = "ai-message-history-limit";
/** 单条记录最多保留的字符数（超长的粘贴内容只留开头，避免一条记录占满配额） */
const MAX_TEXT_LENGTH = 4000;
const DB_NAME = "koi-message-history";
const STORE_NAME = "messages";
/** scope 缺省值：会话页的追问 */
export const DEFAULT_MESSAGE_HISTORY_SCOPE = "chat";

/**
 * 读写历史时的分组参数。
 */
export interface MessageHistoryOptions {
  /** 用户名；缺省归入匿名分组 */
  user?: string | null;
  /** 业务分组：会话页缺省 chat，生图页传 generate */
  scope?: string | null;
  /** 本次使用的条数上限；不传则读本机配置（默认 100） */
  limit?: number;
}

/**
 * IndexedDB 里的一条记录。
 *
 * <p>只有 text 是密文；owner / scope / createdAt 保持明文，分组过滤与排序
 * 都依赖它们——把这三个字段也加密，就得先把整个库读出来逐条解密才能筛出
 * 「当前用户当前分组」的记录。</p>
 */
interface StoredMessage {
  id: string;
  owner: string;
  scope: string;
  /** AES 密文（base64） */
  text: string;
  createdAt: number;
}

const store = new IndexedDBStore({
  dbName: DB_NAME,
  storeName: STORE_NAME,
  keyPath: "id",
  version: 1,
});

/** IDB 不可用时的内存兜底：分组键 -> 记录（读取时统一按时间倒序） */
const memoryFallback = new Map<string, StoredMessage[]>();
/** 一旦 IDB 读写失败就整体切到内存，避免每条记录都重试一次必然失败的写入 */
let memoryOnly = false;
/** 同一毫秒内连续写入时的自增后缀，保证主键不撞 */
let sequence = 0;

/**
 * 把外部传入的条数收敛到合法范围。
 *
 * @param value 任意来源的条数（localStorage 字符串、调用方参数）
 * @returns 1-{@link MAX_MESSAGE_HISTORY_LIMIT} 的整数；非法值回落默认 100
 */
function normalizeLimit(value: unknown): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_MESSAGE_HISTORY_LIMIT;
  return Math.min(MAX_MESSAGE_HISTORY_LIMIT, n);
}

/**
 * 当前浏览器配置的保留条数。
 *
 * @returns 1-{@link MAX_MESSAGE_HISTORY_LIMIT} 的整数，默认 100
 */
export function getMessageHistoryLimit(): number {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_MESSAGE_HISTORY_LIMIT;
    const raw = localStorage.getItem(LIMIT_STORAGE_KEY);
    return raw ? normalizeLimit(raw) : DEFAULT_MESSAGE_HISTORY_LIMIT;
  } catch {
    return DEFAULT_MESSAGE_HISTORY_LIMIT;
  }
}

/**
 * 保存保留条数（只保存在本浏览器，不随账号同步）。
 *
 * @param limit 目标条数
 * @returns 收敛后的实际取值
 */
export function setMessageHistoryLimit(limit: number): number {
  const next = normalizeLimit(limit);
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(LIMIT_STORAGE_KEY, String(next));
  } catch {
    /* 隐私模式 / 配额满：只在本次运行内生效，下次打开回到默认值 */
  }
  return next;
}

/**
 * 解析分组：同一浏览器里不同账号、不同业务各自一份历史。
 *
 * @param options 分组参数
 * @returns 明文 owner / scope 与内部使用的复合键
 */
function groupOf(options: MessageHistoryOptions): { owner: string; scope: string; key: string } {
  const owner = String(options.user ?? "").trim() || "anon";
  const scope = String(options.scope ?? "").trim() || DEFAULT_MESSAGE_HISTORY_SCOPE;
  return { owner, scope, key: `${owner}\u0000${scope}` };
}

/**
 * 按创建时间倒序（最新在前）。
 *
 * @param records 原始记录
 * @returns 新数组，不改动入参
 */
function sortDesc(records: StoredMessage[]): StoredMessage[] {
  return [...records].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * 解密一条记录。
 *
 * @param cipher AES 密文
 * @returns 明文；密钥不匹配 / 记录损坏时返回空串（由调用方过滤掉）
 */
function decodeText(cipher: string): string {
  try {
    return decrypt(cipher, secretKey.AES_PWD_SECRET_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * 读取某个分组的全部记录（倒序）。
 *
 * @param options 分组参数
 * @returns 该分组的记录；IDB 不可用时读内存兜底
 */
async function readGroup(options: MessageHistoryOptions): Promise<StoredMessage[]> {
  const { owner, scope, key } = groupOf(options);
  if (!memoryOnly) {
    try {
      const all = await store.getAll<StoredMessage>();
      const mine = sortDesc(all.filter((item) => item.owner === owner && item.scope === scope));
      memoryFallback.set(key, mine);
      return mine;
    } catch {
      memoryOnly = true;
    }
  }
  return sortDesc(memoryFallback.get(key) ?? []);
}

/**
 * 写入一条记录（同时更新内存镜像，读取侧不必等下一次 IDB 往返）。
 *
 * @param record 待写入记录
 */
async function persistRecord(record: StoredMessage): Promise<void> {
  const { key } = groupOf({ user: record.owner, scope: record.scope });
  const rest = (memoryFallback.get(key) ?? []).filter((item) => item.id !== record.id);
  memoryFallback.set(key, sortDesc([record, ...rest]));
  if (memoryOnly) return;
  try {
    await store.put(record);
  } catch {
    memoryOnly = true;
  }
}

/**
 * 批量删除记录。
 *
 * @param records 待删除记录
 */
async function removeRecords(records: StoredMessage[]): Promise<void> {
  for (const record of records) {
    const { key } = groupOf({ user: record.owner, scope: record.scope });
    const rest = memoryFallback.get(key);
    if (rest) memoryFallback.set(key, rest.filter((item) => item.id !== record.id));
    if (memoryOnly) continue;
    try {
      await store.remove(record.id);
    } catch {
      memoryOnly = true;
    }
  }
}

/**
 * 生成记录主键：时间戳 + 自增序号 + 随机尾，既保序又不撞。
 *
 * @returns 主键字符串
 */
function nextId(): string {
  sequence += 1;
  return `${Date.now().toString(36)}-${sequence.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 读取历史（最新在前，已去重）。
 *
 * @param options 分组与条数
 * @returns 解密后的历史文本；无记录、存储不可用时返回空数组
 */
export async function loadMessageHistory(options: MessageHistoryOptions = {}): Promise<string[]> {
  const limit = normalizeLimit(options.limit ?? getMessageHistoryLimit());
  const records = await readGroup(options);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const record of records) {
    const value = decodeText(record.text).trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * 记住一条已发送的消息（去重后置顶，超额自动裁掉最旧的）。
 *
 * @param text 用户发送的原始文本
 * @param options 分组与条数
 * @returns 写入后的历史（与随后调用 {@link loadMessageHistory} 一致，便于直接刷新界面）
 */
export async function rememberMessage(
  text: string,
  options: MessageHistoryOptions = {},
): Promise<string[]> {
  const value = String(text ?? "").trim();
  if (!value) return loadMessageHistory(options);
  const kept = value.slice(0, MAX_TEXT_LENGTH);
  const limit = normalizeLimit(options.limit ?? getMessageHistoryLimit());
  const { owner, scope } = groupOf(options);

  const existing = await readGroup(options);
  // 同一句话只保留最新一条：重发同一句时它应该置顶，而不是在列表里出现两遍
  const duplicates = existing.filter((record) => decodeText(record.text).trim() === kept);
  if (duplicates.length) await removeRecords(duplicates);

  await persistRecord({
    id: nextId(),
    owner,
    scope,
    text: encrypt(kept, secretKey.AES_PWD_SECRET_KEY),
    createdAt: Date.now(),
  });

  // 刚写入的那条占一个名额，其余只留 limit - 1 条；再往后的直接删，别让本机存储无限增长
  const rest = existing.filter((record) => !duplicates.includes(record));
  const overflow = rest.slice(Math.max(0, limit - 1));
  if (overflow.length) await removeRecords(overflow);

  return loadMessageHistory({ ...options, limit });
}

/**
 * 清空某个分组的本机历史。
 *
 * @param options 分组参数
 */
export async function clearMessageHistory(options: MessageHistoryOptions = {}): Promise<void> {
  const { owner, scope, key } = groupOf(options);
  memoryFallback.delete(key);
  if (memoryOnly) return;
  try {
    const all = await store.getAll<StoredMessage>();
    const mine = all.filter((item) => item.owner === owner && item.scope === scope);
    for (const record of mine) await store.remove(record.id);
  } catch {
    memoryOnly = true;
  }
}

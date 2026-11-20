/**
 * 聊天上下文本地存储（IndexedDB + AES 加密）
 *
 * <p>会话排队消息、悬浮球对话记录这类「前端自己的上下文」此前散落在 localStorage
 * 明文里，任何人打开开发者工具都能直接读到整段对话内容。本模块把这类数据统一收口：
 * 写进 IndexedDB（容量远大于 localStorage，不会因为一段长对话把其它键挤掉），
 * JSON 先经 {@link encrypt}（AES/ECB/Pkcs7，密钥见 {@link secretKey}）加密再落盘，
 * 读取时再解密。与 {@link ./messageHistory!messageHistory} 同一套加密口径。</p>
 *
 * <p>边界说明（与 messageHistory 相同）：这是浏览器端的便利加密，不是保密存储——
 * 密钥随前端包一起下发，能挡住「随手翻 localStorage / 被同步盘打包上传」这类明文
 * 泄漏，挡不住已经拿到本机控制权的人。IndexedDB 不可用（隐私模式、配额满、非浏览器
 * 环境）时自动降级到内存：本次页面生命周期内可用，刷新后即失效。</p>
 *
 * <p>命名口径：记录主键 = {@code owner::namespace::key}。owner 做账号隔离
 * （同一浏览器多账号互不串内容），namespace 做业务隔离（如 queue / ai-character），
 * key 是业务内的记录标识（如 sessionId）。过期（TTL）由调用方在 value 里自带
 * savedAt 自行判断——本模块只做加密存取，不解释业务字段。</p>
 */
import { IndexedDBStore } from "../indexeddb";
import { decrypt, encrypt, secretKey } from "./aes";

/** IndexedDB 库名 / 表名 */
const DB_NAME = "koi-chat-context";
const STORE_NAME = "context";

/**
 * IndexedDB 里的一条记录。
 *
 * <p>只有 cipher 是密文；id / owner / namespace / key / savedAt 保持明文，
 * 主键定位与按命名空间枚举都依赖它们——把这些也加密，就得先把整个库读出来
 * 逐条解密才能筛出目标记录。</p>
 */
interface StoredContext {
  id: string;
  owner: string;
  namespace: string;
  key: string;
  /** AES 密文（base64），明文为 JSON.stringify(value) */
  cipher: string;
  savedAt: number;
}

/** 定位一条记录的三元组 */
export interface ChatContextRef {
  /** 用户名；缺省归入匿名分组 */
  owner?: string | null;
  /** 业务命名空间，如 queue / ai-character */
  namespace: string;
  /** 业务内记录标识，如 sessionId */
  key: string;
}

const store = new IndexedDBStore({
  dbName: DB_NAME,
  storeName: STORE_NAME,
  keyPath: "id",
  version: 1,
});

/** IDB 不可用时的内存兜底：记录主键 -> 记录 */
const memoryFallback = new Map<string, StoredContext>();
/** 一旦 IDB 读写失败就整体切到内存，避免每条记录都重试一次必然失败的写入 */
let memoryOnly = false;

/** 记录主键：owner::namespace::key */
function recordId(ref: ChatContextRef): string {
  const owner = String(ref.owner ?? "").trim();
  return `${owner}::${ref.namespace}::${ref.key}`;
}

/** owner 归一化：空串/undefined 一律归入匿名分组 */
function normalizeOwner(owner?: string | null): string {
  return String(owner ?? "").trim();
}

/**
 * 保存一段聊天上下文（按 owner::namespace::key 整体覆盖）。
 *
 * @param ref 记录定位（owner / namespace / key）
 * @param value 任意可 JSON 序列化的值（对象 / 数组均可，加密前统一 JSON.stringify）
 */
export async function saveChatContext(
  ref: ChatContextRef,
  value: unknown,
): Promise<void> {
  const owner = normalizeOwner(ref.owner);
  const record: StoredContext = {
    id: recordId(ref),
    owner,
    namespace: ref.namespace,
    key: ref.key,
    cipher: encrypt(JSON.stringify(value ?? null), secretKey.AES_PWD_SECRET_KEY),
    savedAt: Date.now(),
  };
  if (!memoryOnly) {
    try {
      await store.put(record);
      return;
    } catch {
      memoryOnly = true;
    }
  }
  memoryFallback.set(record.id, record);
}

/**
 * 读取一段聊天上下文。
 *
 * @param ref 记录定位（owner / namespace / key）
 * @returns 解密后的值；不存在或密文损坏时返回 null（损坏不抛错，调用方按「没有」处理）
 */
export async function loadChatContext<T = unknown>(
  ref: ChatContextRef,
): Promise<T | null> {
  const id = recordId(ref);
  let record: StoredContext | null = null;
  if (!memoryOnly) {
    try {
      record = await store.get<StoredContext>(id);
    } catch {
      memoryOnly = true;
      record = null;
    }
  }
  if (record === null && memoryOnly) {
    record = memoryFallback.get(id) ?? null;
  }
  if (!record) return null;
  try {
    const plain = decrypt(record.cipher, secretKey.AES_PWD_SECRET_KEY);
    return JSON.parse(plain) as T;
  } catch {
    // 密文损坏 / 解密失败：按「没有这条记录」处理，绝不让历史数据把读取链路打断
    return null;
  }
}

/**
 * 删除一段聊天上下文（不存在时静默）。
 *
 * @param ref 记录定位（owner / namespace / key）
 */
export async function removeChatContext(ref: ChatContextRef): Promise<void> {
  const id = recordId(ref);
  memoryFallback.delete(id);
  if (memoryOnly) return;
  try {
    await store.remove(id);
  } catch {
    memoryOnly = true;
  }
}

/**
 * 枚举某账号某命名空间下的全部聊天上下文。
 *
 * <p>用于启动时的整体水合（如把所有会话的排队消息一次性读进内存缓存），
 * 避免调用方逐个 key 试探。</p>
 *
 * @param owner 用户名；缺省为匿名分组
 * @param namespace 业务命名空间
 * @returns 记录列表（key + 解密后的 value + 落盘时间）；损坏条目跳过
 */
export async function listChatContext<T = unknown>(
  owner?: string | null,
  namespace?: string,
): Promise<Array<{ key: string; value: T; savedAt: number }>> {
  const wantOwner = normalizeOwner(owner);
  const wantNamespace = String(namespace ?? "");
  let records: StoredContext[] = [];
  if (!memoryOnly) {
    try {
      records = await store.getAll<StoredContext>();
    } catch {
      memoryOnly = true;
      records = [];
    }
  }
  if (memoryOnly) {
    records = Array.from(memoryFallback.values());
  }
  const out: Array<{ key: string; value: T; savedAt: number }> = [];
  for (const record of records) {
    if (record.owner !== wantOwner || record.namespace !== wantNamespace) continue;
    try {
      const plain = decrypt(record.cipher, secretKey.AES_PWD_SECRET_KEY);
      out.push({ key: record.key, value: JSON.parse(plain) as T, savedAt: record.savedAt });
    } catch {
      /* 损坏条目跳过 */
    }
  }
  return out;
}

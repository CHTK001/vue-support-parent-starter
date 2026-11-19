/**
 * 输入草稿持久化 v2（独立 IndexedDB 库：文本 + 附件 + 过期时间）
 *
 * <p>正在输入、尚未发送的内容此前只活在组件内存里：刷新页面、切换会话再切回来，
 * 打了一半的内容就丢了。v1 先把纯文本落盘（借用 messageHistory 的 AES 加密分组）；
 * v2 换成独立库，在同一张「一个会话 = 一条记录」的模型上补齐三件事：</p>
 *
 * <ul>
 *   <li><b>附件随草稿落盘</b>：未上传的小文件直接存 {@link File}（IndexedDB 结构化
 *       克隆原生支持 File/Blob，无需 base64），已上传的文件存「服务器文件 ID + URL」，
 *       恢复后按引用发送，不重新上传；过大或无法恢复的附件不存，恢复时提示跳过数量。</li>
 *   <li><b>过期清理</b>：草稿带写入时间，超过 {@link DRAFT_TTL_MS}（7 天）在读取与
 *       列举时视为不存在并物理删除，避免陈旧内容长期回填。</li>
 *   <li><b>会话草稿索引</b>：{@link listDraftSessionIds} 供会话列表画「有草稿」圆点；
 *       草稿写入/清除后派发 {@link DRAFT_CHANGED_EVENT}，侧栏监听刷新。</li>
 * </ul>
 *
 * <p>隔离口径：库名独立于聊天历史（koi-message-history）；记录主键 {@code owner:sid}，
 * 同浏览器多账号互不串。存储不可用（隐私模式 / 配额满 / 非浏览器环境）时降级为
 * 内存态：本次页面生命周期内草稿仍可读写，刷新后失效，不影响发送主流程。</p>
 *
 * <p>v1 的纯文本草稿（存于 messageHistory 的 {@code draft:<sid>} 分组）在首次读取时
 * 自动迁移进新库并清掉旧记录，无需一次性升级脚本。</p>
 */
import {
  IndexedDBStore,
  clearMessageHistory,
  loadMessageHistoryDetailed,
} from "@repo/utils";

/** 草稿保留时长：7 天。超期草稿在读取与列举时清除，避免陈旧内容悄悄回填 */
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** 草稿变化事件名：保存/清除/过期清理后派发，会话列表据此刷新「有草稿」圆点 */
export const DRAFT_CHANGED_EVENT = "ai-input-draft-changed";

/** 单个附件的落盘上限（2MB）：草稿是「接着写」的便签，不是文件仓库 */
export const DRAFT_FILE_MAX_BYTES = 2 * 1024 * 1024;
/** 全部附件的落盘总上限（8MB），超出部分不存，恢复时提示跳过数量 */
export const DRAFT_FILE_TOTAL_BYTES = 8 * 1024 * 1024;

/** 随草稿落盘的附件快照 */
export interface DraftFileSnapshot {
  /** 原始文件名（含扩展名） */
  name: string;
  /** 去扩展名的展示名 */
  displayName: string;
  /** 字节大小 */
  size: number;
  /** 扩展名（小写、不含点） */
  ext: string;
  /** 业务类型：text | image（FileItem 展示用） */
  type: string;
  /** MIME 类型（重建 File 用） */
  mime: string;
  /** 已上传文件的服务器文件 ID：恢复后按引用发送，不重新上传 */
  id?: string;
  /** 已上传文件的资源 URL */
  url?: string;
  /** 未上传文件的内容。IndexedDB 结构化克隆原生支持 File/Blob，无需转 base64 */
  blob?: Blob;
}

/** 一份完整草稿：文本 + 附件 + 写入时间 */
export interface InputDraftRecord {
  /** 输入框文本（已 trim；仅附件的草稿为空串） */
  text: string;
  /** 最后写入时间（毫秒），过期判断与「恢复角标」的时间展示都用它 */
  savedAt: number;
  /** 附件快照（可能为空数组） */
  files: DraftFileSnapshot[];
  /** 保存时因过大/无法恢复而未落盘的附件数量（恢复时提示） */
  skippedFiles: number;
}

/** IndexedDB 里的一条记录：主键 = owner:sid，同库多账号互不覆盖 */
interface StoredDraft {
  id: string;
  owner: string;
  sid: string;
  text: string;
  savedAt: number;
  files: DraftFileSnapshot[];
  skippedFiles: number;
}

const DB_NAME = "koi-input-draft";
const STORE_NAME = "drafts";

const store = new IndexedDBStore({
  dbName: DB_NAME,
  storeName: STORE_NAME,
  keyPath: "id",
  version: 1,
});

/** IDB 不可用时的内存兜底（键 = owner:sid） */
const memoryFallback = new Map<string, StoredDraft>();
/** 一旦读写失败就整体切内存，避免每条记录都重试一次必然失败的写入 */
let memoryOnly = false;

function ownerOf(user?: string | null): string {
  return String(user ?? "").trim() || "anon";
}

function recordId(user?: string | null, sid?: string | null): string {
  return `${ownerOf(user)}:${String(sid ?? "").trim()}`;
}

function isExpired(rec: StoredDraft, now = Date.now()): boolean {
  return now - rec.savedAt > DRAFT_TTL_MS;
}

/** 旧版（v1）草稿在 messageHistory 里的分组 scope */
function legacyScope(sid: string): string {
  return `draft:${sid}`;
}

/** 草稿变化后广播：会话列表监听这个事件刷新圆点，避免引入跨组件 store 依赖 */
function notifyChanged(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(DRAFT_CHANGED_EVENT));
  } catch {
    /* 事件不可用不影响草稿本身 */
  }
}

/** 读取当前用户的全部草稿记录（顺带刷新内存镜像） */
async function readAll(user?: string | null): Promise<StoredDraft[]> {
  const owner = ownerOf(user);
  if (!memoryOnly) {
    try {
      const all = await store.getAll<StoredDraft>();
      const mine = all.filter((rec) => rec.owner === owner);
      for (const rec of mine) memoryFallback.set(rec.id, rec);
      return mine;
    } catch {
      memoryOnly = true;
    }
  }
  return [...memoryFallback.values()].filter((rec) => rec.owner === owner);
}

async function writeRecord(rec: StoredDraft): Promise<void> {
  memoryFallback.set(rec.id, rec);
  if (memoryOnly) return;
  try {
    await store.put(rec);
  } catch {
    memoryOnly = true;
  }
}

async function removeRecord(id: string): Promise<void> {
  memoryFallback.delete(id);
  if (memoryOnly) return;
  try {
    await store.remove(id);
  } catch {
    memoryOnly = true;
  }
}

/** 物理删除已过期的草稿（含 v1 旧记录的兜底清理在读取时逐条进行） */
async function sweepExpired(user?: string | null): Promise<void> {
  const records = await readAll(user);
  const now = Date.now();
  let changed = false;
  for (const rec of records) {
    if (!isExpired(rec, now)) continue;
    await removeRecord(rec.id);
    changed = true;
  }
  if (changed) notifyChanged();
}

/**
 * 保存（或清除）一个会话的输入草稿。
 *
 * @param text 当前输入的文本；空白且无附件时视为清除草稿
 * @param user 用户名（缺省归入匿名分组）
 * @param sessionId 会话 ID；缺省/空串不动作
 * @param files 随草稿落盘的附件快照（由调用方先做好大小筛选取舍）
 * @param skippedFiles 因过大/无法恢复而未落盘的附件数量
 */
export async function saveInputDraft(
  text: string,
  user?: string | null,
  sessionId?: string | null,
  files: DraftFileSnapshot[] = [],
  skippedFiles = 0,
): Promise<void> {
  const sid = String(sessionId ?? "").trim();
  if (!sid) return;
  const value = String(text ?? "").trim();
  if (!value && files.length === 0) {
    await clearInputDraft(user, sid);
    return;
  }
  // 顺手清掉其它会话的过期草稿：写盘频率被防抖限制住，这里多一次全表读可接受
  await sweepExpired(user);
  await writeRecord({
    id: recordId(user, sid),
    owner: ownerOf(user),
    sid,
    text: value,
    savedAt: Date.now(),
    files,
    skippedFiles,
  });
  notifyChanged();
}

/**
 * 读取一个会话的完整草稿（含附件与写入时间）；过期草稿返回 null 并物理删除。
 *
 * @param user 用户名
 * @param sessionId 会话 ID
 */
export async function loadInputDraftRecord(
  user?: string | null,
  sessionId?: string | null,
): Promise<InputDraftRecord | null> {
  const sid = String(sessionId ?? "").trim();
  if (!sid) return null;
  const id = recordId(user, sid);
  let rec: StoredDraft | null = null;
  if (!memoryOnly) {
    try {
      rec = await store.get<StoredDraft>(id);
    } catch {
      memoryOnly = true;
    }
  }
  if (!rec) rec = memoryFallback.get(id) ?? null;
  if (!rec) rec = await readLegacyDraft(user, sid);
  if (!rec) return null;
  if (isExpired(rec)) {
    await removeRecord(rec.id);
    await clearLegacyDraft(user, sid);
    notifyChanged();
    return null;
  }
  return {
    text: rec.text ?? "",
    savedAt: rec.savedAt,
    files: Array.isArray(rec.files) ? rec.files : [],
    skippedFiles: rec.skippedFiles ?? 0,
  };
}

/**
 * 读取一个会话的输入草稿文本（旧接口，等价于 {@link loadInputDraftRecord} 的 text）。
 *
 * @param user 用户名
 * @param sessionId 会话 ID
 * @returns 草稿文本；没有草稿或存储不可用时返回空串
 */
export async function loadInputDraft(
  user?: string | null,
  sessionId?: string | null,
): Promise<string> {
  const rec = await loadInputDraftRecord(user, sessionId);
  return rec?.text ?? "";
}

/**
 * 清除一个会话的输入草稿（发送成功、编辑器清空后调用）。
 *
 * @param user 用户名
 * @param sessionId 会话 ID
 */
export async function clearInputDraft(
  user?: string | null,
  sessionId?: string | null,
): Promise<void> {
  const sid = String(sessionId ?? "").trim();
  if (!sid) return;
  await removeRecord(recordId(user, sid));
  await clearLegacyDraft(user, sid);
  notifyChanged();
}

/**
 * 当前用户所有未过期的会话草稿 ID，供会话列表画「有草稿」圆点。
 *
 * @param user 用户名
 */
export async function listDraftSessionIds(user?: string | null): Promise<Set<string>> {
  await sweepExpired(user);
  const records = await readAll(user);
  const now = Date.now();
  return new Set(records.filter((rec) => !isExpired(rec, now)).map((rec) => rec.sid));
}

/**
 * 迁移 v1 旧草稿：旧版把纯文本存进 messageHistory 的 {@code draft:<sid>} 分组，
 * 首次读取新库未命中时搬一次家（写入新库 + 清掉旧分组），之后不再走旧表。
 */
async function readLegacyDraft(
  user?: string | null,
  sessionId?: string | null,
): Promise<StoredDraft | null> {
  const sid = String(sessionId ?? "").trim();
  if (!sid) return null;
  try {
    const entries = await loadMessageHistoryDetailed({ user, scope: legacyScope(sid), limit: 1 });
    const entry = entries[0];
    const text = String(entry?.text ?? "").trim();
    if (!text) return null;
    const savedAt = entry?.createdAt ?? Date.now();
    const rec: StoredDraft = {
      id: recordId(user, sid),
      owner: ownerOf(user),
      sid,
      text,
      savedAt,
      files: [],
      skippedFiles: 0,
    };
    if (!isExpired(rec)) await writeRecord(rec);
    await clearLegacyDraft(user, sid);
    return isExpired(rec) ? null : rec;
  } catch {
    return null;
  }
}

/** 清掉 v1 旧分组（迁移或清除草稿时调用；旧表不可用时报错被吞掉即可） */
async function clearLegacyDraft(user?: string | null, sessionId?: string | null): Promise<void> {
  const sid = String(sessionId ?? "").trim();
  if (!sid) return;
  try {
    await clearMessageHistory({ user, scope: legacyScope(sid) });
  } catch {
    /* 旧表清理失败不影响新库 */
  }
}

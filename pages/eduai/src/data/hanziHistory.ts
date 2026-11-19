/**
 * 汉字识字「练习历史」——本地暂存（localStorage）。
 *
 * <p>每答完一批记录一条（题数 / 答对数 / 错字），用于成绩页的近批正确率趋势
 * 与连续打卡天数。只做本地激励展示，不上报服务端（学习行为上报仍由
 * useStudyReport 走真实链路）。存储不可用（隐私模式 / 禁用 localStorage）
 * 时静默降级为内存态，不影响练习本身。</p>
 */

/** 一条练习历史记录 */
export interface HanziHistoryEntry {
  /** 记录时间（ISO 字符串）；缺省时写入时自动取当前时间 */
  time?: string;
  /** 本批题数 */
  total: number;
  /** 答对数 */
  score: number;
  /** 本批答错的字（去重、按出题顺序） */
  wrong: string[];
}

const KEY = "eduai:hanzi-history";
/** 最多留存条数，超出丢最旧的 */
const MAX = 30;

/** localStorage 不可用时的内存兜底 */
let memoryFallback: HanziHistoryEntry[] | null = null;

function readStore(): HanziHistoryEntry[] {
  if (memoryFallback) {
    return memoryFallback;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as HanziHistoryEntry[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    memoryFallback = [];
    return memoryFallback;
  }
}

function writeStore(list: HanziHistoryEntry[]): void {
  if (memoryFallback) {
    memoryFallback = list;
    return;
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    memoryFallback = list;
  }
}

/**
 * 记一批练习结果：新的排前面，超出上限丢最旧的。
 *
 * @param entry 历史记录（time 缺省时取当前时间）
 */
export function addHanziHistory(entry: HanziHistoryEntry): void {
  if (!entry.total) {
    return;
  }
  const list = readStore();
  list.unshift({ ...entry, time: entry.time || new Date().toISOString() });
  writeStore(list.slice(0, MAX));
}

/** 练习历史（最近的在前） */
export function listHanziHistory(): HanziHistoryEntry[] {
  return [...readStore()];
}

/** 本地日期键：YYYY-MM-DD（按本地时区，避免 UTC 日期错位） */
function dayKeyOf(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dayKeyOf(d);
}

/**
 * 连续打卡天数：从今天往前数连续有记录的天数。
 *
 * <p>今天还没练时不立即断签，从昨天起算（对儿童更友好）；
 * 今天与昨天都没有记录则为 0。</p>
 */
export function hanziStreakDays(): number {
  const days = new Set(
    readStore()
      .map((e) => dayKey(e.time ?? ""))
      .filter(Boolean),
  );
  if (!days.size) {
    return 0;
  }
  const cursor = new Date();
  if (!days.has(dayKeyOf(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKeyOf(cursor))) {
      return 0;
    }
  }
  let streak = 0;
  while (days.has(dayKeyOf(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

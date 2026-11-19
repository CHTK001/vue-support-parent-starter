/**
 * 汉字识字「错题本」——本地暂存（localStorage）。
 *
 * <p>只做答错记录的留存与回顾展示；出题始终由服务端负责，这里不生成新题。
 * 存储不可用（隐私模式 / 禁用 localStorage）时静默降级为内存态，不影响练习本身。</p>
 */

/** 一条错题记录 */
export interface HanziWrongEntry {
  /** 汉字（单字） */
  char: string;
  /** 题型：pinyin 读音 / strokes 笔画数 / order 笔顺 */
  type: string;
  /** 当时填的答案 */
  picked: string;
  /** 正确答案 */
  answer: string;
  /** 记录时间（ISO 字符串） */
  time: string;
  /** 当时的读音快照（回顾时免再查） */
  pinyin?: string;
  /** 当时的笔顺快照（如「横竖撇捺」） */
  strokeOrder?: string;
}

const KEY = "eduai:hanzi-wrong-book";
/** 最多留存条数，超出丢最旧的 */
const MAX = 50;

/** localStorage 不可用时的内存兜底 */
let memoryFallback: HanziWrongEntry[] | null = null;

function readStore(): HanziWrongEntry[] {
  if (memoryFallback) {
    return memoryFallback;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as HanziWrongEntry[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    memoryFallback = [];
    return memoryFallback;
  }
}

function writeStore(list: HanziWrongEntry[]): void {
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
 * 记一道错题：按「字 + 题型」去重（同一字同题型只留最近一次），新的排前面。
 *
 * @param entry 错题记录（time 缺省时取当前时间）
 */
export function addHanziWrong(entry: HanziWrongEntry): void {
  if (!entry.char) {
    return;
  }
  const rest = readStore().filter((e) => !(e.char === entry.char && e.type === entry.type));
  rest.unshift({ ...entry, time: entry.time || new Date().toISOString() });
  writeStore(rest.slice(0, MAX));
}

/** 错题列表（最近的在前） */
export function listHanziWrong(): HanziWrongEntry[] {
  return [...readStore()];
}

/**
 * 删除单条错题：按「字 + 题型」定位（与 addHanziWrong 的去重键一致）。
 *
 * @param char 汉字
 * @param type 题型
 */
export function removeHanziWrong(char: string, type: string): void {
  writeStore(readStore().filter((e) => !(e.char === char && e.type === type)));
}

/** 清空错题本 */
export function clearHanziWrong(): void {
  memoryFallback = [];
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* 隐私模式下内存态已清，忽略 */
  }
}

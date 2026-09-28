/**
 * usePaperCart —— 组卷购物车（跨页面共享的基础件）
 *
 * 职责：
 *  - 维护「待加入试卷」的题目集合，按 questionId 去重；
 *  - 以试卷维度持久化到 localStorage，paperId 为空时落到 tmp 桶；
 *  - paperId 变化时自动切换到对应桶的数据。
 *
 * 存储 key：`eduai:paper-cart:${paperId}`，paperId 为 null 时使用
 * `eduai:paper-cart:tmp`。读取时对 JSON.parse 做容错，损坏数据直接丢弃。
 */
import { computed, ref, watch, type ComputedRef, type Ref } from "vue";

/** 购物车条目（与题库市场题目字段对齐，另补单题分值） */
export interface CartItem {
  questionId: number;
  type: string;
  stem: string;
  options?: string;
  answer?: string;
  analysis?: string;
  score: number;
  difficulty?: number;
  subject?: string;
  grade?: string;
  /** 来源（题库原始码值，展示时转中文） */
  source?: string;
}

/** 未关联试卷时的临时存储桶 */
const TMP_STORAGE_KEY = "eduai:paper-cart:tmp";

/**
 * 题库市场题目 → 购物车条目。
 *
 * <p>市场接口（/v2/edu/question/page）返回的是 questionXxx 前缀字段，购物车用的是短字段名，
 * 两处调用点（试卷列表页、组卷页）都要做这层映射，因此收敛到此处，避免各写一遍。</p>
 *
 * @param q 市场题目（字段可能缺省）
 * @param fallbackScore 题目未带分值时使用的兜底分值
 * @returns 购物车条目
 */
export function toCartItem(
  q: {
    questionId: number;
    questionType?: string;
    questionStem?: string;
    questionOptions?: string;
    questionAnswer?: string;
    questionAnalysis?: string;
    questionScore?: number;
    questionDifficulty?: number;
    questionSubject?: string;
    questionGrade?: string;
  },
  fallbackScore = 5,
): CartItem {
  const score = Number(q.questionScore);
  return {
    questionId: Number(q.questionId),
    type: q.questionType ?? "",
    stem: q.questionStem ?? "",
    options: q.questionOptions,
    answer: q.questionAnswer,
    analysis: q.questionAnalysis,
    score: Number.isFinite(score) && score > 0 ? score : fallbackScore,
    difficulty: q.questionDifficulty,
    subject: q.questionSubject,
    grade: q.questionGrade,
  };
}

/** 试卷标识 → 存储 key */
function storageKeyOf(paperId: number | null): string {
  return paperId == null ? TMP_STORAGE_KEY : `eduai:paper-cart:${paperId}`;
}

/** 取 localStorage；不可用时返回 null（隐私模式 / 非浏览器环境） */
function getStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") {
      return null;
    }
    return localStorage;
  } catch {
    return null;
  }
}

/** 读取并容错解析某个 key 下的购物车数据 */
function readCart(key: string): CartItem[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
      .filter((entry) => Number.isFinite(Number(entry.questionId)))
      .map((entry) => ({
        questionId: Number(entry.questionId),
        type: typeof entry.type === "string" ? entry.type : "",
        stem: typeof entry.stem === "string" ? entry.stem : "",
        options: typeof entry.options === "string" ? entry.options : undefined,
        answer: typeof entry.answer === "string" ? entry.answer : undefined,
        analysis: typeof entry.analysis === "string" ? entry.analysis : undefined,
        score: Number(entry.score) || 0,
        difficulty: Number.isFinite(Number(entry.difficulty)) ? Number(entry.difficulty) : undefined,
        subject: typeof entry.subject === "string" ? entry.subject : undefined,
        grade: typeof entry.grade === "string" ? entry.grade : undefined,
      }));
  } catch {
    // 损坏数据（非法 JSON / 结构不符）直接丢弃，不阻断组卷
    return [];
  }
}

/** 写入某个 key；存储不可用或超配额时静默降级 */
function writeCart(key: string, list: CartItem[]): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(key, JSON.stringify(list));
  } catch {
    // 配额 / 隐私模式失败时忽略，购物车内存态仍然可用
  }
}

/**
 * 组卷购物车。
 *
 * @param paperId 当前试卷标识（可为空 Ref / ComputedRef）
 * @returns 响应式的 items 与操作方法；totalScore / count 为 computed
 */
export function usePaperCart(paperId: Ref<number | null> | ComputedRef<number | null>) {
  const storageKey = computed(() => storageKeyOf(paperId.value));

  const items = ref<CartItem[]>(readCart(storageKey.value));

  /** 判断某题是否已在购物车中（读取 items，模板中调用保持响应式） */
  function has(questionId: number): boolean {
    return items.value.some((item) => item.questionId === questionId);
  }

  /** 加入一题；已存在则忽略。返回是否实际新增 */
  function addOne(item: CartItem): boolean {
    if (has(item.questionId)) {
      return false;
    }
    items.value.push(item);
    return true;
  }

  /** 批量加入；返回实际新增数量（重复项被跳过） */
  function addMany(list: CartItem[]): number {
    let added = 0;
    for (const item of list) {
      if (addOne(item)) {
        added += 1;
      }
    }
    return added;
  }

  /** 按题目标识移除 */
  function remove(questionId: number): void {
    const index = items.value.findIndex((item) => item.questionId === questionId);
    if (index >= 0) {
      items.value.splice(index, 1);
    }
  }

  /** 清空当前购物车 */
  function clear(): void {
    items.value = [];
  }

  /** 设置某题分值（题目不存在时忽略） */
  function setScore(questionId: number, score: number): void {
    const target = items.value.find((item) => item.questionId === questionId);
    if (target) {
      target.score = score;
    }
  }

  /** 分值合计 */
  const totalScore = computed(() => items.value.reduce((sum, item) => sum + (item.score || 0), 0));

  /** 题目数量 */
  const count = computed(() => items.value.length);

  // paperId 变化时切换到对应存储桶的数据
  watch(storageKey, (key) => {
    items.value = readCart(key);
  });

  // 购物车变化时持久化到当前存储桶
  watch(
    items,
    (value) => {
      writeCart(storageKey.value, value);
    },
    { deep: true },
  );

  return { items, addOne, addMany, remove, clear, setScore, has, totalScore, count };
}

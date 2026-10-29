/**
 * 数据库管理器的本地偏好存储（F5）
 *
 * <p>两套作用域，刻意分开：</p>
 * <ul>
 *   <li><b>视图偏好</b>（表头注释/类型 / 行注释 / 左侧树 / 每页行数 / 统计总数 /
 *       ER 图设置 / 上次数据源）：
 *       全局一份。这是「我怎么读表」的显示偏好，按表各存一份等于
 *       要为每张表重设一遍。</li>
 *   <li><b>每表查询偏好</b>（WHERE 快速筛选 + 高级筛选条件）：<b>按 {@code 库.表} 分键</b>。
 *       这里不是洁癖：A 表的 {@code status = 1} 套到 B 表上会引用
 *       B 表根本不存在的列，直接报错。E2 的列偏好已经踩过同一个坑 ——
 *       用全局一份会让「在 A 表隐藏的列到 B 表也消失」。</li>
 * </ul>
 *
 * <p>三条硬要求：</p>
 * <ol>
 *   <li><b>读到坏数据不崩</b>：localStorage 里的东西可能被别的代码、手改、
 *       旧版本写坏。解析失败一律回落默认值 —— 偏好丢了不该导致表打不开。</li>
 *   <li><b>逐字段校验</b>：整体 JSON 合法不代表字段合法（{@code pageSize: -1}
 *       或 {@code headerMode: "xxx"}）。不合法的单个字段单独回落，不牵连其他字段。</li>
 *   <li><b>容量有上限</b>：每表一份筛选条件，500 张表就能把 5MB 配额撑爆，
 *       之后连写入都失败（静默丢偏好）。按最近使用时间淘汰。</li>
 * </ol>
 *
 * @author CH
 * @since 4.0.0
 */

/** 每表偏好最多保留多少条（超出按最近使用时间淘汰） */
const MAX_TABLE_PREFS = 120;

/** 视图偏好存储键 */
const VIEW_KEY = "dbm-view-pref";
/** 每表查询偏好存储键（内部按表再分一层） */
const TABLE_KEY = "dbm-table-pref";
/** 存储结构版本；结构不兼容时 +1，旧数据直接丢弃而不是尝试迁移 */
const SCHEMA_VERSION = 2;

/** 允许的每页行数（与界面分页选项一致） */
const PAGE_SIZES = [20, 50, 100, 200, 500];
/** 允许的 ER 图布局（非层级：树形布局在普通关系图上会抛 Tree structure not found） */
const ER_LAYOUTS = ["dagre", "antv-dagre", "force", "d3-force", "circular", "grid"];

/** 视图偏好 */
export interface DbViewPref {
  /**
   * 表头显示注释开关：开启后字段名下方显示列注释（两行表头）。
   *
   * <p>v2 改版：旧的 {@code headerMode}（字段/注释/字段+注释/类型四选一）被拆成
   * 「显示注释 + 显示类型」两个独立开关 —— 字段名**恒显示**，注释与类型分别作为
   * 字段名下方的补充行。旧的互斥单选没有「同时看注释和类型」的组合，拆开后能。</p>
   */
  showHeaderComments: boolean;
  /** 表头显示类型开关：开启后字段名下方显示列数据库类型（与注释同行并存） */
  showHeaderTypes: boolean;
  /**
   * 行显示注释开关：开启后每个数据单元格数值下方显示该列注释。
   *
   * <p>v2 改版：旧的 {@code rowMode}（数据/数据+注释两选一）改为单个开关 ——
   * 数据恒显示，注释作为补充行。与表头两个开关同源同形态。</p>
   */
  showRowComments: boolean;
  /**
   * 左侧连接树是否显示。
   *
   * <p>「隐藏左树」是宽表的救命开关：300px 的树吃掉近三分之一横向空间，
   * 列一多就只能横向滚。它属于「我怎么看这个控制台」的偏好，与表头/行显示同级，
   * 所以和它们存在同一份视图偏好里，而不是另开一个裸 key ——
   * 裸 key 没有版本号，结构一变就是静默读出垃圾。</p>
   *
   * <p>默认 {@code true}：升级上来的用户没写过这个字段，必须仍是「看得见树」，
   * 不能因为新增一个开关就把树藏起来。旧版本的 {@code v: 2} 记录缺这一项，
   * 由 {@code loadViewPref} 的逐字段回落补成默认值，因此**不需要**升
   * {@code SCHEMA_VERSION}（升版本会整份丢弃用户已有偏好，代价远大于收益）。</p>
   */
  showSidebar: boolean;
  pageSize: number;
  showTotal: boolean;
  erLayout: string;
  erShowLabels: boolean;
  erTableFilter: string;
  lastDatasourceId: number;
}

/** 每表查询偏好 */
export interface DbTablePref {
  filterWhere: string;
  filters: DbFilterCondition[];
  /** 最近使用时刻（毫秒），用于容量淘汰 */
  at: number;
}

/**
 * 高级筛选条件。
 *
 * <p>形状与 `monitorApi` 的 `DbFilterCondition` **必须一致**（`value` 可选）：
 * 这里另立一份且必填，会让「从存储读出来的条件」无法赋给
 * {@code activeFilters} —— 类型不兼容在恢复那一刻才报，位置离原因很远。
 * 出现两个「长得像」的筛选条件类型本身就是隐患，这里按同形状声明。</p>
 */
export interface DbFilterCondition {
  column: string;
  op: string;
  /** 值1；IN 时为逗号分隔的多值；BETWEEN 时为下界 */
  value?: string;
  /** 值2：仅 BETWEEN 用作上界 */
  value2?: string;
}

/** 默认视图偏好 */
export const DEFAULT_VIEW_PREF: DbViewPref = {
  showHeaderComments: false,
  showHeaderTypes: false,
  showRowComments: false,
  showSidebar: true,
  pageSize: 50,
  showTotal: false,
  erLayout: "dagre",
  erShowLabels: true,
  erTableFilter: "",
  lastDatasourceId: 0,
};

/**
 * 从任意值里取第一个合法候选。
 *
 * <p>用来做**逐字段**回落：整体 JSON 能解析不代表每个字段都合法，
 * 而一个非法字段不该把其余合法字段一起拖成默认值。</p>
 */
function pick<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** 读原始 JSON，坏数据返回空对象而不是抛错 */
function readBag(key: string): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    // 存储被写坏 / 隐私模式禁用 / 配额满：都回落成「没有偏好」，
    // 绝不能因为一条坏记录就打不开表。
    return {};
  }
}

/** 写 JSON；失败只警告一次，不打断使用 */
function writeBag(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 配额满 / 隐私模式：偏好存不下不该让功能不可用
    console.warn("[dbm] 本地偏好写入失败，本次设置不会保留");
  }
}

/**
 * 读视图偏好，逐字段回落默认值。
 *
 * @returns 视图偏好
 */
export function loadViewPref(): DbViewPref {
  const bag = readBag(VIEW_KEY);
  if (bag.v !== SCHEMA_VERSION) {
    // 版本不符：结构可能已变，整体回落而不是逐字段猜。
    // 少几项显示偏好无所谓，猜错才是真的坑。
    return { ...DEFAULT_VIEW_PREF };
  }
  const pageSizeRaw = Number(bag.pageSize);
  const boolField = (v: unknown, fallback: boolean): boolean =>
    typeof v === "boolean" ? v : fallback;
  return {
    showHeaderComments: boolField(bag.showHeaderComments, DEFAULT_VIEW_PREF.showHeaderComments),
    showHeaderTypes: boolField(bag.showHeaderTypes, DEFAULT_VIEW_PREF.showHeaderTypes),
    showRowComments: boolField(bag.showRowComments, DEFAULT_VIEW_PREF.showRowComments),
    showSidebar: boolField(bag.showSidebar, DEFAULT_VIEW_PREF.showSidebar),
    pageSize: PAGE_SIZES.includes(pageSizeRaw) ? pageSizeRaw : DEFAULT_VIEW_PREF.pageSize,
    showTotal: boolField(bag.showTotal, DEFAULT_VIEW_PREF.showTotal),
    erLayout: pick(bag.erLayout, ER_LAYOUTS, DEFAULT_VIEW_PREF.erLayout),
    erShowLabels: boolField(bag.erShowLabels, DEFAULT_VIEW_PREF.erShowLabels),
    erTableFilter: typeof bag.erTableFilter === "string"
      ? bag.erTableFilter.slice(0, 200)
      : DEFAULT_VIEW_PREF.erTableFilter,
    lastDatasourceId: Number.isFinite(Number(bag.lastDatasourceId))
      ? Number(bag.lastDatasourceId)
      : DEFAULT_VIEW_PREF.lastDatasourceId,
  };
}

/**
 * 保存视图偏好（合并式，只写传入的字段）。
 *
 * @param patch 要更新的字段
 */
export function saveViewPref(patch: Partial<DbViewPref>): void {
  const merged = { ...loadViewPref(), ...patch };
  writeBag(VIEW_KEY, { v: SCHEMA_VERSION, ...merged });
}

/**
 * 读某张表的查询偏好。
 *
 * @param key {@code 库.表} 形式的键
 * @returns 没有偏好时返回 null
 */
export function loadTablePref(key: string): DbTablePref | null {
  if (!key) return null;
  const bag = readBag(TABLE_KEY);
  const raw = bag[key];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  return {
    filterWhere: typeof rec.filterWhere === "string" ? rec.filterWhere : "",
    filters: sanitizeFilters(rec.filters),
    at: Number.isFinite(Number(rec.at)) ? Number(rec.at) : 0,
  };
}

/**
 * 保存某张表的查询偏好，并顺带做容量淘汰。
 *
 * @param key  {@code 库.表} 形式的键
 * @param pref 偏好内容（{@code at} 由本函数写入）
 */
export function saveTablePref(key: string, pref: Omit<DbTablePref, "at">): void {
  if (!key) return;
  const bag = readBag(TABLE_KEY);
  bag[key] = { ...pref, at: Date.now() };
  // 容量淘汰：每表一份筛选条件，500 张表就能撑爆 5MB 配额，
  // 之后**写入会静默失败**，用户会发现「偏好莫名其妙全丢了」。
  const keys = Object.keys(bag);
  if (keys.length > MAX_TABLE_PREFS) {
    const at = (k: string) => {
      const v = bag[k];
      return v && typeof v === "object" ? Number((v as { at?: unknown }).at) || 0 : 0;
    };
    const drop = keys
      .sort((a, b) => at(a) - at(b))
      .slice(0, keys.length - MAX_TABLE_PREFS);
    for (const k of drop) delete bag[k];
  }
  writeBag(TABLE_KEY, bag);
}

/**
 * 清掉某张表的查询偏好。
 *
 * @param key {@code 库.表} 形式的键
 */
export function clearTablePref(key: string): void {
  if (!key) return;
  const bag = readBag(TABLE_KEY);
  if (!(key in bag)) return;
  delete bag[key];
  writeBag(TABLE_KEY, bag);
}

/**
 * 清掉**不再存在**的表的偏好。
 *
 * <p>表被改名或删掉后，它的偏好会一直占着位置，把真正在用的挤出上限。
 * 每次刷新时按「当前库里真实存在的表」对一遍。</p>
 *
 * @param existingKeys 当前仍然存在的 {@code 库.表} 键集合
 * @returns 被清掉的条目数
 */
export function pruneTablePrefs(existingKeys: Set<string>): number {
  const bag = readBag(TABLE_KEY);
  const stale = Object.keys(bag).filter(k => !existingKeys.has(k));
  if (stale.length === 0) return 0;
  for (const k of stale) delete bag[k];
  writeBag(TABLE_KEY, bag);
  return stale.length;
}

/**
 * 清空全部偏好（界面上「恢复默认」用，也是验收脚本的复位入口）。
 */
export function resetAllPrefs(): void {
  try {
    localStorage.removeItem(VIEW_KEY);
    localStorage.removeItem(TABLE_KEY);
  } catch {
    // 清不掉就清不掉，下一次写入会覆盖
  }
}

/**
 * 过滤条件数组的清洗。
 *
 * <p>只保留「列名 + 运算符都是非空串」的项：半条条件（只有列没有运算符）
 * 会被后端 `DbFilter` 判为参数错误，而报错发生在**加载数据时**，
 * 用户只会看到「打开这张表就报错」，根本想不到是上次的筛选条件坏了。</p>
 */
function sanitizeFilters(raw: unknown): DbFilterCondition[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .filter(f => typeof f.column === "string" && f.column.trim() !== "")
    .filter(f => typeof f.op === "string" && f.op.trim() !== "")
    .map(f => ({
      column: String(f.column),
      op: String(f.op),
      value: typeof f.value === "string" ? f.value : String(f.value ?? ""),
      ...(typeof f.value2 === "string" && f.value2 !== "" ? { value2: f.value2 } : {}),
    }));
}

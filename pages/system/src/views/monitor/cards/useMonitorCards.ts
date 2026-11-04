/**
 * 监控大屏卡片布局 composable
 *
 * <p>职责与首页 {@code useHomeLayout} 一致：读 / 存 / 增删改排，外加一层向后兼容。
 * 形态也从首页对齐 —— {@code { cards, grid }} 两份数据：</p>
 * <ul>
 *   <li>{@code cards} —— 摆了什么（类型、标题、数据源配置）；</li>
 *   <li>{@code grid} —— 摆在哪、多大（x / y / w / h，12 列网格单位）。</li>
 * </ul>
 *
 * <p><b>为什么不再用「有序数组 + span/height」</b>：那种结构只能表达「一行几个、
 * 上下顺序」，无法自由摆放，也就没有所见即所得可言。换成网格坐标后，拖拽 / 缩放的
 * 结果就是存档本身（与首页同一套 grid-layout-plus 模型）。</p>
 *
 * <p><b>落盘两层</b>：</p>
 * <ol>
 *   <li>框架 storage（{@code getFrameworkStorage()}）—— 即时可用、按账号隔离、离线可读，
 *       用裸 localStorage 会绕开前缀与加解密规则（表现为「换账号看到别人的卡片」）；</li>
 *   <li>用户配置接口（{@code GET/PUT /v2/user/layout?component=monitor}）—— 跨设备、
 *       跨浏览器；接口不可用时静默降级为纯本地，不阻塞任何交互。</li>
 * </ol>
 *
 * <p><b>刻意不查注册表</b>来过滤存档：结构完好但当前应用未注册的卡片<b>保留</b>，
 * 由渲染层显示占位卡片（同首页布局的处理）。否则「在 A 应用摆的模块卡片，
 * 切到没启用该模块的 B 应用就凭空消失」。</p>
 */
import { computed, ref, type Ref } from "vue";
import { getFrameworkStorage, log } from "@repo/utils";
import {
  MONITOR_GRID_COLS,
  MONITOR_MIN_H,
  MONITOR_MIN_W,
  MONITOR_PAGE_BLOCK_PREFIX,
  MONITOR_ROW_HEIGHT,
  MONITOR_GRID_MARGIN,
  isPageBlockType,
  type MonitorCardItem,
  type MonitorCardSourceConfig,
  type MonitorCardType,
  type MonitorGridItem,
  type MonitorLayoutState,
} from "./types";
import { MONITOR_PAGE_BLOCKS, MONITOR_PAGE_BLOCK_TYPE } from "./pageBlocks";
import { fetchMonitorLayout, pushMonitorLayout } from "./useMonitorLayoutSync";

/** 存储 key（框架会自动补 {@code system:} 前缀） */
const STORAGE_KEY = "monitor:srv-cards";

/**
 * 存档版本。
 *
 * <ul>
 *   <li>1 —— 有序数组 + {@code span / height}（像素），只能上下挪</li>
 *   <li>2 —— {@code { cards, grid }} 12 列网格，但只有外围卡片</li>
 *   <li>3 —— 网格装<b>整页</b>：页面原生区块（KPI / 趋势 / 磁盘…）也进网格</li>
 *   <li>4 —— OTel 观测卡片下线，领域卡片改由 {@code pages/xx} 自注册</li>
 * </ul>
 *
 * <p>低于 {@link PAGE_BLOCK_VERSION} 的存档会被补上页面区块；达到该版本之后
 * <b>不再补</b> —— 用户把某块删掉是他的选择，刷新再给他塞回去会很讨厌。</p>
 */
const STORAGE_VERSION = 4;

/** 页面区块进入网格的版本号（见 {@link STORAGE_VERSION}） */
const PAGE_BLOCK_VERSION = 3;

/**
 * 已下线的种子卡片 id（v4）。
 *
 * <p>只清理由默认布局种下的那两张 OTel 卡片：它们的 type 已不再注册，
 * 留着会在页面上变成两块「当前应用未启用」的占位。用户<b>自己添加</b>的 OTel 卡片
 * 不在清理范围内 —— 那是他的数据，应由他自己删除或换应用查看。</p>
 */
const RETIRED_SEED_IDS = new Set(["seed-otel-http", "seed-otel-jvm"]);

/**
 * 页面区块的默认坐标（12 列网格）。
 *
 * <p>刻意保持与改造前「上下几段」的视觉一致：KPI 通栏 → RESTful / 内存池 / 磁盘网络 + GC
 * 三列 → 趋势 + 网络流量两列 → 磁盘分区 + 系统信息两列。改这里等于改「恢复默认」的结果。</p>
 */
const DEFAULT_BLOCK_GRID: Record<string, { x: number; y: number; w: number; h: number }> = {
  [MONITOR_PAGE_BLOCK_TYPE.kpi]: { x: 0, y: 0, w: 12, h: 3 },
  [MONITOR_PAGE_BLOCK_TYPE.restful]: { x: 0, y: 3, w: 5, h: 11 },
  [MONITOR_PAGE_BLOCK_TYPE.mem]: { x: 5, y: 3, w: 4, h: 11 },
  [MONITOR_PAGE_BLOCK_TYPE.diskNet]: { x: 9, y: 3, w: 3, h: 5 },
  [MONITOR_PAGE_BLOCK_TYPE.gc]: { x: 9, y: 8, w: 3, h: 6 },
  [MONITOR_PAGE_BLOCK_TYPE.trend]: { x: 0, y: 14, w: 8, h: 6 },
  [MONITOR_PAGE_BLOCK_TYPE.netflow]: { x: 8, y: 14, w: 4, h: 6 },
  [MONITOR_PAGE_BLOCK_TYPE.disks]: { x: 0, y: 20, w: 7, h: 5 },
  [MONITOR_PAGE_BLOCK_TYPE.sysinfo]: { x: 7, y: 20, w: 5, h: 5 },
};

/** 页面区块占掉的底部行号：外围卡片（以及旧存档里的卡片）从这里往下摆 */
const PAGE_BLOCK_BOTTOM = Object.values(DEFAULT_BLOCK_GRID).reduce(
  (max, g) => Math.max(max, g.y + g.h),
  0,
);

/** 页面区块的稳定 id（不随机生成，跨设备 / 刷新后都是同一个格子） */
function blockId(type: string): string {
  return `blk-${type.replace(MONITOR_PAGE_BLOCK_PREFIX, "")}`;
}

/** 默认布局里的页面区块卡片条目 */
const DEFAULT_BLOCK_CARDS: MonitorCardItem[] = MONITOR_PAGE_BLOCKS.map((b) => ({
  id: blockId(b.type),
  type: b.type,
  title: b.title,
}));

/** 默认布局里的页面区块网格坐标 */
const DEFAULT_BLOCK_LAYOUT: MonitorGridItem[] = MONITOR_PAGE_BLOCKS.map((b) => ({
  i: blockId(b.type),
  ...DEFAULT_BLOCK_GRID[b.type],
}));

/**
 * 默认外围卡片（首次进入即可看到「一套能跑的」Actuator 视图）。
 *
 * <p>不再种 APM 卡片：APM 是可选能力，未接入的环境里默认摆一张「未接入」卡片
 * 只会制造噪音。需要的人从「自定义 → 组件目录 → APM 观测」点一下即可。</p>
 */
const DEFAULT_EXT_CARDS: MonitorCardItem[] = [
  { id: "seed-health", type: "actuator-health", title: "健康状态" },
  { id: "seed-metrics", type: "actuator-metrics", title: "关键指标" },
];

/** 默认外围卡片坐标（接在页面区块下面） */
const DEFAULT_EXT_GRID: MonitorGridItem[] = [
  { i: "seed-health", x: 0, y: PAGE_BLOCK_BOTTOM, w: 4, h: 5 },
  { i: "seed-metrics", x: 4, y: PAGE_BLOCK_BOTTOM, w: 8, h: 5 },
];

/** 默认布局：整页（页面区块 + 外围卡片） */
export const DEFAULT_LAYOUT: MonitorLayoutState = {
  cards: [...DEFAULT_BLOCK_CARDS, ...DEFAULT_EXT_CARDS],
  grid: [...DEFAULT_BLOCK_LAYOUT, ...DEFAULT_EXT_GRID],
};

/** 生成卡片 id */
function newId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** 取整并钳制到 [min, max] */
function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** 配置归一（间隔与条数做了上限，防止用户填 0.001 秒把后端打穿） */
function normalizeConfig(raw: unknown): MonitorCardSourceConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as MonitorCardSourceConfig;
  const intervalSec = Number(c.intervalSec);
  const limit = Number(c.limit);
  return {
    kind: c.kind === "url" || c.kind === "iframe" ? c.kind : "actuator",
    path: typeof c.path === "string" ? c.path : "",
    intervalSec: Number.isFinite(intervalSec) ? Math.min(3600, Math.max(0, intervalSec)) : undefined,
    valuePath: typeof c.valuePath === "string" ? c.valuePath : undefined,
    render: c.render === "table" || c.render === "json" || c.render === "value" ? c.render : "kv",
    unit: typeof c.unit === "string" ? c.unit : undefined,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(500, Math.round(limit)) : undefined,
  };
}

/** 单条卡片结构校验 + 归一 */
function normalizeCard(raw: unknown): MonitorCardItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<MonitorCardItem>;
  if (typeof o.id !== "string" || !o.id.trim()) return null;
  if (typeof o.type !== "string" || !o.type.trim()) return null;
  return {
    id: o.id,
    type: o.type,
    title: typeof o.title === "string" && o.title.trim() ? o.title : o.type,
    source: typeof o.source === "string" ? o.source : undefined,
    config: normalizeConfig(o.config),
  };
}

/** 单条网格坐标校验 + 归一 */
function normalizeGridItem(raw: unknown): MonitorGridItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<MonitorGridItem>;
  if (typeof o.i !== "string" || !o.i.trim()) return null;
  const w = clampInt(o.w, MONITOR_MIN_W, MONITOR_GRID_COLS, 6);
  const x = clampInt(o.x, 0, MONITOR_GRID_COLS - w, 0);
  return {
    i: o.i,
    x,
    y: clampInt(o.y, 0, 999, 0),
    w,
    h: clampInt(o.h, MONITOR_MIN_H, 60, 5),
  };
}

/** 布局占用的总行数 */
function bottomOf(grid: readonly MonitorGridItem[]): number {
  return grid.reduce((max, g) => Math.max(max, g.y + g.h), 0);
}

/**
 * 把 v1 存档（有序数组 + span / height 像素）升级成 v2 网格坐标。
 *
 * <p>迁移口径：按原顺序从左到右、放不下就换行地铺开，宽度直接取原跨度
 * （3/4/6/8/12 正好都是 12 的约数），高度由像素换算成行数。这样老用户升级后
 * 看到的排布与升级前基本一致，不至于「一升级布局全乱」。</p>
 *
 * @param rawCards v1 的卡片数组（元素上带 span / height）
 * @returns 迁移后的布局
 */
export function migrateLegacyLayout(rawCards: readonly unknown[]): MonitorLayoutState {
  const cards: MonitorCardItem[] = [];
  const grid: MonitorGridItem[] = [];
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  for (const raw of rawCards) {
    const card = normalizeCard(raw);
    if (!card) continue;
    const legacy = raw as { span?: unknown; height?: unknown };
    const w = clampInt(legacy.span, MONITOR_MIN_W, MONITOR_GRID_COLS, 6);
    // 像素 → 行数：h 行 + 行间 gap 正好覆盖原高度
    const px = Number(legacy.height);
    const h = clampInt(
      (Number.isFinite(px) ? px : 280) / (MONITOR_ROW_HEIGHT + MONITOR_GRID_MARGIN),
      MONITOR_MIN_H,
      60,
      5,
    );
    if (cursorX + w > MONITOR_GRID_COLS) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }
    cards.push(card);
    grid.push({ i: card.id, x: cursorX, y: cursorY, w, h });
    cursorX += w;
    rowHeight = Math.max(rowHeight, h);
  }

  return { cards, grid };
}

/**
 * 对齐卡片与网格坐标：以 {@code cards} 为准。
 *
 * <ul>
 *   <li>有卡片但没有坐标（存档损坏 / 新增未落盘）→ 顺延摆到最底下，不会凭空消失；</li>
 *   <li>有坐标但没有卡片（孤儿格子）→ 丢弃，避免渲染出「不知道是什么」的格子。</li>
 * </ul>
 */
function alignLayout(cards: MonitorCardItem[], grid: MonitorGridItem[]): MonitorLayoutState {
  const byId = new Map<string, MonitorGridItem>();
  grid.forEach((g) => byId.set(g.i, g));
  const aligned: MonitorGridItem[] = [];
  let y = bottomOf(grid.filter((g) => cards.some((c) => c.id === g.i)));

  for (const card of cards) {
    const g = byId.get(card.id);
    if (g) {
      aligned.push({ ...g, i: card.id });
    } else {
      aligned.push({ i: card.id, x: 0, y, w: 6, h: 5 });
      y += 5;
    }
  }
  return { cards, grid: aligned };
}

/**
 * 给旧存档补上页面区块（v1 / v2 → v3）。
 *
 * <p>v2 存档里只有外围卡片，坐标从 {@code y = 0} 起。如果直接把页面区块按默认坐标
 * 塞进去，两者会<b>重叠</b>成一片糊。所以旧存档里的卡片整体下移
 * {@link PAGE_BLOCK_BOTTOM} 行，页面区块落在上面那块——用户看到的顺序与升级前一致
 * （先是原生区块，后面才是他自己加的外围卡片）。</p>
 *
 * <p>已经是 v3 的存档<b>原样返回</b>：缺哪个区块说明用户删了它，不该替他加回来。</p>
 *
 * @param state   已归一化的布局
 * @param version 存档版本
 * @returns 补齐后的布局
 */
function withPageBlocks(state: MonitorLayoutState, version: number): MonitorLayoutState {
  if (version >= PAGE_BLOCK_VERSION) return state;

  const present = new Set(state.cards.map((c) => c.type));
  const missing = MONITOR_PAGE_BLOCKS.filter((b) => !present.has(b.type));
  if (missing.length === 0) return state;

  const missingTypes = new Set(missing.map((b) => b.type));
  // 旧存档里的卡片统一下移；已经存在的页面区块（理论上不会有）保持原位
  const shiftedGrid: MonitorGridItem[] = state.grid.map((g) => {
    const card = state.cards.find((c) => c.id === g.i);
    return card && isPageBlockType(card.type) ? g : { ...g, y: g.y + PAGE_BLOCK_BOTTOM };
  });

  const addedCards = DEFAULT_BLOCK_CARDS.filter((c) => missingTypes.has(c.type));
  const addedGrid = DEFAULT_BLOCK_LAYOUT.filter((g) => addedCards.some((c) => c.id === g.i));

  log.warn(
    `[monitor-cards] 存档升级到 v${PAGE_BLOCK_VERSION}：补入 ${addedCards.length} 个页面区块，` +
      `原有 ${shiftedGrid.length} 个卡片下移 ${PAGE_BLOCK_BOTTOM} 行`,
  );

  return {
    cards: [...addedCards, ...state.cards],
    grid: [...addedGrid, ...shiftedGrid],
  };
}

/**
 * 移除已下线的默认种子卡片（v3 → v4）。
 *
 * <p>只按 id 命中 {@link RETIRED_SEED_IDS}，不动用户自己添加的同类卡片；
 * 缺少这些 id 的存档原样返回。</p>
 *
 * @param state   已归一化的布局
 * @param version 存档版本
 * @returns 清理后的布局
 */
function dropRetiredSeeds(state: MonitorLayoutState, version: number): MonitorLayoutState {
  if (version >= 4) return state;
  const removed = new Set(state.cards.filter((c) => RETIRED_SEED_IDS.has(c.id)).map((c) => c.id));
  if (removed.size === 0) return state;

  log.warn(
    `[monitor-cards] 存档升级到 v${STORAGE_VERSION}：移除 ${removed.size} 张已下线的 OTel 种子卡片`,
  );

  return {
    cards: state.cards.filter((c) => !removed.has(c.id)),
    grid: state.grid.filter((g) => !removed.has(g.i)),
  };
}

/** 解析任意来源（本地 / 远端 / 旧版本）的布局数据 */
export function parseLayout(raw: unknown): MonitorLayoutState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { version?: unknown; cards?: unknown; grid?: unknown };
  if (!Array.isArray(o.cards)) return null;
  const version = Number.isFinite(Number(o.version)) ? Number(o.version) : 0;

  const cards = o.cards.map(normalizeCard).filter((c): c is MonitorCardItem => c !== null);
  if (cards.length !== o.cards.length) {
    log.warn(`[monitor-cards] 丢弃 ${o.cards.length - cards.length} 条结构损坏的卡片存档`);
  }
  const grid = Array.isArray(o.grid)
    ? o.grid.map(normalizeGridItem).filter((g): g is MonitorGridItem => g !== null)
    : [];
  // 没有 grid 字段（v1 存档）→ 走迁移
  const migrated = grid.length === 0 && version < 2
    ? migrateLegacyLayout(o.cards)
    : alignLayout(cards, grid);
  return dropRetiredSeeds(withPageBlocks(migrated, version), version);
}

/** 读本地存档 */
function readLocal(): MonitorLayoutState | null {
  const raw = getFrameworkStorage().get<unknown>(STORAGE_KEY);
  return parseLayout(raw);
}

/** 监控卡片布局 hook */
export function useMonitorCards(): {
  cards: Ref<MonitorCardItem[]>;
  grid: Ref<MonitorGridItem[]>;
  loading: Ref<boolean>;
  countByType: (type: MonitorCardType) => number;
  add: (type: MonitorCardType, preset?: Partial<MonitorCardItem> & { size?: { w: number; h: number } }) => MonitorCardItem | null;
  remove: (id: string) => void;
  patch: (id: string, partial: Partial<MonitorCardItem>) => void;
  updateGrid: (next: MonitorGridItem[]) => void;
  reset: () => void;
  /** 恢复成给定布局（「取消本次编辑」） */
  restore: (state: MonitorLayoutState) => void;
  /** 当前布局的深拷贝快照 */
  snapshot: () => MonitorLayoutState;
  load: () => Promise<void>;
  save: () => void;
} {
  const seeded = readLocal();
  const cards = ref<MonitorCardItem[]>(seeded?.cards ?? cloneLayout(DEFAULT_LAYOUT).cards);
  const grid = ref<MonitorGridItem[]>(seeded?.grid ?? cloneLayout(DEFAULT_LAYOUT).grid);
  const loading = ref(false);
  /**
   * 是否已完成一次远端读取。
   *
   * <p>「先读服务器」的时序保护：挂载早期（本地缓存已渲染、远端请求还在路上）不该把
   * 本地那份推上去 —— 否则一次刷新就可能拿旧缓存盖掉服务器上的新布局。远端读取结束前
   * 只写本地缓存，不发起上报。</p>
   */
  const hydrated = ref(false);

  /** 落盘：本地同步写 + 远端异步上报（都失败只告警，内存态继续可用） */
  function save(): void {
    const snapshot: MonitorLayoutState = {
      cards: cards.value.map((c) => ({ ...c })),
      grid: grid.value.map((g) => ({ ...g })),
    };
    const ok = getFrameworkStorage().set(STORAGE_KEY, { version: STORAGE_VERSION, ...snapshot });
    if (!ok) {
      log.warn(
        "[monitor-cards] 卡片布局未落盘（本地写入失败）。常见原因：配额已满、浏览器禁用本地存储、隐私模式。" +
          "当前布局仍在内存中可用，刷新后会回到上次成功的存档。",
      );
    }
    // 用户配置接口：失败仅告警一次（见 useMonitorLayoutSync），不阻塞 UI。
    // 带上 version：老版本存档（v2 只有外围卡片）在别处读到时才会被补上页面区块。
    // 远端读取完成前不上报：此时的本地布局可能是旧缓存，先推上去等于用旧盖新。
    if (hydrated.value) {
      void pushMonitorLayout({ version: STORAGE_VERSION, ...snapshot });
    }
  }

  /**
   * 首次加载：本地缓存先兜底渲染，远端读取成功则<b>覆盖</b>本地。
   *
   * <p>顺序按使用方的要求定死：</p>
   * <ol>
   *   <li>初始化阶段已用本地缓存（{@link readLocal}）同步渲染 —— 接口不可用时页面照常可用；</li>
   *   <li>挂载后请求用户配置接口，<b>只要返回了能解析的布局就整份覆盖</b>内存与本地缓存，
   *       空布局也算（用户把卡片删光了是明确意图，不能因为「0 张」就回退到默认）；</li>
   *   <li>接口没有数据 / 不可用 → 保持本地缓存，不写远端、不弹错。</li>
   * </ol>
   */
  async function load(): Promise<void> {
    loading.value = true;
    try {
      const remote = await fetchMonitorLayout();
      const parsed = remote ? parseLayout(remote) : null;
      if (parsed) {
        cards.value = parsed.cards;
        grid.value = parsed.grid;
        // 远端更权威：覆盖本地缓存，保证下次离线打开也是服务器上那一版
        getFrameworkStorage().set(STORAGE_KEY, { version: STORAGE_VERSION, ...parsed });
        return;
      }
      // 远端没有布局（新账号 / 接口不可用）：本地缓存已在初始化阶段生效，这里无需覆盖
      const local = readLocal();
      if (local) {
        cards.value = local.cards;
        grid.value = local.grid;
      }
    } finally {
      loading.value = false;
      hydrated.value = true;
    }
  }

  function countByType(type: MonitorCardType): number {
    return cards.value.filter((c) => c.type === type).length;
  }

  function add(
    type: MonitorCardType,
    preset?: Partial<MonitorCardItem> & { size?: { w: number; h: number } },
  ): MonitorCardItem | null {
    const card: MonitorCardItem = {
      id: newId(),
      type,
      title: preset?.title ?? type,
      source: preset?.source,
      config: normalizeConfig(preset?.config),
    };
    const w = clampInt(preset?.size?.w, MONITOR_MIN_W, MONITOR_GRID_COLS, 6);
    const h = clampInt(preset?.size?.h, MONITOR_MIN_H, 60, 5);
    cards.value.push(card);
    // 新卡片落在最下方，避免和已有卡片抢位置（同一套逻辑，可预期）
    grid.value.push({ i: card.id, x: 0, y: bottomOf(grid.value), w, h });
    save();
    return card;
  }

  function remove(id: string): void {
    const idx = cards.value.findIndex((c) => c.id === id);
    if (idx >= 0) cards.value.splice(idx, 1);
    const gIdx = grid.value.findIndex((g) => g.i === id);
    if (gIdx >= 0) grid.value.splice(gIdx, 1);
    save();
  }

  function patch(id: string, partial: Partial<MonitorCardItem>): void {
    const card = cards.value.find((c) => c.id === id);
    if (!card) return;
    if (partial.title !== undefined) card.title = partial.title.trim() || card.title;
    if (partial.config !== undefined) card.config = normalizeConfig(partial.config);
    save();
  }

  /** 拖拽 / 缩放后的网格：只做结构归一，坐标本身由 grid-layout-plus 维护 */
  function updateGrid(next: MonitorGridItem[]): void {
    grid.value = next
      .map((g) => normalizeGridItem(g))
      .filter((g): g is MonitorGridItem => g !== null);
    save();
  }

  function reset(): void {
    const fresh = cloneLayout(DEFAULT_LAYOUT);
    cards.value = fresh.cards;
    grid.value = fresh.grid;
    save();
  }

  /**
   * 恢复成给定的一份布局（「取消本次编辑」用）。
   *
   * <p>为什么需要它：本页的布局是<b>改一下就落盘</b>的（拖到一半刷新也不丢），
   * 所以「反悔」不能靠内存草稿，只能把进入编辑时拍下的快照写回去。
   * 传入的是快照的深拷贝，这里再拷一份，避免两份引用同一个数组。</p>
   *
   * @param state 要恢复的布局
   */
  function restore(state: MonitorLayoutState): void {
    cards.value = state.cards.map((c) => ({ ...c }));
    grid.value = state.grid.map((g) => ({ ...g }));
    save();
  }

  /** 取当前布局的快照（深拷贝，可安全交给 {@link restore}） */
  function snapshot(): MonitorLayoutState {
    return {
      cards: cards.value.map((c) => ({ ...c })),
      grid: grid.value.map((g) => ({ ...g })),
    };
  }

  return {
    cards,
    grid,
    loading,
    countByType,
    add,
    remove,
    patch,
    updateGrid,
    reset,
    restore,
    snapshot,
    load,
    save,
  };
}

/** 深拷贝默认布局（默认值是模块级常量，直接引用会被就地改坏） */
function cloneLayout(src: MonitorLayoutState): MonitorLayoutState {
  return {
    cards: src.cards.map((c) => ({ ...c })),
    grid: src.grid.map((g) => ({ ...g })),
  };
}

/** 卡片是否已超出自身上限（0 / 负数视为不限） */
export function isOverMax(count: number, maxCount: number): boolean {
  return maxCount > 0 && count >= maxCount;
}

/** 计算用的辅助：卡片总数（面板文案用） */
export function useCardCount(cards: Ref<MonitorCardItem[]>) {
  return computed(() => cards.value.length);
}

/**
 * 软件指标表 —— 数据聚合 + 浏览器持久化配置 + SSE 实时推送
 *
 * <p>行 = 软件类型（目录 ∪ 识别到的类型），未识别到的行按配置置灰（或隐藏）；
 * 配置存浏览器（框架 storage）；socket push 可实时更新实例数据。</p>
 */
import { computed, ref, shallowRef } from "vue";
import { getFrameworkStorage, log } from "@repo/utils";
import { getMonitor, getServerHost } from "../api";
import {
  SOFTWARE_CATALOG,
  SOFTWARE_GROUP_LABEL,
  catalogOrder,
  softwareDef,
  type SoftwareGroupKey,
} from "./catalog";

/** 后端 SoftwareInstanceVO（字段可能缺省） */
export interface SoftwareInstance {
  type?: string;
  displayName?: string;
  pid?: number;
  cpu?: number;
  memMb?: number;
  uptimeSec?: number;
  cmd?: string;
  port?: number;
}

/** 单行 = 一个软件类型（同类型多实例已聚合） */
export interface SoftwareRow {
  type: string;
  label: string;
  group: SoftwareGroupKey;
  groupLabel: string;
  icon: string;
  role: string;
  /** 本机是否识别到（false = 未安装 / 未运行） */
  available: boolean;
  /** 实例数 */
  count: number;
  /** 该类型实例 CPU 合计（%） */
  totalCpu: number;
  /** 该类型实例内存合计（MB） */
  totalMemMb: number;
  /** 监听端口（去重，取不到为空） */
  ports: number[];
  /** 最长运行时长（秒） */
  maxUptimeSec: number;
  /** 所有实例（多实例展开用） */
  instances: SoftwareInstance[];
}

/** 展开状态：type → 是否展开 */
export type ExpandedMap = Map<string, boolean>;

/** 浏览器持久化配置 */
export interface SoftwareTablePrefs {
  v: 1;
  /** 被显式隐藏的软件 type（空 = 全显） */
  hidden: string[];
  /** 行顺序（只存 type；未出现的按目录顺序补齐） */
  order: string[];
  /** 未识别的行：false = 置灰显示 / true = 直接不渲染 */
  hideUnavailable: boolean;
  /** 分组折叠状态：type → 是否折叠（只对分组头有效） */
  collapsed: string[];
  /** 默认展开所有分组 */
  expandAll: boolean;
  /** 排序字段 */
  sortBy: SortField;
  /** 排序方向 */
  sortDir: "asc" | "desc";
}

export type SortField = "label" | "group" | "count" | "cpu" | "mem" | "uptime";

const PREFS_KEY = "monitor:software-table";

const DEFAULT_PREFS: SoftwareTablePrefs = {
  v: 1,
  hidden: [],
  order: [],
  hideUnavailable: false,
  collapsed: [],
  expandAll: true,
  sortBy: "label",
  sortDir: "asc",
};

export function loadPrefs(): SoftwareTablePrefs {
  try {
    const raw = getFrameworkStorage().get<Partial<SoftwareTablePrefs>>(PREFS_KEY);
    if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFS };
    const strs = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((t): t is string => typeof t === "string") : [];
    return {
      v: 1,
      hidden: strs(raw.hidden),
      order: strs(raw.order),
      hideUnavailable: raw.hideUnavailable === true,
      collapsed: strs(raw.collapsed),
      expandAll: raw.expandAll !== false,
      sortBy: (raw.sortBy as SortField) || "label",
      sortDir: raw.sortDir === "desc" ? "desc" : "asc",
    };
  } catch (e) {
    log.warn("[software-table] 读取配置失败，使用默认", e);
    return { ...DEFAULT_PREFS };
  }
}

function persistPrefs(p: SoftwareTablePrefs): void {
  try {
    getFrameworkStorage().set(PREFS_KEY, p);
  } catch (e) {
    log.warn("[software-table] 保存配置失败", e);
  }
}

export function parseSoftware(raw: unknown): SoftwareInstance[] {
  if (!raw) return [];
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try { arr = JSON.parse(raw); } catch { return []; }
  }
  return Array.isArray(arr) ? (arr as SoftwareInstance[]) : [];
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * 拉取监控项所在主机的软件实例。
 *
 * <p>monitorId 与 hostId 是两个 ID 域，必须经 msServerHostId 映射。</p>
 */
export async function fetchMonitorSoftware(monitorId: number): Promise<SoftwareInstance[]> {
  const monitor = await getMonitor(monitorId);
  const hostId = num((monitor as { msServerHostId?: unknown } | null)?.msServerHostId);
  if (!hostId) return [];
  const host = await getServerHost(hostId);
  return parseSoftware((host as { serverHostSoftware?: unknown } | null)?.serverHostSoftware);
}

/**
 * 生成 CSV 导出内容。
 *
 * @param rows 已过滤的行
 * @param searchKeyword 搜索关键字（用于标注当前过滤状态）
 */
export function exportCsv(rows: SoftwareRow[], searchKeyword = ""): { csv: string; filename: string } {
  const BOM = "\uFEFF";
  const header = ["软件", "分组", "状态", "实例数", "CPU 合计(%)", "内存合计(MB)", "端口", "最长运行时长(秒)"];
  const lines = rows.map((r) => [
    r.label,
    SOFTWARE_GROUP_LABEL[r.group] ?? r.group,
    r.available ? "运行中" : "未识别",
    String(r.count),
    String(r.totalCpu),
    String(Math.round(r.totalMemMb)),
    r.ports.join(";"),
    String(r.maxUptimeSec),
  ]);
  const csv = [header, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const filename = `软件指标_${new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })}${searchKeyword ? `_过滤${searchKeyword}` : ""}.csv`;
  return { csv: BOM + csv, filename };
}

/**
 * 下载 CSV。
 */
export function downloadCsv(rows: SoftwareRow[], keyword = ""): void {
  const { csv, filename } = exportCsv(rows, keyword);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** 构建一行（聚合） */
function buildRow(type: string, ins: SoftwareInstance[]): SoftwareRow {
  const sorted = [...ins].sort((a, b) => num(b.cpu) - num(a.cpu));
  const def = softwareDef(type, sorted[0]?.displayName);
  return {
    type,
    label: def.label,
    group: def.group,
    groupLabel: SOFTWARE_GROUP_LABEL[def.group] ?? def.group,
    icon: def.icon,
    role: def.role,
    available: ins.length > 0,
    count: ins.length,
    totalCpu: Math.round(ins.reduce((s, x) => s + num(x.cpu), 0) * 10) / 10,
    totalMemMb: Math.round(ins.reduce((s, x) => s + num(x.memMb), 0) * 10) / 10,
    ports: Array.from(new Set(ins.map((x) => num(x.port)).filter((p) => p > 0))),
    maxUptimeSec: Math.max(0, ...ins.map((x) => num(x.uptimeSec))),
    instances: sorted,
  };
}

export function useSoftwareTable(instances: () => SoftwareInstance[] | undefined) {
  const prefs = ref<SoftwareTablePrefs>(loadPrefs());

  /** 全部行（聚合后，未过滤） */
  const allRows = computed<SoftwareRow[]>(() => {
    const list = instances() ?? [];
    const grouped = new Map<string, SoftwareInstance[]>();
    for (const s of list) {
      const type = s?.type;
      if (!type) continue;
      const arr = grouped.get(type);
      if (arr) arr.push(s); else grouped.set(type, [s]);
    }
    const types = new Set<string>(SOFTWARE_CATALOG.map((d) => d.type));
    for (const t of grouped.keys()) types.add(t);
    const order = prefs.value.order;
    const rank = (t: string): number => {
      const i = order.indexOf(t);
      return i < 0 ? catalogOrder(t) : i;
    };
    const out: SoftwareRow[] = [];
    for (const type of types) {
      const ins = grouped.get(type) ?? [];
      out.push(buildRow(type, ins));
    }
    out.sort((a, b) => rank(a.type) - rank(b.type) || Number(b.available) - Number(a.available));
    return out;
  });

  /** 搜索过滤后的行 */
  const searchRows = computed<SoftwareRow[]>(() => {
    const kw = searchKeyword.value.trim().toLowerCase();
    if (!kw) return allRows.value;
    return allRows.value.filter(
      (r) => r.type.toLowerCase().includes(kw) || r.label.toLowerCase().includes(kw) || r.groupLabel.includes(kw),
    );
  });

  /** 实际展示的行（已过滤） */
  const visibleRows = computed<SoftwareRow[]>(() => {
    const hidden = new Set(prefs.value.hidden);
    let out = searchRows.value.filter((r) => {
      if (hidden.has(r.type)) return false;
      if (!r.available && prefs.value.hideUnavailable) return false;
      return true;
    });
    // 排序
    const { sortBy, sortDir } = prefs.value;
    out = [...out].sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      if (sortBy === "label") { av = a.label; bv = b.label; }
      else if (sortBy === "group") { av = a.groupLabel; bv = b.groupLabel; }
      else if (sortBy === "count") { av = a.count; bv = b.count; }
      else if (sortBy === "cpu") { av = a.totalCpu; bv = b.totalCpu; }
      else if (sortBy === "mem") { av = a.totalMemMb; bv = b.totalMemMb; }
      else if (sortBy === "uptime") { av = a.maxUptimeSec; bv = b.maxUptimeSec; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return out;
  });

  /** 展开状态（type → 是否展开） */
  const expanded = shallowRef<ExpandedMap>(new Map());

  /** 搜索关键字 */
  const searchKeyword = ref("");

  /** 分组列表（含折叠状态） */
  const groupList = computed<{ group: SoftwareGroupKey; label: string; count: number; available: number }[]>(() => {
    const groups = new Map<SoftwareGroupKey, { count: number; available: number }>();
    for (const r of visibleRows.value) {
      const g = groups.get(r.group) ?? { count: 0, available: 0 };
      g.count++;
      if (r.available) g.available++;
      groups.set(r.group, g);
    }
    return (Object.keys(SOFTWARE_GROUP_LABEL) as SoftwareGroupKey[])
      .filter((g) => groups.has(g))
      .map((g) => ({ group: g, label: SOFTWARE_GROUP_LABEL[g], ...groups.get(g)! }));
  });

  const availableCount = computed(() => allRows.value.filter((r) => r.available).length);

  function updatePrefs(next: Partial<SoftwareTablePrefs>): void {
    const merged: SoftwareTablePrefs = { ...prefs.value, ...next, v: 1 };
    prefs.value = merged;
    persistPrefs(merged);
  }

  function resetPrefs(): void {
    prefs.value = { ...DEFAULT_PREFS };
    persistPrefs(prefs.value);
  }

  function toggleVisible(type: string, visible: boolean): void {
    const set = new Set(prefs.value.hidden);
    if (visible) set.delete(type); else set.add(type);
    updatePrefs({ hidden: [...set] });
  }

  function move(type: string, dir: -1 | 1): void {
    const seq = visibleRows.value.map((r) => r.type);
    const i = seq.indexOf(type);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= seq.length) return;
    [seq[i], seq[j]] = [seq[j], seq[i]];
    updatePrefs({ order: seq });
  }

  function toggleSort(field: SortField): void {
    if (prefs.value.sortBy === field) {
      updatePrefs({ sortDir: prefs.value.sortDir === "asc" ? "desc" : "asc" });
    } else {
      updatePrefs({ sortBy: field, sortDir: "desc" });
    }
  }

  function toggleExpand(type: string): void {
    const map = new Map(expanded.value);
    map.set(type, !map.get(type));
    expanded.value = map;
  }

  function isExpanded(type: string): boolean {
    if (!prefs.value.expandAll && !prefs.value.collapsed.includes(type)) return true;
    if (prefs.value.expandAll && prefs.value.collapsed.includes(type)) return false;
    if (!prefs.value.expandAll && !prefs.value.collapsed.length) return true;
    return prefs.value.expandAll && !prefs.value.collapsed.includes(type);
  }

  function toggleGroup(group: SoftwareGroupKey): void {
    const set = new Set(prefs.value.collapsed);
    if (set.has(group)) set.delete(group); else set.add(group);
    updatePrefs({ collapsed: [...set] });
  }

  return {
    prefs,
    allRows,
    visibleRows,
    searchKeyword,
    groupList,
    expanded,
    availableCount,
    updatePrefs,
    resetPrefs,
    toggleVisible,
    move,
    toggleSort,
    toggleExpand,
    isExpanded,
    toggleGroup,
    downloadCsv,
  };
}

/**
 * 主页布局 Composable
 *
 * 负责主页可拖拽仪表板的布局数据加载与保存。
 *
 * 数据流（受 app.yaml layoutConfig.source 控制）：
 *   - "local"   仅使用本地 storage 缓存（getLayoutCache / setLayoutCache），不发起任何远程请求。
 *   - "remote"  优先读 storage 缓存；缓存缺失时调用 getLayout() 拉取并自动写回缓存。
 *               保存时先写本地 storage（保证即时可用），再异步上报 API（saveLayout）。
 *               上报失败不影响本地布局生效。
 *
 * 导出：
 *   - load()         加载并返回当前用户布局（reactive）
 *   - save(next)     保存布局（本地 + 异步上报）
 *   - state          当前布局（reactive）
 *   - reset()        清空已放置的 widget
 */
import { reactive } from "vue";
import { getConfig } from "@repo/config";
import { getLayout, saveLayout } from "@repo/core";
import { getLayoutCache, setLayoutCache } from "@repo/utils";
import type { UserLayoutData } from "@repo/core";
import type { HomeLayoutState, GridPosition, WidgetItem, WidgetType } from "./types";

interface PersistedLayout {
  widgets?: unknown;
  grid?: unknown;
}

function isWidgetType(v: unknown): v is WidgetType {
  return (
    v === "stats" ||
    v === "welcome-extra" ||
    v === "weather" ||
    v === "todo" ||
    v === "announcement" ||
    v === "system-info" ||
    v === "chart" ||
    v === "calendar" ||
    v === "note" ||
    v === "custom"
  );
}

function isWidgetItem(v: unknown): v is WidgetItem {
  if (!v || typeof v !== "object") return false;
  const o = v as { id?: unknown; type?: unknown; title?: unknown };
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.type === "string" &&
    isWidgetType(o.type)
  );
}

function isGridPosition(v: unknown): v is GridPosition {
  if (!v || typeof v !== "object") return false;
  const o = v as { i?: unknown; x?: unknown; y?: unknown; w?: unknown; h?: unknown };
  return (
    typeof o.i === "string" &&
    typeof o.x === "number" &&
    typeof o.y === "number" &&
    typeof o.w === "number" &&
    typeof o.h === "number"
  );
}

/** 解析本地存储 / API 返回的布局，确保 widgets 与 grid 一一对应 */
function normalize(raw: unknown): HomeLayoutState {
  const parsed = (raw && typeof raw === "object" ? raw : {}) as PersistedLayout;
  const widgets: WidgetItem[] = Array.isArray(parsed.widgets)
    ? (parsed.widgets.filter(isWidgetItem) as WidgetItem[])
    : [];
  const grid: GridPosition[] = Array.isArray(parsed.grid)
    ? (parsed.grid.filter(isGridPosition) as GridPosition[])
    : [];
  const gridById = new Map<string, GridPosition>();
  grid.forEach((g) => gridById.set(g.i, g));
  const alignedGrid: GridPosition[] = widgets.map((w: WidgetItem, idx: number) => {
    const g = gridById.get(w.id);
    return g ? { ...g, i: w.id } : { i: w.id, x: 0, y: idx, w: 4, h: 3 };
  });
  return { widgets, grid: alignedGrid };
}

/** 把后端 UserLayoutData 解析为内部状态 */
function fromUserLayout(data: UserLayoutData | null | undefined): HomeLayoutState {
  if (!data) return { widgets: [], grid: [] };
  if (typeof data.layout === "string" && data.layout.trim()) {
    try {
      return normalize(JSON.parse(data.layout));
    } catch {
      /* fallthrough */
    }
  }
  if (typeof data.grid === "string" && data.grid.trim()) {
    try {
      const positions = JSON.parse(data.grid) as unknown;
      if (Array.isArray(positions)) {
        const grid = positions.filter(isGridPosition);
        const widgets = grid.map<WidgetItem>((g) => ({
          id: g.i,
          type: "calendar",
          title: g.i,
        }));
        return { widgets, grid };
      }
    } catch {
      /* fallthrough */
    }
  }
  return { widgets: [], grid: [] };
}

/** 是否有启用远程布局同步 */
function isRemote(): boolean {
  return getConfig()?.layout?.source === "remote";
}

/**
 * 主页布局 hook
 */
export function useHomeLayout() {
  const state = reactive<HomeLayoutState>({ widgets: [], grid: [] });

  async function load(): Promise<HomeLayoutState> {
    const cached = getLayoutCache();
    if (cached) {
      const parsed = normalize(cached);
      state.widgets = parsed.widgets;
      state.grid = parsed.grid;
      return state;
    }

    if (isRemote()) {
      try {
        const res = await getLayout();
        const parsed = fromUserLayout(res?.data);
        state.widgets = parsed.widgets;
        state.grid = parsed.grid;
        return state;
      } catch {
        state.widgets = [];
        state.grid = [];
        return state;
      }
    }

    state.widgets = [];
    state.grid = [];
    return state;
  }

  function save(next: HomeLayoutState): void {
    state.widgets = next.widgets.map((w) => ({ ...w }));
    state.grid = next.grid.map((g) => ({ ...g }));

    const snapshot: HomeLayoutState = {
      widgets: state.widgets.map((w) => ({ ...w })),
      grid: state.grid.map((g) => ({ ...g })),
    };

    // 1. 本地 storage 立即写入（最快可用）
    try {
      setLayoutCache(snapshot as never);
    } catch {
      /* ignore */
    }

    // 2. 远程异步上报（不阻塞 UI，失败仅 warn）
    if (isRemote()) {
      const payload: UserLayoutData = {
        component: "home",
        layout: JSON.stringify(snapshot),
      };
      saveLayout(payload)
        .then(() => {
          /* saveLayout 内部已写回缓存 */
        })
        .catch((err: unknown) => {
          console.warn("[home-layout] async report failed", err);
        });
    }
  }

  function reset(): void {
    state.widgets = [];
    state.grid = [];
    try {
      setLayoutCache({ widgets: [], grid: [] } as never);
    } catch {
      /* ignore */
    }
  }

  return { state, load, save, reset };
}

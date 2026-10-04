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
import { getLayout, saveLayout, toLayoutCacheShape } from "@repo/core";
import { getLayoutCache, writeLayoutCache } from "@repo/utils";
import type { UserLayoutData } from "@repo/core";
import type { HomeLayoutState, GridPosition, WidgetItem } from "./types";
import { isWidgetRegistered } from "./registry";
import { log } from "@repo/utils";

interface PersistedLayout {
  widgets?: unknown;
  grid?: unknown;
}

/**
 * 存档条目的结构校验（**刻意不查注册表**）。
 *
 * <p>这是「模块缺席时保留占位卡片」得以成立的关键：只要条目结构完整就保留，
 * 哪怕当前 app 没注册这个 type。渲染层（{@code useWidgetLoader}）会把未注册的 type
 * 渲染成占位卡片，并显示 {@code WidgetItem.source} 里记的模块名。</p>
 *
 * <p>反过来，早期版本在这里用 {@code isWidgetType} 查白名单，未注册即丢弃 ——
 * 那意味着「在 A app 摆的模块 widget，切到没启用该模块的 B app 就凭空消失、
 * 位置也丢了」。丢弃只对<b>结构损坏</b>的条目才是对的。</p>
 */
function isWidgetItem(v: unknown): v is WidgetItem {
  if (!v || typeof v !== "object") return false;
  const o = v as { id?: unknown; type?: unknown; title?: unknown };
  return (
    typeof o.id === "string" &&
    o.id.trim() !== "" &&
    typeof o.type === "string" &&
    o.type.trim() !== "" &&
    typeof o.title === "string"
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
  const rawWidgets: unknown[] = Array.isArray(parsed.widgets) ? parsed.widgets : [];

  // ① 结构损坏的条目无法渲染，只能丢弃 —— 必须留痕，
  //    否则用户会看到「布局里的东西凭空少了」却查不到原因。
  const widgets: WidgetItem[] = rawWidgets.filter(isWidgetItem) as WidgetItem[];
  if (widgets.length !== rawWidgets.length) {
    log.warn(
      `[home-layout] 丢弃 ${rawWidgets.length - widgets.length} 个结构损坏的 widget` +
        `（缺少 id / type / title）`,
    );
  }

  // ② 结构完好但当前 app 未注册的条目：**保留**，由渲染层显示占位卡片。
  //    这里只做留痕，便于回答「为什么我的卡片变成占位了」。
  const unregistered = widgets.filter((w) => !isWidgetRegistered(w.type));
  if (unregistered.length > 0) {
    const detail = unregistered
      .map((w) => `${w.title}(${w.source ?? "来源未记录"})`)
      .join("、");
    log.info(
      `[home-layout] ${unregistered.length} 个 widget 所属模块未在当前应用启用，` +
        `已显示为占位卡片：${detail}`,
    );
  }

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
  // 复用 @repo/core 的 toLayoutCacheShape 解析 layout JSON（与 getLayout/saveLayout 写回缓存同一逻辑）
  const shape = toLayoutCacheShape(data);
  if (shape) {
    return normalize(shape);
  }
  /**
   * 仅剩 grid 的历史格式：**没有 widget 类型信息，无法还原成可用布局**。
   *
   * <p>此前这里给每个格子硬编码 `type: "calendar"`，于是用户的旧布局会渲染成一排
   * 一模一样的日历 —— 既不是他存的东西，也不是能用的东西，且无从追溯。
   * 现在改为整体丢弃并留日志：仪表板变成空的、可以重新摆，比渲染错误内容更诚实。</p>
   */
  if (typeof data.grid === "string" && data.grid.trim()) {
    log.warn(
      "[home-layout] 远端布局只有 grid、缺少 widgets（无类型信息，无法还原），已忽略；" +
        "请重新添加组件",
    );
  }
  return { widgets: [], grid: [] };
}

/** 布局保存是否启用 */
function isEnabled(): boolean {
  return getConfig()?.layout?.enable !== false;
}

/** 是否有启用远程布局同步 */
function isRemote(): boolean {
  return isEnabled() && getConfig()?.layout?.source === "remote";
}

/**
 * 把布局写进本地缓存，并**回读校验**。
 *
 * <p>{@code setLayoutCache} 内部是 {@code catch { /* ignore *\/ }} —— 写失败
 * （localStorage 配额满 / 被浏览器禁用 / 隐私模式）既不抛也不回报。于是本页外面
 * 又套了一层 {@code try catch}，结果是<b>双重静默</b>：布局根本没落盘，界面照样
 * 弹「布局已保存」，用户下次进来布局全无，且没有任何线索可查。</p>
 *
 * <p>这里在写完立刻回读比对，把「写失败」变成一条可诊断的告警。比对只取
 * widget / grid 的条目数与 id 序列 —— 足以证明这次写入落没落盘，又不必深比较
 * 整个对象（配置字段多且会变，深比较的失败原因不可读）。</p>
 *
 * @param snapshot 要落盘的布局
 * @param reason 调用来源，仅用于日志定位
 * @returns 是否确认落盘成功
 */
function persistLocal(snapshot: HomeLayoutState, reason: string): boolean {
  // 这里必须直接用底层 storage 的 set()，不能用 setLayoutCache()：
  // setLayoutCache 的签名是 void，内部 `catch { /* ignore */ }` 把 set() 的
  // boolean 丢掉了，调用方无从得知写没写成。StorageWrapper.set() 本身已经
  // try/catch 并在失败时返回 false，正是这里需要的信号。
  const written = writeLayoutCache(snapshot);
  if (!written) {
    log.warn(
      `[home-layout] ${reason}：布局**未落盘**（localStorage 写入失败）。` +
        `常见原因：配额已满、浏览器禁用了本地存储、隐私模式。` +
        `当前布局仍在内存中可用，但刷新后会丢失。` +
        `若为 remote 模式，远端上报不受影响。`,
    );
    return false;
  }

  const back = getLayoutCache() as HomeLayoutState | null;
  const wantIds = snapshot.grid.map((g) => g.i).join(",");
  const gotIds = (back?.grid ?? []).map((g) => g.i).join(",");
  const sameWidgets = (back?.widgets?.length ?? -1) === snapshot.widgets.length;
  if (!back || gotIds !== wantIds || !sameWidgets) {
    log.warn(
      `[home-layout] ${reason}：布局**未成功落盘**（写完回读不一致）。` +
        `期望 ${snapshot.widgets.length} 个 widget / [${wantIds}]，` +
        `实际 ${back?.widgets?.length ?? "无"} 个 / [${gotIds || "空"}]。` +
        `常见原因：localStorage 配额已满、浏览器禁用了本地存储、隐私模式。` +
        `若为 remote 模式，远端上报仍会生效，重新进入页面后可恢复。`,
    );
    return false;
  }
  return true;
}

/**
 * 主页布局 hook
 */
export function useHomeLayout() {
  const state = reactive<HomeLayoutState>({ widgets: [], grid: [] });

  async function load(): Promise<HomeLayoutState> {
    // 布局保存被禁用时，不读缓存，始终返回空布局
    if (!isEnabled()) {
      state.widgets = [];
      state.grid = [];
      return state;
    }

    const cached = getLayoutCache();
    if (cached) {
      // 兼容两种缓存形状：
      //   1) 内部形状 { widgets, grid }（save() 本地写入）
      //   2) 后端 UserLayoutData { layout: "..." }（旧版本 / getLayout、saveLayout 直接写回）
      const parsed =
        typeof (cached as { layout?: unknown }).layout === "string"
          ? fromUserLayout(cached as UserLayoutData)
          : normalize(cached);
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
      } catch (err) {
        // 拉取失败此前是完全静默的：用户看到空仪表板，却不知道是「本来就没有」
        // 还是「拉取炸了」。留痕才能回答这个问题。
        log.warn(
          "[home-layout] 远端布局拉取失败，已降级为空布局（本地也没有缓存可回退）",
          err,
        );
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

    // 布局保存被禁用时，仅更新内存状态，不落盘
    if (!isEnabled()) return;

    const snapshot: HomeLayoutState = {
      widgets: state.widgets.map((w) => ({ ...w })),
      grid: state.grid.map((g) => ({ ...g })),
    };

    // 1. 本地 storage 立即写入（最快可用）。写失败会被回读校验捕获并告警，
    //    不再像原先那样内外两层 catch 一起把错误吃掉。
    persistLocal(snapshot, "保存布局");

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
          log.warn(`[home-layout] async report failed`, err);
        });
    }
  }

  function reset(): void {
    state.widgets = [];
    state.grid = [];
    if (!isEnabled()) return;
    persistLocal({ widgets: [], grid: [] }, "清空布局");
  }

  return { state, load, save, reset };
}

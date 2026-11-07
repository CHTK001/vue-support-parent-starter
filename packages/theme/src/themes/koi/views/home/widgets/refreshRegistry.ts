/**
 * Widget 刷新订阅注册表（主线程）
 *
 * 每个 widget 在 mounted 时向自己的 type 注册一个 `refresh()` 回调；tick 到达时
 * 按 type 的刷新频率决定是否调用（`REFRESH_INTERVALS` 未设的频率 = 不自动刷新，
 * 交给 widget 自己或用户手动触发）。
 *
 * 注册表是模块级的，因为 widget 组件实例是动态加载的：点击“添加”（如
 * `home/index.vue` 的 `addWidget`）时才创建实例，无需在页面创建时就持有引用。
 */

/**
 * 各 widget type 的刷新频率（ms）。
 *
 * <p>0 / 未设置 = 不自动刷新。widget 签收了 tick 但频率未到，由主线程的职责
 * （{@link refreshTick}）滤过，不会调用 `refresh()`。</p>
 */
export const REFRESH_INTERVALS: Record<string, number> = {
  /** 天气预报：10 min，与 widget 内约定的轮询周期一致 */
  weather: 600_000,
  /** 贵金属行情：1 min，补 full 四档牌价 */
  metals: 60_000,
};

/** 各 type 的非活跃 subscribe：同 type 可注册多次（多实例） */
const subscribers = new Map<string, Set<() => void>>();

/** 各 type 上次被调用的 tick 时间戳 */
const lastTick: Record<string, number> = {};

/**
 * 注册一个 widget 刷新回调（回调必须稳定，否则 {@link unregisterRefresh} 匹配不到）。
 */
export function subscribeRefresh(type: string, fn: () => void): void {
  let set = subscribers.get(type);
  if (!set) {
    set = new Set();
    subscribers.set(type, set);
  }
  set.add(fn);
}

/**
 * 注销与 {@link subscribeRefresh} 同 type 同回调的注册（避免滚动时重复拉取）。
 */
export function unregisterRefresh(type: string, fn: () => void): void {
  const set = subscribers.get(type);
  set?.delete(fn);
}

/**
 * 收到 tick 后的派发自调用：仅调用上次 tick 之后到期的 type。
 *
 * <p>这样 widget 暴露一个 `refresh()` 后，页面不必引用它——tick 频率分钟级、
 * 用户操作集中在编辑期，逻辑不会卡在任何页面上。</p>
 */
export function refreshTick(): void {
  const now = Date.now();
  for (const [type, set] of subscribers) {
    const waited = now - (lastTick[type] ?? 0);
    const interval = REFRESH_INTERVALS[type] ?? 0;
    if (interval <= 0 || waited < interval) continue;
    lastTick[type] = now;
    set.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        // 单个 widget 拉取失败不能影响别的 widget
        console.warn(`[refresh] ${type} refresh() 失败`, e);
      }
    });
  }
}

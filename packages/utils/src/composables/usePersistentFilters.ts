import { reactive, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDebounceFn } from "@vueuse/core";
import { createPersist } from "../persist";

/**
 * usePersistentFilters —— 列表筛选条件的持久化 composable。
 *
 * <p>解决三类一致的老问题：</p>
 * <ul>
 *   <li>切走再切回来，筛选条件全丢（localStorage 记忆）；</li>
 *   <li>把带筛选的列表链接发给别人，对方看到的是默认视图（路由 query 同步）；</li>
 *   <li>浏览器前进/后退时筛选状态不跟路由走（监听 route.query 回填）。</li>
 * </ul>
 *
 * <p>口径：整个筛选对象进 localStorage（`koi:filters:` 命名空间，隐私模式静默降级）；
 * 只有 {@link PersistentFiltersOptions.queryKeys} 点名的标量字段同步到路由 query
 * （替换式写入，不产生历史记录；等于默认值时从 query 里摘掉，保持 URL 干净）。
 * 复杂值（数组/对象）只进 localStorage，不上 URL。</p>
 *
 * <p>用法：</p>
 * <pre>
 * const { filters, reset } = usePersistentFilters({
 *   key: "alarms",
 *   defaults: { keyword: "", level: "", page: 1 },
 *   queryKeys: ["keyword", "level"],
 * });
 * </pre>
 *
 * <p>字段类型按 defaults 推断：query 回填时数字字段转数字、布尔字段转布尔，
 * 其余按字符串收；非法值（NaN / 空串）不覆盖当前值。</p>
 *
 * @author CH
 * @since 4.0.0.53
 */

/** usePersistentFilters 选项 */
export interface PersistentFiltersOptions<T extends object> {
  /** localStorage 键（组件间必须唯一，建议用页面名，如 "alarms" / "tunnel.agents"） */
  key: string;
  /** 默认筛选值：同时决定字段类型与「可从 URL 摘除」的基准 */
  defaults: T;
  /** 需要同步到路由 query 的标量字段；缺省只做 localStorage 记忆，不动 URL */
  queryKeys?: Array<keyof T & string>;
  /** 路由 query 同步防抖（毫秒），默认 300；搜索框逐字输入时避免高频 replace */
  queryDebounceMs?: number;
}

/**
 * 创建一个持久化 + 可选 URL 同步的筛选状态。
 *
 * @param options 选项
 * @returns filters 响应式筛选对象（直接 v-model / 赋值使用）；reset 恢复默认值
 */
export function usePersistentFilters<T extends object>(options: PersistentFiltersOptions<T>) {
  const persist = createPersist("koi:filters:");
  const route = useRoute();
  const router = useRouter();
  /** 无路由上下文（组件被宿主直接挂载）时退化为仅 localStorage 记忆 */
  const hasRouter = !!route && !!router;

  /** 初值：默认值打底，localStorage 里存过的覆盖（旧数据多字段/少字段都安全） */
  const filters = reactive<T>({ ...options.defaults, ...persist.get<Partial<T>>(options.key) });

  /** 把单个 query 值按默认值字段的类型收敛后写回（非法值不动） */
  function assignFromQuery(field: keyof T & string, raw: unknown): void {
    if (typeof raw !== "string" || raw === "") return;
    const target = filters as Record<string, unknown>;
    const fallback = options.defaults[field];
    if (typeof fallback === "number") {
      const n = Number(raw);
      if (Number.isFinite(n)) target[field] = n;
    } else if (typeof fallback === "boolean") {
      target[field] = raw === "true";
    } else {
      target[field] = raw;
    }
  }

  /** queryKeys 里等于默认值/空值的字段从 URL 摘掉，其余转字符串写入 */
  function syncQuery(): void {
    const keys = options.queryKeys;
    if (!keys?.length || !hasRouter) return;
    const query: Record<string, string> = {};
    for (const [k, v] of Object.entries(route.query)) {
      if (typeof v === "string") query[k] = v;
    }
    let changed = false;
    for (const field of keys) {
      const value = (filters as Record<string, unknown>)[field];
      const isDefault = value === options.defaults[field] || value === "" || value == null;
      if (isDefault) {
        if (field in query) {
          delete query[field];
          changed = true;
        }
      } else {
        const text = String(value);
        if (query[field] !== text) {
          query[field] = text;
          changed = true;
        }
      }
    }
    if (changed) router!.replace({ query }).catch(() => {});
  }

  const syncQueryDebounced = useDebounceFn(syncQuery, options.queryDebounceMs ?? 300);

  /** 筛选变化：localStorage 立即写（persist 层合并高频写），URL 防抖同步 */
  watch(
    filters,
    () => {
      persist.set(options.key, { ...filters });
      syncQueryDebounced();
    },
    { deep: true },
  );

  /** 浏览器前进/后退/带参链接进入/首次进入：把 query 里点名的字段回填到筛选（值未变时不触发写回） */
  if (hasRouter) {
    watch(
      () => route!.query,
      q => {
        const keys = options.queryKeys;
        if (!keys?.length) return;
        for (const field of keys) {
          if (field in q) assignFromQuery(field, q[field]);
        }
      },
      { immediate: true },
    );
  }

  /** 恢复默认值（localStorage 与 URL 随 watch 自动收敛） */
  function reset(): void {
    Object.assign(filters, options.defaults);
  }

  return { filters, reset };
}

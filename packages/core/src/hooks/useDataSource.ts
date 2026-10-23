/**
 * useDataSource —— 动态数据源（@repo/core）
 *
 * 支持三种来源：
 *  - 静态值 / 数组：原样返回
 *  - url 字符串：用 getApiHttp 拉取（走加密/签名/重试拦截器，支持相对路径），兼容 { data } / { data: { records } } / 数组 等常见结构
 *  - 函数：调用函数（可返回 Promise），得到数据
 *
 * 用法：
 *   const { loading, data, reload } = useDataSource<IOption[]>(() => props.data);
 */
import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from "vue";
import { getApiHttp } from "../api";
import { yieldToMain } from "@repo/utils";

/** 数据源：静态值 | url | 函数 */
export type ReDataSource<T = unknown> =
  | T
  | T[]
  | string
  | (() => T | T[] | Promise<T | T[]>);

/** 从任意响应结构中提取数据数组 */
function extract<T = unknown>(payload: unknown): T {
  // 已经是数组
  if (Array.isArray(payload)) return payload as T;
  if (payload == null) return payload as T;
  if (typeof payload !== "object") return payload as T;
  const obj = payload as Record<string, unknown>;
  // 常见后端包裹结构
  if (typeof obj.data === "object" && obj.data !== null) {
    const inner = obj.data as Record<string, unknown>;
    // { data: { records: [...] } } （分页结构）
    if (Array.isArray(inner.records)) return inner.records as T;
    // { data: { rows / list / items } }
    for (const key of ["rows", "list", "items", "content"]) {
      if (Array.isArray(inner[key])) return inner[key] as T;
    }
    // { data: [...] } 或 { data: {...} }
    return obj.data as T;
  }
  // { records: [...] } 分页
  if (Array.isArray(obj.records)) return obj.records as T;
  for (const key of ["rows", "list", "items", "content"]) {
    if (Array.isArray(obj[key])) return obj[key] as T;
  }
  return payload as T;
}

/** 通过 url 拉取数据（统一走 getApiHttp：加密/签名/重试拦截器 + baseURL 解析） */
async function fetchByUrl<T = unknown>(url: string): Promise<T> {
  const res = await getApiHttp().get(url);
  return extract<T>(res.data);
}

/**
 * 通用动态数据加载
 * @param source 数据源（静态 / url / 函数），可传入 Ref
 */
export function useDataSource<T = unknown>(source: Ref<ReDataSource<T>> | ReDataSource<T>) {
  const loading = ref(false);
  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<Error | undefined>(undefined);

  /**
   * 请求序号：只有**最新一次** resolve 的结果允许落地。
   *
   * <p>不加守卫时的竞态：快速翻页会并发多个请求，先发的可能后到，
   * 它的结果落地就把新页数据覆盖成旧页（用户看到「点第 3 页却显示第 1 页的行」）。
   * 同一个守卫也要管住 {@code loading} —— 否则过期请求的 finally 会把
   * 新请求正在转的 loading 提前关掉。</p>
   */
  let seq = 0;

  const resolve = async (src: ReDataSource<T>): Promise<void> => {
    const mine = ++seq;
    loading.value = true;
    error.value = undefined;
    try {
      let next: T;
      if (typeof src === "function") {
        next = (await (src as () => T | Promise<T>)()) as T;
      } else if (typeof src === "string") {
        next = await fetchByUrl<T>(src);
      } else {
        next = src as T;
      }
      // 过期响应：直接丢弃，不碰 data / error / loading
      if (mine !== seq) return;
      // 让出一帧再落地数据：
      // 网络响应回来时，浏览器往往还压着上一批数据的渲染与派生计算（表格行格式化、
      // 选中态恢复、列状态序列化等）。此刻直接 data.value = next 会把这些同步工作
      // 叠在同一个任务里，形成一个长任务 —— 期间页面不出帧、按钮的 loading 动画
      // 看起来像「冻住」，用户感知就是「刷新卡死」。
      // 先让一帧，等浏览器把当前这批动画画出去，再提交新数据，两者就不会挤在一起。
      await yieldToMain();
      // 让帧期间又发起了新请求 → 本次结果已过期，丢弃
      if (mine !== seq) return;
      data.value = next;
    } catch (e) {
      if (mine !== seq) return;
      error.value = e instanceof Error ? e : new Error(String(e));
      data.value = null;
    } finally {
      if (mine === seq) loading.value = false;
    }
  };

  const reload = async (): Promise<void> => {
    const src = (source as Ref<ReDataSource<T>>).value ?? (source as ReDataSource<T>);
    await resolve(src);
  };

  watch(
    () => (typeof source === "function" ? source : (source as Ref<ReDataSource<T>>).value),
    async (val) => {
      await resolve(val);
    },
    { immediate: true },
  );

  /* 作用域销毁（组件卸载 / effect 停止）时让在飞的请求全部作废：
     否则卸载后仍有 promise 持有闭包并在稍后写 ref，白占内存也可能在
     keep-alive 复用时把旧数据写进新实例。 */
  if (getCurrentScope()) {
    onScopeDispose(() => {
      seq++;
    });
  }

  return { loading, data, error, reload };
}

/**
 * useDataSource —— 动态数据源（@repo/core）
 *
 * 支持三种来源：
 *  - 静态值 / 数组：原样返回
 *  - url 字符串：用 fetch 拉取，兼容 { data } / { data: { records } } / 数组 等常见结构
 *  - 函数：调用函数（可返回 Promise），得到数据
 *
 * 用法：
 *   const { loading, data, reload } = useDataSource<IOption[]>(() => props.data);
 */
import { ref, watch, type Ref } from "vue";

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

/** 通过 url 拉取数据 */
async function fetchByUrl<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`数据请求失败: ${url} (${res.status})`);
  }
  const json = (await res.json()) as unknown;
  return extract<T>(json);
}

/**
 * 通用动态数据加载
 * @param source 数据源（静态 / url / 函数），可传入 Ref
 */
export function useDataSource<T = unknown>(source: Ref<ReDataSource<T>> | ReDataSource<T>) {
  const loading = ref(false);
  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<Error | undefined>(undefined);

  const resolve = async (src: ReDataSource<T>): Promise<void> => {
    loading.value = true;
    error.value = undefined;
    try {
      if (typeof src === "function") {
        data.value = (await (src as () => T | Promise<T>)()) as T;
      } else if (typeof src === "string" && src.trim().startsWith("http")) {
        data.value = await fetchByUrl<T>(src);
      } else {
        data.value = src as T;
      }
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      data.value = null;
    } finally {
      loading.value = false;
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

  return { loading, data, error, reload };
}

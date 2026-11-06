/**
 * ReLoader 请求层联动。
 *
 * <p>目标：业务代码写 {@code api.get('/x', { loader: true })} 就自动出现加载态，
 * 不必在每个页面手写 {@code loading.value = true/false}（那是最容易漏掉
 * finally 的地方，漏了就一直转圈）。</p>
 *
 * <p>三个关键设计：</p>
 * <ul>
 *   <li><b>单例合并</b>：并发多个请求只显示一个遮罩，靠引用计数在最后一个结束时关闭。
 *       否则 3 个请求会让遮罩闪 3 次，观感很差。</li>
 *   <li><b>延迟显示</b>：默认 200ms。绝大多数请求 100ms 内返回，不闪才是对的。</li>
 *   <li><b>失败也要关</b>：用 finally 保证异常路径同样收尾，并交给 {@code onError}
 *       决定是否提示（遮罩本身不弹错误，避免与业务提示重复）。</li>
 * </ul>
 */

import { open } from "./service";
import type { ReLoaderHandle, ReLoaderServiceOptions } from "./types";

/** 请求层联动配置 */
export interface LoaderRequestOptions extends ReLoaderServiceOptions {
  /** 是否启用（便于按调用点临时关闭） */
  enabled?: boolean;
}

/** 默认配置：可通过 {@link configureLoaderRequests} 覆盖 */
let defaults: LoaderRequestOptions = {
  enabled: true,
  // 不传 variant：请求层遮罩跟随主题配置里选中的全局动画（默认三个圆点），
  // 与首屏 loader 保持一致 —— 否则首屏是圆点、请求一转圈就变回双环。
  variant: undefined,
  // 请求层多为全屏遮罩；用 lg 档，与各业务页面的全屏遮罩同尺寸
  size: "lg",
  text: "加载中…",
  delay: 200,
  minDuration: 300,
  singleton: true,
  singletonKey: "http",
  mask: true,
  fullscreen: true,
  // 请求层的遮罩默认算"路由级"：请求可能是用户离开当前页后仍未返回的，
  // 切页时应当收掉，否则遮罩会盖在新页面上（详见 router.ts 的事故说明）
  routerScoped: true,
};

/**
 * 覆盖默认配置（通常在应用启动时调用一次）。
 *
 * @param patch 要覆盖的字段
 */
export function configureLoaderRequests(patch: LoaderRequestOptions): void {
  defaults = { ...defaults, ...patch };
}

/** 读取当前默认配置（只读用途，如调试面板展示） */
export function loaderRequestDefaults(): Readonly<LoaderRequestOptions> {
  return defaults;
}

/**
 * 包一个异步请求：自动开/关加载态。
 *
 * <p>用法（在 axios/Http 拦截器里最自然）：</p>
 * ```ts
 * const data = await withLoader(() => http.get('/api/x'), { text: '查询中' })
 * ```
 *
 * @param task     返回 Promise 的任务
 * @param options  加载态配置（与 open 一致）
 * @returns 任务结果（原样透传）
 */
export async function withLoader<T>(
  task: () => Promise<T>,
  options: LoaderRequestOptions = {},
): Promise<T> {
  const merged: LoaderRequestOptions = { ...defaults, ...options };
  if (!merged.enabled) {
    return task();
  }

  /**
   * 实际执行的任务。
   *
   * <p>可重试时，遮罩上的「重试」按钮会重新调用它 —— 所以这里要把 task 本身
   * 交给 handle，而不是只跑一次。</p>
   */
  const run = () => task();

  let handle: ReLoaderHandle | null = null;
  try {
    handle = open({
      ...merged,
      // 可重试时，重试回调就是"再跑一次同一个任务"
      onRetry: merged.onRetry ?? (merged.retryable ? () => run() : undefined),
    });
    return await run();
  } catch (e) {
    // 遮罩不负责提示错误（业务层有自己的 toast），这里只保证收尾。
    // 可重试时**不关闭**，让遮罩切到失败态给用户重试的机会。
    if (handle) {
      if (merged.retryable) {
        handle.error(e);
      } else {
        // 单例下可能还有其他请求在用，close 只会减计数
        handle.close("error");
      }
    }
    throw e;
  } finally {
    // 成功路径收尾；失败且可重试时**保持打开**（失败态要给用户重试入口）
    if (handle && handle.visible) {
      if (!handle.failed) {
        handle.close("auto");
      }
    }
  }
}

/**
 * 给一个「请求函数」套上加载态，返回同签名的包装函数。
 *
 * <p>适合在 service 层一次性包装：</p>
 * ```ts
 * export const fetchModels = withLoaderFn((id: string) => http.get(`/models/${id}`), { text: '加载模型' })
 * ```
 *
 * @param fn      原请求函数
 * @param options 加载态配置
 * @returns 包装后的函数（参数与返回值类型保持不变）
 */
export function withLoaderFn<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  options: LoaderRequestOptions = {},
): (...args: A) => Promise<R> {
  return (...args: A) => withLoader(() => fn(...args), options);
}


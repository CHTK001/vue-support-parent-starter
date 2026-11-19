/**
 * @repo/app/wechat-miniapp —— 小程序运行时（uni API）注册表
 *
 * <p><b>为什么不让库内直接引用全局 {@code uni}：</b></p>
 * <ul>
 *   <li>{@code @repo/app} 的 tsconfig 不含 {@code @dcloudio/types}，直接写 {@code uni.xxx}
 *       会编译失败；</li>
 *   <li>在库内 {@code declare global { const uni: ... }} 又与宿主（uni-app 工程）已声明的
 *       全局 {@code uni} 冲突。</li>
 * </ul>
 *
 * <p>因此这里只声明<b>结构化最小接口</b>，由宿主在入口显式注入真实实例：
 * {@code setUniRuntime(uni)}。库内所有适配器都通过 {@code getUniRuntime()} 取用，
 * 编译期零依赖、运行期零全局引用。</p>
 */
import type { MpStorageLike } from "./types";

/**
 * uni 运行时最小接口。
 *
 * <p>方法参数/返回值刻意放宽为 {@code any}：uni 的真实签名（RequestOptions /
 * RequestSuccessCallbackResult）随 @dcloudio/types 版本变化，精确对齐会让
 * 宿主注入处产生无意义的类型摩擦，而库内只用到「调一下、拿回调」这点语义。</p>
 */
export interface UniRuntime {
  /** 同步读 storage */
  getStorageSync(key: string): any;
  /** 同步写 storage */
  setStorageSync(key: string, data: any): void;
  /** 同步删 storage */
  removeStorageSync(key: string): void;
  /** storage 概览（可选；用于按前缀清理） */
  getStorageInfoSync?(): { keys?: string[] };
  /** 发起请求 */
  request(options: any): unknown;
  /** 关闭当前所有页面并跳到指定页（可选；401 兜底用） */
  reLaunch?(options: { url: string }): void;
  /** 能力探测（可选；流式响应可用性判断） */
  canIUse?(name: string): boolean;
}

/** 运行时实例（宿主注入前为 null） */
let uniRuntime: UniRuntime | null = null;

/**
 * 注入 uni 运行时。
 *
 * <p>重复注入（热重载）以最后一次为准；通过
 * {@code createContextApp({ uni })} 传入时由入口自动调用。</p>
 *
 * @param runtime 小程序的全局 {@code uni} 对象
 */
export function setUniRuntime(runtime: UniRuntime): void {
  uniRuntime = runtime;
}

/**
 * 取 uni 运行时；未注入时抛出可读错误（而不是 `undefined is not a function`）。
 *
 * @throws 未调用 {@code setUniRuntime()} 时抛错
 */
export function getUniRuntime(): UniRuntime {
  if (!uniRuntime) {
    throw new Error(
      "[@repo/app/wechat-miniapp] 未注入 uni 运行时：请在入口先调用 setUniRuntime(uni)，再创建应用",
    );
  }
  return uniRuntime;
}

/** 用 uni storage 组装 {@link MpStorageLike}（供 createMpStorage 缺省使用） */
export function createUniStorageLike(): MpStorageLike {
  return {
    getItem(key: string): string | null {
      try {
        const value = getUniRuntime().getStorageSync(key);
        return value === "" || value === undefined || value === null ? null : String(value);
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      getUniRuntime().setStorageSync(key, value);
    },
    removeItem(key: string): void {
      try {
        getUniRuntime().removeStorageSync(key);
      } catch {
        // key 不存在时忽略
      }
    },
    clear(): void {
      const runtime = getUniRuntime();
      const info = runtime.getStorageInfoSync?.();
      const keys = Array.isArray(info?.keys) ? info!.keys! : [];
      for (const key of keys) {
        try {
          runtime.removeStorageSync(key);
        } catch {
          // 单个失败不影响其余
        }
      }
    },
  };
}

/**
 * Koi 布局包统一的运行时配置解析助手
 *
 * 设计目标：
 *   1. 把 @repo/config 的 getConfig() + 本地 settings 合并为统一的优先级解析函数
 *   2. 避免在每个组件里重复写 `config.X ?? settings.Y`
 *   3. 类型安全（支持 boolean/number/string 各种字段的 fallback）
 *
 * 优先级：
 *   getConfig() (运行时，来自 app.yaml + 后端 setting 合并)  →
 *   settings   (本地静态默认) →
 *   fallback   (调用方传入的兜底值)
 *
 * 使用示例：
 *   import { useKoiConfig } from "@layout/koi/utils/useKoiConfig";
 *   const { cfgBool, cfgNumber, cfgString } = useKoiConfig();
 *   const showLogo = cfgBool("logoShow", settings.logoShow, true);
 */

import { reactive, type App, type ComputedRef, computed } from "vue";
import { getConfig } from "@repo/config";
import settings from "../settings";

export type KoiConfigValue = string | number | boolean | undefined | null;

export interface KoiConfigSnapshot {
  /** 当前原始配置快照（来自 getConfig()） */
  raw: Record<string, any>;
  /** 当前本地默认快照（来自 settings） */
  defaults: Record<string, any>;
  /** 解析一个布尔字段：getConfig > settings > fallback */
  cfgBool(key: string, fallback?: boolean): boolean;
  /** 解析一个数字字段：getConfig > settings > fallback */
  cfgNumber(key: string, fallback?: number): number;
  /** 解析一个字符串字段：getConfig > settings > fallback */
  cfgString(key: string, fallback?: string): string;
  /** 解析通用字段：getConfig > settings > fallback */
  cfgAny<T = any>(key: string, fallback?: T): T | undefined;
}

/**
 * 取一次配置快照（适用于组件 init 时一次性解析）。
 * - 如果配置可能在运行时更新，请使用 useKoiConfigReactive() 拿到 ComputedRef。
 */
export function useKoiConfig(): KoiConfigSnapshot {
  const raw = (getConfig() || {}) as Record<string, any>;
  const defaults = (settings || {}) as unknown as Record<string, any>;

  const lookup = (key: string): KoiConfigValue => {
    if (Object.prototype.hasOwnProperty.call(raw, key) && raw[key] !== undefined) {
      return raw[key];
    }
    if (Object.prototype.hasOwnProperty.call(defaults, key) && defaults[key] !== undefined) {
      return defaults[key] as KoiConfigValue;
    }
    return undefined;
  };

  return {
    raw,
    defaults,
    cfgBool(key: string, fallback = true): boolean {
      const v = lookup(key);
      if (typeof v === "boolean") return v;
      if (v === undefined) return fallback;
      // 兼容 "true"/"false" 字符串
      if (typeof v === "string") {
        const lower = v.toLowerCase();
        if (lower === "true") return true;
        if (lower === "false") return false;
      }
      return fallback;
    },
    cfgNumber(key: string, fallback = 0): number {
      const v = lookup(key);
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      if (typeof v === "string") {
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
      }
      return fallback;
    },
    cfgString(key: string, fallback = ""): string {
      const v = lookup(key);
      if (typeof v === "string") return v;
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      return fallback;
    },
    cfgAny<T = any>(key: string, fallback?: T): T | undefined {
      const v = lookup(key);
      if (v === undefined || v === null) return fallback;
      return v as T;
    },
  };
}

/**
 * 响应式版本：getConfig() 可能在运行时变化（远程 setting 合并），
 * 暴露 ComputedRef 让组件自动跟随配置变化。
 */
export function useKoiConfigReactive() {
  const snapshot = reactive(useKoiConfig()) as KoiConfigSnapshot & {
    raw: Record<string, any>;
  };

  // 监听 getConfig 变化（@repo/config 内部使用 reactive 装载配置）
  // 仅在浏览器环境运行 setInterval，避免 vite SSR 解析阶段触发 timer
  if (typeof window !== "undefined") {
    let lastRaw = snapshot.raw;
    setInterval(() => {
      const newRaw = (getConfig() || {}) as Record<string, any>;
      if (newRaw !== lastRaw) {
        lastRaw = newRaw;
        snapshot.raw = newRaw;
      }
    }, 1000);
  }

  const cfgBool = (key: string, fallback = true) =>
    computed(() => snapshot.cfgBool(key, fallback));
  const cfgNumber = (key: string, fallback = 0) =>
    computed(() => snapshot.cfgNumber(key, fallback));
  const cfgString = (key: string, fallback = "") =>
    computed(() => snapshot.cfgString(key, fallback));
  const cfgAny = <T = any>(key: string, fallback?: T) =>
    computed(() => snapshot.cfgAny<T>(key, fallback));

  return {
    raw: computed(() => snapshot.raw),
    defaults: computed(() => snapshot.defaults),
    snapshot,
    cfgBool,
    cfgNumber,
    cfgString,
    cfgAny,
  } as {
    raw: ComputedRef<Record<string, any>>;
    defaults: ComputedRef<Record<string, any>>;
    snapshot: typeof snapshot;
    cfgBool: (key: string, fallback?: boolean) => ComputedRef<boolean>;
    cfgNumber: (key: string, fallback?: number) => ComputedRef<number>;
    cfgString: (key: string, fallback?: string) => ComputedRef<string>;
    cfgAny: <T = any>(key: string, fallback?: T) => ComputedRef<T | undefined>;
  };
}

/**
 * Vue Plugin 形态：useKoiConfigHelper()，挂载到 app 时调用一次即可，
 * 把 __koiConfig 暴露到全局属性，所有组件可通过 $koiConfig 访问。
 */
export const KoiConfigHelperPlugin = {
  install(app: App) {
    const snapshot = useKoiConfig();
    app.config.globalProperties.$koiConfig = snapshot;
  },
};

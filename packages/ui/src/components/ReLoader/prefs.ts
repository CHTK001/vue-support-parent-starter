/**
 * 加载动画的「观感偏好」：尺寸两档、速度倍率、是否跟随主题主色。
 *
 * <p>为什么单开一个文件而不是塞进 animations.ts：animations.ts 是动画结构与样式的
 * 唯一定义处，必须与 {@code public/loader.js} 逐字对应；这里只是「数值偏好」的读写与
 * 合并规则，和动画长什么样无关。混在一起会让那个文件的字节比对越来越脆弱。</p>
 *
 * <p>优先级（三处一致：首屏 loader / ReLoader / 主题配置预览）：</p>
 * <ol>
 *   <li><b>部署侧</b>{@code app.yaml other.loaderConfig}（{@code enable: true} 时整片锁定）；</li>
 *   <li><b>用户偏好</b> localStorage {@code sys-loader-prefs}（主题配置里可调）；</li>
 *   <li><b>内置默认</b> 96 / 1 倍 / 不跟随主色。</li>
 * </ol>
 *
 * <p>首屏 {@code public/loader.js} 不能 import 本模块，那边读同一个 localStorage 键，
 * 键名与默认值由 {@code test/vue/loader-anim/verify.mjs} 逐字比对。</p>
 */
import { computed, ref, type ComputedRef, type Ref } from "vue";
import { resolveLoaderDeployPolicy, type LoaderDeployPolicy } from "@repo/config";

/** 用户偏好键（与 public/loader.js 的 LOADER_PREFS_KEY 一致） */
export const LOADER_PREFS_KEY = "sys-loader-prefs";

/** 窄屏断点（与 loader.js 的 media query 一致） */
export const LOADER_WIDTH_BREAKPOINT = 768;

/** 尺寸上下限（px） */
export const LOADER_SIZE_MIN = 8;
export const LOADER_SIZE_MAX = 512;

/** 速度倍率上下限（1 = 原速） */
export const LOADER_SPEED_MIN = 0.5;
export const LOADER_SPEED_MAX = 3;

/** 内置默认尺寸：与接入两档尺寸之前逐字一致（首屏 96px） */
export const LOADER_SIZE_NARROW_DEFAULT = 96;
export const LOADER_SIZE_WIDE_DEFAULT = 96;

/** 内置默认速度与主色跟随 */
export const LOADER_SPEED_DEFAULT = 1;
export const LOADER_ADAPT_COLOR_DEFAULT = false;

/** 内置主色：与动画 CSS 里 --sla-c 的兜底、部署配置默认值一致 */
export const LOADER_COLOR_DEFAULT = "#406eeb";

/** 跟随主题主色时的 CSS 取值：Element Plus 没加载时退回默认蓝 */
export const LOADER_ADAPT_COLOR_VALUE = `var(--el-color-primary,${LOADER_COLOR_DEFAULT})`;

/** 两档尺寸 */
export interface LoaderSizePrefs {
  /** 窄屏（<768px） */
  narrow: number;
  /** 宽屏（≥768px） */
  wide: number;
}

/** 用户可调的观感偏好 */
export interface LoaderPrefs {
  size: LoaderSizePrefs;
  /** 速度倍率（0.5~3，1 = 原速） */
  speed: number;
  /** 主色是否跟随主题主色（--el-color-primary） */
  adaptColor: boolean;
}

/** 最终生效的观感（部署 > 用户 > 默认，已归一化） */
export interface LoaderVisuals extends LoaderPrefs {
  /** 是否由部署侧锁定（界面据此置灰） */
  locked: boolean;
  /** 直接写入 --sla-c 的值（可能是 var(...)） */
  color: string;
}

/** 缺省偏好 */
export const LOADER_PREFS_DEFAULT: LoaderPrefs = {
  size: { narrow: LOADER_SIZE_NARROW_DEFAULT, wide: LOADER_SIZE_WIDE_DEFAULT },
  speed: LOADER_SPEED_DEFAULT,
  adaptColor: LOADER_ADAPT_COLOR_DEFAULT,
};

/** 把任意值收窄成合法尺寸（px）；非法值用兜底 */
export function normalizeLoaderSize(value: unknown, fallback = LOADER_SIZE_NARROW_DEFAULT): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(LOADER_SIZE_MAX, Math.max(LOADER_SIZE_MIN, Math.round(num)));
}

/** 把任意值收窄成合法速度倍率（0.5~3，保留两位小数） */
export function normalizeLoaderSpeed(value: unknown, fallback = LOADER_SPEED_DEFAULT): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.min(LOADER_SPEED_MAX, Math.max(LOADER_SPEED_MIN, Math.round(num * 100) / 100));
}

/** 兼容旧的单数字尺寸（size: 96 → 两档都是 96） */
function readSizeObject(raw: unknown): LoaderSizePrefs {
  if (typeof raw === "number" || typeof raw === "string") {
    const size = normalizeLoaderSize(raw);
    return { narrow: size, wide: size };
  }
  if (raw && typeof raw === "object") {
    const obj = raw as { narrow?: unknown; wide?: unknown };
    const narrow = normalizeLoaderSize(obj.narrow, LOADER_SIZE_NARROW_DEFAULT);
    const wide = normalizeLoaderSize(obj.wide, narrow);
    return { narrow, wide };
  }
  return { ...LOADER_PREFS_DEFAULT.size };
}

/** 把任意值（localStorage 里的 JSON / 配置对象）归一化成完整偏好 */
export function normalizeLoaderPrefs(raw: unknown): LoaderPrefs {
  if (!raw || typeof raw !== "object") return { ...LOADER_PREFS_DEFAULT, size: { ...LOADER_PREFS_DEFAULT.size } };
  const obj = raw as { size?: unknown; speed?: unknown; adaptColor?: unknown };
  return {
    size: readSizeObject(obj.size),
    speed: normalizeLoaderSpeed(obj.speed),
    adaptColor: obj.adaptColor === true,
  };
}

/** 当前应用的 appCode（与 animations.ts / loader.js 的探测顺序一致） */
function resolveAppCode(): string {
  if (typeof window === "undefined") return "";
  const win = window as unknown as { __SYS_APP_CODE__?: string };
  const fromWindow = typeof win.__SYS_APP_CODE__ === "string" ? win.__SYS_APP_CODE__.trim() : "";
  if (fromWindow) return fromWindow;

  const meta = document.querySelector('meta[name="sys-app-code"]')?.getAttribute("content");
  if (meta && meta.trim()) return meta.trim();

  return document.documentElement?.getAttribute("data-system-code")?.trim() ?? "";
}

/** 读取用户偏好（带 appCode 的键优先，全局键兜底；都没有就用默认） */
export function readLoaderPrefs(appCode = resolveAppCode()): LoaderPrefs {
  try {
    const scoped = appCode ? localStorage.getItem(`${LOADER_PREFS_KEY}:${appCode}`) : null;
    const raw = scoped ?? localStorage.getItem(LOADER_PREFS_KEY);
    if (!raw) return normalizeLoaderPrefs(null);
    return normalizeLoaderPrefs(JSON.parse(raw));
  } catch {
    // localStorage 被禁用 / JSON 损坏：用默认，不影响加载
    return normalizeLoaderPrefs(null);
  }
}

/** 写入用户偏好（两份都写：首屏在应用起来之前可能拿不到 appCode） */
export function writeLoaderPrefs(prefs: LoaderPrefs, appCode = resolveAppCode()): void {
  try {
    const payload = JSON.stringify(normalizeLoaderPrefs(prefs));
    localStorage.setItem(LOADER_PREFS_KEY, payload);
    if (appCode) localStorage.setItem(`${LOADER_PREFS_KEY}:${appCode}`, payload);
  } catch {
    // 写不进去不抛：本次会话内仍然生效（组件走响应式内存态）
  }
}

/** 响应式用户偏好（SSR / 构建期没有 localStorage） */
const currentPrefs: Ref<LoaderPrefs> =
  ref(typeof window === "undefined" ? normalizeLoaderPrefs(null) : readLoaderPrefs());

/** 只读的用户偏好（面板订阅它） */
export function useLoaderPrefs(): Readonly<Ref<LoaderPrefs>> {
  return currentPrefs;
}

/** 合并部署策略与用户偏好，得到最终观感（纯函数，便于单测） */
export function resolveLoaderVisuals(
  policy: Pick<LoaderDeployPolicy, "locked" | "size" | "speed" | "adaptColor" | "color">,
  prefs: LoaderPrefs,
): LoaderVisuals {
  const size = policy.locked ? readSizeObject(policy.size) : prefs.size;
  const speed = policy.locked ? normalizeLoaderSpeed(policy.speed) : normalizeLoaderSpeed(prefs.speed);
  const adaptColor = policy.locked ? policy.adaptColor === true : prefs.adaptColor === true;
  const color = adaptColor
    ? LOADER_ADAPT_COLOR_VALUE
    : policy.locked && policy.color
      ? policy.color
      : LOADER_COLOR_DEFAULT;
  return { locked: policy.locked === true, size, speed, adaptColor, color };
}

/** 当前生效的观感（部署 > 用户 > 默认）；配置更新后自动重算 */
export function useLoaderVisuals(): ComputedRef<LoaderVisuals> {
  return computed(() => {
    const policy = resolveLoaderDeployPolicy();
    return resolveLoaderVisuals(
      {
        locked: policy.locked,
        size: policy.size,
        speed: policy.speed,
        adaptColor: policy.adaptColor,
        color: policy.color,
      },
      currentPrefs.value,
    );
  });
}

/**
 * 修改用户偏好。
 *
 * <p>锁定态直接返回：部署侧接管时界面会置灰，但快捷键 / 脚本路径绕不过这一层
 * （与 {@code setLoaderAnimation} 同一口径）。</p>
 */
export function setLoaderPrefs(patch: Partial<LoaderPrefs>): void {
  if (resolveLoaderDeployPolicy().locked) return;
  const merged: LoaderPrefs = {
    size: patch.size ? readSizeObject(patch.size) : currentPrefs.value.size,
    speed: patch.speed === undefined ? currentPrefs.value.speed : normalizeLoaderSpeed(patch.speed),
    adaptColor:
      patch.adaptColor === undefined ? currentPrefs.value.adaptColor : patch.adaptColor === true,
  };
  currentPrefs.value = merged;
  writeLoaderPrefs(merged);
}

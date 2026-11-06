/**
 * 首屏加载动画的本地存储约定（部署侧接管时写、取消接管时清）。
 *
 * <p>为什么需要这一层：首屏 {@code public/loader.js} 在 {@code app.yaml} 被拉取之前
 * 就已经执行完（它是同步脚本，配置是异步请求），所以部署侧配置<b>无法同步影响当次首屏</b>。
 * 唯一改动最小的做法是「启动后把决定写进 localStorage，下次刷新首屏一致」——
 * 本模块就是那三个键与写入/清除的唯一定义处。</p>
 *
 * <p>键名必须与 {@code public/loader.js} 里的读取完全一致，否则出现
 * 「配置写了却不见生效」这类无声故障。</p>
 */
import { resolveLoaderDeployPolicy } from "./config";

/**
 * 部署侧接管的动画键（首屏优先读它，读不到才回落到用户自己的选择）。
 *
 * <p><b>不能复用</b> {@code sys-loader-style}：那个键是用户在主题配置里的选择，
 * 复用会让「打开锁定」覆盖掉用户的选择，「关掉锁定」后也回不去。</p>
 */
export const BOOT_LOADER_ANIMATION_KEY = "sys-loader-animation";

/** 用户自己选的动画键（只读，用于说明两者关系；不要往这里写部署值） */
export const BOOT_LOADER_USER_STYLE_KEY = "sys-loader-style";

/** 首屏动画基准边长（窄屏，px） */
export const BOOT_LOADER_SIZE_KEY = "sys-loader-size";

/** 首屏动画基准边长（宽屏，px；缺省时与窄屏同值） */
export const BOOT_LOADER_SIZE_WIDE_KEY = "sys-loader-size-wide";

/** 首屏动画主色 */
export const BOOT_LOADER_COLOR_KEY = "sys-loader-color";

/** 首屏动画速度倍率（1 = 原速） */
export const BOOT_LOADER_SPEED_KEY = "sys-loader-speed";

/** 首屏主色是否跟随主题主色（"true" / "false"） */
export const BOOT_LOADER_ADAPT_COLOR_KEY = "sys-loader-adapt-color";

/** 宽窄屏断点（与 loader.js 的 media query 一致） */
export const BOOT_LOADER_WIDTH_BREAKPOINT = 768;

/** 首屏尺寸内置默认值（与 loader.js 的 LOADER_SIZE_DEFAULT 一致） */
export const BOOT_LOADER_SIZE_DEFAULT = 96;

/** 首屏主色内置默认值（与动画 CSS 的 --sla-c 兜底一致） */
export const BOOT_LOADER_COLOR_DEFAULT = "#406eeb";

/** 首屏速度内置默认值 */
export const BOOT_LOADER_SPEED_DEFAULT = 1;

/** 首屏加载偏好（部署侧接管时的最终值） */
export interface BootLoaderPrefs {
  /** 动画键（历史键已折叠成现行键） */
  animation: string;
  /** 基准边长（px，已 clamp；宽窄屏两档） */
  size: { narrow: number; wide: number };
  /** 主色（已校验为安全的 CSS 颜色） */
  color: string;
  /** 速度倍率（0.5~3） */
  speed: number;
  /** 主色是否跟随主题主色 */
  adaptColor: boolean;
}

/** 浏览器环境判定（SSR / 构建期没有 localStorage） */
function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * 读取当前应用的 appCode（与 {@code loader.js} 的探测顺序逐条对应）。
 *
 * <p>必须一致：首屏脚本先用「带 appCode 的键」，没有才退回全局键。
 * 若这边只写全局键，而用户历史上选过动画（留下带后缀的键），
 * 那后缀键会赢过部署配置 —— 表现是「yaml 写了锁定却不生效」。</p>
 */
function resolveAppCode(): string {
  if (typeof window === "undefined") return "";
  const win = window as unknown as { __SYS_APP_CODE__?: string };
  const fromWindow = typeof win.__SYS_APP_CODE__ === "string" ? win.__SYS_APP_CODE__.trim() : "";
  if (fromWindow) return fromWindow;

  const meta = document.querySelector('meta[name="sys-app-code"]')?.getAttribute("content");
  if (meta && meta.trim()) return meta.trim();

  return document.documentElement?.getAttribute("data-system-code")?.trim() ?? "";
}

/**
 * 把部署侧配置落到「首屏下次刷新」用的 localStorage。
 *
 * <p>必须在 core 装配（app.yaml 已合并进 getConfig）之后调用一次：</p>
 * <ul>
 *   <li><b>锁定</b>：写入动画 / 尺寸 / 主色 —— 下次刷新的首屏与本次应用内一致；</li>
 *   <li><b>未锁定</b>：清掉部署侧那三个键，首屏回到内置默认或用户自己的选择。
 *       用户选的 {@code sys-loader-style} 从头到尾<b>不被触碰</b>，所以关掉锁定后
 *       他之前挑的动画会原样回来。</li>
 * </ul>
 *
 * <p>本次启动不做「就地重绘首屏」：首屏脚本已经用旧值渲染完，中途换一款动画
 * 只会让用户在几秒内看到两次不同的形态，比"下次刷新生效"更糟。</p>
 */
export function applyLoaderDeployPolicy(): void {
  if (typeof window === "undefined") return;
  const policy = resolveLoaderDeployPolicy();
  if (policy.locked) {
    writeBootLoaderPrefs(
      {
        animation: policy.animation,
        size: policy.size,
        color: policy.color,
        speed: policy.speed,
        adaptColor: policy.adaptColor,
      },
      resolveAppCode(),
    );
  } else {
    clearBootLoaderPrefs(resolveAppCode());
  }
}

/**
 * 写入首屏偏好（下次刷新生效）。
 *
 * <p>所有键都同时写带 appCode 与不带 appCode 两份：首屏脚本在应用起来之前就要读，
 * 那时 appCode 可能来自 meta —— 写两份才保证刷新后立刻生效（与
 * {@code writeLoaderAnimation} 的约定一致）。</p>
 *
 * @param prefs 已归一化的偏好
 * @param appCode 应用编码（可空；空时只写全局键）
 */
export function writeBootLoaderPrefs(prefs: BootLoaderPrefs, appCode = ""): void {
  if (!hasStorage()) return;
  try {
    const code = appCode.trim();
    const pairs: Array<[string, string]> = [
      [BOOT_LOADER_ANIMATION_KEY, prefs.animation],
      [BOOT_LOADER_SIZE_KEY, String(prefs.size.narrow)],
      [BOOT_LOADER_SIZE_WIDE_KEY, String(prefs.size.wide)],
      [BOOT_LOADER_COLOR_KEY, prefs.color],
      [BOOT_LOADER_SPEED_KEY, String(prefs.speed)],
      [BOOT_LOADER_ADAPT_COLOR_KEY, prefs.adaptColor ? "true" : "false"],
    ];
    // 只写部署侧自己的键，绝不碰 sys-loader-style（那是用户的选择）
    for (const [key, value] of pairs) {
      localStorage.setItem(key, value);
      if (code) localStorage.setItem(`${key}:${code}`, value);
    }
  } catch {
    // 隐私模式 / 存储被禁用：不抛，应用内仍然按部署配置渲染
  }
}

/**
 * 清除首屏偏好（取消接管后回到内置默认：动画回到用户自己的选择 / 96px / 主色默认）。
 *
 * <p><b>不</b>碰 {@code sys-loader-style} —— 那是用户在主题配置里的选择，
 * 清掉会让用户挑好的动画在下次刷新时丢失。这里只清部署侧自己写的那些键。</p>
 *
 * @param appCode 应用编码（可空）。可空时会把所有带后缀的残留键一并清掉 ——
 *                首屏读取是「后缀键优先」，留着它们会让「已取消接管」在下次刷新时
 *                又变回锁定值。
 */
export function clearBootLoaderPrefs(appCode = ""): void {
  if (!hasStorage()) return;
  const keys = [
    BOOT_LOADER_ANIMATION_KEY,
    BOOT_LOADER_SIZE_KEY,
    BOOT_LOADER_SIZE_WIDE_KEY,
    BOOT_LOADER_COLOR_KEY,
    BOOT_LOADER_SPEED_KEY,
    BOOT_LOADER_ADAPT_COLOR_KEY,
  ];
  try {
    const code = appCode.trim();
    if (code) {
      for (const key of keys) {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}:${code}`);
      }
      return;
    }
    // 拿不到 appCode 时也必须清干净：首屏读取是「后缀键优先」，
    // 残留的后缀键会让「已取消接管」在下次刷新时又变回锁定值。
    const prefixes = keys.map((key) => `${key}:`);
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    /* 同 writeBootLoaderPrefs */
  }
}

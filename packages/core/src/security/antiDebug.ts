/**
 * 反调试 / 反爬虫（@repo/core）
 *
 * 三层防护：
 *  1. 内置监听：禁用右键菜单、调试快捷键（F12 / Ctrl+Shift+I/J/C / Ctrl+U）
 *  2. devtools-detector：多检查器判定 DevTools 是否打开（不依赖窗口尺寸轮询）
 *  3. 外部反爬脚本：security.baiduJs.url 配置后可动态注入 <script> 加载，
 *     与内置监听互补（例如接入第三方反爬 / 混淆脚本）
 *
 * 检测到调试行为时执行对应策略：
 *  - action=clear    清空本地缓存（localStorage / sessionStorage / cookie）并跳转空页面
 *  - action=redirect 清空本地缓存并跳转到 jumpUrl（为空则跳首页）
 *
 * 注意：前端反调试只能增加逆向成本，无法彻底杜绝，请配合后端接口鉴权使用。
 */
import { getConfig } from "@repo/config";
// devtools-detector 为 CJS 包，用默认导入解构以保证 Node / Vite 双环境兼容
import detector from "devtools-detector";
const { addListener, launch, removeListener, stop } = detector;

/** 反调试策略 */
export type AntiDebugAction = "clear" | "redirect";

/** 反调试配置（运行期快照） */
export interface AntiDebugOptions {
  /** 是否启用 */
  enable: boolean;
  /** 外部反爬脚本地址（可选；配置后动态注入 <script> 加载） */
  url: string;
  /** 调试模式动作：clear=清空缓存并跳空页 / redirect=跳转到 jumpUrl */
  action: AntiDebugAction;
  /** 跳转地址（action=redirect 时生效，为空则跳首页） */
  jumpUrl: string;
}

/** 默认配置 */
const DEFAULT_OPTIONS: AntiDebugOptions = {
  enable: false,
  url: "",
  action: "clear",
  jumpUrl: "",
};

let stopFns: Array<() => void> = [];
let installed = false;
let externalScript: HTMLScriptElement | null = null;
/** 记录本次会话已执行过的跳转目标，避免 SPA 路由改写 hash 后反复刷新 */
const PUNISH_FLAG = "__repo_antidebug_punished__";

/** 从全局配置读取反调试运行期选项 */
function readOptions(): AntiDebugOptions {
  const baiduJs = getConfig()?.security?.baiduJs;
  return {
    enable: baiduJs?.enable ?? DEFAULT_OPTIONS.enable,
    url: baiduJs?.url ?? DEFAULT_OPTIONS.url,
    action: baiduJs?.action ?? DEFAULT_OPTIONS.action,
    jumpUrl: baiduJs?.jumpUrl ?? DEFAULT_OPTIONS.jumpUrl,
  };
}

/** 清空本地缓存（localStorage / sessionStorage / cookie） */
function clearLocalStorage(): void {
  try {
    window.localStorage.clear();
  } catch {
    // 忽略隐私模式等场景的异常
  }
  try {
    window.sessionStorage.clear();
  } catch {
    // 忽略
  }
  try {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  } catch {
    // 忽略
  }
}

/** 读取已跳转目标标记（必须在清缓存之前调用） */
function readPunishFlag(): string | null {
  try {
    return window.sessionStorage.getItem(PUNISH_FLAG);
  } catch {
    // 忽略隐私模式等场景的异常
    return null;
  }
}

/** 写入已跳转目标标记（清缓存之后调用） */
function writePunishFlag(target: string): void {
  try {
    window.sessionStorage.setItem(PUNISH_FLAG, target);
  } catch {
    // 忽略
  }
}

/** 触发调试惩罚动作：先清缓存，再按策略跳转 */
function punish(): void {
  const { action, jumpUrl } = readOptions();
  const target = jumpUrl || "/";
  // 同一目标已跳转过：不再重复清缓存与跳转（标记需在清缓存前读取）
  if (action === "redirect" && readPunishFlag() === target) {
    return;
  }
  clearLocalStorage();
  if (action === "redirect") {
    writePunishFlag(target);
    // 比较完整地址（而非仅 pathname），否则 jumpUrl 为 "/" 时子路由永远不跳转
    const resolved = new URL(target, location.origin).href;
    if (resolved !== location.href) {
      location.href = target;
    }
  } else {
    // clear：跳转空页面，销毁当前上下文
    location.replace("about:blank");
  }
}

/** 动态加载外部反爬脚本（baiduJs.url）；返回卸载函数 */
function loadExternalScript(url: string): () => void {
  if (!url || typeof document === "undefined") {
    return () => undefined;
  }
  const script = document.createElement("script");
  script.src = url;
  script.async = true;
  script.setAttribute("data-repo-antidebug", "1");
  // 外部脚本加载失败不影响内置监听
  script.onerror = () => {
    script.remove();
    if (externalScript === script) {
      externalScript = null;
    }
  };
  document.head?.appendChild(script);
  externalScript = script;
  return () => {
    script.remove();
    if (externalScript === script) {
      externalScript = null;
    }
  };
}

/** 判断是否为调试快捷键 */
function isBlockedDebugShortcut(event: KeyboardEvent): boolean {
  const k = event.key;
  return (
    k === "F12" ||
    (event.ctrlKey && event.shiftKey && ["I", "J", "C"].includes(k)) ||
    (event.ctrlKey && k.toLowerCase() === "u")
  );
}

/** 安装全部反调试监听器 */
function installListeners(): () => void {
  const listeners: Array<[EventTarget, string, EventListener]> = [];

  const register = (target: EventTarget, type: string, fn: EventListener) => {
    target.addEventListener(type, fn);
    listeners.push([target, type, fn]);
  };

  // 1. 禁用右键菜单（F12 常用入口）
  register(document, "contextmenu", (e) => {
    e.preventDefault();
    return false;
  });

  // 2. 禁用键盘调试快捷键
  register(document, "keydown", (e) => {
    const event = e as KeyboardEvent;
    if (isBlockedDebugShortcut(event)) {
      e.preventDefault();
      punish();
      return false;
    }
    return true;
  });

  // 3. devtools-detector：多检查器判定 DevTools 打开状态
  const handleDevTools = (isOpen: boolean) => {
    if (isOpen) {
      punish();
    }
  };
  addListener(handleDevTools);
  launch();

  const cleanup = () => {
    listeners.forEach(([target, type, fn]) => target.removeEventListener(type, fn));
    removeListener(handleDevTools);
    stop();
  };
  return cleanup;
}

/**
 * 安装反调试。幂等：重复调用会先卸载再重装。
 * 返回卸载函数。
 */
export function installAntiDebug(): () => void {
  stopFns.forEach((fn) => fn());
  stopFns = [];

  const options = readOptions();
  if (!options.enable) {
    installed = false;
    return () => {};
  }

  const cleanups: Array<() => void> = [installListeners()];
  if (options.url) {
    cleanups.push(loadExternalScript(options.url));
  }
  stopFns = cleanups;
  installed = true;
  // 返回的卸载函数与 uninstallAntiDebug 行为一致（含 installed 复位）
  return () => uninstallAntiDebug();
}

/** 卸载反调试 */
export function uninstallAntiDebug(): void {
  stopFns.forEach((fn) => fn());
  stopFns = [];
  if (externalScript) {
    externalScript.remove();
    externalScript = null;
  }
  installed = false;
}

/** 是否已安装 */
export function isAntiDebugInstalled(): boolean {
  return installed;
}

/** 刷新运行期选项（配置热更新后调用） */
export function refreshAntiDebug(): void {
  const enabled = readOptions().enable;
  if (enabled && !installed) {
    installAntiDebug();
  } else if (!enabled && installed) {
    uninstallAntiDebug();
  }
}

export const antiDebug = {
  install: installAntiDebug,
  uninstall: uninstallAntiDebug,
  refresh: refreshAntiDebug,
};

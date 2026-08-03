/**
 * 主题运行时同步
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  设计原则：能 CSS 就不 JS                                      │
 * ├─────────────────────────────────────────────────────────────┤
 * │  布局主题（header / aside / menu / optimum）                  │
 * │    → theme-vars.scss，切换 html class 即可，浏览器即时重算       │
 * │    → 替代原 config/theme.ts + 循环 setProperty（慢、易卡顿）    │
 * ├─────────────────────────────────────────────────────────────┤
 * │  用户主题色 themeColor（#2992FF 等）                           │
 * │    → themeColor.ts，仅写入 primary + light-1~9 + dark-2       │
 * │    → EP 组件内部按 hex 解析，无法用 color-mix / rgba 替代       │
 * └─────────────────────────────────────────────────────────────┘
 *
 * html class 与 store 映射（applyTheme）：
 *   dark              ← isDark
 *   header-inverted   ← headerInverted && !isDark（暗色下反转无意义，由 dark 覆盖）
 *   aside-inverted    ← asideInverted && !isDark
 *   layout-horizontal ← layout === "horizontal"（影响顶栏菜单是否跟随头部反转）
 *   grey-mode / weak-mode ← isGrey / isWeak
 *
 * 菜单反转规则（与改造前 setMenuTheme 一致，现由 CSS 选择器表达）：
 *   侧边栏反转：html.aside-inverted:not(.dark)
 *   横向+头部/侧栏反转：html.layout-horizontal + header-inverted（侧栏反转时 theme 同步加 header-inverted）
 */
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { DEFAULT_THEME } from "@repo/config";
import { applyPrimaryColorVars } from "@repo/utils";
import { getThemeContext } from "./appContext";

/** 保证全局只注册一次 watch，避免多处 useTheme() 重复监听 */
let themeWatcherInitialized = false;

/** 系统主题 media query */
function systemDarkQuery(): MediaQueryList | undefined {
  if (typeof window === "undefined" || !window.matchMedia) {
    return undefined;
  }
  return window.matchMedia("(prefers-color-scheme: dark)");
}

/** 根据 themeMode 计算实际暗色状态 */
function resolveDarkByMode(themeMode: string, isDark: boolean): boolean {
  if (themeMode === "dark") return true;
  if (themeMode === "light") return false;
  // auto：跟随系统
  return systemDarkQuery()?.matches ?? isDark;
}

export const useTheme = () => {
  const useGlobalStore = getThemeContext().useGlobalStore;
  if (!useGlobalStore) {
    throw new Error(
      "[theme] useGlobalStore 未注册：请在主题框架（如 koi/framework）顶层调用 registerThemeContext({ useGlobalStore })"
    );
  }
  const globalStore = useGlobalStore() as unknown as Record<string, unknown>;
  // globalStore 是响应式 store 对象（pinia Store），storeToRefs 会从 ref / reactive 中
  // 提取 ref。原始 storeToRefs 推断为 never，是因为我们用 unknown 抹掉了类型。
  const refs = storeToRefs(globalStore as never) as unknown as Record<string, import("vue").Ref<unknown>>;
  const layout = refs.layout as import("vue").Ref<string>;
  const isDark = refs.isDark as import("vue").Ref<boolean>;
  const themeMode = refs.themeMode as import("vue").Ref<string>;
  const themeColor = refs.themeColor as import("vue").Ref<string>;
  const isGrey = refs.isGrey as import("vue").Ref<boolean>;
  const isWeak = refs.isWeak as import("vue").Ref<boolean>;
  const asideInverted = refs.asideInverted as import("vue").Ref<boolean>;
  const headerInverted = refs.headerInverted as import("vue").Ref<boolean>;
  const setGlobalState = (key: string, value: unknown) => {
    (globalStore as unknown as { setGlobalState?: (k: string, v: unknown) => void }).setGlobalState?.(key, value);
  };

  /** 灰度 / 色弱：filter 作用于 body，用 class 控制即可 */
  const applyGreyOrWeak = () => {
    const html = document.documentElement;
    html.classList.toggle("grey-mode", isGrey.value);
    html.classList.toggle("weak-mode", isWeak.value);
  };

  /**
   * 核心同步：只改 class + 主题色阶
   * class 变更后 theme-vars.scss 中的变量自动切换，无需 JS 逐个 setProperty
   */
  const applyTheme = () => {
    const html = document.documentElement;
    // themeMode: light / dark / auto（auto 跟随系统 prefers-color-scheme）
    const effectiveDark = resolveDarkByMode(themeMode.value, isDark.value);
    // 同步 isDark 状态，保证 Dark.vue 图标与 CSS 一致
    if (isDark.value !== effectiveDark) {
      setGlobalState("isDark", effectiveDark);
    }
    html.classList.toggle("dark", effectiveDark);
    html.style.colorScheme = effectiveDark ? "dark" : "light";
    const effectiveHeaderInverted =
      headerInverted.value || (layout.value === "horizontal" && asideInverted.value);
    html.classList.toggle("header-inverted", effectiveHeaderInverted && !effectiveDark);
    html.classList.toggle("aside-inverted", asideInverted.value && !effectiveDark);
    html.classList.toggle("layout-horizontal", layout.value === "horizontal");
    applyPrimaryColorVars(html, themeColor.value || DEFAULT_THEME, effectiveDark);
  };

  /** 灰度与色弱互斥，开启一项时关闭另一项 */
  const changeGreyOrWeak = (type: "grey" | "weak", value: boolean) => {
    const html = document.documentElement;
    html.classList.toggle("grey-mode", type === "grey" && value);
    html.classList.toggle("weak-mode", type === "weak" && value);
    const propName = type === "grey" ? "isWeak" : "isGrey";
    setGlobalState(propName, false);
  };

  if (!themeWatcherInitialized) {
    themeWatcherInitialized = true;
    watch([layout, isDark, themeMode, themeColor, asideInverted, headerInverted], applyTheme, { immediate: true });
    watch([isGrey, isWeak], applyGreyOrWeak, { immediate: true });
    // auto 模式：监听系统主题变化
    const mql = systemDarkQuery();
    if (mql) {
      const handler = () => {
        if (themeMode.value === "auto") {
          applyTheme();
        }
      };
      mql.addEventListener("change", handler);
    }
  }

  /** Dark.vue 切换暗色时调用，实际走 applyTheme */
  const switchDark = () => {
    applyTheme();
  };

  /** 主题配置面板选色：更新 store 并重算色阶（布局 class 不变） */
  const changeThemeColor = (val: string | null) => {
    if (!val) {
      val = DEFAULT_THEME;
      ElMessage({ type: "success", message: "主题颜色已重置为默认主题" });
    }
    setGlobalState("themeColor", val);
    applyPrimaryColorVars(document.documentElement, val, resolveDarkByMode(themeMode.value, isDark.value));
  };

  /** 设置主题模式（light / dark / auto） */
  const changeThemeMode = (mode: "light" | "dark" | "auto") => {
    setGlobalState("themeMode", mode);
    applyTheme();
  };

  /** App.vue 挂载时调用，与 watch immediate 效果重叠，保留以兼容显式初始化 */
  const initThemeConfig = () => {
    applyTheme();
    applyGreyOrWeak();
  };

  return {
    initThemeConfig,
    switchDark,
    changeThemeColor,
    changeThemeMode,
    changeGreyOrWeak,
    applyTheme
  };
};

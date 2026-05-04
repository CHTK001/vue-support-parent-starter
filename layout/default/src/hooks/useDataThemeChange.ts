import { darken, lighten } from "@pureadmin/theme/dist/browser-utils";
import { useGlobal } from "@pureadmin/utils";
import { defaultRouterArrays, getConfig } from "@repo/config";
import {
  removeToken,
  resetRouter,
  router,
  useAppStoreHook,
  useEpThemeStoreHook,
  useMultiTagsStoreHook,
} from "@repo/core";
import { localStorageProxy } from "@repo/utils";
import { ref } from "vue";
import type { themeColorsType } from "../types";
import type { StorageLayout } from "../types/theme";
import { useLayout } from "./useLayout";

export function useDataThemeChange() {
  const { layoutTheme, layout } = useLayout();

  // 提取 store 到函数顶层避免重复调用
  const epThemeStore = useEpThemeStoreHook();
  const multiTagsStore = useMultiTagsStoreHook();

  const themeColors = ref<Array<themeColorsType>>([
    /* 亮白色 */
    {
      color: "#ffffff",
      themeColor: "light",
      description: "通透克制的白色主题",
    },
    /* 深紫罗兰色 */
    {
      color: "#722ed1",
      themeColor: "saucePurple",
      description: "神秘优雅的紫色主题",
    },
    /* 深粉色 */
    { color: "#eb2f96", themeColor: "pink", description: "活力四射的粉色主题" },
    /* 猩红色 */
    { color: "#f5222d", themeColor: "dusk", description: "热情洋溢的红色主题" },
    /* 橙红色 */
    {
      color: "#fa541c",
      themeColor: "volcano",
      description: "温暖活力的橙色主题",
    },
    /* 绿宝石 */
    {
      color: "#13c2c2",
      themeColor: "mingQing",
      description: "清新自然的青色主题",
    },
    /* 酸橙绿 */
    {
      color: "#52c41a",
      themeColor: "auroraGreen",
      description: "生机勃勃的绿色主题",
    },
    {
      color: "#3f51b5",
      themeColor: "indigo",
      description: "冷静理性的靛蓝主题",
    },
    {
      color: "#1677ff",
      themeColor: "oceanBlue",
      description: "清爽明亮的海洋蓝主题",
    },
    {
      color: "#faad14",
      themeColor: "amber",
      description: "高对比暖光的琥珀主题",
    },
    {
      color: "#e11d48",
      themeColor: "rose",
      description: "更成熟的玫瑰红主题",
    },
    {
      color: "#0f766e",
      themeColor: "teal",
      description: "偏科技感的蓝绿主题",
    },
    {
      color: "#475569",
      themeColor: "slate",
      description: "克制稳重的石板灰主题",
    },
    /**紫色 */
    {
      color: "#4e69fd",
      themeColor: "#4e69fd",
      description: "梦幻迷人的紫色主题",
    },
  ]);
  const { $storage } = useGlobal<GlobalPropertiesApi>();

  // 优先从 localStorage 读取 layout 配置，避免应用早期 $storage 还未就绪导致深色样式被覆盖
  let initialDarkMode: boolean | undefined;
  let initialOverallStyle: string | undefined;
  try {
    const layoutConfig = JSON.parse(
      localStorage.getItem("layout") || "{}",
    ) as Partial<StorageLayout>;
    initialDarkMode = layoutConfig.darkMode;
    initialOverallStyle = layoutConfig.overallStyle as string | undefined;
  } catch {
    // 解析失败则回退到 $storage
  }

  const dataTheme = ref<boolean>(
    typeof initialDarkMode === "boolean"
      ? initialDarkMode
      : $storage?.layout?.darkMode,
  );
  const overallStyle = ref<string>(
    initialOverallStyle ??
      ($storage?.layout?.overallStyle as string | undefined),
  );

  const body = document.documentElement as HTMLElement;
  let primaryDerivedJob: number | null = null;
  let primaryDerivedIdleJob: number | null = null;

  function toggleClass(flag: boolean, clsName: string, target?: HTMLElement) {
    const targetEl = target || document.body;
    let { className } = targetEl;
    className = className.replace(clsName, "").trim();
    targetEl.className = flag ? `${className} ${clsName}` : className;
  }

  /** 设置导航主题色 */
  async function setLayoutThemeColor(
    theme = getConfig().Theme ?? "light",
    isClick = true,
  ) {
    layoutTheme.value.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);

    // 如果非 isClick，保留之前的 themeColor
    const storageThemeColor = $storage.layout.themeColor;

    const nextLayout: StorageLayout = {
      layout: layout.value as StorageLayout["layout"],
      theme,
      darkMode: dataTheme.value,
      sidebarStatus: $storage.layout?.sidebarStatus,
      epThemeColor: $storage.layout?.epThemeColor,
      themeColor: isClick ? theme : storageThemeColor,
      overallStyle: overallStyle.value as StorageLayout["overallStyle"],
    };

    const currentLayout = $storage.layout as StorageLayout | undefined;

    // 防止对同一内容反复写入，避免触发递归更新
    if (
      currentLayout &&
      currentLayout.layout === nextLayout.layout &&
      currentLayout.theme === nextLayout.theme &&
      currentLayout.darkMode === nextLayout.darkMode &&
      currentLayout.sidebarStatus === nextLayout.sidebarStatus &&
      currentLayout.epThemeColor === nextLayout.epThemeColor &&
      currentLayout.themeColor === nextLayout.themeColor &&
      currentLayout.overallStyle === nextLayout.overallStyle
    ) {
      return;
    }

    $storage.layout = nextLayout;

    // 当选择白色主题时，使用#006ae6作为主色调
    if (theme === "light") {
      setEpThemeColor("#006ae6", theme);
    } else if (theme === "default") {
      setEpThemeColor(getConfig().EpThemeColor, theme);
    } else {
      const colors = themeColors.value.find((v) => v.themeColor === theme);
      if (colors) {
        setEpThemeColor(colors.color, theme);
      }
    }
  }

  /** 设置 `element-plus` 主题色 - 优化性能 */
  const setEpThemeColor = (color: string, themeName?: string) => {
    epThemeStore.setEpThemeColor(color, themeName);

    const style = document.documentElement.style;
    const primary = String(color || "").trim() || "#409EFF";
    const rgbHex = primary.replace(/^#/, "");
    const normalizedHex =
      rgbHex.length === 3
        ? rgbHex
            .split("")
            .map((item) => `${item}${item}`)
            .join("")
        : rgbHex;
    const numeric = parseInt(normalizedHex, 16);
    const r = Number.isNaN(numeric) ? 64 : (numeric >> 16) & 255;
    const g = Number.isNaN(numeric) ? 158 : (numeric >> 8) & 255;
    const b = Number.isNaN(numeric) ? 255 : numeric & 255;

    // 关键颜色变量同步写入，保证切换首帧视觉立即对齐
    style.setProperty("--el-color-primary", primary);
    style.setProperty("--app-primary", primary);
    style.setProperty("--el-color-primary-rgb", `${r}, ${g}, ${b}`);

    if (primaryDerivedJob !== null) {
      window.cancelAnimationFrame(primaryDerivedJob);
      primaryDerivedJob = null;
    }
    if (primaryDerivedIdleJob !== null) {
      const cancelIdle = (window as any).cancelIdleCallback;
      if (typeof cancelIdle === "function") {
        cancelIdle(primaryDerivedIdleJob);
      } else {
        clearTimeout(primaryDerivedIdleJob);
      }
      primaryDerivedIdleJob = null;
    }

    const applyDerivedPalette = () => {
      for (let i = 1; i <= 2; i++) {
        style.setProperty(
          `--el-color-primary-dark-${i}`,
          dataTheme.value ? darken(primary, i / 10) : lighten(primary, i / 10),
        );
      }
      for (let i = 1; i <= 9; i++) {
        style.setProperty(
          `--el-color-primary-light-${i}`,
          dataTheme.value ? darken(primary, i / 10) : lighten(primary, i / 10),
        );
      }
    };

    // 其余派生色延后一帧到空闲阶段，降低切换瞬时主线程阻塞
    primaryDerivedJob = window.requestAnimationFrame(() => {
      primaryDerivedJob = null;
      const requestIdle = (window as any).requestIdleCallback;
      if (typeof requestIdle === "function") {
        primaryDerivedIdleJob = requestIdle(
          () => {
            primaryDerivedIdleJob = null;
            applyDerivedPalette();
          },
          { timeout: 120 },
        );
      } else {
        primaryDerivedIdleJob = window.setTimeout(() => {
          primaryDerivedIdleJob = null;
          applyDerivedPalette();
        }, 0);
      }
    });
  };

  function applyOverallStyleImmediately(overall?: string) {
    overallStyle.value = overall;
    const targetTheme =
      epThemeStore.epTheme === "light" && dataTheme.value
        ? "default"
        : !dataTheme.value && $storage.layout.themeColor === "light"
          ? "light"
          : epThemeStore.epTheme;

    const htmlElement = document.documentElement;
    htmlElement.classList.toggle("dark", !!dataTheme.value);
    setLayoutThemeColor(targetTheme, false);
  }

  /** 浅色、深色整体风格切换 - 优化性能 */
  async function dataThemeChange(overall?: string) {
    const htmlElement = document.documentElement;

    htmlElement.classList.add("theme-switching");

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        applyOverallStyleImmediately(overall);
        resolve();
      });
    });

    window.setTimeout(() => {
      htmlElement.classList.remove("theme-switching");
    }, 80);
  }

  /** 清空缓存并返回登录页 */
  function onReset() {
    removeToken();
    localStorageProxy().clear();
    const {
      Grey,
      Weak,
      Invert,
      Monochrome,
      MultiTagsCache,
      EpThemeColor,
      Layout,
    } = getConfig();
    useAppStoreHook().setLayout(Layout);
    setEpThemeColor(EpThemeColor);
    multiTagsStore.multiTagsCacheChange(MultiTagsCache);
    toggleClass(Grey, "html-grey", document.querySelector("html"));
    toggleClass(Weak, "html-weakness", document.querySelector("html"));
    toggleClass(Invert, "html-invert", document.querySelector("html"));
    toggleClass(Monochrome, "html-monochrome", document.querySelector("html"));
    router.push("/login");
    multiTagsStore.handleTags("equal", [...defaultRouterArrays]);
    resetRouter();
  }

  return {
    body,
    dataTheme,
    overallStyle,
    layoutTheme,
    themeColors,
    onReset,
    toggleClass,
    dataThemeChange,
    applyOverallStyleImmediately,
    setEpThemeColor,
    setLayoutThemeColor,
  };
}

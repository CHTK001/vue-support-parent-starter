import { ref } from "vue";
import { defaultRouterArrays, getConfig } from "@repo/config";
import { useLayout } from "./useLayout";
import { removeToken, resetRouter, router, useAppStoreHook, useEpThemeStoreHook, useMultiTagsStoreHook } from "@repo/core";
import type { themeColorsType } from "../types";
import { useGlobal } from "@pureadmin/utils";
import { darken, lighten, toggleTheme } from "@pureadmin/theme/dist/browser-utils";
import { localStorageProxy } from "@repo/utils";

export function useDataThemeChange() {
  const { layoutTheme, layout } = useLayout();
  const themeColors = ref<Array<themeColorsType>>([
    /* 亮白色 */
    { color: "#ffffff", themeColor: "light" },
    /* 道奇蓝 */
    { color: "#1b2a47", themeColor: "default" },
    /* 深紫罗兰色 */
    { color: "#722ed1", themeColor: "saucePurple" },
    /* 深粉色 */
    { color: "#eb2f96", themeColor: "pink" },
    /* 猩红色 */
    { color: "#f5222d", themeColor: "dusk" },
    /* 橙红色 */
    { color: "#fa541c", themeColor: "volcano" },
    /* 绿宝石 */
    { color: "#13c2c2", themeColor: "mingQing" },
    /* 酸橙绿 */
    { color: "#52c41a", themeColor: "auroraGreen" },
    /**紫色 */
    { color: "#4e69fd", themeColor: "#4e69fd" },
  ]);
  //@ts-ignore
  const { $storage } = useGlobal<GlobalPropertiesApi>();
  const dataTheme = ref<boolean>($storage?.layout?.darkMode);
  const overallStyle = ref<string>($storage?.layout?.overallStyle);
  const body = document.documentElement as HTMLElement;

  function toggleClass(flag: boolean, clsName: string, target?: HTMLElement) {
    const targetEl = target || document.body;
    let { className } = targetEl;
    className = className.replace(clsName, "").trim();
    targetEl.className = flag ? `${className} ${clsName}` : className;
  }

  /** 设置导航主题色 */
  function setLayoutThemeColor(theme = getConfig().Theme ?? "light", isClick = true) {
    layoutTheme.value.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    // 如果非isClick，保留之前的themeColor
    const storageThemeColor = $storage.layout.themeColor;
    $storage.layout = {
      layout: layout.value,
      theme,
      darkMode: dataTheme.value,
      sidebarStatus: $storage.layout?.sidebarStatus,
      epThemeColor: $storage.layout?.epThemeColor,
      themeColor: isClick ? theme : storageThemeColor,
      overallStyle: overallStyle.value,
    };

    if (theme === "default" || theme === "light") {
      setEpThemeColor(getConfig().EpThemeColor);
    } else {
      const colors = themeColors.value.find((v) => v.themeColor === theme);
      setEpThemeColor(colors.color);
    }
  }

  function setPropertyPrimary(mode: string, i: number, color: string) {
    document.documentElement.style.setProperty(`--el-color-primary-${mode}-${i}`, dataTheme.value ? darken(color, i / 10) : lighten(color, i / 10));
  }

  /** 设置 `element-plus` 主题色 - 优化性能 */
  const setEpThemeColor = (color: string) => {
    useEpThemeStoreHook().setEpThemeColor(color);

    // 使用 DocumentFragment 或批量操作来减少重绘
    const style = document.documentElement.style;

    // 预计算所有颜色值
    const cssProperties = new Map();
    cssProperties.set("--el-color-primary", color);

    // 预计算dark和light变体
    for (let i = 1; i <= 2; i++) {
      cssProperties.set(`--el-color-primary-dark-${i}`, dataTheme.value ? darken(color, i / 10) : lighten(color, i / 10));
    }
    for (let i = 1; i <= 9; i++) {
      cssProperties.set(`--el-color-primary-light-${i}`, dataTheme.value ? darken(color, i / 10) : lighten(color, i / 10));
    }

    // 批量设置所有CSS变量，减少DOM操作
    requestAnimationFrame(() => {
      cssProperties.forEach((value, property) => {
        style.setProperty(property, value);
      });
    });
  };

  /** 浅色、深色整体风格切换 - 优化性能 */
  function dataThemeChange(overall?: string) {
    const htmlElement = document.documentElement;

    // 临时禁用所有transition，确保主题切换无延迟
    htmlElement.classList.add("theme-switching");

    // 批量更新所有主题相关的属性
    const updates = () => {
      // 更新响应式值
      overallStyle.value = overall;

      // 更新 dark 类
      if (dataTheme.value) {
        htmlElement.classList.add("dark");
      } else {
        htmlElement.classList.remove("dark");
      }

      // 更新 data-theme 属性
      const targetTheme = (() => {
        if (useEpThemeStoreHook().epTheme === "light" && dataTheme.value) {
          return "default";
        } else if (!dataTheme.value && $storage.layout.themeColor === "light") {
          return "light";
        } else {
          return useEpThemeStoreHook().epTheme;
        }
      })();

      // 同步更新主题色
      setLayoutThemeColor(targetTheme, false);
    };

    // 使用 requestAnimationFrame 确保同步更新
    requestAnimationFrame(() => {
      updates();

      // 强制重绘以确保样式立即生效
      htmlElement.offsetHeight;

      // 短暂延迟后重新启用transition
      requestAnimationFrame(() => {
        setTimeout(() => {
          htmlElement.classList.remove("theme-switching");
        }, 30); // 减少延迟时间
      });
    });
  }

  /** 清空缓存并返回登录页 */
  function onReset() {
    removeToken();
    localStorageProxy().clear();
    const { Grey, Weak, Invert, Monochrome, MultiTagsCache, EpThemeColor, Layout } = getConfig();
    useAppStoreHook().setLayout(Layout);
    setEpThemeColor(EpThemeColor);
    useMultiTagsStoreHook().multiTagsCacheChange(MultiTagsCache);
    toggleClass(Grey, "html-grey", document.querySelector("html"));
    toggleClass(Weak, "html-weakness", document.querySelector("html"));
    toggleClass(Invert, "html-invert", document.querySelector("html"));
    toggleClass(Monochrome, "html-monochrome", document.querySelector("html"));
    router.push("/login");
    useMultiTagsStoreHook().handleTags("equal", [...defaultRouterArrays]);
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
    setEpThemeColor,
    setLayoutThemeColor,
  };
}

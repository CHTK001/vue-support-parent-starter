/**
 * BaseSetting 组件逻辑 Composable
 * @description 提取 BaseSetting.vue 中的复杂逻辑，包括主题切换、布局模式、系统监听等
 */
import { ref, computed, watch, onBeforeMount, onMounted, onUnmounted, nextTick, unref } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobal, useDark, debounce, isNumber, toggleClass } from "@pureadmin/utils";
import { emitter, useAppStoreHook } from "@repo/core";
import { getConfig } from "@repo/config";
import { ElMessage } from "element-plus";
import { getAvailableThemes, detectFestivalTheme } from "../../../../themes";
import { useDataThemeChange } from "../../../../hooks/useDataThemeChange";
import { useThemeAnimation } from "../../../../hooks/useThemeAnimation";
import type { OptionsType } from "@repo/components/ReSegmented";

/**
 * BaseSetting 组件逻辑
 */
export function useBaseSetting() {
  const { t } = useI18n();
  const { $storage } = useGlobal<GlobalPropertiesApi>();
  const { isDark } = useDark();
  const {
    dataTheme,
    overallStyle,
    layoutTheme,
    dataThemeChange,
    setLayoutThemeColor,
    toggleClass: toggleClassUtil,
  } = useDataThemeChange();

  // ===== 响应式状态 =====
  const markValue = ref($storage.configure?.showModel ?? "chrome");
  const logoVal = ref($storage.configure?.showLogo ?? true);
  const cardBodyVal = ref($storage.configure?.cardBody ?? true);
  const cardColorMode = ref($storage.configure?.cardColorMode ?? "all");
  const previewInput = ref("");
  const previewSwitch = ref(true);
  const previewSlider = ref(50);
  const previewCheck = ref(true);
  const previewRadio = ref("1");

  // 布局模式 refs
  const mixRef = ref();
  const verticalRef = ref();
  const horizontalRef = ref();
  const hoverRef = ref();
  const mobileRef = ref();
  const doubleRef = ref();

  // Tippy 实例管理
  const tippyInstances = ref([]);

  // ===== 计算属性 =====

  /** 判断当前是否为非默认主题 */
  const isNonDefaultTheme = computed(() => {
    const currentTheme = $storage?.configure?.systemTheme || "default";
    return currentTheme !== "default";
  });

  /** 获取当前环境和用户信息 */
  const currentEnv = import.meta.env.MODE || "production";
  const isDevelopment = currentEnv === "development" || import.meta.env.DEV;
  const isTest = currentEnv === "test";

  /** 获取用户角色列表 */
  const userRoles = computed(() => {
    const roles = $storage?.user?.roles || $storage?.userInfo?.roles || [];
    return Array.isArray(roles) ? roles : [];
  });

  /** 节日主题列表 */
  const festivalThemesList = computed(() => {
    const settings = {
      enableFestivalTheme:
        $storage.configure?.enableFestivalTheme ??
        getConfig().EnableFestivalTheme ??
        false,
    };
    const themes = getAvailableThemes(
      settings.enableFestivalTheme,
      userRoles.value,
      isDevelopment,
      isTest,
    );

    return themes.map((t) => ({
      color: t.color || "#409EFF",
      themeColor: t.key,
      name: t.name,
      description: t.description,
      icon: t.icon || "ri:palette-line",
      type: t.type,
      key: t.key,
    }));
  });

  /** 当网页整体为暗色风格时不显示亮白色主题配色切换选项 */
  const showThemeColors = computed(() => {
    return (themeColor: string) => {
      return themeColor === "light" && isDark.value ? false : true;
    };
  });

  /** 主题色样式 */
  const getThemeColorStyle = computed(() => {
    return (color: string) => {
      return { background: color };
    };
  });

  /** 主题色激活选择项 */
  const getThemeColor = computed(() => {
    return (current: string) => {
      if (
        current === layoutTheme.value.theme &&
        layoutTheme.value.theme !== "light"
      ) {
        return "#fff";
      } else if (
        current === layoutTheme.value.theme &&
        layoutTheme.value.theme === "light"
      ) {
        return "#1d2b45";
      } else {
        return "transparent";
      }
    };
  });

  // ===== 工具函数 =====

  /**
   * 持久化配置到 storage
   */
  function storageConfigureChange<T>(key: string, val: T): void {
    const storageConfigure = $storage.configure;
    storageConfigure[key] = val;
    $storage.configure = storageConfigure;
  }

  /**
   * 切换系统主题皮肤
   * @param themeKey 主题键值
   * @param showMessage 是否显示消息，默认为true
   */
  function switchSystemTheme(
    themeKey: string,
    showMessage: boolean = true,
  ): void {
    const currentTheme = $storage.configure?.systemTheme || "default";
    if (currentTheme === themeKey) {
      return;
    }

    const htmlEl = document.documentElement;
    htmlEl.setAttribute("data-skin", themeKey);

    // 如果切换到非默认主题，强制切换到浅色模式
    if (themeKey !== "default") {
      dataTheme.value = false;
      dataThemeChange("light");
    }

    // 保存到本地存储
    storageConfigureChange("systemTheme", themeKey);

    // 发送主题切换事件
    emitter.emit("systemThemeChange", themeKey);

    // 只在明确要求显示消息时才显示
    if (showMessage) {
      const themeName =
        themeKey === "default"
          ? "默认"
          : festivalThemesList.value.find((t) => t.themeColor === themeKey)
              ?.name || themeKey;
      ElMessage.success(`已切换到${themeName}主题`);
    }
  }

  /**
   * 节日主题自动切换设置
   */
  function festivalThemeChange(value: boolean): void {
    storageConfigureChange("enableFestivalTheme", value);

    if (value) {
      // 开启自动切换，检测并应用节日主题
      const festivalTheme = detectFestivalTheme();

      if (festivalTheme) {
        switchSystemTheme(festivalTheme.key, true);
      } else {
        // 非节日期间，默认使用 Default 主题
        switchSystemTheme("default", true);
      }
    } else {
      // 关闭自动切换，但不移除当前主题，用户需要手动切换回默认主题
      ElMessage.success(t("panel.festivalThemeDisabled"));
    }
  }

  /**
   * 设置导航模式
   */
  function setLayoutModel(layout: string) {
    layoutTheme.value.layout = layout as any;
    window.document.body.setAttribute("layout", layout);
    $storage.layout = {
      layout: layout as any,
      theme: layoutTheme.value.theme,
      darkMode: $storage.layout?.darkMode,
      sidebarStatus: $storage.layout?.sidebarStatus,
      epThemeColor: $storage.layout?.epThemeColor,
      themeColor: $storage.layout?.themeColor,
      overallStyle: $storage.layout?.overallStyle,
    };
    useAppStoreHook().setLayout(layout);
  }

  /**
   * 系统主题监听相关
   */
  const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

  /** 根据操作系统主题设置平台整体风格 */
  function updateTheme() {
    if (overallStyle.value !== "system") return;
    if (mediaQueryList.matches) {
      dataTheme.value = true;
    } else {
      dataTheme.value = false;
    }
    dataThemeChange(overallStyle.value);
  }

  function removeMatchMedia() {
    mediaQueryList.removeEventListener("change", updateTheme);
  }

  /** 监听操作系统主题改变 */
  function watchSystemThemeChange() {
    updateTheme();
    removeMatchMedia();
    mediaQueryList.addEventListener("change", updateTheme);
  }

  /**
   * 初始化主题
   */
  function initializeTheme() {
    const savedTheme = $storage.configure?.systemTheme;
    const enableFestivalTheme =
      $storage.configure?.enableFestivalTheme ??
      getConfig().EnableFestivalTheme ??
      false;

    if (enableFestivalTheme) {
      // 如果开启了自动切换，检测节日主题
      const festivalTheme = detectFestivalTheme();

      if (festivalTheme) {
        switchSystemTheme(festivalTheme.key, false); // 初始化时不显示消息
        return;
      }
    }

    // 应用保存的主题或默认主题
    if (savedTheme && savedTheme !== "default") {
      switchSystemTheme(savedTheme, false); // 初始化时不显示消息
    }
  }

  /**
   * Tippy 实例管理
   */
  function collectTippyInstances() {
    nextTick(() => {
      const elementsWithTippy = [
        verticalRef.value,
        horizontalRef.value,
        mixRef.value,
        hoverRef.value,
        doubleRef.value,
      ].filter(Boolean);

      elementsWithTippy.forEach((element) => {
        if (element && element._tippy) {
          tippyInstances.value.push(element._tippy);
        }
      });
    });
  }

  function destroyAllTippyInstances() {
    // 销毁通过 v-tippy 指令创建的实例
    const elementsWithTippy = [
      verticalRef.value,
      horizontalRef.value,
      mixRef.value,
      hoverRef.value,
      doubleRef.value,
    ].filter(Boolean);

    elementsWithTippy.forEach((element) => {
      if (element && element._tippy) {
        element._tippy.destroy();
      }
    });

    // 销毁存储在数组中的实例
    tippyInstances.value.forEach((instance) => {
      if (instance && typeof instance.destroy === "function") {
        instance.destroy();
      }
    });

    // 清空数组
    tippyInstances.value = [];

    // 清理可能残留的 tippy DOM 元素
    const tippyElements = document.querySelectorAll("[data-tippy-root]");
    tippyElements.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  }

  /**
   * 布局模式选择相关
   */
  function setFalse(Doms): any {
    Doms.forEach((v) => {
      toggleClass(false, "is-select", unref(v));
    });
  }

  // 监听布局模式变化
  watch(
    () => $storage.layout,
    ({ layout }) => {
      switch (layout["layout"]) {
        case "vertical":
          toggleClass(true, "is-select", unref(verticalRef));
          debounce(setFalse([horizontalRef, mixRef, hoverRef, doubleRef]), 50);
          break;
        case "horizontal":
          toggleClass(true, "is-select", unref(horizontalRef));
          debounce(setFalse([verticalRef, mixRef, hoverRef, doubleRef]), 50);
          break;
        case "mix":
          toggleClass(true, "is-select", unref(mixRef));
          debounce(setFalse([verticalRef, horizontalRef, hoverRef, doubleRef]), 50);
          break;
        case "hover":
          toggleClass(true, "is-select", unref(hoverRef));
          debounce(setFalse([verticalRef, horizontalRef, mixRef, doubleRef]), 50);
          break;
        case "double":
          toggleClass(true, "is-select", unref(doubleRef));
          debounce(setFalse([verticalRef, horizontalRef, mixRef, hoverRef]), 50);
          break;
      }
    },
    { deep: true },
  );

  // ===== 生命周期 =====

  onBeforeMount(() => {
    // 强制重置节日主题自动切换默认为关闭 (针对旧版本缓存)
    const MIGRATION_KEY = "festival_theme_config_reset_v1";
    if (!localStorage.getItem(MIGRATION_KEY)) {
      storageConfigureChange("enableFestivalTheme", false);
      localStorage.setItem(MIGRATION_KEY, "true");
    }
  });

  onMounted(() => {
    collectTippyInstances();

    // 监听面板关闭事件
    emitter.on("settingPanelClosed", () => {
      destroyAllTippyInstances();
    });
  });

  onUnmounted(() => {
    removeMatchMedia();
    destroyAllTippyInstances();
    // 移除事件监听器
    emitter.off("settingPanelClosed");
  });

  return {
    // 状态
    markValue,
    logoVal,
    cardBodyVal,
    cardColorMode,
    previewInput,
    previewSwitch,
    previewSlider,
    previewCheck,
    previewRadio,
    // 布局模式 refs
    mixRef,
    verticalRef,
    horizontalRef,
    hoverRef,
    mobileRef,
    doubleRef,
    // 计算属性
    isNonDefaultTheme,
    isDevelopment,
    isTest,
    userRoles,
    festivalThemesList,
    showThemeColors,
    getThemeColorStyle,
    getThemeColor,
    // 方法
    storageConfigureChange,
    switchSystemTheme,
    festivalThemeChange,
    setLayoutModel,
    watchSystemThemeChange,
    initializeTheme,
    collectTippyInstances,
    destroyAllTippyInstances,
    setFalse,
    // 主题相关
    dataTheme,
    overallStyle,
    layoutTheme,
    dataThemeChange,
    setLayoutThemeColor,
  };
}


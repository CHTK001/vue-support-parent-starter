/**
 * 设置管理 Composable
 * @description 统一管理系统设置的状态和方法
 */
import {
  computed,
  nextTick,
  onBeforeMount,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  unref,
  watch,
} from "vue";
import { debounce, toggleClass, useDark, useGlobal } from "@pureadmin/utils";
import { emitter, useAppStoreHook } from "@repo/core";
import { getConfig } from "@repo/config";
import type { StorageConfig } from "../../../types/theme";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { detectFestivalTheme, getAvailableThemes } from "../../../themes";
import { useDataThemeChange } from "../../../hooks/useDataThemeChange";

/**
 * 设置状态类型
 */
/** 可用的动画类型 */
export type TransitionType = 'fade-slide' | 'fade-scale' | 'fade-only' | 'slide-right';

export interface SettingsState {
  // 过渡动画
  menuTransition: boolean;
  transitionType: TransitionType;
  // 布局参数
  contentMargin: number;
  layoutRadius: number;
  layoutBlur: number;
  // 视觉效果
  greyVal: boolean;
  weakVal: boolean;
  invertVal: boolean;
  monochromeVal: boolean;
  // 界面元素
  tabsVal: boolean;
  cardBody: boolean;
  showLogo: boolean;
  showModel: string;
  hideFooter: boolean;
  hideHeader: boolean;
  multiTagsCache: boolean;
  stretch: boolean | number;
  // 高级功能
  keepAlive: boolean;
  debugMode: boolean;
  // 面包屑
  showBreadcrumb: boolean;
  breadcrumbIconOnly: boolean;
  // 标签页
  showTagIcon: boolean;
  // 菜单设置
  showNewMenu: boolean;
  newMenuText: string;
  newMenuTimeLimit: number;
  newMenuAnimation: string;
  // 双栏导航
  doubleNavExpandMode: string;
  doubleNavAutoExpandAll: boolean;
  // AI 助手
  aiChatTheme: string;
  // 主题管理
  enableFestivalTheme: boolean;
  // 消息弹窗
  messagePopupEnabled: boolean;
  messagePopupPosition: string;
  messagePopupDuration: number;
  // 字体加密
  fontEncryptionEnabled: boolean;
  fontEncryptionNumbers: boolean;
  fontEncryptionChinese: boolean;
  fontEncryptionGlobal: boolean;
  fontEncryptionOcrNoise: boolean;
  // 主题切换动画配置
  themeAnimationMode: 'random' | 'fixed' | 'disabled';
  themeAnimationDirection: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center' | 'left' | 'right' | 'top' | 'bottom';
}


/**
 * 设置管理 Hook
 */
export function useSettings() {
  const { $storage } = useGlobal<GlobalPropertiesApi>();

  // ===== 初始化状态 =====
  const configure = $storage?.configure ?? {};
  const settings = reactive<SettingsState>({
    menuTransition: configure?.menuTransition ?? false,
    transitionType: configure?.transitionType ?? 'fade-slide',
    // ... 其他默认值保持不变
    // 新增动画配置默认值
    themeAnimationMode: configure?.themeAnimationMode ?? 'fixed',
    themeAnimationDirection: configure?.themeAnimationDirection ?? 'top-right',
    
    contentMargin: configure?.contentMargin ?? 16,
    layoutRadius: configure?.layoutRadius ?? 10,
    layoutBlur: configure?.layoutBlur ?? 4,
    greyVal: configure?.grey ?? false,
    weakVal: configure?.weak ?? false,
    invertVal: configure?.invert ?? false,
    monochromeVal: configure?.monochrome ?? false,
    tabsVal: configure?.hideTabs ?? false,
    cardBody: configure?.cardBody ?? true,
    showLogo: configure?.showLogo ?? true,
    showModel: configure?.showModel ?? "chrome",
    hideFooter: configure?.hideFooter ?? true,
    hideHeader: configure?.hideHeader ?? false,
    multiTagsCache: configure?.multiTagsCache ?? true,
    stretch: configure?.stretch ?? false,
    keepAlive: configure?.keepAlive ?? true,
    debugMode: configure?.debugMode ?? false,
    showBreadcrumb: configure?.showBreadcrumb ?? true,
    breadcrumbIconOnly: configure?.breadcrumbIconOnly ?? false,
    showTagIcon: configure?.showTagIcon ?? true,
    showNewMenu: configure?.showNewMenu ?? true,
    newMenuText: configure?.newMenuText ?? "new",
    newMenuTimeLimit: configure?.newMenuTimeLimit ?? 168,
    newMenuAnimation: configure?.newMenuAnimation ?? "bounce",
    doubleNavExpandMode: configure?.doubleNavExpandMode ?? "auto",
    doubleNavAutoExpandAll: configure?.doubleNavAutoExpandAll ?? true,
    aiChatTheme: configure?.aiChatTheme ?? "default",
    enableFestivalTheme: configure?.enableFestivalTheme ?? getConfig().EnableFestivalTheme ?? true,
    messagePopupEnabled: configure?.messagePopupEnabled ?? getConfig().MessagePopupEnabled ?? true,
    messagePopupPosition: configure?.messagePopupPosition ?? "top-right",
    messagePopupDuration: configure?.messagePopupDuration ?? 5,
    fontEncryptionEnabled: configure?.fontEncryptionEnabled ?? false,
    fontEncryptionNumbers: configure?.fontEncryptionNumbers ?? true,
    fontEncryptionChinese: configure?.fontEncryptionChinese ?? true,
    fontEncryptionGlobal: configure?.fontEncryptionGlobal ?? false,
    fontEncryptionOcrNoise: configure?.fontEncryptionOcrNoise ?? false,
  });

  // ===== 通用方法 =====
  

   /**
   * 持久化配置到 storage
   */
   function saveToStorage<T>(key: keyof StorageConfig, value: T): void {
    const storageConfigure = $storage.configure || {} as StorageConfig;
    storageConfigure[key] = value as never;
    $storage.configure = storageConfigure;
  }

  /**
   * 切换 HTML 类名
   */
  function toggleHtmlClass(add: boolean, className: string): void {
    const htmlEl = document.querySelector("html");
    if (add) {
      htmlEl?.classList.add(className);
    } else {
      htmlEl?.classList.remove(className);
    }
  }

  /**
   * 设置 CSS 变量
   */
  function setCssVariable(name: string, value: string): void {
    document.body.style.setProperty(name, value);
  }

  // ===== 布局参数设置 =====
  
  function setContentMargin(value: number): void {
    settings.contentMargin = value;
    saveToStorage("contentMargin", value);
    setCssVariable("--contentMargin", `${value}px`);
  }

  function setLayoutRadius(value: number): void {
    settings.layoutRadius = value;
    saveToStorage("layoutRadius", value);
    setCssVariable("--layoutRadius", `${value}px`);
  }

  function setLayoutBlur(value: number): void {
    settings.layoutBlur = value;
    saveToStorage("layoutBlur", value);
    setCssVariable("--layoutBlur", `${value}px`);
  }

  // ===== 视觉效果设置 =====
  
  function setGreyMode(value: boolean): void {
    settings.greyVal = value;
    toggleHtmlClass(value, "html-grey");
    saveToStorage("grey", value);
  }

  function setWeakMode(value: boolean): void {
    settings.weakVal = value;
    toggleHtmlClass(value, "html-weakness");
    saveToStorage("weak", value);
  }

  function setInvertMode(value: boolean): void {
    settings.invertVal = value;
    toggleHtmlClass(value, "html-invert");
    saveToStorage("invert", value);
  }

  function setMonochromeMode(value: boolean): void {
    settings.monochromeVal = value;
    toggleHtmlClass(value, "html-monochrome");
    saveToStorage("monochrome", value);
  }

  // ===== 界面元素设置 =====
  
  function setHideTabs(value: boolean): void {
    settings.tabsVal = value;
    saveToStorage("hideTabs", value);
    emitter.emit("tagViewsChange", value as unknown as string);
  }

  function setHideFooter(value: boolean): void {
    settings.hideFooter = value;
    saveToStorage("hideFooter", value);
    emitter.emit("hideFooterChange", value);
  }

  function setHideHeader(value: boolean): void {
    settings.hideHeader = value;
    saveToStorage("hideHeader", value);
    emitter.emit("hideHeaderChange", value);
  }

  function setShowLogo(value: boolean): void {
    settings.showLogo = value;
    saveToStorage("showLogo", value);
    emitter.emit("logoChange", value);
  }

  function setShowBreadcrumb(value: boolean): void {
    settings.showBreadcrumb = value;
    saveToStorage("showBreadcrumb", value);
    emitter.emit("breadcrumbChange", value);
  }

  function setBreadcrumbMode(iconOnly: boolean): void {
    settings.breadcrumbIconOnly = iconOnly;
    saveToStorage("breadcrumbIconOnly", iconOnly);
    emitter.emit("breadcrumbModeChange", iconOnly ? "icon" : "icon-text");
  }

  function setShowTagIcon(value: boolean): void {
    settings.showTagIcon = value;
    saveToStorage("showTagIcon", value);
    emitter.emit("showTagIconChange", value);
  }

  // ===== 高级功能设置 =====
  
  function setKeepAlive(value: boolean): void {
    settings.keepAlive = value;
    saveToStorage("keepAlive", value);
    emitter.emit("keepAliveChange", value);
  }

  function setDebugMode(value: boolean): void {
    settings.debugMode = value;
    saveToStorage("debugMode", value);
    emitter.emit("debugModeChange", value);
  }

  function setMenuTransition(value: boolean): void {
    settings.menuTransition = value;
    saveToStorage("menuTransition", value);
    emitter.emit("menuTransitionChange", value);
  }

  function setTransitionType(value: TransitionType): void {
    settings.transitionType = value;
    saveToStorage("transitionType", value);
    emitter.emit("transitionTypeChange", value);
  }

  // ===== 菜单设置 =====
  
  function setShowNewMenu(value: boolean): void {
    settings.showNewMenu = value;
    saveToStorage("showNewMenu", value);
  }

  function setNewMenuText(value: string): void {
    settings.newMenuText = value;
    saveToStorage("newMenuText", value);
  }

  function setNewMenuTimeLimit(value: number): void {
    settings.newMenuTimeLimit = value;
    saveToStorage("newMenuTimeLimit", value);
  }

  function setNewMenuAnimation(value: string): void {
    settings.newMenuAnimation = value;
    saveToStorage("newMenuAnimation", value);
  }

  // ===== 消息弹窗设置 =====
  
  function setMessagePopupEnabled(value: boolean): void {
    settings.messagePopupEnabled = value;
    saveToStorage("messagePopupEnabled", value);
    emitter.emit("messagePopupConfigChange");
  }

  function setMessagePopupPosition(value: string): void {
    settings.messagePopupPosition = value;
    saveToStorage("messagePopupPosition", value);
    emitter.emit("messagePopupConfigChange");
  }

  function setMessagePopupDuration(value: number): void {
    settings.messagePopupDuration = value;
    saveToStorage("messagePopupDuration", value);
    emitter.emit("messagePopupConfigChange");
  }

  // ===== 字体加密设置 =====
  
  function setFontEncryptionEnabled(value: boolean): void {
    settings.fontEncryptionEnabled = value;
    saveToStorage("fontEncryptionEnabled", value);
    emitter.emit("fontEncryptionChange", {
      enabled: value,
      encryptNumbers: settings.fontEncryptionNumbers,
      encryptChinese: settings.fontEncryptionChinese,
      applyGlobal: settings.fontEncryptionGlobal,
    });
  }

  function setFontEncryptionNumbers(value: boolean): void {
    settings.fontEncryptionNumbers = value;
    saveToStorage("fontEncryptionNumbers", value);
    emitter.emit("fontEncryptionChange", {
      enabled: settings.fontEncryptionEnabled,
      encryptNumbers: value,
      encryptChinese: settings.fontEncryptionChinese,
      applyGlobal: settings.fontEncryptionGlobal,
    });
  }

  function setFontEncryptionChinese(value: boolean): void {
    settings.fontEncryptionChinese = value;
    saveToStorage("fontEncryptionChinese", value);
    emitter.emit("fontEncryptionChange", {
      enabled: settings.fontEncryptionEnabled,
      encryptNumbers: settings.fontEncryptionNumbers,
      encryptChinese: value,
      applyGlobal: settings.fontEncryptionGlobal,
    });
  }

  function setFontEncryptionGlobal(value: boolean): void {
    settings.fontEncryptionGlobal = value;
    saveToStorage("fontEncryptionGlobal", value);
    emitter.emit("fontEncryptionChange", {
      enabled: settings.fontEncryptionEnabled,
      encryptNumbers: settings.fontEncryptionNumbers,
      encryptChinese: settings.fontEncryptionChinese,
      applyGlobal: value,
    });
  }

  function setFontEncryptionOcrNoise(value: boolean): void {
    settings.fontEncryptionOcrNoise = value;
    saveToStorage("fontEncryptionOcrNoise", value);
    emitter.emit("fontEncryptionChange", {
      enabled: settings.fontEncryptionEnabled,
      encryptNumbers: settings.fontEncryptionNumbers,
      encryptChinese: settings.fontEncryptionChinese,
      applyGlobal: settings.fontEncryptionGlobal,
      ocrNoise: value,
    });
  }

  // ===== 重置功能 =====
  
  function resetToDefault(): void {
    // 重置所有设置到默认值
    setContentMargin(16);
    setLayoutRadius(10);
    setLayoutBlur(4);
    setGreyMode(false);
    setWeakMode(false);
    setInvertMode(false);
    setMonochromeMode(false);
    setHideTabs(false);
    setHideFooter(true);
    setShowLogo(true);
    setKeepAlive(true);
    setDebugMode(false);
    setMenuTransition(false);
  }

  return {
    // 状态
    settings,
    // 布局参数
    setContentMargin,
    setLayoutRadius,
    setLayoutBlur,
    // 视觉效果
    setGreyMode,
    setWeakMode,
    setInvertMode,
    setMonochromeMode,
    // 界面元素
    setHideTabs,
    setHideFooter,
    setHideHeader,
    setShowLogo,
    setShowBreadcrumb,
    setBreadcrumbMode,
    setShowTagIcon,
    // 高级功能
    setKeepAlive,
    setDebugMode,
    setMenuTransition,
    setTransitionType,
    // 菜单设置
    setShowNewMenu,
    setNewMenuText,
    setNewMenuTimeLimit,
    setNewMenuAnimation,
    // 消息弹窗
    setMessagePopupEnabled,
    setMessagePopupPosition,
    setMessagePopupDuration,
    // 字体加密
    setFontEncryptionEnabled,
    setFontEncryptionNumbers,
    setFontEncryptionChinese,
    setFontEncryptionGlobal,
    setFontEncryptionOcrNoise,
    // 重置
    resetToDefault,
    // 工具方法
    saveToStorage,
    toggleHtmlClass,
    setCssVariable,
  };
}

/** 布局类型 */
type LayoutType =
  | "vertical"
  | "horizontal"
  | "mix"
  | "hover"
  | "double"
  | "mobile";

/**
 * BaseSetting 组件逻辑
 * @description 从 BaseSetting.vue 提取的主题/布局/节日主题相关逻辑
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
  } = useDataThemeChange();

  // ===== 响应式状态 =====
  const configure = ($storage?.configure ?? {}) as StorageConfig;
  const markValue = ref<StorageConfig["showModel"]>(configure?.showModel ?? "chrome");
  const logoVal = ref<boolean>(configure?.showLogo ?? true);
  const cardBodyVal = ref<boolean>(configure?.cardBody ?? true);
  const cardColorMode = ref<StorageConfig["cardColorMode"]>(configure?.cardColorMode ?? "all");
  const previewInput = ref<string>("");
  const previewSwitch = ref<boolean>(true);
  const previewSlider = ref<number>(50);
  const previewCheck = ref<boolean>(true);
  const previewRadio = ref<string>("1");

  // 布局模式 refs
  const mixRef = ref<any>();
  const verticalRef = ref<any>();
  const horizontalRef = ref<any>();
  const hoverRef = ref<any>();
  const mobileRef = ref<any>();
  const doubleRef = ref<any>();

  // Tippy 实例管理
  const tippyInstances = ref<any[]>([]);

  // ===== 计算属性 =====

  /** 判断当前是否为非默认主题 */
  const isNonDefaultTheme = computed(() => {
    const currentTheme = ($storage?.configure?.systemTheme || "default") as string;
    return currentTheme !== "default";
  });

  /** 获取当前环境 */
  const currentEnv = import.meta.env.MODE || "production";
  const isDevelopment = currentEnv === "development" || import.meta.env.DEV;
  const isTest = currentEnv === "test";

  /** 获取用户角色列表 */
  const userRoles = computed(() => {
    const roles = ($storage as any)?.user?.roles || ($storage as any)?.userInfo?.roles || [];
    return Array.isArray(roles) ? roles : [];
  });

  /** 节日主题列表 */
  const festivalThemesList = computed(() => {
    const enableFestivalTheme =
      $storage?.configure?.enableFestivalTheme ??
      getConfig().EnableFestivalTheme ??
      false;

    const themes = getAvailableThemes(
      enableFestivalTheme,
      userRoles.value,
      isDevelopment,
      isTest,
    );

    return themes.map((theme) => ({
      color: theme.color || "#409EFF",
      themeColor: theme.key,
      name: theme.name,
      description: theme.description,
      icon: theme.icon || "ri:palette-line",
      type: theme.type,
      key: theme.key,
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
      if (current === layoutTheme.value.theme && layoutTheme.value.theme !== "light") {
        return "#fff";
      }
      if (current === layoutTheme.value.theme && layoutTheme.value.theme === "light") {
        return "#1d2b45";
      }
      return "transparent";
    };
  });

  // ===== 工具函数 =====

  /**
   * 切换系统主题皮肤
   * @param themeKey 主题键值
   * @param showMessage 是否显示消息
   */
  function switchSystemTheme(themeKey: string, showMessage: boolean = true): void {
    const currentTheme = ($storage?.configure?.systemTheme || "default") as string;
    if (currentTheme === themeKey) {
      return;
    }

    document.documentElement.setAttribute("data-skin", themeKey);

    // 如果切换到非默认主题，强制切换到浅色模式
    if (themeKey !== "default") {
      dataTheme.value = false;
      dataThemeChange("light");
    }

    saveToStorage("systemTheme", themeKey as any);
    emitter.emit("systemThemeChange", themeKey);

    if (!showMessage) {
      return;
    }

    const themeName =
      themeKey === "default"
        ? "默认"
        : festivalThemesList.value.find((item) => item.themeColor === themeKey)?.name || themeKey;
    ElMessage.success(`已切换到${themeName}主题`);
  }

  /**
   * 节日主题自动切换设置
   */
  function festivalThemeChange(value: boolean): void {
    saveToStorage("enableFestivalTheme", value);

    if (value) {
      const festivalTheme = detectFestivalTheme();
      if (festivalTheme) {
        switchSystemTheme(festivalTheme.key, true);
        return;
      }
      switchSystemTheme("default", true);
      return;
    }

    ElMessage.success(t("panel.festivalThemeDisabled"));
  }

  /**
   * 设置导航模式
   * @description 对非法值兜底到 vertical
   */
  function setLayoutModel(layout: string): void {
    const fallbackLayout: LayoutType = "vertical";
    const validLayouts: LayoutType[] = [
      "vertical",
      "horizontal",
      "mix",
      "hover",
      "double",
      "mobile",
    ];
    const targetLayout = (validLayouts as string[]).includes(layout)
      ? (layout as LayoutType)
      : fallbackLayout;

    layoutTheme.value.layout = targetLayout as any;
    window.document.body.setAttribute("layout", targetLayout);
    $storage.layout = {
      layout: targetLayout as any,
      theme: layoutTheme.value.theme,
      darkMode: $storage.layout?.darkMode,
      sidebarStatus: $storage.layout?.sidebarStatus,
      epThemeColor: $storage.layout?.epThemeColor,
      themeColor: $storage.layout?.themeColor,
      overallStyle: $storage.layout?.overallStyle,
    };
    useAppStoreHook().setLayout(targetLayout);
  }

  /**
   * 系统主题监听相关
   */
  const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

  /** 根据操作系统主题设置平台整体风格 */
  function updateTheme(): void {
    if (overallStyle.value !== "system") {
      return;
    }

    dataTheme.value = mediaQueryList.matches;
    dataThemeChange(overallStyle.value);
  }

  function removeMatchMedia(): void {
    mediaQueryList.removeEventListener("change", updateTheme);
  }

  /** 监听操作系统主题改变 */
  function watchSystemThemeChange(): void {
    updateTheme();
    removeMatchMedia();
    mediaQueryList.addEventListener("change", updateTheme);
  }

  /**
   * 初始化主题
   */
  function initializeTheme(): void {
    const savedTheme = $storage?.configure?.systemTheme;
    const enableFestivalTheme =
      $storage?.configure?.enableFestivalTheme ??
      getConfig().EnableFestivalTheme ??
      false;

    if (enableFestivalTheme) {
      const festivalTheme = detectFestivalTheme();
      if (festivalTheme) {
        switchSystemTheme(festivalTheme.key, false);
        return;
      }
    }

    if (savedTheme && savedTheme !== "default") {
      switchSystemTheme(savedTheme as any, false);
    }
  }

  /**
   * Tippy 实例管理
   */
  function collectTippyInstances(): void {
    nextTick(() => {
      const elementsWithTippy = [
        verticalRef.value,
        horizontalRef.value,
        mixRef.value,
        hoverRef.value,
        doubleRef.value,
      ].filter(Boolean);

      elementsWithTippy.forEach((element: any) => {
        if (element?._tippy) {
          tippyInstances.value.push(element._tippy);
        }
      });
    });
  }

  function destroyAllTippyInstances(): void {
    const elementsWithTippy = [
      verticalRef.value,
      horizontalRef.value,
      mixRef.value,
      hoverRef.value,
      doubleRef.value,
    ].filter(Boolean);

    elementsWithTippy.forEach((element: any) => {
      element?._tippy?.destroy?.();
    });

    tippyInstances.value.forEach((instance: any) => {
      instance?.destroy?.();
    });

    tippyInstances.value = [];

    const tippyElements = document.querySelectorAll("[data-tippy-root]");
    tippyElements.forEach((element) => {
      element.parentNode?.removeChild(element);
    });
  }

  /**
   * 布局模式选择相关
   */
  function setFalse(doms: Array<any>): void {
    doms.forEach((dom) => {
      toggleClass(false, "is-select", unref(dom));
    });
  }

  const debouncedSetFalse = debounce((doms: Array<any>) => setFalse(doms), 50);

  // 监听布局模式变化
  watch(
    () => $storage.layout,
    (newLayout) => {
      const currentLayout = (newLayout?.layout || "vertical") as LayoutType;
      switch (currentLayout) {
        case "vertical":
          toggleClass(true, "is-select", unref(verticalRef));
          debouncedSetFalse([horizontalRef, mixRef, hoverRef, doubleRef]);
          break;
        case "horizontal":
          toggleClass(true, "is-select", unref(horizontalRef));
          debouncedSetFalse([verticalRef, mixRef, hoverRef, doubleRef]);
          break;
        case "mix":
          toggleClass(true, "is-select", unref(mixRef));
          debouncedSetFalse([verticalRef, horizontalRef, hoverRef, doubleRef]);
          break;
        case "hover":
          toggleClass(true, "is-select", unref(hoverRef));
          debouncedSetFalse([verticalRef, horizontalRef, mixRef, doubleRef]);
          break;
        case "double":
          toggleClass(true, "is-select", unref(doubleRef));
          debouncedSetFalse([verticalRef, horizontalRef, mixRef, hoverRef]);
          break;
        default:
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
      saveToStorage("enableFestivalTheme", false);
      localStorage.setItem(MIGRATION_KEY, "true");
    }
  });

  onMounted(() => {
    collectTippyInstances();
    emitter.on("settingPanelClosed", () => {
      destroyAllTippyInstances();
    });
  });

  onUnmounted(() => {
    removeMatchMedia();
    destroyAllTippyInstances();
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
    saveToStorage ,
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

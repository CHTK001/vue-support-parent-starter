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
  // 消息按钮
  showMessage: boolean;
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
    transitionType: (configure?.transitionType ?? 'fade-slide') as TransitionType,
    // ... 其他默认值保持不变
    // 新增动画配置默认值
    themeAnimationMode: (configure?.themeAnimationMode ?? 'fixed') as 'random' | 'fixed' | 'disabled',
    themeAnimationDirection: (configure?.themeAnimationDirection ?? 'top-right') as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center' | 'left' | 'right' | 'top' | 'bottom',
    
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
    showMessage: configure?.showMessage ?? getConfig().ShowBarMessage ?? true,
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

  // ===== 消息按钮 / 弹窗设置 =====

  function setShowMessage(value: boolean): void {
    settings.showMessage = value;
    saveToStorage("showMessage", value);
    emitter.emit("showMessageChange", value);
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
    // 消息
    setShowMessage,
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

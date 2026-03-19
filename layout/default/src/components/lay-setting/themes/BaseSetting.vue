<script setup lang="ts">
import { getConfig } from "@repo/config";
import { emitter, useAppStoreHook, useMultiTagsStoreHook } from "@repo/core";
import { aesEncrypt, aesDecrypt } from "@repo/utils";
import {
  computed,
  nextTick,
  onBeforeMount,
  onUnmounted,
  reactive,
  ref,
  unref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useNav } from "../../../hooks/useNav";
import LayPanel from "../../lay-panel/index.vue";

import { debounce, isNumber, storageLocal, useGlobal } from "@pureadmin/utils";
import Segmented, {
  type OptionsType,
} from "@repo/components/ReSegmented/index";
import { http, message, type ReturnResult } from "@repo/utils";
import { useThemeAnimation } from "../../../hooks/useThemeAnimation";
import { useTheme } from "../../../hooks/useThemeComponent";
import { useThemeStore } from "../../../stores/themeStore";
import { getThemeComponents } from "../components";

import DarkIcon from "@repo/assets/svg/dark.svg?component";
import DayIcon from "@repo/assets/svg/day.svg?component";
import DoubleIcon from "@repo/assets/svg/double.svg?component";
import DrawerIcon from "@repo/assets/svg/drawer.svg?component";
import HorizontalIcon from "@repo/assets/svg/horizontal.svg?component";
import HoverIcon from "@repo/assets/svg/hover.svg?component";
import MixIcon from "@repo/assets/svg/mix.svg?component";
import MobileIcon from "@repo/assets/svg/mobile.svg?component";
import SystemIcon from "@repo/assets/svg/system.svg?component";
import VerticalIcon from "@repo/assets/svg/vertical.svg?component";

const { t } = useI18n();
const { device } = useNav();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const themeStore = useThemeStore();
const {
  // 全局 theme 统一出口
  isDark,
  dataTheme,
  overallStyle,
  layoutTheme,
  themeColors,
  applyOverallStyle,
  setLayoutThemeColor,
  toggleClass,
  // 性能监控相关
  fpsMonitorEnabled,
  memoryMonitorEnabled,
  cpuMonitorEnabled,
  bandwidthMonitorEnabled,
  batteryMonitorEnabled,
  bluetoothMonitorEnabled,
  screenMonitorEnabled,
  performanceMonitorPosition,
  performanceMonitorMode,
  performanceMonitorLayout,
  performanceMonitorDirection,
  isPerformanceMonitorVisible,
} = useTheme();

const themeSectionComponents = computed(() =>
  getThemeComponents(themeStore.currentTheme),
);

// 预览数据

// 判断当前是否为非默认皮肤（节日主题优先级高于页签风格和整体风格）
// 使用 themeStore.currentTheme（系统皮肤，如 default/8bit）而非 layoutTheme.theme（主题色，如 light/saucePurple）
const isNonDefaultTheme = computed(() => {
  return themeStore.currentTheme !== "default";
});

const handleOverallStyleChange = (theme: any) => {
  useThemeAnimation(() => {
    // 直接从 option.theme 读取整体风格值（light / dark / system）
    const style = theme.option.theme as "light" | "dark" | "system";
    overallStyle.value = style;
    if (style === "system") {
      // 跟随系统：监听 prefers-color-scheme 变化
      watchSystemThemeChange();
    } else {
      dataTheme.value = style === "dark";
      applyOverallStyle(style);
    }
  });
};

const handleSetLayoutThemeColor = (color: string, event: MouseEvent) => {
  useThemeAnimation(() => {
    setLayoutThemeColor(color);
  }, event);
};

/* body添加layout属性，作用于src/style/sidebar.scss */
if (unref(layoutTheme)) {
  const layout = unref(layoutTheme).layout;
  const theme = unref(layoutTheme).theme;
  document.documentElement.setAttribute("data-theme", theme);
  setLayoutModel(layout);
}

// 确保默认选中白色主题
if (!layoutTheme.value.theme) {
  setLayoutThemeColor("light");
}

/** 默认灵动模式 */
const markValue = ref($storage.configure?.showModel ?? "chrome");

const logoVal = ref($storage.configure?.showLogo ?? true);
const cardBodyVal = ref($storage.configure?.cardBody ?? true);

/** 会话超时默认值（分钟） */
const DEFAULT_SESSION_TIMEOUT_MINUTES = 30;
/** 会话超时最小值（分钟） */
const MIN_SESSION_TIMEOUT_MINUTES = 1;
/** 会话超时最大值（分钟） */
const MAX_SESSION_TIMEOUT_MINUTES = 24 * 60;

function normalizeSessionTimeoutMinutes(rawSeconds: unknown): number {
  const seconds = Number(rawSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return DEFAULT_SESSION_TIMEOUT_MINUTES;
  }
  const minutes = Math.round(seconds / 60);
  return Math.min(
    MAX_SESSION_TIMEOUT_MINUTES,
    Math.max(MIN_SESSION_TIMEOUT_MINUTES, minutes),
  );
}

type NewMenuAnimationType = "bounce" | "pulse" | "shake" | "none";

function normalizeNewMenuAnimation(raw: unknown): NewMenuAnimationType {
  const value = String(raw || "");
  if (
    value === "bounce" ||
    value === "pulse" ||
    value === "shake" ||
    value === "none"
  ) {
    return value;
  }
  return "bounce";
}

const settings = reactive({
  menuTransition: $storage.configure.menuTransition,
  transitionType: $storage.configure.transitionType ?? "fade-slide",
  contentMargin: $storage.configure.contentMargin,
  layoutRadius: $storage.configure.layoutRadius,
  greyVal: $storage.configure.grey,
  weakVal: $storage.configure.weak,
  invertVal: $storage.configure.invert ?? false,
  monochromeVal: $storage.configure.monochrome ?? false,
  tabsVal: $storage.configure.hideTabs,
  cardBody: $storage.configure.cardBody,
  showLogo: $storage.configure.showLogo,
  menuAnimation: $storage.configure.MenuAnimation ?? true,
  forceNewMenu: $storage.configure.ForceNewMenu ?? false,
  showModel: $storage.configure.showModel,
  hideFooter: $storage.configure.hideFooter,
  multiTagsCache: $storage.configure.multiTagsCache ?? true,
  stretch: $storage.configure.stretch,
  // 高级功能
  keepAlive: $storage.configure.keepAlive ?? true,
  debugMode: $storage.configure.debugMode ?? false,
  autoLogout:
    $storage.configure?.autoLogout ?? getConfig().Session?.autoLogout ?? false,
  sessionTimeoutMinutes: normalizeSessionTimeoutMinutes(
    $storage.configure?.sessionTimeout ?? getConfig().Session?.timeout ?? 0,
  ),
  // 面包屑导航
  showBreadcrumb: $storage.configure.showBreadcrumb ?? true,
  breadcrumbIconOnly: $storage.configure.breadcrumbIconOnly ?? false,
  // 标签页图标
  showTagIcon: $storage.configure.showTagIcon ?? true,
  // 菜单设置相关
  showNewMenu: $storage.configure.showNewMenu ?? true,
  newMenuText: $storage.configure.newMenuText ?? "new",
  newMenuTimeLimit: $storage.configure.newMenuTimeLimit ?? 168,
  // 新菜单动画
  newMenuAnimation: normalizeNewMenuAnimation(
    $storage.configure.newMenuAnimation ?? "bounce",
  ),
  // 新菜单标识类型和颜色
  newMenuBadgeType: $storage.configure.newMenuBadgeType ?? "primary",
  newMenuBadgeColor: $storage.configure.newMenuBadgeColor ?? "#409eff",
  // 双栏导航设置相关
  doubleNavExpandMode: $storage.configure.doubleNavExpandMode ?? "auto",
  doubleNavAutoExpandAll: $storage.configure.doubleNavAutoExpandAll ?? true,
  // 抽屉导航设置相关
  drawerHamburgerPosition: $storage.configure.drawerHamburgerPosition ?? "top-left",
  // 顶部工具栏（Header）
  showSearch:
    $storage.configure?.showSearch ?? getConfig().ShowBarSearch ?? true,
  showFullscreen: $storage.configure?.showFullscreen ?? true,
  showHeaderClock:
    $storage.configure?.showHeaderClock ??
    getConfig().PageBehavior?.showHeaderClock ??
    false,
  headerClockSecondEnabled:
    $storage.configure?.headerClockSecondEnabled ??
    getConfig().PageBehavior?.headerClockSecondEnabled ??
    false,
  headerClockSecondTimezone:
    $storage.configure?.headerClockSecondTimezone ??
    getConfig().PageBehavior?.headerClockSecondTimezone ??
    "UTC",
  // 消息中心（Header）
  showMessage:
    $storage.configure?.showMessage ?? getConfig().ShowBarMessage ?? true,
  // 默认下拉弹出位置调整为顶部右侧
  messageDropdownPosition:
    $storage.configure?.messageDropdownPosition ?? "top-right",
  // AI 助手设置
  aiChatTheme: $storage.configure.aiChatTheme ?? "default",
  aiChatEnabled:
    $storage.configure?.aiChatEnabled ?? getConfig().ShowAiChat ?? false,
  aiChatPosition: $storage.configure?.aiChatPosition ?? "bottom-right",
  aiChatSkin: $storage.configure?.aiChatSkin ?? "robot",
  aiChatApiKey: decryptSensitive($storage.configure?.aiChatApiKey ?? ""),
  aiChatApiUrl: decryptSensitive($storage.configure?.aiChatApiUrl ?? ""),
  aiChatVendor: $storage.configure?.aiChatVendor ?? "chrome",
  aiChatModel: $storage.configure?.aiChatModel ?? "Qwen/Qwen2.5-1.5B-Instruct",
  // 模式字段：webllm / chrome / vendor，旧数据迁移在下方处理
  aiChatMode: (() => {
    const saved = $storage.configure?.aiChatMode;
    if (saved === "webllm" || saved === "chrome" || saved === "vendor") return saved;
    // 旧数据迁移：根据 aiChatVendor 推断
    const v = $storage.configure?.aiChatVendor ?? "chrome";
    if (v === "hf") return "webllm";
    if (v === "chrome") return "chrome";
    return "vendor";
  })(),
  // 主题皮肤设置（优先从本地存储读取，其次从配置文件，最后默认为 false）
  enableFestivalTheme:
    $storage.configure?.enableFestivalTheme ??
    getConfig().EnableFestivalTheme ??
    false,
  // 字体加密设置（默认开启，保证初始环境即具备防护能力）
  fontEncryptionEnabled: $storage.configure?.fontEncryptionEnabled ?? true,
  fontEncryptionNumbers: $storage.configure?.fontEncryptionNumbers ?? true,
  fontEncryptionChinese: $storage.configure?.fontEncryptionChinese ?? true,
  fontEncryptionGlobal: $storage.configure?.fontEncryptionGlobal ?? true,
  fontEncryptionOcrNoise: $storage.configure?.fontEncryptionOcrNoise ?? true,
  // 主题切换动画设置
  themeAnimationMode: $storage.configure?.themeAnimationMode ?? "fixed",
  themeAnimationDirection:
    $storage.configure?.themeAnimationDirection ?? "top-right",
  // 无障碍与缩放
  screenReaderMode:
    $storage.configure?.screenReaderMode ??
    getConfig().PageBehavior?.screenReaderMode ??
    false,
  highContrastMode:
    $storage.configure?.highContrastMode ??
    getConfig().PageBehavior?.highContrastMode ??
    false,
  uiScale:
    $storage.configure?.uiScale ?? getConfig().PageBehavior?.uiScale ?? 1,
  // DevTools 精简版（仅开发/测试环境展示）
  devLiteTools:
    $storage.configure?.devLiteTools ??
    getConfig().PageBehavior?.devLiteTools ??
    false,
  devRuler:
    $storage.configure?.devRuler ?? getConfig().PageBehavior?.devRuler ?? false,
  devGrid:
    $storage.configure?.devGrid ?? getConfig().PageBehavior?.devGrid ?? false,
  devHoverInspector:
    $storage.configure?.devHoverInspector ??
    getConfig().PageBehavior?.devHoverInspector ??
    false,
  // 加载动画样式
  loaderStyle: localStorage.getItem("sys-loader-style") || "default",
  // 语音朗读（无障碍）
  voiceReadEnabled: $storage.configure?.voiceReadEnabled ?? false,
  // 热点工具（热力图）
  devHeatmap: $storage.configure?.devHeatmap ?? false,
});

/** 主题动画模式选项 */
const themeAnimationModeOptions = computed<Array<OptionsType>>(() => [
  { label: "随机", value: "random" },
  { label: "固定", value: "fixed" },
  { label: "禁用", value: "disabled" },
]);

/** 过渡动画类型选项 */
const transitionTypeOptions = computed<Array<OptionsType>>(() => [
  { label: "滑动淡入", tip: "平滑的上下滑动效果", value: "fade-slide" },
  { label: "缩放淡入", tip: "带缩放的淡入淡出效果", value: "fade-scale" },
  { label: "纯淡入", tip: "仅淡入淡出无位移", value: "fade-only" },
  { label: "右侧滑入", tip: "从右侧滑入的效果", value: "slide-right" },
]);

/** 卡片颜色模式配置 */
const cardColorMode = ref($storage.configure?.cardColorMode ?? "all");

const cardColorOptions = computed<Array<OptionsType>>(() => {
  return [
    {
      label: t("panel.cardColorAll"),
      tip: t("panel.cardColorAllTip"),
      value: "all",
    },
    {
      label: t("panel.cardColorThird"),
      tip: t("panel.cardColorThirdTip"),
      value: "third",
    },
    {
      label: t("panel.cardColorWhite"),
      tip: t("panel.cardColorWhiteTip"),
      value: "white",
    },
  ];
});

const getThemeColorStyle = computed(() => {
  return (color: string) => {
    return { background: color };
  };
});

/**
 * 获取当前环境和用户信息
 */
const currentEnv = import.meta.env.MODE || "production";
const isDevelopment = currentEnv === "development" || import.meta.env.DEV;
const isTest = currentEnv === "test";

// 主题列表通过 getAvailableThemes 提供给主题切换组件使用，节日主题已从主题配置中移除

/** 当网页整体为暗色风格时不显示亮白色主题配色切换选项 */
const showThemeColors = computed(() => {
  return (themeColor: string) => {
    return themeColor === "light" && isDark.value ? false : true;
  };
});

/** 敏感字段列表，写入 localStorage 时加密 */
const SENSITIVE_KEYS = ["aiChatApiKey", "aiChatApiUrl"];

function encryptSensitive(val: string): string {
  return aesEncrypt(val, getConfig().StorageKey);
}

function decryptSensitive(val: string): string {
  return aesDecrypt(val, getConfig().StorageKey);
}

function storageConfigureChange<T>(key: string, val: T): void {
  const storageConfigure = $storage.configure || {};
  // 敏感字段写入前加密
  const storeVal = SENSITIVE_KEYS.includes(key) && typeof val === "string"
    ? encryptSensitive(val) as unknown as T
    : val;
  storageConfigure[key] = storeVal;
  $storage.configure = storageConfigure;

  // 同步写入本地存储，保证刷新后 useThemeAnimation 等能读取到最新配置
  try {
    storageLocal().setItem("responsive-configure", storageConfigure);
  } catch (error) {
    // 本地存储异常时不影响正常功能
    console.warn("[BaseSetting] 写入本地配置失败:", error);
  }
}

/** 设置内容宽度 */
const contentMarginChange = (value: number): void => {
  storageConfigureChange("contentMargin", value);
  document.body.style.setProperty("--contentMargin", value + "px");
};

/** 设置内容radius */
const layoutRadiusChange = (value: number): void => {
  storageConfigureChange("layoutRadius", value);
  document.body.style.setProperty("--layoutRadius", value + "px");
};
// layoutBlurChange removed

/** 切换菜单动画设置 */
const menuAnimationChange = (value: boolean): void => {
  storageConfigureChange("MenuAnimation", value);
  emitter.emit("menuAnimationChange", value);
};

/** 切换动画类型 */
const transitionTypeChange = ({ option }: { option: OptionsType }): void => {
  const value = option.value as string;
  settings.transitionType = value;
  storageConfigureChange("transitionType", value);
  emitter.emit("transitionTypeChange", value);
};

/** 灰色模式设置 */
const greyChange = (value: boolean): void => {
  const htmlEl = document.querySelector("html");
  toggleClass(settings.greyVal, "html-grey", htmlEl);
  storageConfigureChange("grey", value);
};

/** 色弱模式设置 */
const weekChange = (value: boolean): void => {
  const htmlEl = document.querySelector("html");
  toggleClass(settings.weakVal, "html-weakness", htmlEl);
  storageConfigureChange("weak", value);
};

/** 反色模式设置 */
const invertChange = (value: boolean): void => {
  const htmlEl = document.querySelector("html");
  toggleClass(settings.invertVal, "html-invert", htmlEl);
  storageConfigureChange("invert", value);
};

/** 黑白模式设置 */
const monochromeChange = (value: boolean): void => {
  const htmlEl = document.querySelector("html");
  toggleClass(settings.monochromeVal, "html-monochrome", htmlEl);
  storageConfigureChange("monochrome", value);
};

/**
 * 切换系统主题皮肤
 * @param themeKey 主题键值
 * @param showMessage 是否显示消息，默认为true
 */
const switchSystemTheme = (
  themeKey: string,
  showMessage: boolean = true,
): void => {
  const currentTheme = $storage.configure?.systemTheme || "default";
  if (currentTheme === themeKey) {
    return;
  }

  useThemeAnimation(() => {
    // 统一通过主题 store 设置，确保 data-skin、class 和样式表一致更新
    themeStore.setTheme(themeKey as any);

    // 如果切换到非默认主题，强制切换到浅色模式，避免深色残留
    if (themeKey !== "default") {
      dataTheme.value = false;
      applyOverallStyle("light");
    }

    // 持久化当前系统主题
    storageConfigureChange("systemTheme", themeKey);
  });

  if (showMessage) {
    const themeName = themeKey === "default" ? "默认" : themeKey;
    message.success(`已切换到${themeName}主题`);
  }
};

/**
 * 加载主题样式表
 * @param themeKey 主题键值
 */
/** 隐藏标签页设置 */
const tagsChange = () => {
  const showVal = settings.tabsVal;
  storageConfigureChange("hideTabs", showVal);
  emitter.emit("tagViewsChange", showVal as unknown as string);
};

/** 隐藏页脚设置 */
const hideFooterChange = () => {
  const hideFooter = settings.hideFooter;
  storageConfigureChange("hideFooter", hideFooter);
  emitter.emit("hideFooterChange", hideFooter);
};

/** 标签页持久化设置 */
const multiTagsCacheChange = () => {
  const multiTagsCache = settings.multiTagsCache;
  storageConfigureChange("multiTagsCache", multiTagsCache);
  useMultiTagsStoreHook().multiTagsCacheChange(multiTagsCache);
};

function onChange({ option }: { option: OptionsType }) {
  const { value } = option;
  markValue.value = value;
  storageConfigureChange("showModel", value);
  emitter.emit("tagViewsShowModel", value);
}

/** 侧边栏Logo */
function logoChange(val?: boolean) {
  // ScSwitch @change 传入新值，优先使用；否则回退到 ref 当前值
  const newVal = val !== undefined ? val : unref(logoVal);
  logoVal.value = newVal;
  storageConfigureChange("showLogo", newVal);
  emitter.emit("logoChange", newVal);
}
/** 卡片Body */
function cardBodyChange(val?: boolean) {
  const newVal = val !== undefined ? val : unref(cardBodyVal);
  cardBodyVal.value = newVal;
  storageConfigureChange("cardBody", newVal);
}

/** 卡片颜色模式变更 */
function onCardColorModeChange({ option }: { option: OptionsType }) {
  const { value } = option;
  cardColorMode.value = value;
  storageConfigureChange("cardColorMode", value);
}

/** 数字输入框调整值函数 */
const adjustValue = (key: string, delta: number): void => {
  const currentValue = settings[key] as number;
  const newValue = Math.max(0, Math.min(100, currentValue + delta));

  if (newValue !== currentValue) {
    settings[key] = newValue;

    // 根据不同的参数调用对应的变更函数
    switch (key) {
      case "contentMargin":
        contentMarginChange(newValue);
        break;
      case "layoutRadius":
        layoutRadiusChange(newValue);
        break;
      // case layoutBlur removed
    }
  }
};

/** 处理数字输入框的键盘事件 */
const handleKeydown = (event: KeyboardEvent, key: string): void => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    adjustValue(key, 1);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    adjustValue(key, -1);
  }
};

/** 处理数字输入框的输入验证 */
const handleInput = (event: Event, key: string): void => {
  const target = event.target as HTMLInputElement;
  let value = parseInt(target.value) || 0;

  // 限制范围
  value = Math.max(0, Math.min(100, value));

  if (value !== settings[key]) {
    settings[key] = value;
    target.value = value.toString();

    // 调用对应的变更函数
    switch (key) {
      case "contentMargin":
        contentMarginChange(value);
        break;
      case "layoutRadius":
        layoutRadiusChange(value);
        break;
    }
  }
};

function setFalse(Doms): any {
  Doms.forEach((v) => {
    toggleClass(false, "is-select", unref(v));
  });
}

/** 页宽 */
const stretchTypeOptions = computed<Array<OptionsType>>(() => {
  return [
    {
      label: t("panel.pureStretchFixed"),
      tip: t("panel.pureStretchFixedTip"),
      value: "fixed",
    },
    {
      label: t("panel.pureStretchCustom"),
      tip: t("panel.pureStretchCustomTip"),
      value: "custom",
    },
  ];
});

const setStretch = (value: number | boolean) => {
  settings.stretch = value;
  storageConfigureChange("stretch", value);
};

/** 页宽开关变更：统一通过 setStretch 写入，保证 Segmented 与开关同步 */
function stretchSwitchChange(enabled: boolean) {
  if (enabled) {
    const current = settings.stretch;
    // 已经是自定义数值则保持不变，否则使用默认宽度 1440
    const next = isNumber(current) ? (current as number) : 1440;
    setStretch(next);
  } else {
    setStretch(false);
  }
}

const stretchTypeChange = ({ option }: { option: OptionsType }) => {
  const { value } = option;
  value === "custom" ? setStretch(1440) : setStretch(false);
};

/** 主题色 激活选择项 */
const themeOptions = computed<Array<OptionsType>>(() => {
  return [
    {
      label: t("panel.pureOverallStyleLight"),
      value: 0,
      icon: DayIcon,
      theme: "light",
      tip: t("panel.pureOverallStyleLightTip"),
      iconAttrs: { fill: isDark.value ? "#fff" : "#000" },
    },
    {
      label: t("panel.pureOverallStyleDark"),
      value: 1,
      icon: DarkIcon,
      theme: "dark",
      tip: t("panel.pureOverallStyleDarkTip"),
      iconAttrs: { fill: isDark.value ? "#fff" : "#000" },
    },
    {
      label: t("panel.pureOverallStyleSystem"),
      value: 2,
      icon: SystemIcon,
      theme: "system",
      tip: t("panel.pureOverallStyleSystemTip"),
      iconAttrs: { fill: isDark.value ? "#fff" : "#000" },
    },
  ];
});

const markOptions = computed<Array<OptionsType>>(() => {
  return [
    {
      label: t("panel.pureTagsStyleSmart"),
      tip: t("panel.pureTagsStyleSmartTip"),
      value: "smart",
    },
    {
      label: t("panel.pureTagsStyleCard"),
      tip: t("panel.pureTagsStyleCardTip"),
      value: "card",
    },
    {
      label: t("panel.pureTagsStyleChrome"),
      tip: t("panel.pureTagsStyleChromeTip"),
      value: "chrome",
    },
    {
      label: "玻璃",
      tip: "Glass Style",
      value: "glass",
    },
  ];
});

/** 设置导航模式 */
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

watch($storage, ({ layout }) => {
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
    case "drawer":
      toggleClass(true, "is-select", unref(drawerRef));
      debounce(setFalse([verticalRef, horizontalRef, mixRef, hoverRef, doubleRef]), 50);
      break;
  }
});

const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

/** 根据操作系统主题设置平台整体风格 */
function updateTheme() {
  if (overallStyle.value !== "system") return;
  if (mediaQueryList.matches) {
    dataTheme.value = true;
  } else {
    dataTheme.value = false;
  }
  applyOverallStyle(overallStyle.value);
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
const initializeTheme = () => {
  const savedTheme = $storage.configure?.systemTheme;

  // 如果有保存的主题且不是 default，则应用该主题
  if (savedTheme && savedTheme !== "default") {
    switchSystemTheme(savedTheme, false); // 初始化时不显示消息
  }
  // 如果没有保存的主题或主题是 default，不做任何操作（使用默认组件）
};

onBeforeMount(() => {
  /* 初始化系统配置 */
  nextTick(() => {
    watchSystemThemeChange();
    settings.greyVal &&
      document.querySelector("html")?.classList.add("html-grey");
    settings.weakVal &&
      document.querySelector("html")?.classList.add("html-weakness");
    settings.invertVal &&
      document.querySelector("html")?.classList.add("html-invert");
    settings.monochromeVal &&
      document.querySelector("html")?.classList.add("html-monochrome");
    settings.tabsVal && tagsChange();
    settings.hideFooter && hideFooterChange();

    // 初始化同步配置
    // 修复：默认值为 true 的配置如果存储中不存在，会导致 UI 显示开启但实际不生效
    // 手动触发一次变更以同步状态
    if (settings.showTagIcon) {
      showTagIconChange();
    }
    if (cardBodyVal.value) {
      cardBodyChange();
    }

    // 初始化主题
    initializeTheme();
  });
});

// 监听菜单动画设置
watch(
  () => settings.menuAnimation,
  (val) => {
    storageConfigureChange("MenuAnimation", val);
    emitter.emit("menuAnimationChange", val);
  },
);

// 监听强制新菜单设置
watch(
  () => settings.forceNewMenu,
  (val) => {
    storageConfigureChange("ForceNewMenu", val);
    // 强制新菜单可能需要触发重渲染，或者组件内部监听
    emitter.emit("forceNewMenuChange", val);
  },
);

const mixRef = ref();
const verticalRef = ref();
const horizontalRef = ref();
const hoverRef = ref();
const mobileRef = ref();
const doubleRef = ref();
const drawerRef = ref();

function showBreadcrumbChange() {
  storageConfigureChange("showBreadcrumb", settings.showBreadcrumb);
  emitter.emit("breadcrumbChange", settings.showBreadcrumb);
}

/**
 * 面包屑显示模式变更
 */
function breadcrumbModeChange() {
  storageConfigureChange("breadcrumbIconOnly", settings.breadcrumbIconOnly);
  emitter.emit(
    "breadcrumbModeChange",
    settings.breadcrumbIconOnly ? "icon" : "icon-text",
  );
}

/**
 * 标签页图标显示变更
 */
function showTagIconChange() {
  storageConfigureChange("showTagIcon", settings.showTagIcon);
  emitter.emit("showTagIconChange", settings.showTagIcon);
}

/**
 * 组件缓存变更
 */
function keepAliveChange() {
  storageConfigureChange("keepAlive", settings.keepAlive);
  emitter.emit("keepAliveChange", settings.keepAlive);
}

function doubleNavExpandModeChange() {
  storageConfigureChange("doubleNavExpandMode", settings.doubleNavExpandMode);
}

function doubleNavAutoExpandAllChange() {
  storageConfigureChange(
    "doubleNavAutoExpandAll",
    settings.doubleNavAutoExpandAll,
  );
}

function drawerHamburgerPositionChange() {
  storageConfigureChange("drawerHamburgerPosition", settings.drawerHamburgerPosition);
  // 实时通知抽屉导航组件更新汉堡按钮位置
  emitter.emit("drawerHamburgerPositionChange", settings.drawerHamburgerPosition);
}

/**
 * AI 助手皮肤主题变更
 */
/**
 * AI 助手启用状态变更
 */
function aiChatEnabledChange(value: boolean) {
  settings.aiChatEnabled = value;
  storageConfigureChange("aiChatEnabled", value);
}

/**
 * AI 助手 API Key 变更
 */
function aiChatApiKeyChange(value: string) {
  settings.aiChatApiKey = value;
  storageConfigureChange("aiChatApiKey", value);
}

/**
 * AI 助手 API URL 变更
 */
function aiChatApiUrlChange(value: string) {
  settings.aiChatApiUrl = value;
  storageConfigureChange("aiChatApiUrl", value);
}

/**
 * AI 模式变更（webllm / chrome / vendor）
 */
function aiChatModeChange(value: string | number | boolean) {
  const mode = String(value) as "webllm" | "chrome" | "vendor";
  settings.aiChatMode = mode;
  storageConfigureChange("aiChatMode", mode);
}

/**
 * AI 厂商变更
 */
function aiChatVendorChange(value: string | number | boolean) {
  const finalValue = (value || settings.aiChatVendor) as
    | "hf"
    | "chrome"
    | "other";
  settings.aiChatVendor = finalValue;
  storageConfigureChange("aiChatVendor", finalValue);
}

/**
 * AI 模型变更（主要用于 Hugging Face / hf-mirror）
 */
function aiChatModelChange(value: string | number | boolean) {
  const finalValue = (value || settings.aiChatModel) as string;
  settings.aiChatModel = finalValue;
  storageConfigureChange("aiChatModel", finalValue);
}

/**
 * AI 机器人皮肤变更
 *
 * AiChatAppearanceSetting 的 change 事件可能传入完整选项对象，这里统一抽取 value 字段，保证始终为字符串 key，
 * 避免出现 skin-[object Object] 导致样式和图标回退到默认机器人。
 */
function aiChatSkinChange(value: string | number | boolean | OptionsType) {
  let finalValue: string;
  if (value && typeof value === "object" && "value" in value) {
    finalValue = String((value as OptionsType).value);
  } else {
    finalValue = String(
      (value as string | number | boolean) || settings.aiChatSkin || "robot",
    );
  }
  settings.aiChatSkin = finalValue;
  storageConfigureChange("aiChatSkin", finalValue);
  emitter.emit("aiChatSkinChange", finalValue);
}

/**
 * 消息中心开关变更
 */
function showMessageChange(value: boolean) {
  settings.showMessage = value;
  storageConfigureChange("showMessage", value);
  emitter.emit("showMessageChange", value);
}

/**
 * 顶部搜索按钮开关变更
 */
function showSearchChange(value: boolean) {
  settings.showSearch = value;
  storageConfigureChange("showSearch", value);
  emitter.emit("showSearchChange", value);
}

/**
 * 顶部全屏按钮开关变更
 */
function showFullscreenChange(value: boolean) {
  settings.showFullscreen = value;
  storageConfigureChange("showFullscreen", value);
  emitter.emit("showFullscreenChange", value);
}

/**
 * 顶部时间显示开关变更
 */
function showHeaderClockChange(value: boolean) {
  settings.showHeaderClock = value;
  storageConfigureChange("showHeaderClock", value);
  emitter.emit("showHeaderClockChange", value);
}

/**
 * 顶部第二时间显示开关变更
 */
function headerClockSecondEnabledChange(value: boolean) {
  settings.headerClockSecondEnabled = value;
  storageConfigureChange("headerClockSecondEnabled", value);
  emitter.emit("headerClockSecondEnabledChange", value);
}

/**
 * 顶部第二时间时区变更
 */
function headerClockSecondTimezoneChange(value: string) {
  settings.headerClockSecondTimezone = value;
  storageConfigureChange("headerClockSecondTimezone", value);
  emitter.emit("headerClockSecondTimezoneChange", value);
}

/**
 * 消息中心下拉弹框位置变更
 */
function messageDropdownPositionChange(value: string) {
  settings.messageDropdownPosition = value as any;
  storageConfigureChange("messageDropdownPosition", value);
  emitter.emit("messageDropdownPositionChange", value);
}

/**
 * 开发模式：发送一条默认测试消息到消息中心
 */
function sendDevDefaultMessage() {
  if (!isDevelopment && !isTest) {
    return;
  }
  const now = new Date();
  const payload = {
    id: now.getTime(),
    title: "开发环境默认测试消息",
    content:
      "这是通过设置面板发送的默认测试消息，用于验证消息中心展示和消息弹窗配置。",
    type: "dev",
    level: "info",
    time: now.toLocaleString(),
  };
  emitter.emit("devMessagePush", payload);
}

/**
 * 调试模式切换
 * @param enabled - 是否启用调试模式
 */
function debugModeChange(enabled: boolean) {
  settings.debugMode = enabled;
  storageConfigureChange("debugMode", enabled);
  // 发送事件到主布局组件控制调试控制台
  emitter.emit("debugModeChange", enabled);
}

// 监听调试模式状态变更（从主布局组件发出）
emitter.on("debugModeChanged", (enabled: boolean) => {
  settings.debugMode = enabled;
  storageConfigureChange("debugMode", enabled);
});

/**
 * 自动退出功能开关
 */
function autoLogoutChange(enabled: boolean) {
  settings.autoLogout = enabled;
  storageConfigureChange("autoLogout", enabled);
  if (!enabled) {
    return;
  }

  // 开启时确保存在有效的超时配置；若未配置则回退到默认值，避免“已开启但永不触发”的误解
  const configuredSeconds = Number(
    $storage.configure?.sessionTimeout ?? getConfig().Session?.timeout ?? 0,
  );
  if (!Number.isFinite(configuredSeconds) || configuredSeconds <= 0) {
    settings.sessionTimeoutMinutes = DEFAULT_SESSION_TIMEOUT_MINUTES;
    storageConfigureChange(
      "sessionTimeout",
      DEFAULT_SESSION_TIMEOUT_MINUTES * 60,
    );
  }
}

/**
 * 会话超时时间变更（分钟）
 * @param value - 分钟数（1-1440）
 */
function sessionTimeoutMinutesChange(value: number): void {
  const minutes = Number(value);
  const clamped = Number.isFinite(minutes)
    ? Math.min(
        MAX_SESSION_TIMEOUT_MINUTES,
        Math.max(MIN_SESSION_TIMEOUT_MINUTES, Math.floor(minutes)),
      )
    : DEFAULT_SESSION_TIMEOUT_MINUTES;
  settings.sessionTimeoutMinutes = clamped;
  storageConfigureChange("sessionTimeout", clamped * 60);
}

/**
 * 读屏优化模式切换
 */
function screenReaderModeChange(enabled: boolean) {
  settings.screenReaderMode = enabled;
  storageConfigureChange("screenReaderMode", enabled);
  // 调用 Web Speech API 朗读状态提示
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    if (enabled) {
      const utter = new SpeechSynthesisUtterance("读屏优化模式已开启");
      utter.lang = "zh-CN";
      window.speechSynthesis.speak(utter);
    }
  }
}

/**
 * 高对比度模式切换
 */
function highContrastModeChange(enabled: boolean) {
  settings.highContrastMode = enabled;
  storageConfigureChange("highContrastMode", enabled);
}

/**
 * 页面缩放变更
 */
function uiScaleChange(scale: number) {
  settings.uiScale = scale;
  storageConfigureChange("uiScale", scale);
}

/**
 * DevTools 精简版总开关
 */
function devLiteToolsChange(enabled: boolean) {
  settings.devLiteTools = enabled;
  storageConfigureChange("devLiteTools", enabled);
}

/**
 * DevTools 标尺开关
 */
function devRulerChange(enabled: boolean) {
  settings.devRuler = enabled;
  storageConfigureChange("devRuler", enabled);
}

/**
 * DevTools 网格开关
 */
function devGridChange(enabled: boolean) {
  settings.devGrid = enabled;
  storageConfigureChange("devGrid", enabled);
}

/**
 * DevTools 悬停检查开关
 */
function devHoverInspectorChange(enabled: boolean) {
  settings.devHoverInspector = enabled;
  storageConfigureChange("devHoverInspector", enabled);
}

/**
 * 语音朗读开关
 */
function voiceReadEnabledChange(enabled: boolean) {
  settings.voiceReadEnabled = enabled;
  storageConfigureChange("voiceReadEnabled", enabled);
  emitter.emit("voiceReadEnabledChange", enabled);
}

/**
 * 热点工具（热力图）开关
 */
function devHeatmapChange(enabled: boolean) {
  settings.devHeatmap = enabled;
  storageConfigureChange("devHeatmap", enabled);
}

/**
 * 字体加密相关函数
 */
function fontEncryptionEnabledChange(enabled: boolean) {
  settings.fontEncryptionEnabled = enabled;
  storageConfigureChange("fontEncryptionEnabled", enabled);
  emitter.emit("fontEncryptionChange", {
    enabled,
    encryptNumbers: settings.fontEncryptionNumbers,
    encryptChinese: settings.fontEncryptionChinese,
    applyGlobal: settings.fontEncryptionGlobal,
  });
}

function fontEncryptionNumbersChange(enabled: boolean) {
  settings.fontEncryptionNumbers = enabled;
  storageConfigureChange("fontEncryptionNumbers", enabled);
  if (settings.fontEncryptionEnabled) {
    emitter.emit("fontEncryptionChange", {
      enabled: settings.fontEncryptionEnabled,
      encryptNumbers: enabled,
      encryptChinese: settings.fontEncryptionChinese,
      applyGlobal: settings.fontEncryptionGlobal,
    });
  }
}

function fontEncryptionChineseChange(enabled: boolean) {
  settings.fontEncryptionChinese = enabled;
  storageConfigureChange("fontEncryptionChinese", enabled);
  if (settings.fontEncryptionEnabled) {
    emitter.emit("fontEncryptionChange", {
      enabled: settings.fontEncryptionEnabled,
      encryptNumbers: settings.fontEncryptionNumbers,
      encryptChinese: enabled,
      applyGlobal: settings.fontEncryptionGlobal,
    });
  }
}

function fontEncryptionGlobalChange(enabled: boolean) {
  settings.fontEncryptionGlobal = enabled;
  storageConfigureChange("fontEncryptionGlobal", enabled);
  if (settings.fontEncryptionEnabled) {
    emitter.emit("fontEncryptionChange", {
      enabled: settings.fontEncryptionEnabled,
      encryptNumbers: settings.fontEncryptionNumbers,
      encryptChinese: settings.fontEncryptionChinese,
      applyGlobal: enabled,
    });
  }
}

function fontEncryptionOcrNoiseChange(enabled: boolean) {
  settings.fontEncryptionOcrNoise = enabled;
  storageConfigureChange("fontEncryptionOcrNoise", enabled);
  if (settings.fontEncryptionEnabled) {
    emitter.emit("fontEncryptionChange", {
      enabled: settings.fontEncryptionEnabled,
      encryptNumbers: settings.fontEncryptionNumbers,
      encryptChinese: settings.fontEncryptionChinese,
      applyGlobal: settings.fontEncryptionGlobal,
      ocrNoise: enabled,
    });
  }
}

function showNewMenuChange() {
  // 使用小写键写入本地存储，保持与初始化、Hook 配置一致
  storageConfigureChange("showNewMenu", settings.showNewMenu);
  // 关闭新菜单时，强制将动画模式重置为 none，避免残留动画配置
  if (!settings.showNewMenu) {
    settings.newMenuAnimation = "none";
    storageConfigureChange("newMenuAnimation", "none");
    emitter.emit("newMenuAnimationChange", "none");
  }
  // 同时通过事件总线通知菜单组件实时更新
  emitter.emit("showNewMenuChange", settings.showNewMenu);
}

function newMenuTextChange() {
  const value = (settings.newMenuText || "").trim();
  // 空字符串时回退到默认值，避免出现空标识
  settings.newMenuText = value || "new";
  // 写入统一的小写键，供布局配置和组件读取
  storageConfigureChange("newMenuText", settings.newMenuText);
}

function newMenuTimeLimitChange() {
  // 仅在数值有效时更新本地配置
  const limit = Number(settings.newMenuTimeLimit) || 0;
  settings.newMenuTimeLimit = limit;
  storageConfigureChange("newMenuTimeLimit", settings.newMenuTimeLimit);
}

function newMenuAnimationChange({ option }: { option: OptionsType }) {
  const value = option.value as string;
  settings.newMenuAnimation = value as any;
  // 使用小写键与 StorageConfig 保持一致
  storageConfigureChange("newMenuAnimation", value);
  emitter.emit("newMenuAnimationChange", value);
}

function themeAnimationModeChange({ option }: { option: OptionsType }) {
  const value = option.value as any;
  settings.themeAnimationMode = value;
  storageConfigureChange("themeAnimationMode", value);
}

function themeAnimationDirectionChange(value: string) {
  settings.themeAnimationDirection = value as any;
  storageConfigureChange("themeAnimationDirection", value);
}

/** 导入设置 */

/** 清空本地缓存并刷新 */
function clearLocalCache() {
  try {
    storageLocal().clear();
    message.success("缓存已清空，即将刷新页面");
    setTimeout(() => location.reload(), 800);
  } catch (e) {
    message.error("清空缓存失败");
  }
}

/** 导出配置为 JSON 文件 */
function exportConfig() {
  try {
    const config = JSON.stringify($storage.configure || {}, null, 2);
    const blob = new Blob([config], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `app-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("配置已导出");
  } catch (e) {
    message.error("导出配置失败");
  }
}

/** 导入配置文件 */
function importConfig() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        const current = $storage.configure || {};
        Object.assign(current, imported);
        $storage.configure = current;
        storageLocal().setItem("responsive-configure", current);
        message.success("配置已导入，即将刷新页面");
        setTimeout(() => location.reload(), 800);
      } catch {
        message.error("配置文件格式错误");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/** 重置所有配置为默认值 */
function resetConfig() {
  try {
    $storage.configure = {};
    storageLocal().removeItem("responsive-configure");
    message.success("配置已重置，即将刷新页面");
    setTimeout(() => location.reload(), 800);
  } catch (e) {
    message.error("重置配置失败");
  }
}

/** 是否显示云同步功能 */
const showCloudSync = computed(() => {
  const enabled = getConfig().ShowCloudSync ?? false;
  const url = getConfig().CloudSyncUrl ?? "";
  // 只有启用且配置了地址才显示
  return enabled && url.trim() !== "";
});

/** 云同步服务地址 */
const cloudSyncUrl = computed(() => {
  return getConfig().CloudSyncUrl ?? "/v2/user/preference";
});

/** 同步状态 */
const syncLoading = ref(false);

/** 上传配置到云端 */
const syncToCloud = async () => {
  if (!showCloudSync.value || !cloudSyncUrl.value) {
    message.warning(t("panel.cloudSyncUrlNotConfigured") || "云同步地址未配置");
    return;
  }

  syncLoading.value = true;
  try {
    const config = JSON.stringify($storage.configure || {});
    // 支持完整 URL 和相对路径（相对路径会自动拼接 baseURL）
    const url = cloudSyncUrl.value.trim();
    await http.request<ReturnResult<boolean>>("put", url, {
      data: config,
      headers: {
        "Content-Type": "application/json",
      },
    });
    message.success(t("panel.syncSuccess") || "配置已同步到云端");
  } catch (error) {
    console.error("[BaseSetting] 同步配置失败:", error);
    message.error(t("panel.syncFailed") || "同步配置失败");
  } finally {
    syncLoading.value = false;
  }
};

/** 从云端下载配置 */
const syncFromCloud = async () => {
  if (!showCloudSync.value || !cloudSyncUrl.value) {
    message.warning(t("panel.cloudSyncUrlNotConfigured") || "云同步地址未配置");
    return;
  }

  syncLoading.value = true;
  try {
    // 支持完整 URL 和相对路径（相对路径会自动拼接 baseURL）
    const url = cloudSyncUrl.value.trim();
    const response = await http.request<ReturnResult<string>>("get", url, {});
    if (response?.data) {
      const cloudConfig = JSON.parse(response.data);
      // 合并云端配置到本地
      const currentConfig = $storage.configure || {};
      Object.assign(currentConfig, cloudConfig);
      $storage.configure = currentConfig;
      storageLocal().setItem("responsive-configure", currentConfig);

      // 重新加载所有设置
      location.reload();
      message.success(t("panel.syncDownloadSuccess") || "已从云端下载配置");
    } else {
      message.warning(t("panel.noCloudConfig") || "云端暂无配置");
    }
  } catch (error) {
    console.error("[BaseSetting] 下载配置失败:", error);
    message.error(t("panel.syncDownloadFailed") || "下载配置失败");
  } finally {
    syncLoading.value = false;
  }
};

onUnmounted(() => {
  removeMatchMedia();
  // 移除事件监听器
  emitter.off("settingPanelClosed");
});
</script>

<template>
  <div>
    <LayPanel>
      <template #footer>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <el-button plain @click="clearLocalCache">
            <IconifyIconOnline icon="ri:delete-bin-line" />
            清空缓存
          </el-button>
          <el-button plain @click="importConfig">
            <IconifyIconOnline icon="ri:upload-2-line" />
            导入配置
          </el-button>
          <el-button plain @click="exportConfig">
            <IconifyIconOnline icon="ri:download-2-line" />
            导出配置
          </el-button>
          <el-button type="danger" plain @click="resetConfig">
            <IconifyIconOnline icon="ri:refresh-line" />
            重置配置
          </el-button>
        </div>
      </template>
      <div class="lay-setting modern-setting-container">
        <!-- 主题设置（风格/主题色/动画/皮肤/加载动画） -->
        <component
          :is="themeSectionComponents.SettingTheme"
          :settings="settings"
          :is-dark="isDark"
          :data-theme="dataTheme"
          :overall-style="overallStyle"
          :layout-theme="layoutTheme"
          :theme-colors="themeColors"
          :is-non-default-theme="isNonDefaultTheme"
          :theme-options="themeOptions"
          :theme-animation-mode-options="themeAnimationModeOptions"
          :show-theme-colors="showThemeColors"
          :get-theme-color-style="getThemeColorStyle"
          :handle-overall-style-change="handleOverallStyleChange"
          :handle-set-layout-theme-color="handleSetLayoutThemeColor"
          :theme-animation-mode-change="themeAnimationModeChange"
          :theme-animation-direction-change="themeAnimationDirectionChange"
        />

        <!-- 布局模式设置区域 -->
        <component
          :is="themeSectionComponents.SettingLayout"
          :settings="settings"
          :layout-theme="layoutTheme"
          :device="device"
          :vertical-ref="verticalRef"
          :horizontal-ref="horizontalRef"
          :mix-ref="mixRef"
          :hover-ref="hoverRef"
          :mobile-ref="mobileRef"
          :double-ref="doubleRef"
          :drawer-ref="drawerRef"
          :set-layout-model="setLayoutModel"
          :stretch-type-options="stretchTypeOptions"
          :stretch-type-change="stretchTypeChange"
          :set-stretch="setStretch"
          :adjust-value="adjustValue"
          :handle-keydown="handleKeydown"
          :handle-input="handleInput"
          :double-nav-expand-mode-change="doubleNavExpandModeChange"
          :double-nav-auto-expand-all-change="doubleNavAutoExpandAllChange"
          :drawer-hamburger-position-change="drawerHamburgerPositionChange"
        />

        <!-- 标签页样式设置区域 - 非默认主题下隐藏（节日主题优先级大于页签风格） -->
        <component
          :is="themeSectionComponents.SettingTabs"
          :settings="settings"
          :is-non-default-theme="isNonDefaultTheme"
          :mark-value="markValue"
          :mark-options="markOptions"
          :on-change="onChange"
          :tags-change="tagsChange"
          :multi-tags-cache-change="multiTagsCacheChange"
        />

        <!-- 顶部工具栏配置区域 -->
        <component
          :is="themeSectionComponents.SettingToolbar"
          :settings="settings"
          :show-search-change="showSearchChange"
          :show-fullscreen-change="showFullscreenChange"
          :show-header-clock-change="showHeaderClockChange"
          :header-clock-second-enabled-change="headerClockSecondEnabledChange"
          :header-clock-second-timezone-change="headerClockSecondTimezoneChange"
        />

        <!-- 界面显示设置区域 -->
        <component
          :is="themeSectionComponents.SettingDisplay"
          :settings="settings"
          :logo-val="logoVal"
          :card-body-val="cardBodyVal"
          :card-color-mode="cardColorMode"
          :card-color-options="cardColorOptions"
          :logo-change="logoChange"
          :card-body-change="cardBodyChange"
          :on-card-color-mode-change="onCardColorModeChange"
          :grey-change="greyChange"
          :week-change="weekChange"
          :invert-change="invertChange"
          :monochrome-change="monochromeChange"
          :show-breadcrumb-change="showBreadcrumbChange"
          :breadcrumb-mode-change="breadcrumbModeChange"
          :show-tag-icon-change="showTagIconChange"
          :hide-footer-change="hideFooterChange"
          :keep-alive-change="keepAliveChange"
          :tags-change="tagsChange"
          :multi-tags-cache-change="multiTagsCacheChange"
        />

        <!-- 菜单设置区域 -->
        <component
          :is="themeSectionComponents.SettingMenu"
          :settings="settings"
          :transition-type-options="transitionTypeOptions"
          :menu-animation-change="menuAnimationChange"
          :transition-type-change="transitionTypeChange"
          :show-new-menu-change="showNewMenuChange"
          :new-menu-text-change="newMenuTextChange"
          :new-menu-time-limit-change="newMenuTimeLimitChange"
          :new-menu-animation-change="newMenuAnimationChange"
        />

        <!-- 消息配置区域 -->
        <component
          :is="themeSectionComponents.SettingMessage"
          :settings="settings"
          :is-development="isDevelopment"
          :is-test="isTest"
          :show-message-change="showMessageChange"
          :message-dropdown-position-change="messageDropdownPositionChange"
          :send-dev-default-message="sendDevDefaultMessage"
        />

        <!-- AI 设置区域 -->
        <component
          :is="themeSectionComponents.SettingAiChat"
          :settings="settings"
          :show-ai-chat="getConfig().ShowAiChat !== false"
          :ai-chat-enabled-change="aiChatEnabledChange"
          :ai-chat-api-key-change="aiChatApiKeyChange"
          :ai-chat-api-url-change="aiChatApiUrlChange"
          :ai-chat-mode-change="aiChatModeChange"
          :ai-chat-vendor-change="aiChatVendorChange"
          :ai-chat-model-change="aiChatModelChange"
          :ai-chat-skin-change="aiChatSkinChange"
        />

        <!-- 高级设置区域 -->
        <component
          :is="themeSectionComponents.SettingAdvanced"
          :settings="settings"
          :is-development="isDevelopment"
          :is-test="isTest"
          :show-cloud-sync="showCloudSync"
          :cloud-sync-url="cloudSyncUrl"
          :sync-loading="syncLoading"
          :min-session-timeout-minutes="MIN_SESSION_TIMEOUT_MINUTES"
          :max-session-timeout-minutes="MAX_SESSION_TIMEOUT_MINUTES"
          :keep-alive-change="keepAliveChange"
          :stretch-switch-change="stretchSwitchChange"
          :debug-mode-change="debugModeChange"
          :auto-logout-change="autoLogoutChange"
          :session-timeout-minutes-change="sessionTimeoutMinutesChange"
          :screen-reader-mode-change="screenReaderModeChange"
          :high-contrast-mode-change="highContrastModeChange"
          :ui-scale-change="uiScaleChange"
          :dev-lite-tools-change="devLiteToolsChange"
          :dev-ruler-change="devRulerChange"
          :dev-grid-change="devGridChange"
          :dev-hover-inspector-change="devHoverInspectorChange"
          :voice-read-enabled-change="voiceReadEnabledChange"
          :dev-heatmap-change="devHeatmapChange"
          :sync-to-cloud="syncToCloud"
          :sync-from-cloud="syncFromCloud"
          :clear-local-cache="clearLocalCache"
          :export-config="exportConfig"
          :import-config="importConfig"
          :reset-config="resetConfig"
        />
      </div>
    </LayPanel>
  </div>
</template>

<style lang="scss" scoped>
@use "./BaseSetting.scoped.scss";
</style>

<style lang="scss">
@use "./BaseSetting.global.scss";
</style>

<script setup lang="ts">
import { getConfig } from "@repo/config";
import { emitter, useAppStoreHook, useMultiTagsStoreHook } from "@repo/core";
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeMount,
  provide,
  reactive,
  unref,
  watch
} from "vue";
import { useI18n } from "vue-i18n";
import { useNav } from "../../../hooks/useNav";
import LayPanel from "../../lay-panel/index.vue";

import { isNumber, useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import ScSelect from "@repo/components/ScSelect/index.vue";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
import { useDataThemeChange } from "../../../hooks/useDataThemeChange";
import { useThemeAnimation } from "../../../hooks/useThemeAnimation";
import { useThemeStore } from "../../../stores/themeStore";
import LayAiChat from "../../lay-ai-chat/index.vue";
import { getThemeComponents } from "../components";
import { useSettings } from "../composables/useSettings";
import { useThemeSetting } from "./composables/useBaseSetting";

import DarkIcon from "@repo/assets/svg/dark.svg?component";
import DayIcon from "@repo/assets/svg/day.svg?component";
import DoubleIcon from "@repo/assets/svg/double.svg?component";
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
const { saveToStorage } = useSettings();
const {
  fpsMonitorEnabled,
  memoryMonitorEnabled,
  cpuMonitorEnabled,
  bandwidthMonitorEnabled,
  batteryMonitorEnabled,
  bluetoothMonitorEnabled,
  screenMonitorEnabled,
  networkLatencyMonitorEnabled,
  storageMonitorEnabled,
  deviceInfoMonitorEnabled,
  pageTimeMonitorEnabled,
  performanceMonitorPosition,
  performanceMonitorMode,
  performanceMonitorLayout,
  performanceMonitorDirection,
  isPerformanceMonitorVisible,
} = storeToRefs(themeStore);

// 使用 BaseSetting composable
const {
  markValue,
  logoVal,
  cardBodyVal,
  cardColorMode,
  previewInput,
  previewSwitch,
  previewSlider,
  previewCheck,
  previewRadio,
  mixRef,
  verticalRef,
  horizontalRef,
  hoverRef,
  mobileRef,
  doubleRef,
  isNonDefaultTheme,
  isDevelopment,
  isTest,
  festivalThemesList,
  showThemeColors,
  getThemeColorStyle,
  getThemeColor,
  switchSystemTheme,
  festivalThemeChange,
  setLayoutModel,
  watchSystemThemeChange,
  initializeTheme,
  dataTheme,
  overallStyle,
  layoutTheme,
  dataThemeChange,
  setLayoutThemeColor,
} = useThemeSetting();

// 获取当前主题的组件映射
const currentTheme = computed(() => $storage?.configure?.systemTheme || "default");
const themeComponents = computed(() => getThemeComponents(currentTheme.value));

// 动态加载主题组件
const OverallStyleSetting = defineAsyncComponent(themeComponents.value.OverallStyleSetting);
const ThemeColorSetting = defineAsyncComponent(themeComponents.value.ThemeColorSetting);
const ThemeAnimationSetting = defineAsyncComponent(themeComponents.value.ThemeAnimationSetting);
const ThemeSkinSetting = defineAsyncComponent(themeComponents.value.ThemeSkinSetting);
const AiChatSkinSetting = defineAsyncComponent(themeComponents.value.AiChatSkinSetting);
const AiChatFunctionSetting = defineAsyncComponent(themeComponents.value.AiChatFunctionSetting);
const LayoutModeSetting = defineAsyncComponent(themeComponents.value.LayoutModeSetting);
const MobileNavSetting = defineAsyncComponent(themeComponents.value.MobileNavSetting);
const DoubleNavSetting = defineAsyncComponent(themeComponents.value.DoubleNavSetting);
const PageStretchSetting = defineAsyncComponent(themeComponents.value.PageStretchSetting);
const LayoutParamsSetting = defineAsyncComponent(themeComponents.value.LayoutParamsSetting);
const TagsStyleSetting = defineAsyncComponent(themeComponents.value.TagsStyleSetting);
const InterfaceDisplaySetting = defineAsyncComponent(themeComponents.value.InterfaceDisplaySetting);
const MenuSetting = defineAsyncComponent(themeComponents.value.MenuSetting);
const AdvancedSetting = defineAsyncComponent(themeComponents.value.AdvancedSetting);

const {
  themeColors,
  toggleClass,
} = useDataThemeChange();

const runThemeAnimation = useThemeAnimation();

const handleOverallStyleChange = (theme: any) => {
  runThemeAnimation(() => {
    theme.index === 1 && theme.index !== 2
      ? (dataTheme.value = true)
      : (dataTheme.value = false);
    overallStyle.value = theme.option.theme;
    dataThemeChange(theme.option.theme);
    theme.index === 2 && watchSystemThemeChange();
  });
};

const handleSetLayoutThemeColor = (color: string, event: MouseEvent) => {
  runThemeAnimation(() => {
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
  newMenuAnimation: $storage.configure.newMenuAnimation ?? "bounce",
  // 双栏导航设置相关
  doubleNavExpandMode: $storage.configure.doubleNavExpandMode ?? "auto",
  doubleNavAutoExpandAll: $storage.configure.doubleNavAutoExpandAll ?? true,
  // AI 助手设置
  aiChatTheme: $storage.configure.aiChatTheme ?? "default",
  // AI 对话功能设置
  useLocalModel: $storage.configure?.useLocalModel ?? false,
  localModelId: $storage.configure?.localModelId ?? "onnx-community/Llama-3.2-1B-Instruct-ONNX",
  // 主题皮肤设置（优先从本地存储读取，其次从配置文件，最后默认为 false）
  enableFestivalTheme:
    $storage.configure?.enableFestivalTheme ??
    getConfig().EnableFestivalTheme ??
    false,
  // 字体加密设置
  fontEncryptionEnabled: $storage.configure?.fontEncryptionEnabled ?? true,
  fontEncryptionNumbers: $storage.configure?.fontEncryptionNumbers ?? true,
  fontEncryptionChinese: $storage.configure?.fontEncryptionChinese ?? true,
  fontEncryptionGlobal: $storage.configure?.fontEncryptionGlobal ?? false,
  fontEncryptionOcrNoise: $storage.configure?.fontEncryptionOcrNoise ?? false,
  // 主题切换动画设置
  themeAnimationMode: $storage.configure?.themeAnimationMode ?? "fixed",
  themeAnimationDirection: $storage.configure?.themeAnimationDirection ?? "top-right",
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

/** AI 助手皮肤主题选项 */
const aiChatThemeOptions = computed<Array<OptionsType>>(() => [
  {
    label: t("panel.aiThemePurple"),
    tip: t("panel.aiThemePurpleTip"),
    value: "default",
  },
  {
    label: t("panel.aiThemeBlue"),
    tip: t("panel.aiThemeBlueTip"),
    value: "blue",
  },
  {
    label: t("panel.aiThemeGreen"),
    tip: t("panel.aiThemeGreenTip"),
    value: "green",
  },
  {
    label: t("panel.aiThemeOrange"),
    tip: t("panel.aiThemeOrangeTip"),
    value: "orange",
  },
  {
    label: t("panel.aiThemePink"),
    tip: t("panel.aiThemePinkTip"),
    value: "pink",
  },
  {
    label: t("panel.aiThemeDark"),
    tip: t("panel.aiThemeDarkTip"),
    value: "dark",
  },
]);

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




/** 设置内容宽度 */
const contentMarginChange = (value: number): void => {
  saveToStorage("contentMargin", value);
  document.body.style.setProperty("--contentMargin", value + "px");
};

/** 设置内容radius */
const layoutRadiusChange = (value: number): void => {
  saveToStorage("layoutRadius", value);
  document.body.style.setProperty("--layoutRadius", value + "px");
};
// layoutBlurChange removed

/** 切换菜单动画设置 */
const menuAnimationChange = (value: boolean): void => {
  saveToStorage("MenuAnimation", value);
  emitter.emit("menuAnimationChange", value);
};

/** 切换动画类型 */
const transitionTypeChange = ({ option }: { option: OptionsType }): void => {
  const value = option.value as string;
  settings.transitionType = value;
  saveToStorage("transitionType", value);
  emitter.emit("transitionTypeChange", value);
};

/** 灰色模式设置 */
const greyChange = (value: boolean): void => {
  const htmlEl = document.querySelector("html");
  toggleClass(settings.greyVal, "html-grey", htmlEl);
  saveToStorage("grey", value);
};

/** 色弱模式设置 */
const weekChange = (value: boolean): void => {
  const htmlEl = document.querySelector("html");
  toggleClass(settings.weakVal, "html-weakness", htmlEl);
  saveToStorage("weak", value);
};

/** 反色模式设置 */
const invertChange = (value: boolean): void => {
  const htmlEl = document.querySelector("html");
  toggleClass(settings.invertVal, "html-invert", htmlEl);
  saveToStorage("invert", value);
};

/** 黑白模式设置 */
const monochromeChange = (value: boolean): void => {
  const htmlEl = document.querySelector("html");
  toggleClass(settings.monochromeVal, "html-monochrome", htmlEl);
  saveToStorage("monochrome", value);
};


/**
 * 加载主题样式表
 * @param themeKey 主题键值
 */
const loadThemeStylesheet = (themeKey: string): void => {
  // 移除现有的主题样式表
  const existingLink = document.getElementById("layout-theme-stylesheet");
  if (existingLink) {
    existingLink.remove();
  }

  // 如果是默认主题，不需要加载额外样式
  if (themeKey === "default") {
    return;
  }

  const link = document.createElement("link");
  link.id = "layout-theme-stylesheet";
  link.rel = "stylesheet";
  link.href = `/themes/${themeKey}.css`;

  // 添加加载事件监听
  link.onerror = () => {
    ElMessage.error(t("panel.themeStyleLoadFailed"));
  };

  document.head.appendChild(link);
};

/** 隐藏标签页设置 */
const tagsChange = () => {
  const showVal = settings.tabsVal;
  saveToStorage("hideTabs", showVal);
  emitter.emit("tagViewsChange", showVal as unknown as string);
};

/** 隐藏页脚设置 */
const hideFooterChange = () => {
  const hideFooter = settings.hideFooter;
  saveToStorage("hideFooter", hideFooter);
  emitter.emit("hideFooterChange", hideFooter);
};

/** 标签页持久化设置 */
const multiTagsCacheChange = () => {
  const multiTagsCache = settings.multiTagsCache;
  saveToStorage("multiTagsCache", multiTagsCache);
  useMultiTagsStoreHook().multiTagsCacheChange(multiTagsCache);
};

function onChange({ option }: { option: OptionsType }) {
  const { value } = option;
  markValue.value = value;
  saveToStorage("showModel", value);
  emitter.emit("tagViewsShowModel", value);
}

/** 侧边栏Logo */
function logoChange() {
  unref(logoVal)
    ? saveToStorage("showLogo", true)
    : saveToStorage("showLogo", false);
  emitter.emit("logoChange", unref(logoVal));
}
/** 卡片Body */
function cardBodyChange() {
  unref(cardBodyVal)
    ? saveToStorage("cardBody", true)
    : saveToStorage("cardBody", false);
}

/** 卡片颜色模式变更 */
function onCardColorModeChange({ option }: { option: OptionsType }) {
  const { value } = option;
  cardColorMode.value = value;
  saveToStorage("cardColorMode", value);
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
  saveToStorage("stretch", value);
};

const stretchTypeChange = ({ option }: { option: OptionsType }) => {
  const { value } = option;
  value === "custom" ? setStretch(1440) : setStretch(false);
};


const pClass = computed(() => {
  return ["mb-[12px]", "font-medium", "text-sm", "dark:text-white"];
});

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
    saveToStorage("MenuAnimation", val);
    emitter.emit("menuAnimationChange", val);
  },
);

// 监听强制新菜单设置
watch(
  () => settings.forceNewMenu,
  (val) => {
    saveToStorage("ForceNewMenu", val);
    // 强制新菜单可能需要触发重渲染，或者组件内部监听
    emitter.emit("forceNewMenuChange", val);
  },
);

/** 重置到默认设置 */
function resetToDefault() {
  // 重置所有设置到默认值
  Object.assign(settings, {
    menuTransition: false,
    contentMargin: 10,
    layoutRadius: 10,
    layoutBlur: 10,
    greyVal: false,
    weakVal: false,
    tabsVal: false,
    cardBody: true,
    showLogo: true,
    showModel: "chrome",
    hideFooter: true,
    multiTagsCache: true,
    stretch: false,
    keepAlive: true,
    debugMode: false,
    menuAnimation: true,
    themeAnimationMode: "fixed",
    themeAnimationDirection: "top-right",
  });

  // 重置卡片颜色模式
  cardColorMode.value = "all";
  saveToStorage("cardColorMode", "all");

  // 重置主题
  setLayoutModel("vertical");
  dataThemeChange("light");

  // 应用变更
  contentMarginChange(10);
  layoutRadiusChange(10);
  layoutBlurChange(10);
  greyChange(false);
  weekChange(false);
  tagsChange();
  hideFooterChange();
  logoChange();
  cardBodyChange();
  multiTagsCacheChange();

  // 重置菜单动画
  saveToStorage("MenuAnimation", true);
  emitter.emit("menuAnimationChange", true);

  // 重置主题动画
  saveToStorage("themeAnimationMode", "fixed");
  saveToStorage("themeAnimationDirection", "top-right");

  ElMessage.success(t("panel.settingsRestored"));
}

/** 导出设置 */
function exportSettings() {
  const settingsData = {
    ...settings,
    layout: layoutTheme.value.layout,
    theme: layoutTheme.value.theme,
    overallStyle: overallStyle.value,
    logoVal: logoVal.value,
    cardBodyVal: cardBodyVal.value,
  };

  const dataStr = JSON.stringify(settingsData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `system-settings-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();

  URL.revokeObjectURL(url);
  ElMessage.success(t("panel.settingsExported"));
}

/**
 * 面包屑导航显示变更
 */
function showBreadcrumbChange() {
  saveToStorage("showBreadcrumb", settings.showBreadcrumb);
  emitter.emit("breadcrumbChange", settings.showBreadcrumb);
}

/**
 * 面包屑显示模式变更
 */
function breadcrumbModeChange() {
  saveToStorage("breadcrumbIconOnly", settings.breadcrumbIconOnly);
  emitter.emit(
    "breadcrumbModeChange",
    settings.breadcrumbIconOnly ? "icon" : "icon-text",
  );
}

/**
 * 标签页图标显示变更
 */
function showTagIconChange() {
  saveToStorage("showTagIcon", settings.showTagIcon);
  emitter.emit("showTagIconChange", settings.showTagIcon);
}

/**
 * 组件缓存变更
 */
function keepAliveChange() {
  saveToStorage("keepAlive", settings.keepAlive);
  emitter.emit("keepAliveChange", settings.keepAlive);
}

function doubleNavExpandModeChange() {
  saveToStorage("doubleNavExpandMode", settings.doubleNavExpandMode);
}

function doubleNavAutoExpandAllChange() {
  saveToStorage(
    "doubleNavAutoExpandAll",
    settings.doubleNavAutoExpandAll,
  );
}

/**
 * AI 助手皮肤主题变更
 */
function aiChatThemeChange({ option }: { option: OptionsType }) {
  const value = option.value as string;
  settings.aiChatTheme = value;
  saveToStorage("aiChatTheme", value);
  emitter.emit("aiChatThemeChange", value);
}

/**
 * AI 本地模型开关变更
 */
function useLocalModelChange(enabled: boolean) {
  settings.useLocalModel = enabled;
  saveToStorage("useLocalModel", enabled);
  emitter.emit("aiLocalModelChange", {
    useLocalModel: enabled,
    localModelId: settings.localModelId,
  });
}

/**
 * AI 本地模型 ID 变更
 */
function localModelIdChange(value: string) {
  settings.localModelId = value;
  saveToStorage("localModelId", value);
  emitter.emit("aiLocalModelChange", {
    useLocalModel: settings.useLocalModel,
    localModelId: value,
  });
}

const SUPPORTED_MODELS = {};
/**
 * 本地模型选项
 */
const localModelOptions = computed(() => {
  return SUPPORTED_MODELS.map(model => ({
    label: `${model.name} (${model.size}MB)`,
    value: model.modelId,
    tip: model.description,
  }));
});

/**
 * 调试模式切换
 * @param enabled - 是否启用调试模式
 */
function debugModeChange(enabled: boolean) {
  settings.debugMode = enabled;
  saveToStorage("debugMode", enabled);
  // 发送事件到主布局组件控制调试控制台
  emitter.emit("debugModeChange", enabled);
}

// 监听调试模式状态变更（从主布局组件发出）
emitter.on("debugModeChanged", (enabled: boolean) => {
  settings.debugMode = enabled;
  saveToStorage("debugMode", enabled);
});

/**
 * 字体加密相关函数
 */
function fontEncryptionEnabledChange(enabled: boolean) {
  settings.fontEncryptionEnabled = enabled;
  saveToStorage("fontEncryptionEnabled", enabled);
  emitter.emit("fontEncryptionChange", {
    enabled,
    encryptNumbers: settings.fontEncryptionNumbers,
    encryptChinese: settings.fontEncryptionChinese,
    applyGlobal: settings.fontEncryptionGlobal,
  });
}

function fontEncryptionNumbersChange(enabled: boolean) {
  settings.fontEncryptionNumbers = enabled;
  saveToStorage("fontEncryptionNumbers", enabled);
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
  saveToStorage("fontEncryptionChinese", enabled);
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
  saveToStorage("fontEncryptionGlobal", enabled);
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
  saveToStorage("fontEncryptionOcrNoise", enabled);
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
  saveToStorage("ShowNewMenu", settings.showNewMenu);
  emitter.emit("showNewMenuChange", settings.showNewMenu);
}

function newMenuTextChange() {
  saveToStorage("NewMenuText", settings.newMenuText);
}

function newMenuTimeLimitChange() {
  saveToStorage("NewMenuTimeLimit", settings.newMenuTimeLimit);
}

function newMenuAnimationChange({ option }: { option: OptionsType }) {
  const value = option.value as string;
  settings.newMenuAnimation = value as any;
  saveToStorage("NewMenuAnimation", value);
  emitter.emit("newMenuAnimationChange", value);
}

function themeAnimationModeChange({ option }: { option: OptionsType }) {
  const value = option.value as any;
  settings.themeAnimationMode = value;
  saveToStorage("themeAnimationMode", value);
}

function themeAnimationDirectionChange(value: string) {
  settings.themeAnimationDirection = value as any;
  saveToStorage("themeAnimationDirection", value);
}

/** 导入设置 */
function importSettings() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);

        // 应用导入的设置
        Object.assign(settings, importedSettings);

        if (importedSettings.layout) {
          setLayoutModel(importedSettings.layout);
        }

        if (importedSettings.theme) {
          dataThemeChange(importedSettings.theme);
        }

        if (importedSettings.logoVal !== undefined) {
          logoVal.value = importedSettings.logoVal;
        }

        if (importedSettings.cardBodyVal !== undefined) {
          cardBodyVal.value = importedSettings.cardBodyVal;
        }

        // 应用所有变更
        contentMarginChange(settings.contentMargin);
        layoutRadiusChange(settings.layoutRadius);
        // layoutBlurChange(settings.layoutBlur);
        greyChange(settings.greyVal);
        weekChange(settings.weakVal);
        tagsChange();
        hideFooterChange();
        logoChange();
        cardBodyChange();
        multiTagsCacheChange();
        showNewMenuChange();
        newMenuTextChange();
        newMenuTimeLimitChange();

        ElMessage.success(t("panel.settingsImported"));
      } catch (error) {
        ElMessage.error(t("panel.importFailed"));
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

</script>

<template>
  <div>
    <LayPanel>
      <div class="modern-setting-container">
        <!-- 使用组件化系统 -->
        <component :is="OverallStyleSetting" :key="`overall-${currentTheme}`" />
        <component :is="ThemeColorSetting" :key="`theme-color-${currentTheme}`" />
        <component :is="ThemeAnimationSetting" :key="`theme-animation-${currentTheme}`" />
        <component :is="ThemeSkinSetting" :key="`theme-skin-${currentTheme}`" />
        <component
          v-if="getConfig().ShowAiChat !== false"
          :is="AiChatSkinSetting"
          :key="`ai-chat-skin-${currentTheme}`"
        />
        <component
          v-if="getConfig().ShowAiChat !== false"
          :is="AiChatFunctionSetting"
          :key="`ai-chat-function-${currentTheme}`"
        />
        <!-- 导航 / 页面宽度 / 布局参数 / 标签页样式 / 界面显示 / 菜单
             已在下方提供一套自定义样式实现，这里关闭对应的主题组件，避免面板出现两套重复布局 -->
        <!-- <component :is="LayoutModeSetting" :key="`layout-mode-${currentTheme}`" /> -->
        <!-- <component v-if="layoutTheme.layout === 'mobile'" :is="MobileNavSetting" :key="`mobile-nav-${currentTheme}`" /> -->
        <!-- <component v-if="layoutTheme.layout === 'double'" :is="DoubleNavSetting" :key="`double-nav-${currentTheme}`" /> -->
        <!-- <component v-if="useAppStoreHook().getViewportWidth > 1280" :is="PageStretchSetting" :key="`page-stretch-${currentTheme}`" /> -->
        <!-- <component :is="LayoutParamsSetting" :key="`layout-params-${currentTheme}`" /> -->
        <!-- <component :is="TagsStyleSetting" :key="`tags-style-${currentTheme}`" /> -->
        <!-- <component :is="InterfaceDisplaySetting" :key="`interface-display-${currentTheme}`" /> -->
        <!-- <component :is="MenuSetting" :key="`menu-${currentTheme}`" /> -->
        <!-- 高级设置沿用基础组件，避免与下方其他分组混淆 -->
        <component :is="AdvancedSetting" :key="`advanced-${currentTheme}`" />

        <!-- 原始主题皮肤相关模板已删除，逻辑已迁移到上方组件 -->

        <!-- AI 助手皮肤设置区域 -->
        <div v-if="getConfig().ShowAiChat !== false" class="setting-section">
          <div class="section-header">
            <IconifyIconOnline icon="ri:robot-line" class="section-icon" />
            <h3 class="section-title">{{ t("panel.aiChatSkin") }}</h3>
            <div class="section-description">
              {{ t("panel.aiChatSkinDesc") }}
            </div>
          </div>
          <div class="setting-content">
            <div class="ai-theme-grid">
              <div
                v-for="theme in aiChatThemeOptions"
                :key="theme.value"
                class="ai-theme-item"
                :class="[
                  `ai-theme-${theme.value}`,
                  { 'is-active': settings.aiChatTheme === theme.value },
                ]"
                @click="aiChatThemeChange({ option: theme })"
              >
                <div class="ai-theme-preview">
                  <div class="ai-theme-bubble"></div>
                  <div class="ai-theme-bot"></div>
            </div>
                <span class="ai-theme-label">{{ theme.label }}</span>
                <div
                  v-if="settings.aiChatTheme === theme.value"
                  class="ai-theme-check"
                >
                  <IconifyIconOnline icon="ri:check-line" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI 对话功能设置区域 -->
        <div v-if="getConfig().ShowAiChat !== false" class="setting-section">
          <div class="section-header">
            <IconifyIconOnline icon="ri:chat-3-line" class="section-icon" />
            <h3 class="section-title">AI 对话功能</h3>
            <div class="section-description">
              配置本地 AI 模型，实现离线对话功能
            </div>
          </div>
          <div class="setting-content">
            <div class="setting-item">
              <div class="setting-item-header">
                <span class="setting-item-label">启用本地模型</span>
                  <ScSwitch
                  v-model="settings.useLocalModel"
                    layout="visual-card"
                    size="small"
                  label="本地 AI 模型"
                  description="使用 Transformers.js 在浏览器中运行 AI 模型"
                  active-icon="ri:brain-line"
                  ribbon-color="var(--el-color-primary)"
                  @change="useLocalModelChange"
                  />
                </div>
            </div>

            <div v-if="settings.useLocalModel" class="setting-item mt-4">
              <div class="setting-item-header">
                <span class="setting-item-label">选择模型</span>
                </div>
              <div class="setting-item-content">
                <ScSelect
                  v-model="settings.localModelId"
                  :options="localModelOptions"
                  placeholder="选择 AI 模型"
                  @change="localModelIdChange"
                />
                <div class="setting-item-tip mt-2">
                  <IconifyIconOnline icon="ri:information-line" class="tip-icon" />
                  <span>首次使用需要下载模型文件，请耐心等待</span>
            </div>
          </div>
        </div>

            <!-- AI 对话测试区域 -->
            <div v-if="settings.useLocalModel" class="ai-chat-test-container mt-4">
              <div class="ai-chat-test-header">
                <IconifyIconOnline icon="ri:message-3-line" class="test-icon" />
                <span class="test-title">对话测试</span>
            </div>
              <div class="ai-chat-test-content">
                <LayAiChat
                  :use-local-model="settings.useLocalModel"
                  :local-model-id="settings.localModelId"
                  :theme="settings.aiChatTheme"
                  :default-open="true"
                  class="inline-chat"
                />
          </div>
            </div>
          </div>
        </div>

        <!-- 布局模式设置区域 -->
        <div class="setting-section">
          <div class="section-header">
            <IconifyIconOnline icon="ri:layout-line" class="section-icon" />
            <h3 class="section-title">{{ t("panel.pureLayoutModel") }}</h3>
            <div class="section-description">
              {{ t("panel.layoutModeDesc") }}
            </div>
          </div>
          <div class="setting-content">
            <div class="layout-mode-grid">
              <div
                ref="verticalRef"
                class="layout-mode-item"
                :class="{ 'is-active': layoutTheme.layout === 'vertical' }"
                v-tippy="{
                  content: t('panel.layoutVerticalTip'),
                  zIndex: 41000,
                }"
                @click="setLayoutModel('vertical')"
              >
                <div class="layout-mode-preview">
                  <VerticalIcon />
                </div>
                <div class="layout-mode-info">
                  <span class="layout-mode-name">{{
                    t("panel.layoutVertical")
                  }}</span>
                  <span class="layout-mode-desc">{{
                    t("panel.layoutVerticalDesc")
                  }}</span>
                </div>
                <div
                  v-if="layoutTheme.layout === 'vertical'"
                  class="layout-mode-badge"
                >
                  <IconifyIconOnline icon="ri:check-line" />
                </div>
              </div>

              <div
                v-if="device !== 'mobile'"
                ref="horizontalRef"
                class="layout-mode-item"
                :class="{ 'is-active': layoutTheme.layout === 'horizontal' }"
                v-tippy="{
                  content: t('panel.layoutHorizontalTip'),
                  zIndex: 41000,
                }"
                @click="setLayoutModel('horizontal')"
              >
                <div class="layout-mode-preview">
                  <HorizontalIcon />
                </div>
                <div class="layout-mode-info">
                  <span class="layout-mode-name">{{
                    t("panel.layoutHorizontal")
                  }}</span>
                  <span class="layout-mode-desc">{{
                    t("panel.layoutHorizontalDesc")
                  }}</span>
                </div>
                <div
                  v-if="layoutTheme.layout === 'horizontal'"
                  class="layout-mode-badge"
                >
                  <IconifyIconOnline icon="ri:check-line" />
                </div>
              </div>

              <div
                v-if="device !== 'mobile'"
                ref="mixRef"
                class="layout-mode-item"
                :class="{ 'is-active': layoutTheme.layout === 'mix' }"
                v-tippy="{
                  content: t('panel.layoutMixTip'),
                  zIndex: 41000,
                }"
                @click="setLayoutModel('mix')"
              >
                <div class="layout-mode-preview">
                  <MixIcon />
                </div>
                <div class="layout-mode-info">
                  <span class="layout-mode-name">{{
                    t("panel.layoutMix")
                  }}</span>
                  <span class="layout-mode-desc">{{
                    t("panel.layoutMixDesc")
                  }}</span>
                </div>
                <div
                  v-if="layoutTheme.layout === 'mix'"
                  class="layout-mode-badge"
                >
                  <IconifyIconOnline icon="ri:check-line" />
                </div>
              </div>

              <div
                v-if="device !== 'mobile'"
                ref="hoverRef"
                class="layout-mode-item"
                :class="{ 'is-active': layoutTheme.layout === 'hover' }"
                v-tippy="{
                  content: t('panel.layoutHoverTip'),
                  zIndex: 41000,
                }"
                @click="setLayoutModel('hover')"
              >
                <div class="layout-mode-preview">
                  <HoverIcon />
                </div>
                <div class="layout-mode-info">
                  <span class="layout-mode-name">{{
                    t("panel.layoutHover")
                  }}</span>
                  <span class="layout-mode-desc">{{
                    t("panel.layoutHoverDesc")
                  }}</span>
                </div>
                <div
                  v-if="layoutTheme.layout === 'hover'"
                  class="layout-mode-badge"
                >
                  <IconifyIconOnline icon="ri:check-line" />
                </div>
              </div>

              <div
                ref="mobileRef"
                class="layout-mode-item"
                :class="{ 'is-active': layoutTheme.layout === 'mobile' }"
                v-tippy="{
                  content: t('panel.layoutMobileTip'),
                  zIndex: 41000,
                }"
                @click="setLayoutModel('mobile')"
              >
                <div class="layout-mode-preview">
                  <MobileIcon />
                </div>
                <div class="layout-mode-info">
                  <span class="layout-mode-name">{{
                    t("panel.layoutMobile")
                  }}</span>
                  <span class="layout-mode-desc">{{
                    t("panel.layoutMobileDesc")
                  }}</span>
                </div>
                <div
                  v-if="layoutTheme.layout === 'mobile'"
                  class="layout-mode-badge"
                >
                  <IconifyIconOnline icon="ri:check-line" />
                </div>
              </div>

              <div
                v-if="device !== 'mobile'"
                ref="doubleRef"
                class="layout-mode-item"
                :class="{ 'is-active': layoutTheme.layout === 'double' }"
                v-tippy="{
                  content: t('panel.layoutDoubleTip'),
                  zIndex: 41000,
                }"
                @click="setLayoutModel('double')"
              >
                <div class="layout-mode-preview">
                  <DoubleIcon />
                </div>
                <div class="layout-mode-info">
                  <span class="layout-mode-name">{{
                    t("panel.layoutDouble")
                  }}</span>
                  <span class="layout-mode-desc">{{
                    t("panel.layoutDoubleDesc")
                  }}</span>
                </div>
                <div
                  v-if="layoutTheme.layout === 'double'"
                  class="layout-mode-badge"
                >
                  <IconifyIconOnline icon="ri:check-line" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 移动导航设置 -->
        <div v-if="layoutTheme.layout === 'mobile'" class="setting-section">
          <div class="section-header">
            <IconifyIconOnline icon="ri:smartphone-line" class="section-icon" />
            <h3 class="section-title">{{ t("panel.mobileNavConfig") }}</h3>
            <div class="section-description">
              {{ t("panel.mobileNavConfigDesc") }}
            </div>
          </div>
          <div class="setting-content">
            <div class="mobile-nav-tips">
              <div class="tip-item">
                <IconifyIconOnline icon="ri:gesture-line" class="tip-icon" />
                <span>{{ t("panel.gestureSupport") }}</span>
              </div>
              <div class="tip-item">
                <IconifyIconOnline icon="ri:thumb-up-line" class="tip-icon" />
                <span>{{ t("panel.largeTouchArea") }}</span>
              </div>
              <div class="tip-item">
                <IconifyIconOnline
                  icon="ri:layout-bottom-line"
                  class="tip-icon"
                />
                <span>{{ t("panel.bottomNavDesign") }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 双栏导航配置区域 -->
        <div v-if="layoutTheme.layout === 'double'" class="setting-section">
          <div class="section-header">
            <IconifyIconOnline
              icon="ri:layout-column-line"
              class="section-icon"
            />
            <h3 class="section-title">{{ t("panel.doubleNavConfig") }}</h3>
            <div class="section-description">
              {{ t("panel.doubleNavConfigDesc") }}
            </div>
          </div>
          <div class="setting-content">
            <div class="switch-item">
              <label class="switch-label">{{ t("panel.expandMode") }}</label>
              <div class="radio-group">
                <el-radio-group
                  v-model="settings.doubleNavExpandMode"
                  @change="doubleNavExpandModeChange"
                >
                  <el-radio value="auto">自动展开</el-radio>
                  <el-radio value="manual">手动展开</el-radio>
                </el-radio-group>
              </div>
            </div>
            <div
              v-if="settings.doubleNavExpandMode === 'manual'"
              class="setting-content"
            >
              <ScSwitch
                v-model="settings.doubleNavAutoExpandAll"
                layout="visual-card"
                size="small"
                label="展开子菜单"
                description="自动展开所有子菜单"
                active-icon="ri:menu-unfold-line"
                ribbon-color="var(--el-color-primary)"
                @change="doubleNavAutoExpandAllChange"
              />
            </div>
          </div>
        </div>

        <!-- 页面宽度设置区域 -->
        <div
          v-if="useAppStoreHook().getViewportWidth > 1280"
          class="setting-section"
        >
          <div class="section-header">
            <IconifyIconOnline icon="ri:fullscreen-line" class="section-icon" />
            <h3 class="section-title">{{ t("panel.pureStretch") }}</h3>
          </div>
          <div class="setting-content">
            <Segmented
              resize
              class="mb-2 select-none modern-segmented"
              :modelValue="isNumber(settings.stretch) ? 1 : 0"
              :options="stretchTypeOptions"
              @change="stretchTypeChange"
            />
            <el-input-number
              v-if="isNumber(settings.stretch)"
              v-model="settings.stretch as number"
              :min="1280"
              :max="1600"
              controls-position="right"
              @change="(value: number) => setStretch(value)"
            />
            <button
              v-else
              v-ripple="{ class: 'text-gray-300' }"
              class="stretch-button"
              @click="setStretch(!settings.stretch)"
            >
              <div
                class="stretch-indicator"
                :class="[settings.stretch ? 'w-[24%]' : 'w-[50%]']"
              >
                <IconifyIconOnline
                  :icon="
                    settings.stretch
                      ? 'ri:arrow-right-s-line'
                      : 'ri:arrow-left-s-line'
                  "
                  height="20"
                />
                <div class="stretch-line" />
                <IconifyIconOnline
                  :icon="
                    settings.stretch
                      ? 'ri:arrow-left-s-line'
                      : 'ri:arrow-right-s-line'
                  "
                  height="20"
                />
              </div>
            </button>
          </div>
        </div>

        <!-- 布局参数设置区域 -->
        <div class="setting-section">
          <div class="section-header">
            <IconifyIconOnline icon="ri:settings-3-line" class="section-icon" />
            <h3 class="section-title">
              {{ t("panel.pureLayoutParams") || "布局参数" }}
            </h3>
          </div>
          <div class="setting-content">
            <!-- 现代化数字输入框 - 横向布局 -->
            <div class="layout-params-grid">
              <div class="param-item">
                <label class="param-label">{{
                  t("panel.pureStretchMargin") || "内容边距"
                }}</label>
                <div class="custom-number-input">
                  <button
                    class="number-btn decrease"
                    @click="adjustValue('contentMargin', -1)"
                    :disabled="settings.contentMargin <= 0"
                  >
                    <IconifyIconOnline icon="ri:subtract-line" />
                  </button>
                  <div class="number-display">
                    <input
                      type="number"
                      v-model.number="settings.contentMargin"
                      @input="handleInput($event, 'contentMargin')"
                      @keydown="handleKeydown($event, 'contentMargin')"
                      :min="0"
                      :max="100"
                      class="number-input"
                      placeholder="0"
                    />
                    <span class="number-unit">px</span>
                  </div>
                  <button
                    class="number-btn increase"
                    @click="adjustValue('contentMargin', 1)"
                    :disabled="settings.contentMargin >= 100"
                  >
                    <IconifyIconOnline icon="ri:add-line" />
                  </button>
                </div>
              </div>

              <div class="param-item">
                <label class="param-label">{{
                  t("panel.pureLayoutRadius") || "圆角大小"
                }}</label>
                <div class="custom-number-input">
                  <button
                    class="number-btn decrease"
                    @click="adjustValue('layoutRadius', -1)"
                    :disabled="settings.layoutRadius <= 0"
                  >
                    <IconifyIconOnline icon="ri:subtract-line" />
                  </button>
                  <div class="number-display">
                    <input
                      type="number"
                      v-model.number="settings.layoutRadius"
                      @input="handleInput($event, 'layoutRadius')"
                      @keydown="handleKeydown($event, 'layoutRadius')"
                      :min="0"
                      :max="100"
                      class="number-input"
                      placeholder="0"
                    />
                    <span class="number-unit">px</span>
                  </div>
                  <button
                    class="number-btn increase"
                    @click="adjustValue('layoutRadius', 1)"
                    :disabled="settings.layoutRadius >= 100"
                  >
                    <IconifyIconOnline icon="ri:add-line" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 标签页样式设置区域 - 非默认主题下隐藏（节日主题优先级大于页签风格） -->
        <div v-if="!isNonDefaultTheme" class="setting-section">
          <div class="section-header">
            <IconifyIconOnline
              icon="ri:price-tag-3-line"
              class="section-icon"
            />
            <h3 class="section-title">{{ t("panel.pureTagsStyle") }}</h3>
          </div>
          <div class="setting-content">
            <Segmented
              resize
              class="select-none modern-segmented"
              :modelValue="
                markValue === 'smart'
                  ? 0
                  : markValue === 'card'
                    ? 1
                    : markValue === 'chrome'
                      ? 2
                      : markValue === 'modern'
                        ? 3
                        : markValue === 'glass'
                          ? 4
                          : 0
              "
              :options="markOptions"
              @change="onChange"
            />
          </div>
        </div>

        <!-- 过渡动画设置区域已删除 -->

        <!-- 界面显示设置区域 -->
        <div class="setting-section">
          <div class="section-header">
            <IconifyIconOnline icon="ri:eye-line" class="section-icon" />
            <h3 class="section-title">{{ t("panel.pureInterfaceDisplay") }}</h3>
            <div class="section-description">自定义界面显示效果和功能开关</div>
          </div>
          <div class="setting-content">
            <!-- 视觉效果设置 -->
            <div class="setting-group">
              <h4 class="group-title">
                <IconifyIconOnline icon="ri:palette-line" class="group-icon" />
                视觉效果
              </h4>
              <div class="switch-card-grid">
                <ScSwitch
                  v-model="settings.greyVal"
                  layout="visual-card"
                  size="small"
                  :label="t('panel.pureGreyModel')"
                  description="降低色彩饱和度"
                  active-icon="ri:contrast-2-line"
                  @change="greyChange"
                />

                <ScSwitch
                  v-model="settings.weakVal"
                  layout="visual-card"
                  size="small"
                  :label="t('panel.pureWeakModel')"
                  description="优化色彩对比度"
                  active-icon="ri:eye-line"
                  @change="weekChange"
                />

                <ScSwitch
                  v-model="settings.invertVal"
                  layout="visual-card"
                  size="small"
                  label="反色模式"
                  description="反转页面颜色"
                  active-icon="ri:contrast-drop-line"
                  @change="invertChange"
                />

                <ScSwitch
                  v-model="settings.monochromeVal"
                  layout="visual-card"
                  size="small"
                  label="黑白模式"
                  description="显示黑白界面"
                  active-icon="ri:drop-line"
                  @change="monochromeChange"
                />
              </div>
            </div>

            <!-- 界面元素设置 -->
            <div class="setting-group">
              <h4 class="group-title">
                <IconifyIconOnline icon="ri:layout-4-line" class="group-icon" />
                界面元素
              </h4>
              <div class="switch-card-grid">
                <ScSwitch
                  v-model="logoVal"
                  layout="visual-card"
                  size="small"
                  label="显示Logo"
                  description="侧边栏显示Logo"
                  active-icon="ri:image-line"
                  ribbon-color="var(--el-color-success)"
                  @change="logoChange"
                />

                <ScSwitch
                  v-model="settings.tabsVal"
                  layout="visual-card"
                  size="small"
                  :label="t('panel.pureHiddenTags')"
                  description="隐藏后不显示标签页"
                  active-icon="ri:eye-off-line"
                  inactive-icon="ri:bookmark-line"
                  ribbon-text="隐藏"
                  ribbon-color="var(--el-color-warning)"
                  @change="tagsChange"
                />

                <ScSwitch
                  v-if="!settings.tabsVal"
                  v-model="settings.showTagIcon"
                  layout="visual-card"
                  size="small"
                  label="标签页图标"
                  description="在标签页显示菜单图标"
                  active-icon="ri:apps-line"
                  inactive-icon="ri:text"
                  ribbon-color="var(--el-color-success)"
                  @change="showTagIconChange"
                />

                <ScSwitch
                  v-model="settings.hideFooter"
                  layout="visual-card"
                  size="small"
                  :label="t('panel.pureHiddenFooter')"
                  description="隐藏底部页脚区域"
                  active-icon="ri:eye-off-line"
                  inactive-icon="ri:layout-bottom-line"
                  ribbon-text="隐藏"
                  ribbon-color="var(--el-color-warning)"
                  @change="hideFooterChange"
                />

                <ScSwitch
                  v-model="cardBodyVal"
                  layout="visual-card"
                  size="small"
                  label="内容卡片"
                  description="卡片样式背景"
                  active-icon="ri:layout-masonry-line"
                  ribbon-color="var(--el-color-success)"
                  @change="cardBodyChange"
                />

                <ScSwitch
                  v-model="settings.showBreadcrumb"
                  layout="visual-card"
                  size="small"
                  label="面包屑导航"
                  description="显示页面路径导航"
                  active-icon="ri:navigation-line"
                  ribbon-color="var(--el-color-success)"
                  @change="showBreadcrumbChange"
                />
                <!-- 面包屑显示模式 -->
                <ScSwitch
                  v-if="settings.showBreadcrumb"
                  v-model="settings.breadcrumbIconOnly"
                  layout="visual-card"
                  size="small"
                  label="仅显示图标"
                  description="关闭后显示图标+文字"
                  active-icon="ri:layout-grid-line"
                  inactive-icon="ri:text"
                  ribbon-text="简洁"
                  ribbon-color="var(--el-color-primary)"
                  @change="breadcrumbModeChange"
                />
              </div>
            </div>

            <!-- 功能设置 -->
            <div class="setting-group">
              <h4 class="group-title">
                <IconifyIconOnline
                  icon="ri:settings-3-line"
                  class="group-icon"
                />
                功能设置
              </h4>
               <div class="switch-card-grid">
              <ScSwitch
                v-model="settings.multiTagsCache"
                layout="visual-card"
                size="small"
                :label="t('panel.pureMultiTagsCache')"
                description="持久化保存已打开的标签页"
                active-icon="ri:save-line"
                ribbon-color="var(--el-color-warning)"
                @change="multiTagsCacheChange"
              />

              <!-- <ScSwitch
                v-model="themeStore.homeCustomizationEnabled"
                layout="visual-card"
                size="small"
                label="首页自定义"
                description="开启后支持自定义首页布局"
                active-icon="ri:dashboard-line"
                ribbon-color="var(--el-color-success)"
                @change="themeStore.setHomeCustomizationEnabled"
              /> -->
            </div>
            </div>

              <!-- 性能监控 (仅在开发/测试环境或 SA 账号显示) -->
              <div v-if="isPerformanceMonitorVisible" class="setting-group">
               <h4 class="group-title">
                   <IconifyIconOnline
                  icon="ri:settings-3-line"
                  class="group-icon"
                />
                  {{ t("search.performanceMonitor") }}
               </h4>

                <div class="setting-item-content">
                  <!-- FPS Monitor -->
                  <div class="switch-card-grid">
                    <el-tooltip
                      content="Frames Per Second: 衡量页面流畅度，60FPS 为最佳"
                      placement="top"
                      :append-to-body="true"
                      :z-index="3000"
                    >
                      <ScSwitch
                        v-model="fpsMonitorEnabled"
                        layout="visual-card"
                        size="small"
                        :label="t('search.performanceMonitor')"
                        :description="t('search.showFps')"
                        active-icon="ri:pulse-line"
                        ribbon-color="var(--el-color-danger)"
                        @change="themeStore.setFpsMonitor"
                      />
                    </el-tooltip>
                    <!-- Memory Monitor -->
                      <el-tooltip
                        content="JS Heap Size: 当前页面使用的 JS 堆内存 (仅 Chrome/Edge 有效)"
                        placement="top"
                        :append-to-body="true"
                        :z-index="3000"
                      >
                        <ScSwitch
                        v-model="memoryMonitorEnabled"
                        layout="visual-card"
                        size="small"
                        :label="t('search.showMemory')"
                        description="显示内存使用情况"
                        active-icon="ri:cpu-line"
                        ribbon-color="var(--el-color-primary)"
                        @change="themeStore.setMemoryMonitor"
                      />
                    </el-tooltip>

                    <el-tooltip
                      content="CPU Load Estimation: 基于主线程帧间隔估算的负载值 (非系统真实 CPU)"
                      placement="top"
                      :append-to-body="true"
                      :z-index="3000"
                    >
                      <ScSwitch
                        v-model="cpuMonitorEnabled"
                        layout="visual-card"
                        size="small"
                        label="CPU 监控"
                        description="显示主线程负载 (模拟)"
                        active-icon="ri:speed-up-line"
                        ribbon-color="var(--el-color-warning)"
                        @change="themeStore.setCpuMonitor"
                      />
                    </el-tooltip>

                    <el-tooltip
                      content="Bandwidth: 显示当前页面网络请求的传输速率"
                      placement="top"
                      :append-to-body="true"
                      :z-index="3000"
                    >
                      <ScSwitch
                        v-model="bandwidthMonitorEnabled"
                        layout="visual-card"
                        size="small"
                        label="带宽监控"
                        description="显示网络传输速率"
                        active-icon="ri:global-line"
                        ribbon-color="var(--el-color-info)"
                        @change="themeStore.setBandwidthMonitor"
                      />
                    </el-tooltip>

                    <el-tooltip
                      content="Battery: 显示电池电量和充电状态"
                      placement="top"
                      :append-to-body="true"
                      :z-index="3000"
                    >
                      <ScSwitch
                        v-model="batteryMonitorEnabled"
                        layout="visual-card"
                        size="small"
                        label="电池监控"
                        description="显示电池状态"
                        active-icon="ri:battery-charge-line"
                        ribbon-color="var(--el-color-success)"
                        @change="themeStore.setBatteryMonitor"
                      />
                    </el-tooltip>

                    <el-tooltip
                      content="Bluetooth: 显示蓝牙功能可用性"
                      placement="top"
                      :append-to-body="true"
                      :z-index="3000"
                    >
                      <ScSwitch
                        v-model="bluetoothMonitorEnabled"
                        layout="visual-card"
                        size="small"
                        label="蓝牙监控"
                        description="显示蓝牙状态"
                        active-icon="ri:bluetooth-line"
                        ribbon-color="var(--el-color-primary)"
                        @change="themeStore.setBluetoothMonitor"
                      />
                    </el-tooltip>

                    <el-tooltip
                      content="Screen: 显示屏幕分辨率"
                      placement="top"
                      :append-to-body="true"
                      :z-index="3000"
                    >
                      <ScSwitch
                        v-model="screenMonitorEnabled"
                        layout="visual-card"
                        size="small"
                        label="屏幕监控"
                        description="显示屏幕分辨率"
                        active-icon="ri:computer-line"
                        ribbon-color="var(--el-color-primary)"
                        @change="themeStore.setScreenMonitor"
                      />
                    </el-tooltip>

                    <el-tooltip
                      content="Network Latency: 显示网络延迟（RTT）"
                      placement="top"
                      :append-to-body="true"
                      :z-index="3000"
                    >
                      <ScSwitch
                        v-model="networkLatencyMonitorEnabled"
                        layout="visual-card"
                        size="small"
                        label="网络延迟"
                        description="显示网络延迟"
                        active-icon="ri:signal-wifi-line"
                        ribbon-color="var(--el-color-success)"
                        @change="themeStore.setNetworkLatencyMonitor"
                      />
                    </el-tooltip>

                    <el-tooltip
                      content="Storage: 显示本地存储使用情况"
                      placement="top"
                      :append-to-body="true"
                      :z-index="3000"
                    >
                      <ScSwitch
                        v-model="storageMonitorEnabled"
                        layout="visual-card"
                        size="small"
                        label="存储监控"
                        description="显示存储使用情况"
                        active-icon="ri:database-line"
                        ribbon-color="var(--el-color-info)"
                        @change="themeStore.setStorageMonitor"
                      />
                    </el-tooltip>

                    <el-tooltip
                      content="Device Info: 显示设备平台和类型"
                      placement="top"
                      :append-to-body="true"
                      :z-index="3000"
                    >
                      <ScSwitch
                        v-model="deviceInfoMonitorEnabled"
                        layout="visual-card"
                        size="small"
                        label="设备信息"
                        description="显示设备平台"
                        active-icon="ri:smartphone-line"
                        ribbon-color="var(--el-color-warning)"
                        @change="themeStore.setDeviceInfoMonitor"
                      />
                    </el-tooltip>

                    <el-tooltip
                      content="Page Time: 显示页面运行时间和加载时间"
                      placement="top"
                      :append-to-body="true"
                      :z-index="3000"
                    >
                      <ScSwitch
                        v-model="pageTimeMonitorEnabled"
                        layout="visual-card"
                        size="small"
                        label="页面时间"
                        description="显示运行时间"
                        active-icon="ri:time-line"
                        ribbon-color="var(--el-color-primary)"
                        @change="themeStore.setPageTimeMonitor"
                      />
                    </el-tooltip>
                  </div>

                  <!-- Display Settings Group -->
                  <div
                    class="monitor-display-settings"
                    style="
                      margin-top: 16px;
                      width: 100%;
                      border-top: 1px solid var(--el-border-color-lighter);
                      padding-top: 12px;
                    "
                  >
                    <span
                      style="
                        font-size: 13px;
                        font-weight: bold;
                        margin-bottom: 12px;
                        display: block;
                        color: var(--el-text-color-regular);
                      "
                      >显示配置</span
                    >

                    <!-- Layout Mode (Merged vs Split) -->
                    <div
                      style="
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                      "
                    >
                      <span
                        style="
                          font-size: 12px;
                          color: var(--el-text-color-secondary);
                        "
                        >布局模式</span
                      >
                      <Segmented
                        v-model="performanceMonitorLayout"
                        :options="[
                          { label: '合并', value: 'merged' },
                          { label: '分离', value: 'split' },
                        ]"
                        size="small"
                        @change="
                          (val) =>
                            themeStore.setPerformanceMonitorLayout(
                              val.option.value,
                            )
                        "
                      />
                    </div>

                    <!-- Layout Direction (Vertical vs Horizontal) -->
                    <div
                      style="
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                      "
                    >
                      <span
                        style="
                          font-size: 12px;
                          color: var(--el-text-color-secondary);
                        "
                        >布局方向</span
                      >
                      <Segmented
                        v-model="performanceMonitorDirection"
                        :options="[
                          { label: '垂直', value: 'vertical' },
                          { label: '水平', value: 'horizontal' },
                        ]"
                        size="small"
                        @change="
                          (val) =>
                            themeStore.setPerformanceMonitorDirection(
                              val.option.value,
                            )
                        "
                      />
                    </div>

                    <!-- Content Mode (Text vs Detail) -->
                    <div
                      style="
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                      "
                    >
                      <span
                        style="
                          font-size: 12px;
                          color: var(--el-text-color-secondary);
                        "
                        >内容展示</span
                      >
                      <Segmented
                        v-model="performanceMonitorMode"
                        :options="[
                          { label: '详细', value: 'detailed' },
                          { label: '简洁', value: 'simple' },
                        ]"
                        size="small"
                        @change="
                          (val) =>
                            themeStore.setPerformanceMonitorMode(
                              val.option.value,
                            )
                        "
                      />
                    </div>

                    <!-- Position Selector (Visual Grid) -->
                    <div class="position-selector-container">
                      <span
                        style="
                          font-size: 12px;
                          color: var(--el-text-color-secondary);
                          margin-bottom: 8px;
                          display: block;
                        "
                        >显示位置</span
                      >
                      <ScSelect
                        :model-value="performanceMonitorPosition"
                        layout="position"
                        @change="(val) => themeStore.setPerformanceMonitorPosition(val)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 菜单设置区域 -->
        <div class="setting-section">
          <div class="section-header">
            <IconifyIconOnline icon="ri:menu-line" class="section-icon" />
            <h3 class="section-title">菜单设置</h3>
            <div class="section-description">配置菜单显示效果和功能</div>
          </div>
          <div class="setting-content">
            <!-- 菜单动画设置 -->
            <div class="setting-group">
              <h4 class="group-title">
                <IconifyIconOnline icon="ri:movie-line" class="group-icon" />
                菜单动画
              </h4>
              <ScSwitch
                v-model="settings.menuAnimation"
                layout="visual-card"
                size="small"
                label="开启菜单动画"
                description="点击激活菜单与打开路由时的动画效果"
                active-icon="ri:film-line"
                ribbon-color="var(--el-color-primary)"
                @change="menuAnimationChange"
              />

              <div v-if="settings.menuAnimation" class="mt-3 px-1">
                <div class="text-xs text-gray-500 mb-2 pl-1">动画效果选择</div>
                <Segmented
                  resize
                  class="select-none modern-segmented"
                  :modelValue="settings.transitionType"
                  :options="transitionTypeOptions"
                  @change="transitionTypeChange"
                />
              </div>
            </div>

            <!-- 新菜单显示设置 -->
            <div class="setting-group">
              <h4 class="group-title">
                <IconifyIconOnline
                  icon="ri:add-circle-line"
                  class="group-icon"
                />
                新菜单显示
              </h4>
              <ScSwitch
                v-model="settings.showNewMenu"
                layout="visual-card"
                size="small"
                label="显示新增菜单"
                description="启用新菜单标识功能"
                active-icon="ri:add-circle-line"
                ribbon-color="var(--el-color-primary)"
                @change="showNewMenuChange"
              />

              <!-- 新菜单详细配置 (仅开启时显示) -->
              <div
                v-if="settings.showNewMenu"
                class="sub-settings-container mt-4 pl-3 border-l-2 border-[var(--el-border-color-lighter)]"
              >
                <!-- 新菜单文本 -->
                <div class="setting-item mb-4">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-[var(--el-text-color-regular)]"
                      >标识文本</span
                    >
                    <el-input
                      v-model="settings.newMenuText"
                      placeholder="NEW"
                      maxlength="10"
                      size="small"
                      show-word-limit
                      @blur="newMenuTextChange"
                      style="width: 120px"
                    />
                  </div>
                </div>

                <!-- 时间限制 -->
                <div class="setting-item mb-4">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-[var(--el-text-color-regular)]"
                      >显示时长(小时)</span
                    >
                    <el-input-number
                      v-model="settings.newMenuTimeLimit"
                      :min="1"
                      :max="8760"
                      :step="1"
                      size="small"
                      @change="newMenuTimeLimitChange"
                      style="width: 120px"
                    />
                  </div>
                </div>

                <!-- 标识动画 -->
                <div class="setting-item mb-4">
                  <Segmented
                    resize
                    class="select-none modern-segmented w-full"
                    :modelValue="
                      settings.newMenuAnimation === 'none'
                        ? 0
                        : settings.newMenuAnimation === 'bounce'
                          ? 1
                          : settings.newMenuAnimation === 'pulse'
                            ? 2
                            : settings.newMenuAnimation === 'shake'
                              ? 3
                              : 1
                    "
                    :options="[
                      { label: t('panel.animNone'), value: 'none' },
                      { label: t('panel.animBounce'), value: 'bounce' },
                      { label: t('panel.animPulse'), value: 'pulse' },
                      { label: t('panel.animShake'), value: 'shake' },
                    ]"
                    @change="newMenuAnimationChange"
                  />
                </div>

                <!-- 强制显示 (测试) - 已移除 -->
              </div>
            </div>
          </div>
        </div>

    </LayPanel>
  </div>
</template>

<style lang="scss" scoped src="./BaseSetting.scss"></style>

<style lang="scss" src="./BaseSetting.global.scss"></style>

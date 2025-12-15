<script setup lang="ts">
import { emitter, useAppStoreHook, useMultiTagsStoreHook } from "@repo/core";
import { getConfig } from "@repo/config";
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
import { useI18n } from "vue-i18n";
import { useNav } from "../../../hooks/useNav";
import LayPanel from "../../lay-panel/index.vue";
import { getAvailableThemes, ThemeType } from "../../../themes";

import { debounce, isNumber, useDark, useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import ScRibbon from "@repo/components/ScRibbon/index.vue";
import ScDebugConsole from "@repo/components/ScDebugConsole/index.vue";
import { ElMessage } from "element-plus";
import { useDataThemeChange } from "../../../hooks/useDataThemeChange";
import LayThemeSwitcher from "../../lay-theme-switcher/index.vue";

import Check from "@iconify-icons/ep/check";
import LeftArrow from "@iconify-icons/ri/arrow-left-s-line";
import RightArrow from "@iconify-icons/ri/arrow-right-s-line";
//@ts-ignore
import DayIcon from "@repo/assets/svg/day.svg?component";
//@ts-ignore
import DarkIcon from "@repo/assets/svg/dark.svg?component";
//@ts-ignore
import SystemIcon from "@repo/assets/svg/system.svg?component";
//@ts-ignore
import VerticalIcon from "@repo/assets/svg/vertical.svg?component";
//@ts-ignore
import HorizontalIcon from "@repo/assets/svg/horizontal.svg?component";
//@ts-ignore
import MixIcon from "@repo/assets/svg/mix.svg?component";
//@ts-ignore
import HoverIcon from "@repo/assets/svg/hover.svg?component";
//@ts-ignore
import MobileIcon from "@repo/assets/svg/mobile.svg?component";
//@ts-ignore
import DoubleIcon from "@repo/assets/svg/double.svg?component";

const { t } = useI18n();
const { device } = useNav();
const { isDark } = useDark();
//@ts-ignore
const { $storage } = useGlobal<GlobalPropertiesApi>();

const mixRef = ref();
const verticalRef = ref();
const horizontalRef = ref();
const hoverRef = ref();
const mobileRef = ref();
const doubleRef = ref();
const debugConsoleRef = ref<InstanceType<typeof ScDebugConsole> | null>(null);

// 存储 tippy 实例的数组，用于组件销毁时清理
const tippyInstances = ref([]);

const {
  dataTheme,
  overallStyle,
  layoutTheme,
  themeColors,
  toggleClass,
  dataThemeChange,
  setLayoutThemeColor,
} = useDataThemeChange();


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

const settings = reactive({
  menuTransition: $storage.configure.menuTransition,
  contentMargin: $storage.configure.contentMargin,
  layoutRadius: $storage.configure.layoutRadius,
  layoutBlur: $storage.configure.layoutBlur,
  greyVal: $storage.configure.grey,
  weakVal: $storage.configure.weak,
  invertVal: $storage.configure.invert ?? false,
  monochromeVal: $storage.configure.monochrome ?? false,
  tabsVal: $storage.configure.hideTabs,
  cardBody: $storage.configure.cardBody,
  showLogo: $storage.configure.showLogo,
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
  // 主题皮肤设置（优先从本地存储读取，其次从配置文件，最后默认为 true）
  enableFestivalTheme: $storage.configure?.enableFestivalTheme ?? (getConfig().EnableFestivalTheme ?? true),
});

/** AI 助手皮肤主题选项 */
const aiChatThemeOptions = computed<Array<OptionsType>>(() => [
  { label: "紫色", tip: "默认紫色渐变", value: "default" },
  { label: "蓝色", tip: "蓝色科技风", value: "blue" },
  { label: "绿色", tip: "绿色清新风", value: "green" },
  { label: "橙色", tip: "橙色活力风", value: "orange" },
  { label: "粉色", tip: "粉色可爱风", value: "pink" },
  { label: "暗黑", tip: "暗黑酷炫风", value: "dark" },
]);

/** 卡片颜色模式配置 */
const cardColorMode = ref($storage.configure?.cardColorMode ?? "all");

const cardColorOptions = computed<Array<OptionsType>>(() => {
  return [
    {
      label: "全部颜色",
      tip: "所有卡片使用随机渐变色",
      value: "all",
    },
    {
      label: "1/3颜色",
      tip: "仅使用部分颜色组合",
      value: "third",
    },
    {
      label: "纯白模式",
      tip: "所有卡片使用纯白背景",
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
const currentEnv = import.meta.env.MODE || 'production';
const isDevelopment = currentEnv === 'development' || import.meta.env.DEV;
const isTest = currentEnv === 'test';

// 获取用户角色列表（从 $storage 或其他地方获取）
const userRoles = computed(() => {
  // TODO: 从用户存储或状态管理中获取用户角色
  // 这里作为示例，你需要根据实际情况调整
  const roles = $storage?.user?.roles || $storage?.userInfo?.roles || [];
  return Array.isArray(roles) ? roles : [];
});

/**
 * 显示的主题列表（根据自动切换开关、环境和权限过滤）
 */
const festivalThemesList = computed(() => {
  const themes = getAvailableThemes(
    settings.enableFestivalTheme,
    userRoles.value,
    isDevelopment,
    isTest
  );
  
  // 转换为设置面板需要的格式
  return themes.map(t => ({
    color: t.color || '#409EFF',
    themeColor: t.key,
    name: t.name,
    description: t.description,
    icon: t.icon || 'ri:palette-line',
    type: t.type,
  }));
});

/** 当网页整体为暗色风格时不显示亮白色主题配色切换选项 */
const showThemeColors = computed(() => {
  return (themeColor: string) => {
    return themeColor === "light" && isDark.value ? false : true;
  };
});

function storageConfigureChange<T>(key: string, val: T): void {
  const storageConfigure = $storage.configure;
  storageConfigure[key] = val;
  $storage.configure = storageConfigure;
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
/** 设置内容blur */
const layoutBlurChange = (value: number): void => {
  storageConfigureChange("layoutBlur", value);
  document.body.style.setProperty("--layoutBlur", value + "px");
};

/** 切换菜单动画设置 */
const menuTransitionChange = (value: boolean): void => {
  storageConfigureChange("menuTransition", value);
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

/** 节日主题自动切换设置 */
const festivalThemeChange = (value: boolean): void => {
  storageConfigureChange("enableFestivalTheme", value);
  
  if (value) {
    // 开启自动切换，检测并应用节日主题
    const { detectFestivalTheme } = require("../../themes");
    const festivalTheme = detectFestivalTheme();
    
    if (festivalTheme) {
      switchSystemTheme(festivalTheme.key, true);
    } else {
      ElMessage.info("当前不在节日期间");
    }
  } else {
    // 关闭自动切换，但不移除当前主题，用户需要手动切换回默认主题
    ElMessage.success("已关闭节日主题自动切换，当前主题保持不变");
  }
};

/**
 * 切换系统主题皮肤
 * @param themeKey 主题键值
 * @param showMessage 是否显示消息，默认为true
 */
const switchSystemTheme = (themeKey: string, showMessage: boolean = true): void => {
  console.log('🎨 切换主题:', themeKey);
  
  // 检查是否已经是当前主题，避免重复切换
  const currentTheme = $storage.configure?.systemTheme || 'default';
  if (currentTheme === themeKey) {
    console.log('ℹ️ 已经是当前主题，跳过切换');
    return;
  }
  
  const htmlEl = document.documentElement;
  
  // 使用 data-skin 属性而不是 class
  htmlEl.setAttribute('data-skin', themeKey);
  console.log(`✅ 主题已应用: data-skin="${themeKey}"`);
  
  // 不再需要动态加载CSS，所有主题样式已在 @repo/skin 中
  
  // 保存到本地存储
  storageConfigureChange("systemTheme", themeKey);
  console.log('💾 已保存主题到本地存储:', themeKey);
  
  // 发送主题切换事件
  emitter.emit("systemThemeChange", themeKey);
  
  // 只在明确要求显示消息时才显示
  if (showMessage) {
    const themeName = themeKey === 'default' ? '默认' : festivalThemesList.value.find(t => t.themeColor === themeKey)?.name || themeKey;
    ElMessage.success(`已切换到${themeName}主题`);
  }
};

/**
 * 加载主题样式表
 * @param themeKey 主题键值
 */
const loadThemeStylesheet = (themeKey: string): void => {
  console.log('📄 开始加载主题样式表:', themeKey);
  
  // 移除现有的主题样式表
  const existingLink = document.getElementById("layout-theme-stylesheet");
  if (existingLink) {
    existingLink.remove();
    console.log('✅ 已移除旧的样式表');
  }

  // 如果是默认主题，不需要加载额外样式
  if (themeKey === "default") {
    console.log('ℹ️ 默认主题，不需要加载样式表');
    return;
  }

  const link = document.createElement("link");
  link.id = "layout-theme-stylesheet";
  link.rel = "stylesheet";
  link.href = `/themes/${themeKey}.css`;
  
  // 添加加载事件监听
  link.onload = () => {
    console.log('✅ 主题样式表加载成功:', link.href);
  };
  
  link.onerror = () => {
    console.error('❌ 主题样式表加载失败:', link.href);
    ElMessage.error('主题样式加载失败，请检查文件是否存在');
  };
  
  document.head.appendChild(link);
  console.log('🔗 已添加样式表到 head:', link.href);
};

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
function logoChange() {
  unref(logoVal)
    ? storageConfigureChange("showLogo", true)
    : storageConfigureChange("showLogo", false);
  emitter.emit("logoChange", unref(logoVal));
}
/** 卡片Body */
function cardBodyChange() {
  unref(cardBodyVal)
    ? storageConfigureChange("cardBody", true)
    : storageConfigureChange("cardBody", false);
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
      case "layoutBlur":
        layoutBlurChange(newValue);
        break;
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
      case "layoutBlur":
        layoutBlurChange(value);
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

const stretchTypeChange = ({ option }: { option: OptionsType }) => {
  const { value } = option;
  value === "custom" ? setStretch(1440) : setStretch(false);
};

/** 主题色 激活选择项 */
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
      label: "现代风格",
      tip: "渐变背景、立体阴影，精致现代化风格",
      value: "modern",
    },
  ];
});

/** 设置导航模式 */
function setLayoutModel(layout: string) {
  layoutTheme.value.layout = layout;
  window.document.body.setAttribute("layout", layout);
  $storage.layout = {
    layout,
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
const initializeTheme = () => {
  const savedTheme = $storage.configure?.systemTheme;
  
  if (settings.enableFestivalTheme) {
    // 如果开启了自动切换，检测节日主题
    const { detectFestivalTheme } = require("../../themes");
    const festivalTheme = detectFestivalTheme();
    
    if (festivalTheme) {
      switchSystemTheme(festivalTheme.key, false); // 初始化时不显示消息
      console.log('🎉 检测到节日主题，自动应用:', festivalTheme.name);
      return;
    }
  }
  
  // 应用保存的主题或默认主题
  if (savedTheme && savedTheme !== "default") {
    switchSystemTheme(savedTheme, false); // 初始化时不显示消息
    console.log('🎨 应用保存的主题:', savedTheme);
  } else {
    console.log('✅ 使用默认主题');
  }
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
    
    // 初始化主题
    initializeTheme();
  });
});

// 收集 tippy 实例的函数
const collectTippyInstances = () => {
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
};

onMounted(() => {
  collectTippyInstances();

  // 监听面板关闭事件
  emitter.on("settingPanelClosed", () => {
    destroyAllTippyInstances();
  });
});

// 销毁所有 tippy 实例的函数
const destroyAllTippyInstances = () => {
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
};

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
  });

  // 重置卡片颜色模式
  cardColorMode.value = "all";
  storageConfigureChange("cardColorMode", "all");

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

  ElMessage.success("已恢复默认设置");
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
  ElMessage.success("设置已导出");
}

/** 菜单设置变更处理 */
function showNewMenuChange() {
  storageConfigureChange("showNewMenu", settings.showNewMenu);
}

function newMenuTextChange() {
  storageConfigureChange("newMenuText", settings.newMenuText);
}

function newMenuTimeLimitChange() {
  storageConfigureChange("newMenuTimeLimit", settings.newMenuTimeLimit);
}

/**
 * 新菜单动画变更
 */
function newMenuAnimationChange({ option }: { option: OptionsType }) {
  const value = option.value as string;
  settings.newMenuAnimation = value;
  storageConfigureChange("newMenuAnimation", value);
}

/**
 * 面包屑导航显示变更
 */
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
    settings.breadcrumbIconOnly ? "icon" : "icon-text"
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
    settings.doubleNavAutoExpandAll
  );
}

/**
 * AI 助手皮肤主题变更
 */
function aiChatThemeChange({ option }: { option: OptionsType }) {
  const value = option.value as string;
  settings.aiChatTheme = value;
  storageConfigureChange("aiChatTheme", value);
  emitter.emit("aiChatThemeChange", value);
}

/**
 * 调试模式切换
 * @param enabled - 是否启用调试模式
 */
function debugModeChange(enabled: boolean) {
  settings.debugMode = enabled;
  storageConfigureChange("debugMode", enabled);
  if (enabled) {
    // 显示调试控制台
    nextTick(() => {
      debugConsoleRef.value?.show();
    });
  } else {
    // 关闭调试控制台
    debugConsoleRef.value?.handleClose();
  }
}

/**
 * 调试控制台关闭回调
 * 当用户关闭调试控制台时，自动关闭调试模式
 */
function handleDebugConsoleClose() {
  settings.debugMode = false;
  storageConfigureChange("debugMode", false);
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
        layoutBlurChange(settings.layoutBlur);
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

        ElMessage.success("设置已导入");
      } catch (error) {
        ElMessage.error("导入失败，文件格式不正确");
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

onUnmounted(() => {
  removeMatchMedia();
  destroyAllTippyInstances();
  // 移除事件监听器
  emitter.off("settingPanelClosed");
});
</script>

<template>
  <div>
    <LayPanel>
      <div class="modern-setting-container">
        <!-- 主题风格设置区域 -->
        <div class="setting-section">
          <div class="section-header">
            <IconifyIconOffline
              :icon="'ri:palette-line'"
              class="section-icon"
            />
            <h3 class="section-title">{{ t("panel.pureOverallStyle") }}</h3>
          </div>
          <div class="setting-content">
            <Segmented
              resize
              class="select-none modern-segmented"
              :modelValue="overallStyle === 'system' ? 2 : dataTheme ? 1 : 0"
              :options="themeOptions"
              @change="
                (theme) => {
                  theme.index === 1 && theme.index !== 2
                    ? (dataTheme = true)
                    : (dataTheme = false);
                  overallStyle = theme.option.theme;
                  dataThemeChange(theme.option.theme);
                  theme.index === 2 && watchSystemThemeChange();
                }
              "
            />
          </div>
        </div>

        <!-- 主题色设置区域 -->
        <div v-if="themeColors && themeColors.length > 0" class="setting-section">
          <div class="section-header">
            <IconifyIconOffline :icon="'ri:drop-line'" class="section-icon" />
            <h3 class="section-title">{{ t("panel.pureThemeColor") }}</h3>
          </div>
          <div class="setting-content">
            <div class="theme-color-grid">
              <el-tooltip
                v-for="(item, index) in themeColors"
                v-show="showThemeColors(item.themeColor)"
                :key="index"
                :content="item.description || item.themeColor"
                placement="top"
                effect="light"
              >
                <div
                  class="theme-color-item"
                  :class="{
                    'is-selected': item.themeColor === layoutTheme.theme,
                  }"
                  :style="getThemeColorStyle(item.color)"
                  @click="setLayoutThemeColor(item.themeColor)"
                >
                  <!-- 选中状态指示器 -->
                  <div class="selection-indicator">
                    <div class="check-ring">
                      <IconifyIconOffline :icon="Check" class="check-icon" />
                    </div>
                  </div>

                  <!-- 光泽效果层 -->
                  <div class="shine-effect"></div>
                </div>
              </el-tooltip>
            </div>
          </div>
        </div>

        <!-- 主题皮肤功能区域 -->
        <div v-if="getConfig().EnableThemeManagement !== false" class="setting-section">
          <div class="section-header">
            <IconifyIconOffline :icon="'ri:palette-fill'" class="section-icon" />
            <h3 class="section-title">主题皮肤</h3>
            <div class="section-description">管理和配置系统皮肤主题</div>
          </div>
          <div class="setting-content">
            <!-- 节日主题自动切换开关 -->
            <div class="switch-card-grid">
              <ScSwitch
                v-model="settings.enableFestivalTheme"
                layout="visual-card"
                size="small"
                label="节日主题自动切换"
                description="自动检测并应用节日主题，关闭后需手动切换主题"
                active-icon="ri:calendar-event-line"
                @change="festivalThemeChange"
              />
            </div>
            
            <!-- 节日装饰显示提示 -->
            <div v-if="!settings.enableFestivalTheme" class="festival-decoration-tip">
              <IconifyIconOffline :icon="'ri:information-line'" class="tip-icon" />
              <span>关闭自动切换后，节日装饰元素仍会显示，但不会自动切换主题样式</span>
            </div>
            
            <!-- 开启自动切换时：显示当前生效的主题提示 -->
            <div v-if="settings.enableFestivalTheme" class="auto-theme-status">
              <div class="status-card">
                <div class="status-icon">
                  <IconifyIconOffline :icon="'ri:calendar-check-line'" />
                </div>
                <div class="status-content">
                  <div class="status-title">自动主题已启用</div>
                  <div class="status-desc">系统将根据当前日期自动应用节日主题，节日主题已隐藏</div>
                  <div class="status-current">
                    <span class="label">当前主题：</span>
                    <span class="value">
                      {{ 
                        $storage.configure?.systemTheme === 'default' 
                          ? '默认' 
                          : festivalThemesList.find(t => t.themeColor === $storage.configure?.systemTheme)?.name || $storage.configure?.systemTheme
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 主题选择区域 - 始终显示，但根据自动切换开关过滤主题 -->
            <div class="festival-themes-section">
              <LayThemeSwitcher
                :themes="festivalThemesList"
                :showMeta="true"
                :persist="false"
                :modelValue="$storage.configure?.systemTheme || 'default'"
                @change="(key:string) => switchSystemTheme(key)"
              />
            </div>
          </div>
        </div>

        <!-- AI 助手皮肤设置区域 -->
        <div v-if="getConfig().ShowAiChat !== false" class="setting-section">
          <div class="section-header">
            <IconifyIconOffline :icon="'ri:robot-line'" class="section-icon" />
            <h3 class="section-title">AI 助手皮肤</h3>
            <div class="section-description">自定义 AI 助手的外观主题</div>
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

        <!-- 布局模式设置区域 -->
        <div class="setting-section">
          <div class="section-header">
            <IconifyIconOffline :icon="'ri:layout-line'" class="section-icon" />
            <h3 class="section-title">{{ t("panel.pureLayoutModel") }}</h3>
            <div class="section-description">选择适合您的导航布局模式</div>
          </div>
          <div class="setting-content">
            <div class="layout-mode-grid">
              <div
                ref="verticalRef"
                class="layout-mode-item"
                :class="{ 'is-active': layoutTheme.layout === 'vertical' }"
                v-tippy="{
                  content: '经典侧边栏导航，适合功能丰富的管理系统',
                  zIndex: 41000,
                }"
                @click="setLayoutModel('vertical')"
              >
                <div class="layout-mode-preview">
                  <VerticalIcon />
                </div>
                <div class="layout-mode-info">
                  <span class="layout-mode-name">纵向布局</span>
                  <span class="layout-mode-desc">侧边导航</span>
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
                  content: '顶部导航栏设计，充分利用屏幕宽度',
                  zIndex: 41000,
                }"
                @click="setLayoutModel('horizontal')"
              >
                <div class="layout-mode-preview">
                  <HorizontalIcon />
                </div>
                <div class="layout-mode-info">
                  <span class="layout-mode-name">横向布局</span>
                  <span class="layout-mode-desc">顶部导航</span>
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
                  content: '结合顶部和侧边导航优势',
                  zIndex: 41000,
                }"
                @click="setLayoutModel('mix')"
              >
                <div class="layout-mode-preview">
                  <MixIcon />
                </div>
                <div class="layout-mode-info">
                  <span class="layout-mode-name">混合布局</span>
                  <span class="layout-mode-desc">双导航</span>
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
                  content: '极简设计，鼠标悬停展开子菜单',
                  zIndex: 41000,
                }"
                @click="setLayoutModel('hover')"
              >
                <div class="layout-mode-preview">
                  <HoverIcon />
                </div>
                <div class="layout-mode-info">
                  <span class="layout-mode-name">悬停导航</span>
                  <span class="layout-mode-desc">极简设计</span>
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
                  content: '适用于手机和平板的触控友好导航',
                  zIndex: 41000,
                }"
                @click="setLayoutModel('mobile')"
              >
                <div class="layout-mode-preview">
                  <MobileIcon />
                </div>
                <div class="layout-mode-info">
                  <span class="layout-mode-name">移动导航</span>
                  <span class="layout-mode-desc">触控优化</span>
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
                  content: '左右双栏布局，支持子菜单展开控制',
                  zIndex: 41000,
                }"
                @click="setLayoutModel('double')"
              >
                <div class="layout-mode-preview">
                  <DoubleIcon />
                </div>
                <div class="layout-mode-info">
                  <span class="layout-mode-name">双栏导航</span>
                  <span class="layout-mode-desc">双层菜单</span>
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
            <IconifyIconOffline
              :icon="'ri:smartphone-line'"
              class="section-icon"
            />
            <h3 class="section-title">移动导航配置</h3>
            <div class="section-description">为触控设备优化的导航体验</div>
          </div>
          <div class="setting-content">
            <div class="mobile-nav-tips">
              <div class="tip-item">
                <IconifyIconOnline icon="ri:gesture-line" class="tip-icon" />
                <span>支持手势滑动操作</span>
              </div>
              <div class="tip-item">
                <IconifyIconOnline icon="ri:thumb-up-line" class="tip-icon" />
                <span>大尺寸触控区域</span>
              </div>
              <div class="tip-item">
                <IconifyIconOnline
                  icon="ri:layout-bottom-line"
                  class="tip-icon"
                />
                <span>底部导航栏设计</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 双栏导航配置区域 -->
        <div v-if="layoutTheme.layout === 'double'" class="setting-section">
          <div class="section-header">
            <IconifyIconOffline
              :icon="'ri:layout-column-line'"
              class="section-icon"
            />
            <h3 class="section-title">双栏导航配置</h3>
            <div class="section-description">配置双栏导航的子菜单展开行为</div>
          </div>
          <div class="setting-content">
            <div class="switch-item">
              <label class="switch-label">展开模式</label>
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
            <IconifyIconOffline
              :icon="'ri:fullscreen-line'"
              class="section-icon"
            />
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
                <IconifyIconOffline
                  :icon="settings.stretch ? RightArrow : LeftArrow"
                  height="20"
                />
                <div class="stretch-line" />
                <IconifyIconOffline
                  :icon="settings.stretch ? LeftArrow : RightArrow"
                  height="20"
                />
              </div>
            </button>
          </div>
        </div>

        <!-- 布局参数设置区域 -->
        <div class="setting-section">
          <div class="section-header">
            <IconifyIconOffline
              :icon="'ri:settings-3-line'"
              class="section-icon"
            />
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
                    <IconifyIconOffline :icon="'ri:subtract-line'" />
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
                    <IconifyIconOffline :icon="'ri:add-line'" />
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
                    <IconifyIconOffline :icon="'ri:subtract-line'" />
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
                    <IconifyIconOffline :icon="'ri:add-line'" />
                  </button>
                </div>
              </div>

              <div class="param-item">
                <label class="param-label">{{
                  t("panel.pureLayoutBlur") || "模糊效果"
                }}</label>
                <div class="custom-number-input">
                  <button
                    class="number-btn decrease"
                    @click="adjustValue('layoutBlur', -1)"
                    :disabled="settings.layoutBlur <= 0"
                  >
                    <IconifyIconOffline :icon="'ri:subtract-line'" />
                  </button>
                  <div class="number-display">
                    <input
                      type="number"
                      v-model.number="settings.layoutBlur"
                      @input="handleInput($event, 'layoutBlur')"
                      @keydown="handleKeydown($event, 'layoutBlur')"
                      :min="0"
                      :max="100"
                      class="number-input"
                      placeholder="0"
                    />
                    <span class="number-unit">px</span>
                  </div>
                  <button
                    class="number-btn increase"
                    @click="adjustValue('layoutBlur', 1)"
                    :disabled="settings.layoutBlur >= 100"
                  >
                    <IconifyIconOffline :icon="'ri:add-line'" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 标签页样式设置区域 -->
        <div class="setting-section">
          <div class="section-header">
            <IconifyIconOffline
              :icon="'ri:price-tag-3-line'"
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
                        : 0
              "
              :options="markOptions"
              @change="onChange"
            />
          </div>
        </div>

        <!-- 过渡动画设置区域 -->
        <div class="setting-section">
          <div class="section-header">
            <IconifyIconOffline :icon="'ri:magic-line'" class="section-icon" />
            <h3 class="section-title">{{ t("panel.transition") }}</h3>
            <div class="section-description">配置页面切换动画效果</div>
          </div>
          <div class="setting-content">
            <ScSwitch
              v-model="settings.menuTransition"
              layout="visual-card"
              size="small"
              :label="t('panel.menuTransitionChange')"
              description="页面切换时显示过渡动画"
              active-icon="ri:loader-4-line"
              ribbon-color="var(--el-color-primary)"
              @change="menuTransitionChange"
            />
          </div>
        </div>

        <!-- 界面显示设置区域 -->
        <div class="setting-section">
          <div class="section-header">
            <IconifyIconOffline :icon="'ri:eye-line'" class="section-icon" />
            <h3 class="section-title">{{ t("panel.pureInterfaceDisplay") }}</h3>
            <div class="section-description">自定义界面显示效果和功能开关</div>
          </div>
          <div class="setting-content">
            <!-- 视觉效果设置 -->
            <div class="setting-group">
              <h4 class="group-title">
                <IconifyIconOffline
                  :icon="'ri:palette-line'"
                  class="group-icon"
                />
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
                <IconifyIconOffline
                  :icon="'ri:layout-4-line'"
                  class="group-icon"
                />
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
                <IconifyIconOffline
                  :icon="'ri:settings-3-line'"
                  class="group-icon"
                />
                功能设置
              </h4>
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
            </div>
          </div>
        </div>

        <!-- 菜单设置区域 -->
        <div class="setting-section">
          <div class="section-header">
            <IconifyIconOffline :icon="'ri:menu-line'" class="section-icon" />
            <h3 class="section-title">菜单设置</h3>
            <div class="section-description">配置新增菜单的显示方式</div>
          </div>
          <div class="setting-content">
            <!-- 新菜单显示设置 -->
            <div class="setting-group">
              <h4 class="group-title">
                <IconifyIconOffline
                  :icon="'ri:add-circle-line'"
                  class="group-icon"
                />
                新菜单显示
              </h4>
              <ScSwitch
                v-model="settings.showNewMenu"
                layout="visual-card"
                size="small"
                label="显示新增菜单"
                description="在菜单项上显示新增标识"
                active-icon="ri:add-circle-line"
                ribbon-color="var(--el-color-primary)"
                @change="showNewMenuChange"
              />
            </div>

            <!-- 新菜单文本设置 -->
            <div class="setting-group">
              <h4 class="group-title">
                <IconifyIconOffline :icon="'ri:text'" class="group-icon" />
                显示文本
              </h4>
              <div class="input-item">
                <div class="input-info">
                  <label class="input-label">新菜单标识文本</label>
                  <span class="input-desc">自定义新菜单显示的文本内容</span>
                </div>
                <el-input
                  v-model="settings.newMenuText"
                  placeholder="请输入显示文本"
                  maxlength="10"
                  show-word-limit
                  @blur="newMenuTextChange"
                  style="width: 120px"
                />
              </div>
            </div>

            <!-- 时间限制设置 -->
            <div class="setting-group">
              <h4 class="group-title">
                <IconifyIconOffline :icon="'ri:time-line'" class="group-icon" />
                时间控制
              </h4>
              <div class="input-item">
                <div class="input-info">
                  <label class="input-label">显示时间限制</label>
                  <span class="input-desc"
                    >菜单创建后多少小时内显示新标识（小时）</span
                  >
                </div>
                <el-input-number
                  v-model="settings.newMenuTimeLimit"
                  :min="1"
                  :max="8760"
                  :step="1"
                  @change="newMenuTimeLimitChange"
                  style="width: 120px"
                />
              </div>
            </div>

            <!-- 新菜单动画设置 -->
            <div class="setting-group">
              <h4 class="group-title">
                <IconifyIconOffline
                  :icon="'ri:magic-line'"
                  class="group-icon"
                />
                动画效果
              </h4>
              <div class="setting-content">
                <Segmented
                  resize
                  class="select-none modern-segmented"
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
                    { label: '无', tip: '不显示动画', value: 'none' },
                    { label: '弹跳', tip: '弹跳动画效果', value: 'bounce' },
                    { label: '脉冲', tip: '脉冲动画效果', value: 'pulse' },
                    { label: '抖动', tip: '抖动动画效果', value: 'shake' },
                  ]"
                  @change="newMenuAnimationChange"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 高级设置区域 -->
        <div class="setting-section">
          <div class="section-header">
            <IconifyIconOffline :icon="'ri:tools-line'" class="section-icon" />
            <h3 class="section-title">高级设置</h3>
            <div class="section-description">更多个性化配置选项</div>
          </div>
          <div class="setting-content">
            <!-- 高级功能开关 -->
            <div class="setting-group">
              <h4 class="group-title">
                <IconifyIconOffline
                  :icon="'ri:settings-4-line'"
                  class="group-icon"
                />
                高级功能
              </h4>
              <div class="switch-card-grid">
                <ScSwitch
                  v-model="settings.keepAlive"
                  layout="visual-card"
                  size="small"
                  label="组件缓存"
                  description="提升页面切换速度"
                  active-icon="ri:speed-line"
                  ribbon-color="var(--el-color-success)"
                  @change="keepAliveChange"
                />

                <ScSwitch
                  v-model="settings.stretch"
                  layout="visual-card"
                  size="small"
                  label="页面拉伸"
                  description="充分利用屏幕空间"
                  active-icon="ri:fullscreen-line"
                  ribbon-color="var(--el-color-success)"
                />

                <ScSwitch
                  v-model="settings.debugMode"
                  layout="visual-card"
                  size="small"
                  label="调试模式"
                  description="控制台日志显示在右上角"
                  active-icon="ri:terminal-box-line"
                  ribbon-color="var(--el-color-warning)"
                  @change="debugModeChange"
                />
              </div>
            </div>

            <!-- 重置选项 -->
            <div class="setting-group">
              <h4 class="group-title">
                <IconifyIconOffline
                  :icon="'ri:refresh-line'"
                  class="group-icon"
                />
                重置选项
              </h4>
              <div class="reset-actions">
                <el-button type="warning" plain @click="resetToDefault">
                  <IconifyIconOffline :icon="'ri:restart-line'" />
                  恢复默认设置
                </el-button>
                <el-button type="info" plain @click="exportSettings">
                  <IconifyIconOffline :icon="'ri:download-line'" />
                  导出配置
                </el-button>
                <el-button type="success" plain @click="importSettings">
                  <IconifyIconOffline :icon="'ri:upload-line'" />
                  导入配置
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayPanel>

    <!-- 调试控制台 -->
    <ScDebugConsole
      v-if="settings.debugMode"
      ref="debugConsoleRef"
      @close="handleDebugConsoleClose"
    />
  </div>
</template>

<style lang="scss" scoped>
// 现代化动画关键帧
@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

@keyframes backgroundFloat {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }

  33% {
    transform: translateY(-10px) rotate(1deg);
  }

  66% {
    transform: translateY(5px) rotate(-1deg);
  }
}

@keyframes pulse-ring {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }

  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }

  100% {
    opacity: 0;
    transform: scale(1.3);
  }
}

@keyframes selectPulse {
  0%,
  100% {
    box-shadow:
      0 0 0 4px var(--el-color-primary-light-8),
      var(--el-box-shadow);
  }

  50% {
    box-shadow:
      0 0 0 6px var(--el-color-primary-light-7),
      0 4px 20px rgba(var(--el-color-primary-rgb), 0.3);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

// 现代化设置容器 - 全新设计语言
.modern-setting-container {
  padding: 24px;
  background: var(--el-bg-color-page);
  border-radius: 20px;
  min-height: 100vh;
  width: 440px;
  max-width: 100%;
  position: relative;
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 10px 30px rgba(0, 0, 0, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    var(--el-box-shadow-light);

  // 现代化背景装饰 - 动态渐变
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      var(--el-color-primary-light-5) 0%,
      var(--el-color-primary) 25%,
      var(--el-color-primary-dark-2) 50%,
      var(--el-color-primary) 75%,
      var(--el-color-primary-light-5) 100%
    );
    background-size: 200% 100%;
    animation: gradientShift 8s ease-in-out infinite;
    z-index: 0;
  }

  // 优雅的背景纹理
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 25% 25%,
        var(--el-color-primary-light-9) 0%,
        transparent 40%
      ),
      radial-gradient(
        circle at 75% 75%,
        var(--el-color-primary-light-9) 0%,
        transparent 40%
      ),
      radial-gradient(
        circle at 75% 25%,
        var(--el-color-success-light-9) 0%,
        transparent 30%
      ),
      radial-gradient(
        circle at 25% 75%,
        var(--el-color-warning-light-9) 0%,
        transparent 30%
      );
    opacity: 0.4;
    pointer-events: none;
    z-index: 0;
    animation: backgroundFloat 12s ease-in-out infinite;
  }

  // 确保内容在装饰之上
  > * {
    position: relative;
    z-index: 1;
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-bg-color-page);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.4),
      0 10px 30px rgba(0, 0, 0, 0.35),
      0 1px 0 rgba(255, 255, 255, 0.15) inset,
      var(--el-box-shadow-dark);

    &::before {
      background: linear-gradient(
        90deg,
        var(--el-color-primary-light-3) 0%,
        var(--el-color-primary-light-1) 25%,
        var(--el-color-primary) 50%,
        var(--el-color-primary-light-1) 75%,
        var(--el-color-primary-light-3) 100%
      );
    }

    &::after {
      opacity: 0.2;
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    width: 100%;
    padding: 16px;
    border-radius: 16px;
    box-shadow:
      0 15px 45px rgba(0, 0, 0, 0.12),
      0 8px 20px rgba(0, 0, 0, 0.1),
      0 1px 0 rgba(255, 255, 255, 0.8) inset,
      var(--el-box-shadow-light);

    .dark & {
      box-shadow:
        0 15px 45px rgba(0, 0, 0, 0.35),
        0 8px 20px rgba(0, 0, 0, 0.3),
        0 1px 0 rgba(255, 255, 255, 0.1) inset,
        var(--el-box-shadow-dark);
    }
  }
}

// 设置区域 - 现代化玻璃态卡片设计
.setting-section {
  margin-bottom: 24px;
  background: var(--el-bg-color-overlay);
  border-radius: 16px;
  padding: 24px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 8px 20px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 -1px 0 rgba(0, 0, 0, 0.05) inset;
  border: 1px solid var(--el-border-color-light);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;

  // 现代化装饰线 - 动态渐变
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--el-color-primary-light-5) 20%,
      var(--el-color-primary) 50%,
      var(--el-color-primary-light-5) 80%,
      transparent 100%
    );
    border-radius: 16px 16px 0 0;
    opacity: 0.6;
    transition: opacity 0.3s ease;
  }

  // 微妙的光泽效果
  &::after {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.6s ease;
    pointer-events: none;
  }

  // 优雅的悬停效果
  &:hover {
    background: var(--el-bg-color-overlay);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.15),
      0 12px 30px rgba(0, 0, 0, 0.12),
      0 1px 0 rgba(255, 255, 255, 0.9) inset,
      0 -1px 0 rgba(0, 0, 0, 0.05) inset;
    border-color: var(--el-color-primary-light-8);
    transform: translateY(-4px) scale(1.02);

    &::before {
      opacity: 1;
      background: linear-gradient(
        90deg,
        transparent 0%,
        var(--el-color-primary-light-3) 20%,
        var(--el-color-primary) 50%,
        var(--el-color-primary-light-3) 80%,
        transparent 100%
      );
    }

    &::after {
      opacity: 1;
    }
  }

  &:last-child {
    margin-bottom: 0;
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.4),
      0 8px 20px rgba(0, 0, 0, 0.3),
      0 1px 0 rgba(255, 255, 255, 0.1) inset,
      0 -1px 0 rgba(0, 0, 0, 0.2) inset;

    &:hover {
      background: var(--el-bg-color-overlay);
      box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.5),
        0 12px 30px rgba(0, 0, 0, 0.4),
        0 1px 0 rgba(255, 255, 255, 0.15) inset,
        0 -1px 0 rgba(0, 0, 0, 0.2) inset;
      border-color: var(--el-color-primary-light-6);
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    padding: 20px;
    margin-bottom: 20px;
    box-shadow:
      0 8px 30px rgba(0, 0, 0, 0.1),
      0 4px 15px rgba(0, 0, 0, 0.06),
      0 1px 0 rgba(255, 255, 255, 0.8) inset,
      0 -1px 0 rgba(0, 0, 0, 0.05) inset;

    &:hover {
      box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.15),
        0 8px 25px rgba(0, 0, 0, 0.1),
        0 1px 0 rgba(255, 255, 255, 0.9) inset,
        0 -1px 0 rgba(0, 0, 0, 0.05) inset;
    }

    .dark & {
      box-shadow:
        0 8px 30px rgba(0, 0, 0, 0.35),
        0 4px 15px rgba(0, 0, 0, 0.25),
        0 1px 0 rgba(255, 255, 255, 0.1) inset,
        0 -1px 0 rgba(0, 0, 0, 0.2) inset;

      &:hover {
        box-shadow:
          0 12px 40px rgba(0, 0, 0, 0.45),
          0 8px 25px rgba(0, 0, 0, 0.35),
          0 1px 0 rgba(255, 255, 255, 0.15) inset,
          0 -1px 0 rgba(0, 0, 0, 0.2) inset;
      }
    }
  }
}

// 区域标题 - 现代化设计
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  position: relative;
  flex-wrap: wrap;

  .section-description {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-left: auto;
    opacity: 0.8;
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 100%;
      margin-left: 0;
      margin-top: 4px;
      text-align: left;
    }
  }

  // 装饰性渐变线 - 更加动态
  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 50px;
    height: 3px;
    background: linear-gradient(
      90deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 50%,
      var(--el-color-success-light-5) 100%
    );
    border-radius: 2px;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
  }

  &:hover::after {
    width: 100px;
    background: linear-gradient(
      90deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-2) 30%,
      var(--el-color-success) 70%,
      var(--el-color-warning) 100%
    );
    box-shadow: 0 3px 12px rgba(var(--el-color-primary-rgb), 0.4);
  }

  .section-icon {
    font-size: 20px;
    color: var(--el-color-primary);
    margin-right: 14px;
    background: var(--el-fill-color-light);
    padding: 10px;
    border-radius: 12px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 4px 12px rgba(var(--el-color-primary-rgb), 0.15),
      0 1px 0 rgba(255, 255, 255, 0.8) inset;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    overflow: hidden;

    // 光泽效果
    &::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(
        circle,
        rgba(255, 255, 255, 0.3) 0%,
        transparent 70%
      );
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-2px) scale(1.08);
      box-shadow:
        0 8px 20px rgba(var(--el-color-primary-rgb), 0.25),
        0 1px 0 rgba(255, 255, 255, 0.9) inset;
      background: var(--el-color-primary-light-9);

      &::before {
        opacity: 1;
      }
    }

    // 暗色主题适配
    .dark & {
      background: var(--el-fill-color-dark);

      &:hover {
        background: var(--el-color-primary-light-8);
      }
    }
  }

  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0;
    flex: 1;
    letter-spacing: 0.5px;
    text-align: left;
    writing-mode: horizontal-tb;
    transition: all 0.3s ease;

    &:hover {
      color: var(--el-color-primary);
    }

    // 暗色主题适配
    .dark & {
      &:hover {
        color: var(--el-color-primary-light-5);
      }
    }
  }
}

// 设置内容区域 - 现代化设计
.setting-content {
  .modern-segmented {
    width: 100%;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }
  }
}

// 导航模式说明卡片
.layout-description-card {
  background: var(--el-fill-color-extra-light);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid var(--el-border-color-extra-light);

  .description-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: all 0.3s ease;
    cursor: pointer;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: var(--el-color-primary-light-9);
      transform: translateX(4px);
    }

    &.active {
      background: var(--el-color-primary-light-8);
      border: 1px solid var(--el-color-primary-light-6);

      .description-icon {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      h4 {
        color: var(--el-color-primary);
      }
    }

    .description-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--el-fill-color-light);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      font-size: 18px;
      color: var(--el-text-color-regular);
      transition: all 0.3s ease;
    }

    .description-content {
      flex: 1;

      h4 {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        transition: all 0.3s ease;
      }

      p {
        margin: 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        line-height: 1.4;
      }
    }
  }
}

// 覆盖：将描述文本合并到下方 li 中心显示
.pure-theme li .layout-desc {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px;
  font-size: 8px !important;
  z-index: 2;
  pointer-events: none;

  h4 {
    margin: 0 0 6px 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
    padding: 0 6px;
  }
}

// 移除底部 data-label 文案，避免与内嵌描述重复
.pure-theme li::after {
  content: "";
  background: transparent;
  padding: 0;
  border: 0;
  box-shadow: none;
}

// 设置组样式
.setting-group {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  .group-title {
    display: flex;
    align-items: center;
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .group-icon {
      margin-right: 8px;
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }
}

// 开关信息样式
.switch-info {
  flex: 1;

  .switch-desc {
    display: block;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    margin-top: 2px;
    line-height: 1.3;
  }
}

// 重置操作按钮组
.reset-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  .el-button {
    flex: 1;
    min-width: 120px;

    @media (max-width: 768px) {
      min-width: 100px;
      font-size: 12px;
    }
  }
}

// 美化 Segmented 组件 - 现代化设计
:deep(.layui-segmented) {
  background: var(--el-fill-color-extra-light);
  border-radius: 12px;
  padding: 6px;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--el-border-color-extra-light);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    background-color 0.3s ease;

  .layui-segmented-item {
    border-radius: 8px;
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      background-color 0.2s ease,
      color 0.2s ease;
    font-weight: 500;
    color: var(--el-text-color-regular);
    padding: 10px 16px;
    position: relative;
    overflow: hidden;
    font-size: 14px;
    text-align: center;
    writing-mode: horizontal-tb;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    // 微交互效果
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(var(--el-color-primary-rgb), 0.15),
        transparent
      );
      transition: left 0.6s ease;
    }

    // 光泽效果
    &::after {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(
        circle,
        rgba(255, 255, 255, 0.2) 0%,
        transparent 70%
      );
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    &:hover {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      transform: translateY(-2px);
      box-shadow:
        0 4px 12px rgba(var(--el-color-primary-rgb), 0.15),
        0 1px 0 rgba(255, 255, 255, 0.8) inset;

      &::before {
        left: 100%;
      }

      &::after {
        opacity: 1;
      }
    }

    &.layui-segmented-checked {
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-9),
        var(--el-color-primary-light-8)
      );
      color: var(--el-color-primary);
      box-shadow:
        0 4px 16px rgba(var(--el-color-primary-rgb), 0.25),
        0 1px 0 rgba(255, 255, 255, 0.9) inset,
        0 0 0 1px var(--el-color-primary-light-7);
      font-weight: 600;
      transform: translateY(-2px);
      border: none;

      &::before {
        display: none;
      }

      &::after {
        opacity: 0.7;
      }
    }
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-fill-color-dark);
    border-color: var(--el-border-color);
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.2),
      0 4px 12px rgba(0, 0, 0, 0.3);

    .layui-segmented-item {
      &:hover {
        background: var(--el-color-primary-light-8);
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.25),
          0 1px 0 rgba(255, 255, 255, 0.1) inset;
      }

      &.layui-segmented-checked {
        background: linear-gradient(
          135deg,
          var(--el-color-primary-light-8),
          var(--el-color-primary-light-7)
        );
        box-shadow:
          0 4px 16px rgba(var(--el-color-primary-rgb), 0.4),
          0 1px 0 rgba(255, 255, 255, 0.15) inset,
          0 0 0 1px var(--el-color-primary-light-6);
      }
    }
  }
}

// 设置项 - 现代化设计
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  border-radius: 8px;
  margin-bottom: 6px;
  background: var(--el-fill-color-extra-light);
  // 优化 transition，避免主题切换延迟
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  // 左侧装饰条
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(
      180deg,
      var(--el-color-primary),
      var(--el-color-primary-light-3)
    );
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform 0.3s ease;
  }

  &:hover {
    background: var(--el-color-primary-light-9);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.1);

    &::before {
      transform: scaleY(1);
    }
  }

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  &:first-child {
    margin-top: 0;
  }

  .setting-label {
    font-size: 14px;
    color: var(--el-text-color-regular);
    font-weight: 500;
    margin: 0;
    flex: 1;
    letter-spacing: 0.2px;
    text-align: left;
    writing-mode: horizontal-tb;
  }
}

// 开关网格布局 - 现代化设计
.switch-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: var(--el-fill-color-extra-light);
  border-radius: 10px;
  // 优化 transition，避免主题切换延迟
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--el-border-color-extra-light);
  position: relative;
  overflow: hidden;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.06),
    0 1px 0 rgba(255, 255, 255, 0.7) inset;

  // 背景动画效果
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(var(--el-color-primary-rgb), 0.05),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    background: var(--el-color-primary-light-9);
    transform: translateY(-2px);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.12),
      0 4px 12px rgba(0, 0, 0, 0.1),
      0 1px 0 rgba(255, 255, 255, 0.8) inset;
    border-color: var(--el-color-primary-light-8);

    &::before {
      left: 100%;
    }
  }

  .switch-label {
    font-size: 14px;
    color: var(--el-text-color-regular);
    font-weight: 500;
    margin: 0;
    flex: 1;
    letter-spacing: 0.2px;
    text-align: left;
    writing-mode: horizontal-tb;
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-fill-color-dark);
    border-color: var(--el-border-color);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.25),
      0 2px 6px rgba(0, 0, 0, 0.2),
      0 1px 0 rgba(255, 255, 255, 0.1) inset;

    &:hover {
      background: var(--el-color-primary-light-8);
      border-color: var(--el-color-primary-light-6);
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.35),
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 0 rgba(255, 255, 255, 0.15) inset;
    }
  }
}

// 拉伸按钮样式 - 现代化设计
.stretch-button {
  background: var(--el-bg-color-overlay);
  border: 2px solid var(--el-border-color-extra-light);
  border-radius: 12px;
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  // 优化 transition，避免主题切换延迟
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  // 背景装饰
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(var(--el-color-primary-rgb), 0.05),
      transparent
    );
    transition: left 0.6s ease;
  }

  &:hover {
    border-color: var(--el-color-primary-light-7);
    background: var(--el-color-primary-light-9);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.1);

    &::before {
      left: 100%;
    }

    .stretch-line {
      background: linear-gradient(
        90deg,
        var(--el-color-primary),
        var(--el-color-primary-light-3),
        var(--el-color-primary)
      );
    }
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
  }

  .stretch-indicator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.3s ease;
    color: var(--el-color-primary);
    position: relative;
    z-index: 1;
    width: 80%;

    .stretch-line {
      flex: 1;
      height: 2px;
      background: linear-gradient(
        90deg,
        var(--el-color-primary-light-5),
        var(--el-color-primary),
        var(--el-color-primary-light-5)
      );
      border-radius: 1px;
      margin: 0 12px;
      position: relative;
      transition: all 0.3s ease;

      // 动态光效
      &::after {
        content: "";
        position: absolute;
        top: -1px;
        left: -2px;
        right: -2px;
        bottom: -1px;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(var(--el-color-primary-rgb), 0.3),
          transparent
        );
        border-radius: 2px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
    }

    &:hover .stretch-line::after {
      opacity: 1;
    }
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

    &:hover {
      background: var(--el-color-primary-light-8);
      border-color: var(--el-color-primary-light-6);
      box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.2);
    }
  }
}

// 移除 shimmer 动画关键帧
// @keyframes shimmer 已被移除

// 重置按钮 - 现代化设计
.reset-button {
  width: 100%;
  margin-top: 20px;
  border-radius: 12px;
  height: 48px;
  font-weight: 600;
  background: linear-gradient(
    135deg,
    var(--el-color-danger),
    var(--el-color-danger-light-3)
  );
  border: none;
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(var(--el-color-danger-rgb), 0.25);
  // 优化 transition，避免主题切换延迟
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
  position: relative;
  overflow: hidden;

  // 光泽效果
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.6s ease;
  }

  &:hover {
    background: linear-gradient(
      135deg,
      var(--el-color-danger-light-3),
      var(--el-color-danger)
    );
    box-shadow: 0 6px 20px rgba(var(--el-color-danger-rgb), 0.35);
    transform: translateY(-2px);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--el-color-danger-rgb), 0.3);
  }

  // 暗色主题适配
  .dark & {
    box-shadow: 0 4px 16px rgba(var(--el-color-danger-rgb), 0.3);

    &:hover {
      box-shadow: 0 6px 20px rgba(var(--el-color-danger-rgb), 0.4);
    }
  }
}

// 输入项样式
.input-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.06),
    0 1px 0 rgba(255, 255, 255, 0.7) inset;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: left 0.6s ease;
  }

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.12),
      0 4px 12px rgba(0, 0, 0, 0.1),
      0 1px 0 rgba(255, 255, 255, 0.8) inset;
    transform: translateY(-2px);

    &::before {
      left: 100%;
    }
  }

  .input-info {
    flex: 1;
    margin-right: 16px;

    .input-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
      line-height: 1.4;
    }

    .input-desc {
      font-size: 12px;
      color: var(--el-text-color-regular);
      line-height: 1.4;
      opacity: 0.8;
    }
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.25),
      0 2px 6px rgba(0, 0, 0, 0.2),
      0 1px 0 rgba(255, 255, 255, 0.1) inset;

    &:hover {
      border-color: var(--el-color-primary-light-3);
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.35),
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 0 rgba(255, 255, 255, 0.15) inset;
    }
  }
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.3s ease;
  border: 1px solid var(--el-border-color-light);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  // 背景动画效果
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(var(--el-color-primary-rgb), 0.1),
      transparent
    );
    transition: left 0.6s ease;
  }

  // 光泽效果
  &::after {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 70%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  &:hover {
    background: var(--el-color-primary-light-9);
    transform: translateY(-2px);
    box-shadow:
      0 6px 16px rgba(var(--el-color-primary-rgb), 0.15),
      0 1px 0 rgba(255, 255, 255, 0.8) inset;
    border-color: var(--el-color-primary-light-8);

    &::before {
      left: 100%;
    }

    &::after {
      opacity: 1;
    }
  }

  .switch-label {
    font-size: 15px;
    color: var(--el-text-color-regular);
    font-weight: 500;
    margin: 0;
    flex: 1;
    letter-spacing: 0.2px;
    text-align: left;
    writing-mode: horizontal-tb;
  }

  .switch-desc {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-top: 4px;
    line-height: 1.4;
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-fill-color-dark);
    border-color: var(--el-border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

    &:hover {
      background: var(--el-color-primary-light-8);
      border-color: var(--el-color-primary-light-6);
      box-shadow:
        0 6px 16px rgba(0, 0, 0, 0.3),
        0 1px 0 rgba(255, 255, 255, 0.1) inset;
    }
  }
}

:deep(.el-divider__text) {
  font-size: 16px;
  font-weight: 700;
}

// Element Plus 开关组件 - 现代化设计
:deep(.el-switch) {
  --el-switch-on-color: var(--el-color-primary);
  --el-switch-off-color: var(--el-fill-color);

  .el-switch__core {
    min-width: 48px;
    height: 24px;
    border-radius: 24px;
    border: none;
    // 优化 transition，加快背景色切换
    transition:
      background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    position: relative;
    background: var(--el-switch-off-color);

    // 添加内部光泽效果
    &::before {
      content: "";
      position: absolute;
      top: 1px;
      left: 1px;
      right: 1px;
      bottom: 1px;
      border-radius: 23px;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.2),
        rgba(255, 255, 255, 0.05)
      );
      pointer-events: none;
    }

    .el-switch__inner {
      position: absolute;
      left: 26px;
      right: 6px;
      top: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--el-text-color-primary);
      font-size: 10px;
      font-weight: 600;
    }

    .el-switch__action {
      width: 20px;
      height: 20px;
      left: initial !important;
      background: linear-gradient(135deg, #ffffff, #f8f9fa);
      border-radius: 50%;
      // 优化 transition，加快位置和背景色切换
      transition:
        transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
        background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.8);

      // 内部光泽效果
      &::after {
        content: "";
        position: absolute;
        top: 1px;
        left: 1px;
        right: 1px;
        bottom: 1px;
        border-radius: 50%;
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        pointer-events: none;
      }
    }
  }

  &.is-checked {
    .el-switch__core {
      background: linear-gradient(
        135deg,
        var(--el-switch-on-color),
        var(--el-color-primary-light-3)
      );
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);

      .el-switch__action {
        transform: translateX(24px);
        box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.2);
        background: linear-gradient(135deg, #ffffff, #f8f9fa);

        &::before {
          content: "✓";
          font-size: 11px;
          font-weight: bold;
          color: var(--el-color-primary);
          position: absolute;
          z-index: 1;
        }
      }
    }
  }

  &:not(.is-checked) {
    .el-switch__core {
      background: linear-gradient(
        135deg,
        var(--el-switch-off-color),
        var(--el-fill-color-light)
      );

      .el-switch__action {
        transform: translateX(2px);

        &::before {
          content: "×";
          font-size: 11px;
          font-weight: bold;
          color: var(--el-text-color-placeholder);
          position: absolute;
          z-index: 1;
        }
      }
    }
  }

  // 悬停效果
  &:hover {
    .el-switch__core {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: scale(1.02);
    }

    &.is-checked .el-switch__core {
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.4);
    }

    .el-switch__action {
      transform: translateX(2px) scale(1.05);
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);

      &::after {
        opacity: 1;
      }
    }

    &.is-checked .el-switch__action {
      transform: translateX(24px) scale(1.05);
      box-shadow: 0 3px 8px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }

  // 点击效果
  &:active {
    .el-switch__core {
      transform: scale(0.98);
    }

    .el-switch__action {
      transform: translateX(2px) scale(0.95);
    }

    &.is-checked .el-switch__action {
      transform: translateX(24px) scale(0.95);
    }
  }

  // 暗色主题适配
  .dark & {
    .el-switch__core {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

      &::before {
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.1),
          rgba(255, 255, 255, 0.02)
        );
      }
    }

    .el-switch__action {
      background: linear-gradient(
        135deg,
        var(--el-bg-color),
        var(--el-bg-color-overlay)
      );
      border-color: var(--el-border-color);
    }

    &:hover .el-switch__core {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    &.is-checked:hover .el-switch__core {
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.5);
    }
  }
}

// 美化其他按钮样式（无动画版本）
:deep(.el-button) {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-weight: 500;

  // 悬停效果
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  // 点击效果
  &:active {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.is-plain {
    &:hover {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
    }
  }

  &.el-button--primary {
    background: linear-gradient(
      135deg,
      var(--el-color-primary),
      var(--el-color-primary-light-3)
    );
    border: none;
    color: var(--el-color-white);

    &:hover {
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-3),
        var(--el-color-primary)
      );
      box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }

  &.el-button--danger {
    background: linear-gradient(
      135deg,
      var(--el-color-danger),
      var(--el-color-danger-light-3)
    );
    border: none;
    color: var(--el-color-white);

    &:hover {
      background: linear-gradient(
        135deg,
        var(--el-color-danger-light-3),
        var(--el-color-danger)
      );
      box-shadow: 0 6px 16px rgba(var(--el-color-danger-rgb), 0.3);
    }
  }

  &.el-button--warning {
    background: linear-gradient(
      135deg,
      var(--el-color-warning),
      var(--el-color-warning-light-3)
    );
    border: none;
    color: var(--el-color-white);

    &:hover {
      background: linear-gradient(
        135deg,
        var(--el-color-warning-light-3),
        var(--el-color-warning)
      );
      box-shadow: 0 6px 16px rgba(var(--el-color-warning-rgb), 0.3);
    }
  }

  &.el-button--info {
    background: linear-gradient(
      135deg,
      var(--el-color-info),
      var(--el-color-info-light-3)
    );
    border: none;
    color: var(--el-color-white);

    &:hover {
      background: linear-gradient(
        135deg,
        var(--el-color-info-light-3),
        var(--el-color-info)
      );
      box-shadow: 0 6px 16px rgba(var(--el-color-info-rgb), 0.3);
    }
  }

  &.el-button--success {
    background: linear-gradient(
      135deg,
      var(--el-color-success),
      var(--el-color-success-light-3)
    );
    border: none;
    color: var(--el-color-white);

    &:hover {
      background: linear-gradient(
        135deg,
        var(--el-color-success-light-3),
        var(--el-color-success)
      );
      box-shadow: 0 6px 16px rgba(var(--el-color-success-rgb), 0.3);
    }
  }
}

// 现代化数字输入框样式
.layout-params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.param-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.06),
    0 1px 0 rgba(255, 255, 255, 0.7) inset;

  &:hover {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-8);
    transform: translateY(-3px);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.12),
      0 4px 12px rgba(0, 0, 0, 0.1),
      0 1px 0 rgba(255, 255, 255, 0.8) inset;
  }

  .param-label {
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    margin: 0;
    flex: 1;
    text-align: left;
    writing-mode: horizontal-tb;
    white-space: nowrap;
  }

  // 暗色主题适配
  .dark & {
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.25),
      0 2px 6px rgba(0, 0, 0, 0.2),
      0 1px 0 rgba(255, 255, 255, 0.1) inset;

    &:hover {
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.35),
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 1px 0 rgba(255, 255, 255, 0.15) inset;
    }
  }
}

.custom-number-input {
  display: flex;
  align-items: center;
  background: var(--el-bg-color-overlay);
  border-radius: 10px;
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.1),
    0 2px 6px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.7) inset;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary-light-7);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.15),
      0 4px 12px rgba(0, 0, 0, 0.12),
      0 1px 0 rgba(255, 255, 255, 0.8) inset;
  }

  &:focus-within {
    border-color: var(--el-color-primary);
    box-shadow:
      0 0 0 4px rgba(var(--el-color-primary-rgb), 0.3),
      0 8px 24px rgba(0, 0, 0, 0.18),
      0 4px 12px rgba(0, 0, 0, 0.15),
      0 1px 0 rgba(255, 255, 255, 0.9) inset;
  }

  .number-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

    &:hover:not(:disabled) {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &:active:not(:disabled) {
      background: var(--el-color-primary-light-8);
      transform: scale(0.95);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: var(--el-fill-color-lighter);
    }

    &.decrease {
      border-radius: 0;
    }

    &.increase {
      border-radius: 0;
    }
  }

  .number-display {
    display: flex;
    align-items: center;
    background: var(--el-bg-color-overlay);
    padding: 0 12px;
    min-width: 90px;
    justify-content: center;
    position: relative;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) inset;

    .number-input {
      border: none;
      background: transparent;
      color: var(--el-text-color-primary);
      font-size: 16px;
      font-weight: 700;
      text-align: center;
      width: 50px;
      outline: none;
      padding: 0;

      // 隐藏数字输入框的默认箭头
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      &[type="number"] {
        appearance: textfield;
        -moz-appearance: textfield;
      }

      &:focus {
        color: var(--el-color-primary);
      }
    }

    .number-unit {
      font-size: 13px;
      color: var(--el-text-color-placeholder);
      margin-left: 6px;
      font-weight: 500;
    }
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.35),
      0 2px 6px rgba(0, 0, 0, 0.3),
      0 1px 0 rgba(255, 255, 255, 0.1) inset;

    .number-btn {
      background: var(--el-fill-color-dark);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);

      &:hover:not(:disabled) {
        background: var(--el-color-primary-light-8);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      }

      &:active:not(:disabled) {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
    }

    .number-display {
      background: var(--el-bg-color-overlay);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) inset;
    }

    &:hover {
      border-color: var(--el-color-primary-light-6);
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.45),
        0 4px 12px rgba(0, 0, 0, 0.4),
        0 1px 0 rgba(255, 255, 255, 0.15) inset;
    }

    &:focus-within {
      box-shadow:
        0 0 0 4px rgba(var(--el-color-primary-rgb), 0.45),
        0 8px 24px rgba(0, 0, 0, 0.5),
        0 4px 12px rgba(0, 0, 0, 0.45),
        0 1px 0 rgba(255, 255, 255, 0.2) inset;
    }
  }
}

// 美化原有输入框样式（保留兼容性）
:deep(.el-input-number) {
  width: 100%;
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  box-shadow: var(--el-box-shadow-lighter);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-border-color-hover);
    box-shadow: var(--el-box-shadow-light);
    transform: translateY(-1px);
  }

  &:focus-within {
    border-color: var(--el-color-primary);
    box-shadow:
      var(--el-box-shadow-light),
      0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
  }

  .el-input-number__decrease,
  .el-input-number__increase {
    transition: all 0.3s ease;
    border: none;
    border-radius: 8px;
    margin: 2px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);

    &:hover {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      transform: scale(1.1);
      box-shadow: var(--el-box-shadow-lighter);
    }

    &:active {
      background: var(--el-color-primary-light-8);
      transform: scale(0.95);
    }
  }

  .el-input__wrapper {
    box-shadow: none !important;
    border: 2px solid var(--el-border-color);
    transition: all 0.3s ease;
    border-radius: 10px;
    background: var(--el-bg-color-overlay);

    &:hover {
      border-color: var(--el-border-color-hover);
      background: var(--el-fill-color-extra-light);
    }

    &.is-focus {
      border-color: var(--el-color-primary);
      background: var(--el-bg-color-overlay);
      box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.1);
    }

    .el-input__inner {
      font-weight: 500;
      color: var(--el-text-color-primary);
      text-align: center;
    }
  }
}

// 现代化主题色选择器 - 玻璃态设计
.theme-color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  gap: 16px;
  margin-top: 20px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-light);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 3px 8px rgba(0, 0, 0, 0.06),
    0 1px 0 rgba(255, 255, 255, 0.7) inset;
}

.theme-color-item {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 2px solid var(--el-border-color-light);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.12),
    0 3px 8px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.7) inset;

  // 基础光泽效果
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.1) 100%
    );
    pointer-events: none;
    z-index: 1;
  }

  // 悬停效果
  &:hover {
    transform: translateY(-8px) scale(1.15);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.25),
      0 6px 16px rgba(0, 0, 0, 0.18),
      0 1px 0 rgba(255, 255, 255, 0.9) inset;
    border-color: var(--el-color-primary-light-7);

    .shine-effect {
      opacity: 1;
      transform: translateX(100%);
    }

    .selection-indicator {
      transform: scale(1.2);
    }

    &::before {
      opacity: 1;
    }
  }

  // 点击效果
  &:active {
    transform: translateY(-4px) scale(1.1);
  }

  // 选中状态
  &.is-selected {
    border-color: var(--el-color-primary);
    box-shadow:
      0 0 0 4px rgba(var(--el-color-primary-rgb), 0.4),
      0 12px 32px rgba(var(--el-color-primary-rgb), 0.35),
      0 6px 16px rgba(var(--el-color-primary-rgb), 0.25),
      0 1px 0 rgba(255, 255, 255, 0.9) inset;
    transform: translateY(-4px) scale(1.1);

    .selection-indicator {
      opacity: 1;
      transform: scale(1.15);

      .check-ring {
        background: var(--el-color-white);
        border-color: var(--el-color-primary);
        transform: scale(1.15);

        .check-icon {
          opacity: 1;
          transform: scale(1.15);
          color: var(--el-color-primary);
        }
      }
    }

    // 选中状态的脉冲动画
    &::after {
      content: "";
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border-radius: 10px;
      border: 2px solid var(--el-color-primary);
      opacity: 0;
      animation: pulse-ring 1.5s infinite;
      pointer-events: none;
      z-index: 10;
    }
  }

  // 暗色主题适配
  .dark & {
    border-color: var(--el-border-color);
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.5),
      0 3px 8px rgba(0, 0, 0, 0.4),
      0 1px 0 rgba(255, 255, 255, 0.1) inset;

    &:hover {
      border-color: var(--el-color-primary-light-4);
      box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.6),
        0 6px 16px rgba(0, 0, 0, 0.5),
        0 1px 0 rgba(255, 255, 255, 0.15) inset;
    }

    &.is-selected {
      box-shadow:
        0 0 0 4px rgba(var(--el-color-primary-rgb), 0.4),
        0 12px 32px rgba(var(--el-color-primary-rgb), 0.5),
        0 6px 16px rgba(var(--el-color-primary-rgb), 0.4),
        0 1px 0 rgba(255, 255, 255, 0.15) inset;
    }
  }
}

// 选中状态指示器
.selection-indicator {
  position: absolute;
  top: 3px;
  right: 3px;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;

  .check-ring {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(0.8);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(4px);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

    .check-icon {
      font-size: 7px;
      opacity: 0;
      transform: scale(0.5);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: var(--el-color-primary);
    }
  }
}

// 光泽效果
.shine-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  opacity: 0;
  transform: translateX(-100%);
  transition: all 0.6s ease;
  pointer-events: none;
  z-index: 2;
}

// 脉冲动画
@keyframes pulse-ring {
  0% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }

  100% {
    opacity: 0;
    transform: scale(1.1);
  }
}

// 节日主题部分样式
.festival-themes-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);

  .festival-themes-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;

    .festival-icon {
      font-size: 18px;
    }
  }
  
  .festival-themes-subtitle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    margin-top: 24px;
    margin-bottom: 12px;
    padding-top: 16px;
    border-top: 1px dashed var(--el-border-color-lighter);
  }
}

// 主题卡片网格
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

// 主题卡片样式
.theme-card {
  position: relative;
  padding: 20px 16px;
  border: 2px solid var(--el-border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-bg-color);
  text-align: center;

  &:hover {
    border-color: var(--el-color-primary);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

    .card-icon {
      transform: scale(1.1);
    }
  }

  &.is-active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);

    .card-name {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      border-color: var(--el-border-color);
      transform: none;
      box-shadow: none;
      
      .card-icon {
        transform: none;
      }
    }
  }

  &.festival {
    border-style: dashed;
  }

  .card-icon {
    font-size: 48px;
    margin-bottom: 12px;
    transition: transform 0.3s ease;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .card-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  .card-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .card-check {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    background: var(--el-color-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    animation: checkBounce 0.5s ease;
  }
}

// 检查动画
@keyframes checkBounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.festival-theme-item {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 2px solid var(--el-border-color-light);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.12),
    0 3px 8px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.7) inset;

  // 基础光泽效果
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.4) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.1) 100%
    );
    pointer-events: none;
    z-index: 1;
  }

  // 悬停效果
  &:hover {
    transform: translateY(-8px) scale(1.15);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.25),
      0 6px 16px rgba(0, 0, 0, 0.18),
      0 1px 0 rgba(255, 255, 255, 0.9) inset;
    border-color: var(--el-color-primary-light-7);

    .shine-effect {
      opacity: 1;
      transform: translateX(100%);
    }

    .selection-indicator {
      transform: scale(1.2);
    }

    &::before {
      opacity: 1;
    }
  }

  // 点击效果
  &:active {
    transform: translateY(-4px) scale(1.1);
  }

  // 选中状态
  &.is-selected {
    border-color: var(--el-color-primary);
    box-shadow:
      0 0 0 4px rgba(var(--el-color-primary-rgb), 0.4),
      0 12px 32px rgba(var(--el-color-primary-rgb), 0.35),
      0 6px 16px rgba(var(--el-color-primary-rgb), 0.25),
      0 1px 0 rgba(255, 255, 255, 0.9) inset;
    transform: translateY(-4px) scale(1.1);

    .selection-indicator {
      opacity: 1;
      transform: scale(1.15);

      .check-ring {
        background: var(--el-color-white);
        border-color: var(--el-color-primary);
        transform: scale(1.15);

        .check-icon {
          opacity: 1;
          transform: scale(1.15);
          color: var(--el-color-primary);
        }
      }
    }

    // 选中状态的脉冲动画
    &::after {
      content: "";
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border-radius: 10px;
      border: 2px solid var(--el-color-primary);
      opacity: 0;
      animation: pulse-ring 1.5s infinite;
      pointer-events: none;
      z-index: 10;
    }
  }

  // 暗色主题适配
  .dark & {
    border-color: var(--el-border-color);
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.5),
      0 3px 8px rgba(0, 0, 0, 0.4),
      0 1px 0 rgba(255, 255, 255, 0.1) inset;

    &:hover {
      border-color: var(--el-color-primary-light-4);
      box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.6),
        0 6px 16px rgba(0, 0, 0, 0.5),
        0 1px 0 rgba(255, 255, 255, 0.15) inset;
    }

    &.is-selected {
      box-shadow:
        0 0 0 4px rgba(var(--el-color-primary-rgb), 0.4),
        0 12px 32px rgba(var(--el-color-primary-rgb), 0.5),
        0 6px 16px rgba(var(--el-color-primary-rgb), 0.4),
        0 1px 0 rgba(255, 255, 255, 0.15) inset;
    }
  }
}

// 现代化 el-segmented 样式 - 图标在上文字在下
.modern-el-segmented {
  width: 100%;
  background: var(--el-fill-color-extra-light);
  border-radius: 10px;
  padding: 4px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--el-border-color-extra-light);

  :deep(.el-segmented-item) {
    border-radius: 6px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 12px 8px;
    min-height: 60px;

    &:hover {
      background: var(--el-color-primary-light-9);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.1);
    }

    &.is-selected {
      background: var(--el-bg-color-overlay);
      color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.15);
      border: 1px solid var(--el-color-primary-light-8);
      transform: translateY(-1px);
    }
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-fill-color-dark);
    border-color: var(--el-border-color);

    :deep(.el-segmented-item) {
      &:hover {
        background: var(--el-color-primary-light-8);
      }

      &.is-selected {
        background: var(--el-bg-color-overlay);
        border-color: var(--el-color-primary-light-6);
      }
    }
  }
}

// 垂直布局的分段项
.segmented-item-vertical {
  .item-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 100%;

    .item-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      transition: all 0.3s ease;
    }

    .item-label {
      font-size: 12px;
      font-weight: 500;
      text-align: center;
      line-height: 1.2;
      transition: all 0.3s ease;
    }
  }

  &:hover .item-content {
    .item-icon {
      transform: scale(1.1);
    }

    .item-label {
      font-weight: 600;
    }
  }

  &.is-selected .item-content {
    .item-icon {
      transform: scale(1.1);
      color: var(--el-color-primary);
    }

    .item-label {
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }
}

// 移除 checkmark 动画
// @keyframes checkmark - 已移除

// 移除 pulse 动画
// @keyframes pulse - 已移除

// 移除 selectPulse 动画
// @keyframes selectPulse - 已移除

// 移除 fadeInUp 动画
// @keyframes fadeInUp - 已移除

// 移除设置区域的进入动画
// .setting-section animation - 已移除

// 布局模式选择器 - 现代化卡片网格设计
.layout-mode-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 8px 0;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

.layout-mode-item {
  position: relative;
  display: flex;
  flex-direction: column;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.02),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);

  /* 顶部光泽效果 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.5) 0%,
      transparent 100%
    );
    pointer-events: none;
    z-index: 1;
    border-radius: 20px 20px 0 0;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: rgba(var(--el-color-primary-rgb), 0.3);
    box-shadow:
      0 20px 40px rgba(var(--el-color-primary-rgb), 0.15),
      0 8px 20px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);

    .layout-mode-preview {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.08) 0%,
        rgba(var(--el-color-primary-rgb), 0.04) 100%
      );

      svg {
        transform: scale(1.1) rotate(-3deg);
        color: var(--el-color-primary);
        filter: drop-shadow(0 4px 8px rgba(var(--el-color-primary-rgb), 0.3));
      }
    }

    .layout-mode-name {
      color: var(--el-color-primary);
    }

    .layout-mode-desc {
      color: var(--el-color-primary-light-3);
    }
  }

  &.is-active {
    background: linear-gradient(
      145deg,
      rgba(var(--el-color-primary-rgb), 0.1) 0%,
      rgba(var(--el-color-primary-rgb), 0.05) 100%
    );
    border-color: var(--el-color-primary);
    box-shadow:
      0 0 0 3px rgba(var(--el-color-primary-rgb), 0.15),
      0 12px 32px rgba(var(--el-color-primary-rgb), 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);

    .layout-mode-preview {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.12) 0%,
        rgba(var(--el-color-primary-rgb), 0.06) 100%
      );

      svg {
        color: var(--el-color-primary);
        filter: drop-shadow(0 2px 6px rgba(var(--el-color-primary-rgb), 0.25));
      }
    }

    .layout-mode-name {
      color: var(--el-color-primary);
      font-weight: 600;
    }

    .layout-mode-desc {
      color: var(--el-color-primary-light-3);
    }
  }
}

.layout-mode-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 85px;
  padding: 14px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  svg {
    width: 100%;
    height: 100%;
    max-width: 120px;
    max-height: 60px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--el-text-color-regular);
    border-radius: 8px;
  }
}

.layout-mode-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 10px;
  gap: 4px;
  background: transparent;
}

// Logo 配置样式
.logo-config-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .config-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .config-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .config-control {
    :deep(.el-slider) {
      .el-slider__runway {
        background: var(--el-fill-color-light);
      }

      .el-slider__bar {
        background: var(--el-color-primary);
      }

      .el-slider__button {
        border-color: var(--el-color-primary);
      }

      .el-input-number {
        width: 70px;
      }
    }
  }
}

.layout-mode-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  transition: all 0.3s ease;
}

.layout-mode-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  transition: all 0.3s ease;
}

/* 移动导航提示样式 */
.mobile-nav-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .tip-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.08) 0%,
      rgba(var(--el-color-primary-rgb), 0.03) 100%
    );
    border-radius: 12px;
    border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: translateX(4px);
      border-color: rgba(var(--el-color-primary-rgb), 0.2);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.1);
    }

    .tip-icon {
      font-size: 20px;
      color: var(--el-color-primary);
      flex-shrink: 0;
    }

    span {
      font-size: 14px;
      color: var(--el-text-color-primary);
      font-weight: 500;
    }
  }
}

.layout-mode-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary);
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.4);
  animation: badge-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes badge-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// 深色模式适配
html.dark {
  .layout-mode-item {
    background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.3),
      0 1px 3px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);

    &::before {
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.03) 0%,
        transparent 100%
      );
    }

    &:hover {
      background: linear-gradient(145deg, #334155 0%, #1e293b 100%);
      border-color: rgba(var(--el-color-primary-rgb), 0.5);
      box-shadow:
        0 20px 40px rgba(0, 0, 0, 0.4),
        0 8px 20px rgba(var(--el-color-primary-rgb), 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    &.is-active {
      background: linear-gradient(
        145deg,
        rgba(var(--el-color-primary-rgb), 0.2) 0%,
        rgba(var(--el-color-primary-rgb), 0.1) 100%
      );
      border-color: var(--el-color-primary);
      box-shadow:
        0 0 0 3px rgba(var(--el-color-primary-rgb), 0.2),
        0 12px 32px rgba(var(--el-color-primary-rgb), 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);

      .layout-mode-preview svg {
        color: var(--el-color-primary-light-3);
      }

      .layout-mode-name {
        color: var(--el-color-primary-light-3);
      }
    }
  }

  .layout-mode-preview {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-color: rgba(255, 255, 255, 0.05);

    svg {
      color: var(--el-text-color-regular);
    }
  }

  .layout-mode-badge {
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.5),
      0 0 0 2px rgba(var(--el-color-primary-rgb), 0.3);
  }
}

// 保留旧的 pure-theme 样式以兼容其他地方的使用
.pure-theme {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 28px;
  padding: 16px;

  li {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    height: 90px;
    background: var(--el-bg-color-overlay);
    border-radius: 20px;
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.12),
      0 6px 18px rgba(0, 0, 0, 0.08),
      0 1px 0 rgba(255, 255, 255, 0.8) inset,
      0 -1px 0 rgba(0, 0, 0, 0.05) inset;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    border: 1px solid var(--el-border-color-light);
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    padding: 0;

    // 现代化光泽效果
    &::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(
        circle,
        rgba(255, 255, 255, 0.25) 0%,
        transparent 70%
      );
      opacity: 0;
      transition: all 0.6s ease;
      pointer-events: none;
    }

    // 动态边框效果
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 20px;
      padding: 2px;
      background: linear-gradient(
        135deg,
        transparent,
        var(--el-color-primary-light-7),
        transparent
      );
      mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      mask-composite: exclude;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-12px) scale(1.06);
      box-shadow:
        0 24px 60px rgba(0, 0, 0, 0.2),
        0 12px 30px rgba(0, 0, 0, 0.15),
        0 1px 0 rgba(255, 255, 255, 0.9) inset,
        0 -1px 0 rgba(0, 0, 0, 0.05) inset;
      border-color: var(--el-color-primary-light-7);
      background: var(--el-bg-color-overlay);

      &::before {
        opacity: 1;
      }

      &::after {
        opacity: 1;
      }
    }

    &:active {
      transform: translateY(-6px) scale(1.03);
    }

    &.is-select {
      border-color: var(--el-color-primary);
      box-shadow:
        0 0 0 6px rgba(var(--el-color-primary-rgb), 0.3),
        0 20px 50px rgba(var(--el-color-primary-rgb), 0.25),
        0 10px 25px rgba(var(--el-color-primary-rgb), 0.18),
        0 1px 0 rgba(255, 255, 255, 0.9) inset;
      background: var(--el-color-primary-light-9);
      transform: translateY(-6px);
      animation: selectPulse 2s ease-in-out infinite;

      &::after {
        opacity: 1;
        background: linear-gradient(
          135deg,
          var(--el-color-primary-light-5),
          var(--el-color-primary),
          var(--el-color-primary-light-5)
        );
      }
    }

    // 占位符布局样式
    &.placeholder-layout {
      background: linear-gradient(
        135deg,
        var(--el-fill-color-light),
        var(--el-fill-color)
      );
      border: 2px dashed var(--el-border-color-light);
      opacity: 0.7;
      box-shadow:
        0 6px 18px rgba(0, 0, 0, 0.08),
        0 3px 9px rgba(0, 0, 0, 0.06),
        0 1px 0 rgba(255, 255, 255, 0.7) inset;

      &:hover {
        border-color: var(--el-border-color);
        background: linear-gradient(
          135deg,
          var(--el-fill-color-lighter),
          var(--el-fill-color-light)
        );
        opacity: 0.9;
        transform: translateY(-4px) scale(1.03);
        box-shadow:
          0 10px 25px rgba(0, 0, 0, 0.12),
          0 5px 15px rgba(0, 0, 0, 0.1),
          0 1px 0 rgba(255, 255, 255, 0.8) inset;
      }

      .coming-soon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);

        span {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          font-weight: 600;
          text-align: center;
          line-height: 1.3;
          letter-spacing: 0.4px;
        }
      }
    }

    &::after {
      content: attr(data-label);
      position: absolute;
      bottom: 10px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--el-bg-color-overlay);
      border-radius: 8px;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.1),
        0 2px 6px rgba(0, 0, 0, 0.08),
        0 1px 0 rgba(255, 255, 255, 0.7) inset;
      letter-spacing: 0.4px;
      text-align: center;
      writing-mode: horizontal-tb;
    }

    &:hover::after {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      transform: translateY(-3px);
      box-shadow:
        0 6px 16px rgba(0, 0, 0, 0.15),
        0 3px 8px rgba(0, 0, 0, 0.12),
        0 1px 0 rgba(255, 255, 255, 0.8) inset;
    }

    &.is-select::after {
      color: var(--el-color-primary);
      font-weight: 700;
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-5);
      box-shadow:
        0 6px 16px rgba(0, 0, 0, 0.18),
        0 3px 8px rgba(0, 0, 0, 0.15),
        0 1px 0 rgba(255, 255, 255, 0.8) inset;
    }

    // 图片图标样式
    .layout-icon {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: fill;
      transition: all 0.3s ease;
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.12));
    }

    // SVG组件样式 - 让SVG撑满li容器
    svg {
      width: 100% !important;
      height: 100% !important;
      flex: 1 !important;
      transition: all 0.3s ease;
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.12));
      border-radius: 20px;
      // 让SVG图标颜色跟随主题色变化
      color: var(--el-text-color-primary);
      fill: currentColor;
    }

    // 针对Vue组件形式的SVG
    > * {
      width: 100% !important;
      height: 100% !important;
      flex: 1 !important;
      border-radius: 20px;
    }

    &:hover .layout-icon {
      transform: scale(1.08);
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2));
    }

    &:hover svg {
      transform: scale(1.08);
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2));
      // 悬停状态时SVG图标颜色跟随主题色
      color: var(--el-color-primary);
      fill: currentColor;
    }

    &.is-select .layout-icon {
      filter: drop-shadow(0 4px 10px rgba(var(--el-color-primary-rgb), 0.4));
    }

    &.is-select svg {
      filter: drop-shadow(0 4px 10px rgba(var(--el-color-primary-rgb), 0.4));
      // 选中状态时SVG图标颜色跟随主题色
      color: var(--el-color-primary);
      fill: currentColor;
    }
  }
}

// 深色模式下导航模式选择器样式覆盖
html.dark {
  .modern-layout-grid li {
    background: linear-gradient(
      135deg,
      var(--el-fill-color-dark),
      var(--el-fill-color-darker)
    );
    border-color: var(--el-border-color-dark);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.25);

    &::after {
      background: var(--el-bg-color);
      color: var(--el-text-color-primary);
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.2),
        0 2px 6px rgba(0, 0, 0, 0.15);
    }

    svg {
      color: var(--el-text-color-primary);
    }

    &:hover {
      background: linear-gradient(
        135deg,
        var(--el-fill-color-darker),
        var(--el-fill-color-dark)
      );
      border-color: var(--el-color-primary-light-3);
      box-shadow:
        0 16px 40px rgba(0, 0, 0, 0.4),
        0 8px 20px rgba(0, 0, 0, 0.3);

      &::after {
        color: #fff;
        background: var(--el-color-primary);
      }

      svg {
        color: var(--el-color-primary);
      }
    }

    &.is-select {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.15),
        rgba(var(--el-color-primary-rgb), 0.1)
      );
      border-color: var(--el-color-primary);

      &::after {
        color: #fff;
        background: var(--el-color-primary);
      }

      svg {
        color: #fff;
      }
    }

    &.placeholder-layout {
      background: linear-gradient(
        135deg,
        var(--el-fill-color-dark),
        var(--el-fill-color-darker)
      );
      border-color: var(--el-border-color-dark);
    }
  }
}

/* 占位符样式 - 独立定义 */
.modern-layout-grid li.placeholder-layout {
  opacity: 0.6;
  cursor: not-allowed;
  background: linear-gradient(
    135deg,
    var(--el-fill-color-light),
    var(--el-fill-color)
  );
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.08),
    0 3px 9px rgba(0, 0, 0, 0.06),
    0 1px 0 rgba(255, 255, 255, 0.7) inset;

  &:hover {
    transform: none;
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.12),
      0 4px 12px rgba(0, 0, 0, 0.1),
      0 1px 0 rgba(255, 255, 255, 0.8) inset;
  }

  .coming-soon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;

    span {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      font-weight: 500;
      text-align: center;
      line-height: 1.3;
    }
  }

  &::after {
    content: "更多布局";
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    box-shadow:
      0 3px 8px rgba(0, 0, 0, 0.08),
      0 1px 4px rgba(0, 0, 0, 0.06),
      0 1px 0 rgba(255, 255, 255, 0.7) inset;
  }
}

.is-select {
  border: 2px solid var(--el-color-primary);
}

.bg-bg_color {
  background-color: var(--el-bg-color) !important;
}

// 通用设置样式 - 完全适配 Element Plus 主题系统
.setting {
  margin-top: 12px;
  background: var(--el-bg-color-page);
  border-radius: var(--border-radius-base, 12px);
  padding: 8px 16px;
  box-shadow: var(--el-box-shadow-lighter);
  transition: all var(--animation-duration, 0.3s) ease;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    font-size: var(--font-size-base, 14px);
    border-bottom: 1px solid var(--el-border-color-lighter);
    transition: all var(--animation-duration, 0.3s) ease;
    text-align: left;
    writing-mode: horizontal-tb;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--el-fill-color-light);
      padding-left: 8px;
      border-radius: var(--border-radius-small, 6px);
    }

    span {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }
}

// Element Plus Segmented Control 适配
:deep(.el-segmented-control) {
  box-shadow: var(--el-box-shadow-lighter);
  border-radius: var(--border-radius-small, 8px);
  overflow: hidden;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);

  .el-segmented-control-item {
    transition: all var(--animation-duration, 0.3s) ease;
    color: var(--el-text-color-regular);
    font-size: var(--font-size-base, 14px);
    text-align: center;
    writing-mode: horizontal-tb;

    &:hover:not(.is-active) {
      background: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }

    &.is-active {
      font-weight: 500;
      background: var(--el-bg-color-overlay);
      color: var(--el-color-primary);
      box-shadow: var(--el-box-shadow-lighter);
    }
  }
}

// 标题样式
p.mt-5 {
  margin-top: 24px !important;
  font-size: var(--font-size-base, 15px);
  position: relative;
  padding-left: 12px;
  color: var(--el-text-color-primary);
  text-align: left;
  writing-mode: horizontal-tb;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 16px;
    background: var(--el-color-primary);
    border-radius: var(--border-radius-small, 2px);
  }
}
// 新的el-row布局预览样式
.layout-preview {
  width: 90%;
  height: 90%;
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-extra-light);

  // 移除了el-row布局相关的CSS样式，恢复使用SVG图标
}
</style>

<style lang="scss">
// 全局样式：主题切换优化
:root {
  // 主题切换速度控制
  --theme-transition-duration: 0.15s;
  --theme-transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
}

// 主题切换时禁用所有transition，避免延迟
.theme-switching,
.theme-switching * {
  transition: none !important;
  animation: none !important;
}

// 优化Element Plus组件的主题切换性能
.el-button,
.el-input,
.el-select,
.el-card,
.el-dialog,
.el-drawer,
.el-menu,
.el-table,
.el-form-item {
  transition:
    background-color var(--theme-transition-duration)
      var(--theme-transition-timing),
    border-color var(--theme-transition-duration) var(--theme-transition-timing),
    color var(--theme-transition-duration) var(--theme-transition-timing) !important;
}

// 确保所有使用CSS变量的元素都能快速响应主题变化
[style*="--el-"],
[class*="el-"] {
  transition:
    background-color var(--theme-transition-duration)
      var(--theme-transition-timing),
    border-color var(--theme-transition-duration) var(--theme-transition-timing),
    color var(--theme-transition-duration) var(--theme-transition-timing);
}

.modern-input-number .el-input__wrapper {
  border-radius: var(--el-border-radius-base, 8px) !important;
}

// 响应式设计优化
@media (max-width: 768px) {
  .modern-setting-container {
    padding: 16px;
    width: 100%;
    border-radius: 16px;
  }

  .setting-section {
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 14px;
  }

  .section-header {
    margin-bottom: 16px;
    padding-bottom: 12px;

    .section-icon {
      width: 36px;
      height: 36px;
      font-size: 18px;
      margin-right: 12px;
    }

    .section-title {
      font-size: 16px;
    }
  }

  .pure-theme {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 12px;
    padding: 8px;

    li {
      height: 430px;
      border-radius: 14px;
    }
  }

  .theme-color-grid {
    grid-template-columns: repeat(auto-fit, minmax(28px, 1fr));
    gap: 8px;
    padding: 6px;
  }

  .theme-color-item {
    width: 28px;
    height: 28px;
    border-radius: 8px;

    &:hover {
      transform: translateY(-2px) scale(1.05);
    }

    &.is-selected {
      transform: translateY(-1px) scale(1.03);
    }
  }

  .switch-grid {
    gap: 8px;
  }

  .switch-item {
    padding: 12px 16px;
    border-radius: 8px;
  }
}

@media (max-width: 480px) {
  .modern-setting-container {
    padding: 12px;
  }

  .setting-section {
    padding: 16px;
  }

  .pure-theme {
    grid-template-columns: repeat(1, 1fr);
    gap: 10px;

    li {
      height: 430px;
    }
  }

  .theme-color-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
  }
}

// 卡片开关网格样式
.switch-card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  &.single-row {
    grid-template-columns: 1fr;
  }
}

// 卡片开关项样式
.switch-card-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  background: var(--el-fill-color-lighter);
  border: 2px solid var(--el-border-color-lighter);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 90px;
  overflow: hidden;

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-color-primary-light-5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
  }

  &.is-active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.2);

    .switch-card-icon {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-8);
    }

    .switch-card-label {
      color: var(--el-color-primary);
    }
  }
}

.switch-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 20px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.switch-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.switch-card-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  transition: color 0.3s ease;
}

.switch-card-desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

// 深色主题适配
html.dark {
  .switch-card-item {
    background: var(--el-fill-color-dark);
    border-color: var(--el-border-color);

    &:hover {
      background: var(--el-fill-color);
      border-color: var(--el-color-primary-light-3);
    }

    &.is-active {
      background: rgba(var(--el-color-primary-rgb), 0.15);
      border-color: var(--el-color-primary);

      .switch-card-icon {
        background: rgba(var(--el-color-primary-rgb), 0.2);
      }
    }
  }

  .switch-card-icon {
    background: var(--el-fill-color-darker);
  }
}

// 响应式适配
@media (max-width: 480px) {
  .switch-card-grid {
    grid-template-columns: 1fr;
  }

  .switch-card-item {
    flex-direction: row;
    justify-content: flex-start;
    gap: 12px;
    padding: 12px 16px;
    min-height: auto;

    .switch-card-icon {
      margin-bottom: 0;
    }

    .switch-card-content {
      align-items: flex-start;
    }
  }
}

// 节日装饰提示样式
.festival-decoration-tip {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 12px;
  padding: 12px 16px;
  background: linear-gradient(
    135deg,
    rgba(var(--el-color-info-rgb), 0.08) 0%,
    rgba(var(--el-color-info-rgb), 0.04) 100%
  );
  border-left: 3px solid var(--el-color-info);
  border-radius: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  transition: all 0.3s ease;
  
  .tip-icon {
    flex-shrink: 0;
    font-size: 16px;
    color: var(--el-color-info);
    margin-top: 2px;
  }
  
  span {
    flex: 1;
  }
  
  &:hover {
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-info-rgb), 0.12) 0%,
      rgba(var(--el-color-info-rgb), 0.06) 100%
    );
  }
}

// 深色主题下的节日装饰提示
html.dark {
  .festival-decoration-tip {
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-info-rgb), 0.15) 0%,
      rgba(var(--el-color-info-rgb), 0.08) 100%
    );
    
    &:hover {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-info-rgb), 0.2) 0%,
        rgba(var(--el-color-info-rgb), 0.12) 100%
      );
    }
  }
}

// 自动主题状态卡片样式
.auto-theme-status {
  margin-top: 16px;
}

.status-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(
    135deg,
    rgba(var(--el-color-success-rgb), 0.08) 0%,
    rgba(var(--el-color-success-rgb), 0.04) 100%
  );
  border: 1px solid rgba(var(--el-color-success-rgb), 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-success-rgb), 0.12) 0%,
      rgba(var(--el-color-success-rgb), 0.06) 100%
    );
    border-color: rgba(var(--el-color-success-rgb), 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--el-color-success-rgb), 0.15);
  }
  
  .status-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(
      135deg,
      var(--el-color-success) 0%,
      var(--el-color-success-light-3) 100%
    );
    color: #fff;
    font-size: 24px;
    box-shadow: 0 4px 12px rgba(var(--el-color-success-rgb), 0.3);
  }
  
  .status-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .status-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  .status-desc {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }
  
  .status-current {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    margin-top: 4px;
    background: rgba(var(--el-color-success-rgb), 0.08);
    border-radius: 8px;
    font-size: 13px;
    
    .label {
      color: var(--el-text-color-secondary);
    }
    
    .value {
      font-weight: 600;
      color: var(--el-color-success);
    }
  }
}

// 深色主题下的自动主题状态
html.dark {
  .status-card {
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-success-rgb), 0.15) 0%,
      rgba(var(--el-color-success-rgb), 0.08) 100%
    );
    
    &:hover {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-success-rgb), 0.2) 0%,
        rgba(var(--el-color-success-rgb), 0.12) 100%
      );
    }
    
    .status-current {
      background: rgba(var(--el-color-success-rgb), 0.15);
    }
  }
}

// ==================== AI 助手皮肤设置 ====================
.ai-theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.ai-theme-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: 12px;
  border: 2px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-border-color);
    transform: translateY(-2px);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
  }
}

.ai-theme-preview {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  .ai-theme-bubble {
    position: absolute;
    width: 16px;
    height: 12px;
    border-radius: 6px;
    top: 4px;
    right: 2px;
  }

  .ai-theme-bot {
    width: 24px;
    height: 24px;
    border-radius: 8px;
  }
}

// 各主题颜色
.ai-theme-default {
  .ai-theme-preview {
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.1),
      rgba(118, 75, 162, 0.1)
    );
  }
  .ai-theme-bubble {
    background: linear-gradient(135deg, #667eea, #764ba2);
  }
  .ai-theme-bot {
    background: linear-gradient(135deg, #667eea, #764ba2);
  }
}

.ai-theme-blue {
  .ai-theme-preview {
    background: linear-gradient(
      135deg,
      rgba(0, 198, 251, 0.1),
      rgba(0, 91, 234, 0.1)
    );
  }
  .ai-theme-bubble {
    background: linear-gradient(135deg, #00c6fb, #005bea);
  }
  .ai-theme-bot {
    background: linear-gradient(135deg, #00c6fb, #005bea);
  }
}

.ai-theme-green {
  .ai-theme-preview {
    background: linear-gradient(
      135deg,
      rgba(17, 153, 142, 0.1),
      rgba(56, 239, 125, 0.1)
    );
  }
  .ai-theme-bubble {
    background: linear-gradient(135deg, #11998e, #38ef7d);
  }
  .ai-theme-bot {
    background: linear-gradient(135deg, #11998e, #38ef7d);
  }
}

.ai-theme-orange {
  .ai-theme-preview {
    background: linear-gradient(
      135deg,
      rgba(240, 147, 251, 0.1),
      rgba(245, 87, 108, 0.1)
    );
  }
  .ai-theme-bubble {
    background: linear-gradient(135deg, #f093fb, #f5576c);
  }
  .ai-theme-bot {
    background: linear-gradient(135deg, #f093fb, #f5576c);
  }
}

.ai-theme-pink {
  .ai-theme-preview {
    background: linear-gradient(
      135deg,
      rgba(255, 154, 158, 0.1),
      rgba(254, 207, 239, 0.1)
    );
  }
  .ai-theme-bubble {
    background: linear-gradient(135deg, #ff9a9e, #fecfef);
  }
  .ai-theme-bot {
    background: linear-gradient(135deg, #ff9a9e, #fecfef);
  }
}

.ai-theme-dark {
  .ai-theme-preview {
    background: linear-gradient(
      135deg,
      rgba(67, 67, 67, 0.1),
      rgba(0, 0, 0, 0.1)
    );
  }
  .ai-theme-bubble {
    background: linear-gradient(135deg, #434343, #000000);
  }
  .ai-theme-bot {
    background: linear-gradient(135deg, #434343, #000000);
  }
}

.ai-theme-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.ai-theme-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

@media (max-width: 480px) {
  .ai-theme-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

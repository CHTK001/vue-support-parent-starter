<script setup lang="ts">
import { computed, nextTick, onBeforeMount, onUnmounted, reactive, ref, unref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { emitter, useAppStoreHook, useMultiTagsStoreHook } from "@repo/core";
import LayPanel from "../lay-panel/index.vue";
import { useNav } from "../../hooks/useNav";
import { toggleTheme } from "@pureadmin/theme/dist/browser-utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import { useDataThemeChange } from "../../hooks/useDataThemeChange";
import { debounce, isNumber, useDark, useGlobal } from "@pureadmin/utils";

import Check from "@iconify-icons/ep/check";
import LeftArrow from "@iconify-icons/ri/arrow-left-s-line";
import RightArrow from "@iconify-icons/ri/arrow-right-s-line";
//@ts-ignore
import DayIcon from "@repo/assets/svg/day.svg?component";
//@ts-ignore
import DarkIcon from "@repo/assets/svg/dark.svg?component";
//@ts-ignore
import SystemIcon from "@repo/assets/svg/system.svg?component";

const { t } = useI18n();
const { device } = useNav();
const { isDark } = useDark();
//@ts-ignore
const { $storage } = useGlobal<GlobalPropertiesApi>();

const mixRef = ref();
const verticalRef = ref();
const horizontalRef = ref();
const hoverRef = ref();

const { dataTheme, overallStyle, layoutTheme, themeColors, toggleClass, dataThemeChange, setLayoutThemeColor } = useDataThemeChange();

/* body添加layout属性，作用于src/style/sidebar.scss */
if (unref(layoutTheme)) {
  const layout = unref(layoutTheme).layout;
  const theme = unref(layoutTheme).theme;
  document.documentElement.setAttribute("data-theme", theme);
  setLayoutModel(layout);
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
  tabsVal: $storage.configure.hideTabs,
  cardBody: $storage.configure.cardBody,
  showLogo: $storage.configure.showLogo,
  showModel: $storage.configure.showModel,
  hideFooter: $storage.configure.hideFooter,
  multiTagsCache: $storage.configure.multiTagsCache,
  stretch: $storage.configure.stretch,
  // 新增配置项
  animationIntensity: $storage.configure.animationIntensity ?? "normal", // 动画效果强度：off/light/normal/strong
  interfaceDensity: $storage.configure.interfaceDensity ?? "standard", // 界面密度：compact/standard/loose
  fontSize: $storage.configure.fontSize ?? "medium", // 字体大小：small/medium/large
  borderRadius: $storage.configure.borderRadius ?? "medium", // 圆角风格：none/small/medium/large
});

const getThemeColorStyle = computed(() => {
  return (color) => {
    return { background: color };
  };
});

/** 当网页整体为暗色风格时不显示亮白色主题配色切换选项 */
const showThemeColors = computed(() => {
  return (themeColor) => {
    return themeColor === "light" && isDark.value ? false : true;
  };
});

function storageConfigureChange<T>(key: string, val: T): void {
  const storageConfigure = $storage.configure;
  storageConfigure[key] = val;
  $storage.configure = storageConfigure;
}

/** 设置内容宽度 */
const contentMarginChange = (value): void => {
  storageConfigureChange("contentMargin", value);
  document.body.style.setProperty("--contentMargin", value + "px");
};

/** 设置内容radius */
const layoutRadiusChange = (value): void => {
  storageConfigureChange("layoutRadius", value);
  document.body.style.setProperty("--layoutRadius", value + "px");
};
/** 设置内容blur */
const layoutBlurChange = (value): void => {
  storageConfigureChange("layoutBlur", value);
  document.body.style.setProperty("--layoutBlur", value + "px");
};

/** 切换菜单动画设置 */
const menuTransitionChange = (value): void => {
  storageConfigureChange("menuTransition", value);
};

/** 灰色模式设置 */
const greyChange = (value): void => {
  const htmlEl = document.querySelector("html");
  toggleClass(settings.greyVal, "html-grey", htmlEl);
  storageConfigureChange("grey", value);
};

/** 色弱模式设置 */
const weekChange = (value): void => {
  const htmlEl = document.querySelector("html");
  toggleClass(settings.weakVal, "html-weakness", htmlEl);
  storageConfigureChange("weak", value);
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
};

/** 标签页持久化设置 */
const multiTagsCacheChange = () => {
  const multiTagsCache = settings.multiTagsCache;
  storageConfigureChange("multiTagsCache", multiTagsCache);
  useMultiTagsStoreHook().multiTagsCacheChange(multiTagsCache);
};

function onChange({ option }) {
  const { value } = option;
  markValue.value = value;
  storageConfigureChange("showModel", value);
  emitter.emit("tagViewsShowModel", value);
}

/** 侧边栏Logo */
function logoChange() {
  unref(logoVal) ? storageConfigureChange("showLogo", true) : storageConfigureChange("showLogo", false);
  emitter.emit("logoChange", unref(logoVal));
}
/** 卡片Body */
function cardBodyChange() {
  unref(cardBodyVal) ? storageConfigureChange("cardBody", true) : storageConfigureChange("cardBody", false);
}

/** 动画效果强度设置 */
const animationIntensityChange = (value: string): void => {
  storageConfigureChange("animationIntensity", value);
  const root = document.documentElement;

  // 根据动画强度设置CSS变量
  switch (value) {
    case "off":
      root.style.setProperty("--animation-duration", "0s");
      root.style.setProperty("--animation-scale", "1");
      break;
    case "light":
      root.style.setProperty("--animation-duration", "0.15s");
      root.style.setProperty("--animation-scale", "1.02");
      break;
    case "normal":
      root.style.setProperty("--animation-duration", "0.3s");
      root.style.setProperty("--animation-scale", "1.05");
      break;
    case "strong":
      root.style.setProperty("--animation-duration", "0.5s");
      root.style.setProperty("--animation-scale", "1.1");
      break;
  }
};

/** 界面密度设置 */
const interfaceDensityChange = (value: string): void => {
  storageConfigureChange("interfaceDensity", value);
  const root = document.documentElement;

  // 根据界面密度设置CSS变量
  switch (value) {
    case "compact":
      root.style.setProperty("--interface-padding", "8px");
      root.style.setProperty("--interface-margin", "4px");
      root.style.setProperty("--interface-gap", "8px");
      break;
    case "standard":
      root.style.setProperty("--interface-padding", "16px");
      root.style.setProperty("--interface-margin", "8px");
      root.style.setProperty("--interface-gap", "12px");
      break;
    case "loose":
      root.style.setProperty("--interface-padding", "24px");
      root.style.setProperty("--interface-margin", "16px");
      root.style.setProperty("--interface-gap", "20px");
      break;
  }
};

/** 字体大小设置 */
const fontSizeChange = (value: string): void => {
  storageConfigureChange("fontSize", value);
  const root = document.documentElement;

  // 根据字体大小设置CSS变量
  switch (value) {
    case "small":
      root.style.setProperty("--font-size-base", "13px");
      root.style.setProperty("--font-size-small", "11px");
      root.style.setProperty("--font-size-large", "15px");
      break;
    case "medium":
      root.style.setProperty("--font-size-base", "14px");
      root.style.setProperty("--font-size-small", "12px");
      root.style.setProperty("--font-size-large", "16px");
      break;
    case "large":
      root.style.setProperty("--font-size-base", "16px");
      root.style.setProperty("--font-size-small", "14px");
      root.style.setProperty("--font-size-large", "18px");
      break;
  }
};

/** 圆角风格设置 */
const borderRadiusChange = (value: string): void => {
  storageConfigureChange("borderRadius", value);
  const root = document.documentElement;

  // 根据圆角风格设置CSS变量
  switch (value) {
    case "none":
      root.style.setProperty("--border-radius-small", "0px");
      root.style.setProperty("--border-radius-base", "0px");
      root.style.setProperty("--border-radius-large", "0px");
      break;
    case "small":
      root.style.setProperty("--border-radius-small", "2px");
      root.style.setProperty("--border-radius-base", "4px");
      root.style.setProperty("--border-radius-large", "6px");
      break;
    case "medium":
      root.style.setProperty("--border-radius-small", "4px");
      root.style.setProperty("--border-radius-base", "8px");
      root.style.setProperty("--border-radius-large", "12px");
      break;
    case "large":
      root.style.setProperty("--border-radius-small", "8px");
      root.style.setProperty("--border-radius-base", "16px");
      root.style.setProperty("--border-radius-large", "24px");
      break;
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

const setStretch = (value) => {
  settings.stretch = value;
  storageConfigureChange("stretch", value);
};

const stretchTypeChange = ({ option }) => {
  const { value } = option;
  value === "custom" ? setStretch(1440) : setStretch(false);
};

/** 主题色 激活选择项 */
const getThemeColor = computed(() => {
  return (current) => {
    if (current === layoutTheme.value.theme && layoutTheme.value.theme !== "light") {
      return "#fff";
    } else if (current === layoutTheme.value.theme && layoutTheme.value.theme === "light") {
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
      icon: DayIcon,
      theme: "light",
      tip: t("panel.pureOverallStyleLightTip"),
      iconAttrs: { fill: isDark.value ? "#fff" : "#000" },
    },
    {
      label: t("panel.pureOverallStyleDark"),
      icon: DarkIcon,
      theme: "dark",
      tip: t("panel.pureOverallStyleDarkTip"),
      iconAttrs: { fill: isDark.value ? "#fff" : "#000" },
    },
    {
      label: t("panel.pureOverallStyleSystem"),
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
  ];
});

/** 动画效果强度选项 */
const animationIntensityOptions = computed<Array<OptionsType>>(() => {
  return [
    {
      label: "关闭",
      tip: "禁用所有动画效果",
      value: "off",
    },
    {
      label: "轻微",
      tip: "轻微的动画效果",
      value: "light",
    },
    {
      label: "正常",
      tip: "标准的动画效果",
      value: "normal",
    },
    {
      label: "强烈",
      tip: "丰富的动画效果",
      value: "strong",
    },
  ];
});

/** 界面密度选项 */
const interfaceDensityOptions = computed<Array<OptionsType>>(() => {
  return [
    {
      label: "紧凑",
      tip: "紧凑的界面布局",
      value: "compact",
    },
    {
      label: "标准",
      tip: "标准的界面布局",
      value: "standard",
    },
    {
      label: "宽松",
      tip: "宽松的界面布局",
      value: "loose",
    },
  ];
});

/** 字体大小选项 */
const fontSizeOptions = computed<Array<OptionsType>>(() => {
  return [
    {
      label: "小",
      tip: "较小的字体大小",
      value: "small",
    },
    {
      label: "中",
      tip: "标准的字体大小",
      value: "medium",
    },
    {
      label: "大",
      tip: "较大的字体大小",
      value: "large",
    },
  ];
});

/** 圆角风格选项 */
const borderRadiusOptions = computed<Array<OptionsType>>(() => {
  return [
    {
      label: "直角",
      tip: "无圆角效果",
      value: "none",
    },
    {
      label: "小圆角",
      tip: "轻微的圆角效果",
      value: "small",
    },
    {
      label: "中圆角",
      tip: "标准的圆角效果",
      value: "medium",
    },
    {
      label: "大圆角",
      tip: "明显的圆角效果",
      value: "large",
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
      debounce(setFalse([horizontalRef, mixRef, hoverRef]), 50);
      break;
    case "horizontal":
      toggleClass(true, "is-select", unref(horizontalRef));
      debounce(setFalse([verticalRef, mixRef, hoverRef]), 50);
      break;
    case "mix":
      toggleClass(true, "is-select", unref(mixRef));
      debounce(setFalse([verticalRef, horizontalRef, hoverRef]), 50);
      break;
    case "hover":
      toggleClass(true, "is-select", unref(hoverRef));
      debounce(setFalse([verticalRef, horizontalRef, mixRef]), 50);
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

onBeforeMount(() => {
  /* 初始化系统配置 */
  nextTick(() => {
    watchSystemThemeChange();
    settings.greyVal && document.querySelector("html")?.classList.add("html-grey");
    settings.weakVal && document.querySelector("html")?.classList.add("html-weakness");
    settings.tabsVal && tagsChange();
    settings.hideFooter && hideFooterChange();

    // 初始化新增配置项
    animationIntensityChange(settings.animationIntensity);
    interfaceDensityChange(settings.interfaceDensity);
    fontSizeChange(settings.fontSize);
    borderRadiusChange(settings.borderRadius);
  });
});

onUnmounted(() => removeMatchMedia);
</script>

<template>
  <LayPanel>
    <div class="modern-setting-container">
      <!-- 主题风格设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:palette-line'" class="section-icon" />
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
                theme.index === 1 && theme.index !== 2 ? (dataTheme = true) : (dataTheme = false);
                overallStyle = theme.option.theme;
                dataThemeChange(theme.option.theme);
                theme.index === 2 && watchSystemThemeChange();
              }
            "
          />
        </div>
      </div>

      <!-- 主题色设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:drop-line'" class="section-icon" />
          <h3 class="section-title">{{ t("panel.pureThemeColor") }}</h3>
        </div>
        <div class="setting-content">
          <ul class="theme-color">
            <li v-for="(item, index) in themeColors" v-show="showThemeColors(item.themeColor)" :key="index" :style="getThemeColorStyle(item.color)" @click="setLayoutThemeColor(item.themeColor)">
              <el-icon style="margin: 0.1em 0.1em 0 0" :size="17" :color="getThemeColor(item.themeColor)">
                <IconifyIconOffline :icon="Check" />
              </el-icon>
            </li>
          </ul>
        </div>
      </div>

      <!-- 布局模式设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:layout-line'" class="section-icon" />
          <h3 class="section-title">{{ t("panel.pureLayoutModel") }}</h3>
        </div>
        <div class="setting-content">
          <ul class="pure-theme">
        <li
          ref="verticalRef"
          v-tippy="{
            content: t('panel.pureVerticalTip'),
            zIndex: 41000,
          }"
          :class="layoutTheme.layout === 'vertical' ? 'is-select' : ''"
          @click="setLayoutModel('vertical')"
        >
          <div />
          <div />
        </li>
        <li
          v-if="device !== 'mobile'"
          ref="horizontalRef"
          v-tippy="{
            content: t('panel.pureHorizontalTip'),
            zIndex: 41000,
          }"
          :class="layoutTheme.layout === 'horizontal' ? 'is-select' : ''"
          @click="setLayoutModel('horizontal')"
        >
          <div />
          <div />
        </li>
        <li
          v-if="device !== 'mobile'"
          ref="mixRef"
          v-tippy="{
            content: t('panel.pureMixTip'),
            zIndex: 41000,
          }"
          :class="layoutTheme.layout === 'mix' ? 'is-select' : ''"
          @click="setLayoutModel('mix')"
        >
          <div />
          <div />
        </li>
        <li
          v-if="device !== 'mobile'"
          ref="hoverRef"
          v-tippy="{
            content: '悬停导航：只显示一级菜单，鼠标悬停显示子菜单',
            zIndex: 41000,
          }"
          :class="layoutTheme.layout === 'hover' ? 'is-select' : ''"
          @click="setLayoutModel('hover')"
        >
          <div />
          <div />
          <div />
        </li>
        <!-- 占位符，保持网格布局完整 -->
        <li
          v-if="device !== 'mobile'"
          class="placeholder-layout"
          v-tippy="{
            content: '敬请期待更多布局模式',
            zIndex: 41000,
          }"
        >
          <div class="coming-soon">
            <span>敬请期待</span>
          </div>
        </li>
        <li
          v-if="device !== 'mobile'"
          class="placeholder-layout"
          v-tippy="{
            content: '敬请期待更多布局模式',
            zIndex: 41000,
          }"
        >
          <div class="coming-soon">
            <span>敬请期待</span>
          </div>
        </li>
          </ul>
        </div>
      </div>

      <!-- 页面宽度设置区域 -->
      <div v-if="useAppStoreHook().getViewportWidth > 1280" class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:fullscreen-line'" class="section-icon" />
          <h3 class="section-title">{{ t("panel.pureStretch") }}</h3>
        </div>
        <div class="setting-content">
          <Segmented resize class="mb-2 select-none modern-segmented" :modelValue="isNumber(settings.stretch) ? 1 : 0" :options="stretchTypeOptions" @change="stretchTypeChange" />
          <el-input-number v-if="isNumber(settings.stretch)" v-model="settings.stretch as number" :min="1280" :max="1600" controls-position="right" @change="(value: number) => setStretch(value)" />
          <button v-else v-ripple="{ class: 'text-gray-300' }" class="stretch-button" @click="setStretch(!settings.stretch)">
            <div class="stretch-indicator" :class="[settings.stretch ? 'w-[24%]' : 'w-[50%]']">
              <IconifyIconOffline :icon="settings.stretch ? RightArrow : LeftArrow" height="20" />
              <div class="stretch-line" />
              <IconifyIconOffline :icon="settings.stretch ? LeftArrow : RightArrow" height="20" />
            </div>
          </button>
        </div>
      </div>

      <!-- 布局参数设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:settings-3-line'" class="section-icon" />
          <h3 class="section-title">{{ t("panel.pureLayoutParams") || "布局参数" }}</h3>
        </div>
        <div class="setting-content">
          <div class="setting-item">
            <label class="setting-label">{{ t("panel.pureStretchMargin") }}</label>
            <el-input-number v-model="settings.contentMargin as number" :min="0" :max="100" controls-position="right" @change="(value: number) => contentMarginChange(value)" />
          </div>

          <div class="setting-item">
            <label class="setting-label">{{ t("panel.pureLayoutRadius") }}</label>
            <el-input-number v-model="settings.layoutRadius as number" :min="0" :max="100" controls-position="right" @change="(value: number) => layoutRadiusChange(value)" />
          </div>

          <div class="setting-item">
            <label class="setting-label">{{ t("panel.pureLayoutBlur") }}</label>
            <el-input-number v-model="settings.layoutBlur as number" :min="0" :max="100" controls-position="right" @change="(value: number) => layoutBlurChange(value)" />
          </div>
        </div>
      </div>

      <!-- 标签页样式设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:price-tag-3-line'" class="section-icon" />
          <h3 class="section-title">{{ t("panel.pureTagsStyle") }}</h3>
        </div>
        <div class="setting-content">
          <Segmented resize class="select-none modern-segmented" :modelValue="markValue === 'smart' ? 0 : markValue === 'card' ? 1 : 2" :options="markOptions" @change="onChange" />
        </div>
      </div>

      <!-- 过渡动画设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:magic-line'" class="section-icon" />
          <h3 class="section-title">{{ t("panel.transition") }}</h3>
        </div>
        <div class="setting-content">
          <div class="switch-item">
            <label class="switch-label">{{ t("panel.menuTransitionChange") }}</label>
            <el-switch v-model="settings.menuTransition" inline-prompt @change="menuTransitionChange" />
          </div>
        </div>
      </div>

      <!-- 动画效果强度设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:flashlight-line'" class="section-icon" />
          <h3 class="section-title">动画效果强度</h3>
        </div>
        <div class="setting-content">
          <Segmented
            resize
            class="select-none modern-segmented"
            :modelValue="animationIntensityOptions.findIndex(item => item.value === settings.animationIntensity)"
            :options="animationIntensityOptions"
            @change="(option) => { settings.animationIntensity = option.option.value; animationIntensityChange(option.option.value); }"
          />
        </div>
      </div>

      <!-- 界面密度设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:layout-grid-line'" class="section-icon" />
          <h3 class="section-title">界面密度</h3>
        </div>
        <div class="setting-content">
          <Segmented
            resize
            class="select-none modern-segmented"
            :modelValue="interfaceDensityOptions.findIndex(item => item.value === settings.interfaceDensity)"
            :options="interfaceDensityOptions"
            @change="(option) => { settings.interfaceDensity = option.option.value; interfaceDensityChange(option.option.value); }"
          />
        </div>
      </div>

      <!-- 字体大小设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:font-size-2'" class="section-icon" />
          <h3 class="section-title">字体大小</h3>
        </div>
        <div class="setting-content">
          <Segmented
            resize
            class="select-none modern-segmented"
            :modelValue="fontSizeOptions.findIndex(item => item.value === settings.fontSize)"
            :options="fontSizeOptions"
            @change="(option) => { settings.fontSize = option.option.value; fontSizeChange(option.option.value); }"
          />
        </div>
      </div>

      <!-- 圆角风格设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:rounded-corner'" class="section-icon" />
          <h3 class="section-title">圆角风格</h3>
        </div>
        <div class="setting-content">
          <Segmented
            resize
            class="select-none modern-segmented"
            :modelValue="borderRadiusOptions.findIndex(item => item.value === settings.borderRadius)"
            :options="borderRadiusOptions"
            @change="(option) => { settings.borderRadius = option.option.value; borderRadiusChange(option.option.value); }"
          />
        </div>
      </div>

      <!-- 界面显示设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:eye-line'" class="section-icon" />
          <h3 class="section-title">{{ t("panel.pureInterfaceDisplay") }}</h3>
        </div>
        <div class="setting-content">
          <div class="switch-grid">
            <div class="switch-item">
              <label class="switch-label">{{ t("panel.pureGreyModel") }}</label>
              <el-switch v-model="settings.greyVal" inline-prompt @change="greyChange" />
            </div>

            <div class="switch-item">
              <label class="switch-label">{{ t("panel.pureWeakModel") }}</label>
              <el-switch v-model="settings.weakVal" inline-prompt @change="weekChange" />
            </div>

            <div class="switch-item">
              <label class="switch-label">{{ t("panel.pureHiddenTags") }}</label>
              <el-switch v-model="settings.tabsVal" inline-prompt @change="tagsChange" />
            </div>

            <div class="switch-item">
              <label class="switch-label">{{ t("panel.pureHiddenFooter") }}</label>
              <el-switch v-model="settings.hideFooter" inline-prompt @change="hideFooterChange" />
            </div>

            <div class="switch-item">
              <label class="switch-label">Logo</label>
              <el-switch v-model="logoVal" inline-prompt :active-value="true" :inactive-value="false" @change="logoChange" />
            </div>

            <div class="switch-item">
              <label class="switch-label">内容卡片</label>
              <el-switch v-model="cardBodyVal" inline-prompt :active-value="true" :inactive-value="false" @change="cardBodyChange" />
            </div>

            <div class="switch-item">
              <label class="switch-label">{{ t("panel.pureMultiTagsCache") }}</label>
              <el-switch v-model="settings.multiTagsCache" inline-prompt @change="multiTagsCacheChange" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </LayPanel>
</template>

<style lang="scss" scoped>
// 现代化设置容器 - 完全适配 Element Plus 主题系统
.modern-setting-container {
  padding: var(--interface-padding, 24px);
  background: var(--el-bg-color-page);
  border-radius: var(--border-radius-large, 20px);
  min-height: 100vh;
  width: 440px;
  max-width: 100%;
  position: relative;
  overflow: hidden;
  transition: all var(--animation-duration, 0.3s) cubic-bezier(0.4, 0, 0.2, 1);

  // 添加背景装饰 - 使用 Element Plus 主题色
  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, var(--el-color-primary-light-9) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
    transition: all var(--animation-duration, 0.3s) ease;
  }

  // 确保内容在装饰之上
  > * {
    position: relative;
    z-index: 1;
  }
}

// 设置区域 - 完全适配 Element Plus 主题系统
.setting-section {
  margin-bottom: var(--interface-margin, 24px);
  background: var(--el-bg-color);
  border-radius: var(--border-radius-base, 16px);
  padding: var(--interface-padding, 24px);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
  transition: all var(--animation-duration, 0.4s) cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  // 添加微妙的顶部装饰线
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--el-color-primary-light-8), transparent);
    border-radius: var(--border-radius-base, 16px) var(--border-radius-base, 16px) 0 0;
    transition: all var(--animation-duration, 0.3s) ease;
  }

  &:hover {
    box-shadow: var(--el-box-shadow);
    border-color: var(--el-color-primary-light-7);
    transform: translateY(calc(-1 * var(--animation-scale, 1.02) * 2px)) scale(var(--animation-scale, 1.02));

    &::before {
      background: linear-gradient(90deg, transparent, var(--el-color-primary-light-5), transparent);
    }
  }

  &:last-child {
    margin-bottom: 0;
  }
}

// 区域标题 - 完全适配 Element Plus 主题系统
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--interface-gap, 20px);
  padding-bottom: var(--interface-gap, 16px);
  border-bottom: 1px solid var(--el-border-color-extra-light);
  position: relative;

  // 添加装饰性渐变线
  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
    border-radius: 1px;
    transition: width var(--animation-duration, 0.3s) ease;
  }

  &:hover::after {
    width: 120px;
  }

  .section-icon {
    font-size: var(--font-size-large, 20px);
    color: var(--el-color-primary);
    margin-right: var(--interface-gap, 12px);
    background: var(--el-color-primary-light-9);
    padding: 8px;
    border-radius: var(--border-radius-small, 10px);
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--el-box-shadow-lighter);
    transition: all var(--animation-duration, 0.3s) cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: scale(var(--animation-scale, 1.1)) rotate(5deg);
      box-shadow: var(--el-box-shadow-light);
      background: var(--el-color-primary-light-8);
    }
  }

  .section-title {
    font-size: var(--font-size-large, 17px);
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0;
    flex: 1;
    letter-spacing: 0.5px;
    text-align: left;
    writing-mode: horizontal-tb;
  }
}

// 设置内容区域 - 完全适配 Element Plus 主题系统
.setting-content {
  .modern-segmented {
    width: 100%;
    border-radius: var(--border-radius-base, 12px);
    overflow: hidden;
    box-shadow: var(--el-box-shadow-lighter);
    transition: all var(--animation-duration, 0.3s) cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: var(--el-box-shadow-light);
      transform: translateY(calc(-1px * var(--animation-scale, 1)));
    }
  }
}

// 美化 Segmented 组件 - 完全适配 Element Plus 主题系统
:deep(.layui-segmented) {
  background: var(--el-fill-color-lighter);
  border-radius: var(--border-radius-base, 12px);
  padding: 6px;
  box-shadow: var(--el-box-shadow-lighter);
  border: 1px solid var(--el-border-color-light);
  transition: all var(--animation-duration, 0.3s) ease;

  .layui-segmented-item {
    border-radius: var(--border-radius-small, 8px);
    transition: all var(--animation-duration, 0.4s) cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    color: var(--el-text-color-regular);
    padding: 10px 16px;
    position: relative;
    overflow: hidden;
    font-size: var(--font-size-base, 14px);
    text-align: center;
    writing-mode: horizontal-tb;

    // 添加微妙的悬停效果
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, var(--el-color-primary-light-9), transparent);
      transition: left var(--animation-duration, 0.5s) ease;
    }

    &:hover {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      transform: translateY(calc(-1px * var(--animation-scale, 1)));
      box-shadow: var(--el-box-shadow-lighter);

      &::before {
        left: 100%;
      }
    }

    &.layui-segmented-checked {
      background: var(--el-bg-color);
      color: var(--el-color-primary);
      box-shadow: var(--el-box-shadow-light);
      font-weight: 600;
      transform: translateY(calc(-1px * var(--animation-scale, 1)));
      border: 1px solid var(--el-color-primary-light-7);
    }
  }
}

// 设置项 - 完全适配 Element Plus 主题系统
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--interface-padding, 16px) var(--interface-padding, 20px);
  border-bottom: 1px solid var(--el-border-color-extra-light);
  border-radius: var(--border-radius-small, 8px);
  margin-bottom: var(--interface-gap, 8px);
  background: var(--el-fill-color-extra-light);
  transition: all var(--animation-duration, 0.3s) cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  // 添加微妙的左侧装饰条
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--el-color-primary), var(--el-color-primary-light-3));
    transform: scaleY(0);
    transition: transform var(--animation-duration, 0.3s) ease;
  }

  &:hover {
    background: var(--el-color-primary-light-9);
    transform: translateX(calc(4px * var(--animation-scale, 1)));
    box-shadow: var(--el-box-shadow-lighter);

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
    font-size: var(--font-size-base, 15px);
    color: var(--el-text-color-regular);
    font-weight: 600;
    margin: 0;
    flex: 1;
    letter-spacing: 0.3px;
    text-align: left;
    writing-mode: horizontal-tb;
  }
}

// 开关网格布局 - 完全适配 Element Plus 主题系统
.switch-grid {
  display: grid;
  gap: var(--interface-gap, 12px);
  grid-template-columns: 1fr;
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--interface-padding, 16px) var(--interface-padding, 20px);
  background: var(--el-fill-color-extra-light);
  border-radius: var(--border-radius-base, 12px);
  transition: all var(--animation-duration, 0.4s) cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--el-border-color-light);
  position: relative;
  overflow: hidden;

  // 添加微妙的背景动画
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, var(--el-color-primary-light-9), transparent);
    transition: left var(--animation-duration, 0.6s) ease;
  }

  &:hover {
    background: var(--el-color-primary-light-9);
    transform: translateY(calc(-2px * var(--animation-scale, 1))) scale(var(--animation-scale, 1.02));
    box-shadow: var(--el-box-shadow-light);
    border-color: var(--el-color-primary-light-7);

    &::before {
      left: 100%;
    }
  }

  .switch-label {
    font-size: var(--font-size-base, 15px);
    color: var(--el-text-color-regular);
    font-weight: 600;
    margin: 0;
    flex: 1;
    letter-spacing: 0.3px;
    text-align: left;
    writing-mode: horizontal-tb;
  }
}

// 拉伸按钮样式
.stretch-button {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.8));
  border: 2px solid rgba(var(--el-border-color-rgb, 220, 223, 230), 0.6);
  border-radius: 12px;
  width: 100%;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 16px;
  position: relative;
  overflow: hidden;

  // 添加背景动画效果
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.05), transparent);
    transition: left 0.6s ease;
  }

  &:hover {
    border-color: var(--el-color-primary);
    background: linear-gradient(135deg, rgba(236, 245, 255, 0.9), rgba(255, 255, 255, 0.9));
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  .stretch-indicator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--el-color-primary);
    position: relative;
    z-index: 1;

    .stretch-line {
      flex: 1;
      height: 2px;
      background: linear-gradient(90deg, var(--el-color-primary), #66b1ff, var(--el-color-primary));
      border-style: dashed;
      border-width: 1px 0 0 0;
      border-color: var(--el-color-primary);
      margin: 0 12px;
      border-radius: 1px;
      position: relative;

      &::after {
        content: "";
        position: absolute;
        top: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.3), transparent);
        animation: shimmer 2s infinite;
      }
    }
  }
}

@keyframes shimmer {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

// 重置按钮
.reset-button {
  width: 100%;
  margin-top: 20px;
  border-radius: 12px;
  height: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #f56c6c, #f78989);
  border: none;
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(245, 108, 108, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.5px;

  &:hover {
    background: linear-gradient(135deg, #f78989, #f56c6c);
    box-shadow: 0 6px 20px rgba(245, 108, 108, 0.3);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(245, 108, 108, 0.2);
  }
}

:deep(.el-divider__text) {
  font-size: 16px;
  font-weight: 700;
}

// Element Plus 开关组件 - 完全适配主题系统
:deep(.el-switch) {
  --el-switch-on-color: var(--el-color-primary);
  --el-switch-off-color: var(--el-fill-color);

  .el-switch__core {
    min-width: 52px;
    height: 26px;
    border-radius: 26px;
    border: none;
    transition: all var(--animation-duration, 0.4s) cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--el-box-shadow-lighter);
    position: relative;
    background: var(--el-switch-off-color);

    .el-switch__inner {
      position: absolute;
      left: 28px;
      right: 8px;
      top: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--el-text-color-primary);
      font-size: var(--font-size-small, 11px);
      font-weight: 600;
    }

    .el-switch__action {
      width: 22px;
      height: 22px;
      left: initial !important;
      background: var(--el-bg-color);
      border-radius: 50%;
      transition: all var(--animation-duration, 0.4s) cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--el-box-shadow-light);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--el-border-color-lighter);

      // 添加微妙的内阴影
      &::after {
        content: "";
        position: absolute;
        top: 1px;
        left: 1px;
        right: 1px;
        bottom: 1px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--el-bg-color-overlay), transparent);
        pointer-events: none;
      }
    }
  }

  &.is-checked {
    .el-switch__core {
      background: var(--el-switch-on-color);
      box-shadow: var(--el-box-shadow-light);

      .el-switch__action {
        transform: translateX(26px);
        box-shadow: var(--el-box-shadow);
        background: var(--el-bg-color);

        &::before {
          content: "✓";
          font-size: var(--font-size-small, 12px);
          font-weight: bold;
          color: var(--el-color-primary);
        }
      }
    }
  }

  &:not(.is-checked) {
    .el-switch__core {
      background: var(--el-switch-off-color);

      .el-switch__action {
        transform: translateX(2px);

        &::before {
          content: "×";
          font-size: var(--font-size-small, 12px);
          font-weight: bold;
          color: var(--el-text-color-placeholder);
        }
      }
    }
  }

  &:hover {
    .el-switch__core {
      box-shadow: var(--el-box-shadow);
      transform: scale(var(--animation-scale, 1.05)) translateY(calc(-1px * var(--animation-scale, 1)));
    }

    &.is-checked .el-switch__core {
      box-shadow: var(--el-box-shadow-dark);
    }

    .el-switch__action {
      transform: translateX(2px) scale(var(--animation-scale, 1.1));

      &::after {
        opacity: 1;
      }
    }

    &.is-checked .el-switch__action {
      transform: translateX(26px) scale(var(--animation-scale, 1.1));
    }
  }

  &:active {
    .el-switch__core {
      transform: scale(0.95);
    }

    .el-switch__action {
      transform: translateX(2px) scale(0.9);
    }

    &.is-checked .el-switch__action {
      transform: translateX(26px) scale(0.9);
    }
  }
}

// 美化其他按钮样式
:deep(.el-button) {
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-weight: 500;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.is-plain {
    &:hover {
      background-color: rgba(64, 158, 255, 0.1);
      border-color: #409eff;
      color: #409eff;
    }
  }

  &.el-button--primary {
    background: linear-gradient(135deg, #409eff, #66b1ff);
    border: none;
    color: #ffffff;

    &:hover {
      background: linear-gradient(135deg, #66b1ff, #409eff);
      box-shadow: 0 6px 16px rgba(64, 158, 255, 0.3);
    }
  }

  &.el-button--danger {
    background: linear-gradient(135deg, #f56c6c, #f78989);
    border: none;
    color: #ffffff;

    &:hover {
      background: linear-gradient(135deg, #f78989, #f56c6c);
      box-shadow: 0 6px 16px rgba(245, 108, 108, 0.3);
    }
  }
}

// 美化输入框样式
:deep(.el-input-number) {
  width: 100%;
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.8));

  &:hover {
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    transform: translateY(-2px) scale(1.01);
  }

  &:focus-within {
    box-shadow:
      0 6px 24px rgba(64, 158, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    transform: translateY(-2px) scale(1.01);
  }

  .el-input-number__decrease,
  .el-input-number__increase {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    border-radius: 8px;
    margin: 2px;
    background: rgba(255, 255, 255, 0.8);

    &:hover {
      background: linear-gradient(135deg, #ecf5ff, #d9ecff);
      color: #409eff;
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
    }

    &:active {
      background: linear-gradient(135deg, #d9ecff, #c6e2ff);
      transform: scale(0.95);
    }
  }

  .el-input__wrapper {
    box-shadow: none !important;
    border: 2px solid rgba(220, 223, 230, 0.6);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(250, 251, 252, 0.8));

    &:hover {
      border-color: rgba(192, 196, 204, 0.8);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(236, 245, 255, 0.8));
    }

    &.is-focus {
      border-color: #409eff;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(236, 245, 255, 0.9));
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
    }

    .el-input__inner {
      font-weight: 500;
      color: #303133;
      text-align: center;
    }
  }
}

// 主题色选择器 - 完全适配 Element Plus 主题系统
.theme-color {
  display: flex;
  flex-wrap: wrap;
  gap: var(--interface-gap, 16px);
  margin-top: var(--interface-gap, 20px);
  padding: var(--interface-gap, 8px);

  li {
    height: 44px;
    width: 44px;
    cursor: pointer;
    border-radius: var(--border-radius-base, 14px);
    transition: all var(--animation-duration, 0.4s) cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--el-box-shadow-light);
    position: relative;
    border: 3px solid transparent;
    overflow: hidden;

    // 添加微妙的内光效果
    &::before {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      right: 2px;
      bottom: 2px;
      border-radius: var(--border-radius-small, 10px);
      background: linear-gradient(135deg, var(--el-bg-color-overlay), transparent);
      pointer-events: none;
    }

    // 添加悬停时的光晕效果
    &::after {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, var(--el-bg-color-overlay) 0%, transparent 70%);
      opacity: 0;
      transition: opacity var(--animation-duration, 0.3s) ease;
      pointer-events: none;
    }

    &:hover {
      transform: scale(var(--animation-scale, 1.15)) translateY(calc(-3px * var(--animation-scale, 1))) rotate(5deg);
      box-shadow: var(--el-box-shadow-dark);

      &::after {
        opacity: 1;
      }
    }

    &:active {
      transform: scale(1.05) translateY(-1px);
    }

    &:nth-child(1) {
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3), var(--el-color-primary));
      border-color: var(--el-color-primary-light-7);
    }

    &:nth-child(2) {
      background: linear-gradient(135deg, var(--el-color-success), var(--el-color-success-light-3), var(--el-color-success));
      border-color: var(--el-color-success-light-7);
    }

    &:nth-child(3) {
      background: linear-gradient(135deg, var(--el-color-warning), var(--el-color-warning-light-3), var(--el-color-warning));
      border-color: var(--el-color-warning-light-7);
    }

    &:nth-child(4) {
      background: linear-gradient(135deg, var(--el-color-danger), var(--el-color-danger-light-3), var(--el-color-danger));
      border-color: var(--el-color-danger-light-7);
    }

    &:nth-child(5) {
      background: linear-gradient(135deg, var(--el-color-info), var(--el-color-info-light-3), var(--el-color-info));
      border-color: var(--el-color-info-light-7);
    }

    // 选中状态的环形指示器
    &:has(.el-icon) {
      border-color: var(--el-color-primary);
      animation: pulse 2s infinite;
      box-shadow:
        0 0 0 4px var(--el-color-primary-light-8),
        var(--el-box-shadow-dark);

      .el-icon {
        color: var(--el-bg-color) !important;
        font-weight: bold;
        font-size: var(--font-size-large, 18px);
        animation: checkmark var(--animation-duration, 0.3s) ease;
      }
    }
  }
}

@keyframes checkmark {
  0% { transform: scale(0) rotate(0deg); }
  50% { transform: scale(1.2) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}

// 动画关键帧 - 使用 Element Plus 主题变量
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--el-color-primary-light-7);
  }
  50% {
    box-shadow: 0 0 0 8px transparent;
  }
}

@keyframes selectPulse {
  0%, 100% {
    box-shadow:
      0 0 0 4px var(--el-color-primary-light-8),
      var(--el-box-shadow);
  }
  50% {
    box-shadow:
      0 0 0 6px var(--el-color-primary-light-7),
      var(--el-box-shadow-dark);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 为设置区域添加进入动画
.setting-section {
  animation: fadeInUp var(--animation-duration, 0.6s) ease-out;

  &:nth-child(1) { animation-delay: calc(var(--animation-duration, 0.1s) * 1); }
  &:nth-child(2) { animation-delay: calc(var(--animation-duration, 0.1s) * 2); }
  &:nth-child(3) { animation-delay: calc(var(--animation-duration, 0.1s) * 3); }
  &:nth-child(4) { animation-delay: calc(var(--animation-duration, 0.1s) * 4); }
  &:nth-child(5) { animation-delay: calc(var(--animation-duration, 0.1s) * 5); }
  &:nth-child(6) { animation-delay: calc(var(--animation-duration, 0.1s) * 6); }
  &:nth-child(7) { animation-delay: calc(var(--animation-duration, 0.1s) * 7); }
  &:nth-child(8) { animation-delay: calc(var(--animation-duration, 0.1s) * 8); }
  &:nth-child(9) { animation-delay: calc(var(--animation-duration, 0.1s) * 9); }
  &:nth-child(10) { animation-delay: calc(var(--animation-duration, 0.1s) * 10); }
}

// 布局模式选择器 - 完全适配 Element Plus 主题系统
.pure-theme {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--interface-gap, 20px);
  margin-top: var(--interface-gap, 20px);
  padding: var(--interface-gap, 8px);

  li {
    position: relative;
    width: 100%;
    height: 85px;
    overflow: hidden;
    cursor: pointer;
    background: var(--el-fill-color-extra-light);
    border-radius: var(--border-radius-base, 16px);
    box-shadow: var(--el-box-shadow-light);
    transition: all var(--animation-duration, 0.4s) cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid var(--el-border-color-lighter);

    // 添加微妙的背景动画
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, var(--el-color-primary-light-9), transparent);
      transition: left var(--animation-duration, 0.6s) ease;
    }

    &:hover {
      transform: translateY(calc(-4px * var(--animation-scale, 1))) scale(var(--animation-scale, 1.02));
      box-shadow: var(--el-box-shadow-dark);
      border-color: var(--el-color-primary-light-7);

      &::before {
        left: 100%;
      }
    }

    &:active {
      transform: translateY(-2px) scale(0.98);
    }

    &.is-select {
      border-color: var(--el-color-primary);
      box-shadow:
        0 0 0 4px var(--el-color-primary-light-8),
        var(--el-box-shadow);
      background: var(--el-color-primary-light-9);
      animation: selectPulse 2s infinite;
    }

    // 占位符布局样式
    &.placeholder-layout {
      background: linear-gradient(135deg, #f8f9fa, #f0f2f5);
      border: 2px dashed rgba(220, 223, 230, 0.8);
      opacity: 0.7;

      &:hover {
        border-color: rgba(192, 196, 204, 0.8);
        background: linear-gradient(135deg, #f5f7fa, #eceff3);
        opacity: 0.9;
        transform: translateY(-2px) scale(1.01);
      }

      .coming-soon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);

        span {
          font-size: 11px;
          color: #909399;
          font-weight: 600;
          text-align: center;
          line-height: 1.2;
          letter-spacing: 0.3px;
        }
      }
    }

    &::after {
      content: attr(data-label);
      position: absolute;
      bottom: 8px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #909399;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.8));
      backdrop-filter: blur(8px);
      padding: 4px 8px;
      border-radius: 6px;
      margin: 0 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.6);
      letter-spacing: 0.3px;
      text-align: center; // 确保文字水平显示
      writing-mode: horizontal-tb; // 强制水平文字模式
    }

    &:hover::after {
      color: #303133;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(236, 245, 255, 0.9));
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &.is-select::after {
      color: #409eff;
      font-weight: 700;
      background: linear-gradient(135deg, rgba(236, 245, 255, 0.95), rgba(255, 255, 255, 0.9));
      border-color: rgba(64, 158, 255, 0.2);
    }

    &:nth-child(1) {
      &::after {
        content: "纵向布局";
      }

      div {
        &:nth-child(1) {
          width: 30%;
          height: 100%;
          background: var(--el-color-primary);
          opacity: 0.8;
          position: relative;

          &::after {
            content: "";
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 16px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
          }

          &::before {
            content: "";
            position: absolute;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 3px;
            border-radius: 1px;
            background: rgba(255, 255, 255, 0.7);
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
          }
        }

        &:nth-child(2) {
          position: absolute;
          top: 0;
          right: 0;
          width: 70%;
          height: 30%;
          background: var(--el-bg-color);
          box-shadow: 0 0 1px #888;

          &::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 10px;
            transform: translateY(-50%);
            width: 40px;
            height: 6px;
            border-radius: 3px;
            background: var(--el-fill-color-light);
          }
        }
      }
    }

    &:nth-child(2) {
      &::after {
        content: "横向布局";
      }

      div {
        &:nth-child(1) {
          width: 100%;
          height: 30%;
          background: var(--el-color-primary);
          opacity: 0.8;
          box-shadow: 0 0 1px #888;
          position: relative;

          &::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 15px;
            transform: translateY(-50%);
            width: 16px;
            height: 16px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.9);
          }

          &::before {
            content: "";
            position: absolute;
            top: 50%;
            left: 40px;
            transform: translateY(-50%);
            width: 16px;
            height: 3px;
            border-radius: 1px;
            background: rgba(255, 255, 255, 0.7);
          }
        }

        &:nth-child(2) {
          position: absolute;
          bottom: 20px;
          left: 10px;
          right: 10px;
          height: 8px;
          border-radius: 4px;
          background: var(--el-fill-color-light);
        }
      }
    }

    &:nth-child(3) {
      &::after {
        content: "混合布局";
      }

      div {
        &:nth-child(1) {
          width: 100%;
          height: 30%;
          background: var(--el-color-primary);
          opacity: 0.8;
          box-shadow: 0 0 1px #888;
          position: relative;

          &::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 15px;
            transform: translateY(-50%);
            width: 16px;
            height: 16px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.9);
          }
        }

        &:nth-child(2) {
          position: absolute;
          bottom: 20px;
          left: 0;
          width: 30%;
          height: 70%;
          background: var(--el-color-primary-light-8);
          box-shadow: 0 0 1px #888;

          &::after {
            content: "";
            position: absolute;
            top: 15px;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 3px;
            border-radius: 1px;
            background: var(--el-color-primary);
          }
        }

        &:nth-child(3) {
          position: absolute;
          bottom: 30px;
          right: 10px;
          width: 40px;
          height: 6px;
          border-radius: 3px;
          background: var(--el-fill-color-light);
        }
      }
    }

    &:nth-child(4) {
      &::after {
        content: "悬停导航";
      }

      div {
        &:nth-child(1) {
          width: 25%;
          height: 100%;
          background: var(--el-color-primary);
          opacity: 0.8;
          position: relative;

          &::after {
            content: "";
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: 12px;
            height: 12px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
          }

          &::before {
            content: "";
            position: absolute;
            top: 26px;
            left: 50%;
            transform: translateX(-50%);
            width: 12px;
            height: 2px;
            border-radius: 1px;
            background: rgba(255, 255, 255, 0.7);
            box-shadow: 0 4px 0 rgba(255, 255, 255, 0.7), 0 8px 0 rgba(255, 255, 255, 0.7);
          }
        }

        &:nth-child(2) {
          position: absolute;
          top: 0;
          right: 0;
          width: 75%;
          height: 30%;
          background: var(--el-bg-color);
          box-shadow: 0 0 1px #888;

          &::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 10px;
            transform: translateY(-50%);
            width: 35px;
            height: 4px;
            border-radius: 2px;
            background: var(--el-fill-color-light);
          }
        }

        &:nth-child(3) {
          position: absolute;
          top: 10px;
          left: 25px;
          width: 40px;
          height: 35px;
          background: var(--el-color-primary-light-5);
          border-radius: 4px;
          opacity: 0.8;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

          &::after {
            content: "";
            position: absolute;
            top: 8px;
            left: 8px;
            width: 24px;
            height: 2px;
            border-radius: 1px;
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 4px 0 rgba(255, 255, 255, 0.9), 0 8px 0 rgba(255, 255, 255, 0.9), 0 12px 0 rgba(255, 255, 255, 0.9);
          }
        }
      }
    }

    /* 占位符样式 */
    &.placeholder-layout {
      opacity: 0.6;
      cursor: not-allowed;
      background: linear-gradient(135deg, var(--el-fill-color-light), var(--el-fill-color));

      &:hover {
        transform: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .coming-soon {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;

        span {
          font-size: 11px;
          color: var(--el-text-color-secondary);
          font-weight: 500;
          text-align: center;
          line-height: 1.2;
        }
      }

      &::after {
        content: "更多布局";
        font-size: 10px;
        color: var(--el-text-color-placeholder);
      }
    }
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
  margin-top: var(--interface-gap, 12px);
  background: var(--el-bg-color-page);
  border-radius: var(--border-radius-base, 12px);
  padding: var(--interface-gap, 8px) var(--interface-padding, 16px);
  box-shadow: var(--el-box-shadow-lighter);
  transition: all var(--animation-duration, 0.3s) ease;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--interface-gap, 12px) 0;
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
      padding-left: var(--interface-gap, 8px);
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
      background: var(--el-bg-color);
      color: var(--el-color-primary);
      box-shadow: var(--el-box-shadow-lighter);
    }
  }
}

// 标题样式
p.mt-5 {
  margin-top: var(--interface-gap, 24px) !important;
  font-size: var(--font-size-base, 15px);
  position: relative;
  padding-left: var(--interface-gap, 12px);
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
</style>

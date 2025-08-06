<script setup lang="ts">
import { emitter, useAppStoreHook, useMultiTagsStoreHook } from "@repo/core";
import { computed, nextTick, onBeforeMount, onMounted, onUnmounted, reactive, ref, unref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useNav } from "../../hooks/useNav";
import LayPanel from "../lay-panel/index.vue";

import { debounce, isNumber, useDark, useGlobal } from "@pureadmin/utils";
import Segmented, { type OptionsType } from "@repo/components/ReSegmented";
import { useDataThemeChange } from "../../hooks/useDataThemeChange";

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

// 存储 tippy 实例的数组，用于组件销毁时清理
const tippyInstances = ref([]);

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

});

const getThemeColorStyle = computed(() => {
  return (color: string) => {
    return { background: color };
  };
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

function onChange({ option }: { option: OptionsType }) {
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



/** 数字输入框调整值函数 */
const adjustValue = (key: string, delta: number): void => {
  const currentValue = settings[key] as number;
  const newValue = Math.max(0, Math.min(100, currentValue + delta));

  if (newValue !== currentValue) {
    settings[key] = newValue;

    // 根据不同的参数调用对应的变更函数
    switch (key) {
      case 'contentMargin':
        contentMarginChange(newValue);
        break;
      case 'layoutRadius':
        layoutRadiusChange(newValue);
        break;
      case 'layoutBlur':
        layoutBlurChange(newValue);
        break;
    }
  }
};

/** 处理数字输入框的键盘事件 */
const handleKeydown = (event: KeyboardEvent, key: string): void => {
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    adjustValue(key, 1);
  } else if (event.key === 'ArrowDown') {
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
      case 'contentMargin':
        contentMarginChange(value);
        break;
      case 'layoutRadius':
        layoutRadiusChange(value);
        break;
      case 'layoutBlur':
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


  });
});

// 收集 tippy 实例的函数
const collectTippyInstances = () => {
  nextTick(() => {
    const elementsWithTippy = [
      verticalRef.value,
      horizontalRef.value,
      mixRef.value,
      hoverRef.value
    ].filter(Boolean);

    elementsWithTippy.forEach(element => {
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
    hoverRef.value
  ].filter(Boolean);

  elementsWithTippy.forEach(element => {
    if (element && element._tippy) {
      element._tippy.destroy();
    }
  });

  // 销毁存储在数组中的实例
  tippyInstances.value.forEach(instance => {
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy();
    }
  });

  // 清空数组
  tippyInstances.value = [];

  // 清理可能残留的 tippy DOM 元素
  const tippyElements = document.querySelectorAll('[data-tippy-root]');
  tippyElements.forEach(element => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
};

onUnmounted(() => {
  removeMatchMedia();
  destroyAllTippyInstances();
  // 移除事件监听器
  emitter.off("settingPanelClosed");
});


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
          <Segmented resize class="select-none modern-segmented"
            :modelValue="overallStyle === 'system' ? 2 : dataTheme ? 1 : 0" :options="themeOptions" @change="
              (theme) => {
                theme.index === 1 && theme.index !== 2 ? (dataTheme = true) : (dataTheme = false);
                overallStyle = theme.option.theme;
                dataThemeChange(theme.option.theme);
                theme.index === 2 && watchSystemThemeChange();
              }
            " />
        </div>
      </div>

      <!-- 主题色设置区域 -->
      <div class="setting-section">
        <div class="section-header">
          <IconifyIconOffline :icon="'ri:drop-line'" class="section-icon" />
          <h3 class="section-title">{{ t("panel.pureThemeColor") }}</h3>
        </div>
        <div class="setting-content">
          <div class="theme-color-grid">
            <div v-for="(item, index) in themeColors" v-show="showThemeColors(item.themeColor)" :key="index"
              class="theme-color-item" :class="{ 'is-selected': item.themeColor === layoutTheme.theme }"
              :style="getThemeColorStyle(item.color)" @click="setLayoutThemeColor(item.themeColor)">
              <!-- 选中状态指示器 -->
              <div class="selection-indicator">
                <div class="check-ring">
                  <IconifyIconOffline :icon="Check" class="check-icon" />
                </div>
              </div>



              <!-- 光泽效果层 -->
              <div class="shine-effect"></div>
            </div>
          </div>
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
            <li ref="verticalRef" v-tippy="{
              content: t('panel.pureVerticalTip'),
              zIndex: 41000,
            }" :class="layoutTheme.layout === 'vertical' ? 'is-select' : ''" @click="setLayoutModel('vertical')">
              <div />
              <div />
            </li>
            <li v-if="device !== 'mobile'" ref="horizontalRef" v-tippy="{
              content: t('panel.pureHorizontalTip'),
              zIndex: 41000,
            }" :class="layoutTheme.layout === 'horizontal' ? 'is-select' : ''" @click="setLayoutModel('horizontal')">
              <div />
              <div />
            </li>
            <li v-if="device !== 'mobile'" ref="mixRef" v-tippy="{
              content: t('panel.pureMixTip'),
              zIndex: 41000,
            }" :class="layoutTheme.layout === 'mix' ? 'is-select' : ''" @click="setLayoutModel('mix')">
              <div />
              <div />
            </li>
            <li v-if="device !== 'mobile'" ref="hoverRef" v-tippy="{
              content: '悬停导航：只显示一级菜单，鼠标悬停显示子菜单',
              zIndex: 41000,
            }" :class="layoutTheme.layout === 'hover' ? 'is-select' : ''" @click="setLayoutModel('hover')">
              <div />
              <div />
              <div />
            </li>
            <li v-if="device !== 'mobile'" ref="cardRef" v-tippy="{
              content: '卡片导航：以卡片形式展示所有可访问页面',
              zIndex: 41000,
            }" :class="layoutTheme.layout === 'card' ? 'is-select' : ''" @click="setLayoutModel('card')">
              <div />
              <div />
              <div />
              <div />
            </li>
            <li v-if="device !== 'mobile'" class="placeholder-layout" v-tippy="{
              content: '敬请期待更多布局模式',
              zIndex: 41000,
            }">
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
          <Segmented resize class="mb-2 select-none modern-segmented" :modelValue="isNumber(settings.stretch) ? 1 : 0"
            :options="stretchTypeOptions" @change="stretchTypeChange" />
          <el-input-number v-if="isNumber(settings.stretch)" v-model="settings.stretch as number" :min="1280"
            :max="1600" controls-position="right" @change="(value: number) => setStretch(value)" />
          <button v-else v-ripple="{ class: 'text-gray-300' }" class="stretch-button"
            @click="setStretch(!settings.stretch)">
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
          <!-- 现代化数字输入框 - 横向布局 -->
          <div class="layout-params-grid">
            <div class="param-item">
              <label class="param-label">{{ t("panel.pureStretchMargin") || "内容边距" }}</label>
              <div class="custom-number-input">
                <button class="number-btn decrease" @click="adjustValue('contentMargin', -1)"
                  :disabled="settings.contentMargin <= 0">
                  <IconifyIconOffline :icon="'ri:subtract-line'" />
                </button>
                <div class="number-display">
                  <input type="number" v-model.number="settings.contentMargin"
                    @input="handleInput($event, 'contentMargin')" @keydown="handleKeydown($event, 'contentMargin')"
                    :min="0" :max="100" class="number-input" placeholder="0" />
                  <span class="number-unit">px</span>
                </div>
                <button class="number-btn increase" @click="adjustValue('contentMargin', 1)"
                  :disabled="settings.contentMargin >= 100">
                  <IconifyIconOffline :icon="'ri:add-line'" />
                </button>
              </div>
            </div>

            <div class="param-item">
              <label class="param-label">{{ t("panel.pureLayoutRadius") || "圆角大小" }}</label>
              <div class="custom-number-input">
                <button class="number-btn decrease" @click="adjustValue('layoutRadius', -1)"
                  :disabled="settings.layoutRadius <= 0">
                  <IconifyIconOffline :icon="'ri:subtract-line'" />
                </button>
                <div class="number-display">
                  <input type="number" v-model.number="settings.layoutRadius"
                    @input="handleInput($event, 'layoutRadius')" @keydown="handleKeydown($event, 'layoutRadius')"
                    :min="0" :max="100" class="number-input" placeholder="0" />
                  <span class="number-unit">px</span>
                </div>
                <button class="number-btn increase" @click="adjustValue('layoutRadius', 1)"
                  :disabled="settings.layoutRadius >= 100">
                  <IconifyIconOffline :icon="'ri:add-line'" />
                </button>
              </div>
            </div>

            <div class="param-item">
              <label class="param-label">{{ t("panel.pureLayoutBlur") || "模糊效果" }}</label>
              <div class="custom-number-input">
                <button class="number-btn decrease" @click="adjustValue('layoutBlur', -1)"
                  :disabled="settings.layoutBlur <= 0">
                  <IconifyIconOffline :icon="'ri:subtract-line'" />
                </button>
                <div class="number-display">
                  <input type="number" v-model.number="settings.layoutBlur" @input="handleInput($event, 'layoutBlur')"
                    @keydown="handleKeydown($event, 'layoutBlur')" :min="0" :max="100" class="number-input"
                    placeholder="0" />
                  <span class="number-unit">px</span>
                </div>
                <button class="number-btn increase" @click="adjustValue('layoutBlur', 1)"
                  :disabled="settings.layoutBlur >= 100">
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
          <IconifyIconOffline :icon="'ri:price-tag-3-line'" class="section-icon" />
          <h3 class="section-title">{{ t("panel.pureTagsStyle") }}</h3>
        </div>
        <div class="setting-content">
          <Segmented resize class="select-none modern-segmented"
            :modelValue="markValue === 'smart' ? 0 : markValue === 'card' ? 1 : 2" :options="markOptions"
            @change="onChange" />
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
              <el-switch v-model="logoVal" inline-prompt :active-value="true" :inactive-value="false"
                @change="logoChange" />
            </div>

            <div class="switch-item">
              <label class="switch-label">内容卡片</label>
              <el-switch v-model="cardBodyVal" inline-prompt :active-value="true" :inactive-value="false"
                @change="cardBodyChange" />
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
// 现代化设置容器 - 统一设计风格
.modern-setting-container {
  padding: 20px;
  background: var(--el-bg-color-page);
  border-radius: 16px;
  min-height: 100vh;
  width: 420px;
  max-width: 100%;
  position: relative;
  overflow: hidden;
  // 移除 transition: all，避免主题切换延迟
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 现代化背景装饰 - 与导航栏风格一致
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
        rgba(var(--el-color-primary-rgb), 0.1) 0%,
        rgba(var(--el-color-primary-rgb), 0.3) 50%,
        rgba(var(--el-color-primary-rgb), 0.1) 100%);
    z-index: 0;
  }

  // 添加微妙的背景纹理
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, var(--el-color-primary-light-9) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, var(--el-color-primary-light-9) 0%, transparent 50%);
    opacity: 0.3;
    pointer-events: none;
    z-index: 0;
  }

  // 确保内容在装饰之上
  >* {
    position: relative;
    z-index: 1;
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-bg-color-page);

    &::before {
      background: linear-gradient(90deg,
          rgba(var(--el-color-primary-rgb), 0.15) 0%,
          rgba(var(--el-color-primary-rgb), 0.4) 50%,
          rgba(var(--el-color-primary-rgb), 0.15) 100%);
    }
  }
}

// 设置区域 - 现代化卡片设计
.setting-section {
  margin-bottom: 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--el-border-color-extra-light);
  // 优化 transition，只对变形和阴影生效，避免主题切换延迟
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  backdrop-filter: blur(8px);

  // 现代化装饰线 - 与导航栏风格一致
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
        transparent,
        var(--el-color-primary-light-7),
        transparent);
    border-radius: 12px 12px 0 0;
  }

  // 微交互效果
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border-color: var(--el-color-primary-light-8);
    transform: translateY(-1px);

    &::before {
      background: linear-gradient(90deg,
          transparent,
          var(--el-color-primary-light-5),
          transparent);
    }
  }

  &:last-child {
    margin-bottom: 0;
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-bg-color);
    border-color: var(--el-border-color-light);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

    &:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      border-color: var(--el-color-primary-light-6);
    }
  }
}

// 区域标题 - 现代化设计
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  position: relative;

  // 装饰性渐变线
  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg,
        var(--el-color-primary),
        var(--el-color-primary-light-3));
    border-radius: 1px;
    transition: width 0.3s ease;
  }

  &:hover::after {
    width: 80px;
  }

  .section-icon {
    font-size: 18px;
    color: var(--el-color-primary);
    margin-right: 12px;
    background: var(--el-color-primary-light-9);
    padding: 8px;
    border-radius: 8px;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
      background: var(--el-color-primary-light-8);
    }
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0;
    flex: 1;
    letter-spacing: 0.3px;
    text-align: left;
    writing-mode: horizontal-tb;
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

// 美化 Segmented 组件 - 现代化设计
:deep(.layui-segmented) {
  background: var(--el-fill-color-extra-light);
  border-radius: 10px;
  padding: 4px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--el-border-color-extra-light);
  // 移除 transition: all，避免主题切换延迟
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  .layui-segmented-item {
    border-radius: 6px;
    // 优化 transition，只对变形和阴影生效
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      background-color 0.15s ease;
    font-weight: 500;
    color: var(--el-text-color-regular);
    padding: 8px 14px;
    position: relative;
    overflow: hidden;
    font-size: 13px;
    text-align: center;
    writing-mode: horizontal-tb;
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;

    // 微交互效果
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg,
          transparent,
          rgba(var(--el-color-primary-rgb), 0.1),
          transparent);
      transition: left 0.5s ease;
    }

    &:hover {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.1);

      &::before {
        left: 100%;
      }
    }

    &.layui-segmented-checked {
      background: var(--el-bg-color);
      color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.15);
      font-weight: 600;
      border: 1px solid var(--el-color-primary-light-8);
      transform: translateY(-1px);

      &::before {
        display: none;
      }
    }
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-fill-color-dark);
    border-color: var(--el-border-color);

    .layui-segmented-item {
      &:hover {
        background: var(--el-color-primary-light-8);
      }

      &.layui-segmented-checked {
        background: var(--el-bg-color-overlay);
        border-color: var(--el-color-primary-light-6);
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
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
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
    background: linear-gradient(180deg,
        var(--el-color-primary),
        var(--el-color-primary-light-3));
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
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--el-border-color-extra-light);
  position: relative;
  overflow: hidden;

  // 背景动画效果
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
        transparent,
        rgba(var(--el-color-primary-rgb), 0.05),
        transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    background: var(--el-color-primary-light-9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.1);
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

    &:hover {
      background: var(--el-color-primary-light-8);
      border-color: var(--el-color-primary-light-6);
    }
  }
}

// 拉伸按钮样式 - 现代化设计
.stretch-button {
  background: var(--el-bg-color);
  border: 2px solid var(--el-border-color-extra-light);
  border-radius: 12px;
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  // 优化 transition，避免主题切换延迟
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
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
    background: linear-gradient(90deg,
        transparent,
        rgba(var(--el-color-primary-rgb), 0.05),
        transparent);
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
      background: linear-gradient(90deg,
          var(--el-color-primary),
          var(--el-color-primary-light-3),
          var(--el-color-primary));
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
      background: linear-gradient(90deg,
          var(--el-color-primary-light-5),
          var(--el-color-primary),
          var(--el-color-primary-light-5));
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
        background: linear-gradient(90deg,
            transparent,
            rgba(var(--el-color-primary-rgb), 0.3),
            transparent);
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
  background: linear-gradient(135deg,
      var(--el-color-danger),
      var(--el-color-danger-light-3));
  border: none;
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(var(--el-color-danger-rgb), 0.25);
  // 优化 transition，避免主题切换延迟
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
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
    background: linear-gradient(90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent);
    transition: left 0.6s ease;
  }

  &:hover {
    background: linear-gradient(135deg,
        var(--el-color-danger-light-3),
        var(--el-color-danger));
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
    transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1),
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
      background: linear-gradient(135deg,
          rgba(255, 255, 255, 0.2),
          rgba(255, 255, 255, 0.05));
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
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
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
        background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.3),
            transparent);
        pointer-events: none;
      }
    }
  }

  &.is-checked {
    .el-switch__core {
      background: linear-gradient(135deg,
          var(--el-switch-on-color),
          var(--el-color-primary-light-3));
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
      background: linear-gradient(135deg,
          var(--el-switch-off-color),
          var(--el-fill-color-light));

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
        background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.02));
      }
    }

    .el-switch__action {
      background: linear-gradient(135deg,
          var(--el-bg-color),
          var(--el-bg-color-overlay));
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
  // 移除过渡动画
  transition: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-weight: 500;

  // 移除悬停效果
  &:hover {
    transform: none; // 移除位移效果
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  // 移除点击效果
  &:active {
    transform: none; // 移除位移效果
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

// 现代化数字输入框样式
.layout-params-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.param-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-fill-color-extra-light);
  border-radius: 10px;
  border: 1px solid var(--el-border-color-extra-light);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-8);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.1);
  }

  .param-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    margin: 0;
    flex: 1;
    text-align: left;
    writing-mode: horizontal-tb;
    white-space: nowrap;
  }
}

.custom-number-input {
  display: flex;
  align-items: center;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary-light-7);
    box-shadow: 0 4px 8px rgba(var(--el-color-primary-rgb), 0.1);
  }

  &:focus-within {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
  }

  .number-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;

    &:hover:not(:disabled) {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }

    &:active:not(:disabled) {
      background: var(--el-color-primary-light-8);
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
    background: var(--el-bg-color);
    padding: 0 8px;
    min-width: 80px;
    justify-content: center;
    position: relative;

    .number-input {
      border: none;
      background: transparent;
      color: var(--el-text-color-primary);
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      width: 40px;
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
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      margin-left: 4px;
      font-weight: 500;
    }
  }

  // 暗色主题适配
  .dark & {
    background: var(--el-bg-color-overlay);
    border-color: var(--el-border-color);

    .number-btn {
      background: var(--el-fill-color-dark);

      &:hover:not(:disabled) {
        background: var(--el-color-primary-light-8);
      }
    }

    .number-display {
      background: var(--el-bg-color-overlay);
    }
  }
}

// 美化原有输入框样式（保留兼容性）
:deep(.el-input-number) {
  width: 100%;
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
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
    background: var(--el-bg-color);

    &:hover {
      border-color: var(--el-border-color-hover);
      background: var(--el-fill-color-extra-light);
    }

    &.is-focus {
      border-color: var(--el-color-primary);
      background: var(--el-bg-color);
      box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.1);
    }

    .el-input__inner {
      font-weight: 500;
      color: var(--el-text-color-primary);
      text-align: center;
    }
  }
}

// 现代化主题色选择器 - 更紧凑设计
.theme-color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(28px, 1fr));
  gap: 8px;
  margin-top: 8px;
  padding: 0;
}

.theme-color-item {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  // 优化 transition，避免主题切换延迟
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid var(--el-border-color-extra-light);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

  // 基础光泽效果
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg,
        rgba(255, 255, 255, 0.3) 0%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
    z-index: 1;
  }

  // 悬停效果
  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    border-color: var(--el-color-primary-light-6);

    .shine-effect {
      opacity: 1;
      transform: translateX(100%);
    }

    .selection-indicator {
      transform: scale(1.05);
    }
  }

  // 点击效果
  &:active {
    transform: translateY(-1px) scale(1.01);
  }

  // 选中状态
  &.is-selected {
    border-color: var(--el-color-primary);
    box-shadow:
      0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2),
      0 4px 16px rgba(var(--el-color-primary-rgb), 0.25);
    transform: translateY(-1px);

    .selection-indicator {
      opacity: 1;
      transform: scale(1);

      .check-ring {
        background: rgba(255, 255, 255, 0.95);
        border-color: var(--el-color-primary);
        transform: scale(1);

        .check-icon {
          opacity: 1;
          transform: scale(1);
          color: var(--el-color-primary);
        }
      }
    }



    // 选中状态的脉冲动画
    &::after {
      content: "";
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border-radius: 8px;
      border: 1px solid var(--el-color-primary);
      opacity: 0;
      animation: pulse-ring 2s infinite;
      pointer-events: none;
      z-index: 10;
    }
  }

  // 暗色主题适配
  .dark & {
    border-color: var(--el-border-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    &:hover {
      border-color: var(--el-color-primary-light-4);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
    }

    &.is-selected {
      box-shadow:
        0 0 0 3px rgba(var(--el-color-primary-rgb), 0.3),
        0 8px 25px rgba(var(--el-color-primary-rgb), 0.4);
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
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent);
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
      background: var(--el-bg-color);
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

// 布局模式选择器 - 完全适配 Element Plus 主题系统
.pure-theme {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 20px;
  margin-top: 20px;
  padding: 8px;

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

    &:nth-child(5) {
      &::after {
        content: "卡片导航";
      }

      div {
        &:nth-child(1) {
          position: absolute;
          top: 15px;
          left: 15px;
          width: 12px;
          height: 12px;
          background: var(--el-color-primary);
          border-radius: 2px;
          opacity: 0.9;
        }

        &:nth-child(2) {
          position: absolute;
          top: 15px;
          left: 32px;
          width: 12px;
          height: 12px;
          background: var(--el-color-primary);
          border-radius: 2px;
          opacity: 0.9;
        }

        &:nth-child(3) {
          position: absolute;
          top: 32px;
          left: 15px;
          width: 12px;
          height: 12px;
          background: var(--el-color-primary);
          border-radius: 2px;
          opacity: 0.9;
        }

        &:nth-child(4) {
          position: absolute;
          top: 32px;
          left: 32px;
          width: 12px;
          height: 12px;
          background: var(--el-color-primary);
          border-radius: 2px;
          opacity: 0.9;
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
      background: var(--el-bg-color);
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
  transition: background-color var(--theme-transition-duration) var(--theme-transition-timing),
    border-color var(--theme-transition-duration) var(--theme-transition-timing),
    color var(--theme-transition-duration) var(--theme-transition-timing) !important;
}

// 确保所有使用CSS变量的元素都能快速响应主题变化
[style*="--el-"],
[class*="el-"] {
  transition: background-color var(--theme-transition-duration) var(--theme-transition-timing),
    border-color var(--theme-transition-duration) var(--theme-transition-timing),
    color var(--theme-transition-duration) var(--theme-transition-timing);
}


.modern-input-number .el-input__wrapper {
  border-radius: var(--el-border-radius-base, 8px) !important;
}
</style>

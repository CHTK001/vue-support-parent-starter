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
      debounce(setFalse([horizontalRef]), 50);
      debounce(setFalse([mixRef]), 50);
      break;
    case "horizontal":
      toggleClass(true, "is-select", unref(horizontalRef));
      debounce(setFalse([verticalRef]), 50);
      debounce(setFalse([mixRef]), 50);
      break;
    case "mix":
      toggleClass(true, "is-select", unref(mixRef));
      debounce(setFalse([verticalRef]), 50);
      debounce(setFalse([horizontalRef]), 50);
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

onUnmounted(() => removeMatchMedia);
</script>

<template>
  <LayPanel>
    <div class="p-5">
      <p :class="pClass">
        <b>{{ t("panel.pureOverallStyle") }}</b>
      </p>
      <Segmented
        resize
        class="select-none"
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

      <p :class="['mt-5', pClass]">
        <b>{{ t("panel.pureThemeColor") }}</b>
      </p>
      <ul class="theme-color">
        <li v-for="(item, index) in themeColors" v-show="showThemeColors(item.themeColor)" :key="index" :style="getThemeColorStyle(item.color)" @click="setLayoutThemeColor(item.themeColor)">
          <el-icon style="margin: 0.1em 0.1em 0 0" :size="17" :color="getThemeColor(item.themeColor)">
            <IconifyIconOffline :icon="Check" />
          </el-icon>
        </li>
      </ul>

      <br />
      <br />
      <p :class="['mt-5', pClass]">
        <b>{{ t("panel.pureLayoutModel") }}</b>
      </p>
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
      </ul>

      <span v-if="useAppStoreHook().getViewportWidth > 1280">
        <p :class="['mt-5', pClass]">{{ t("panel.pureStretch") }}</p>
        <Segmented resize class="mb-2 select-none" :modelValue="isNumber(settings.stretch) ? 1 : 0" :options="stretchTypeOptions" @change="stretchTypeChange" />
        <el-input-number v-if="isNumber(settings.stretch)" v-model="settings.stretch as number" :min="1280" :max="1600" controls-position="right" @change="(value) => setStretch(value)" />
        <button v-else v-ripple="{ class: 'text-gray-300' }" class="bg-transparent flex-c w-full h-20 rounded-md border border-[var(--pure-border-color)]" @click="setStretch(!settings.stretch)">
          <div class="flex-bc transition-all duration-300" :class="[settings.stretch ? 'w-[24%]' : 'w-[50%]']" style="color: var(--el-color-primary)">
            <IconifyIconOffline :icon="settings.stretch ? RightArrow : LeftArrow" height="20" />
            <div class="flex-grow border-b border-dashed" style="border-color: var(--el-color-primary)" />
            <IconifyIconOffline :icon="settings.stretch ? LeftArrow : RightArrow" height="20" />
          </div>
        </button>
      </span>

      <span>
        <p :class="['mt-5', pClass]">{{ t("panel.pureStretchMargin") }}</p>
        <el-input-number v-model="settings.contentMargin as number" :min="0" :max="100" controls-position="right" @change="(value) => contentMarginChange(value)" />
      </span>

      <span>
        <p :class="['mt-5', pClass]">{{ t("panel.pureLayoutRadius") }}</p>
        <el-input-number v-model="settings.layoutRadius as number" :min="0" :max="100" controls-position="right" @change="(value) => layoutRadiusChange(value)" />
      </span>

      <span>
        <p :class="['mt-5', pClass]">{{ t("panel.pureLayoutBlur") }}</p>
        <el-input-number v-model="settings.layoutBlur as number" :min="0" :max="100" controls-position="right" @change="(value) => layoutBlurChange(value)" />
      </span>

      <p :class="['mt-4', pClass]">{{ t("panel.pureTagsStyle") }}</p>
      <Segmented resize class="select-none" :modelValue="markValue === 'smart' ? 0 : markValue === 'card' ? 1 : 2" :options="markOptions" @change="onChange" />

      <p class="mt-5 font-medium text-base dark:text-white">
        <b>{{ t("panel.transition") }}</b>
      </p>
      <ul class="setting">
        <li>
          <span class="dark:text-white">{{ t("panel.menuTransitionChange") }}</span>
          <el-switch v-model="settings.menuTransition" inline-prompt @change="menuTransitionChange" />
        </li>
      </ul>

      <p class="mt-5 font-medium text-base dark:text-white">
        <b>{{ t("panel.pureInterfaceDisplay") }}</b>
      </p>
      <ul class="setting">
        <li>
          <span class="dark:text-white">{{ t("panel.pureGreyModel") }}</span>
          <el-switch v-model="settings.greyVal" inline-prompt @change="greyChange" />
        </li>
        <li>
          <span class="dark:text-white">{{ t("panel.pureWeakModel") }}</span>
          <el-switch v-model="settings.weakVal" inline-prompt @change="weekChange" />
        </li>
        <li>
          <span class="dark:text-white">{{ t("panel.pureHiddenTags") }}</span>
          <el-switch v-model="settings.tabsVal" inline-prompt @change="tagsChange" />
        </li>
        <li>
          <span class="dark:text-white">{{ t("panel.pureHiddenFooter") }}</span>
          <el-switch v-model="settings.hideFooter" inline-prompt @change="hideFooterChange" />
        </li>
        <li>
          <span class="dark:text-white">Logo</span>
          <el-switch v-model="logoVal" inline-prompt :active-value="true" :inactive-value="false" @change="logoChange" />
        </li>
        <li>
          <span class="dark:text-white">内容卡片</span>
          <el-switch v-model="cardBodyVal" inline-prompt :active-value="true" :inactive-value="false" @change="cardBodyChange" />
        </li>
        <li>
          <span class="dark:text-white">
            {{ t("panel.pureMultiTagsCache") }}
          </span>
          <el-switch v-model="settings.multiTagsCache" inline-prompt @change="multiTagsCacheChange" />
        </li>
      </ul>
    </div>
  </LayPanel>
</template>

<style lang="scss" scoped>
:deep(.el-divider__text) {
  font-size: 16px;
  font-weight: 700;
}

:deep(.el-switch) {
  --el-switch-on-color: #2468f2;
  --el-switch-off-color: #444;

  .el-switch__core {
    min-width: 44px;
    height: 22px;
    border-radius: 22px;
    border: none;
    transition: all 0.3s cubic-bezier(0.34, 0.69, 0.1, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;

    .el-switch__inner {
      position: absolute;
      left: 25px;
      right: 6px;
      top: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 12px;
    }

    .el-switch__action {
      width: 18px;
      height: 18px;
      left: initial !important;
      background-color: #fff;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.34, 0.69, 0.1, 1);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  &.is-checked {
    .el-switch__core {
      background-color: var(--el-switch-on-color);
      box-shadow: 0 2px 4px rgba(36, 104, 242, 0.2);

      .el-switch__action {
        transform: translateX(22px);

        &::before {
          content: "✓";
          font-size: 12px;
          color: var(--el-switch-on-color);
        }
      }
    }
  }

  &:not(.is-checked) {
    .el-switch__core {
      background-color: var(--el-switch-off-color);

      .el-switch__action {
        transform: translateX(2px);

        &::before {
          content: "×";
          font-size: 12px;
          color: #f56c6c;
        }
      }
    }
  }

  &:hover {
    .el-switch__core {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
  }
}

// 美化其他按钮样式
:deep(.el-button) {
  border-radius: 8px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }

  &.is-plain {
    &:hover {
      background-color: rgba(var(--el-color-primary-rgb), 0.1);
    }
  }

  &.el-button--primary {
    background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
    border: none;

    &:hover {
      background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
    }
  }
}

// 美化输入框样式
:deep(.el-input-number) {
  width: 100%;
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:focus-within {
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
  }

  .el-input-number__decrease,
  .el-input-number__increase {
    transition: all 0.3s;

    &:hover {
      background-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
    }
  }

  .el-input__wrapper {
    box-shadow: none !important;
  }
}

.theme-color {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;

  li {
    height: 28px;
    width: 28px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: scale(1.1);
    }

    &:nth-child(1) {
      border: 1px solid #ddd;
    }
  }
}

.pure-theme {
  display: flex;
  gap: 16px;
  margin-top: 12px;

  li {
    position: relative;
    width: 80px;
    height: 60px;
    overflow: hidden;
    cursor: pointer;
    background: var(--el-bg-color-page);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid transparent;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    }

    &.is-select {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
    }

    &::after {
      content: attr(data-label);
      position: absolute;
      bottom: 5px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      transition: all 0.3s;
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
  }
}

.is-select {
  border: 2px solid var(--el-color-primary);
}
.bg-bg_color {
  background-color: var(--el-bg-color) !important;
}
.setting {
  margin-top: 12px;
  background: var(--el-bg-color-page);
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    font-size: 14px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--el-fill-color-light);
      padding-left: 8px;
      border-radius: 6px;
    }

    span {
      font-weight: 500;
    }
  }
}
:deep(.el-segmented-control) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden;

  .el-segmented-control-item {
    transition: all 0.3s;

    &:hover:not(.is-active) {
      background: var(--el-fill-color-light);
    }

    &.is-active {
      font-weight: 500;
    }
  }
}

p.mt-5 {
  margin-top: 24px !important;
  font-size: 15px;
  position: relative;
  padding-left: 12px;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 16px;
    background: var(--el-color-primary);
    border-radius: 2px;
  }
}
</style>

<script setup lang="ts">
import "animate.css";
// 引入 src/components/ReIcon/src/offlineIcon.ts 文件中所有使用addIcon添加过的本地图标
import "@repo/components/ReIcon/src/offlineIcon";
import {
  emitter,
  initRouter,
  useAppStoreHook,
  useSettingStoreHook,
} from "@repo/core";
import { useI18n } from "vue-i18n";
import { useTheme } from "./hooks/useThemeComponent";
import { useLayout } from "./hooks/useLayout";
import { useLoadingPage } from "./hooks/useLoadingPage";
import { useResponsiveLayout } from "./hooks/useResponsiveLayout";
import { useWatermarkSetup } from "./hooks/useWatermarkSetup";
import { useDebugMode } from "./hooks/useDebugMode";
import { setType } from "./types";
import ScDebugConsole from "@repo/components/ScDebugConsole/index.vue";
import { CoolLoading } from "@repo/pages";

import { useGlobal } from "@pureadmin/utils";
import { storeToRefs } from "pinia";
import {
  computed,
  defineComponent,
  h,
  markRaw,
  nextTick,
  onBeforeMount,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from "vue";
import { createLayoutAsyncComponent } from "./utils/asyncComponentLoader";
import BackTopIcon from "@repo/assets/svg/back_top.svg?component";
import { getConfig } from "@repo/config";
import { createFingerprint, registerRequestIdleCallback } from "@repo/core";
import { localStorageProxy } from "@repo/utils";
import LayNavbar from "./components/lay-navbar/index.vue";
import LaySetting from "./components/lay-setting/index.vue";
import NavDoubleLayout from "./components/lay-sidebar/NavDouble.vue";
import NavHorizontalLayout from "./components/lay-sidebar/NavHorizontal.vue";
import NavHoverLayout from "./components/lay-sidebar/NavHover.vue";
import NavVerticalLayout from "./components/lay-sidebar/NavVertical.vue";
import NavMobileLayout from "./components/lay-sidebar/NavMobile.vue";
import LayTag from "./components/lay-tag/index.vue";
import LayAiChat from "./components/lay-ai-chat/index.vue";
import ThemeSkinProvider from "./themes/ThemeSkinProvider.vue";
import FpsMonitor from "./components/lay-performance/FpsMonitor.vue";
import { useThemeStoreHook } from "./stores/themeStore";
import LiteInspector from "./components/lay-dev-tools/LiteInspector.vue";

// 导入主题皮肤样式（节日主题仅保留已实现的圣诞皮肤）
import "./themes/8bit.scss";
import "./themes/future-tech.scss";
import "./components/lay-sidebar/styles/hover-navigation-themes.scss";
// 导入移动端独立样式
import "./styles/mobile.scss";
// 字体加密样式统一从 assets/layout/default 注入，这里不再单独引入

window.onload = () => {
  registerRequestIdleCallback(() => {
    createFingerprint((finger) => {
      localStorageProxy().setItem("visitId", finger);
    });
  });
};

// 使用带 loading/error 状态的异步组件加载器
const CardNavigation = createLayoutAsyncComponent(
  () => import("./components/lay-sidebar/components/CardNavigation.vue"),
);
const LayContent = createLayoutAsyncComponent(
  () => import("./components/lay-content/index.vue"),
);
const NavVertical = markRaw(NavVerticalLayout);
const NavHorizontal = markRaw(NavHorizontalLayout);
const NavHover = markRaw(NavHoverLayout);
const NavDouble = markRaw(NavDoubleLayout);
const NavMobile = markRaw(NavMobileLayout);

const { t } = useI18n();
const appWrapperRef = ref<HTMLElement>();
const watermarkContainerRef = ref<HTMLElement>();
const debugConsoleRef = ref<InstanceType<typeof ScDebugConsole> | null>(null);
// ===== Composables =====
// 加载页逻辑
const {
  isConfigLoaded,
  isFirstLoad,
  loadConfig,
} = useLoadingPage();

// 水印功能
const { initWatermark } = useWatermarkSetup(watermarkContainerRef);

// 调试模式
const { debugMode, setDebugConsoleRef, handleDebugConsoleClose } = useDebugMode();
setDebugConsoleRef(debugConsoleRef);

const pureSetting = useSettingStoreHook();
const appStore = useAppStoreHook();
const { $storage } = useGlobal<GlobalPropertiesApi>();

// 性能监控开关（从主题 Store 统一读取）
const themeStore = useThemeStoreHook();
const { fpsMonitorEnabled } = storeToRefs(themeStore);

// AI 助手相关配置
const aiChatTheme = ref(getConfig().AiChatTheme || "default");
const aiChatVisible = computed(() => {
  const storageEnabled = $storage?.configure?.aiChatEnabled;
  if (typeof storageEnabled === "boolean") {
    return storageEnabled;
  }
  return getConfig().ShowAiChat !== false;
});
const aiChatPosition = computed(
  () => $storage?.configure?.aiChatPosition || "bottom-right",
);
const aiChatHeaders = computed(() => {
  const apiKey = $storage?.configure?.aiChatApiKey;
  if (!apiKey) {
    return {};
  }
  return {
    Authorization: `Bearer ${apiKey}`,
  };
});

const { initStorage } = useLayout();
const { applyOverallStyle } = useTheme();

initStorage();

// 将layout改为字符串形式
const layout = computed(() => {
  return $storage?.layout?.layout || "vertical";
});

// 响应式布局
const { isMobile, initResponsiveObserver, initMobile } = useResponsiveLayout(
  appWrapperRef,
  { get isClickCollapse() { return set.sidebar.isClickCollapse; } },
);

// 监听 AI 助手皮肤变更
emitter.on("aiChatThemeChange", (theme: string) => {
  aiChatTheme.value = theme;
});

// 提取 store 引用到顶层避免重复调用
const set: setType = reactive({
  sidebar: computed(() => appStore.sidebar),
  device: computed(() => appStore.device),
  fixedHeader: computed(() => pureSetting.fixedHeader),
  classes: computed(() => ({
    hideSidebar: !set.sidebar.opened,
    openSidebar: set.sidebar.opened,
    withoutAnimation: set.sidebar.withoutAnimation,
    mobile: set.device === "mobile",
  })),
  hideTabs: computed(() => $storage?.configure.hideTabs),
});

// 页面基础字体大小（用于缩放计算）
const DEFAULT_FONT_SIZE = 14;

function applyUiScale(scale?: number | null): void {
  const raw = typeof scale === "number" && !Number.isNaN(scale) ? scale : 1;
  const clamped = Math.min(1.5, Math.max(0.8, raw));
  document.documentElement.style.fontSize = `${DEFAULT_FONT_SIZE * clamped}px`;
}

function applyScreenReaderMode(enabled: boolean): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) {
    return;
  }
  if (enabled) {
    htmlEl.classList.add("a11y-screen-reader");
  } else {
    htmlEl.classList.remove("a11y-screen-reader");
  }
}

function applyHighContrastMode(enabled: boolean): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) {
    return;
  }
  if (enabled) {
    htmlEl.classList.add("html-high-contrast");
  } else {
    htmlEl.classList.remove("html-high-contrast");
  }
}

watch(
  () => $storage?.configure?.uiScale as number | undefined,
  (scale) => {
    applyUiScale(scale ?? 1);
  },
  { immediate: true },
);

watch(
  () => $storage?.configure?.screenReaderMode as boolean | undefined,
  (val) => {
    applyScreenReaderMode(!!val);
  },
  { immediate: true },
);

watch(
  () => $storage?.configure?.highContrastMode as boolean | undefined,
  (val) => {
    applyHighContrastMode(!!val);
  },
  { immediate: true },
);

// 监听 sidebar 状态变化，同步到 body 上（用于 drawer 等组件的定位）
watch(
  () => set.sidebar.opened,
  (opened) => {
    if (opened) {
      document.body.classList.remove("sidebar-collapsed");
      document.body.classList.add("sidebar-expanded");
    } else {
      document.body.classList.remove("sidebar-expanded");
      document.body.classList.add("sidebar-collapsed");
    }
  },
  { immediate: true },
);

// 页面可见性变化处理
let originalTitle = "";
const handleVisibilityChange = () => {
  if (document.hidden) {
    originalTitle = document.title;
    document.title = "👀 快回来呀~";
  } else {
    document.title = "🎉 欢迎回来！";
    setTimeout(() => {
      if (!document.hidden && originalTitle) {
        document.title = originalTitle;
      }
    }, 2000);
  }
};

onMounted(async () => {
  // 初始化移动端
  initMobile();

  // 初始化响应式监听
  initResponsiveObserver();

  // 监听页面可见性变化
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // 页面加载完成后检查配置并应用
  nextTick(() => {
    // 确保 body 的 layout 属性正确设置
    if ($storage?.layout?.layout) {
      document.body.setAttribute("layout", $storage.layout.layout);
    }
    // 应用整体风格（统一通过 useTheme 出口）
    applyOverallStyle($storage?.layout?.overallStyle);
    // 加载配置，完成后初始化水印
    loadConfig(() => nextTick(initWatermark));
  });
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

/**
 * 根据参数名清理 URL，可接受多个
 */
function getNewUrl(reg: RegExp): string {
  let url = document.location.href;
  url = url.replace(reg, "");
  reg = /&&/g;
  url = url.replace(reg, "");
  reg = /&#/g;
  url = url.replace(reg, "#");
  reg = /\?#/g;
  url = url.replace(reg, "#");
  reg = /\?#/g;
  url = url.replace(reg, "#");
  return url;
}

// 应用初始主题 - 只在应用首次加载时执行
// 在 setup 顶层执行，但不使用异步导入
if (!(window as any).__THEME_INITIALIZED__) {
  try {
    const systemTheme = $storage?.configure?.systemTheme || "default" as ThemeKey;
    const normalizedTheme = systemTheme === "8bit" as ThemeKey ? "8bit" : systemTheme;
    document.documentElement.setAttribute("data-skin", normalizedTheme);
    (window as any).__THEME_INITIALIZED__ = true;
  } catch (error) {
    // 忽略主题初始化错误
  }
}

onBeforeMount(() => {
  // 处理 URL 参数
  let url = getNewUrl(/[\w](redirectParam)=?([^&|^#]*)/g);
  if (url !== document.location.href) {
    window.history.replaceState(null, "", url);
  }

  // 初始化路由
  if (!getConfig().OpenAuth) {
    initRouter();
  }

  // 确保在组件挂载前设置 body 的 layout 属性
  if ($storage?.layout?.layout) {
    document.body.setAttribute("layout", $storage.layout.layout);
  }

  // 应用颜色主题（light/dark），统一通过 useTheme 出口
  applyOverallStyle($storage.layout?.overallStyle);
});

const LayHeader = defineComponent({
  name: "LayHeader",
  render() {
    return h(
      "div",
      {
        class: { "fixed-header shadow-tab": set.fixedHeader },
      },
      {
        default: () => [
          !pureSetting.hiddenSideBar &&
          (layout.value === "vertical" ||
            layout.value === "mix" ||
            layout.value === "hover" ||
            layout.value === "double" ||
            layout.value === "mobile")
            ? h(LayNavbar)
            : null,
          !pureSetting.hiddenSideBar && layout.value === "horizontal"
            ? h(NavHorizontal)
            : null,
          // 移动导航模式下不显示标签页
          layout.value !== "mobile" ? h(markRaw(LayTag)) : null,
        ],
      },
    );
  },
});
</script>

<style lang="scss" scoped>
@use "./styles/layout.scss" as *;
</style>

<template>
  <ThemeSkinProvider>
    <!-- 全屏加载遮罩 -->
    <CoolLoading
      v-if="!isConfigLoaded"
      :loading-text="isFirstLoad ? '系统初始化中...' : '加载中...'"
      :show-progress="true"
    />

    <!-- 页面内容 -->
    <div v-else ref="appWrapperRef" :class="['app-wrapper', set.classes]">
      <!-- 防删除水印容器 -->
      <div ref="watermarkContainerRef" class="watermark-container"></div>
      <!-- 移动导航模式：底部导航栏设计 -->
      <template v-if="layout === 'mobile'">
        <NavMobile>
          <div class="mobile-main-container">
            <LayHeader />
            <LayContent :fixed-header="true" />
          </div>
        </NavMobile>
      </template>

      <!-- 双栏导航模式：特殊布局 -->
      <template v-else-if="layout === 'double'">
        <div
          v-show="set.device === 'mobile' && set.sidebar.opened"
          class="app-mask"
          @click="useAppStoreHook().toggleSideBar()"
        />
        <div class="double-layout-container">
          <NavDouble v-show="!pureSetting.hiddenSideBar" />
          <div
            :class="[
              'main-container',
              'double-main',
              pureSetting.hiddenSideBar ? 'main-hidden' : '',
            ]"
          >
            <div v-if="set.fixedHeader" style="display: flex; flex-direction: column; flex: 1">
              <LayHeader />
              <!-- 主体内容 -->
              <div style="flex: 1">
                <LayContent :fixed-header="set.fixedHeader" />
              </div>
            </div>
            <el-scrollbar v-else style="flex: 1">
              <el-backtop
                :title="t('buttons.pureBackTop')"
                target=".main-container .el-scrollbar__wrap"
              >
                <BackTopIcon />
              </el-backtop>
              <LayHeader />
              <!-- 主体内容 -->
              <div style="flex: 1">
                <LayContent :fixed-header="set.fixedHeader" />
              </div>
            </el-scrollbar>
          </div>
        </div>
      </template>

      <!-- 其他导航模式：原有逻辑 -->
      <template v-else>
        <div
          v-show="set.device === 'mobile' && set.sidebar.opened"
          class="app-mask"
          @click="useAppStoreHook().toggleSideBar()"
        />
        <NavVertical
          v-show="
            !pureSetting.hiddenSideBar &&
            (layout === 'vertical' || layout === 'mix')
          "
        />
        <NavHover v-show="!pureSetting.hiddenSideBar && layout === 'hover'" />
        <div
          :class="[
            'main-container',
            pureSetting.hiddenSideBar ? 'main-hidden' : '',
          ]"
        >
          <div v-if="set.fixedHeader" style="display: flex; flex-direction: column; flex: 1">
            <LayHeader />
            <!-- 主体内容 -->
            <div style="flex: 1">
              <LayContent :fixed-header="set.fixedHeader" />
            </div>
          </div>
          <el-scrollbar v-else style="flex: 1">
            <el-backtop
              :title="t('buttons.pureBackTop')"
              target=".main-container .el-scrollbar__wrap"
            >
              <BackTopIcon />
            </el-backtop>
            <LayHeader />
            <!-- 主体内容 -->
            <div style="flex: 1">
              <LayContent :fixed-header="set.fixedHeader" />
            </div>
          </el-scrollbar>
        </div>
      </template>

      <!-- 系统设置 -->
      <LaySetting v-if="pureSetting.ShowBarSetting" />

      <!-- AI 助手 -->
      <LayAiChat
        :visible="aiChatVisible"
        :theme="aiChatTheme"
        :position="aiChatPosition"
        :headers="aiChatHeaders"
      />

      <!-- 调试控制台 - 独立于设置面板 -->
      <ScDebugConsole
        v-if="debugMode"
        ref="debugConsoleRef"
        @close="handleDebugConsoleClose"
      />

      <!-- 全局性能监控面板 -->
      <FpsMonitor :visible="fpsMonitorEnabled" />

      <!-- DevTools 轻量调试工具（仅开发环境生效，由配置控制） -->
      <LiteInspector />
    </div>
  </ThemeSkinProvider>
</template>

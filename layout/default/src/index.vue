<script setup lang="ts">
import "animate.css";
// 引入 src/components/ReIcon/src/offlineIcon.ts 文件中所有使用addIcon添加过的本地图标
import "@repo/components/ReIcon/offlineIcon";
import {
  emitter,
  initRouter,
  useAppStoreHook,
  useSettingStoreHook,
  useUserStoreHook,
} from "@repo/core";
import { useI18n } from "vue-i18n";
import { useTheme } from "./hooks/useThemeComponent";
import { useLayout } from "./hooks/useLayout";
import { useLoadingPage } from "./hooks/useLoadingPage";
import { useResponsiveLayout } from "./hooks/useResponsiveLayout";
import { useWatermarkSetup } from "./hooks/useWatermarkSetup";
import { useDebugMode } from "./hooks/useDebugMode";
import { setType } from "./types";
import ScBacktop from "@repo/components/ScBacktop";
import { ScDebugConsole } from "@repo/components/ScDebugConsole";
import ScScrollbar from "@repo/components/ScScrollbar";
import { CoolLoading } from "@pages/common";

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
  provide,
  reactive,
  ref,
  watch,
} from "vue";
import { createLayoutAsyncComponent } from "./utils/asyncComponentLoader";
import BackTopIcon from "@repo/assets/svg/back_top.svg?component";
import { getConfig } from "@repo/config";
import { createFingerprint, registerRequestIdleCallback } from "@repo/core";
import { aesDecrypt } from "@repo/utils";
import {
  initSession,
  localStorageProxy,
  message,
  stopSession,
} from "@repo/utils";
import LayNavbar from "./components/lay-navbar/index.vue";
import LaySetting from "./components/lay-setting/index.vue";
import LayAiChat from "./components/lay-ai-chat/index.vue";
import LayContent from "./components/lay-content/index.vue";
import NavDoubleLayout from "./components/lay-sidebar/NavDouble.vue";
import NavHorizontalLayout from "./components/lay-sidebar/NavHorizontal.vue";
import NavHoverLayout from "./components/lay-sidebar/NavHover.vue";
import NavDrawerLayout from "./components/lay-sidebar/NavDrawer.vue";
import NavVerticalLayout from "./components/lay-sidebar/NavVertical.vue";
import LayTag from "./components/lay-tag/index.vue";
import ThemeSkinProvider from "./themes/ThemeSkinProvider.vue";
import FpsMonitor from "./components/lay-performance/FpsMonitor.vue";
import { useThemeStoreHook } from "./stores/themeStore";
import LiteInspector from "./components/lay-dev-tools/LiteInspector.vue";
import HeatmapOverlay from "./components/lay-dev-tools/HeatmapOverlay.vue";
import FestivalLayer from "./components/lay-festival/index.vue";

// 导入设计 token（全局 CSS 变量 --dt-xxxx，必须在 script 中引入才能全局生效）
import "./styles/design-tokens.scss";
// 导入设计 token 覆盖（Element Plus 圆角/间距/阴影统一）
import "./styles/base-override.scss";
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
const NavVertical = markRaw(NavVerticalLayout);
const NavHorizontal = markRaw(NavHorizontalLayout);
const NavHover = markRaw(NavHoverLayout);
const NavDrawer = markRaw(NavDrawerLayout);
const NavDouble = markRaw(NavDoubleLayout);

const { t } = useI18n();
const appWrapperRef = ref<HTMLElement>();
const watermarkContainerRef = ref<HTMLElement>();
const debugConsoleRef = ref<InstanceType<typeof ScDebugConsole> | null>(null);
// ===== Composables =====
// 加载页逻辑
const { isConfigLoaded, isFirstLoad, loadConfig } = useLoadingPage();

// 水印功能
const { initWatermark } = useWatermarkSetup(watermarkContainerRef);

// 调试模式
const { debugMode, setDebugConsoleRef, handleDebugConsoleClose } =
  useDebugMode();
setDebugConsoleRef(debugConsoleRef);

const pureSetting = useSettingStoreHook();
const appStore = useAppStoreHook();
const userStore = useUserStoreHook();
const { $storage } = useGlobal<GlobalPropertiesApi>();

// 性能监控开关（从主题 Store 统一读取）
const themeStore = useThemeStoreHook();
const { fpsMonitorEnabled } = storeToRefs(themeStore);

// AI 助手相关配置
const aiChatThemeOverride = ref($storage?.configure?.aiChatTheme || "");
const aiChatTheme = computed(
  () => aiChatThemeOverride.value || getConfig().AiChatTheme || "default",
);
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
  const raw = $storage?.configure?.aiChatApiKey;
  if (!raw) return {};
  const apiKey = aesDecrypt(raw, getConfig().StorageKey);
  return { Authorization: `Bearer ${apiKey}` };
});

// 向子组件注入 AI 配置（HeatmapOverlay 等通过 inject 获取）
provide("heatmapAiConfig", computed(() => ({
  mode: $storage?.configure?.aiChatMode,
  vendor: $storage?.configure?.aiChatVendor,
  apiKey: aesDecrypt($storage?.configure?.aiChatApiKey ?? "", getConfig().StorageKey),
  apiUrl: aesDecrypt($storage?.configure?.aiChatApiUrl ?? "", getConfig().StorageKey),
  model: $storage?.configure?.aiChatModel,
})));

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
  {
    get isClickCollapse() {
      return set.sidebar.isClickCollapse;
    },
  },
);

// 监听 AI 助手主题/皮肤变更
const handleAiChatThemeChange = (theme: string) => {
  aiChatThemeOverride.value = theme || "";
};

emitter.on("aiChatThemeChange", handleAiChatThemeChange);

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

/**
 * 应用会话超时自动登出配置
 * 说明：优先读取本地 `responsive-configure` 的覆盖值，其次读取静态配置文件 `Session`
 */
function applySessionAutoLogout(): void {
  const sessionConfig = getConfig().Session || {};
  const enable = sessionConfig.enable !== false;
  const localConfigure = $storage?.configure || {};
  const localAutoLogout = localConfigure.autoLogout;
  const localTimeout = localConfigure.sessionTimeout;

  const autoLogout =
    typeof localAutoLogout === "boolean"
      ? localAutoLogout
      : (sessionConfig.autoLogout ?? false);
  const timeoutSeconds =
    typeof localTimeout === "number"
      ? localTimeout
      : (sessionConfig.timeout ?? 0);

  // 每次应用前先停止，保证不会重复绑定事件/定时器
  stopSession();
  if (!enable || !autoLogout || !timeoutSeconds || timeoutSeconds <= 0) {
    return;
  }

  initSession(
    () => {
      message("[会话][超时] 会话已超时，已自动退出登录", {
        type: "warning",
        duration: 3000,
      });
      userStore.logOut();
    },
    (remainingTime: number) => {
      message(`[会话][超时] ${remainingTime} 秒后将自动退出登录`, {
        type: "warning",
        duration: 2000,
      });
    },
  );
}

watch(
  () =>
    [
      $storage?.configure?.autoLogout as boolean | undefined,
      $storage?.configure?.sessionTimeout as number | undefined,
    ] as const,
  () => {
    applySessionAutoLogout();
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
  emitter.off("aiChatThemeChange", handleAiChatThemeChange);
  stopSession();
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
    const systemTheme =
      $storage?.configure?.systemTheme || ("default" as ThemeKey);

    // 直接使用保存的主题，如果没有则使用 default
    const normalizedTheme = systemTheme;

    // 设置 data-skin 属性
    document.documentElement.setAttribute("data-skin", normalizedTheme);

    (window as any).__THEME_INITIALIZED__ = true;
  } catch (error) {
    console.error("[App] Theme initialization error:", error);
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
            layout.value === "drawer" ||
            layout.value === "double")
            ? h(LayNavbar)
            : null,
          !pureSetting.hiddenSideBar && layout.value === "horizontal"
            ? h(NavHorizontal)
            : null,
          h(markRaw(LayTag)),
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
      <!-- 双栏导航模式：特殊布局 -->
      <template v-if="layout === 'double'">
        <div
          v-if="set.device === 'mobile' && set.sidebar.opened"
          class="app-mask"
          @click="useAppStoreHook().toggleSideBar()"
        />
        <div class="double-layout-container">
          <NavDouble v-if="!pureSetting.hiddenSideBar" />
          <div
            :class="[
              'main-container',
              'double-main',
              pureSetting.hiddenSideBar ? 'main-hidden' : '',
            ]"
          >
            <div
              v-if="set.fixedHeader"
              style="display: flex; flex-direction: column; flex: 1"
            >
              <LayHeader />
              <!-- 主体内容 -->
              <div style="flex: 1">
                <LayContent :fixed-header="set.fixedHeader" />
              </div>
            </div>
            <ScScrollbar v-else style="flex: 1">
              <ScBacktop
                :title="t('buttons.pureBackTop')"
                target=".main-container .el-scrollbar__wrap"
              >
                <BackTopIcon />
              </ScBacktop>
              <LayHeader />
              <!-- 主体内容 -->
              <div style="flex: 1">
                <LayContent :fixed-header="set.fixedHeader" />
              </div>
            </ScScrollbar>
          </div>
        </div>
      </template>

      <!-- 其他导航模式：原有逻辑 -->
      <template v-else>
        <div
          v-if="set.device === 'mobile' && set.sidebar.opened"
          class="app-mask"
          @click="useAppStoreHook().toggleSideBar()"
        />
        <NavVertical
          v-if="
            !pureSetting.hiddenSideBar &&
            (layout === 'vertical' || layout === 'mix')
          "
        />
        <NavHover v-if="!pureSetting.hiddenSideBar && layout === 'hover'" />
        <NavDrawer v-if="!pureSetting.hiddenSideBar && layout === 'drawer'" />
        <!-- 卡片导航模式 -->
        <CardNavigation v-if="!pureSetting.hiddenSideBar && layout === 'card'" />
        <div
          :class="[
            'main-container',
            pureSetting.hiddenSideBar ? 'main-hidden' : '',
          ]"
        >
          <div
            v-if="set.fixedHeader"
            style="display: flex; flex-direction: column; flex: 1"
          >
            <LayHeader />
            <!-- 主体内容 -->
            <div style="flex: 1">
              <LayContent :fixed-header="set.fixedHeader" />
            </div>
          </div>
          <ScScrollbar v-else style="flex: 1">
            <ScBacktop
              :title="t('buttons.pureBackTop')"
              target=".main-container .el-scrollbar__wrap"
            >
              <BackTopIcon />
            </ScBacktop>
            <LayHeader />
            <!-- 主体内容 -->
            <div style="flex: 1">
              <LayContent :fixed-header="set.fixedHeader" />
            </div>
          </ScScrollbar>
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
      <!-- 热点工具热力图覆盖层（仅开发/测试环境生效，由配置控制） -->
      <HeatmapOverlay />
    </div>

    <!-- 节日特效层（根据主题动态渲染） -->
    <FestivalLayer :theme="$storage?.configure?.systemTheme || 'default'" />
  </ThemeSkinProvider>
</template>

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
import { useDataThemeChange } from "./hooks/useDataThemeChange";
import { useLayout } from "./hooks/useLayout";
import { useLoadingPage } from "./hooks/useLoadingPage";
import { useResponsiveLayout } from "./hooks/useResponsiveLayout";
import { useWatermarkSetup } from "./hooks/useWatermarkSetup";
import { useDebugMode } from "./hooks/useDebugMode";
import { useFontEncryption } from "./utils/useFontEncryption";
import { setType } from "./types";
import ScDebugConsole from "@repo/components/ScDebugConsole/index.vue";
import { CoolLoading } from "@repo/pages";

import {
  useDark,
  useGlobal,
} from "@pureadmin/utils";
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
import { getConfig } from "@repo/config";
import { createFingerprint, registerRequestIdleCallback } from "@repo/core";
import { localStorageProxy } from "@repo/utils";
import LayHeader from "./components/lay-header/index.vue";
import ThemeSkinProvider from "./themes/ThemeSkinProvider.vue";

// 导入主题皮肤样式
import "./themes/christmas.scss";
import "./themes/spring-festival.scss";
import "./themes/halloween.scss";
import "./themes/pixel-art.scss";
import "./themes/future-tech.scss";
import "./components/lay-sidebar/styles/hover-navigation-themes.scss";
// 导入移动端独立样式
import "./styles/mobile.scss";
// 导入字体加密样式
import "./styles/font-encryption.css";

window.onload = () => {
  registerRequestIdleCallback(() => {
    createFingerprint((finger) => {
      localStorageProxy().setItem("visitId", finger);
    });
  });
};

// 使用带 loading/error 状态的异步组件加载器
const CardNavigation = createLayoutAsyncComponent(
  () => import("./components/lay-sidebar/components/CardNavigation.vue")
);
const LayContent = createLayoutAsyncComponent(
  () => import("./components/lay-content/index.vue")
);
const NavVertical = markRaw(
  createLayoutAsyncComponent(
    () => import("./components/lay-sidebar/NavVertical.vue")
  )
);
const NavHorizontal = markRaw(
  createLayoutAsyncComponent(
    () => import("./components/lay-sidebar/NavHorizontal.vue")
  )
);
const NavHover = markRaw(
  createLayoutAsyncComponent(
    () => import("./components/lay-sidebar/NavHover.vue")
  )
);
const NavDouble = markRaw(
  createLayoutAsyncComponent(
    () => import("./components/lay-sidebar/NavDouble.vue")
  )
);
const NavMobile = markRaw(
  createLayoutAsyncComponent(
    () => import("./components/lay-sidebar/NavMobile.vue")
  )
);
const LaySetting = createLayoutAsyncComponent(
  () => import("./components/lay-setting/index.vue")
);
const LayAiChat = createLayoutAsyncComponent(
  () => import("./components/lay-ai-chat/index.vue")
);

const { t } = useI18n();
const appWrapperRef = ref<HTMLElement>();
const watermarkContainerRef = ref<HTMLElement>();
const debugConsoleRef = ref<InstanceType<typeof ScDebugConsole> | null>(null);
const { isDark } = useDark();
const isDev = import.meta.env.DEV;

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

// 字体加密
const fontEncryptionConfig = computed(() => ({
  enabled: $storage?.configure?.fontEncryptionEnabled ?? true,
  encryptNumbers: $storage?.configure?.fontEncryptionNumbers ?? false,
  encryptChinese: $storage?.configure?.fontEncryptionChinese ?? false,
  applyGlobal: $storage?.configure?.fontEncryptionGlobal ?? false,
  ocrNoise: $storage?.configure?.fontEncryptionOcrNoise ?? false,
}));
useFontEncryption(() => fontEncryptionConfig.value);

// AI 助手皮肤主题
const aiChatTheme = ref(getConfig().AiChatTheme || "default");

const { initStorage, layout } = useLayout();
const { dataThemeChange } = useDataThemeChange();

initStorage();

// 响应式布局
const { isMobile, initResponsiveObserver, initMobile } = useResponsiveLayout(
  appWrapperRef,
  { get isClickCollapse() { return set.sidebar.isClickCollapse; } }
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

// 监听 sidebar 状态变化，同步到 body 上（用于 drawer 等组件的定位）
watch(
  () => set.sidebar.opened,
  (opened) => {
    if (opened) {
      document.body.classList.remove('sidebar-collapsed');
      document.body.classList.add('sidebar-expanded');
    } else {
      document.body.classList.remove('sidebar-expanded');
      document.body.classList.add('sidebar-collapsed');
    }
  },
  { immediate: true }
);

// 监听布局模式变化，清理导航相关的 CSS 变量
watch(
  () => layout.value,
  (newLayout, oldLayout) => {
    // 从双栏导航或其他导航切换时，清理可能残留的 CSS 变量
    if (oldLayout === 'double' || oldLayout === 'hover') {
      document.documentElement.style.removeProperty("--hover-sidebar-width");
    }
  }
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
    // 确保 body 的 layout 属性正确设置（非法值统一回退到 vertical）
    document.body.setAttribute("layout", layout.value);
    // 应用整体风格
    dataThemeChange($storage?.layout?.overallStyle);
    // 加载配置，完成后初始化水印
    loadConfig(() => nextTick(initWatermark));
  });
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

/**
 * //根据参数名去清除，可以多个
 */
function getNewUrl(reg) {
  let url = document.location.href;
  //let reg = /[^\w](url参数名|url参数名)=?([^&|^#]*)/g;
  url = url.replace(reg, "");
  reg = /&&/g;
  url = url.replace(reg, "");
  reg = /&#/g;
  url = url.replace(reg, "#");
  reg = /\?#/g;
  url = url.replace(reg, "#");
  // url = url.replaceAll(document.domain,"");
  // url = url.replaceAll("http://","");
  // url = url.replaceAll("https://","");
  reg = /\?#/g;
  url = url.replace(reg, "#");
  return url;
}

// 应用初始主题 - 只在应用首次加载时执行
// 在 setup 顶层执行，但不使用异步导入
if (!window.__THEME_INITIALIZED__) {
  try {
    // 直接操作 DOM，不依赖模块导入
    const systemTheme = $storage?.configure?.systemTheme || 'default';
    document.documentElement.setAttribute('data-skin', systemTheme);
    window.__THEME_INITIALIZED__ = true;
  } catch (error) {
    // theme init error ignored
  }
}

onBeforeMount(() => {
  // 处理URL参数
  let url = getNewUrl(/[^\w](redirectParam)=?([^&|^#]*)/g);
  if (url != document.location.href) {
    window.history.replaceState(null, null, url);
  }

  // 初始化路由
  if (!getConfig().OpenAuth) {
    initRouter();
  }

  // 确保在组件挂载前设置body的layout属性（非法值统一回退到 vertical）
  document.body.setAttribute("layout", layout.value);
  
  // 应用颜色主题（light/dark）
  dataThemeChange($storage.layout?.overallStyle);
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
            />
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
          />
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
      :visible="getConfig().ShowAiChat !== false || isDev" 
      :theme="aiChatTheme"
    />

    <!-- 调试控制台 - 独立于设置面板 -->
    <ScDebugConsole
      v-if="debugMode"
      ref="debugConsoleRef"
      @close="handleDebugConsoleClose"
    />
  </div>
  </ThemeSkinProvider>
</template>

<script setup lang="ts">
import "animate.css";
// 引入 src/components/ReIcon/src/offlineIcon.ts 文件中所有使用addIcon添加过的本地图标
import "@repo/components/ReIcon/src/offlineIcon";
import {
  emitter,
  initRouter,
  useAppStoreHook,
  useConfigStore,
  useSettingStoreHook,
} from "@repo/core";
import { useI18n } from "vue-i18n";
import { useDataThemeChange } from "./hooks/useDataThemeChange";
import { useLayout } from "./hooks/useLayout";
import { setType } from "./types";
import ScDebugConsole from "@repo/components/ScDebugConsole/index.vue";

import {
  deviceDetection,
  useDark,
  useGlobal,
  useResizeObserver,
  useWatermark,
} from "@pureadmin/utils";
import {
  computed,
  defineAsyncComponent,
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

// 导入主题皮肤样式
import "./themes/christmas.scss";
import "./themes/spring-festival.scss";
window.onload = () => {
  registerRequestIdleCallback(() => {
    createFingerprint((finger) => {
      localStorageProxy().setItem("visitId", finger);
    });
  });
};
const CardNavigation = defineAsyncComponent(
  () => import("./components/lay-sidebar/components/CardNavigation.vue")
);
const LayContent = defineAsyncComponent(
  () => import("./components/lay-content/index.vue")
);
const NavVertical = markRaw(NavVerticalLayout);
const NavHorizontal = markRaw(NavHorizontalLayout);
const NavHover = markRaw(NavHoverLayout);
const NavDouble = markRaw(NavDoubleLayout);
const NavMobile = markRaw(NavMobileLayout);
const { t } = useI18n();
const appWrapperRef = ref<HTMLElement>();
const watermarkContainerRef = ref<HTMLElement>();
const { isDark } = useDark();

// 防删除水印
const { setWatermark: setForeverWatermark, clear: clearForeverWatermark } = useWatermark(watermarkContainerRef);

// 添加加载状态管理（默认为 true，不显示加载遮罩）
const isConfigLoaded = ref(true);

// 是否首次加载（用于显示不同的加载文字）
const isFirstLoad = ref(!sessionStorage.getItem("_app_loaded"));

// 加载页面风格（从配置读取，默认简约风格）
const loadingStyle = computed(() => getConfig().LoadingPageStyle || "minimal");

// 时钟相关状态
const currentTime = ref(new Date());
const clockTimer = ref<number | null>(null);

// 时钟指针角度计算
const secondRotation = computed(() => {
  return currentTime.value.getSeconds() * 6; // 每秒6度
});
const minuteRotation = computed(() => {
  const minutes = currentTime.value.getMinutes();
  const seconds = currentTime.value.getSeconds();
  return minutes * 6 + seconds * 0.1; // 每分钟6度，秒针带动分针微动
});
const hourRotation = computed(() => {
  const hours = currentTime.value.getHours() % 12;
  const minutes = currentTime.value.getMinutes();
  return hours * 30 + minutes * 0.5; // 每小时30度，分针带动时针微动
});

// 启动时钟
const startClock = () => {
  clockTimer.value = window.setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
};

// 停止时钟
const stopClock = () => {
  if (clockTimer.value) {
    clearInterval(clockTimer.value);
    clockTimer.value = null;
  }
};

// AI 助手皮肤主题（初始化后在 onMounted 中设置正确的值）
const aiChatTheme = ref(getConfig().AiChatTheme || "default");

// 调试模式状态
const debugMode = ref(false);
const debugConsoleRef = ref<InstanceType<typeof ScDebugConsole> | null>(null);

const { initStorage } = useLayout();
const { dataThemeChange } = useDataThemeChange();

initStorage();

// 将layout改为字符串形式
const layout = computed(() => {
  return $storage?.layout?.layout || "vertical";
});

const isMobile = deviceDetection();
const pureSetting = useSettingStoreHook();
const { $storage } = useGlobal<any>();

// 从本地存储初始化调试模式状态
debugMode.value = $storage?.configure?.debugMode ?? false;

// 监听 AI 助手皮肤变更
emitter.on("aiChatThemeChange", (theme: string) => {
  aiChatTheme.value = theme;
});

// 监听调试模式变更
emitter.on("debugModeChange", (enabled: boolean) => {
  debugMode.value = enabled;
  if (enabled) {
    nextTick(() => {
      debugConsoleRef.value?.show();
    });
  } else {
    debugConsoleRef.value?.handleClose();
  }
});

// 调试控制台关闭回调
function handleDebugConsoleClose() {
  debugMode.value = false;
  emitter.emit("debugModeChanged", false);
}

const set: setType = reactive({
  sidebar: computed(() => {
    return useAppStoreHook().sidebar;
  }),

  device: computed(() => {
    return useAppStoreHook().device;
  }),

  fixedHeader: computed(() => {
    return pureSetting.fixedHeader;
  }),

  classes: computed(() => {
    return {
      hideSidebar: !set.sidebar.opened,
      openSidebar: set.sidebar.opened,
      withoutAnimation: set.sidebar.withoutAnimation,
      mobile: set.device === "mobile",
    };
  }),

  hideTabs: computed(() => {
    return $storage?.configure.hideTabs;
  }),
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

function setTheme(layoutModel: string) {
  window.document.body.setAttribute("layout", layoutModel);
  $storage.layout = {
    layout: `${layoutModel}`,
    theme: $storage.layout?.theme,
    darkMode: $storage.layout?.darkMode,
    sidebarStatus: $storage.layout?.sidebarStatus,
    epThemeColor: $storage.layout?.epThemeColor,
    themeColor: $storage.layout?.themeColor,
    overallStyle: $storage.layout?.overallStyle,
  };
}

function toggle(device: string, bool: boolean) {
  useAppStoreHook().toggleDevice(device);
  useAppStoreHook().toggleSideBar(bool, "resize");
}

// 判断是否可自动关闭菜单栏
let isAutoCloseSidebar = true;

useResizeObserver(appWrapperRef, (entries) => {
  if (isMobile) return;
  const entry = entries[0];
  const [{ inlineSize: width, blockSize: height }] = entry.borderBoxSize;
  useAppStoreHook().setViewportSize({ width, height });
  width <= 760 ? setTheme("vertical") : setTheme(useAppStoreHook().layout);
  /** width app-wrapper类容器宽度
   * 0 < width <= 760 隐藏侧边栏
   * 760 < width <= 990 折叠侧边栏
   * width > 990 展开侧边栏
   */
  if (width > 0 && width <= 760) {
    toggle("mobile", false);
    isAutoCloseSidebar = true;
  } else if (width > 760 && width <= 990) {
    if (isAutoCloseSidebar) {
      toggle("desktop", false);
      isAutoCloseSidebar = false;
    }
  } else if (width > 990 && !set.sidebar.isClickCollapse) {
    toggle("desktop", true);
    isAutoCloseSidebar = true;
  } else {
    toggle("desktop", false);
    isAutoCloseSidebar = false;
  }
});

/**
 * 获取系统默认配置
 */
const getDefaultSetting = async () => {
  try {
    await useConfigStore().load();
    isConfigLoaded.value = true;
    // 标记已加载过，下次刷新不显示"初始化"
    sessionStorage.setItem("_app_loaded", "1");
    
    // 启用防删除水印
    nextTick(() => {
      initForeverWatermark();
    });
  } catch (error) {
    console.warn("Failed to load config:", error);
    // 根据配置决定是否保持加载页面
    if (!getConfig().BlockOnConfigLoadFail) {
      isConfigLoaded.value = true;
      sessionStorage.setItem("_app_loaded", "1");
    }
  }
};

/** 初始化防删除水印 */
const initForeverWatermark = () => {
  const watermarkConfig = useConfigStore().getWatermarkConfig();
  if (watermarkConfig.enabled && watermarkConfig.text) {
    setForeverWatermark(watermarkConfig.text, {
      forever: true,
      width: 200,
      height: 100,
      rotate: watermarkConfig.rotate,
      globalAlpha: watermarkConfig.globalAlpha,
      color: watermarkConfig.color,
    });
  }
};

// 页面可见性变化处理
let originalTitle = "";
const handleVisibilityChange = () => {
  if (document.hidden) {
    originalTitle = document.title;
    document.title = "👀 快回来呀~";
  } else {
    document.title = "🎉 欢迎回来！";
    // 2秒后恢复原标题
    setTimeout(() => {
      if (!document.hidden && originalTitle) {
        document.title = originalTitle;
      }
    }, 2000);
  }
};

onMounted(async () => {
  // 启动加载页时钟
  startClock();
  
  if (isMobile) {
    toggle("mobile", false);
  }

  // 监听页面可见性变化
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // 页面加载完成后检查配置并应用
  nextTick(() => {
    // 确保body的layout属性正确设置
    if ($storage?.layout?.layout) {
      document.body.setAttribute("layout", $storage.layout.layout);
    }
    // 应用整体风格（使用在 setup 顶层获取的 dataThemeChange）
    dataThemeChange($storage?.layout?.overallStyle);
    // 等待配置加载完成
    getDefaultSetting();
  });
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  stopClock();
  clearForeverWatermark();
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
    console.log('🎨 首次初始化主题:', systemTheme);
    document.documentElement.setAttribute('data-skin', systemTheme);
    window.__THEME_INITIALIZED__ = true;
  } catch (error) {
    console.error('主题初始化失败:', error);
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

  // 确保在组件挂载前设置body的layout属性
  if ($storage?.layout?.layout) {
    document.body.setAttribute("layout", $storage.layout.layout);
  }
  
  // 应用颜色主题（light/dark）
  dataThemeChange($storage.layout?.overallStyle);
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
      }
    );
  },
});
</script>

<style lang="scss" scoped>
@import "./styles/layout.scss";
</style>

<template>
  <ThemeSkinProvider>
    <!-- 全屏加载遮罩 -->
    <div v-if="!isConfigLoaded" class="fullscreen-loading" :class="'loading-' + loadingStyle">
   
    
    <!-- 加载信息 -->
    <div class="loading-info">
      <!-- 动态时钟 Logo -->
      <div class="loading-brand">
        <div class="brand-clock">
          <svg viewBox="0 0 100 100" class="clock-svg">
            <!-- 外圈 -->
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2" opacity="0.2"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
            <!-- 刻度 -->
            <g class="clock-marks">
              <line v-for="i in 12" :key="i" 
                x1="50" y1="10" x2="50" :y2="i % 3 === 0 ? 16 : 14"
                :transform="`rotate(${i * 30} 50 50)`"
                stroke="currentColor" 
                :stroke-width="i % 3 === 0 ? 2 : 1"
                :opacity="i % 3 === 0 ? 0.6 : 0.3"
              />
            </g>
            <!-- 时针 -->
            <line class="clock-hand hour-hand"
              x1="50" y1="50" x2="50" y2="28"
              stroke="currentColor" stroke-width="3" stroke-linecap="round"
              :transform="`rotate(${hourRotation} 50 50)`"
            />
            <!-- 分针 -->
            <line class="clock-hand minute-hand"
              x1="50" y1="50" x2="50" y2="18"
              stroke="currentColor" stroke-width="2" stroke-linecap="round"
              :transform="`rotate(${minuteRotation} 50 50)`"
            />
            <!-- 秒针 -->
            <line class="clock-hand second-hand"
              x1="50" y1="55" x2="50" y2="14"
              stroke="var(--el-color-primary, #409eff)" stroke-width="1" stroke-linecap="round"
              :transform="`rotate(${secondRotation} 50 50)`"
            />
            <!-- 中心点 -->
            <circle cx="50" cy="50" r="4" fill="currentColor"/>
            <circle cx="50" cy="50" r="2" fill="var(--el-color-primary, #409eff)"/>
          </svg>
        </div>
        <div class="brand-text">{{ isFirstLoad ? '系统初始化' : '加载中' }}</div>
      </div>
      
      <!-- 进度条 -->
      <div class="loading-progress">
        <div class="progress-track">
          <div class="progress-bar"></div>
          <div class="progress-glow"></div>
        </div>
      </div>
      
      <!-- 状态提示 -->
      <div class="loading-status">
        <span class="status-text">{{ isFirstLoad ? '正在初始化核心模块' : '正在加载页面资源' }}</span>
        <span class="status-dots">
          <i></i><i></i><i></i>
        </span>
      </div>
    </div>
  </div>

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
      :visible="getConfig().ShowAiChat !== false" 
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

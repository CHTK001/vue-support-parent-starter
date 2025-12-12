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

import {
  deviceDetection,
  useDark,
  useGlobal,
  useResizeObserver,
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
} from "vue";
//@ts-ignore
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
const appWrapperRef = ref();
const { isDark } = useDark();

// 添加加载状态管理
const isConfigLoaded = ref(false);

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

// 监听 AI 助手皮肤变更
//@ts-ignore
emitter.on("aiChatThemeChange", (theme: string) => {
  aiChatTheme.value = theme;
});

const { initStorage } = useLayout();

initStorage();

// 将layout改为字符串形式
const layout = computed(() => {
  return $storage?.layout?.layout || "vertical";
});

const isMobile = deviceDetection();
const pureSetting = useSettingStoreHook();
const { $storage } = useGlobal<any>();

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
  } catch (error) {
    console.warn("Failed to load config:", error);
    // 根据配置决定是否保持加载页面
    if (!getConfig().BlockOnConfigLoadFail) {
      isConfigLoaded.value = true;
      sessionStorage.setItem("_app_loaded", "1");
    }
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
    // 确保在组件实例存在时才调用useDataThemeChange
    try {
      useDataThemeChange().dataThemeChange($storage?.layout?.overallStyle);
    } catch (error) {
      console.warn("Failed to call useDataThemeChange in onMounted:", error);
    }
    // 等待配置加载完成
    getDefaultSetting();
  });
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  stopClock();
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

onBeforeMount(async () => {
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

  // 应用主题
  useDataThemeChange().dataThemeChange($storage.layout?.overallStyle);
});

const LayHeader = defineComponent({
  name: "LayHeader",
  render() {
    return h(
      "div",
      {
        class: { "fixed-header shadow-tab": set.fixedHeader },
        style: [
          set.hideTabs && layout.value === "horizontal"
            ? isDark.value
              ? "box-shadow: 0 1px 4px #0d0d0d"
              : "box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08)"
            : "",
        ],
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

<template>
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
    <!-- 移动导航模式：底部导航栏设计 -->
    <template v-if="layout === 'mobile'">
      <NavMobile>
        <div class="mobile-main-container">
          <LayHeader />
          <Suspense>
            <template #default>
              <LayContent :fixed-header="true" />
            </template>
          </Suspense>
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
          <div v-if="set.fixedHeader">
            <LayHeader />
            <!-- 主体内容 -->
            <Suspense>
              <template #default>
                <div>
                  <LayContent :fixed-header="set.fixedHeader" />
                </div>
              </template>
            </Suspense>
          </div>
          <el-scrollbar v-else>
            <el-backtop
              :title="t('buttons.pureBackTop')"
              target=".main-container .el-scrollbar__wrap"
            >
              <BackTopIcon />
            </el-backtop>
            <LayHeader />
            <!-- 主体内容 -->
            <Suspense>
              <template #default>
                <div>
                  <LayContent :fixed-header="set.fixedHeader" />
                </div>
              </template>
            </Suspense>
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
        <div v-if="set.fixedHeader">
          <LayHeader />
          <!-- 主体内容 -->
          <Suspense>
            <template #default>
              <div>
                <LayContent :fixed-header="set.fixedHeader" />
              </div>
            </template>
          </Suspense>
        </div>
        <el-scrollbar v-else>
          <el-backtop
            :title="t('buttons.pureBackTop')"
            target=".main-container .el-scrollbar__wrap"
          >
            <BackTopIcon />
          </el-backtop>
          <LayHeader />
          <!-- 主体内容 -->
          <Suspense>
            <template #default>
              <div>
                <LayContent :fixed-header="set.fixedHeader" />
              </div>
            </template>
          </Suspense>
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
  </div>
</template>

<style lang="scss" scoped>
.shadow-tab {
  --un-shadow: var(--tab-box-shadow-v2);
  box-shadow:
    var(--un-ring-offset-shadow), var(--un-ring-shadow), var(--un-shadow);
}

.app-wrapper {
  position: relative;
  width: 100%;
  height: 100%;

  &::after {
    display: table;
    clear: both;
    content: "";
  }

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

:deep(.bg-layout > div > .el-card__body) {
  padding: 0;
}

.bg-bg_color {
  background-color: var(--el-bg-color);
}

.app-mask {
  position: absolute;
  top: 0;
  z-index: 2001;
  width: 100%;
  height: 100%;
  background: #000;
  opacity: 0.3;
}

.re-screen {
  margin-top: 12px;
}

.bg-bg_color {
  background-color: var(--el-bg-color) !important;
}

// 双栏导航布局容器
.double-layout-container {
  display: flex;
  height: 100%;
  width: 100%;

  .double-main {
    flex: 1;
    min-width: 0;
    margin-left: 0 !important;
  }
}

// 异步组件加载状态样式
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background: var(--el-bg-color-overlay);
}

// 全屏加载遮罩样式 - 真正的像素风格
.fullscreen-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;
  image-rendering: pixelated;
  
  :global(.dark) & {
    background: #1a1a2e;
  }
}

.loading-scene {
  position: relative;
  width: 400px;
  height: 180px;
  margin-bottom: 40px;
}

// 像素云朵
.pixel-clouds {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
}

.pixel-cloud {
  --pixel: 4px;
  --color: #c0c0c0;
  position: absolute;
  width: var(--pixel);
  height: var(--pixel);
  background: var(--color);
  // 像素云朵形状 (使用 box-shadow 绘制)
  box-shadow:
    // 第一层
    calc(var(--pixel) * 1) 0 var(--color),
    calc(var(--pixel) * 2) 0 var(--color),
    calc(var(--pixel) * 3) 0 var(--color),
    calc(var(--pixel) * 4) 0 var(--color),
    calc(var(--pixel) * 5) 0 var(--color),
    calc(var(--pixel) * 6) 0 var(--color),
    // 第二层
    calc(var(--pixel) * -1) calc(var(--pixel) * -1) var(--color),
    0 calc(var(--pixel) * -1) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * -1) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * -1) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * -1) var(--color),
    calc(var(--pixel) * 6) calc(var(--pixel) * -1) var(--color),
    calc(var(--pixel) * 7) calc(var(--pixel) * -1) var(--color);

  :global(.dark) & {
    --color: #4a4a6a;
  }
}

.pixel-cloud-1 {
  top: 20px;
  right: 80px;
  animation: cloud-move 12s linear infinite;
}

.pixel-cloud-2 {
  top: 50px;
  right: 200px;
  transform: scale(0.7);
  animation: cloud-move 16s linear infinite;
  animation-delay: -6s;
}

// 像素恐龙容器
.dino-container {
  position: absolute;
  bottom: 24px;
  left: 60px;
  z-index: 10;
}

.pixel-dino {
  position: relative;
  animation: dino-jump 0.8s ease-in-out infinite;
}

// 使用 box-shadow 绘制像素恐龙
.dino-sprite {
  --pixel: 4px;
  --color: #535353;
  position: relative;
  width: var(--pixel);
  height: var(--pixel);
  background: transparent;
  // Chrome 恐龙像素图
  box-shadow:
    // 头部顶端
    calc(var(--pixel) * 5) 0 var(--color),
    calc(var(--pixel) * 6) 0 var(--color),
    calc(var(--pixel) * 7) 0 var(--color),
    calc(var(--pixel) * 8) 0 var(--color),
    calc(var(--pixel) * 9) 0 var(--color),
    calc(var(--pixel) * 10) 0 var(--color),
    // 头部第2行
    calc(var(--pixel) * 4) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 6) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 7) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 8) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 9) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 10) calc(var(--pixel) * 1) var(--color),
    calc(var(--pixel) * 11) calc(var(--pixel) * 1) var(--color),
    // 头部第3行 (眼睛)
    calc(var(--pixel) * 4) calc(var(--pixel) * 2) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * 2) var(--color),
    calc(var(--pixel) * 6) calc(var(--pixel) * 2) var(--color),
    calc(var(--pixel) * 7) calc(var(--pixel) * 2) var(--color),
    calc(var(--pixel) * 8) calc(var(--pixel) * 2) var(--color),
    calc(var(--pixel) * 9) calc(var(--pixel) * 2) #f7f7f7, // 眼睛(白色)
    calc(var(--pixel) * 10) calc(var(--pixel) * 2) var(--color),
    calc(var(--pixel) * 11) calc(var(--pixel) * 2) var(--color),
    // 头部第4行
    calc(var(--pixel) * 4) calc(var(--pixel) * 3) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * 3) var(--color),
    calc(var(--pixel) * 6) calc(var(--pixel) * 3) var(--color),
    calc(var(--pixel) * 7) calc(var(--pixel) * 3) var(--color),
    calc(var(--pixel) * 8) calc(var(--pixel) * 3) var(--color),
    calc(var(--pixel) * 9) calc(var(--pixel) * 3) var(--color),
    calc(var(--pixel) * 10) calc(var(--pixel) * 3) var(--color),
    calc(var(--pixel) * 11) calc(var(--pixel) * 3) var(--color),
    // 头部第5行
    calc(var(--pixel) * 4) calc(var(--pixel) * 4) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * 4) var(--color),
    calc(var(--pixel) * 6) calc(var(--pixel) * 4) var(--color),
    calc(var(--pixel) * 7) calc(var(--pixel) * 4) var(--color),
    calc(var(--pixel) * 8) calc(var(--pixel) * 4) var(--color),
    calc(var(--pixel) * 9) calc(var(--pixel) * 4) var(--color),
    calc(var(--pixel) * 10) calc(var(--pixel) * 4) var(--color),
    calc(var(--pixel) * 11) calc(var(--pixel) * 4) var(--color),
    // 脖子和身体第6行
    calc(var(--pixel) * 2) calc(var(--pixel) * 5) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 5) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * 5) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * 5) var(--color),
    calc(var(--pixel) * 6) calc(var(--pixel) * 5) var(--color),
    // 身体第7行 (手臂)
    calc(var(--pixel) * 1) calc(var(--pixel) * 6) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * 6) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 6) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * 6) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * 6) var(--color),
    calc(var(--pixel) * 6) calc(var(--pixel) * 6) var(--color),
    calc(var(--pixel) * 7) calc(var(--pixel) * 6) var(--color),
    // 身体第8行
    0 calc(var(--pixel) * 7) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * 7) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * 7) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 7) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * 7) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * 7) var(--color),
    calc(var(--pixel) * 6) calc(var(--pixel) * 7) var(--color),
    // 身体第9行 (尾巴开始)
    calc(var(--pixel) * -1) calc(var(--pixel) * 8) var(--color),
    0 calc(var(--pixel) * 8) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * 8) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * 8) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 8) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * 8) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * 8) var(--color),
    // 身体第10行
    calc(var(--pixel) * -2) calc(var(--pixel) * 9) var(--color),
    calc(var(--pixel) * -1) calc(var(--pixel) * 9) var(--color),
    0 calc(var(--pixel) * 9) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * 9) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * 9) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 9) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * 9) var(--color),
    // 腿部第11行
    calc(var(--pixel) * -3) calc(var(--pixel) * 10) var(--color),
    calc(var(--pixel) * -2) calc(var(--pixel) * 10) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * 10) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 10) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * 10) var(--color),
    // 腿部第12行
    calc(var(--pixel) * -4) calc(var(--pixel) * 11) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * 11) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * 11) var(--color),
    // 脚部第13行
    calc(var(--pixel) * 2) calc(var(--pixel) * 12) var(--color),
    calc(var(--pixel) * 3) calc(var(--pixel) * 12) var(--color),
    calc(var(--pixel) * 4) calc(var(--pixel) * 12) var(--color),
    calc(var(--pixel) * 5) calc(var(--pixel) * 12) var(--color);
    
  :global(.dark) & {
    --color: #b0b0b0;
  }

  animation: dino-legs 0.15s steps(1) infinite;
}

// 像素仙人掌
.cactus-container {
  position: absolute;
  bottom: 20px;
  right: 0;
  animation: cactus-run 2.5s linear infinite;
}

.pixel-cactus {
  --pixel: 4px;
  --color: #535353;
  position: relative;
  width: var(--pixel);
  height: var(--pixel);
  background: var(--color);
  // 像素仙人掌形状
  box-shadow:
    // 主干
    0 calc(var(--pixel) * -1) var(--color),
    0 calc(var(--pixel) * -2) var(--color),
    0 calc(var(--pixel) * -3) var(--color),
    0 calc(var(--pixel) * -4) var(--color),
    0 calc(var(--pixel) * -5) var(--color),
    0 calc(var(--pixel) * -6) var(--color),
    0 calc(var(--pixel) * -7) var(--color),
    // 左臂
    calc(var(--pixel) * -1) calc(var(--pixel) * -2) var(--color),
    calc(var(--pixel) * -1) calc(var(--pixel) * -3) var(--color),
    calc(var(--pixel) * -1) calc(var(--pixel) * -4) var(--color),
    calc(var(--pixel) * -2) calc(var(--pixel) * -4) var(--color),
    calc(var(--pixel) * -2) calc(var(--pixel) * -5) var(--color),
    calc(var(--pixel) * -2) calc(var(--pixel) * -6) var(--color),
    // 右臂
    calc(var(--pixel) * 1) calc(var(--pixel) * -3) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * -4) var(--color),
    calc(var(--pixel) * 1) calc(var(--pixel) * -5) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * -5) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * -6) var(--color),
    calc(var(--pixel) * 2) calc(var(--pixel) * -7) var(--color);
    
  :global(.dark) & {
    --color: #b0b0b0;
  }
}

// 像素地面
.pixel-ground {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  height: 4px;
  background: #535353;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    right: 0;
    height: 4px;
    background: repeating-linear-gradient(
      90deg,
      #535353 0,
      #535353 4px,
      transparent 4px,
      transparent 16px
    );
  }
  
  :global(.dark) & {
    background: #b0b0b0;
    
    &::after {
      background: repeating-linear-gradient(
        90deg,
        #b0b0b0 0,
        #b0b0b0 4px,
        transparent 4px,
        transparent 16px
      );
    }
  }
}

// 加载信息 - 现代化设计
.loading-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.5);
  
  :global(.dark) & {
    background: rgba(30, 30, 50, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 2px 8px rgba(0, 0, 0, 0.2);
  }
}

// 品牌区域 - 动态时钟
.loading-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  .brand-clock {
    width: 80px;
    height: 80px;
    color: #333;
    
    :global(.dark) & {
      color: #e0e0e0;
    }
    
    .clock-svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
    }
    
    .clock-hand {
      transition: transform 0.1s cubic-bezier(0.4, 2.08, 0.55, 0.44);
      transform-origin: 50px 50px;
    }
    
    .second-hand {
      transition: transform 0.1s linear;
    }
  }
  
  .brand-text {
    font-size: 14px;
    font-weight: 500;
    color: #666;
    letter-spacing: 4px;
    text-transform: uppercase;
    
    :global(.dark) & {
      color: #a0a0a0;
    }
  }
}

// 进度条
.loading-progress {
  width: 240px;
  
  .progress-track {
    position: relative;
    height: 6px;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 3px;
    overflow: hidden;
    
    :global(.dark) & {
      background: rgba(255, 255, 255, 0.1);
    }
  }
  
  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 30%;
    background: linear-gradient(90deg, 
      var(--el-color-primary, #409eff), 
      var(--el-color-primary-light-3, #79bbff)
    );
    border-radius: 3px;
    animation: progress-slide 2s ease-in-out infinite;
  }
  
  .progress-glow {
    position: absolute;
    top: -2px;
    left: 0;
    height: 10px;
    width: 30%;
    background: linear-gradient(90deg, 
      transparent,
      rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.4),
      transparent
    );
    filter: blur(4px);
    animation: progress-slide 2s ease-in-out infinite;
  }
}

// 状态提示
.loading-status {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .status-text {
    font-size: 13px;
    color: #666;
    letter-spacing: 1px;
    
    :global(.dark) & {
      color: #a0a0a0;
    }
  }
  
  .status-dots {
    display: flex;
    gap: 4px;
    
    i {
      width: 5px;
      height: 5px;
      background: var(--el-color-primary, #409eff);
      border-radius: 50%;
      animation: dot-wave 1.2s ease-in-out infinite;
      
      &:nth-child(1) { animation-delay: 0s; }
      &:nth-child(2) { animation-delay: 0.15s; }
      &:nth-child(3) { animation-delay: 0.3s; }
    }
  }
}

@keyframes icon-pulse {
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.05);
    opacity: 0.8;
  }
}

@keyframes progress-slide {
  0% { 
    left: -30%;
    width: 30%;
  }
  50% {
    width: 50%;
  }
  100% { 
    left: 100%;
    width: 30%;
  }
}

@keyframes dot-wave {
  0%, 100% { 
    transform: translateY(0);
    opacity: 0.5;
  }
  50% { 
    transform: translateY(-6px);
    opacity: 1;
  }
}

// 像素风格动画关键帧
@keyframes dino-jump {
  0%, 100% { 
    transform: translateY(0); 
  }
  50% { 
    transform: translateY(-16px); 
  }
}

@keyframes dino-legs {
  0%, 50% {
    // 腿部动画帧1 - 通过位移模拟
  }
  51%, 100% {
    // 腿部动画帧2
  }
}

@keyframes ground-scroll {
  0% { 
    transform: translateX(0); 
  }
  100% { 
    transform: translateX(-28px); 
  }
}

@keyframes cloud-move {
  0% { 
    transform: translateX(100px); 
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% { 
    transform: translateX(-450px); 
    opacity: 0;
  }
}

@keyframes cactus-run {
  0% { 
    transform: translateX(120px); 
  }
  100% { 
    transform: translateX(-500px); 
  }
}

@keyframes progress {
  0% { 
    width: 0%; 
    margin-left: 0; 
  }
  50% { 
    width: 70%; 
    margin-left: 15%; 
  }
  100% { 
    width: 0%; 
    margin-left: 100%; 
  }
}

@keyframes dot-bounce {
  0%, 80%, 100% { 
    transform: translateY(0); 
  }
  40% { 
    transform: translateY(-8px); 
  }
}

// ==================== 太空风格加载 ====================
.space-scene {
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at bottom, #1b2838 0%, #090a0f 100%);
  border-radius: 12px;
  overflow: hidden;
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(2px 2px at 20px 30px, #eee, transparent),
    radial-gradient(2px 2px at 40px 70px, #fff, transparent),
    radial-gradient(1px 1px at 90px 40px, #fff, transparent),
    radial-gradient(2px 2px at 160px 80px, #ddd, transparent),
    radial-gradient(1px 1px at 200px 30px, #fff, transparent),
    radial-gradient(2px 2px at 300px 60px, #eee, transparent),
    radial-gradient(1px 1px at 350px 20px, #fff, transparent);
  background-size: 400px 180px;
  animation: stars-twinkle 3s ease-in-out infinite;
}

.astronaut {
  position: relative;
  z-index: 2;
  animation: astronaut-float 4s ease-in-out infinite;
}

.astronaut-body {
  font-size: 4rem;
  filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
}

.planet {
  position: absolute;
  bottom: 20px;
  right: 40px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  box-shadow: inset -10px -10px 20px rgba(0,0,0,0.4);
}

@keyframes stars-twinkle {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

@keyframes astronaut-float {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

// ==================== 简约风格加载 ====================
.minimal-scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  position: relative;
  overflow: hidden;
}

// 背景装饰圆
.minimal-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  .bg-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
    
    &.c1 {
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, #409eff, #67c23a);
      top: -100px;
      right: -100px;
      animation: float-circle 8s ease-in-out infinite;
    }
    
    &.c2 {
      width: 200px;
      height: 200px;
      background: linear-gradient(135deg, #e6a23c, #f56c6c);
      bottom: -50px;
      left: -50px;
      animation: float-circle 6s ease-in-out infinite reverse;
    }
    
    &.c3 {
      width: 150px;
      height: 150px;
      background: linear-gradient(135deg, #909399, #409eff);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: pulse-circle 4s ease-in-out infinite;
    }
  }
}

// 3D立方体加载动画
.minimal-loader {
  perspective: 200px;
  width: 60px;
  height: 60px;
}

.loader-cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: cube-rotate 2s ease-in-out infinite;
}

.cube-face {
  position: absolute;
  width: 60px;
  height: 60px;
  border: 2px solid rgba(64, 158, 255, 0.3);
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(103, 194, 58, 0.1));
  backdrop-filter: blur(5px);
  
  &.front  { transform: rotateY(0deg) translateZ(30px); }
  &.back   { transform: rotateY(180deg) translateZ(30px); }
  &.right  { transform: rotateY(90deg) translateZ(30px); }
  &.left   { transform: rotateY(-90deg) translateZ(30px); }
  &.top    { transform: rotateX(90deg) translateZ(30px); }
  &.bottom { transform: rotateX(-90deg) translateZ(30px); }
  
  :global(.dark) & {
    border-color: rgba(64, 158, 255, 0.5);
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.2), rgba(103, 194, 58, 0.2));
  }
}

// 波浪点动画
.wave-dots {
  display: flex;
  gap: 8px;
  
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: linear-gradient(135deg, #409eff, #67c23a);
    animation: wave-dot 1.4s ease-in-out infinite;
    
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.1s; }
    &:nth-child(3) { animation-delay: 0.2s; }
    &:nth-child(4) { animation-delay: 0.3s; }
    &:nth-child(5) { animation-delay: 0.4s; }
  }
}

@keyframes float-circle {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -20px) scale(1.1); }
}

@keyframes pulse-circle {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.1; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.2; }
}

@keyframes cube-rotate {
  0% { transform: rotateX(0deg) rotateY(0deg); }
  25% { transform: rotateX(90deg) rotateY(90deg); }
  50% { transform: rotateX(180deg) rotateY(180deg); }
  75% { transform: rotateX(270deg) rotateY(270deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}

@keyframes wave-dot {
  0%, 100% { 
    transform: translateY(0) scale(1);
    opacity: 0.5;
  }
  50% { 
    transform: translateY(-15px) scale(1.2);
    opacity: 1;
  }
}

// ==================== 服务器风格加载 ====================
.server-scene {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
}

.server-rack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: #0f0f23;
  border-radius: 8px;
  border: 2px solid #2a2a4a;
}

.server-unit {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #1a1a3e;
  border-radius: 4px;
}

.server-lights {
  display: flex;
  gap: 6px;
}

.server-lights .light {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: server-blink 1s ease-in-out infinite;
  
  &:nth-child(1) {
    background: #4ade80;
    animation-delay: 0s;
  }
  &:nth-child(2) {
    background: #fbbf24;
    animation-delay: 0.3s;
  }
  &:nth-child(3) {
    background: #ef4444;
    animation-delay: 0.6s;
  }
}

@keyframes server-blink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* 移动导航容器样式 */
.mobile-main-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  :deep(.fixed-header) {
    position: sticky;
    top: 0;
    z-index: 100;
    width: 100% !important;
    margin-left: 0 !important;
  }
}

// ==================== 节日主题皮肤 ====================

// 圣诞主题
:global(.theme-christmas) {
  --theme-primary: #c41e3a;
  --theme-secondary: #165b33;
  --theme-accent: #ffd700;
  --theme-background: #f5f5f5;
  
  :deep(.el-color-primary) {
    color: var(--theme-primary);
  }
}

// 春节主题
:global(.theme-spring-festival) {
  --theme-primary: #f5222d;
  --theme-secondary: #ffd700;
  --theme-accent: #ff6b6b;
  --theme-background: #fff8f0;
}

// 情人节主题
:global(.theme-valentines-day) {
  --theme-primary: #eb2f96;
  --theme-secondary: #ff69b4;
  --theme-accent: #ff1493;
  --theme-background: #fff0f5;
}

// 中秋主题
:global(.theme-mid-autumn) {
  --theme-primary: #13c2c2;
  --theme-secondary: #20b2aa;
  --theme-accent: #ffd700;
  --theme-background: #f0f8ff;
}

// 国庆主题
:global(.theme-national-day) {
  --theme-primary: #fa541c;
  --theme-secondary: #ff7a45;
  --theme-accent: #ffd700;
  --theme-background: #fff7f0;
}

// 元旦主题
:global(.theme-new-year) {
  --theme-primary: #1b2a47;
  --theme-secondary: #409eff;
  --theme-accent: #ffd700;
  --theme-background: #f0f5ff;
}
</style>

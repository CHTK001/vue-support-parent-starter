<script setup lang="ts">
import "animate.css";
// 引入 src/components/ReIcon/src/offlineIcon.ts 文件中所有使用addIcon添加过的本地图标
import "@repo/components/ReIcon/src/offlineIcon";
import {
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
  await useConfigStore().load();
  isConfigLoaded.value = true;
};

onMounted(async () => {
  if (isMobile) {
    toggle("mobile", false);
  }

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
  <!-- 全屏加载遮罩 - 像素恐龙动画 -->
  <div v-if="!isConfigLoaded" class="fullscreen-loading">
    <div class="loading-scene">
      <!-- 像素云朵 -->
      <div class="pixel-clouds">
        <div class="pixel-cloud pixel-cloud-1"></div>
        <div class="pixel-cloud pixel-cloud-2"></div>
      </div>
      
      <!-- 像素恐龙 -->
      <div class="dino-container">
        <div class="pixel-dino">
          <div class="dino-sprite"></div>
        </div>
      </div>
      
      <!-- 像素仙人掌 -->
      <div class="cactus-container">
        <div class="pixel-cactus"></div>
      </div>
      
      <!-- 像素地面 -->
      <div class="pixel-ground"></div>
    </div>
    
    <!-- 加载信息 -->
    <div class="loading-info">
      <div class="loading-progress">
        <div class="progress-bar"></div>
      </div>
      <div class="loading-text">{{ t("system.initializing") }}</div>
      <div class="loading-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
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

// 加载信息
.loading-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-progress {
  width: 200px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  
  :global(.dark) & {
    background: #3a3a5c;
  }
}

.progress-bar {
  height: 100%;
  width: 30%;
  background: linear-gradient(90deg, #535353, #757575);
  border-radius: 2px;
  animation: progress 2s ease-in-out infinite;
  
  :global(.dark) & {
    background: linear-gradient(90deg, #a0a0a0, #c0c0c0);
  }
}

.loading-text {
  font-size: 1rem;
  font-weight: 500;
  color: #535353;
  letter-spacing: 2px;
  font-family: 'Courier New', monospace;
  
  :global(.dark) & {
    color: #a0a0a0;
  }
}

.loading-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #535353;
  border-radius: 50%;
  animation: dot-bounce 1.4s ease-in-out infinite;
  
  :global(.dark) & {
    background: #a0a0a0;
  }
  
  &:nth-child(1) { animation-delay: 0s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
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
</style>

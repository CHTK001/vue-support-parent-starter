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
  onUnmounted,
  reactive,
  ref,
} from "vue";
//@ts-ignore
import BackTopIcon from "@repo/assets/svg/back_top.svg?component";
import { getConfig } from "@repo/config";
import { createFingerprint, registerRequestIdleCallback } from "@repo/core";
import { localStorageProxy } from "@repo/utils";
import { ScFullscreenLoading } from "@repo/components";
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

// 加载页面风格（从配置读取，默认 spinner）
const loadingStyle = computed(() => getConfig().LoadingPageStyle || "spinner");

// 加载提示文字
const loadingText = computed(() => {
  const isFirstLoad = !sessionStorage.getItem("_app_loaded");
  return isFirstLoad ? t("system.initializing") : t("system.loading");
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
    // 配置加载失败时也显示页面
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
  <ScFullscreenLoading
    v-if="!isConfigLoaded"
    :model-value="true"
    :style="loadingStyle"
    :text="loadingText"
    :show-progress="true"
  />

  <!-- 页面内容 -->
  <div v-if="isConfigLoaded" ref="appWrapperRef" :class="['app-wrapper', set.classes]">
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

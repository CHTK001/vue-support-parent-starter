<script setup lang="ts">
import { isNumber, useGlobal } from "@pureadmin/utils";
import { usePermissionStoreHook } from "@repo/core";
import {
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
  Suspense,
  onErrorCaptured,
} from "vue";
import { useLayoutEvents } from "../../hooks/useLayoutEvents";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useTags } from "../../hooks/useTag";
import LayFooter from "../lay-footer/index.vue";
import LayFrame from "../lay-frame/index.vue";
import ContentRenderer from "./components/ContentRenderer.vue";
import RouteLoadingSkeleton from "./components/RouteLoadingSkeleton.vue";

// 离开确认功能
let beforeUnloadHandler: ((e: BeforeUnloadEvent) => string) | null = null;

const enableConfirmOnLeave = () => {
  if (!beforeUnloadHandler) {
    beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
  }
};

const disableConfirmOnLeave = () => {
  if (beforeUnloadHandler) {
    window.removeEventListener("beforeunload", beforeUnloadHandler);
    beforeUnloadHandler = null;
  }
};

const props = defineProps({
  fixedHeader: Boolean,
});

const { t } = useI18n();
const { showModel } = useTags();
const { $storage, $config } = useGlobal<GlobalPropertiesApi>();

// 提取 store 引用到顶层，避免每次渲染重复调用
const permissionStore = usePermissionStoreHook();
const cachePageList = computed(() => permissionStore.cachePageList);

// 组件缓存，从配置中读取
const isKeepAlive = ref(
  $storage?.configure?.keepAlive ?? $config?.KeepAlive ?? true,
);

const transitions = computed(() => {
  return (route) => {
    return route.meta.transition;
  };
});

const hideTabs = computed(() => {
  return $storage?.configure.hideTabs;
});

const contentMargin = computed(() => {
  return $storage?.configure.contentMargin || 16;
});

const layoutRadius = computed(() => {
  return $storage?.configure.layoutRadius || 10;
});

const hideFooter = ref($storage?.configure.hideFooter ?? false);
// 菜单过渡动画默认关闭，如需开启通过设置面板修改 menuTransition 配置
const menuTransition = ref($storage?.configure?.menuTransition ?? false);
const transitionType = ref($storage?.configure?.transitionType ?? "fade-slide");
const confirmOnLeave = ref($storage?.configure?.confirmOnLeave ?? false);

// Backtop 目标容器就绪标记，避免 ElementPlus target 不存在报错
const backtopReady = ref(false);
const backtopTargetSelector =
  ".content-area .sidebar-custom .el-scrollbar__wrap";

// 初始化离开确认功能
if (confirmOnLeave.value) {
  enableConfirmOnLeave();
}

// 使用 useLayoutEvents 统一管理所有事件，自动在组件卸载时注销
useLayoutEvents([
  {
    name: "keepAliveChange",
    handler: (v: boolean) => {
      isKeepAlive.value = v;
    },
  },
  // 统一使用菜单过渡动画事件，默认关闭，用户可在设置面板手动开启
  {
    name: "menuTransitionChange",
    handler: (v: boolean) => {
      menuTransition.value = v;
    },
  },
  {
    name: "transitionTypeChange",
    handler: (v: string) => {
      transitionType.value = v;
    },
  },
  {
    name: "hideFooterChange",
    handler: (v: boolean) => {
      hideFooter.value = v;
    },
  },
  {
    name: "confirmOnLeaveChange",
    handler: (v: boolean) => {
      confirmOnLeave.value = v;
      v ? enableConfirmOnLeave() : disableConfirmOnLeave();
    },
  },
]);

// 组件卸载时清理 beforeunload 监听器
onBeforeUnmount(() => {
  disableConfirmOnLeave();
});

const stretch = computed(() => {
  return $storage?.configure.stretch;
});

const layoutMode = computed(() => $storage?.layout.layout || "vertical");
const isVerticalLayout = computed(() => layoutMode.value === "vertical");

const cardBody = computed(() => {
  return $storage?.configure.cardBody;
});

const getMainWidth = computed(() => {
  return isNumber(stretch.value)
    ? stretch.value + "px"
    : stretch.value
      ? "1440px"
      : "100%";
});

// 判断是否为移动导航模式
const isMobileLayout = computed(() => layoutMode.value === "mobile");

const headerHeight = computed(() => {
  return hideTabs.value ? 60 : 102;
});

const getSectionStyle = computed(() => {
  // 移动导航模式下，没有标签页，padding-top 更小
  if (isMobileLayout.value) {
    return ["padding-top: 0;"];
  }

  return [
    props.fixedHeader
      ? ""
      : `padding-top: 0;min-height: calc(100vh - ${headerHeight.value}px);height: calc(100vh - ${headerHeight.value}px);`,
  ];
});

onMounted(() => {
  nextTick(() => {
    document.body.style.setProperty("height", "100vh");
    document.body.style.setProperty("overflow", "hidden");
    document.body.style.setProperty(
      "--contentMargin",
      contentMargin.value + "px",
    );
    document.body.style.setProperty(
      "--layoutRadius",
      layoutRadius.value + "px",
    );

    // 等待 DOM 完整挂载后再检查 Backtop 目标容器是否存在
    const target = document.querySelector(backtopTargetSelector);
    backtopReady.value = !!target;
  });
});

const route = useRoute();

// 路由切换loading状态
const routeLoading = ref(false);
const suspenseLoading = ref(false); // Suspense 加载状态
const MIN_LOADING_TIME = 300; // 最小显示时间(ms)，避免闪烁
let loadingTimer: ReturnType<typeof setTimeout> | null = null;
let suspenseTimer: ReturnType<typeof setTimeout> | null = null;

// 组合加载状态：路由切换或 Suspense 加载中
const isLoading = computed(() => routeLoading.value || suspenseLoading.value);

// Suspense 事件处理
const onSuspensePending = () => {
  // 延迟显示 loading，避免快速加载时闪烁
  if (suspenseTimer) {
    clearTimeout(suspenseTimer);
  }
  suspenseTimer = setTimeout(() => {
    suspenseLoading.value = true;
  }, 100);
};

const onSuspenseResolve = () => {
  if (suspenseTimer) {
    clearTimeout(suspenseTimer);
    suspenseTimer = null;
  }
  // 确保最小显示时间
  setTimeout(() => {
    suspenseLoading.value = false;
  }, MIN_LOADING_TIME);
};

const onSuspenseFallback = () => {
  suspenseLoading.value = true;
};

// 捕获异步组件加载错误
const loadError = ref<Error | null>(null);
onErrorCaptured((err) => {
  loadError.value = err;
  suspenseLoading.value = false;
  console.error("组件加载错误:", err);
  return false; // 阻止错误继续传播
});

// 监听路由变化，使用 flush: 'sync' 确保立即执行
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath && oldPath !== undefined) {
      // 重置错误状态
      loadError.value = null;
      // 路由变化时立即显示loading
      routeLoading.value = true;

      // 清除之前的定时器
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }

      // 最小显示时间后隐藏
      loadingTimer = setTimeout(() => {
        nextTick(() => {
          routeLoading.value = false;
        });
      }, MIN_LOADING_TIME);
    }
  },
  { immediate: false, flush: "sync" },
);

onBeforeUnmount(() => {
  if (loadingTimer) {
    clearTimeout(loadingTimer);
  }
  if (suspenseTimer) {
    clearTimeout(suspenseTimer);
  }
});
</script>

<template>
  <section
    :class="[fixedHeader ? 'app-main' : 'app-main-nofixed-header']"
    :style="getSectionStyle"
  >
    <!-- 加载状态骨架屏：去掉过渡动画，避免路由切换时整块内容产生动画 -->
    <RouteLoadingSkeleton
      v-if="isLoading"
      :rows="6"
      :show-header="true"
      loading-text="页面加载中..."
      :min-height="fixedHeader ? 'calc(100vh - 120px)' : '400px'"
    />

    <!-- 错误状态 -->
    <div v-if="loadError && !isLoading" class="route-error-container">
      <el-result icon="error" title="加载失败" :sub-title="loadError.message">
        <template #extra>
          <ScButton
            type="primary"
            @click="
              loadError = null;
              $router.go(0);
            "
          >
            重新加载
          </ScButton>
        </template>
      </el-result>
    </div>

    <router-view v-show="!isLoading && !loadError">
      <template #default="{ Component, route }">
        <Suspense
          @pending="onSuspensePending"
          @resolve="onSuspenseResolve"
          @fallback="onSuspenseFallback"
        >
          <LayFrame :currComp="Component" :currRoute="route">
            <template #default="{ Comp, fullPath, frameInfo }">
              <div
                v-if="fixedHeader"
                class="content-area"
                :style="{
                  'max-width': getMainWidth,
                  margin: '0 auto',
                  height: `calc(100vh - ${headerHeight}px)`,
                  padding: `${contentMargin}px`,
                  boxSizing: 'border-box',
                }"
              >
                <el-backtop
                  v-if="cardBody && backtopReady"
                  :title="t('buttons.pureBackTop')"
                  :target="backtopTargetSelector"
                />
                <ScCard
                  class="layout sidebar-custom thin-scroller card-height"
                  :class="{ 'no-card-mode': !cardBody }"
                  :shadow="cardBody ? 'always' : 'never'"
                  :body-style="{
                    padding: '0',
                    height: '100%',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }"
                  :style="{
                    height: '100%',
                    width: '100%',
                    maxWidth: '100%',
                    'border-radius': layoutRadius + 'px  !important',
                    boxSizing: 'border-box',
                  }"
                >
                  <el-scrollbar class="card-scrollbar">
                    <div
                      style="
                        min-height: 100%;
                        width: 100%;
                        max-width: 100%;
                        display: flex;
                        box-sizing: border-box;
                      "
                    >
                      <ContentRenderer
                        :comp="Comp"
                        :route="route"
                        :is-keep-alive="isKeepAlive"
                        :cache-page-list="cachePageList"
                        :frame-info="frameInfo"
                        :menu-transition="menuTransition"
                        :transition-type="transitionType"
                      />
                    </div>
                  </el-scrollbar>
                </ScCard>
              </div>
              <div
                v-else
                class="grow bg-layout"
                :style="{
                  maxWidth: getMainWidth,
                  margin: '0 auto',
                }"
              >
                <ScCard
                  class="h-full layout sidebar-custom sssss"
                  :class="{ 'no-card-mode': !cardBody }"
                  :shadow="cardBody ? 'always' : 'never'"
                  :body-style="{
                    padding: '0',
                    height: '100%',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }"
                  :style="{
                    height: 'calc(100% - ' + contentMargin * 2 + 'px)',
                    width: '100%',
                    maxWidth: '100%',
                    'border-radius': layoutRadius + 'px  !important',
                    margin: contentMargin + 'px',
                    boxSizing: 'border-box',
                  }"
                >
                  <el-scrollbar class="card-scrollbar">
                    <div
                      style="
                        padding: 20px;
                        min-height: 100%;
                        width: 100%;
                        max-width: 100%;
                        box-sizing: border-box;
                      "
                    >
                      <ContentRenderer
                        :comp="Comp"
                        :route="route"
                        :is-keep-alive="isKeepAlive"
                        :cache-page-list="cachePageList"
                        :frame-info="frameInfo"
                        :menu-transition="menuTransition"
                        :transition-type="transitionType"
                      />
                    </div>
                  </el-scrollbar>
                </ScCard>
              </div>
            </template>
          </LayFrame>
          <template #fallback>
            <RouteLoadingSkeleton
              :rows="6"
              :show-header="true"
              loading-text="组件加载中..."
              :min-height="fixedHeader ? 'calc(100vh - 120px)' : '400px'"
            />
          </template>
        </Suspense>
      </template>
    </router-view>

    <!-- 页脚：仅由 hideFooter 控制是否显示，与 fixedHeader 解耦 -->
    <LayFooter v-if="!hideFooter" />
  </section>
</template>

<style lang="scss" scoped>
.content-area {
  height: 100%;
  width: 100%;
  max-width: 100%; /* 限制最大宽度 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box; /* 确保宽度计算包含边框和内边距 */
}
.el-card:hover {
  transform: none !important;
}
.card-height {
  height: 100%;
}
.sidebar-custom {
  width: 100% !important; /* 强制宽度为 100% */
  max-width: 100% !important; /* 限制最大宽度 */
  background: var(--el-bg-color);
  border: 1px solid var(--el-card-border-color);
  border-radius: var(--el-card-border-radius);
  color: var(--el-text-color-primary);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(0, 0, 0, 0.02);
  box-sizing: border-box; /* 确保宽度计算包含边框和内边距 */

  .dark & {
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.15),
      0 2px 8px rgba(0, 0, 0, 0.1);
  }

  // el-card 的 body 不产生滚动条，由内部内容处理
  :deep(.el-card__body) {
    overflow: hidden;
    min-height: 100%;
    padding: 0;
    display: flex;
    flex-direction: column;
    width: 100% !important;
    max-width: 100% !important; /* 限制 body 最大宽度 */
    box-sizing: border-box;
  }

  // 内部内容滚动
  :deep(.main-content) {
    min-height: 100%;
    width: 100%;
    max-width: 100%; /* 限制内容最大宽度 */
    box-sizing: border-box;
  }

  // 滚动条容器宽度限制
  :deep(.el-scrollbar) {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;

    .el-scrollbar__wrap {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box;
    }

    .el-scrollbar__view {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box;
    }
  }
}

.content-scrollbar {
  background: var(--el-bg-color);

  // 确保 scrollbar 的视图区域也是满高度，否则内部元素 height: 100% 会失效
  :deep(.el-scrollbar__wrap) {
    height: 100%;
  }
  :deep(.el-scrollbar__view) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

/* 非卡片内容模式：去除边框和背景 */
.no-card-mode {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  position: relative;

  :deep(.page-container),
  :deep(.main-content) {
    border: 0 !important;
  }

  /* 禁止内部内容产生滚动条，统一由外层 el-scrollbar 处理 */
  :deep(.main-content) {
    overflow: visible !important;
    min-height: 100% !important;
    flex: 1;
  }

  :deep(.thin-scroller) {
    overflow: visible !important;
  }
}

.app-main {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden; // 禁止外层滚动，让内部 el-scrollbar 独自处理滚动
  z-index: 0; // 系统框架层级统一为 0，避免与弹层冲突
  background: var(--el-bg-color-page);
  transition: background-color 0.2s ease;

  html.dark & {
    background: var(--el-bg-color);
  }
}

.app-main-nofixed-header {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--el-bg-color-page);
  transition: background-color 0.2s ease;

  html.dark & {
    background: var(--el-bg-color);
  }
}

.main-content {
  min-height: 100%;
  height: auto;
  position: relative;
  z-index: 0;
  background: transparent;
}

:deep(.el-card__body) {
  height: auto;
  min-height: 100%;
}

:deep(.page-container) {
  height: auto !important;
  min-height: 100%;
}

.bg-layout {
  height: 100%;
  width: 100%;
  max-width: 100%; /* 限制最大宽度 */
  background: transparent;
  box-sizing: border-box; /* 确保宽度计算包含边框和内边距 */
  overflow: hidden; /* 防止内容溢出 */
}

:deep(.el-backtop) {
  background-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.4);
  border-radius: 50%;
  color: var(--el-text-color-primary);
  height: 44px;
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.5);
  }

  svg {
    height: 20px;
    width: 20px;
    transition: all 0.3s;
  }

  &:hover svg {
    transform: scale(1.1);
  }
}

:deep(.el-scrollbar) {
  .el-scrollbar__bar {
    opacity: 0.2;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.8;
    }
  }

  .el-scrollbar__wrap {
    scrollbar-width: thin;
    scrollbar-color: var(--el-color-primary) transparent;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-color-primary-light-5);
      border-radius: 10px;

      &:hover {
        background-color: var(--el-color-primary);
      }
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }
  }
}

/* 移除冗余的过渡样式定义，使用全局的 transition.scss */

/* Fade 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 错误容器 */
.route-error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 120px);
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: var(--layoutRadius, 10px);
  margin: var(--contentMargin, 16px);
}

/* 路由切换loading骨架屏容器 */
.route-loading-container {
  padding: var(--contentMargin, 16px);
  height: calc(100vh - 86px - var(--contentMargin, 16px) * 2);
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: var(--layoutRadius, 10px);
  margin: var(--contentMargin, 16px);
  border: 1px solid var(--el-card-border-color);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(0, 0, 0, 0.02);

  .dark & {
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.15),
      0 2px 8px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-skeleton) {
    padding: 20px;
  }
}

.card-scrollbar {
  height: 100%;
  width: 100% !important;
  max-width: 100% !important; /* 限制滚动条容器最大宽度 */
  box-sizing: border-box;

  :deep(.el-scrollbar__wrap) {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
  }

  :deep(.el-scrollbar__view) {
    height: 100%;
    width: 100% !important;
    max-width: 100% !important; /* 限制视图最大宽度 */
    box-sizing: border-box;
  }
}
</style>

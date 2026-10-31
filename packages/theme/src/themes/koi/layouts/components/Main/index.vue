<template>
  <div class="main-wrapper">
    <ReMaximize />
    <RePerfMonitor />
    <ReAiCharacter />
    <Tabs v-if="globalStore.isTabsShown" />
    <AnnouncementBar position="default" load-mode="single" />
    <el-main class="main-content">
      <router-view v-slot="{ Component, route }">
        <template v-if="isNoneTransition">
          <keep-alive :max="16" :include="keepAliveStore.keepAliveName">
            <component :is="Component" :key="route.fullPath" v-if="isRouterShow" />
          </keep-alive>
        </template>
        <transition v-else :name="transition" mode="out-in" appear>
          <keep-alive :max="16" :include="keepAliveStore.keepAliveName">
            <component :is="Component" :key="route.fullPath" v-if="isRouterShow" />
          </keep-alive>
        </transition>
      </router-view>
      <!--
        路由切换骨架：先出页面框架（页头 + 内容块），再等页面 chunk 就绪后替换成真实页面。
        为什么需要：懒加载路由在点击那一刻才开始下载 chunk，期间旧页面一动不动，
        用户会以为"点了没反应"。120ms 内的快速切换不显示，避免闪一下。
      -->
      <transition name="route-skeleton-fade">
        <div v-if="routePending" class="route-skeleton" aria-busy="true" aria-label="页面加载中">
          <div class="rs-head">
            <span class="rs-bone rs-title"></span>
            <span class="rs-bone rs-action"></span>
          </div>
          <div class="rs-toolbar">
            <span class="rs-bone rs-tab is-active"></span>
            <span class="rs-bone rs-tab"></span>
            <span class="rs-bone rs-tab"></span>
            <span class="rs-bone rs-tab is-short"></span>
          </div>
          <div class="rs-card">
            <span class="rs-bone rs-line"></span>
            <span class="rs-bone rs-line"></span>
            <span class="rs-bone rs-line is-short"></span>
          </div>
          <div class="rs-card rs-table">
            <span class="rs-bone rs-row is-head"></span>
            <span v-for="n in 6" :key="n" class="rs-bone rs-row"></span>
            <!-- 页脚 + 分页：真实页面在这里有内容，留空会显得骨架没吃满 -->
            <div class="rs-footer">
              <span class="rs-bone rs-foot-btn"></span>
              <span class="rs-bone rs-foot-btn"></span>
              <span class="rs-bone rs-pager"></span>
            </div>
          </div>
        </div>
      </transition>
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, provide, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import ReMaximize from "@repo/theme/koi/layouts/components/Main/components/ReMaximize.vue";
import { useDebounceFn } from "@vueuse/core";
import Tabs from "@repo/theme/koi/layouts/components/Tabs/index.vue";
import AnnouncementBar from "@repo/theme/koi/layouts/components/AnnouncementBar/index.vue";
import RePerfMonitor from "@repo/theme/koi/layouts/components/RePerfMonitor.vue";
import ReAiCharacter from "@repo/theme/koi/layouts/components/ReAiCharacter.vue";
import { storeToRefs } from "pinia";
import useKeepAliveStore from "@repo/pinia/modules/keepAlive";
import useGlobalStore from "@repo/pinia/modules/global";

const globalStore = useGlobalStore();
const router = useRouter();

// 路由动画
const { transition } = storeToRefs(globalStore);
// 无动画（transition 为空或 "none"）
const isNoneTransition = computed(() => !transition.value || transition.value === "none");
const keepAliveStore = useKeepAliveStore();

// 刷新当前路由页面缓存方法
const isRouterShow = ref(true);

const refreshCurrentPage = (val: boolean) => (isRouterShow.value = val);

provide("refresh", refreshCurrentPage);

/**
 * 路由切换骨架的显隐。
 *
 * <p>只在「切换耗时超过 120ms」时才显示：绝大多数同层页面切换在 100ms 内完成，
 * 立刻显示骨架反而会闪一下，比不做还难受。慢切换（大页面 chunk / 首次访问）
 * 才需要这段占位，让用户先看到页面框架。</p>
 */
const routePending = ref(false);
let routeTimer: ReturnType<typeof setTimeout> | null = null;

const clearRouteTimer = () => {
  if (routeTimer) {
    clearTimeout(routeTimer);
    routeTimer = null;
  }
};

const stopBeforeEach = router.beforeEach(() => {
  clearRouteTimer();
  routeTimer = setTimeout(() => {
    routePending.value = true;
  }, 120);
});

const stopAfterEach = router.afterEach(() => {
  clearRouteTimer();
  routePending.value = false;
});

const stopOnError = router.onError(() => {
  clearRouteTimer();
  routePending.value = false;
});

onBeforeUnmount(() => {
  clearRouteTimer();
  stopBeforeEach();
  stopAfterEach();
  stopOnError();
});

/** 监听当前页面是否最大化，动态添加 class */
watch(
  () => globalStore.maximize,
  () => {
    const app = document.getElementById("app") as HTMLElement;
    if (globalStore.maximize) app.classList.add("main-maximize");
    else app.classList.remove("main-maximize");
    // 浏览器没有实际变化的情况下，触发一次浏览器尺寸变化的逻辑。保证全屏切换的时候，表格阔以进行自适应。
    const event = new Event("resize");
    window.dispatchEvent(event);
  },
  { deep: true, immediate: true }
);

const screenWidth = ref(0);
const showTabs = ref(true);

/** 监听窗口大小变化，折叠侧边栏 */
const listeningWindow = useDebounceFn(() => {
  screenWidth.value = document.body.clientWidth;
  if (!globalStore.isCollapse && screenWidth.value < 1200) globalStore.setGlobalState("isCollapse", true);
  if (globalStore.isCollapse && screenWidth.value > 1200) globalStore.setGlobalState("isCollapse", false);
  showTabs.value = screenWidth.value >= 520;
}, 100);

window.addEventListener("resize", listeningWindow, false);

onBeforeUnmount(() => {
  window.removeEventListener("resize", listeningWindow);
});
</script>

<style lang="scss" scoped>
@use "../../../styles/transition.scss";

.main-wrapper {
  // 最小化样式，只设置必要的布局属性
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; // 防止高度溢出
}

.main-content {
  overflow-x: hidden;
  padding: 8px !important;
  flex: 1;
  margin: 0;
  background-color: var(--el-bg-color-page);
  min-height: 0;
  // 骨架用绝对定位盖住内容区，需要定位上下文
  position: relative;

  // 暗色模式
  .dark & {
    background-color: var(--el-bg-color-page);
  }
}

/* ===== 路由切换骨架 ===== */
.route-skeleton {
  position: absolute;
  inset: 0;
  /* ⚠ 必须高过表格的所有浮层：`z-index: 8` 时 ReTable 的页脚行（自己抬到
     z-index:31 以盖住固定列浮层 `.vxe-table--fixed-*wrapper` 的 z-index:30）
     和 vxe 的 loading 遮罩（z-index:99）会穿出来，露出一截页脚——换页时
     "骨架没盖住表格底部"的样式坡。高于 99 后也不用再去动表格内部各层的 z-index。 */
  z-index: 100;
  box-sizing: border-box;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--el-bg-color-page);
  pointer-events: none;
}

.rs-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px;
}

.rs-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px;
}

.rs-card {
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rs-table {
  gap: 10px;
  /* 表格卡片吸收骨架剩余高度，避免页面底部露出一截空背景 */
  flex: 1;
  min-height: 0;
}

/* 页脚/分页占位。卡片已 flex:1 撑满，margin-top:auto 把页脚压到底边，
   剩余空间由这里吃掉——不要再额外加 flex:1 的占位块，否则两者会平分剩余高度。 */
.rs-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  margin-top: auto;
  border-top: 1px solid var(--el-border-color-lighter);
}

.rs-foot-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
}

.rs-pager {
  width: 220px;
  height: 32px;
  border-radius: 6px;
}

/* 骨头统一质感：与 ReLoader 内置骨架同一套呼吸动画，观感一致 */
.rs-bone {
  display: block;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--el-fill-color-light) 25%,
    var(--el-fill-color) 50%,
    var(--el-fill-color-light) 75%
  );
  background-size: 200% 100%;
  animation: rs-shimmer 1.4s ease-in-out infinite;
}

.rs-title {
  width: 180px;
  height: 22px;
  border-radius: 8px;
}

.rs-action {
  width: 96px;
  height: 30px;
  border-radius: 8px;
}

.rs-tab {
  width: 78px;
  height: 26px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  animation: none;

  &.is-active {
    background: var(--el-color-primary-light-8);
  }

  &.is-short {
    width: 48px;
  }
}

.rs-line {
  height: 14px;

  &.is-short {
    width: 46%;
  }
}

.rs-row {
  height: 34px;
  border-radius: 4px;

  &.is-head {
    height: 26px;
    background: var(--el-fill-color);
    animation: none;
  }
}

@keyframes rs-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.route-skeleton-fade-enter-active,
.route-skeleton-fade-leave-active {
  transition: opacity 0.16s ease;
}

.route-skeleton-fade-enter-from,
.route-skeleton-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .rs-bone {
    animation-duration: 2.6s;
  }
}
</style>

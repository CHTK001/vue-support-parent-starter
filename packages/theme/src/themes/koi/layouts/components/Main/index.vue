<template>
  <div class="main-wrapper">
    <ReMaximize />
    <RePerfMonitor />
    <ReAiCharacter />
    <!-- 标签栏：开关（other 设置面板 / 持久化的 isTabsShown）与屏宽双条件 -->
    <Tabs v-if="globalStore.isTabsShown && showTabs" />
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
        路由切换骨架：先出内容骨架（两张堆叠的信息卡），再等页面 chunk 就绪后替换成真实页面。
        为什么需要：懒加载路由在点击那一刻才开始下载 chunk，期间旧页面一动不动，
        用户会以为"点了没反应"。120ms 内的快速切换不显示，避免闪一下。
        页头/工具栏不属于骨架：每个页面的标题、Tab、搜索行各不相同，单独占位比写进内容卡
        更会引起布局跳跃（标题行的高度不确定，骨架撑开后真实页头出现，高度一变页面会先缩紧
        再弹回，比直接画内容块更刺眼），所以骨架只保留两张内容卡。
      -->
      <transition name="route-skeleton-fade">
        <div
          v-if="routePending"
          class="route-skeleton"
          :class="{ 'is-leaving': skeletonLeaving }"
          aria-busy="true"
          aria-label="页面加载中"
        >
          <!-- 小动物以每一根加载条（.rs-bone）为栖木，随机换位置、上上下下地跳；
               加载完成时由 leaving 触发离场（鸟飞出屏幕 / 熊猫溜走） -->
          <RouteSkeletonCritter
            v-if="globalStore.isSkeletonCritterShown"
            :animal="globalStore.skeletonCritterAnimal"
            :leaving="skeletonLeaving"
            class="rs-critter"
          />
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
import RouteSkeletonCritter from "@repo/theme/koi/layouts/components/Main/components/RouteSkeletonCritter.vue";
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

/**
 * 骨架收尾：页面 chunk 就绪后不立刻把骨架抽走 —— 先让小动物自己离场
 * （鸟飞出屏幕 / 熊猫溜走），卡片同时淡出露出真实页面，等它走完再整体卸载。
 */
const skeletonLeaving = ref(false);
let exitTimer: ReturnType<typeof setTimeout> | null = null;

const clearRouteTimer = () => {
  if (routeTimer) {
    clearTimeout(routeTimer);
    routeTimer = null;
  }
};

const clearExitTimer = () => {
  if (exitTimer) {
    clearTimeout(exitTimer);
    exitTimer = null;
  }
};

/** 离场时长：与 RouteSkeletonCritter 的 exit 动画对齐（鸟 620ms / 熊猫 260+440ms） */
const exitMs = computed(() => (globalStore.skeletonCritterAnimal === "panda" ? 720 : 640));

/** 系统是否要求减少动态效果（要求时不做离场，直接收） */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false);

/**
 * 路由加载完成：有小动物时先播离场，再卸载骨架；否则立即收起。
 * 小动物被管理员关掉、或系统要求减少动效时，不额外占用这 0.6s。
 */
const finishRoute = () => {
  clearRouteTimer();
  if (!routePending.value) return;
  if (!globalStore.isSkeletonCritterShown || prefersReducedMotion()) {
    clearExitTimer();
    skeletonLeaving.value = false;
    routePending.value = false;
    return;
  }
  skeletonLeaving.value = true;
  clearExitTimer();
  exitTimer = setTimeout(() => {
    routePending.value = false;
    skeletonLeaving.value = false;
    exitTimer = null;
  }, exitMs.value);
};

/** 新导航开始：取消上一轮还没走完的离场，避免骨架被提前收掉 */
const resetSkeleton = () => {
  clearRouteTimer();
  clearExitTimer();
  skeletonLeaving.value = false;
};

const stopBeforeEach = router.beforeEach(() => {
  resetSkeleton();
  routeTimer = setTimeout(() => {
    routePending.value = true;
  }, 120);
});

const stopAfterEach = router.afterEach(() => {
  finishRoute();
});

const stopOnError = router.onError(() => {
  finishRoute();
});

onBeforeUnmount(() => {
  clearRouteTimer();
  clearExitTimer();
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
/** 标签栏是否显示：默认显示，窄屏（<520）才收起 */
const showTabs = ref(true);

/** 监听窗口大小变化，折叠侧边栏 */
const listeningWindow = useDebounceFn(() => {
  screenWidth.value = document.body.clientWidth;
  if (!globalStore.isCollapse && screenWidth.value < 1200) globalStore.setGlobalState("isCollapse", true);
  if (globalStore.isCollapse && screenWidth.value > 1200) globalStore.setGlobalState("isCollapse", false);
  showTabs.value = screenWidth.value >= 520;
}, 100);

window.addEventListener("resize", listeningWindow, false);

// 首屏必须先量一次：不量的话 screenWidth 停在 0，而 showTabs 只能被 resize 打开，
// 用户不拖窗口就永远看不到标签栏（顶部"不常显"的由来）
screenWidth.value = document.body.clientWidth;
showTabs.value = screenWidth.value >= 520;

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
  background-color: var(--koi-surface-page);
  min-height: 0;
  // 骨架用绝对定位盖住内容区，需要定位上下文
  position: relative;

  // 暗色模式
  .dark & {
    background-color: var(--koi-surface-page);
  }
}

/* ===== 路由切换骨架 ===== */
/* 骨架的定位上下文：小动物是骨架的直接子节点（absolute），要相对这一层定位 */
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

/* 小动物是骨架里的绝对定位元素（组件自带 position/top/left），
   不参与 flex 排版，所以这里不需要给它留高度。 */

/* 收尾：卡片先淡出露出真实页面，小动物留在上层自己飞走/溜走 */
.route-skeleton.is-leaving {
  background: transparent;
  transition: background-color 0.2s ease;
}
.route-skeleton.is-leaving .rs-card {
  opacity: 0;
  transition: opacity 0.16s ease;
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

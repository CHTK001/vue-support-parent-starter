<script setup lang="ts">
//@ts-ignore
import { isNumber, useGlobal } from "@pureadmin/utils";
import { usePermissionStoreHook } from "@repo/core";
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, Transition } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useTags } from "../../hooks/useTag";
import LayFooter from "../lay-footer/index.vue";
import LayFrame from "../lay-frame/index.vue";

const props = defineProps({
  fixedHeader: Boolean,
});

const { t } = useI18n();
const { showModel } = useTags();
//@ts-ignore
const { $storage, $config } = useGlobal<GlobalPropertiesApi>();

const isKeepAlive = computed(() => {
  return $config?.KeepAlive;
});

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

const layoutBlur = computed(() => {
  return $storage?.configure.layoutBlur || 4;
});

const hideFooter = computed(() => {
  return $storage?.configure.hideFooter;
});

const stretch = computed(() => {
  return $storage?.configure.stretch;
});

const layoutMode = computed(() => $storage?.layout.layout || "vertical");
const isVerticalLayout = computed(() => layoutMode.value === "vertical");
const isCardLayout = computed(() => layoutMode.value === "card");

const cardBody = computed(() => {
  return $storage?.configure.cardBody;
});

const getMainWidth = computed(() => {
  return isNumber(stretch.value) ? stretch.value + "px" : stretch.value ? "1440px" : "100%";
});

const getSectionStyle = computed(() => {
  return [
    hideTabs.value && isVerticalLayout.value ? "padding-top: 48px;" : "",
    !hideTabs.value && isVerticalLayout.value ? (showModel.value == "chrome" ? "padding-top: 85px;" : "padding-top: 81px;") : "",
    hideTabs.value && !isVerticalLayout.value ? "padding-top: 48px;" : "",
    !hideTabs.value && !isVerticalLayout.value ? (showModel.value == "chrome" ? "padding-top: 85px;" : "padding-top: 81px;") : "",
    props.fixedHeader ? "" : `padding-top: 0;${hideTabs.value ? "min-height: calc(100vh - 48px);" : "min-height: calc(100vh - 86px);"}`,
  ];
});

onMounted(async () => {
  nextTick(() => {
    document.body.style.setProperty("height", "100vh");
    document.body.style.setProperty("--contentMargin", contentMargin.value + "px");
    document.body.style.setProperty("--layoutRadius", layoutRadius.value + "px");
    document.body.style.setProperty("--layoutBlur", layoutBlur.value + "px");
  });
});

const transitionMain = defineComponent({
  props: {
    route: {
      type: undefined,
      required: true,
    },
  },
  render() {
    const menuTransition = $storage.configure.menuTransition;
    const transitionName = menuTransition ? transitions.value(this.route)?.name || "fade-transform" : "";
    const enterTransition = menuTransition ? transitions.value(this.route)?.enterTransition : "";
    const leaveTransition = menuTransition ? transitions.value(this.route)?.leaveTransition : "";
    return h(
      Transition,
      {
        name: !menuTransition ? "" : enterTransition ? "pure-classes-transition" : transitionName,
        enterActiveClass: !menuTransition ? "" : enterTransition ? `animate__animated ${enterTransition}` : undefined,
        leaveActiveClass: !menuTransition ? "" : leaveTransition ? `animate__animated ${leaveTransition}` : undefined,
        mode: "out-in",
        appear: true,
      },
      {
        default: () => [this.$slots.default()],
      }
    );
  },
});

// 菜单卡片画廊（卡片导航模式使用）
const router = useRouter();

// 读取系统设置的默认展示数量（可在系统设置中变更），默认5
const maxVisible = computed(() => Number($storage?.configure?.cardGalleryMax) || 5);

// 顶级菜单（仅展示第一层，支持鼠标悬浮展示下级）
const topMenus = computed(() => {
  return (usePermissionStoreHook().wholeMenus || []).filter((m) => m?.meta?.showLink !== false);
});

// 分页/偏移控制，左右箭头切换
const galleryOffset = ref(0);
const slideDirection = ref("");
const totalPages = computed(() => (topMenus.value.length === 0 ? 1 : Math.ceil(topMenus.value.length / maxVisible.value)));
const visibleMenus = computed(() => topMenus.value.slice(galleryOffset.value, galleryOffset.value + maxVisible.value));
function prevPage() {
  if (topMenus.value.length <= maxVisible.value) return;
  slideDirection.value = "right";
  galleryOffset.value = Math.max(0, galleryOffset.value - maxVisible.value);
  setTimeout(() => (slideDirection.value = ""), 400);
}
function nextPage() {
  if (topMenus.value.length <= maxVisible.value) return;
  slideDirection.value = "left";
  galleryOffset.value = Math.min(Math.max(0, topMenus.value.length - maxVisible.value), galleryOffset.value + maxVisible.value);
  setTimeout(() => (slideDirection.value = ""), 400);
}

// 多级悬浮子菜单链（向上堆叠）
const submenuChain = ref<any[][]>([]);
let hoverTimer: any = null;
function clearHoverSoon() {
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => (submenuChain.value = []), 150);
}
function cancelClear() {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
}
function onTopEnter(menu: any) {
  cancelClear();
  submenuChain.value = [];
  const children = Array.isArray(menu?.children) ? menu.children.filter((c: any) => c?.meta?.showLink !== false) : [];
  if (children.length) submenuChain.value = [children];
}
function onTopLeave() {
  clearHoverSoon();
}
function onSubEnter(level: number, item: any) {
  cancelClear();
  const next = Array.isArray(item?.children) ? item.children.filter((c: any) => c?.meta?.showLink !== false) : [];
  const newChain = submenuChain.value.slice(0, level + 1);
  if (next.length) newChain[level + 1] = next;
  submenuChain.value = newChain;
}
function onSubsLeave() {
  clearHoverSoon();
}
onBeforeUnmount(() => {
  if (hoverTimer) clearTimeout(hoverTimer);
});

function openMenu(path: string) {
  router.push(path);
}
</script>

<template>
  <section :class="[fixedHeader ? 'app-main' : 'app-main-nofixed-header']" :style="getSectionStyle">
    <router-view :key="$route.fullPath">
      <template #default="{ Component, route }">
        <LayFrame :currComp="Component" :currRoute="route">
          <template #default="{ Comp, fullPath, frameInfo }">
            <el-scrollbar
              v-if="fixedHeader"
              :wrap-style="{
                display: 'flex',
                'flex-wrap': 'wrap',
                'max-width': getMainWidth,
                margin: '0 auto',
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }"
              :view-style="{
                display: 'flex',
                flex: 'auto',
                overflow: 'hidden',
                'flex-direction': 'column',
              }"
            >
              <el-backtop :title="t('buttons.pureBackTop')" target=".app-main .el-scrollbar__wrap" />
              <div class="grow bg-layout">
                <!-- 卡片导航模式：显示菜单画廊 -->
                <div v-if="isCardLayout" class="card-gallery" :style="{ padding: contentMargin + 'px' }">
                  <button v-if="topMenus.length > maxVisible" class="gallery-arrow left" @mouseenter="cancelClear" @mouseleave="onSubsLeave" @click="prevPage">‹</button>
                  <div class="card-grid center-5" :class="[slideDirection ? 'slide-' + slideDirection : '']" @mouseenter="cancelClear" @mouseleave="onTopLeave">
                    <div v-for="menu in visibleMenus" :key="menu.path || menu.meta?.title" class="menu-card card-3d" @mouseenter="onTopEnter(menu)" @click="menu.path ? openMenu(menu.path) : null">
                      <div class="menu-card-body">
                        <div class="menu-card-icon">
                          <i v-if="menu.meta?.icon" :class="menu.meta.icon" />
                        </div>
                        <div class="menu-card-title">{{ menu.meta?.title }}</div>
                        <div class="menu-card-desc" v-if="menu.meta?.description">{{ menu.meta.description }}</div>
                      </div>
                    </div>
                  </div>
                  <button v-if="topMenus.length > maxVisible" class="gallery-arrow right" @mouseenter="cancelClear" @mouseleave="onSubsLeave" @click="nextPage">›</button>

                  <!-- 悬浮多级子菜单，向上堆叠 -->
                  <div v-if="submenuChain.length" class="submenu-stack" @mouseenter="cancelClear" @mouseleave="onSubsLeave">
                    <div v-for="(level, idx) in submenuChain" :key="idx" class="submenu-level" :style="{ bottom: 16 + idx * 56 + 'px' }">
                      <div v-for="item in level" :key="(item.path || item.meta?.title) + idx" class="submenu-item" @mouseenter="onSubEnter(idx, item)" @click.stop="item.path && openMenu(item.path)">
                        <span class="submenu-title">{{ item.meta?.title }}</span>
                        <span class="submenu-arrow" v-if="item.children?.length">›</span>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 非卡片模式：按原逻辑渲染 -->
                <template v-else>
                  <el-card
                    v-if="cardBody"
                    class="layout sidebar-custom"
                    shadow="never"
                    :style="{
                      height: 'calc(100% - ' + contentMargin * 2 + 'px)',
                      'border-radius': layoutRadius + 'px  !important',
                      margin: contentMargin + 'px',
                    }"
                  >
                    <transitionMain :route="route">
                      <keep-alive v-if="isKeepAlive" :include="usePermissionStoreHook().cachePageList">
                        <component :is="Comp" :key="fullPath" :frameInfo="frameInfo" class="main-content" />
                      </keep-alive>
                      <component :is="Comp" v-else :key="fullPath" :frameInfo="frameInfo" class="main-content" />
                    </transitionMain>
                  </el-card>
                  <div
                    v-else
                    class="h-full layout sidebar-custom"
                    shadow="never"
                    :style="{
                      margin: contentMargin + 'px',
                      height: 'calc(100% - ' + contentMargin * 2 + 'px)',
                      'border-radius': layoutRadius + 'px !important',
                    }"
                  >
                    <transitionMain :route="route">
                      <keep-alive v-if="isKeepAlive" :include="usePermissionStoreHook().cachePageList">
                        <component :is="Comp" :key="fullPath" :frameInfo="frameInfo" class="main-content" :style="{ 'border-radius': layoutRadius + 'px' }" />
                      </keep-alive>
                      <component :is="Comp" v-else :key="fullPath" :frameInfo="frameInfo" class="main-content" :style="{ 'border-radius': layoutRadius + 'px' }" />
                    </transitionMain>
                  </div>
                </template>
              </div>

              <LayFooter v-if="!hideFooter && !isCardLayout" />
            </el-scrollbar>
            <div v-else class="grow bg-layout">
              <!-- 卡片导航模式：显示菜单画廊 -->
              <div v-if="isCardLayout" class="card-gallery" :style="{ padding: contentMargin + 'px', 'min-height': 'calc(100% - ' + contentMargin * 2 + 'px)' }">
                <button v-if="topMenus.length > maxVisible" class="gallery-arrow left" @mouseenter="cancelClear" @mouseleave="onSubsLeave" @click="prevPage">‹</button>
                <div class="card-grid center-5" :class="[slideDirection ? 'slide-' + slideDirection : '']" @mouseenter="cancelClear" @mouseleave="onTopLeave">
                  <div v-for="menu in visibleMenus" :key="menu.path || menu.meta?.title" class="menu-card card-3d" @mouseenter="onTopEnter(menu)" @click="menu.path ? openMenu(menu.path) : null">
                    <div class="menu-card-body">
                      <div class="menu-card-icon">
                        <i v-if="menu.meta?.icon" :class="menu.meta.icon" />
                      </div>
                      <div class="menu-card-title">{{ menu.meta?.title }}</div>
                      <div class="menu-card-desc" v-if="menu.meta?.description">{{ menu.meta.description }}</div>
                    </div>
                  </div>
                </div>
                <button v-if="topMenus.length > maxVisible" class="gallery-arrow right" @mouseenter="cancelClear" @mouseleave="onSubsLeave" @click="nextPage">›</button>

                <!-- 悬浮多级子菜单，向上堆叠 -->
                <div v-if="submenuChain.length" class="submenu-stack" @mouseenter="cancelClear" @mouseleave="onSubsLeave">
                  <div v-for="(level, idx) in submenuChain" :key="idx" class="submenu-level" :style="{ bottom: 16 + idx * 56 + 'px' }">
                    <div v-for="item in level" :key="(item.path || item.meta?.title) + idx" class="submenu-item" @mouseenter="onSubEnter(idx, item)" @click.stop="item.path && openMenu(item.path)">
                      <span class="submenu-title">{{ item.meta?.title }}</span>
                      <span class="submenu-arrow" v-if="item.children?.length">›</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 非卡片模式：按原逻辑渲染 -->
              <template v-else>
                <el-card
                  v-if="cardBody"
                  class="h-full layout sidebar-custom"
                  shadow="never"
                  :style="{
                    height: 'calc(100% - ' + contentMargin * 2 + 'px)',
                    'border-radius': layoutRadius + 'px  !important',
                    margin: contentMargin + 'px',
                  }"
                >
                  <transitionMain :route="route">
                    <keep-alive v-if="isKeepAlive" :include="usePermissionStoreHook().cachePageList">
                      <component :is="Comp" :key="fullPath" :frameInfo="frameInfo" class="main-content" />
                    </keep-alive>
                    <component :is="Comp" v-else :key="fullPath" :frameInfo="frameInfo" class="main-content" />
                  </transitionMain>
                </el-card>
                <div
                  v-else
                  class="h-full layout sidebar-custom"
                  shadow="never"
                  :style="{
                    height: 'calc(100% - ' + contentMargin * 2 + 'px)',
                    margin: contentMargin + 'px',
                    'border-radius': layoutRadius + 'px  !important',
                  }"
                >
                  <transitionMain :route="route">
                    <keep-alive v-if="isKeepAlive" :include="usePermissionStoreHook().cachePageList">
                      <component :is="Comp" :key="fullPath" :frameInfo="frameInfo" class="main-content" :style="{ 'border-radius': layoutRadius + 'px' }" />
                    </keep-alive>
                    <component :is="Comp" v-else :key="fullPath" :frameInfo="frameInfo" class="main-content" :style="{ 'border-radius': layoutRadius + 'px' }" />
                  </transitionMain>
                </div>
              </template>
            </div>
          </template>
        </LayFrame>
      </template>
    </router-view>

    <!-- 页脚 -->
    <LayFooter v-if="!hideFooter && !fixedHeader" />
  </section>
</template>

<style lang="scss" scoped>
.sidebar-custom {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-card-border-color);
  border-radius: var(--el-card-border-radius);
  color: var(--el-text-color-primary);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(0, 0, 0, 0.02);

  .dark & {
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.15),
      0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.card-gallery {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

/* 中心展示5个时的布局，容器两侧给箭头留空 */
.card-grid.center-5 {
  grid-template-columns: repeat(5, 200px);
  justify-content: center;
  justify-items: center;
  align-items: center;
}

/* 切换动画：左右滑动 */
.card-grid.slide-left {
  animation: slide-left 0.4s ease;
}
.card-grid.slide-right {
  animation: slide-right 0.4s ease;
}
@keyframes slide-left {
  from {
    transform: translateX(24px);
    opacity: 0.6;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes slide-right {
  from {
    transform: translateX(-24px);
    opacity: 0.6;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.menu-card {
  border-radius: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    transform: translateY(-6px) scale(1.03) rotateX(2deg) rotateY(-2deg);
    box-shadow: 0 18px 40px rgba(17, 24, 39, 0.16);
    border-color: var(--el-color-primary-light-6);
  }
}

/* 3D 透视效果 */
.card-3d {
  transform-style: preserve-3d;
  perspective: 800px;
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.95));
}
.dark .card-3d {
  background-image: linear-gradient(180deg, rgba(24, 24, 28, 0.8), rgba(22, 22, 26, 0.95));
}

.menu-card-body {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  min-height: 140px;
}

.menu-card-icon {
  font-size: 28px;
  margin-bottom: 12px;
  color: var(--el-color-primary);
}

.menu-card-title {
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  font-size: 16px;
}

.menu-card-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 左右切换箭头 */
.gallery-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  z-index: 4;
}
.gallery-arrow.left {
  left: 12px;
}
.gallery-arrow.right {
  right: 12px;
}

/* 多级子菜单向上堆叠 */
.submenu-stack {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  z-index: 5;
}
.submenu-level {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  padding: 6px;
  display: flex;
  gap: 6px;
}
.submenu-item {
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-primary);
}
.submenu-item:hover {
  background: var(--el-color-primary-light-9);
}
.submenu-title {
  font-size: 12px;
  font-weight: 500;
}
.submenu-arrow {
  color: var(--el-text-color-secondary);
}

.app-main {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
  background: linear-gradient(135deg, rgba(245, 247, 250, 0.8), rgba(240, 242, 245, 0.9));

  .dark & {
    background: linear-gradient(135deg, rgba(22, 24, 29, 0.8), rgba(26, 28, 35, 0.9));
  }
}

.app-main-nofixed-header {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: linear-gradient(135deg, rgba(245, 247, 250, 0.8), rgba(240, 242, 245, 0.9));
  backdrop-filter: blur(20px);

  .dark & {
    background: linear-gradient(135deg, rgba(22, 24, 29, 0.8), rgba(26, 28, 35, 0.9));
  }
}

.main-content {
  height: 100%;
  position: relative;
  // padding: 0px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-card__body) {
  height: calc(100% - 0px);
}

.bg-layout {
  --un-bg-opacity: 1;
  background-color: rgb(var(--layout-bg-color) / var(--un-bg-opacity));
  transition: background-color 0.3s;

  .layout {
    border-radius: var(--layoutRadius, 6px) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow:
        0 6px 24px rgba(0, 0, 0, 0.05),
        0 2px 8px rgba(0, 0, 0, 0.03);

      .dark & {
        box-shadow:
          0 6px 24px rgba(0, 0, 0, 0.2),
          0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

:deep(.el-backtop) {
  background-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.4);
  border-radius: 50%;
  color: white;
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

:deep(.fade-transform-enter-active),
:deep(.fade-transform-leave-active) {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

:deep(.fade-transform-enter-from) {
  opacity: 0;
  transform: translateY(20px);
}

:deep(.fade-transform-leave-to) {
  opacity: 0;
  transform: translateY(-20px);
}
</style>

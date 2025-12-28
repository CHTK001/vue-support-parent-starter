<script setup lang="ts">
/**
 * 新春灯笼主题专属标签组件（内测版）
 * 深度定制：灯笼样式标签、烟花粒子、祥云背景、金色装饰
 * @author CH
 * @version 2.0.0
 */
import { $t } from "@repo/config";
import {
  emitter,
  getTopMenu,
  handleAliveRoute,
  useMultiTagsStoreHook,
  useSettingStoreHook,
} from "@repo/core";
import { RouteConfigs } from "../../../types";
import { useTags } from "../../../hooks/useTag";
import { routerArrays } from "../../../types";
import { onClickOutside } from "@vueuse/core";
import { usePermissionStoreHook } from "@repo/core";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRaw, unref, watch } from "vue";
import {
  delay,
  isAllEmpty,
  isEqual,
  useGlobal,
  useResizeObserver,
} from "@pureadmin/utils";
import { useDefer } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

import ArrowDown from "@iconify-icons/ri/arrow-down-s-line";
import ArrowRightSLine from "@iconify-icons/ri/arrow-right-s-line";
import ArrowLeftSLine from "@iconify-icons/ri/arrow-left-s-line";

const {
  Close,
  route,
  router,
  visible,
  showTags,
  instance,
  multiTags,
  tagsViews,
  buttonTop,
  buttonLeft,
  translateX,
  isFixedTag,
  pureSetting,
  activeIndex,
  getTabStyle,
  isScrolling,
  iconIsActive,
  linkIsActive,
  currentSelect,
  getContextMenuStyle,
  closeMenu,
  onMounted: onTagMounted,
  onMouseenter,
  onMouseleave,
  transformI18n,
  onContentFullScreen,
} = useTags();

const tabDom = ref();
const containerDom = ref();
const scrollbarDom = ref();
const contextmenuRef = ref();
const isShowArrow = ref(false);
const topPath = getTopMenu()?.path;
const { VITE_HIDE_HOME } = import.meta.env;
const { $storage } = useGlobal<GlobalPropertiesApi>();

// 标签页是否显示图标
const showTagIcon = ref($storage.configure?.showTagIcon ?? false);

// 提取 store 到顶层避免重复调用
const multiTagsStore = useMultiTagsStoreHook();
const permissionStore = usePermissionStoreHook();

// 烟花粒子状态
const fireworksParticles = ref<Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>>([]);
const lanternSwing = ref(false);

// 生成烟花粒子
function generateFireworks() {
  const colors = ['#ff4d4f', '#ffd700', '#ff6b6b', '#ffa940', '#ff85c0'];
  const particles: typeof fireworksParticles.value = [];
  for (let i = 0; i < 20; i++) {
    particles.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 2,
      delay: Math.random() * 3,
    });
  }
  fireworksParticles.value = particles;
}

// 监听标签图标设置变化
emitter.on("showTagIconChange", (val: boolean) => {
  showTagIcon.value = val;
});

const fixedTags = [
  ...routerArrays,
  ...permissionStore.flatteningRoutes.filter((v) => v?.meta?.fixedTag),
];

const dynamicTagView = async () => {
  await nextTick();
  let index = multiTags.value.findIndex((item) => {
    if (!isAllEmpty(route.query) && Object.keys(route.query).length > 0) {
      return isEqual(route.query, item.query) && route.path === item.path;
    } else if (
      !isAllEmpty(route.params) &&
      Object.keys(route.params).length > 0
    ) {
      return isEqual(route.params, item.params) && route.path === item.path;
    } else {
      return route.path === item.path;
    }
  });

  if (index === -1 && multiTags.value.length > 0) {
    index = multiTags.value.length - 1;
  }

  moveToView(index);
};

const moveToView = async (index: number): Promise<void> => {
  await nextTick();
  const tabNavPadding = 10;
  if (!instance.refs["dynamic" + index] || index < 0) return;
  const tabItemEl = instance.refs["dynamic" + index][0];
  if (!tabItemEl) return;

  const tabItemElOffsetLeft = (tabItemEl as HTMLElement)?.offsetLeft;
  const tabItemOffsetWidth = (tabItemEl as HTMLElement)?.offsetWidth;
  const scrollbarDomWidth = scrollbarDom.value
    ? scrollbarDom.value?.offsetWidth
    : 0;
  const tabDomWidth = tabDom.value ? tabDom.value?.offsetWidth : 0;

  scrollbarDomWidth <= tabDomWidth
    ? (isShowArrow.value = true)
    : (isShowArrow.value = false);
  if (tabDomWidth < scrollbarDomWidth || tabItemElOffsetLeft === 0) {
    translateX.value = 0;
  } else if (tabItemElOffsetLeft < -translateX.value) {
    translateX.value = -tabItemElOffsetLeft + tabNavPadding;
  } else if (
    tabItemElOffsetLeft > -translateX.value &&
    tabItemElOffsetLeft + tabItemOffsetWidth <
      -translateX.value + scrollbarDomWidth
  ) {
    translateX.value = Math.min(
      0,
      scrollbarDomWidth -
        tabItemOffsetWidth -
        tabItemElOffsetLeft -
        tabNavPadding
    );
  } else {
    translateX.value = -(
      tabItemElOffsetLeft -
      (scrollbarDomWidth - tabNavPadding - tabItemOffsetWidth)
    );
  }
};

const handleScroll = (offset: number): void => {
  const scrollbarDomWidth = scrollbarDom.value
    ? scrollbarDom.value?.offsetWidth
    : 0;
  const tabDomWidth = tabDom.value ? tabDom.value.offsetWidth : 0;
  if (offset > 0) {
    translateX.value = Math.min(0, translateX.value + offset);
  } else {
    if (scrollbarDomWidth < tabDomWidth) {
      if (translateX.value >= -(tabDomWidth - scrollbarDomWidth)) {
        translateX.value = Math.max(
          translateX.value + offset,
          scrollbarDomWidth - tabDomWidth
        );
      }
    } else {
      translateX.value = 0;
    }
  }
  isScrolling.value = false;
};

const handleWheel = (event: WheelEvent): void => {
  isScrolling.value = true;
  const scrollIntensity = Math.abs(event.deltaX) + Math.abs(event.deltaY);
  let offset = 0;
  if (event.deltaX < 0) {
    offset = scrollIntensity > 0 ? scrollIntensity : 100;
  } else {
    offset = scrollIntensity > 0 ? -scrollIntensity : -100;
  }
  handleScroll(offset);
};

function dynamicRouteTag(value: string): void {
  const hasValue = multiTags.value.some((item) => {
    return item.path === value;
  });

  function concatPath(arr: object[], value: string) {
    if (!hasValue) {
      arr.forEach((arrItem: any) => {
        if (arrItem.path === value) {
          multiTagsStore.handleTags("push", {
            path: value,
            parentPath: arrItem.parentPath,
            meta: arrItem.meta,
            name: arrItem.name,
            query: route.query,
            params: route.params,
          });
        }
      });
    }
  }
  concatPath(permissionStore.flatteningRoutes, value);
}

function deleteMenu(item: RouteConfigs, tag?: string): void {
  handleAliveRoute(item);
  multiTagsStore.handleTags("splice", "", {
    startIndex: multiTags.value.findIndex((v) => v.path === item.path),
    deleteCount: 1,
  });
}

function showMenuModel(value: string): void {
  if (VITE_HIDE_HOME === "true" && value === "/welcome") return;
  dynamicRouteTag(value);
}

function selectTag(key: number, item: any): void {
  closeMenu();
  if (!item?.show) return;

  const currentPath = currentSelect.value?.path;
  switch (key) {
    case 0:
      router.push(currentPath);
      break;
    case 1:
      router.push(currentPath);
      window.location.reload();
      break;
    case 2:
      deleteMenu(currentSelect.value as RouteConfigs);
      break;
    case 3:
      closeOther(currentSelect.value as RouteConfigs);
      break;
    case 4:
      closeLeft(currentSelect.value as RouteConfigs);
      break;
    case 5:
      closeRight(currentSelect.value as RouteConfigs);
      break;
    case 6:
      closeAll();
      break;
    case 7:
      onContentFullScreen();
      break;
  }
}

function closeOther(item: RouteConfigs): void {
  handleAliveRoute(item, "others");
  multiTagsStore.handleTags("equal", "", {
    path: item.path,
    meta: item.meta,
  });
}

function closeLeft(item: RouteConfigs): void {
  handleAliveRoute(item, "left");
  multiTagsStore.handleTags("left", "", {
    path: item.path,
    meta: item.meta,
  });
}

function closeRight(item: RouteConfigs): void {
  handleAliveRoute(item, "right");
  multiTagsStore.handleTags("right", "", {
    path: item.path,
    meta: item.meta,
  });
}

function closeAll(): void {
  const homeRoute = multiTags.value.find((item) => item.path === "/welcome");
  if (homeRoute) {
    router.push("/welcome");
  }
  handleAliveRoute(route as RouteConfigs, "all");
  multiTagsStore.handleTags("deleteCache");
  multiTagsStore.handleTags("splice");
}

function handleCommand({ key, item }) {
  selectTag(key, item);
}

function openMenu(tag: any, e: MouseEvent): void {
  if (visible.value) {
    closeMenu();
    return;
  }

  currentSelect.value = tag;
  const menuMinWidth = 140;
  const offsetLeft = unref(containerDom).getBoundingClientRect().left;
  const offsetWidth = unref(containerDom).offsetWidth;
  const maxLeft = offsetWidth - menuMinWidth;
  const left = e.clientX - offsetLeft + 5;
  if (left > maxLeft) {
    buttonLeft.value = maxLeft;
  } else {
    buttonLeft.value = left;
  }
  useSettingStoreHook().hiddenSideBar
    ? (buttonTop.value = e.clientY)
    : (buttonTop.value = e.clientY - 40);
  nextTick(() => {
    visible.value = true;
  });
}

function tagOnClick(item) {
  // 触发灯笼摆动动画
  lanternSwing.value = true;
  setTimeout(() => {
    lanternSwing.value = false;
  }, 500);
  
  const { name, path } = item;
  if (name) {
    if (item.query) {
      router.push({
        name,
        query: item.query,
      });
    } else if (item.params) {
      router.push({
        name,
        params: item.params,
      });
    } else {
      router.push({ name });
    }
  } else {
    router.push({ path });
  }
}

onClickOutside(contextmenuRef, closeMenu, {
  detectIframe: true,
});

watch(route, () => {
  if (route.path.startsWith('/redirect')) return;
  
  activeIndex.value = -1;
  dynamicRouteTag(route.path);
  dynamicTagView();
});

onMounted(() => {
  if (!instance) return;

  // 生成烟花粒子
  generateFireworks();

  showMenuModel(route.fullPath);
  emitter.off("tagViewsChange");
  emitter.off("changLayoutRoute");
  
  emitter.on("tagViewsChange", (key: any) => {
    if (unref(showTags as any) === key) return;
    (showTags as any).value = key;
  });

  emitter.on("changLayoutRoute", (indexPath) => {
    dynamicRouteTag(indexPath);
    setTimeout(() => {
      showMenuModel(indexPath);
    });
  });

  useResizeObserver(scrollbarDom, dynamicTagView);
  delay().then(() => dynamicTagView());
});

onBeforeUnmount(() => {
  emitter.off("showTagIconChange");
});

const defer = useDefer(multiTags?.length);
const deferTag = useDefer(tagsViews?.length);
</script>

<template>
  <div v-if="!showTags" ref="containerDom" class="tags-view lunar-spring-tag">
    <!-- 烟花粒子背景 -->
    <div class="fireworks-container">
      <div 
        v-for="particle in fireworksParticles" 
        :key="particle.id"
        class="firework-particle"
        :style="{
          left: particle.x + '%',
          top: particle.y + '%',
          backgroundColor: particle.color,
          width: particle.size + 'px',
          height: particle.size + 'px',
          animationDelay: particle.delay + 's',
        }"
      />
    </div>
    
    <!-- 祥云装饰 -->
    <div class="cloud-decoration cloud-left"></div>
    <div class="cloud-decoration cloud-right"></div>
    
    <span v-show="isShowArrow" class="arrow-left lunar-arrow">
      <IconifyIconOffline :icon="ArrowLeftSLine" @click="handleScroll(200)" />
    </span>
    <div
      ref="scrollbarDom"
      class="scroll-container"
      @wheel.prevent="handleWheel"
    >
      <div ref="tabDom" class="tab select-none" :style="getTabStyle">
        <!-- 灯笼样式标签 -->
        <div
          v-for="(item, index) in multiTags"
          :ref="'dynamic' + index"
          :key="index"
          :class="[
            'scroll-item is-closable lantern-item',
            linkIsActive(item),
            isFixedTag(item) && 'fixed-tag',
            lanternSwing && linkIsActive(item) === 'is-active' && 'lantern-swing',
          ]"
          @contextmenu.prevent="openMenu(item, $event)"
          @mouseenter.prevent="onMouseenter(index)"
          @mouseleave.prevent="onMouseleave(index)"
          @click="tagOnClick(item)"
        >
          <!-- 灯笼顶部装饰 -->
          <div class="lantern-top"></div>
          <!-- 灯笼主体 -->
          <div class="lantern-body">
            <component
              v-if="showTagIcon && item.meta?.icon"
              :is="useRenderIcon(item.meta.icon)"
              class="tag-icon"
            />
            <span class="tag-title">
              {{ transformI18n(item.meta.title) }}
            </span>
          </div>
          <!-- 灯笼底部流苏 -->
          <div class="lantern-tassel"></div>
          <!-- 关闭按钮 -->
          <span
            v-if="
              isFixedTag(item)
                ? false
                : iconIsActive(item, index) ||
                  (index === activeIndex && index !== 0)
            "
            class="el-icon-close lantern-close"
            @click.stop="deleteMenu(item)"
          >
            <IconifyIconOffline :icon="Close" />
          </span>
        </div>
      </div>
    </div>
    <span v-show="isShowArrow" class="arrow-right lunar-arrow">
      <IconifyIconOffline :icon="ArrowRightSLine" @click="handleScroll(-200)" />
    </span>
    
    <!-- 右键菜单 -->
    <ul
      v-show="visible"
      ref="contextmenuRef"
      :key="Math.random()"
      :style="getContextMenuStyle"
      class="contextmenu lunar-contextmenu"
    >
      <div
        v-for="(item, key) in tagsViews.slice(0, 6)"
        :key="key"
        style="display: flex; align-items: center"
      >
        <li v-if="item.show" @click="selectTag(key, item)">
          <IconifyIconOffline :icon="item.icon" />
          {{ transformI18n(item.text) }}
        </li>
      </div>
    </ul>
    
    <!-- 右侧功能按钮 -->
    <el-dropdown
      trigger="click"
      placement="bottom-end"
      popper-class="tag-function-dropdown-popper lunar-dropdown"
      @command="handleCommand"
    >
      <span class="arrow-down lunar-arrow-down">
        <IconifyIconOffline :icon="ArrowDown" class="dark:text-white" />
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <span v-for="(item, key) in tagsViews" :key="key">
            <el-dropdown-item
              v-if="deferTag(key)"
              :key="key"
              :command="{ key, item }"
              :divided="item.divided"
              :disabled="item.disabled"
            >
              <IconifyIconOffline :icon="item.icon" />
              {{ transformI18n(item.text) }}
            </el-dropdown-item>
          </span>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style lang="scss" scoped>
.tags-view {
  position: relative;
  overflow: visible !important;
  z-index: 0;
}

// 烟花粒子容器
.fireworks-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.firework-particle {
  position: absolute;
  border-radius: 50%;
  animation: firework-twinkle 2s ease-in-out infinite;
  opacity: 0;
}

@keyframes firework-twinkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2);
  }
}

// 祥云装饰
.cloud-decoration {
  position: absolute;
  width: 60px;
  height: 30px;
  background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  
  &::before, &::after {
    content: '';
    position: absolute;
    background: inherit;
    border-radius: 50%;
  }
  
  &.cloud-left {
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  &.cloud-right {
    right: 60px;
    top: 50%;
    transform: translateY(-50%);
  }
}

// 灯笼标签样式
.lantern-item {
  position: relative;
  display: inline-flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 8px !important;
  cursor: pointer;
  transition: transform 0.3s ease;
  z-index: 1;
  
  // 灯笼顶部（挂钩）
  .lantern-top {
    width: 20px;
    height: 6px;
    background: linear-gradient(180deg, #ffd700 0%, #daa520 100%);
    border-radius: 3px 3px 0 0;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: -4px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      border: 2px solid #ffd700;
      border-radius: 50%;
      background: transparent;
    }
  }
  
  // 灯笼主体
  .lantern-body {
    background: linear-gradient(180deg, #ff4d4f 0%, #cf1322 50%, #a8071a 100%);
    border: 2px solid #ffd700;
    border-radius: 8px;
    padding: 8px 16px;
    min-width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-shadow: 
      0 0 10px rgba(255, 77, 79, 0.5),
      inset 0 0 20px rgba(255, 215, 0, 0.1);
    position: relative;
    
    // 灯笼横条装饰
    &::before, &::after {
      content: '';
      position: absolute;
      left: 4px;
      right: 4px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #ffd700 20%, #ffd700 80%, transparent);
    }
    
    &::before {
      top: 4px;
    }
    
    &::after {
      bottom: 4px;
    }
  }
  
  // 灯笼流苏
  .lantern-tassel {
    width: 4px;
    height: 12px;
    background: linear-gradient(180deg, #ffd700 0%, #ff4d4f 100%);
    border-radius: 0 0 2px 2px;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      background: radial-gradient(circle, #ffd700 30%, transparent 70%);
    }
  }
  
  .tag-title {
    color: #fff5e6;
    font-weight: 600;
    font-size: 13px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .tag-icon {
    color: #ffd700;
    font-size: 14px;
  }
  
  // 关闭按钮
  .lantern-close {
    position: absolute;
    top: 6px;
    right: -6px;
    width: 16px;
    height: 16px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 10px;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 2;
    
    &:hover {
      background: #ff4d4f;
    }
  }
  
  &:hover {
    transform: translateY(-2px);
    
    .lantern-close {
      opacity: 1;
    }
    
    .lantern-body {
      box-shadow: 
        0 0 20px rgba(255, 77, 79, 0.7),
        0 0 40px rgba(255, 215, 0, 0.3),
        inset 0 0 20px rgba(255, 215, 0, 0.2);
    }
  }
  
  // 激活状态
  &.is-active, &.active {
    .lantern-body {
      background: linear-gradient(180deg, #ffd700 0%, #faad14 50%, #d48806 100%);
      border-color: #ff4d4f;
      box-shadow: 
        0 0 25px rgba(255, 215, 0, 0.8),
        0 0 50px rgba(255, 77, 79, 0.4),
        inset 0 0 30px rgba(255, 255, 255, 0.2);
    }
    
    .tag-title {
      color: #8b0000;
      text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
    }
    
    .tag-icon {
      color: #8b0000;
    }
  }
  
  // 固定标签
  &.fixed-tag {
    .lantern-top::after {
      content: '★';
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      color: #ffd700;
      font-size: 10px;
    }
  }
}

// 灯笼摆动动画
.lantern-swing {
  animation: lantern-swing 0.5s ease-in-out;
}

@keyframes lantern-swing {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

// 箭头按钮
.lunar-arrow {
  background: linear-gradient(180deg, #ff4d4f, #cf1322) !important;
  color: #ffd700 !important;
  border: 1px solid #ffd700 !important;
  border-radius: 4px;
  
  &:hover {
    background: linear-gradient(180deg, #ffd700, #faad14) !important;
    color: #8b0000 !important;
  }
}

.lunar-arrow-down {
  background: linear-gradient(180deg, #ff4d4f, #cf1322) !important;
  color: #ffd700 !important;
  border: 1px solid #ffd700 !important;
  border-radius: 4px;
  padding: 4px;
  
  &:hover {
    background: linear-gradient(180deg, #ffd700, #faad14) !important;
    color: #8b0000 !important;
  }
}

// 右键菜单
.lunar-contextmenu {
  background: linear-gradient(180deg, #fff5e6, #ffe4b5) !important;
  border: 2px solid #ff4d4f !important;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(255, 77, 79, 0.3) !important;
  
  li {
    cursor: pointer;
    color: #8b0000;
    
    &:hover {
      background: linear-gradient(90deg, #ff4d4f, #cf1322) !important;
      color: #ffd700 !important;
    }
  }
}
</style>

<style lang="scss">
@use './default.scss';
@use './lunar-spring-festival.css';
</style>

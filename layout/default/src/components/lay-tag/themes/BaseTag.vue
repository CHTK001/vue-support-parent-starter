<script setup lang="ts">
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
import TagChrome from "../components/TagChrome.vue";
import { usePermissionStoreHook } from "@repo/core";
import { computed, nextTick, onBeforeUnmount, ref, toRaw, unref, watch } from "vue";
import {
  delay,
  isAllEmpty,
  isEqual,
  useGlobal,
  useResizeObserver,
} from "@pureadmin/utils";
import { useDefer } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import CloseIcon from "@iconify-icons/ep/close";

// 接收主题类名和背景配置
const props = defineProps<{
  themeClass?: string;
  /** 是否使用自定义背景插槽 */
  useCustomBackground?: boolean;
}>();

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
  showModel,
  translateX,
  isFixedTag,
  pureSetting,
  activeIndex,
  getTabStyle,
  isScrolling,
  iconIsActive,
  linkIsActive,
  currentSelect,
  scheduleIsActive,
  getContextMenuStyle,
  closeMenu,
  onMounted,
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

// 监听标签图标设置变化
emitter.on("showTagIconChange", (val: boolean) => {
  showTagIcon.value = val;
});

// 提取 store 到顶层避免重复调用
const multiTagsStore = useMultiTagsStoreHook();
const permissionStore = usePermissionStoreHook();

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
  const scrollbar = unref(scrollbarDom);
  const scrollbarDomWidth = scrollbar ? scrollbar.offsetWidth : 0;
  const scrollbarScrollLeft = scrollbar ? scrollbar.scrollLeft : 0;

  if (scrollbar.scrollWidth > scrollbarDomWidth) {
    isShowArrow.value = true;
  } else {
    isShowArrow.value = false;
  }

  if (tabItemElOffsetLeft < scrollbarScrollLeft) {
    scrollbar.scrollTo({
      left: tabItemElOffsetLeft,
      behavior: "smooth",
    });
  } else if (
    tabItemElOffsetLeft + tabItemOffsetWidth >
    scrollbarScrollLeft + scrollbarDomWidth
  ) {
    scrollbar.scrollTo({
      left: tabItemElOffsetLeft + tabItemOffsetWidth - scrollbarDomWidth,
      behavior: "smooth",
    });
  }
};

const handleScroll = (offset: number): void => {
  const scrollbar = unref(scrollbarDom);
  if (!scrollbar) return;
  
  const currentScrollLeft = scrollbar.scrollLeft;
  const targetScrollLeft = currentScrollLeft + offset;
  
  scrollbar.scrollTo({
    left: targetScrollLeft,
    behavior: "smooth",
  });
};

const handleWheel = (event: WheelEvent): void => {
  const scrollbar = unref(scrollbarDom);
  if (!scrollbar) return;
  
  const scrollWidth = scrollbar.scrollWidth;
  const clientWidth = scrollbar.clientWidth;
  
  // 只有当内容溢出时才处理滚轮事件
  if (scrollWidth > clientWidth) {
     if (Math.abs(event.deltaX) > 0) {
       scrollbar.scrollLeft += event.deltaX;
     } else {
       scrollbar.scrollLeft += event.deltaY;
     }
  }
};

// 取消平滑滚动动画，使用即时滚动

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
            meta: arrItem.meta,
            name: arrItem.name,
            query: route.query,
            params: route.params,
          });
          nextTick(() => {
            dynamicTagView();
          });
        } else {
          if (arrItem.children && arrItem.children.length > 0) {
            concatPath(arrItem.children, value);
          }
        }
      });
    }
  }
  concatPath(router.options.routes as any, value);
}

function onFresh(tag?: any) {
  const targetRoute = tag || unref(route);
  const fullPath = targetRoute.path || targetRoute.fullPath;
  const query = targetRoute.query || {};
  
  router.replace({
    path: "/redirect" + fullPath,
    query,
  });
  handleAliveRoute((tag || route) as ToRouteType, "refresh");
}

function deleteDynamicTag(obj: any, current: any, tag?: string) {
  const valueIndex: number = multiTags.value.findIndex((item: any) => {
    if (item.query) {
      if (item.path === obj.path) {
        return isEqual(item.query, obj.query);
      }
    } else if (item.params) {
      if (item.path === obj.path) {
        return isEqual(item.params, obj.params);
      }
    } else {
      return item.path === obj.path;
    }
  });

  const spliceRoute = (
    startIndex?: number,
    length?: number,
    other?: boolean
  ): void => {
    if (other) {
      multiTagsStore.handleTags(
        "equal",
        [
          VITE_HIDE_HOME === "false" ? fixedTags : toRaw(getTopMenu()),
          obj,
        ].flat()
      );
    } else {
      multiTagsStore.handleTags("splice", "", {
        startIndex,
        length,
      }) as any;
    }
    dynamicTagView();
  };

  if (tag === "other") {
    spliceRoute(1, 1, true);
  } else if (tag === "left") {
    spliceRoute(fixedTags.length, valueIndex - 1, true);
  } else if (tag === "right") {
    spliceRoute(valueIndex + 1, multiTags.value.length);
  } else {
    spliceRoute(valueIndex, 1);
  }
  const newRoute = multiTagsStore.handleTags("slice");
  if (current === route.path) {
    if (tag === "left") return;
    if (newRoute[0]?.query) {
      router.push({ name: newRoute[0].name, query: newRoute[0].query });
    } else if (newRoute[0]?.params) {
      router.push({ name: newRoute[0].name, params: newRoute[0].params });
    } else {
      router.push({ path: newRoute[0].path });
    }
  } else {
    if (!multiTags.value.length) return;
    if (multiTags.value.some((item) => item.path === route.path)) return;
    if (newRoute[0]?.query) {
      router.push({ name: newRoute[0].name, query: newRoute[0].query });
    } else if (newRoute[0]?.params) {
      router.push({ name: newRoute[0].name, params: newRoute[0].params });
    } else {
      router.push({ path: newRoute[0].path });
    }
  }
}

function deleteMenu(item, tag?: string) {
  deleteDynamicTag(item, item.path, tag);
  handleAliveRoute(route as ToRouteType);
}

function onClickDrop(key, item, selectRoute?: RouteConfigs) {
  if (item && item.disabled) return;

  let selectTagRoute;
  if (selectRoute) {
    selectTagRoute = {
      path: selectRoute.path,
      meta: selectRoute.meta,
      name: selectRoute.name,
      query: selectRoute?.query,
      params: selectRoute?.params,
    };
  } else {
    selectTagRoute = { path: route.path, meta: route.meta };
  }

  switch (key) {
    case 0:
      onFresh(selectRoute);
      break;
    case 1:
      deleteMenu(selectTagRoute);
      break;
    case 2:
      deleteMenu(selectTagRoute, "left");
      break;
    case 3:
      deleteMenu(selectTagRoute, "right");
      break;
    case 4:
      deleteMenu(selectTagRoute, "other");
      break;
    case 5:
      multiTagsStore.handleTags("splice", "", {
        startIndex: fixedTags.length,
        length: multiTags.value.length,
      });
      // 激活最后一个固定标签
      const lastFixedTag = multiTags.value[multiTags.value.length - 1];
      if (lastFixedTag) {
        router.push({ path: lastFixedTag.path, query: lastFixedTag.query });
      } else {
        router.push(topPath);
      }
      handleAliveRoute(route as ToRouteType);
      break;
    case 6:
      onContentFullScreen();
      setTimeout(() => {
        if (pureSetting.hiddenSideBar) {
          tagsViews[6].icon = "ri:fullscreen-exit-fill";
          tagsViews[6].text = $t("buttons.pureContentExitFullScreen");
        } else {
          tagsViews[6].icon = "ri:fullscreen-fill";
          tagsViews[6].text = $t("buttons.pureContentFullScreen");
        }
      }, 100);
      break;
  }
  setTimeout(() => {
    showMenuModel(route.fullPath, route.query);
  });
}

function handleCommand(command: any) {
  const { key, item } = command;
  onClickDrop(key, item);
}

function selectTag(key, item) {
  closeMenu();
  onClickDrop(key, item, currentSelect.value);
}

function showMenus(value: boolean) {
  Array.of(1, 2, 3, 4, 5).forEach((v) => {
    tagsViews[v].show = value;
  });
}

function disabledMenus(value: boolean, fixedTag = false) {
  Array.of(1, 2, 3, 4, 5).forEach((v) => {
    tagsViews[v].disabled = value;
  });
  if (fixedTag) {
    tagsViews[2].show = false;
    tagsViews[2].disabled = true;
  }
}

function showMenuModel(
  currentPath: string,
  query: object = {},
  refresh = false
) {
  const allRoute = multiTags.value;
  const routeLength = multiTags.value.length;
  let currentIndex = -1;
  if (isAllEmpty(query)) {
    currentIndex = allRoute.findIndex((v) => v.path === currentPath);
  } else {
    currentIndex = allRoute.findIndex((v) => isEqual(v.query, query));
  }
  function fixedTagDisabled() {
    if (allRoute[currentIndex]?.meta?.fixedTag) {
      Array.of(1, 2, 3, 4, 5).forEach((v) => {
        tagsViews[v].disabled = true;
      });
    }
  }

  showMenus(true);

  if (refresh) {
    tagsViews[0].show = true;
  }

  if (currentIndex === 1 && routeLength !== 2) {
    tagsViews[2].show = false;
    Array.of(1, 3, 4, 5).forEach((v) => {
      tagsViews[v].disabled = false;
    });
    tagsViews[2].disabled = true;
    fixedTagDisabled();
  } else if (currentIndex === 1 && routeLength === 2) {
    disabledMenus(false);
    Array.of(2, 3, 4).forEach((v) => {
      tagsViews[v].show = false;
      tagsViews[v].disabled = true;
    });
    fixedTagDisabled();
  } else if (routeLength - 1 === currentIndex && currentIndex !== 0) {
    tagsViews[3].show = false;
    Array.of(1, 2, 4, 5).forEach((v) => {
      tagsViews[v].disabled = false;
    });
    tagsViews[3].disabled = true;
    if (allRoute[currentIndex - 1]?.meta?.fixedTag) {
      tagsViews[2].show = false;
      tagsViews[2].disabled = true;
    }
    fixedTagDisabled();
  } else if (currentIndex === 0 || currentPath === `/redirect${topPath}`) {
    disabledMenus(true);
  } else {
    disabledMenus(false, allRoute[currentIndex - 1]?.meta?.fixedTag);
    fixedTagDisabled();
  }
}

function openMenu(tag, e) {
  closeMenu();
  if (tag.path === topPath || tag?.meta?.fixedTag) {
    showMenus(false);
    tagsViews[0].show = true;
  } else if (route.path !== tag.path && route.name !== tag.name) {
    tagsViews[0].show = false;
    showMenuModel(tag.path, tag.query);
  } else if (multiTags.value.length === 2 && route.path !== tag.path) {
    showMenus(true);
    tagsViews[4].show = false;
  } else if (route.path === tag.path) {
    showMenuModel(tag.path, tag.query, true);
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

// 滚动逻辑已合并到上方

function tagOnClick(item) {
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
  // 忽略 redirect 路径，避免刷新时闪烁
  if (route.path.startsWith('/redirect')) return;
  
  activeIndex.value = -1;
  dynamicRouteTag(route.path);
  dynamicTagView();
});

onMounted(() => {
  if (!instance) return;

  showMenuModel(route.fullPath);
  emitter.off("tagViewsChange");
  emitter.off("tagViewsShowModel");
  emitter.off("changLayoutRoute");
  
  emitter.on("tagViewsChange", (key: any) => {
    if (unref(showTags as any) === key) return;
    (showTags as any).value = key;
  });

  emitter.on("tagViewsShowModel", (key) => {
    showModel.value = key;
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

const deferTag = useDefer(tagsViews?.length);
</script>

<template>
  <div v-if="!showTags" ref="containerDom" :class="['tags-view', themeClass]">
    <!-- 背景装饰插槽 - 允许主题注入自定义背景（烟花/雪花/等） -->
    <div v-if="useCustomBackground" class="tags-view-background">
      <slot name="background" />
    </div>
    
    <!-- 增加左侧滚动按钮 -->
    <span 
      v-show="isShowArrow" 
      class="arrow-left" 
      :class="{ 'glass-arrow': showModel === 'glass' }"
      @click="handleScroll(-200)"
    >
      <IconifyIconOnline icon="ri:arrow-left-s-line" />
    </span>
    <div
      ref="scrollbarDom"
      class="scroll-container"
      :class="showModel === 'chrome' && 'chrome-scroll-container'"
      @wheel.prevent="handleWheel"
    >
      <div ref="tabDom" class="tab select-none">
        <div
          v-for="(item, index) in multiTags"
          :ref="'dynamic' + index"
          :key="item.path"
          :class="[
            'scroll-item is-closable',
            linkIsActive(item),
            showModel === 'chrome' && 'chrome-item',
            showModel === 'card' && 'card-item',
            showModel === 'smart' && 'smart-item',
            showModel === 'glass' && 'glass-item',
            isFixedTag(item) && 'fixed-tag',
          ]"
          @contextmenu.prevent="openMenu(item, $event)"
          @mouseenter.prevent="onMouseenter(index)"
          @mouseleave.prevent="onMouseleave(index)"
          @click="tagOnClick(item)"
        >
          <template v-if="showModel !== 'chrome'">
            <component
              v-if="showTagIcon && item.meta?.icon"
              :is="useRenderIcon(item.meta.icon)"
              class="tag-icon"
            />
            <span class="tag-title">
              {{ transformI18n(item.meta.title) }}
            </span>
            <span
              v-if="
                isFixedTag(item)
                  ? false
                  : iconIsActive(item, index) ||
                    (index === activeIndex && index !== 0)
              "
              class="el-icon-close close-size"
              @click.stop="deleteMenu(item)"
            >
              <IconifyIconOffline :icon="CloseIcon" />
            </span>
            <span
              v-if="showModel !== 'card' && showModel !== 'glass'"
              :ref="'schedule' + index"
              :class="[scheduleIsActive(item)]"
            />
          </template>
          <div v-else class="chrome-tab">
            <div class="chrome-tab__bg">
              <TagChrome />
            </div>
            <component
              v-if="showTagIcon && item.meta?.icon"
              :is="useRenderIcon(item.meta.icon)"
              class="tag-icon"
            />
            <span class="tag-title">
              {{ transformI18n(item.meta.title) }}
            </span>
            <span
              v-if="isFixedTag(item) ? false : index !== 0"
              class="chrome-close-btn"
              @click.stop="deleteMenu(item)"
            >
              <IconifyIconOffline :icon="CloseIcon" />
            </span>
            <span class="chrome-tab-divider" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 增加右侧滚动按钮 -->
    <span 
      v-show="isShowArrow" 
      class="arrow-right" 
      :class="{ 'glass-arrow': showModel === 'glass' }"
      @click="handleScroll(200)"
    >
      <IconifyIconOnline icon="ri:arrow-right-s-line" />
    </span>
    
    <!-- 右键菜单 -->
    <ul
      v-show="visible"
      ref="contextmenuRef"
      :key="Math.random()"
      :style="getContextMenuStyle"
      class="contextmenu"
    >
      <li 
        v-for="(item, key) in tagsViews.slice(0, 6)"
        :key="key"
        v-show="item.show"
        @click="selectTag(key, item)"
      >
        <IconifyIconOffline :icon="item.icon" />
        {{ transformI18n(item.text) }}
      </li>
    </ul>

    <!-- 右侧功能按钮 -->
    <el-dropdown
      trigger="click"
      placement="bottom-end"
      popper-class="tag-function-dropdown-popper"
      class="tags-options"
      @command="handleCommand"
    >
      <span class="arrow-down">
        <IconifyIconOnline icon="ri:arrow-down-s-line" class="dark:text-white" />
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
              <IconifyIconOnline :icon="item.icon" />
              {{ transformI18n(item.text) }}
            </el-dropdown-item>
          </span>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style lang="scss" scoped>
// 基础布局样式，主题特定样式由全局 SCSS 控制
.tags-view {
  position: relative;
  overflow: visible !important;
  z-index: 0;
  display: flex;
  align-items: center;

  .close-size {
    height: 16px;
    width: 16px;
    line-height: 16px;
  }
  .arrow-left,
  .arrow-right {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    width: 34px;
    cursor: pointer;
    z-index: 10;
    color: var(--el-text-color-primary);
    
    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }

  .scroll-container {
     flex: 1;
     overflow-x: auto;
     overflow-y: hidden;
     white-space: nowrap;
     // 隐藏滚动条
     &::-webkit-scrollbar {
       display: none;
     }
     scrollbar-width: none;
  }
}

// 背景装饰层
.tags-view-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

// Chrome 风格标签页样式
.chrome-tab {
  position: relative;
  display: inline-flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  padding: 6px 24px;
  white-space: nowrap;
  cursor: pointer;

  .tag-title {
    padding: 0;
    color: var(--el-text-color-primary);
  }

  .chrome-tab-divider {
    position: absolute;
    right: 7px;
    width: 1px;
    height: 14px;
    background-color: var(--el-border-color-lighter);
  }

  &:hover {
    z-index: 10;
    .chrome-tab-divider {
      opacity: 0;
    }
    
    // 悬停时背景色
    .chrome-tab__bg {
      color: var(--el-fill-color-hover);
    }
  }

  .chrome-tab__bg {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -10;
    width: 100%;
    height: 100%;
    color: transparent;
    pointer-events: none;
    transition: color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  }

  .chrome-close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--el-text-color-primary);
    border-radius: 50%;
    transition: all 0.2s;

    &:hover {
      color: #fff;
      background-color: var(--el-color-danger);
    }
  }

  // 确保SVG在不同主题下正确显示
  :deep(svg) {
    fill: currentColor;
    color: currentColor;
  }
  
  :deep(path), :deep(use) {
    fill: currentColor;
    color: currentColor;
  }
}

// 激活状态适配
.scroll-item.is-active .chrome-tab {
  z-index: 10;

  .tag-title {
    color: #fff !important;
  }
  
  // 修复选中状态下图标颜色为白色
  .tag-icon,
  .chrome-close-btn {
    color: #fff !important;
    :deep(svg) {
      fill: #fff !important;
      color: #fff !important;
    }
  }
  
  .chrome-close-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: #fff !important;
  }

  .chrome-tab__bg {
    color: var(--el-color-primary) !important;
    filter: drop-shadow(0 0 8px rgba(var(--el-color-primary-rgb), 0.3));
  }
}

.scroll-item.is-active:hover .chrome-tab {
  .chrome-tab__bg {
    color: var(--el-color-primary) !important;
  }
  .tag-title {
    color: #fff !important;
  }
}

.contextmenu {
  position: absolute;
  margin: 0;
  padding: 5px 0;
  background: var(--el-bg-color-overlay);
  z-index: 3000;
  list-style-type: none;
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light);
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-regular);
  min-width: 100px;

  li {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 7px 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

    &:hover {
      background-color: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }

    :deep(svg) {
      margin-right: 8px;
      font-size: 14px;
    }
  }
}

// 滚动按钮基础样式
.arrow-left,
.arrow-right {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 32px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.3s;
  background: var(--el-bg-color);
  z-index: 10;
  
  &:hover {
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
  }
}

// 玻璃拟态样式
.glass-item {
  position: relative;
  margin-right: 6px;
  padding: 0 12px;
  height: 32px;
  line-height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--el-text-color-regular);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  font-size: 13px;

  .tag-icon {
    margin-right: 4px;
    vertical-align: -2px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.7);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    z-index: 1;
  }

  &.is-active {
    background: rgba(var(--el-color-primary-rgb), 0.15);
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);

    .tag-icon {
      color: var(--el-color-primary);
    }
  }
  
  .el-icon-close {
    margin-left: 6px;
    padding: 2px;
    border-radius: 50%;
    font-size: 12px;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(var(--el-color-rgb), 0.1);
      color: var(--el-color-primary);
    }
  }
}

// 玻璃拟态下的滚动按钮
.glass-arrow {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  margin: 0 2px;
  width: 28px;
  height: 28px;
  margin-top: 2px;

  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.1);
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}

// Card 风格
.card-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  line-height: 32px;
  padding: 0 12px;
  margin-right: 6px;
  border-radius: 4px 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.3s;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-bottom: none;
  
  .tag-icon {
    margin-right: 4px;
    vertical-align: -2px;
  }

  &:hover {
    color: var(--el-color-primary);
    background-color: var(--el-fill-color-light);
  }

  &.is-active {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    border-color: var(--el-border-color-lighter);
    
    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: var(--el-color-primary);
      z-index: 1;
      box-shadow: 0 -1px 4px rgba(var(--el-color-primary-rgb), 0.2);
    }
  }

  .el-icon-close {
    margin-left: 6px;
    padding: 2px;
    border-radius: 50%;
    font-size: 12px;
    transition: all 0.2s;
    
    &:hover {
      background-color: var(--el-color-danger);
      color: #fff;
    }
  }
}

// Smart 风格 (灵动)
.smart-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  line-height: 32px;
  padding: 0 12px;
  margin-right: 6px;
  border-radius: 32px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.3s;
  background-color: transparent;
  
  .tag-icon {
    margin-right: 4px;
    vertical-align: -2px;
  }

  &:hover {
    color: var(--el-color-primary);
    background-color: var(--el-fill-color-light);
  }

  &.is-active {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    font-weight: 600;
  }

  .el-icon-close {
    margin-left: 6px;
    padding: 2px;
    border-radius: 50%;
    font-size: 12px;
    transition: all 0.2s;
    
    &:hover {
      background-color: var(--el-color-danger);
      color: #fff;
    }
  }
}

// 暗黑模式适配
html.dark {
  .glass-item {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.08);
    
    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    
    &.is-active {
      background: rgba(var(--el-color-primary-rgb), 0.3);
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }

  .glass-arrow {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.08);
    color: #e5e7eb;

    &:hover {
      background: rgba(var(--el-color-primary-rgb), 0.2);
      border-color: var(--el-color-primary);
    }
  }

  .card-item,
  .smart-item {
    &.is-active {
      background-color: rgba(var(--el-color-primary-rgb), 0.15);
      color: var(--el-color-primary);
      border-color: var(--el-border-color-darker);
    }
  }
}
</style>

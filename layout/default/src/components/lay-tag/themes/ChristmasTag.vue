<script setup lang="ts">
/**
 * 圣诞主题专属标签组件
 * 不依赖 showModel，使用独立的礼物盒风格
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

// 提取 store 到顶层避免重复调用
const multiTagsStore = useMultiTagsStoreHook();
const permissionStore = usePermissionStoreHook();

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
  <div v-if="!showTags" ref="containerDom" class="tags-view christmas-tag">
    <span v-show="isShowArrow" class="arrow-left">
      <IconifyIconOffline :icon="ArrowLeftSLine" @click="handleScroll(200)" />
    </span>
    <div
      ref="scrollbarDom"
      class="scroll-container"
      @wheel.prevent="handleWheel"
    >
      <div ref="tabDom" class="tab select-none" :style="getTabStyle">
        <!-- 礼物盒风格标签，不使用 showModel 类名 -->
        <div
          v-for="(item, index) in multiTags"
          :ref="'dynamic' + index"
          :key="index"
          :class="[
            'scroll-item is-closable christmas-item',
            linkIsActive(item),
            isFixedTag(item) && 'fixed-tag',
          ]"
          @contextmenu.prevent="openMenu(item, $event)"
          @mouseenter.prevent="onMouseenter(index)"
          @mouseleave.prevent="onMouseleave(index)"
          @click="tagOnClick(item)"
        >
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
            class="el-icon-close"
            @click.stop="deleteMenu(item)"
          >
            <IconifyIconOffline :icon="Close" />
          </span>
        </div>
      </div>
    </div>
    <span v-show="isShowArrow" class="arrow-right">
      <IconifyIconOffline :icon="ArrowRightSLine" @click="handleScroll(-200)" />
    </span>
    
    <!-- 右键菜单 -->
    <ul
      v-show="visible"
      ref="contextmenuRef"
      :key="Math.random()"
      :style="getContextMenuStyle"
      class="contextmenu"
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
      popper-class="tag-function-dropdown-popper"
      @command="handleCommand"
    >
      <span class="arrow-down">
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
</style>

<style lang="scss">
@use './default.scss';
@use './christmas.css';
</style>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { ReMenuNewBadge } from "@repo/components/MenuNewBadge";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import {
  resolvePath as configResolvePath,
  getConfig,
  transformI18n,
} from "@repo/config";
import type { MenuType } from "@repo/core";
import {
  computed,
  type CSSProperties,
  type PropType,
  ref,
  toRaw,
  useAttrs,
  inject,
  type Component,
  onMounted,
  watchEffect
} from "vue";
import { useNav } from "../../../hooks/useNav";
import { emitter } from "@repo/core";

// 注入主题化的 SidebarItem 组件（用于递归渲染子菜单）
const ThemeSidebarItem = inject<Component>('themeSidebarItem');
import SidebarExtraIcon from "./SidebarExtraIcon.vue";
import SidebarLinkItem from "./SidebarLinkItem.vue";
import EpArrowDown from "@iconify-icons/ep/arrow-down-bold";
import ArrowLeft from "@iconify-icons/ep/arrow-left-bold";
import ArrowRight from "@iconify-icons/ep/arrow-right-bold";
import ArrowUp from "@iconify-icons/ep/arrow-up-bold";

const attrs = useAttrs();
const { layout, isCollapse: navCollapse, tooltipEffect, getDivStyle } = useNav();

const route = useRoute();

const showNewMenu = ref(getConfig().ShowNewMenu ?? true);
const forceNewMenu = ref(false); // 强制显示所有新菜单 (测试用)
const menuAnimation = ref(getConfig().MenuAnimation ?? false);
const newMenuAnimation = ref(getConfig().NewMenuAnimation || 'bounce');

onMounted(() => {
  emitter.on("showNewMenuChange", (val) => {
    showNewMenu.value = val;
  });
  emitter.on("forceNewMenuChange", (val) => {
    forceNewMenu.value = val;
  });
  emitter.on("menuAnimationChange", (val) => {
    menuAnimation.value = val;
  });
  emitter.on("newMenuAnimationChange", (val) => {
    newMenuAnimation.value = val;
  });
});

const props = defineProps({
  item: {
    type: Object as PropType<MenuType>,
  },
  isNest: {
    type: Boolean,
    default: false,
  },
  basePath: {
    type: String,
    default: "",
  },
  collapse: {
    type: Boolean,
    default: undefined,
  },
});

const isCollapse = computed(() => {
  return props.collapse !== undefined ? props.collapse : navCollapse.value;
});

// 暴露给主题组件的插槽
defineSlots<{
  /** 激活状态装饰 */
  activeDecoration?: (props: { isActive: boolean; itemPath: string }) => any;
}>();

// 计算当前菜单项是否激活
const isMenuActive = computed(() => {
  const currentPath = route.path;
  const itemPath = resolvePath(props.item?.path || '');
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
});

// 暴露给父组件
defineExpose({
  isMenuActive,
});

const getNoDropdownStyle = computed((): CSSProperties => {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: isCollapse.value && layout.value !== "horizontal" ? "center" : "flex-start",
  };
});

const getSubMenuIconStyle = computed((): CSSProperties => {
  const isCollapsed = isCollapse.value && layout.value !== "horizontal";
  return {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "18px",
    height: "18px",
    flexShrink: 0,
    margin: isCollapsed ? "0" : "0 5px 0 0",
  };
});

const expandCloseIcon = computed(() => {
  if (!getConfig()?.MenuArrowIconNoTransition) return "";
  return {
    "expand-close-icon": useRenderIcon(EpArrowDown),
    "expand-open-icon": useRenderIcon(ArrowUp),
    "collapse-close-icon": useRenderIcon(ArrowRight),
    "collapse-open-icon": useRenderIcon(ArrowLeft),
  };
});

const onlyOneChild = ref<MenuType>(null);

function hasOneShowingChild(children: MenuType[] = [], parent: MenuType) {
  const showingChildren = children.filter((item: MenuType) => {
    if (item.meta?.hidden) {
      return false;
    } else {
      // Temp set onlyOneChild, will be overwritten if multiple
      onlyOneChild.value = item;
      return true;
    }
  });

  if (showingChildren[0]?.meta?.showParent) {
    return false;
  }

  if (showingChildren.length === 1) {
    return true;
  }

  if (showingChildren.length === 0) {
    onlyOneChild.value = { ...parent, path: "", noShowingChildren: true };
    return true;
  }
  return false;
}

function resolvePath(routePath: string) {
  const httpReg = /^http(s?):\/\//;
  if (httpReg.test(routePath) || httpReg.test(props.basePath)) {
    return routePath || props.basePath;
  } else {
    return configResolvePath(props.basePath, routePath);
  }
}

// Debug logging
onMounted(() => {
  // console.log('[BaseSidebarItem] Mounted', props.item.path, props.item.meta?.title);
});
</script>

<template>
  <SidebarLinkItem
    v-if="
      hasOneShowingChild(item.children, item) &&
      (!onlyOneChild.children || onlyOneChild.noShowingChildren)
    "
    :to="onlyOneChild"
  >
    <el-menu-item
      :index="resolvePath(onlyOneChild.path)"
      :class="['sidebar-menu-item', { 'submenu-title-noDropdown': !isNest, 'menu-animation': menuAnimation }]"
      :style="getNoDropdownStyle"
      v-bind="attrs"
    >
      <div class="sub-menu-icon" :style="getSubMenuIconStyle">
        <component
          :is="
            useRenderIcon(
              toRaw(onlyOneChild?.meta?.icon) ||
                (item?.meta && toRaw(item?.meta?.icon)) ||
                'ep:menu'
            )
          "
        />
      </div>
      <span
        v-if="
          !isCollapse ||
          item?.parentId ||
          (!item?.meta?.icon &&
            isCollapse &&
            layout === 'vertical' &&
            item?.pathList?.length === 1) ||
          (!onlyOneChild?.meta?.icon &&
            isCollapse &&
            layout === 'mix' &&
            item?.pathList?.length === 2)
        "
        class="flex-1 !pl-4 menu-text"
      >
        {{
          transformI18n(
            onlyOneChild?.meta?.i18nKey || onlyOneChild?.meta?.title || item?.meta?.title
          )
        }}
      </span>
      <ReMenuNewBadge
        v-if="!isCollapse && showNewMenu"
        :createTime="onlyOneChild?.meta?.createTime || item?.meta?.createTime"
        :type="onlyOneChild?.meta?.badgeType || item?.meta?.badgeType || 'primary'"
        :customText="onlyOneChild?.meta?.badgeText || item?.meta?.badgeText"
        :forceShow="forceNewMenu || onlyOneChild?.meta?.permanentNew || item?.meta?.permanentNew"
        :animation="newMenuAnimation"
        style="margin-top: 0; align-self: center;"
      />

      
      <!-- 主题装饰插槽 -->
      <slot name="activeDecoration" :is-active="isMenuActive" :item-path="resolvePath(onlyOneChild.path)" />
    </el-menu-item>
  </SidebarLinkItem>
  <el-sub-menu
    v-else
    ref="subMenu"
    teleported
    :index="resolvePath(item.path)"
    class="sidebar-sub-menu"
    :class="{ 'menu-animation': menuAnimation }"
    v-bind="expandCloseIcon"
  >
    <template #title>
      <div :style="getSubMenuIconStyle" class="sub-menu-icon">
        <component
          :is="useRenderIcon((item.meta && toRaw(item.meta.icon)) || 'ep:menu')"
        />
      </div>
      <span
        v-if="
          layout === 'mix' && toRaw(item?.meta?.icon)
            ? !isCollapse || item?.pathList?.length !== 2
            : !(
                layout === 'vertical' &&
                isCollapse &&
                toRaw(item?.meta?.icon) &&
                item.parentId === null
              )
        "
        :class="{
          'flex-1': true,
          'menu-text': true,
          '!pl-4':
            layout !== 'horizontal' &&
            isCollapse &&
            !toRaw(item?.meta?.icon) &&
            item.parentId === null,
        }"
      >
        {{ transformI18n(item?.meta?.i18nKey || item?.meta?.title) }}
      </span>
      <ReMenuNewBadge
        v-if="!isCollapse && showNewMenu"
        :createTime="item?.meta?.createTime"
        :type="item?.meta?.badgeType || 'primary'"
        :customText="item?.meta?.badgeText"
        :forceShow="forceNewMenu || item?.meta?.permanentNew"
        :animation="newMenuAnimation"
        class="ml-auto"
      />
      <SidebarExtraIcon v-if="!isCollapse" :extraIcon="item?.meta?.extraIcon" />
    </template>

    <div v-for="(child, index) in item.children" :key="child.path" class="submenu-item-wrapper">
      <component
        :is="ThemeSidebarItem"
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
        :collapse="collapse"
        class="nest-menu"
      />
    </div>
  </el-sub-menu>
</template>

<style lang="scss" scoped>
.menu-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--hover-nav-menu-color);
  display: inline-block;
  vertical-align: middle;
}

.sidebar-menu-item,
.sidebar-sub-menu {
  position: relative;
  transition: all 0.3s ease;

  &.is-active {
    // 移除强制颜色覆盖，允许外部控制
  }
}

// 子菜单包裹器透明
.submenu-item-wrapper {
  background: transparent !important;
  display: block;
}

// 菜单动画
.menu-animation {
  // 点击时的反馈
  &:not(.is-active):active > .el-sub-menu__title,
  &:not(.is-active):active {
    transform: scale(0.96);
    transition: transform 0.1s;
  }

  // 激活状态的弹跳动画
  &.is-active > .el-sub-menu__title,
  &.is-active {
    animation: menu-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

@keyframes menu-bounce {
  0% { transform: scale(1); }
  30% { transform: scale(0.92); }
  60% { transform: scale(1.03); }
  80% { transform: scale(0.98); }
  100% { transform: scale(1); }
}
</style>

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
} from "vue";
import { useNav } from "../../../hooks/useNav";

// 注入主题化的 SidebarItem 组件（用于递归渲染子菜单）
const ThemeSidebarItem = inject<Component>('themeSidebarItem');
import SidebarExtraIcon from "./SidebarExtraIcon.vue";
import SidebarLinkItem from "./SidebarLinkItem.vue";
import EpArrowDown from "@iconify-icons/ep/arrow-down-bold";
import ArrowLeft from "@iconify-icons/ep/arrow-left-bold";
import ArrowRight from "@iconify-icons/ep/arrow-right-bold";
import ArrowUp from "@iconify-icons/ep/arrow-up-bold";

const attrs = useAttrs();
const { layout, isCollapse, tooltipEffect, getDivStyle } = useNav();

const route = useRoute();

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

const onlyOneChild: MenuType = ref(null);

function hasOneShowingChild(children: MenuType[] = [], parent: MenuType) {
  const showingChildren = children.filter((item: MenuType) => {
    onlyOneChild.value = item;
    return true;
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
      :class="['sidebar-menu-item', { 'submenu-title-noDropdown': !isNest }]"
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
      <el-text
        v-if="
          (!item?.meta?.icon &&
            isCollapse &&
            layout === 'vertical' &&
            item?.pathList?.length === 1) ||
          (!onlyOneChild?.meta?.icon &&
            isCollapse &&
            layout === 'mix' &&
            item?.pathList?.length === 2)
        "
        truncated
        class="!w-full !pl-4"
      >
        {{
          transformI18n(
            onlyOneChild?.meta?.i18nKey || onlyOneChild?.meta?.title
          )
        }}
      </el-text>

      <template #title>
        <div :style="getDivStyle">
          <el-text truncated class="!w-full">
            {{
              transformI18n(
                onlyOneChild?.meta?.i18nKey || onlyOneChild?.meta?.title
              )
            }}
            <ReMenuNewBadge
              :createTime="
                onlyOneChild?.meta?.createTime || item?.meta?.createTime
              "
              :type="
                onlyOneChild?.meta?.badgeType ||
                item?.meta?.badgeType ||
                'primary'
              "
              :customText="
                onlyOneChild?.meta?.badgeText || item?.meta?.badgeText
              "
            />
          </el-text>
          <SidebarExtraIcon :extraIcon="onlyOneChild?.meta?.extraIcon" />
        </div>
      </template>
      
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
    v-bind="expandCloseIcon"
  >
    <template #title>
      <div :style="getSubMenuIconStyle" class="sub-menu-icon">
        <component
          :is="useRenderIcon((item.meta && toRaw(item.meta.icon)) || 'ep:menu')"
        />
      </div>
      <el-text
        v-if="
          layout === 'mix' && toRaw(item.meta.icon)
            ? !isCollapse || item?.pathList?.length !== 2
            : !(
                layout === 'vertical' &&
                isCollapse &&
                toRaw(item.meta.icon) &&
                item.parentId === null
              )
        "
        truncated
        :class="{
          '!w-full': true,
          '!pl-4':
            layout !== 'horizontal' &&
            isCollapse &&
            !toRaw(item.meta.icon) &&
            item.parentId === null,
        }"
      >
        {{ transformI18n(onlyOneChild?.meta?.i18nKey || item?.meta?.title) }}
        <ReMenuNewBadge
          v-if="!isCollapse"
          :createTime="item?.meta?.createTime"
          :type="item?.meta?.badgeType || 'primary'"
          :customText="item?.meta?.badgeText"
        />
      </el-text>
      <SidebarExtraIcon v-if="!isCollapse" :extraIcon="item?.meta?.extraIcon" />
    </template>

    <div v-for="(child, index) in item.children" :key="child.path" class="submenu-item-wrapper">
      <component
        :is="ThemeSidebarItem"
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
        class="nest-menu"
      />
    </div>
  </el-sub-menu>
</template>

<style lang="scss" scoped>
.sidebar-menu-item,
.sidebar-sub-menu {
  position: relative;
  transition: all 0.3s ease;
}

// 子菜单包裹器透明
.submenu-item-wrapper {
  background: transparent !important;
  display: block;
}
</style>

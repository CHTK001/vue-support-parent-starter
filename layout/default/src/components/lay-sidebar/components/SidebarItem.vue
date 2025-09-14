<script setup lang="ts">
import { ReMenuNewBadge } from "@repo/components/MenuNewBadge";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { ReText } from "@repo/components/ReText";
import { resolvePath as configResolvePath, getConfig, transformI18n } from "@repo/config";
import type { MenuType } from "@repo/core";
import { computed, type CSSProperties, type PropType, ref, toRaw, useAttrs } from "vue";
import { useNav } from "../../../hooks/useNav";
import SidebarExtraIcon from "./SidebarExtraIcon.vue";
import SidebarLinkItem from "./SidebarLinkItem.vue";

import EpArrowDown from "@iconify-icons/ep/arrow-down-bold";
import ArrowLeft from "@iconify-icons/ep/arrow-left-bold";
import ArrowRight from "@iconify-icons/ep/arrow-right-bold";
import ArrowUp from "@iconify-icons/ep/arrow-up-bold";

const attrs = useAttrs();
const { layout, isCollapse, tooltipEffect, getDivStyle } = useNav();

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

const getNoDropdownStyle = computed((): CSSProperties => {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
  };
});

const getSubMenuIconStyle = computed((): CSSProperties => {
  return {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: layout.value === "horizontal" ? "0 5px 0 0" : isCollapse.value ? "0 auto" : "0 5px 0 0",
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
  const showingChildren = children.filter((item: any) => {
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
    // 使用path.posix.resolve替代path.resolve 避免windows环境下使用electron出现盘符问题
    return configResolvePath(props.basePath, routePath);
  }
}
</script>

<template>
  <SidebarLinkItem v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren)" :to="item">
    <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'submenu-title-noDropdown': !isNest }" :style="getNoDropdownStyle" v-bind="attrs">
      <div v-if="toRaw(item?.meta?.icon)" class="sub-menu-icon" :style="getSubMenuIconStyle">
        <component :is="useRenderIcon(toRaw(onlyOneChild?.meta?.icon) || (item?.meta && toRaw(item?.meta?.icon)))" />
      </div>
      <el-text v-if="(!item?.meta?.icon && isCollapse && layout === 'vertical' && item?.pathList?.length === 1) || (!onlyOneChild?.meta?.icon && isCollapse && layout === 'mix' && item?.pathList?.length === 2)" truncated class="!w-full !pl-4 !text-inherit">
        {{ transformI18n(onlyOneChild?.meta?.i18nKey || onlyOneChild?.meta?.title) }}
      </el-text>

      <template #title>
        <div :style="getDivStyle">
          <ReText
            :tippyProps="{
              offset: [0, -10],
              theme: tooltipEffect,
            }"
            class="!w-full !text-inherit"
          >
            {{ transformI18n(onlyOneChild?.meta?.i18nKey || onlyOneChild?.meta?.title) }}
            <ReMenuNewBadge :createTime="onlyOneChild?.meta?.createTime || item?.meta?.createTime" :type="onlyOneChild?.meta?.badgeType || item?.meta?.badgeType || 'primary'" :customText="onlyOneChild?.meta?.badgeText || item?.meta?.badgeText" />
          </ReText>
          <SidebarExtraIcon :extraIcon="onlyOneChild?.meta?.extraIcon" />
        </div>
      </template>
    </el-menu-item>
  </SidebarLinkItem>
  <el-sub-menu v-else ref="subMenu" teleported :index="resolvePath(item.path)" v-bind="expandCloseIcon">
    <template #title>
      <div v-if="toRaw(item.meta.icon)" :style="getSubMenuIconStyle" class="sub-menu-icon">
        <component :is="useRenderIcon(item.meta && toRaw(item.meta.icon))" />
      </div>
      <ReText
        v-if="layout === 'mix' && toRaw(item.meta.icon) ? !isCollapse || item?.pathList?.length !== 2 : !(layout === 'vertical' && isCollapse && toRaw(item.meta.icon) && item.parentId === null)"
        :tippyProps="{
          offset: [0, -10],
          theme: tooltipEffect,
        }"
        :class="{
          '!w-full': true,
          '!text-inherit': true,
          '!pl-4': layout !== 'horizontal' && isCollapse && !toRaw(item.meta.icon) && item.parentId === null,
        }"
      >
        {{ transformI18n(onlyOneChild?.meta?.i18nKey || item?.meta?.title) }}
        <ReMenuNewBadge v-if="!isCollapse" :createTime="item?.meta?.createTime" :type="item?.meta?.badgeType || 'primary'" :customText="item?.meta?.badgeText" />
      </ReText>
      <SidebarExtraIcon v-if="!isCollapse" :extraIcon="item?.meta?.extraIcon" />
    </template>

    <span v-for="(child, index) in item.children" :key="child.path">
      <sidebar-item :key="child.path" :is-nest="true" :item="child" :base-path="resolvePath(child.path)" class="nest-menu" />
    </span>
  </el-sub-menu>
</template>

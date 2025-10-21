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
  expandMode: {
    type: String as PropType<'auto' | 'manual'>,
    default: 'auto',
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
    margin: "0 5px 0 0",
  };
});

// 双栏导航的展开控制图标
const expandCloseIcon = computed(() => {
  if (!getConfig()?.MenuArrowIconNoTransition) return "";
  
  // 根据展开模式决定是否显示箭头
  if (props.expandMode === 'manual') {
    return {
      "expand-close-icon": useRenderIcon(EpArrowDown),
      "expand-open-icon": useRenderIcon(ArrowUp),
      "collapse-close-icon": useRenderIcon(ArrowRight),
      "collapse-open-icon": useRenderIcon(ArrowLeft),
    };
  }
  
  // 自动展开模式下不显示箭头
  return {};
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
    return configResolvePath(props.basePath, routePath);
  }
}

// 判断是否禁用子菜单展开
const isSubMenuDisabled = computed(() => {
  // 自动展开模式下，子菜单不可折叠（始终展开状态）
  return false;
});

// 自动展开模式下，子菜单默认展开
const isSubMenuOpened = computed(() => {
  return props.expandMode === 'auto';
});
</script>

<template>
  <!-- 自动展开模式：使用el-menu组件，但强制展开所有子菜单 -->
  <template v-if="expandMode === 'auto'">
    <!-- 单个菜单项（没有子菜单或只有一个子菜单） -->
    <SidebarLinkItem v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren)" :to="{ path: resolvePath(onlyOneChild.path) }">
      <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'submenu-title-noDropdown': !isNest }" @click="handleMenuClick(onlyOneChild)">
        <div v-if="toRaw(item?.meta?.icon)" class="sub-menu-icon" :style="getSubMenuIconStyle">
          <component :is="useRenderIcon(toRaw(onlyOneChild?.meta?.icon) || (item?.meta && toRaw(item?.meta?.icon)))" />
        </div>
        
        <div :style="getDivStyle">
          <ReText
            :tippyProps="{
              offset: [0, -10],
              theme: tooltipEffect,
            }"
            class="!w-full"
          >
            {{ transformI18n(onlyOneChild?.meta?.i18nKey || onlyOneChild?.meta?.title) }}
            <ReMenuNewBadge :createTime="onlyOneChild?.meta?.createTime || item?.meta?.createTime" :type="onlyOneChild?.meta?.badgeType || item?.meta?.badgeType || 'primary'" :customText="onlyOneChild?.meta?.badgeText || item?.meta?.badgeText" />
          </ReText>
          <SidebarExtraIcon :extraIcon="onlyOneChild?.meta?.extraIcon" />
        </div>
      </el-menu-item>
    </SidebarLinkItem>
    
    <!-- 有子菜单的项目：使用el-sub-menu但强制展开 -->
    <el-sub-menu v-else :index="resolvePath(item.path)" :disabled="false" popper-class="pure-scrollbar" class="auto-expand-submenu">
      <template #title>
        <div v-if="toRaw(item?.meta?.icon)" class="sub-menu-icon">
          <component :is="useRenderIcon(toRaw(item?.meta?.icon))" />
        </div>
        <div :style="getDivStyle">
          <ReText
            :tippyProps="{
              offset: [0, -10],
              theme: tooltipEffect,
            }"
            class="!w-full "
          >
            {{ transformI18n(item?.meta?.i18nKey || item?.meta?.title) }}
            <ReMenuNewBadge :createTime="item?.meta?.createTime" :type="item?.meta?.badgeType || 'primary'" :customText="item?.meta?.badgeText" />
          </ReText>
          <SidebarExtraIcon :extraIcon="item?.meta?.extraIcon" />
        </div>
      </template>
      
      <DoubleNavSidebarItem
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :is-nest="true"
        :base-path="resolvePath(child.path)"
        :expand-mode="expandMode"
        class="nest-menu"
        @menu-click="$emit('menuClick', child)"
        @favorite-toggle="$emit('favoriteToggle', child, $event)"
      />
    </el-sub-menu>
  </template>

  <!-- 手动展开模式：使用标准的el-sub-menu -->
  <template v-else>
    <SidebarLinkItem v-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren)" :to="{ path: resolvePath(onlyOneChild.path) }">
      <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{ 'submenu-title-noDropdown': !isNest }">
        <div v-if="toRaw(item?.meta?.icon)" class="sub-menu-icon" :style="getSubMenuIconStyle">
          <component :is="useRenderIcon(toRaw(onlyOneChild?.meta?.icon) || (item?.meta && toRaw(item?.meta?.icon)))" />
        </div>
        
        <div class="menu-content" :style="getDivStyle">
          <ReText
            :tippyProps="{
              offset: [0, -10],
              theme: tooltipEffect,
            }"
            class="!w-full "
          >
            {{ transformI18n(onlyOneChild?.meta?.i18nKey || onlyOneChild?.meta?.title) }}
            <ReMenuNewBadge :createTime="onlyOneChild?.meta?.createTime || item?.meta?.createTime" :type="onlyOneChild?.meta?.badgeType || item?.meta?.badgeType || 'primary'" :customText="onlyOneChild?.meta?.badgeText || item?.meta?.badgeText" />
          </ReText>
          <SidebarExtraIcon :extraIcon="onlyOneChild?.meta?.extraIcon" />
        </div>
      </el-menu-item>
    </SidebarLinkItem>

    <el-sub-menu v-else :index="resolvePath(item.path)">
      <template #title>
        <div v-if="toRaw(item?.meta?.icon)" class="sub-menu-icon" :style="getSubMenuIconStyle">
          <component :is="useRenderIcon(toRaw(item?.meta?.icon))" />
        </div>
        <div :style="getDivStyle">
          <ReText
            :tippyProps="{
              offset: [0, -10],
              theme: tooltipEffect,
            }"
            class="!w-full "
          >
            {{ transformI18n(item?.meta?.i18nKey || item?.meta?.title) }}
            <ReMenuNewBadge :createTime="item?.meta?.createTime" :type="item?.meta?.badgeType || 'primary'" :customText="item?.meta?.badgeText" />
          </ReText>
          <SidebarExtraIcon :extraIcon="item?.meta?.extraIcon" />
        </div>
      </template>
      
      <DoubleNavSidebarItem
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :is-nest="true"
        :base-path="resolvePath(child.path)"
        :expand-mode="expandMode"
        class="nest-menu"
        @menu-click="$emit('menuClick', child)"
        @favorite-toggle="$emit('favoriteToggle', child, $event)"
      />
    </el-sub-menu>
  </template>


</template>

<style lang="scss" scoped>
.sub-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.nest-menu {
  padding-left: 20px;
  
  :deep(.el-sub-menu__icon-arrow) {
    display: none;
  }
}
.router-link-exact-active{
  .new-re-text{
    color: #fff !important;
  }
}

// 自动展开模式：隐藏折叠箭头，但保持展开功能
:deep(.auto-expand-submenu) {
  .el-sub-menu__icon-arrow {
    display: none !important;
  }
  
  // 保持所有交互功能，只是隐藏箭头
  .el-sub-menu__title {
    cursor: pointer;
  }
  
  .el-menu-item {
    pointer-events: auto;
  }
  
  .el-sub-menu {
    pointer-events: auto;
  }
}
</style>
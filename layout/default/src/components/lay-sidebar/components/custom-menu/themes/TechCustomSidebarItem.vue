<script setup lang="ts">
/**
 * Tech 主题 - 自定义菜单项组件
 * 科技感青色系
 */
import { computed, toRaw, provide, ref, onMounted } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon";
import {
  transformI18n,
  resolvePath as configResolvePath,
  getConfig,
} from "@repo/config";
import { type MenuType, emitter } from "@repo/core";
import CustomMenuItem from "../CustomMenuItem.vue";
import CustomSubMenu from "../CustomSubMenu.vue";


const props = defineProps<{
  item: MenuType;
  basePath?: string;
  isNest?: boolean;
  popperClass?: string;
}>();

import TechCustomSidebarItem from "./TechCustomSidebarItem.vue";
provide("themeSidebarItem", TechCustomSidebarItem);



function resolvePath(routePath: string) {
  const httpReg = /^http(s?):\/\//;
  if (routePath?.startsWith("/")) {
    return routePath;
  }
  if (httpReg.test(routePath) || httpReg.test(props.basePath || "")) {
    return routePath || props.basePath || "";
  }
  return configResolvePath(routePath, props.basePath || "");
}

const onlyOneChild = computed(() => {
  const children =
    props.item?.children?.filter(
      (item: MenuType) => item.meta?.showLink !== false,
    ) || [];
  if (children.length === 0) {
    return {
      ...props.item,
      path: props.item?.path || "",
      noShowingChildren: true,
    };
  }
  if (children.length === 1 && !children[0]?.meta?.showParent) {
    return children[0];
  }
  return null;
});

const showAsMenuItem = computed(() => {
  return (
    onlyOneChild.value &&
    (!onlyOneChild.value.children || onlyOneChild.value.noShowingChildren)
  );
});

const menuIcon = computed(() => {
  if (showAsMenuItem.value) {
    return (
      toRaw(onlyOneChild.value?.meta?.icon) ||
      toRaw(props.item?.meta?.icon) ||
      "ep:menu"
    );
  }
  return toRaw(props.item?.meta?.icon) || "ep:menu";
});

const menuTitle = computed(() => {
  if (showAsMenuItem.value) {
    return transformI18n(
      onlyOneChild.value?.meta?.i18nKey || onlyOneChild.value?.meta?.title,
    );
  }
  return transformI18n(props.item?.meta?.i18nKey || props.item?.meta?.title);
});

const menuPath = computed(() => {
  if (showAsMenuItem.value) {
    return resolvePath(onlyOneChild.value?.path || "");
  }
  return resolvePath(props.item?.path || "");
});
</script>

<template>
  <CustomMenuItem
    v-if="showAsMenuItem"
    :item="onlyOneChild"
    :base-path="menuPath"
    :is-nest="props.isNest"
    :popper-class="props.popperClass"
  >
    <template #title>
      <span class="tech-menu-title">
        <component
          :is="useRenderIcon(menuIcon)"
          class="tech-menu-icon"
        />
        <span>{{ menuTitle }}</span>
      </span>
    </template>
  </CustomMenuItem>

  <CustomSubMenu
    v-else
    :item="props.item"
    :base-path="props.basePath"
    :is-nest="props.isNest"
    :popper-class="props.popperClass"
  >
    <template #title>
      <span class="tech-menu-title">
        <component
          :is="useRenderIcon(menuIcon)"
          class="tech-menu-icon"
        />
        <span>{{ menuTitle }}</span>
</span>
    </template>
  </CustomSubMenu>
</template>

<style lang="scss" scoped>
.tech-menu-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(0, 255, 255, 0.7);
  transition: all 0.3s ease;

  .tech-menu-icon {
    color: rgba(0, 255, 255, 0.6);
    filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.4));
    transition: all 0.3s ease;
  }

  &:hover {
    color: #00ffff;
    text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);

    .tech-menu-icon {
      color: #00ffff;
      filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8));
    }
  }
}
</style>

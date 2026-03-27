<script setup lang="ts">
import { computed, provide, ref, onMounted } from "vue";
import {  useRenderIcon  } from "@repo/components/ReIcon";
import {
  transformI18n,
  resolvePath as configResolvePath,
  getConfig,
} from "@repo/config";
import { type MenuType, emitter } from "@repo/core";
import { ReMenuNewBadge } from "@repo/components/MenuNewBadge";
import CustomMenuItem from "../CustomMenuItem.vue";
import CustomSubMenu from "../CustomSubMenu.vue";

const props = defineProps<{
  item: MenuType;
  basePath?: string;
  isNest?: boolean;
  popperClass?: string;
}>();

import SpringFestivalCustomSidebarItem from "./SpringFestivalCustomSidebarItem.vue";
provide("themeSidebarItem", SpringFestivalCustomSidebarItem);

const showNewMenu = ref(getConfig().ShowNewMenu ?? true);
const forceNewMenu = ref(false);
const menuAnimation = ref(getConfig().MenuAnimation ?? false);
const newMenuAnimation = ref(getConfig().NewMenuAnimation || "bounce");

onMounted(() => {
  emitter.on("showNewMenuChange", val => {
    showNewMenu.value = val;
  });
  emitter.on("forceNewMenuChange", val => {
    forceNewMenu.value = val;
  });
  emitter.on("menuAnimationChange", val => {
    menuAnimation.value = val;
  });
  emitter.on("newMenuAnimationChange", val => {
    newMenuAnimation.value = val;
  });
});

function resolvePath(routePath: string) {
  const httpReg = /^http(s?):\/\//;
  if (httpReg.test(routePath) || httpReg.test(props.basePath || "")) {
    return routePath || props.basePath || "";
  }
  return configResolvePath(props.basePath || "", routePath);
}

const onlyOneChild = computed(() => {
  const children =
    props.item?.children?.filter(item => item.meta?.showLink !== false) || [];
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
      onlyOneChild.value?.meta?.icon || props.item?.meta?.icon || "ep:menu"
    );
  }
  return props.item?.meta?.icon || "ep:menu";
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

const popperDirection = computed(() => (props.isNest ? "right" : "bottom"));
</script>

<template>
  <CustomMenuItem
    v-if="showAsMenuItem"
    :index="menuPath"
    class="spring-festival-menu-item"
    :class="{ 'menu-animation': menuAnimation }"
  >
    <div class="menu-item-content">
      <span class="menu-icon">
        <component :is="useRenderIcon(menuIcon)" />
      </span>
      <span class="menu-title">{{ menuTitle }}</span>
      <ReMenuNewBadge
        v-if="showNewMenu"
        :createTime="onlyOneChild?.meta?.createTime || item?.meta?.createTime"
        :type="onlyOneChild?.meta?.badgeType || item?.meta?.badgeType || 'primary'"
        :customText="onlyOneChild?.meta?.badgeText || item?.meta?.badgeText"
        :forceShow="forceNewMenu || onlyOneChild?.meta?.permanentNew || item?.meta?.permanentNew"
        :animation="newMenuAnimation"
      />
    </div>
  </CustomMenuItem>

  <CustomSubMenu
    v-else
    :index="resolvePath(item.path)"
    :popper-class="`spring-festival-custom-popper ${popperClass || ''}`"
    :popper-direction="popperDirection"
    class="spring-festival-sub-menu"
    :class="{ 'menu-animation': menuAnimation }"
  >
    <template #title>
      <div class="menu-item-content">
        <span class="menu-icon">
          <component :is="useRenderIcon(menuIcon)" />
        </span>
        <span class="menu-title">{{ menuTitle }}</span>
        <ReMenuNewBadge
          v-if="showNewMenu"
          :createTime="item?.meta?.createTime"
          :type="item?.meta?.badgeType || 'primary'"
          :customText="item?.meta?.badgeText"
          :forceShow="forceNewMenu || item?.meta?.permanentNew"
          :animation="newMenuAnimation"
        />
      </div>
    </template>

    <template v-for="child in item.children" :key="child.path">
      <SpringFestivalCustomSidebarItem
        v-if="child.meta?.showLink !== false"
        :item="child"
        :base-path="resolvePath(child.path)"
        :is-nest="true"
        :popper-class="popperClass"
      />
    </template>
  </CustomSubMenu>
</template>

<style lang="scss" scoped>
.menu-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: #ffd76a;

  :deep(svg) {
    width: 18px;
    height: 18px;
  }
}

.menu-title {
  font-size: 14px;
  white-space: nowrap;
  font-weight: 500;
}

.spring-festival-menu-item,
.spring-festival-sub-menu {
  margin: 2px 4px;

  :deep(.custom-sub-menu__title),
  &.custom-menu-item {
    color: #ffd76a;
    border-radius: 8px;
    border: 1px solid transparent;

    &:hover {
      background: linear-gradient(
        135deg,
        rgba(255, 215, 106, 0.12),
        rgba(179, 0, 27, 0.22)
      );
      color: #fff1c4;
      border-color: rgba(255, 215, 106, 0.26);

      .menu-icon,
      .menu-title {
        color: #fff1c4;
      }
    }
  }

  &.is-active,
  &.is-active :deep(.custom-sub-menu__title) {
    background: linear-gradient(135deg, #8b0000, #b3001b);
    color: #fff1c4;
    box-shadow:
      0 10px 18px -14px rgba(0, 0, 0, 0.62),
      inset 0 1px 0 rgba(255, 233, 168, 0.18);
    border-color: rgba(255, 215, 106, 0.4);

    .menu-icon,
    .menu-title,
    .custom-sub-menu__icon-arrow {
      color: #fff1c4;
    }
  }
}
</style>

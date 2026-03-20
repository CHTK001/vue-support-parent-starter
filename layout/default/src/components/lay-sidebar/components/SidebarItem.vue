<script setup lang="ts">
import { useRoute } from "vue-router";
import { ReMenuNewBadge } from "@repo/components";
import { useRenderIcon } from "@repo/components";
import {
  resolvePath as configResolvePath,
  getConfig,
  transformI18n,
  responsiveStorageNameSpace,
} from "@repo/config";
import type { StorageConfigs } from "@repo/config";
import type { MenuType } from "@repo/core";
import { emitter } from "@repo/core";
import {
  computed,
  type CSSProperties,
  type PropType,
  ref,
  toRaw,
  useAttrs,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useNav } from "../../../hooks/useNav";
import { localStorageProxy } from "@repo/utils";
import { useGlobal } from "@pureadmin/utils";
import SidebarExtraIcon from "./SidebarExtraIcon.vue";
import SidebarLinkItem from "./SidebarLinkItem.vue";
import ThemeMenuActiveIndicator from "./ThemeMenuActiveIndicator.vue";
import EpArrowDown from "@iconify-icons/ep/arrow-down-bold";
import ArrowLeft from "@iconify-icons/ep/arrow-left-bold";
import ArrowRight from "@iconify-icons/ep/arrow-right-bold";
import ArrowUp from "@iconify-icons/ep/arrow-up-bold";

const attrs = useAttrs();
const { layout, isCollapse, tooltipEffect, getDivStyle } = useNav();

// 主题感知
const currentTheme = ref<string>(
  localStorageProxy().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`,
  )?.systemTheme || "default",
);

// 主题类名映射
const themeClassMap: Record<string, string> = {
  christmas: "theme-christmas",
  "spring-festival": "theme-spring-festival",
  "mid-autumn": "theme-mid-autumn",
  default: "theme-default",
  "default-light": "theme-default",
  "default-dark": "theme-default",
};

const themeClass = computed(
  () => themeClassMap[currentTheme.value] || "theme-default",
);

onMounted(() => {
  emitter.on("systemThemeChange", (themeKey: string) => {
    currentTheme.value = themeKey;
  });
});

onBeforeUnmount(() => {
  emitter.off("systemThemeChange");
});
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

// 计算当前菜单项是否激活
const isMenuActive = computed(() => {
  const currentPath = route.path;
  const itemPath = resolvePath(props.item?.path || "");
  return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
});

const getNoDropdownStyle = computed((): CSSProperties => {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent:
      isCollapse.value && layout.value !== "horizontal"
        ? "center"
        : "flex-start",
  };
});

const getSubMenuIconStyle = computed((): CSSProperties => {
  // 收缩状态下统一居中，保证有/无子菜单的图标对齐
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
    // 使用path.posix.resolve替代path.resolve 避免windows环境下使用electron出现盘符问题
    return configResolvePath(props.basePath, routePath);
  }
}

const forceNewMenu = ref(getConfig()?.ForceNewMenu ?? false);
const showNewMenu = ref(getConfig()?.ShowNewMenu ?? false);
const menuAnimation = ref(getConfig()?.MenuAnimation ?? false);
const newMenuAnimation = ref(getConfig()?.NewMenuAnimation || "bounce");

onMounted(() => {
  emitter.on("forceNewMenuChange", (val: boolean) => {
    forceNewMenu.value = val;
  });
  emitter.on("showNewMenuChange", (val: boolean) => {
    showNewMenu.value = val;
  });
  emitter.on("menuAnimationChange", (val: boolean) => {
    menuAnimation.value = val;
  });
  emitter.on("newMenuAnimationChange", (val: string) => {
    newMenuAnimation.value = val;
  });
});

onBeforeUnmount(() => {
  emitter.off("forceNewMenuChange");
  emitter.off("showNewMenuChange");
  emitter.off("menuAnimationChange");
  emitter.off("newMenuAnimationChange");
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
    <ScMenuItem
      :index="resolvePath(onlyOneChild.path)"
      :class="[
        'sidebar-menu-item',
        themeClass,
        {
          'submenu-title-noDropdown': !isNest,
          'menu-animation': menuAnimation,
        },
      ]"
      :style="getNoDropdownStyle"
      v-bind="attrs"
    >
      <div class="sub-menu-icon" :style="getSubMenuIconStyle">
        <component
          :is="
            useRenderIcon(
              toRaw(onlyOneChild?.meta?.icon) ||
                (item?.meta && toRaw(item?.meta?.icon)) ||
                'ep:menu',
            )
          "
        />
      </div>
      <span
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
        class="!w-full !pl-4 menu-text"
      >
        {{
          transformI18n(
            onlyOneChild?.meta?.i18nKey || onlyOneChild?.meta?.title,
          )
        }}
      </span>

      <template #title>
        <div :style="getDivStyle">
          <span class="!w-full menu-text">
            {{
              transformI18n(
                onlyOneChild?.meta?.i18nKey || onlyOneChild?.meta?.title,
              )
            }}
            <ReMenuNewBadge
              v-if="!isCollapse && showNewMenu"
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
              :forceShow="
                forceNewMenu ||
                onlyOneChild?.meta?.permanentNew ||
                item?.meta?.permanentNew
              "
              :animation="newMenuAnimation"
            />
          </span>
          <SidebarExtraIcon :extraIcon="onlyOneChild?.meta?.extraIcon" />
        </div>
      </template>
      <!-- 主题特色激活装饰 -->
      <ThemeMenuActiveIndicator :is-active="isMenuActive" />
    </ScMenuItem>
  </SidebarLinkItem>
  <el-sub-menu
    v-else
    ref="subMenu"
    teleported
    :index="resolvePath(item.path)"
    :class="[
      'sidebar-sub-menu',
      themeClass,
      { 'menu-animation': menuAnimation },
    ]"
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
          layout === 'mix' && toRaw(item.meta.icon)
            ? !isCollapse || item?.pathList?.length !== 2
            : !(
                layout === 'vertical' &&
                isCollapse &&
                toRaw(item.meta.icon) &&
                item.parentId === null
              )
        "
        :class="{
          '!w-full': true,
          'menu-text': true,
          '!pl-4':
            layout !== 'horizontal' &&
            isCollapse &&
            !toRaw(item.meta.icon) &&
            item.parentId === null,
        }"
      >
        {{ transformI18n(onlyOneChild?.meta?.i18nKey || item?.meta?.title) }}
        <ReMenuNewBadge
          v-if="!isCollapse && showNewMenu"
          :createTime="item?.meta?.createTime"
          :type="item?.meta?.badgeType || 'primary'"
          :customText="item?.meta?.badgeText"
          :forceShow="forceNewMenu || item?.meta?.permanentNew"
          :animation="newMenuAnimation"
        />
      </span>
      <SidebarExtraIcon v-if="!isCollapse" :extraIcon="item?.meta?.extraIcon" />
    </template>

    <span v-for="(child, index) in item.children" :key="child.path">
      <sidebar-item
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
        class="nest-menu"
      />
    </span>
  </el-sub-menu>
</template>

<style lang="scss" scoped>
// 基础菜单项样式
.menu-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: inherit;
  display: inline-block;
  vertical-align: middle;
}

.menu-animation.is-active {
  animation: menu-bounce 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes menu-bounce {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.sidebar-menu-item,
.sidebar-sub-menu {
  position: relative;
  transition: all 0.3s ease;

  // 修复激活状态下文字颜色不跟随的问题
  &.is-active {
    .menu-text {
      color: var(--el-text-color-primary) !important;
    }
    // 深色模式下文字为白色
    html.dark & .menu-text {
      color: #fff !important;
    }
  }
}

// ==================== 圣诞主题 ====================
.sidebar-menu-item.theme-christmas {
  color: rgba(255, 248, 232, 0.92) !important;

  .menu-text {
    color: inherit !important;
    font-weight: 600;
  }

  &:hover {
    color: #ffe18a !important;
    background: linear-gradient(135deg, rgba(196, 30, 58, 0.36), rgba(17, 70, 28, 0.2)) !important;
    box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.22);
  }

  &.is-active {
    color: #fffdf6 !important;
    background: linear-gradient(135deg, rgba(196, 30, 58, 0.92), rgba(145, 22, 44, 0.84)) !important;
    box-shadow:
      0 10px 24px -18px rgba(196, 30, 58, 0.72),
      inset 0 0 0 1px rgba(255, 225, 138, 0.5);

    .menu-text {
      color: #fffdf6 !important;
    }
  }
}

.sidebar-sub-menu.theme-christmas {
  :deep(.el-sub-menu__title) {
    color: rgba(255, 248, 232, 0.92) !important;
    font-weight: 600;
  }

  :deep(.el-sub-menu__title:hover) {
    color: #ffe18a !important;
    background: linear-gradient(135deg, rgba(196, 30, 58, 0.34), rgba(17, 70, 28, 0.18)) !important;
  }

  &.is-active :deep(.el-sub-menu__title) {
    color: #fffdf6 !important;
    background: linear-gradient(135deg, rgba(196, 30, 58, 0.88), rgba(145, 22, 44, 0.8)) !important;
    box-shadow: inset 0 0 0 1px rgba(255, 225, 138, 0.45);
  }
}

// ==================== 春节主题 ====================
.sidebar-menu-item.theme-spring-festival {
  color: rgba(255, 223, 122, 0.96) !important;

  .menu-text {
    color: inherit !important;
    font-weight: 700;
    font-family: "STZhongsong", "STKaiti", "KaiTi", serif;
  }

  &:hover {
    color: #fff4d0 !important;
    background: linear-gradient(135deg, rgba(200, 16, 46, 0.4), rgba(122, 0, 22, 0.28)) !important;
    box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.22);
  }

  &.is-active {
    color: #7a0016 !important;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.98), rgba(240, 176, 0, 0.88)) !important;
    box-shadow:
      0 10px 24px -18px rgba(255, 215, 0, 0.9),
      inset 0 0 0 1px rgba(140, 0, 0, 0.18);

    .menu-text {
      color: #7a0016 !important;
    }
  }
}

.sidebar-sub-menu.theme-spring-festival {
  :deep(.el-sub-menu__title) {
    color: rgba(255, 223, 122, 0.96) !important;
    font-weight: 700;
    font-family: "STZhongsong", "STKaiti", "KaiTi", serif;
  }

  :deep(.el-sub-menu__title:hover) {
    color: #fff4d0 !important;
    background: linear-gradient(135deg, rgba(200, 16, 46, 0.38), rgba(122, 0, 22, 0.24)) !important;
  }

  &.is-active :deep(.el-sub-menu__title) {
    color: #7a0016 !important;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.98), rgba(240, 176, 0, 0.88)) !important;
    box-shadow: inset 0 0 0 1px rgba(140, 0, 0, 0.18);
  }
}

// ==================== 万圣主题 ====================
.sidebar-menu-item.theme-halloween {
  color: rgba(255, 181, 102, 0.96) !important;

  .menu-text {
    color: inherit !important;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  &:hover {
    color: #fff3de !important;
    background: linear-gradient(135deg, rgba(255, 117, 24, 0.22), rgba(44, 0, 62, 0.46)) !important;
    box-shadow: inset 0 0 0 1px rgba(255, 117, 24, 0.26);
  }

  &.is-active {
    color: #1a001f !important;
    background: linear-gradient(135deg, rgba(255, 117, 24, 0.98), rgba(255, 171, 64, 0.9)) !important;
    box-shadow:
      0 10px 24px -18px rgba(255, 117, 24, 0.86),
      inset 0 0 0 1px rgba(26, 0, 38, 0.16);

    .menu-text {
      color: #1a001f !important;
    }
  }
}

.sidebar-sub-menu.theme-halloween {
  :deep(.el-sub-menu__title) {
    color: rgba(255, 181, 102, 0.96) !important;
    font-weight: 600;
  }

  :deep(.el-sub-menu__title:hover) {
    color: #fff3de !important;
    background: linear-gradient(135deg, rgba(255, 117, 24, 0.2), rgba(44, 0, 62, 0.44)) !important;
  }

  &.is-active :deep(.el-sub-menu__title) {
    color: #1a001f !important;
    background: linear-gradient(135deg, rgba(255, 117, 24, 0.98), rgba(255, 171, 64, 0.9)) !important;
    box-shadow: inset 0 0 0 1px rgba(26, 0, 38, 0.16);
  }
}
</style>

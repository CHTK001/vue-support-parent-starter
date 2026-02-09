<script setup lang="ts">
import { useRoute } from "vue-router";
import { ReMenuNewBadge } from "@repo/components/MenuNewBadge";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
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
    `${responsiveStorageNameSpace()}configure`
  )?.systemTheme || 'default'
);

// 主题类名映射
const themeClassMap: Record<string, string> = {
  'christmas': 'theme-christmas',
  'spring-festival': 'theme-spring-festival',
  'mid-autumn': 'theme-mid-autumn',
  'cyberpunk': 'theme-cyberpunk',
  'default': 'theme-default',
  'default-light': 'theme-default',
  'default-dark': 'theme-default',
};

const themeClass = computed(() => themeClassMap[currentTheme.value] || 'theme-default');

onMounted(() => {
  emitter.on('systemThemeChange', (themeKey: string) => {
    currentTheme.value = themeKey;
  });
});

onBeforeUnmount(() => {
  emitter.off('systemThemeChange');
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
  const itemPath = resolvePath(props.item?.path || '');
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
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
    <el-menu-item
      :index="resolvePath(onlyOneChild.path)"
      :class="['sidebar-menu-item', themeClass, { 'submenu-title-noDropdown': !isNest, 'menu-animation': menuAnimation }]"
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
            onlyOneChild?.meta?.i18nKey || onlyOneChild?.meta?.title
          )
        }}
      </span>

      <template #title>
        <div :style="getDivStyle">
          <span class="!w-full menu-text">
            {{
              transformI18n(
                onlyOneChild?.meta?.i18nKey || onlyOneChild?.meta?.title
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
              :forceShow="forceNewMenu || onlyOneChild?.meta?.permanentNew || item?.meta?.permanentNew"
              :animation="newMenuAnimation"
            />
          </span>
          <SidebarExtraIcon :extraIcon="onlyOneChild?.meta?.extraIcon" />
        </div>
      </template>
      <!-- 主题特色激活装饰 -->
      <ThemeMenuActiveIndicator :is-active="isMenuActive" />
    </el-menu-item>
  </SidebarLinkItem>
  <el-sub-menu
    v-else
    ref="subMenu"
    teleported
    :index="resolvePath(item.path)"
    :class="['sidebar-sub-menu', themeClass, { 'menu-animation': menuAnimation }]"
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
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
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
.theme-christmas {
  &.is-active {
    // 圣诞树装饰在 ThemeMenuActiveIndicator 中实现
  }
}

// ==================== 春节主题 ====================
.theme-spring-festival {
  &.is-active {
    // 灯笼装饰在 ThemeMenuActiveIndicator 中实现
  }
}

// ==================== 中秋主题 ====================
.theme-mid-autumn {
  &.is-active {
    // 月亮装饰在 ThemeMenuActiveIndicator 中实现
  }
}

// ==================== 赛博朋克主题 ====================
.theme-cyberpunk {
  &.is-active {
    // 霓虹装饰在 ThemeMenuActiveIndicator 中实现
  }
}
</style>

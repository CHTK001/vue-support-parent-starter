<script setup lang="ts">
/**
 * 自定义横向导航菜单项
 * 使用 CustomMenuItem 和 CustomSubMenu 替代 el-menu-item 和 el-sub-menu
 */
import { computed, toRaw, inject, type Component, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useRenderIcon } from '@repo/components/ReIcon/src/hooks';
import { transformI18n, resolvePath as configResolvePath, getConfig } from '@repo/config';
import type { MenuType } from '@repo/core';
import { emitter } from '@repo/core';
import { ReMenuNewBadge } from '@repo/components/MenuNewBadge';
import CustomMenuItem from './CustomMenuItem.vue';
import CustomSubMenu from './CustomSubMenu.vue';

const props = defineProps<{
  item: MenuType;
  basePath?: string;
  isNest?: boolean;
  popperClass?: string;
}>();

const route = useRoute();

const showNewMenu = ref(getConfig().ShowNewMenu ?? true);
const forceNewMenu = ref(false);
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

// 注入主题化组件（用于递归）
const ThemeSidebarItem = inject<Component>('themeSidebarItem');

// 解析路径
function resolvePath(routePath: string) {
  const httpReg = /^http(s?):\/\//;
  if (httpReg.test(routePath) || httpReg.test(props.basePath || '')) {
    return routePath || props.basePath || '';
  }
  return configResolvePath(props.basePath || '', routePath);
}

// 判断是否只有一个子菜单
const onlyOneChild = computed(() => {
  const children = props.item?.children?.filter((item: MenuType) => item.meta?.showLink !== false) || [];
  
  if (children.length === 0) {
    return { ...props.item, path: props.item?.path || '', noShowingChildren: true };
  }
  
  if (children.length === 1 && !children[0]?.meta?.showParent) {
    return children[0];
  }
  
  return null;
});

// 是否显示为单个菜单项（无子菜单）
const showAsMenuItem = computed(() => {
  return onlyOneChild.value && (!onlyOneChild.value.children || onlyOneChild.value.noShowingChildren);
});

// 获取图标
const menuIcon = computed(() => {
  if (showAsMenuItem.value) {
    return toRaw(onlyOneChild.value?.meta?.icon) || toRaw(props.item?.meta?.icon) || 'ep:menu';
  }
  return toRaw(props.item?.meta?.icon) || 'ep:menu';
});

// 获取标题
const menuTitle = computed(() => {
  if (showAsMenuItem.value) {
    return transformI18n(onlyOneChild.value?.meta?.i18nKey || onlyOneChild.value?.meta?.title);
  }
  return transformI18n(props.item?.meta?.i18nKey || props.item?.meta?.title);
});

// 获取路径
const menuPath = computed(() => {
  if (showAsMenuItem.value) {
    return resolvePath(onlyOneChild.value?.path || '');
  }
  return resolvePath(props.item?.path || '');
});
</script>

<template>
  <!-- 单个菜单项 -->
  <CustomMenuItem 
    v-if="showAsMenuItem" 
    :index="menuPath"
    class="custom-sidebar-item"
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
  
  <!-- 有子菜单 -->
  <CustomSubMenu 
    v-else
    :index="resolvePath(item.path)"
    :popper-class="popperClass"
    popper-direction="bottom"
    class="custom-sidebar-sub-menu"
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
    
    <!-- 子菜单项 -->
    <template v-for="child in item.children" :key="child.path">
      <component
        v-if="child.meta?.showLink !== false"
        :is="ThemeSidebarItem || CustomSidebarItem"
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
  width: 100%;
  
  .menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-right: 5px;
  }
  
  .menu-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// 菜单动画
.menu-animation {
  :deep(.custom-menu-item-content),
  :deep(.custom-sub-menu-title) {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      transform: translateX(4px);
    }
  }
  
  &.is-active {
    :deep(.custom-menu-item-content),
    :deep(.custom-sub-menu-title) {
      animation: menu-bounce 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }
}

@keyframes menu-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
</style>

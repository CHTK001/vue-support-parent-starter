<template>
  <!-- Dock 三级及以上层级：横排纯方形卡片，展开的子级在父卡片上方再叠一行（每层缩一号）。
       卡片尺寸经 --dock-card-size 从父层内联样式继承，跨组件作用域也能生效 -->
  <div class="dock-row" :style="{ zIndex: depth, '--dock-card-size': cardSize }">
    <div v-for="item in items" :key="item.path" class="dock-row-cell">
      <el-tooltip :content="titleOf(item)" placement="top" :show-after="300">
        <button
          type="button"
          class="dock-card"
          :class="cardClass(item)"
          @click="handleClick(item)"
        >
          <ReIcon :name="item.meta?.icon || menuDefaultIcon" :size="depth > 3 ? 15 : 18" />
          <i v-if="hasChildren(item)" class="dock-card-dot" />
        </button>
      </el-tooltip>
      <DockCards
        v-if="hasChildren(item) && isExpanded(item)"
        :items="visibleChildren(item)"
        :depth="depth + 1"
        :expanded-paths="expandedPaths"
        :active-menu="activeMenu"
        :menu-default-icon="menuDefaultIcon"
        @toggle="forwardToggle"
        @navigate="forwardNavigate"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="DockCards">
import { getMenuLanguage } from "@repo/languages";

const props = defineProps<{
  /** 当前层级的菜单项（已过滤 isVisible） */
  items: any[];
  /** 层级：3 起步，用于缩放卡片与 z-index */
  depth: number;
  /** 当前展开链（各级已展开项的 path，单链） */
  expandedPaths: string[];
  /** 当前激活路由（route.meta.activeMenu || route.path） */
  activeMenu: string;
  /** 缺省菜单图标 */
  menuDefaultIcon: string;
}>();

const emit = defineEmits<{
  (e: "toggle", item: any): void;
  (e: "navigate", item: any): void;
}>();

/** 三级 38px，四级起 32px，往下不再缩（菜单极少超过四级） */
const cardSize = props.depth > 3 ? "32px" : "38px";

const titleOf = (item: any) => getMenuLanguage(item.meta?.title);

const hasChildren = (item: any) =>
  !!(item.children?.length && item.children.some((c: any) => c.meta?.isVisible == "1"));

const visibleChildren = (item: any) => (item.children || []).filter((c: any) => c.meta?.isVisible == "1");

const isExpanded = (item: any) => item.path != null && props.expandedPaths.includes(String(item.path));

/** 当前路由是否正好落在该项 */
const isLeafActive = (item: any) => String(item.path) === String(props.activeMenu);

/** 当前路由是否落在该项子树内（整链高亮） */
const containsActive = (menu: any, target: string): boolean => {
  if (String(menu.path) === String(target)) return true;
  if (menu.children?.length) {
    for (const child of menu.children) {
      if (containsActive(child, target)) return true;
    }
  }
  return false;
};

const cardClass = (item: any) => {
  const leafActive = isLeafActive(item);
  return {
    "is-branch": hasChildren(item),
    "is-expanded": isExpanded(item),
    "is-active-leaf": leafActive,
    "is-active-chain": !leafActive && containsActive(item, props.activeMenu)
  };
};

const handleClick = (item: any) => {
  if (hasChildren(item)) emit("toggle", item);
  else emit("navigate", item);
};

const forwardToggle = (item: any) => emit("toggle", item);
const forwardNavigate = (item: any) => emit("navigate", item);
</script>

<style lang="scss" scoped>
.dock-row {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
}

.dock-row-cell {
  position: relative;
  flex: none;
}

/* 展开的子级行：浮于父卡片正上方 */
.dock-row-cell > .dock-row {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.dock-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--dock-card-size, 38px);
  height: var(--dock-card-size, 38px);
  padding: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 11px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  box-shadow: 0 6px 16px rgb(15 23 42 / 10%);
  transition:
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;

  html.dark & {
    box-shadow: 0 6px 16px rgb(0 0 0 / 45%);
  }
}

.dock-card:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  transform: translateY(-3px);
}

/* 可展开角标 */
.dock-card-dot {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
  box-shadow: 0 0 0 2px var(--el-bg-color);
}

/* 激活链路上的卡片：主色描边 + 图标主色 */
.dock-card.is-active-chain,
.dock-card.is-expanded {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.dock-card.is-active-chain {
  box-shadow: 0 8px 20px rgb(var(--el-color-primary-rgb) / 22%);
}

/* 当前路由正中：整块主色渐变实心 */
.dock-card.is-active-leaf {
  border-color: transparent;
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
  color: #fff;
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgb(var(--el-color-primary-rgb) / 40%);

  &:hover {
    color: #fff;
    transform: translateY(-3px);
  }
}
</style>

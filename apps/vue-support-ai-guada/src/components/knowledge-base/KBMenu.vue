<template>
  <nav class="re-surface kb-menu">
    <!-- 视图项：切换 activeTab -->
    <ul class="kb-menu__list">
      <li v-for="item in viewItems" :key="item.key">
        <button
          type="button"
          class="kb-menu__item"
          :class="{ 'is-active': item.key === active }"
          @click="emit('select', item.key)"
        >
          <el-icon class="kb-menu__icon"><component :is="item.icon" /></el-icon>
          <span class="kb-menu__label">{{ item.label }}</span>
        </button>
      </li>
    </ul>

    <!-- 动作项：不切视图，直接触发既有能力（设置 = 知识库档案编辑） -->
    <div class="kb-menu__divider" />
    <ul class="kb-menu__list">
      <li v-for="item in actionItems" :key="item.key">
        <button type="button" class="kb-menu__item" @click="emit('action', item.key)">
          <el-icon class="kb-menu__icon"><component :is="item.icon" /></el-icon>
          <span class="kb-menu__label">{{ item.label }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
/**
 * 知识库详情的二级功能菜单。
 *
 * <p><b>设计</b>：条目 = 图标 + 文字，块级按钮；激活态用主色浅底 + 主色字，
 * 悬浮态只给一层浅填充，整体保持「安静」以让内容区出头。
 * 菜单顶部不再重复知识库名（页头已有），把纵向空间留给条目。</p>
 *
 * <p>菜单项分两类，语义必须区分：</p>
 * <ul>
 *   <li>视图项：切换 {@code activeTab}（概览 / 文档 / 搜索 / 知识图谱 / 智能问答 / 实体管理 / 关系管理）</li>
 *   <li>动作项：不切视图，直接调既有能力（设置）</li>
 * </ul>
 */
import {
  DataLine, Document, Search, Share, ChatDotRound, Grid, Connection, Setting,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'

/** 菜单项 */
interface MenuItem {
  /** 项标识 */
  key: string
  /** 显示文案 */
  label: string
  /** 图标组件 */
  icon: Component
}

defineProps<{
  /** 当前知识库名（保留给外部标题场景，菜单内不再渲染） */
  kbName?: string
  /** 当前激活的视图项 key */
  active: string
}>()

const emit = defineEmits<{
  /** 视图项被点击 */
  (e: 'select', key: string): void
  /** 动作项被点击 */
  (e: 'action', key: string): void
  /** 返回列表页（保留兼容：现由页头返回钮触发） */
  (e: 'back'): void
}>()

/** 视图项：切换 activeTab（概览 / 文档 / 搜索 / 知识图谱 / 智能问答 / 实体管理 / 关系管理） */
const viewItems: ReadonlyArray<MenuItem> = [
  { key: 'overview', label: '概览', icon: DataLine },
  { key: 'files', label: '文档', icon: Document },
  { key: 'search', label: '搜索', icon: Search },
  { key: 'graph', label: '知识图谱', icon: Share },
  { key: 'ask', label: '智能问答', icon: ChatDotRound },
  { key: 'entities', label: '实体管理', icon: Grid },
  { key: 'relations', label: '关系管理', icon: Connection },
]

/** 动作项：触发既有能力，不切视图（设置=知识库档案编辑弹框） */
const actionItems: ReadonlyArray<MenuItem> = [
  { key: 'settings', label: '设置', icon: Setting },
]
</script>

<style scoped>
/* 二级菜单：窄栏卡片，条目安静、激活明确 */
.kb-menu {
  width: 168px;
  flex-shrink: 0;
  align-self: flex-start;
  position: sticky;
  top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
}

.kb-menu__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.kb-menu__item {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 0;
  border-radius: var(--el-radius-md, 10px);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.12s ease;
}

/* 左侧激活指示条：默认收起，激活时展开 */
.kb-menu__item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 0;
  border-radius: 0 3px 3px 0;
  background: var(--el-color-primary);
  transform: translateY(-50%);
  transition: height 0.18s ease;
}

.kb-menu__item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.kb-menu__item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.kb-menu__item.is-active {
  background: linear-gradient(90deg,
      color-mix(in srgb, var(--el-color-primary) 12%, transparent) 0%,
      color-mix(in srgb, var(--el-color-primary) 4%, transparent) 100%);
  color: var(--el-color-primary);
  font-weight: 600;
}

.kb-menu__item.is-active::before {
  height: 18px;
}

.kb-menu__icon {
  font-size: 16px;
  flex-shrink: 0;
  transition: transform 0.18s ease;
}

.kb-menu__item:hover .kb-menu__icon {
  transform: scale(1.08);
}

.kb-menu__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-menu__divider {
  height: 1px;
  margin: 7px 6px;
  background: var(--el-border-color-lighter);
}
</style>

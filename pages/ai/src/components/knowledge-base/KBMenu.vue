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

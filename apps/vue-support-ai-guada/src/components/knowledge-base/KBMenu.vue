<template>
  <nav class="re-surface w-[168px] shrink-0 self-start sticky top-2 flex flex-col gap-1 p-2">
    <!-- 顶部：当前知识库名 + 返回 -->
    <div class="flex items-center justify-between gap-1.5 pb-3 border-b border-[var(--rm-border-light)]">
      <span class="min-w-0 text-sm font-semibold truncate" :title="kbName">{{ kbName || '知识库' }}</span>
    </div>

    <!-- 视图项：切换 activeTab -->
    <ul class="list-none m-0 p-0 mt-2">
      <li v-for="item in viewItems" :key="item.key">
        <button
          type="button"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 mb-0.5 rounded-[var(--rm-radius,10px)] border-0 text-[13px] text-left cursor-pointer transition"
          :class="item.key === active
            ? 'bg-[var(--rm-primary-light-9)] text-[var(--rm-primary)] font-medium'
            : 'bg-transparent text-[var(--rm-text-regular)] hover:bg-[var(--rm-bg-subtle)] hover:text-[var(--rm-text)]'"
          @click="emit('select', item.key)"
        >
          <el-icon class="shrink-0 text-[15px]"><component :is="item.icon" /></el-icon>
          <span class="min-w-0 truncate">{{ item.label }}</span>
        </button>
      </li>

      <!-- 动作项：不切视图，直接触发既有能力 -->
      <li v-for="item in actionItems" :key="item.key">
        <button
          type="button"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 mb-0.5 rounded-[var(--rm-radius,10px)] border-0 text-[13px] text-left cursor-pointer transition bg-transparent text-[var(--rm-text-regular)] hover:bg-[var(--rm-bg-subtle)] hover:text-[var(--rm-text)]"
          @click="emit('action', item.key)"
        >
          <el-icon class="shrink-0 text-[15px]"><component :is="item.icon" /></el-icon>
          <span class="min-w-0 truncate">{{ item.label }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
/**
 * 知识库详情的二级功能菜单。
 *
 * <p>风格与系统一致：布局用 Tailwind 工具类，容器表面用组件库基线 {@code re-surface}，
 * 返回按钮用应用本地 koi 封装 {@code ReButton}。不再手写 BEM CSS。</p>
 *
 * <p>只做「内容区内的功能导航」，不含系统一级侧边栏与顶栏（那两层由 layout 提供）。</p>
 *
 * <p>菜单项分两类，语义必须区分：</p>
 * <ul>
 *   <li>视图项：切换 {@code activeTab}（概览 / 文档 / 搜索 / 知识图谱 / 智能问答）</li>
 *   <li>动作项：不切视图，直接调既有能力（实体管理 / 关系管理 / 设置）</li>
 * </ul>
 */
import {
  DataLine, Document, Search, Share, ChatDotRound, Grid, Connection, Setting,
  ArrowLeft,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'
import ReButton from '@/components/re/ReButton.vue'

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
  /** 当前知识库名，用于菜单顶部标题 */
  kbName?: string
  /** 当前激活的视图项 key */
  active: string
}>()

const emit = defineEmits<{
  /** 视图项被点击 */
  (e: 'select', key: string): void
  /** 动作项被点击 */
  (e: 'action', key: string): void
  /** 返回列表页 */
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
<template>
  <nav class="kb-menu">
    <!-- 顶部：当前知识库名 + 返回列表（对应参考图二级栏的标题行） -->
    <div class="kb-menu__head">
      <span class="kb-menu__title truncate">{{ kbName || '知识库' }}</span>
      <el-button link class="kb-menu__back" @click="$emit('back')">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
    </div>

    <ul class="kb-menu__list">
      <!-- 纯查看项：切换 activeTab -->
      <li v-for="item in viewItems" :key="item.key">
        <button
          type="button"
          class="kb-menu__item"
          :class="{ 'is-active': item.key === active }"
          @click="$emit('select', item.key)"
        >
          <el-icon class="kb-menu__icon"><component :is="item.icon" /></el-icon>
          <span class="kb-menu__label">{{ item.label }}</span>
        </button>
      </li>

      <!-- 动作项：不做视图切换，直接触发既有能力（弹窗 / 编辑） -->
      <li v-for="item in actionItems" :key="item.key">
        <button type="button" class="kb-menu__item" @click="$emit('action', item.key)">
          <el-icon class="kb-menu__icon"><component :is="item.icon" /></el-icon>
          <span class="kb-menu__label">{{ item.label }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
/**
 * 知识库详情的二级功能菜单（对应参考图左侧那条竖排菜单）。
 *
 * <p>只做「内容区内的功能导航」，不含系统的一级侧边栏与顶栏 —— 那两层由 layout 提供，
 * 不在这里复刻。</p>
 *
 * <p>菜单项分两类，语义上必须区分开：</p>
 * <ul>
 *   <li>视图项：切换 {@code activeTab}（概览 / 文档 / 搜索 / 知识图谱 / 智能问答）</li>
 *   <li>动作项：不切视图，直接调既有能力（实体管理 / 关系管理 打开既有管理弹窗，设置打开编辑）</li>
 * </ul>
 *
 * <p>颜色与圆角全部走 Element / koi 变量，不写死色值。</p>
 */
import {
  DataLine, Document, Search, Share, Grid, Connection, ChatDotRound, Setting,
  ArrowLeft,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'

/** 视图项：切换 activeTab */
interface MenuItem {
  key: string
  label: string
  icon: Component
}

defineProps<{
  /** 当前知识库名，用于菜单顶部标题 */
  kbName?: string
  /** 当前激活的视图项 key */
  active: string
}>()

defineEmits<{
  /** 视图项被点击 */
  (e: 'select', key: string): void
  /** 动作项被点击 */
  (e: 'action', key: string): void
  /** 返回列表页 */
  (e: 'back'): void
}>()

/** 视图项：切换 activeTab */
const viewItems: ReadonlyArray<MenuItem> = [
  { key: 'overview', label: '概览', icon: DataLine },
  { key: 'files', label: '文档', icon: Document },
  { key: 'search', label: '搜索', icon: Search },
  { key: 'graph', label: '知识图谱', icon: Share },
  { key: 'ask', label: '智能问答', icon: ChatDotRound },
]

/** 动作项：触发既有能力，不切视图 */
const actionItems: ReadonlyArray<MenuItem> = [
  { key: 'entity', label: '实体管理', icon: Grid },
  { key: 'relation', label: '关系管理', icon: Connection },
  { key: 'settings', label: '设置', icon: Setting },
]
</script>

<style scoped>
.kb-menu {
  flex: 0 0 168px;
  width: 168px;
  align-self: flex-start;
  position: sticky;
  top: 8px;
  padding: 12px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color-overlay);
}

.kb-menu__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 2px 6px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.kb-menu__title {
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-menu__back {
  flex: 0 0 auto;
}

.kb-menu__list {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.kb-menu__item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 2px;
  border: none;
  border-radius: var(--el-border-radius-base);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);
}

.kb-menu__item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

/* 选中态：主色浅底 + 主色字，与系统菜单一致的表达方式 */
.kb-menu__item.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
}

.kb-menu__icon {
  flex: 0 0 auto;
  font-size: 15px;
}

.kb-menu__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<template>
  <!--
    菜单管理（管理员）：把侧栏所有菜单列出来，逐项用「显示 / 隐藏」分段单选切换。

    <p>刻意不嵌系统管理里的 MenuManage（那是 sys_menu 的增删改，字段多、操作重）：
    这里只需要「主页有哪些菜单、哪些要显示」，改的是本地显示偏好，
    与侧栏 <code>showXxxMenu</code> 那套 localStorage 口径完全一致。</p>

    <p>清单来自 config/sidebarMenu.ts，与侧栏同源，不会出现「侧栏有、这里没有」。</p>
  -->
  <div class="menu-display">
    <header class="md-head">
      <h2 class="md-title">菜单管理</h2>
      <p class="md-sub">
        控制左侧导航显示哪些菜单。修改立即生效，无需刷新页面。
        「固定显示」的项是主入口（会话 / 酒馆），不提供开关。
      </p>
    </header>

    <div v-for="group in groups" :key="group.name" class="md-group">
      <div class="md-group-title">{{ group.name }}</div>
      <div class="md-rows">
        <div v-for="row in group.rows" :key="row.key" class="md-row" :class="{ 'is-child': row.depth > 0 }">
          <div class="md-row-main">
            <span class="md-row-name">{{ row.label }}</span>
            <span v-if="row.adminOnly" class="md-tag">仅管理员</span>
            <span v-if="row.alwaysShow" class="md-tag md-tag--fixed">固定显示</span>
          </div>
          <div class="md-row-ctrl">
            <span v-if="row.alwaysShow || !row.showKey" class="md-fixed-hint">固定显示</span>
            <template v-else>
              <ReSwitch
                layout="radio"
                :model-value="visibleOf(row.showKey)"
                radio-on-label="显示"
                radio-off-label="隐藏"
                @update:model-value="(v) => toggle(row.showKey, v)"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ReSwitch from '@repo/ui/re-switch'
import { useModelConfigStore } from '../../stores/modelConfig'
import {
  createSidebarMenuItems, readMenuSettings, setMenuVisible, menuDisplayVersion,
  type SidebarMenuItem,
} from '../../config/sidebarMenu'

const { t } = useI18n()
const modelConfig = useModelConfigStore()

/**
 * 是否 Electron 壳（只影响快捷键文案，这里不展示快捷键）。
 */
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined

/**
 * 扁平化菜单项，保留层级深度（子项缩进显示）。
 *
 * @param items 菜单项
 * @param depth 当前深度
 * @returns 扁平行
 */
const flatten = (items: SidebarMenuItem[], depth = 0): Array<SidebarMenuItem & { depth: number }> => {
  const out: Array<SidebarMenuItem & { depth: number }> = []
  for (const item of items) {
    out.push({ ...item, depth })
    if (item.children?.length) {
      out.push(...flatten(item.children, depth + 1))
    }
  }
  return out
}

/**
 * 按分组聚合后的行。
 */
const groups = computed(() => {
  // 依赖版本号：切换后本页与侧栏同步刷新
  void menuDisplayVersion.value
  const items = createSidebarMenuItems({ t: t as (k: string) => string, isElectron, modelConfig: modelConfig as any })
  const rows = flatten(items)
  const order: string[] = []
  const bucket = new Map<string, typeof rows>()
  for (const row of rows) {
    // 子项跟随父项所在分组
    const name = row.section || (row.depth > 0 ? (findParentSection(items, row.key) || '主导航') : '主导航')
    if (!bucket.has(name)) {
      bucket.set(name, [])
      order.push(name)
    }
    bucket.get(name)!.push(row)
  }
  return order.map((name) => ({ name, rows: bucket.get(name)! }))
})

/**
 * 找某个子项所属父项的分组名。
 *
 * @param items 顶层菜单项
 * @param childKey 子项 key
 * @returns 分组名；找不到返回空串
 */
function findParentSection(items: SidebarMenuItem[], childKey: string): string {
  for (const item of items) {
    if (item.children?.some((c) => c.key === childKey)) {
      return item.section || '主导航'
    }
  }
  return ''
}

/**
 * 读取某菜单当前是否显示（缺省显示）。
 *
 * @param showKey 显示键
 * @returns 是否显示
 */
const visibleOf = (showKey?: string): boolean => {
  if (!showKey) {
    return true
  }
  return readMenuSettings()[showKey] !== false
}

/**
 * 切换显示状态。
 *
 * @param showKey 显示键
 * @param value 是否显示
 */
const toggle = (showKey: string | undefined, value: boolean): void => {
  if (!showKey) {
    return
  }
  setMenuVisible(showKey, value)
}
</script>

<style scoped>
.menu-display { display: flex; flex-direction: column; gap: 18px; padding: 4px 2px; }
.md-title { margin: 0 0 6px; font-size: 16px; font-weight: 700; color: var(--el-text-color-primary); }
.md-sub { margin: 0; font-size: 12px; line-height: 1.6; color: var(--el-text-color-secondary); }

.md-group { display: flex; flex-direction: column; gap: 8px; }
.md-group-title {
  font-size: 12px; font-weight: 600; letter-spacing: .4px;
  color: var(--el-text-color-secondary);
  text-transform: none;
}
.md-rows {
  display: flex; flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
  background: var(--el-bg-color);
}
.md-row {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.md-row:last-child { border-bottom: none; }
.md-row.is-child { padding-left: 34px; background: color-mix(in srgb, var(--el-fill-color-light) 45%, transparent); }
.md-row-main { display: flex; align-items: center; gap: 8px; min-width: 0; }
.md-row-name { font-size: 13px; font-weight: 500; color: var(--el-text-color-primary); }
.md-tag {
  font-size: 11px; line-height: 1; padding: 3px 7px; border-radius: 999px;
  color: var(--el-color-primary); background: var(--el-color-primary-light-9);
}
.md-tag--fixed { color: var(--el-text-color-secondary); background: var(--el-fill-color); }
.md-row-ctrl { flex-shrink: 0; }
.md-fixed-hint { font-size: 12px; color: var(--el-text-color-placeholder); }
</style>

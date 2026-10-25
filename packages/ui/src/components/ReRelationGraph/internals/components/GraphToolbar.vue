<script setup lang="ts">
/**
 * 关系图工具栏（地图式工具条，由 G6Graph 内联模板拆分而来）
 *
 * <p>职责：布局选择、节点搜索、布局调参入口、分组/高亮/悬停聚焦、适配视口、
 * 撤销重做、连线模式、导出、小地图、2D/3D 切换、删除/更新选中项。
 * 所有状态由父级传入，动作以事件回传，本组件不做图实例操作。</p>
 *
 * @author CH
 */
import ReButton from "../../../ReButton"
import ReInput from "../../../ReInput"
import ReSelect from "../../../ReSelect"
import { t } from "../i18n"
import type { RelationLayoutName, RelationToolbarItem, RelationToolbarPosition, RelationViewMode } from "../types"

defineOptions({ name: "GraphToolbar" })

const props = withDefaults(
  defineProps<{
    collapsed: boolean
    position: RelationToolbarPosition
    layoutValue: string
    layoutSelectOptions: Array<{ value: string; label: string; disabled?: boolean }>
    layoutDisabled?: boolean
    searchText: string
    searchable?: boolean
    searchPlaceholder?: string
    tunable?: boolean
    tuningOpen?: boolean
    showGroupsOn?: boolean
    highlightMode?: string
    hoverFocusOn?: boolean
    canUndo?: boolean
    canRedo?: boolean
    connectMode?: boolean
    editable?: boolean
    exportable?: boolean
    minimapOn?: boolean
    is3d?: boolean
    selectedIds: string[]
    selectedIsNode?: boolean
    selectedIsEdge?: boolean
    toolbarItems?: RelationToolbarItem[]
    slotApi?: unknown
    slotNodes?: unknown[]
    slotMode?: RelationViewMode
  }>(),
  {
    layoutDisabled: false,
    searchable: true,
    tunable: true,
    tuningOpen: false,
    showGroupsOn: false,
    highlightMode: "adjacent",
    hoverFocusOn: false,
    canUndo: false,
    canRedo: false,
    connectMode: false,
    editable: false,
    exportable: true,
    minimapOn: false,
    is3d: false,
    selectedIds: () => [],
    selectedIsNode: false,
    selectedIsEdge: false,
    toolbarItems: undefined,
    slotApi: undefined,
    slotNodes: () => [],
    slotMode: "2d",
  },
)

const emit = defineEmits<{
  (e: "toggle-collapse"): void
  (e: "layout-change", v: string): void
  (e: "search", keyword: string): void
  (e: "search-clear"): void
  (e: "toggle-tuning"): void
  (e: "toggle-groups", on: boolean): void
  (e: "toggle-highlight"): void
  (e: "toggle-hover-focus", on: boolean): void
  (e: "fit"): void
  (e: "undo"): void
  (e: "redo"): void
  (e: "toggle-connect"): void
  (e: "export"): void
  (e: "toggle-minimap"): void
  (e: "toggle-mode"): void
  (e: "update-selected-node"): void
  (e: "update-selected-edge"): void
  (e: "remove-selected-node"): void
  (e: "remove-selected-edge"): void
}>()

const visible = (name: RelationToolbarItem): boolean =>
  !Array.isArray(props.toolbarItems) || props.toolbarItems.includes(name)

function rovingFocus(dir: 1 | -1, ev: KeyboardEvent): void {
  const root = (ev.currentTarget as HTMLElement)?.querySelector?.(":scope > *")?.parentElement
  const items = Array.from((root ?? ev.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("button, input, .el-select, [role='button']"))
  const idx = items.findIndex((el) => el === document.activeElement)
  if (idx >= 0 && items[idx + dir]) (items[idx + dir] as HTMLElement).focus()
}
</script>

<template>
  <div
    class="rrg__toolbar"
    :class="['rrg__toolbar--' + props.position, { 'is-collapsed': props.collapsed }]"
    role="toolbar"
    :aria-label="t('toolbar.aria', '关系图工具栏')"
    @keydown.left.prevent="rovingFocus(-1, $event)"
    @keydown.right.prevent="rovingFocus(1, $event)"
  >
    <button
      type="button"
      class="rrg__toolbar-collapse"
      :class="{ 'is-collapsed': props.collapsed }"
      :title="props.collapsed ? t('toolbar.expandTip', '展开工具栏') : t('toolbar.collapseTip', '收起工具栏')"
      :aria-label="props.collapsed ? t('toolbar.expand', '展开') : t('toolbar.collapse', '收缩')"
      :aria-expanded="!props.collapsed"
      @click.stop="emit('toggle-collapse')"
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </button>
    <ReSelect
      v-if="visible('layout')"
      :model-value="layoutValue"
      class="rrg__layout"
      size="small"
      :options="layoutSelectOptions"
      :disabled="layoutDisabled"
      :placeholder="t('toolbar.layout', '选择布局')"
      @update:model-value="(v: unknown) => emit('layout-change', String(v))"
    />
    <ReInput
      v-if="searchable"
      :model-value="searchText"
      class="rrg__search"
      size="small"
      clearable
      :placeholder="searchPlaceholder || t('toolbar.searchPlaceholder', '搜索节点…')"
      :aria-label="t('toolbar.search', '搜索节点')"
      :title="t('toolbar.search', '搜索节点')"
      @update:model-value="(v: unknown) => emit('search', String(v))"
      @keyup.enter="emit('search', searchText)"
      @clear="emit('search-clear')"
    />
    <ReButton
      v-if="tunable && visible('layoutSettings')"
      layout="square"
      :type="tuningOpen ? 'primary' : ''"
      icon="Operation"
      :tip="t('toolbar.tuning', '布局参数')"
      :aria-label="t('toolbar.tuning', '布局参数')"
      :aria-expanded="tuningOpen"
      @click="emit('toggle-tuning')"
    />
    <ReButton
      v-if="visible('group')"
      layout="square"
      :type="showGroupsOn ? 'primary' : ''"
      icon="FolderOpened"
      :tip="showGroupsOn ? t('toolbar.groupOff', '关闭分组容器') : t('toolbar.groupOn', '显示分组容器')"
      :aria-label="t('toolbar.group', '分组')"
      :aria-pressed="showGroupsOn"
      @click="emit('toggle-groups', !showGroupsOn)"
    />
    <ReButton
      v-if="visible('highlight')"
      layout="square"
      :type="highlightMode === 'none' ? '' : 'primary'"
      icon="Aim"
      :tip="t('toolbar.highlightTitle', '切换悬停高亮模式：相邻/分组/两者/关闭')"
      :aria-label="t('toolbar.highlight', '悬停高亮')"
      :aria-pressed="highlightMode !== 'none'"
      @click="emit('toggle-highlight')"
    />
    <ReButton
      v-if="visible('hoverFocus')"
      layout="square"
      :type="hoverFocusOn ? 'primary' : ''"
      icon="View"
      :tip="hoverFocusOn ? t('toolbar.hoverFocusOff', '悬停时淡出其它节点') : t('toolbar.hoverFocusOn', '悬停时隐藏其它节点')"
      :aria-label="t('toolbar.hoverFocus', '悬停聚焦')"
      :aria-pressed="hoverFocusOn"
      @click="emit('toggle-hover-focus', !hoverFocusOn)"
    />
    <ReButton
      v-if="visible('fit')"
      layout="square"
      icon="FullScreen"
      :tip="t('toolbar.fit', '适配视口')"
      :aria-label="t('toolbar.fit', '适配视口')"
      @click="emit('fit')"
    />
    <ReButton
      v-if="editable && visible('undo')"
      layout="square"
      :disabled="is3d || !canUndo"
      icon="RefreshLeft"
      :tip="t('toolbar.undo', '撤销')"
      :aria-label="t('toolbar.undo', '撤销')"
      @click="emit('undo')"
    />
    <ReButton
      v-if="editable && visible('redo')"
      layout="square"
      :disabled="is3d || !canRedo"
      icon="RefreshRight"
      :tip="t('toolbar.redo', '重做')"
      :aria-label="t('toolbar.redo', '重做')"
      @click="emit('redo')"
    />
    <ReButton
      v-if="editable && visible('connect')"
      layout="square"
      :type="connectMode ? 'primary' : ''"
      :disabled="is3d"
      icon="Connection"
      :tip="connectMode ? t('toolbar.connectOff', '退出连线模式') : t('toolbar.connect', '连线模式')"
      :aria-label="t('toolbar.connect', '连线模式')"
      :aria-pressed="connectMode"
      @click="emit('toggle-connect')"
    />
    <ReButton
      v-if="exportable && visible('export')"
      layout="square"
      icon="Download"
      :tip="t('toolbar.export', '导出图片')"
      :aria-label="t('toolbar.export', '导出图片')"
      @click="emit('export')"
    />
    <ReButton
      v-if="visible('minimap')"
      layout="square"
      :type="minimapOn ? 'primary' : ''"
      :disabled="is3d"
      icon="MapLocation"
      :tip="minimapOn ? t('toolbar.minimapOn', '隐藏小地图') : t('toolbar.minimapOff', '显示小地图')"
      :aria-label="t('toolbar.minimap', '小地图')"
      :aria-pressed="minimapOn"
      @click="emit('toggle-minimap')"
    />
    <ReButton
      v-if="visible('mode')"
      layout="square"
      :type="is3d ? 'primary' : ''"
      icon="Compass"
      :tip="is3d ? t('toolbar.modeTitle2d', '切回 2D 画布') : t('toolbar.modeTitle3d', '切换到 3D 力导向视图')"
      :aria-label="is3d ? t('toolbar.modeTitle2d', '切回 2D 画布') : t('toolbar.modeTitle3d', '切换到 3D 力导向视图')"
      @click="emit('toggle-mode')"
    />
    <ReButton
      v-if="editable && !is3d && selectedIds.length === 1 && selectedIsNode && visible('delete')"
      layout="square"
      icon="EditPen"
      :tip="t('toolbar.updateNodeTip', '更新选中节点')"
      :aria-label="t('toolbar.updateNodeTip', '更新选中节点')"
      @click="emit('update-selected-node')"
    />
    <ReButton
      v-if="editable && !is3d && selectedIds.length === 1 && selectedIsEdge && visible('delete')"
      layout="square"
      icon="EditPen"
      :tip="t('toolbar.updateEdgeTip', '更新选中边')"
      :aria-label="t('toolbar.updateEdgeTip', '更新选中边')"
      @click="emit('update-selected-edge')"
    />
    <ReButton
      v-if="editable && !is3d && selectedIds.length === 1 && selectedIsNode && visible('delete')"
      layout="square"
      type="danger"
      icon="Delete"
      :tip="t('toolbar.removeNodeTip', '删除选中节点')"
      :aria-label="t('toolbar.removeNodeTip', '删除选中节点')"
      @click="emit('remove-selected-node')"
    />
    <ReButton
      v-if="editable && !is3d && selectedIds.length === 1 && selectedIsEdge && visible('delete')"
      layout="square"
      type="danger"
      icon="Delete"
      :tip="t('toolbar.removeEdgeTip', '删除选中边')"
      :aria-label="t('toolbar.removeEdgeTip', '删除选中边')"
      @click="emit('remove-selected-edge')"
    />
    <slot name="toolbar-extra" :api="slotApi" :nodes="slotNodes" :mode="slotMode" />
  </div>
</template>
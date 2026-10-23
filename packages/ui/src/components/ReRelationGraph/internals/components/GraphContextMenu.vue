<script setup lang="ts">
/**
 * 关系图右键菜单（纯展示，G6Graph 内联模板拆分而来）
 *
 * <p>父组件维护 {@code visible/x/y/kind/id} 并将可点击项作为数据传入；
 * 菜单项支持自定义插槽与事件，删除/关闭等动作由父级 emit 处理。</p>
 *
 * @author CH
 */
import ReIcon from "../../../ReIcon"
import type { RelationContextMenuItem, RelationNode } from "../types"

defineOptions({ name: "GraphContextMenu" })

export interface GraphMenuState {
  visible: boolean
  x: number
  y: number
  kind: "node" | "edge" | "canvas"
  id: string
}

export interface GraphMenuItem {
  key: string
  label: string
  icon?: string
  danger?: boolean
  disabled?: boolean
}

const props = defineProps<{
  menu: GraphMenuState
  /** 是否启用查看详情入口 */
  details?: boolean
  /** 是否启用右键扩线入口 */
  loadNeighbors?: boolean
  /** 已扩线节点 id 集合（决定“扩线”是否隐藏） */
  expandedIds: Set<string>
  /** 正在扩线的节点 id */
  expandingIds: string[]
  /** 当前选中数量（最短路径需要 >=2） */
  selectedCount: number
  /** 是否有最短路径高亮（恢复原图入口） */
  hasPath: boolean
  /** 是否可编辑 */
  editable?: boolean
  /** 被右键的节点 */
  node: RelationNode | null
  /** 自定义菜单项（已由父级过滤可见性） */
  items: GraphMenuItem[]
}>()

const emit = defineEmits<{
  (e: "close"): void
  (e: "node-right-click", node: RelationNode | null): void
  (e: "item-click", item: GraphMenuItem): void
  (e: "detail", id: string): void
  (e: "expand", id: string): void
  (e: "shortest-path"): void
  (e: "restore-path"): void
  (e: "remove-node", id: string): void
  (e: "remove-edge", id: string): void
}>()

const label = (): string => {
  if (props.menu.kind === "node") return props.node?.label ?? props.menu.id
  if (props.menu.kind === "edge") return props.menu.id
  return "空白处"
}
</script>

<template>
  <div
    v-if="menu.visible"
    class="rrg__menu"
    :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
    @click.stop
  >
    <div
      class="rrg__menu-item"
      @click="emit('close'); emit('node-right-click', node)"
    >
      <slot name="menu" :kind="menu.kind" :id="menu.id">
        <span v-if="menu.kind === 'node'">节点：{{ label() }}</span>
        <span v-else-if="menu.kind === 'edge'">边：{{ menu.id }}</span>
        <span v-else>空白处</span>
      </slot>
    </div>

    <div
      v-for="item in items"
      :key="item.key"
      class="rrg__menu-item"
      :class="{ 'is-danger': item.danger, 'is-disabled': item.disabled }"
      @click="!item.disabled && emit('item-click', item)"
    >
      <ReIcon v-if="item.icon" :name="item.icon" :size="14" />
      <span>{{ item.label }}</span>
    </div>

    <div
      v-if="details && menu.kind === 'node'"
      class="rrg__menu-item"
      @click="emit('detail', menu.id); emit('close')"
    >
      <span>查看详情</span>
    </div>

    <div
      v-if="menu.kind === 'node' && loadNeighbors && !expandedIds.has(menu.id)"
      class="rrg__menu-item"
      @click="emit('expand', menu.id); emit('close')"
    >
      <span>{{ expandingIds.includes(menu.id) ? '扩线中…' : '扩线' }}</span>
    </div>

    <div
      v-if="menu.kind === 'node' && selectedCount >= 2"
      class="rrg__menu-item"
      @click="emit('shortest-path'); emit('close')"
    >
      <span>最短路径</span>
    </div>
    <div v-if="hasPath" class="rrg__menu-item" @click="emit('restore-path'); emit('close')">
      <span>恢复原图</span>
    </div>

    <template v-if="editable">
      <div v-if="menu.kind === 'node'" class="rrg__menu-item is-danger" @click="emit('remove-node', menu.id); emit('close')">删除该节点</div>
      <div v-if="menu.kind === 'edge'" class="rrg__menu-item is-danger" @click="emit('remove-edge', menu.id); emit('close')">删除该边</div>
    </template>
    <div class="rrg__menu-item" @click="emit('close')">关闭</div>
  </div>
</template>

<style scoped lang="scss">
.rrg__menu {
  position: absolute;
  z-index: 20;
  min-width: 160px;
  padding: 6px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-size: 13px;
}

.rrg__menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--el-text-color-primary, #303133);
  white-space: nowrap;

  &:hover {
    background: var(--el-fill-color-light, #f5f7fa);
  }

  &.is-danger {
    color: var(--el-color-danger, #f56c6c);
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
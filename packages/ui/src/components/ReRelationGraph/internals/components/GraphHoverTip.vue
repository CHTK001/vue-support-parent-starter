<script setup lang="ts">
/**
 * 节点悬浮提示（纯展示，G6Graph 内联模板拆分而来）
 *
 * <p>由父组件在 `node:pointerenter/leave` 时维护 {@code node}；
 * 支持 `#hover` 插槽自定义内容，缺省展示名称与分组。</p>
 *
 * @author CH
 */
defineOptions({ name: "GraphHoverTip" })
defineProps<{
  /** 当前悬停的节点；null 时不渲染 */
  node: { id: string; label?: string; group?: string } | null
}>()
</script>

<template>
  <div v-if="node" class="rrg__tip">
    <slot name="hover" :node="node">
      <div class="rrg__tip-title">{{ node.label ?? node.id }}</div>
      <div v-if="node.group" class="rrg__tip-row">分组：{{ node.group }}</div>
    </slot>
  </div>
</template>

<style scoped lang="scss">
.rrg__tip {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  pointer-events: none;
  padding: 8px 12px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  max-width: 260px;
}

.rrg__tip-title {
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.rrg__tip-row {
  color: var(--el-text-color-secondary, #909399);
  margin-top: 4px;
}
</style>
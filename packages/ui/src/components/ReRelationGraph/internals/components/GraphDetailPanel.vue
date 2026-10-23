<script setup lang="ts">
/**
 * 节点详情面板（纯展示，G6Graph 内联模板拆分而来）
 *
 * <p>父组件维护 {@code node} / {@code loading} / {@code data}，
 * 支持 `#node-detail` 插槽自定义详情内容；缺省按 key-value 渲染。
 * 懒加载状态由父组件处理，本组件只负责展示与关闭按钮。</p>
 *
 * @author CH
 */
import { t } from "../i18n"

defineOptions({ name: "GraphDetailPanel" })

const props = defineProps<{
  node: { id: string; label?: string } | null
  loading: boolean
  data: Record<string, unknown> | null
}>()

const emit = defineEmits<{ (e: "close"): void }>()

function displayDetailValue(v: unknown): string {
  if (v == null) return ""
  if (typeof v === "object") {
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  return String(v)
}
</script>

<template>
  <div v-if="props.node" class="rrg__detail">
    <div class="rrg__detail-head">
      <span class="rrg__detail-title">{{ props.node.label ?? props.node.id }}</span>
      <button
        type="button"
        class="rrg__detail-close"
        :title="t('toolbar.tuningClose', '关闭')"
        :aria-label="t('toolbar.tuningClose', '关闭')"
        @click="emit('close')"
      >
        ✕
      </button>
    </div>
    <div v-if="props.loading" class="rrg__detail-loading">加载中…</div>
    <slot
      v-else
      name="node-detail"
      :node="props.node"
      :data="props.data"
      :loading="props.loading"
      :close="() => emit('close')"
    >
      <div class="rrg__detail-body">
        <div v-for="(v, k) in props.data ?? {}" :key="String(k)" class="rrg__detail-row">
          <span class="rrg__detail-key">{{ k }}</span>
          <span class="rrg__detail-value">{{ displayDetailValue(v) }}</span>
        </div>
      </div>
    </slot>
  </div>
</template>

<style scoped lang="scss">
.rrg__detail {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 11;
  width: 260px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  font-size: 12px;
  overflow: hidden;
}

.rrg__detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.rrg__detail-title {
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.rrg__detail-close {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-secondary, #909399);
  font-size: 14px;
  padding: 2px 4px;
}

.rrg__detail-loading {
  padding: 20px;
  text-align: center;
  color: var(--el-text-color-secondary, #909399);
}

.rrg__detail-body {
  padding: 8px 12px;
  max-height: 320px;
  overflow-y: auto;
}

.rrg__detail-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter, #ebeef5);
}

.rrg__detail-key {
  color: var(--el-text-color-secondary, #909399);
  flex-shrink: 0;
}

.rrg__detail-value {
  color: var(--el-text-color-primary, #303133);
  word-break: break-all;
  text-align: right;
}
</style>
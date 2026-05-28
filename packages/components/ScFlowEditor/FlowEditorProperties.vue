<template>
  <aside class="fe-props">
    <div class="fe-props__header">
      <span class="fe-props__title">{{ edge ? '边属性' : '属性设置' }}</span>
      <button class="fe-props__close" @click="emit('close')">
        <svg viewBox="0 0 14 14" width="12" height="12" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="fe-props__body">
      <!-- ── 边属性 ── -->
      <template v-if="edge">
        <div class="fe-props__group">
          <div class="fe-props__group-title">基本信息</div>
          <div class="fe-props__field">
            <label>标签</label>
            <input :value="edge.label || ''" @input="onEdgeChange('label', ($event.target as HTMLInputElement).value)" />
          </div>
          <div class="fe-props__field">
            <label>来源节点</label>
            <span class="fe-props__value-mono">{{ edge.source }}</span>
          </div>
          <div class="fe-props__field">
            <label>目标节点</label>
            <span class="fe-props__value-mono">{{ edge.target }}</span>
          </div>
          <div class="fe-props__field">
            <label>边 ID</label>
            <span class="fe-props__value-mono">{{ edge.id }}</span>
          </div>
        </div>

        <div v-if="edge.runtimeStatus" class="fe-props__group">
          <div class="fe-props__group-title">运行状态</div>
          <div class="fe-props__status-bar">
            <span class="fe-props__status-dot" :class="`fe-props__status-dot--${edge.runtimeStatus.toLowerCase()}`" />
            <span class="fe-props__status-text">{{ edge.runtimeStatus }}</span>
          </div>
        </div>
      </template>

      <!-- ── 节点属性 ── -->
      <template v-else-if="node">
        <div class="fe-props__group">
          <div class="fe-props__group-title">基本信息</div>
          <div class="fe-props__field">
            <label>名称</label>
            <input :value="node.label" @input="onChange('label', ($event.target as HTMLInputElement).value)" />
          </div>
          <div class="fe-props__field">
            <label>类型</label>
            <span class="fe-props__value-tag">{{ node.kind || node.type || '-' }}</span>
          </div>
          <div class="fe-props__field">
            <label>节点 ID</label>
            <span class="fe-props__value-mono">{{ node.id }}</span>
          </div>
        </div>

        <div class="fe-props__group">
          <div class="fe-props__group-title">位置</div>
          <div class="fe-props__field-row">
            <div class="fe-props__field">
              <label>X</label>
              <input type="number" :value="Math.round(node.position.x)" @input="onPositionChange('x', ($event.target as HTMLInputElement).value)" />
            </div>
            <div class="fe-props__field">
              <label>Y</label>
              <input type="number" :value="Math.round(node.position.y)" @input="onPositionChange('y', ($event.target as HTMLInputElement).value)" />
            </div>
          </div>
        </div>

        <div v-if="node.runtimeStatus" class="fe-props__group">
          <div class="fe-props__group-title">运行状态</div>
          <div class="fe-props__status-bar">
            <span class="fe-props__status-dot" :class="`fe-props__status-dot--${node.runtimeStatus.toLowerCase()}`" />
            <span class="fe-props__status-text">{{ node.runtimeStatus }}</span>
          </div>
          <div v-if="node.displayInfo" class="fe-props__field">
            <label>状态信息</label>
            <span class="fe-props__value">{{ node.displayInfo }}</span>
          </div>
          <div v-if="node.errorMessage" class="fe-props__field">
            <label>错误信息</label>
            <span class="fe-props__value fe-props__value--error">{{ node.errorMessage }}</span>
          </div>
        </div>

        <div v-if="node.containerSize" class="fe-props__group">
          <div class="fe-props__group-title">容器尺寸</div>
          <div class="fe-props__field-row">
            <div class="fe-props__field">
              <label>宽</label>
              <span class="fe-props__value">{{ node.containerSize[0] }}</span>
            </div>
            <div class="fe-props__field">
              <label>高</label>
              <span class="fe-props__value">{{ node.containerSize[1] }}</span>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="fe-props__empty">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M12 8v4M12 16h0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <span>选择一个节点或边查看属性</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { FlowEditorNode, FlowEditorEdge } from "./FlowEditor.vue";

const props = defineProps<{
  node: FlowEditorNode | null;
  edge: FlowEditorEdge | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:node', payload: { nodeId: string; data: Partial<FlowEditorNode> }): void;
  (e: 'update:edge', payload: { edgeId: string; data: Partial<FlowEditorEdge> }): void;
}>();

function onChange(field: string, value: string) {
  if (!props.node) return;
  emit('update:node', { nodeId: props.node.id, data: { [field]: value } as any });
}

function onEdgeChange(field: string, value: string) {
  if (!props.edge) return;
  emit('update:edge', { edgeId: props.edge.id, data: { [field]: value } as any });
}

function onPositionChange(axis: 'x' | 'y', value: string) {
  if (!props.node) return;
  const num = parseFloat(value);
  if (isNaN(num)) return;
  const pos = { ...props.node.position, [axis]: num };
  emit('update:node', { nodeId: props.node.id, data: { position: pos } as any });
}
</script>

<style scoped>
.fe-props {
  background: var(--el-bg-color-overlay, #0f1525);
  border-left: 1px solid var(--el-border-color, #1e2a45);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}
.fe-props__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color, #1e2a45);
  flex-shrink: 0;
}
.fe-props__title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary, #e8edf5);
  letter-spacing: 0.3px;
}
.fe-props__close {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--el-text-color-placeholder, #5a6478);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.fe-props__close:hover {
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  color: var(--el-color-danger, #ef4444);
}

.fe-props__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px 16px;
}
.fe-props__body::-webkit-scrollbar {
  width: 4px;
}
.fe-props__body::-webkit-scrollbar-track {
  background: transparent;
}
.fe-props__body::-webkit-scrollbar-thumb {
  background: var(--el-border-color, #1e2a45);
  border-radius: 2px;
}

.fe-props__group {
  margin-bottom: 16px;
}
.fe-props__group-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--el-text-color-placeholder, #5a6478);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color, #1e2a45);
}

.fe-props__field {
  margin-bottom: 8px;
}
.fe-props__field label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: var(--el-text-color-secondary, #8892a8);
  margin-bottom: 4px;
}
.fe-props__field input,
.fe-props__field select {
  width: 100%;
  padding: 6px 8px;
  border-radius: 5px;
  border: 1px solid var(--el-border-color, #1e2a45);
  background: var(--el-fill-color, #0b0f1a);
  color: var(--el-text-color-primary, #e8edf5);
  font-size: 11px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.fe-props__field input:focus {
  border-color: color-mix(in srgb, var(--el-color-primary) 50%, transparent);
}
.fe-props__field input[readonly] {
  color: var(--el-text-color-placeholder, #5a6478);
  cursor: default;
}
.fe-props__field input[type="number"] {
  width: 100%;
}

.fe-props__field-row {
  display: flex;
  gap: 8px;
}
.fe-props__field-row .fe-props__field {
  flex: 1;
}

.fe-props__value {
  font-size: 11px;
  color: var(--el-text-color-regular, #c8d0e0);
  line-height: 1.4;
}
.fe-props__value--error {
  color: var(--el-color-danger, #ef4444);
}
.fe-props__value-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary-light-3, #60a5fa);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, transparent);
}
.fe-props__value-mono {
  font-size: 10px;
  color: var(--el-text-color-placeholder, #5a6478);
  font-family: monospace;
}

.fe-props__status-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 5px;
  background: var(--el-fill-color, #0b0f1a);
  border: 1px solid var(--el-border-color, #1e2a45);
}
.fe-props__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.fe-props__status-dot--running { background: var(--el-color-primary, #3b82f6); box-shadow: 0 0 6px color-mix(in srgb, var(--el-color-primary) 50%, transparent); }
.fe-props__status-dot--success { background: var(--el-color-success, #22c55e); }
.fe-props__status-dot--failed { background: var(--el-color-danger, #ef4444); }
.fe-props__status-dot--wait_manual { background: var(--el-color-warning, #eab308); }
.fe-props__status-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-primary, #e8edf5);
  text-transform: capitalize;
}

.fe-props__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 200px;
  color: var(--el-text-color-placeholder, #5a6478);
  font-size: 12px;
}
</style>

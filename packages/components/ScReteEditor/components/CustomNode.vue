<template>
  <div 
    class="custom-node"
    :class="[
      `node-type-${nodeType}`,
      { 'is-selected': selected }
    ]"
    :style="nodeStyle"
  >
    <!-- 节点头部 -->
    <div class="node-header" :style="headerStyle">
      <div class="node-icon" v-if="nodeIcon">
        <IconifyIconOnline :icon="nodeIcon" />
      </div>
      <div class="node-title">{{ label }}</div>
      <div class="node-actions">
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="action-btn">
            <IconifyIconOnline icon="ri:more-2-fill" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="delete">
                <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
                删除
              </el-dropdown-item>
              <el-dropdown-item command="duplicate">
                <IconifyIconOnline icon="ri:file-copy-line" class="mr-1" />
                复制
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 节点内容 -->
    <div class="node-body">
      <!-- 输入端口 -->
      <div class="node-inputs">
        <div 
          v-for="[key, input] in inputs" 
          :key="key"
          class="input-item"
        >
          <div 
            class="socket input-socket"
            :ref="(el: HTMLElement | null) => setInputSocket(key, el)"
          />
          <span class="socket-label">{{ input.label }}</span>
          <!-- 输入控件 -->
          <div 
            v-if="input.control && !input.showControl" 
            class="input-control"
            :ref="(el: HTMLElement | null) => setInputControl(key, el)"
          />
        </div>
      </div>

      <!-- 节点控件 -->
      <div class="node-controls" v-if="controls.size > 0">
        <div 
          v-for="[key, control] in controls" 
          :key="key"
          class="control-item"
          :ref="(el: HTMLElement | null) => setControl(key, el)"
        />
      </div>

      <!-- 输出端口 -->
      <div class="node-outputs">
        <div 
          v-for="[key, output] in outputs" 
          :key="key"
          class="output-item"
        >
          <span class="socket-label">{{ output.label }}</span>
          <div 
            class="socket output-socket"
            :ref="(el: HTMLElement | null) => setOutputSocket(key, el)"
          />
        </div>
      </div>
    </div>

    <!-- 节点底部状态 -->
    <div class="node-footer" v-if="showFooter">
      <div class="node-status">
        <span class="status-indicator" :class="status" />
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from "vue";
import { ClassicPreset } from "rete";
import type { BaseNode } from "../types";

// Props
const props = defineProps({
  data: {
    type: Object as PropType<BaseNode>,
    required: true,
  },
  emit: {
    type: Function as PropType<(type: string, data?: any) => void>,
    required: true,
  },
  seed: {
    type: String,
    default: "",
  },
});

// 节点基础属性
const label = computed(() => props.data.label);
const nodeType = computed(() => props.data.nodeType || "base");
const nodeIcon = computed(() => props.data.nodeIcon);
const nodeColor = computed(() => props.data.nodeColor || "#6366f1");
const selected = computed(() => props.data.selected);

// 端口和控件
const inputs = computed(() => props.data.inputs);
const outputs = computed(() => props.data.outputs);
const controls = computed(() => props.data.controls);

// 状态
const showFooter = ref(false);
const status = ref<"idle" | "running" | "success" | "error">("idle");
const statusText = computed(() => {
  switch (status.value) {
    case "running": return "运行中...";
    case "success": return "完成";
    case "error": return "错误";
    default: return "";
  }
});

// 样式
const nodeStyle = computed(() => ({
  "--node-color": nodeColor.value,
  width: `${props.data.width || 200}px`,
}));

const headerStyle = computed(() => ({
  background: `linear-gradient(135deg, ${nodeColor.value} 0%, ${adjustColor(nodeColor.value, -20)} 100%)`,
}));

// 辅助函数：调整颜色亮度
function adjustColor(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Socket 引用设置函数
function setInputSocket(key: string, el: HTMLElement | null) {
  if (el) {
    props.emit("render", {
      type: "socket",
      side: "input",
      key,
      nodeId: props.data.id,
      element: el,
      payload: inputs.value.get(key)?.socket,
    });
  }
}

function setOutputSocket(key: string, el: HTMLElement | null) {
  if (el) {
    props.emit("render", {
      type: "socket",
      side: "output",
      key,
      nodeId: props.data.id,
      element: el,
      payload: outputs.value.get(key)?.socket,
    });
  }
}

function setControl(key: string, el: HTMLElement | null) {
  if (el) {
    const control = controls.value.get(key);
    if (control) {
      props.emit("render", {
        type: "control",
        element: el,
        payload: control,
      });
    }
  }
}

function setInputControl(key: string, el: HTMLElement | null) {
  if (el) {
    const input = inputs.value.get(key);
    if (input?.control) {
      props.emit("render", {
        type: "control",
        element: el,
        payload: input.control,
      });
    }
  }
}

// 操作处理
function handleCommand(command: string) {
  switch (command) {
    case "delete":
      props.emit("delete", { id: props.data.id });
      break;
    case "duplicate":
      props.emit("duplicate", { id: props.data.id });
      break;
  }
}
</script>

<style scoped lang="scss">
.custom-node {
  --node-color: #6366f1;
  
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.2s ease;
  overflow: hidden;
  min-width: 180px;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  &.is-selected {
    border-color: var(--node-color);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}

.node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  font-size: 14px;
}

.node-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-actions {
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0.7;
    transition: all 0.2s;

    &:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.node-body {
  padding: 12px;
}

.node-inputs,
.node-outputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-item,
.output-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.output-item {
  justify-content: flex-end;
}

.socket {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--node-color);
  border: 2px solid var(--el-bg-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.2);
    box-shadow: 0 0 8px var(--node-color);
  }
}

.input-socket {
  margin-left: -19px;
}

.output-socket {
  margin-right: -19px;
}

.socket-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.node-controls {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-item {
  :deep(input) {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    font-size: 12px;
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: var(--node-color);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
    }
  }
}

.node-footer {
  padding: 8px 12px;
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-lighter);
}

.node-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-info);

  &.running {
    background: var(--el-color-primary);
    animation: pulse 1s infinite;
  }

  &.success {
    background: var(--el-color-success);
  }

  &.error {
    background: var(--el-color-danger);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 不同类型节点的样式变体
.node-type-input {
  --node-color: #10b981;
}

.node-type-output {
  --node-color: #f59e0b;
}

.node-type-process {
  --node-color: #6366f1;
}

.node-type-condition {
  --node-color: #8b5cf6;
}

.node-type-merge {
  --node-color: #ec4899;
}

.node-type-delay {
  --node-color: #14b8a6;
}
</style>

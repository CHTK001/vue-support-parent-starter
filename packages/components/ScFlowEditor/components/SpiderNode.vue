<template>
  <div
    class="spider-node"
    :class="[
      `spider-node--${data.shape || 'default'}`,
      runtimeClass,
      { 'is-selected': selected },
    ]"
    :style="{ '--node-color': nodeColor }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <!-- 输入句柄 -->
    <Handle type="target" :position="Position.Left" class="spider-handle spider-handle--target" />

    <!-- 圆形节点（START/END） -->
    <template v-if="data.shape === 'circle'">
      <div class="spider-node__circle">
        <img v-if="data.image" :src="data.image" alt="" class="spider-node__circle-image" />
        <IconifyIconOnline v-else :icon="data.icon || 'ri:circle-line'" class="spider-node__circle-icon" />
      </div>
      <div class="spider-node__circle-label">{{ data.label }}</div>
    </template>

    <!-- 脉动节点（HUMAN_INTERVENE） -->
    <template v-else-if="data.shape === 'pulse'">
      <div class="spider-node__pulse-ring"></div>
      <div class="spider-node__header" :style="{ background: nodeColor }">
        <img v-if="data.image" :src="data.image" alt="" class="spider-node__image" />
        <IconifyIconOnline v-else :icon="data.icon || 'ri:user-heart-line'" class="spider-node__icon" />
        <span class="spider-node__title">{{ data.label }}</span>
      </div>
    </template>

    <!-- 菱形节点（CONDITION） -->
    <template v-else-if="data.shape === 'diamond'">
      <div class="spider-node__diamond-shell">
        <div class="spider-node__diamond-body">
          <img v-if="data.image" :src="data.image" alt="" class="spider-node__diamond-image" />
          <IconifyIconOnline v-else :icon="data.icon || 'ri:git-branch-line'" class="spider-node__diamond-icon" />
          <span class="spider-node__diamond-label">{{ data.label }}</span>
        </div>
      </div>
      <!-- 菱形节点两个输出端口：上=满足(pass)，下=不满足(reject) -->
      <Handle type="source" :position="Position.Right" id="pass" class="spider-handle spider-handle--condition spider-handle--pass" />
      <span class="spider-node__condition-tag spider-node__condition-tag--pass">满足</span>
      <Handle type="source" :position="Position.Right" id="reject" class="spider-handle spider-handle--condition spider-handle--reject" />
      <span class="spider-node__condition-tag spider-node__condition-tag--reject">不满足</span>
    </template>

    <!-- 纯图标节点（圆角正方形，无文字） -->
    <template v-else-if="data.shape === 'icon-box'">
      <div class="spider-node__icon-box" :style="{ '--node-color': nodeColor }" :title="data.label">
        <img v-if="data.image" :src="data.image" alt="" class="spider-node__icon-box-image" />
        <IconifyIconOnline v-else :icon="data.icon || 'ri:box-3-line'" class="spider-node__icon-box-icon" />
      </div>
    </template>

    <!-- 默认矩形节点 -->
    <template v-else>
      <div class="spider-node__header" :style="{ background: nodeColor }">
        <img v-if="data.image" :src="data.image" alt="" class="spider-node__image" />
        <IconifyIconOnline v-else :icon="data.icon || 'ri:box-3-line'" class="spider-node__icon" />
        <span class="spider-node__title">{{ data.label }}</span>
      </div>
    </template>

    <!-- 默认输出句柄（非菱形节点使用） -->
    <Handle type="source" :position="Position.Right" class="spider-handle spider-handle--source" />

    <!-- 删除按钮（悬浮显示） -->
    <button
      v-if="hover && !readonly"
      class="spider-node__delete"
      @click.stop="handleDelete"
      title="删除节点"
    >
      <IconifyIconOnline icon="ri:close-line" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Handle, Position, useVueFlow } from "@vue-flow/core";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import type { SpiderNodeData } from "../types";

const props = defineProps<{
  id: string;
  data: SpiderNodeData;
  selected: boolean;
  readonly?: boolean;
}>();

const hover = ref(false);

const nodeColor = computed(() => props.data.color || "#6366f1");
const runtimeClass = computed(() => {
  switch (props.data.runtimeStatus) {
    case "SUCCESS":
      return "is-success";
    case "FAILED":
      return "is-failed";
    case "WAIT_MANUAL":
      return "is-manual";
    case "RUNNING":
      return "is-running";
    default:
      return "";
  }
});

const { removeNodes } = useVueFlow();

function handleDelete() {
  removeNodes([props.id]);
}
</script>

<style scoped lang="scss">
.spider-node {
  position: relative;
  min-width: 160px;
  background: var(--el-bg-color, #fff);
  border: 2px solid var(--el-border-color-lighter, #e5e7eb);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  &.is-selected {
    border-color: var(--node-color, #6366f1);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--node-color, #6366f1) 30%, transparent);
  }

  &.is-success {
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.22), 0 10px 24px rgba(22, 163, 74, 0.16);
    animation: node-success-pulse 1.6s ease-in-out infinite;
  }

  &.is-failed {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.22), 0 10px 24px rgba(220, 38, 38, 0.16);
  }

  &.is-manual {
    border-color: #ca8a04;
    box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.24), 0 10px 24px rgba(202, 138, 4, 0.18);
    animation: node-manual-pulse 1.2s ease-in-out infinite;
  }

  &.is-running {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.22), 0 10px 24px rgba(37, 99, 235, 0.16);
  }
}

// 圆形节点
.spider-node--circle {
  min-width: unset;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-color: var(--node-color, #6366f1);
  background: color-mix(in srgb, var(--node-color, #6366f1) 10%, var(--el-bg-color, #fff));

  .spider-node__circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--node-color, #6366f1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    margin-bottom: 4px;
  }

  .spider-node__circle-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-primary, #333);
    text-align: center;
    line-height: 1.2;
  }
}

// 脉动节点
.spider-node--pulse {
  .spider-node__pulse-ring {
    position: absolute;
    inset: -4px;
    border-radius: 12px;
    border: 2px solid var(--node-color, #6366f1);
    animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    pointer-events: none;
  }

  &.is-manual .spider-node__pulse-ring,
  &.is-running .spider-node__pulse-ring {
    animation-duration: 1.2s;
  }
}

@keyframes pulse-ring {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes node-success-pulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.22), 0 10px 24px rgba(22, 163, 74, 0.16);
  }
  50% {
    box-shadow: 0 0 0 7px rgba(22, 163, 74, 0.18), 0 14px 30px rgba(22, 163, 74, 0.24);
  }
}

@keyframes node-manual-pulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.24), 0 10px 24px rgba(202, 138, 4, 0.18);
  }
  50% {
    box-shadow: 0 0 0 7px rgba(202, 138, 4, 0.18), 0 14px 30px rgba(202, 138, 4, 0.24);
  }
}

// 节点头部
.spider-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px 8px 0 0;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.spider-node__icon {
  font-size: 16px;
}

.spider-node__image,
.spider-node__circle-image {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.spider-node__title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// 句柄
.spider-handle {
  width: 10px !important;
  height: 10px !important;
  border: 2px solid var(--el-border-color, #d1d5db) !important;
  background: var(--el-bg-color, #fff) !important;
  transition: all 0.2s;

  &:hover {
    border-color: var(--node-color, #6366f1) !important;
    transform: scale(1.3);
  }

  &--target {
    left: -5px !important;
  }

  &--source {
    right: -5px !important;
  }

  &--condition {
    width: 10px !important;
    height: 10px !important;

    &--pass {
      right: -5px !important;
      top: 18px !important;
      background: #10b981 !important;
      border-color: #10b981 !important;
    }

    &--reject {
      right: -5px !important;
      top: 66px !important;
      background: #ef4444 !important;
      border-color: #ef4444 !important;
    }
  }
}

.spider-node__condition-tag {
  position: absolute;
  right: -56px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.3;
  white-space: nowrap;
  pointer-events: none;

  &--pass {
    top: 14px;
    color: #047857;
    background: color-mix(in srgb, #10b981 18%, #fff);
    border: 1px solid color-mix(in srgb, #10b981 40%, transparent);
  }

  &--reject {
    top: 62px;
    color: #b91c1c;
    background: color-mix(in srgb, #ef4444 18%, #fff);
    border: 1px solid color-mix(in srgb, #ef4444 40%, transparent);
  }
}

.spider-node--diamond {
  min-width: 120px;
  min-height: 100px;
  background: transparent;
  border: none;
  box-shadow: none;

  &:hover {
    box-shadow: none;
  }

  &.is-selected .spider-node__diamond-body {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--node-color, #6366f1) 30%, transparent);
  }

  &.is-success .spider-node__diamond-body {
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
  }

  &.is-failed .spider-node__diamond-body {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
  }

  &.is-manual .spider-node__diamond-body {
    border-color: #ca8a04;
    box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.24);
  }

  &.is-running .spider-node__diamond-body {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.24);
  }

}

.spider-node__diamond-shell {
  position: relative;
  width: 120px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spider-node__diamond-body {
  width: 64px;
  height: 64px;
  transform: rotate(45deg);
  border-radius: 14px;
  background: color-mix(in srgb, var(--node-color, #6366f1) 20%, var(--el-bg-color, #fff));
  border: 2px solid var(--node-color, #6366f1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
}

.spider-node__diamond-icon,
.spider-node__diamond-image {
  width: 16px;
  height: 16px;
  color: var(--node-color, #6366f1);
  object-fit: contain;
  transform: rotate(-45deg);
}

.spider-node__diamond-label {
  width: 80px;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-primary, #333);
  text-align: center;
  line-height: 1.2;
  transform: rotate(-45deg);
}

.spider-node__condition-tag {
  position: absolute;
  right: -52px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);

  &--pass {
    top: 18px;
    color: #047857;
    background: color-mix(in srgb, #10b981 16%, #fff);
  }

  &--reject {
    top: 58px;
    color: #b91c1c;
    background: color-mix(in srgb, #ef4444 16%, #fff);
  }
}

// 纯图标节点（圆角正方形）
.spider-node--icon-box {
  min-width: unset;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-color: var(--node-color, #6366f1);
  background: color-mix(in srgb, var(--node-color, #6366f1) 12%, var(--el-bg-color, #fff));
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 16px color-mix(in srgb, var(--node-color, #6366f1) 30%, transparent);
  }

  &.is-selected {
    border-color: var(--node-color, #6366f1);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--node-color, #6366f1) 35%, transparent);
  }

  &.is-success {
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.22), 0 4px 12px rgba(22, 163, 74, 0.16);
  }

  &.is-failed {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.22), 0 4px 12px rgba(220, 38, 38, 0.16);
  }

  &.is-manual {
    border-color: #ca8a04;
    box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.24), 0 4px 12px rgba(202, 138, 4, 0.18);
  }

  &.is-running {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.22), 0 4px 12px rgba(37, 99, 235, 0.16);
  }
}

.spider-node__icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.spider-node__icon-box-icon {
  font-size: 24px;
  color: var(--node-color, #6366f1);
}

.spider-node__icon-box-image {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

// 删除按钮
.spider-node__delete {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--el-color-danger, #ef4444);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
  transition: transform 0.15s;
  z-index: 10;

  &:hover {
    transform: scale(1.15);
  }
}
</style>

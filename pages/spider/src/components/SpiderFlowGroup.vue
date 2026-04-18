<template>
  <div
    class="spider-flow-group"
    :class="{ 'is-active': active }"
    :style="groupStyle"
    @mousedown.stop="handleMouseDown"
    @click.stop="$emit('select', group.groupId)"
  >
    <header class="spider-flow-group__header">
      <strong>{{ group.title || "未命名分组" }}</strong>
      <small>{{ (group.nodeIds || []).length }} 节点</small>
    </header>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type FlowGroup = {
  groupId: string;
  title?: string;
  nodeIds?: string[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
};

const props = withDefaults(
  defineProps<{
    active?: boolean;
    group: FlowGroup;
  }>(),
  {
    active: false,
  },
);

const emit = defineEmits<{
  (event: "move", payload: { groupId: string; dx: number; dy: number }): void;
  (event: "select", groupId: string): void;
}>();

const groupStyle = computed(() => ({
  left: `${props.group.x ?? 0}px`,
  top: `${props.group.y ?? 0}px`,
  width: `${props.group.width ?? 320}px`,
  height: `${props.group.height ?? 180}px`,
  background:
    props.group.backgroundColor || "linear-gradient(160deg, rgba(9,153,140,.15), rgba(6,87,79,.08))",
}));

const handleMouseDown = (event: MouseEvent) => {
  const startX = event.clientX;
  const startY = event.clientY;

  const onMove = (moveEvent: MouseEvent) => {
    emit("move", {
      groupId: props.group.groupId,
      dx: moveEvent.clientX - startX,
      dy: moveEvent.clientY - startY,
    });
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
};
</script>

<style scoped lang="scss">
.spider-flow-group {
  position: absolute;
  border: 1px solid rgba(15, 118, 110, 0.24);
  border-radius: 16px;
  backdrop-filter: blur(2px);
  cursor: move;
  z-index: 1;
  overflow: hidden;
}

.spider-flow-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  color: #0f766e;
  border-bottom: 1px dashed rgba(15, 118, 110, 0.2);
  background: rgba(255, 255, 255, 0.45);
}

.spider-flow-group__header strong {
  font-size: 12px;
}

.spider-flow-group__header small {
  font-size: 11px;
  opacity: 0.9;
}

.spider-flow-group.is-active {
  border-color: rgba(15, 118, 110, 0.6);
  box-shadow: 0 0 0 2px rgba(15, 118, 110, 0.18);
}
</style>

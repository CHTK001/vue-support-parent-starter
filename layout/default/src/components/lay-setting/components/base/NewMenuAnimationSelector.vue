<template>
  <div class="new-menu-anim-grid">
    <button v-for="item in options" :key="item.value" type="button" class="anim-card" :class="[
      `preview-${item.value}`,
      { 'is-active': currentValue === item.value, 'is-disabled': disabled }
    ]" :disabled="disabled" @click="handleSelect(item.value)">
      <div class="anim-main">
        <span class="anim-label">{{ item.label }}</span>
        <span class="anim-badge">NEW</span>
      </div>
      <p class="anim-desc">{{ item.desc }}</p>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: "bounce" | "pulse" | "shake" | "none";
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: "bounce" | "pulse" | "shake" | "none"): void;
  (e: "change", value: "bounce" | "pulse" | "shake" | "none"): void;
}>();

const options = [
  {
    label: "弹跳",
    value: "bounce" as const,
    desc: "轻微上下弹跳，适合提示新增入口",
  },
  {
    label: "脉冲",
    value: "pulse" as const,
    desc: "节奏式放大缩小，吸引注意但不打扰",
  },
  {
    label: "摇晃",
    value: "shake" as const,
    desc: "轻微左右摇晃，适合短期活动菜单",
  },
];

const currentValue = computed(() => {
  if (!props.modelValue || props.modelValue === "none") {
    return "bounce";
  }
  return props.modelValue;
});

function handleSelect(value: "bounce" | "pulse" | "shake") {
  if (props.disabled) {
    return;
  }
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<style scoped>
.new-menu-anim-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.anim-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-fill-color-lighter);
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
}

.anim-card:hover:not(.is-disabled) {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.12);
  transform: translateY(-1px);
}

.anim-card.is-active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.anim-card.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.anim-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.anim-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.anim-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  height: 18px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.anim-desc {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

/* 悬停预览动画，仅在 hover 时触发 */
.preview-bounce:hover:not(.is-disabled) .anim-badge {
  animation: preview-bounce 1.2s ease-out;
}

.preview-pulse:hover:not(.is-disabled) .anim-badge {
  animation: preview-pulse 1.4s ease-out;
}

.preview-shake:hover:not(.is-disabled) .anim-badge {
  animation: preview-shake 1.2s ease-out;
}

@keyframes preview-pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.08);
    opacity: 0.9;
  }
}

@keyframes preview-bounce {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-4px);
  }

  60% {
    transform: translateY(-2px);
  }
}

@keyframes preview-shake {

  0%,
  100% {
    transform: rotate(0deg);
  }

  15% {
    transform: rotate(-8deg);
  }

  30% {
    transform: rotate(6deg);
  }

  45% {
    transform: rotate(-4deg);
  }

  60% {
    transform: rotate(2deg);
  }

  75% {
    transform: rotate(0deg);
  }
}

@media (max-width: 768px) {
  .new-menu-anim-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div
    class="pill-selector-item"
    :class="{
      active: isSelected,
      disabled: isDisabled
    }"
    @click="handleSelect"
  >
    <div class="pill-icon">
      <IconRenderer :icon="icon || 'ri:settings-3-line'" />
    </div>
    <div class="pill-label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from "vue";
import IconRenderer from "./IconRenderer.vue";

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    default: "ri:settings-3-line"
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  isDisabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["select"]);

const handleSelect = () => {
  if (!props.isDisabled) {
    emit("select", props.value);
  }
};
</script>

<style lang="scss" scoped>
.pill-selector-item {
  display: flex;
  width: 50px;
  flex-direction: column;
  align-items: center;
  background-color: var(--el-bg-color);
  border-radius: 24px;
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-light);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  height: auto;
  min-height: 100px;
  padding: 12px 8px;
  flex-shrink: 0;
  flex-grow: 0;
  box-sizing: border-box;
  justify-content: center;

  &:hover {
    box-shadow: var(--el-box-shadow);
    border-color: var(--el-border-color);
  }

  &.active {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);

    &::after {
      transform: scaleX(1);
    }
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
    background-color: var(--el-disabled-bg-color);
    border-color: var(--el-border-color-lighter);
  }

  .pill-icon {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    padding: 8px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
    font-size: 18px;
    margin-bottom: 10px;
    z-index: 1;

    &:hover {
      transform: scale(1.1) rotate(5deg);
    }
  }

  .pill-label {
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    line-height: 1.4;
    word-break: break-word;
    max-width: 100%;
    color: var(--el-text-color-primary);
    padding: 0 4px;
  }

  &.active .pill-icon {
    color: var(--el-color-white);
    background-color: var(--el-color-primary);
  }
}

// 暗黑模式样式
:deep(.dark) {
  .pill-selector-item {
    background-color: var(--el-bg-color-overlay);

    &:hover {
      background-color: var(--el-bg-color);
    }

    &.active {
      background-color: var(--el-color-primary-dark-2);
      border-color: var(--el-color-primary);

      .pill-label {
        color: var(--el-color-white);
      }
    }

    .pill-icon {
      background-color: var(--el-bg-color-overlay);
      color: var(--el-color-primary);
    }

    &.active .pill-icon {
      background-color: var(--el-color-primary);
      color: var(--el-color-white);
    }
  }
}
</style>

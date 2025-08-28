<template>
  <div
    class="card-selector-item"
    :class="{
      active: isSelected,
      disabled: isDisabled,
      'icon-position-top': iconPosition === 'top'
    }"
    :style="{ width }"
    @click="handleSelect"
  >
    <div class="card-icon">
      <IconRenderer :icon="icon || 'ri:settings-3-line'" />
    </div>
    <div class="card-label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits, defineProps } from "vue";
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
  },
  width: {
    type: String,
    default: "100px"
  },
  iconPosition: {
    type: String,
    default: "center",
    validator: (value: string) => {
      return ["center", "top"].includes(value);
    }
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
.card-selector-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 25px 20px;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid var(--el-border-color-light);
  position: relative;
  overflow: visible;
  cursor: pointer;
  height: auto;
  min-height: 120px;
  flex-shrink: 0;
  flex-grow: 0;
  box-sizing: border-box;
  justify-content: center;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, var(--el-color-primary-light-5), var(--el-color-primary));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--el-box-shadow);
    border-color: var(--el-border-color);

    &::after {
      transform: scaleX(1);
    }
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

  .card-icon {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    padding: 10px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
    font-size: 22px;
    margin-bottom: 5px;
    z-index: 1;

    &:hover {
      transform: rotate(10deg);
    }
  }

  .card-label {
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    line-height: 1.4;
    word-break: break-word;
    max-width: 100%;
    color: var(--el-text-color-primary);
  }

  &.icon-position-top {
    padding-top: 45px;
    margin-top: 25px;

    .card-icon {
      position: absolute;
      top: -25px;
      width: 52px;
      height: 52px;
      padding: 12px;
      box-shadow: var(--el-box-shadow-light);
      transition:
        all 0.3s ease,
        transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);

      &:hover {
        transform: scale(1.5);
      }
    }

    &.active .card-icon {
      transform: scale(1.2);
      box-shadow: 0 6px 12px rgba(var(--el-color-primary-rgb), 0.2);
    }
  }
}

:deep(.dark) {
  .card-selector-item {
    background-color: var(--el-bg-color-overlay);

    &:hover {
      background-color: var(--el-bg-color);
    }

    &.active {
      background-color: var(--el-color-primary-dark-2);
      border-color: var(--el-color-primary);

      .card-label {
        color: var(--el-color-white);
      }
    }

    .card-icon {
      background-color: var(--el-bg-color-overlay);
      color: var(--el-color-primary);
    }

    &.active .card-icon {
      background-color: var(--el-color-primary-light-5);
      color: var(--el-color-white);
    }
  }
}
</style>

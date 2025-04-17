<template>
  <div
    class="card-selector-item"
    :class="{ 
      active: isSelected,
      disabled: isDisabled
    }"
    :style="{ width }"
    @click="handleSelect"
  >
    <div class="card-icon">
      <IconifyIconOnline :icon="icon" />
    </div>
    <div class="card-label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";
import { IconifyIconOnline } from "../../ReIcon";

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
    required: true
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
    default: '100px'
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
  gap: 8px;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.05);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  height: auto;
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
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);

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
  }

  .card-icon {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    padding: 8px;
    border-radius: 50%;
    transition: all 0.3s ease;
    font-size: 20px;
    margin-bottom: 0;

    &:hover {
      transform: rotate(10deg);
    }
  }

  .card-label {
    font-size: 14px;
    font-weight: 500;
    text-align: center;
  }
}
</style> 
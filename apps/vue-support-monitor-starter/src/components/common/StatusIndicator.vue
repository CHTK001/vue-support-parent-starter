<template>
  <div class="status-indicator" :class="[`status-${type}`, { 'with-pulse': pulse }]">
    <div class="status-dot" :class="{ 'pulse-animation': pulse }"></div>
    <span v-if="showText" class="status-text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
// 定义属性
interface Props {
  type: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  text?: string;
  showText?: boolean;
  pulse?: boolean;
  size?: 'small' | 'medium' | 'large';
}

withDefaults(defineProps<Props>(), {
  showText: true,
  pulse: false,
  size: 'medium',
});
</script>

<style scoped lang="scss">
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .status-dot {
    border-radius: 50%;
    position: relative;

    &.pulse-animation {
      &::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
    }
  }

  .status-text {
    font-size: 12px;
    font-weight: 500;
  }

  // 尺寸变体
  &.size-small {
    .status-dot {
      width: 6px;
      height: 6px;
    }
    .status-text {
      font-size: 11px;
    }
  }

  &.size-medium {
    .status-dot {
      width: 8px;
      height: 8px;
    }
    .status-text {
      font-size: 12px;
    }
  }

  &.size-large {
    .status-dot {
      width: 10px;
      height: 10px;
    }
    .status-text {
      font-size: 13px;
    }
  }

  // 状态颜色
  &.status-success {
    .status-dot {
      background-color: var(--el-color-success);
      &.pulse-animation::before {
        background-color: var(--el-color-success-light-7);
      }
    }
    .status-text {
      color: var(--el-color-success);
    }
  }

  &.status-warning {
    .status-dot {
      background-color: var(--el-color-warning);
      &.pulse-animation::before {
        background-color: var(--el-color-warning-light-7);
      }
    }
    .status-text {
      color: var(--el-color-warning);
    }
  }

  &.status-danger {
    .status-dot {
      background-color: var(--el-color-danger);
      &.pulse-animation::before {
        background-color: var(--el-color-danger-light-7);
      }
    }
    .status-text {
      color: var(--el-color-danger);
    }
  }

  &.status-info {
    .status-dot {
      background-color: var(--el-color-info);
      &.pulse-animation::before {
        background-color: var(--el-color-info-light-7);
      }
    }
    .status-text {
      color: var(--el-color-info);
    }
  }

  &.status-primary {
    .status-dot {
      background-color: var(--el-color-primary);
      &.pulse-animation::before {
        background-color: var(--el-color-primary-light-7);
      }
    }
    .status-text {
      color: var(--el-color-primary);
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
</style>

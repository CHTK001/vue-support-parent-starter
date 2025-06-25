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
      background-color: #67c23a;
      &.pulse-animation::before {
        background-color: rgba(103, 194, 58, 0.3);
      }
    }
    .status-text {
      color: #67c23a;
    }
  }

  &.status-warning {
    .status-dot {
      background-color: #e6a23c;
      &.pulse-animation::before {
        background-color: rgba(230, 162, 60, 0.3);
      }
    }
    .status-text {
      color: #e6a23c;
    }
  }

  &.status-danger {
    .status-dot {
      background-color: #f56c6c;
      &.pulse-animation::before {
        background-color: rgba(245, 108, 108, 0.3);
      }
    }
    .status-text {
      color: #f56c6c;
    }
  }

  &.status-info {
    .status-dot {
      background-color: #909399;
      &.pulse-animation::before {
        background-color: rgba(144, 147, 153, 0.3);
      }
    }
    .status-text {
      color: #909399;
    }
  }

  &.status-primary {
    .status-dot {
      background-color: #409eff;
      &.pulse-animation::before {
        background-color: rgba(64, 158, 255, 0.3);
      }
    }
    .status-text {
      color: #409eff;
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

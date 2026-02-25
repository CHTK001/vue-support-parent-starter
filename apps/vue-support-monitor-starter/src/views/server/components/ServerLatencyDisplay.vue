<template>
  <div class="server-latency-display system-container modern-bg">
    <!-- 延迟指示器 -->
    <div class="latency-indicator" :class="latencyClass">
      <el-tooltip :content="latencyTooltip" placement="top" :show-after="300">
        <div class="latency-content">
          <div class="latency-dot" :class="latencyClass"></div>
          <span class="latency-text">{{ latencyText }}</span>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatLatencyText, getLatencyStatus, type LatencyStatus } from "@/api/server";
import { computed } from "vue";

interface Props {
  /** 延迟时间(毫秒) */
  latency?: number | null;
  /** 显示模式 */
  mode?: "dot" | "text" | "full";
  /** 尺寸 */
  size?: "small" | "medium" | "large";
  /** 是否显示详细信息 */
  showDetail?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  latency: null,
  mode: "full",
  size: "medium",
  showDetail: true,
});

// 计算延迟状态
const latencyStatus = computed((): LatencyStatus | null => {
  if (props.latency === null || props.latency === undefined) {
    return null;
  }
  return getLatencyStatus(props.latency);
});

// 计算延迟文本
const latencyText = computed(() => {
  if (props.mode === "dot") {
    return "";
  }
  return formatLatencyText(props.latency);
});

// 计算延迟样式类
const latencyClass = computed(() => {
  const status = latencyStatus.value;
  if (!status) {
    return "unknown";
  }

  const classes = [status.status];

  if (props.size) {
    classes.push(`size-${props.size}`);
  }

  return classes.join(" ");
});

// 计算提示文本
const latencyTooltip = computed(() => {
  if (props.latency === null || props.latency === undefined) {
    return "延迟未检测";
  }

  if (props.latency < 0) {
    return "延迟检测失败";
  }

  const status = latencyStatus.value;
  const statusText = status ? status.text : "未知";

  let tooltip = `延迟: ${props.latency}ms (${statusText})`;

  if (props.showDetail) {
    if (props.latency < 100) {
      tooltip += "\n网络状况良好";
    } else if (props.latency < 500) {
      tooltip += "\n网络延迟较高，可能影响使用体验";
    } else {
      tooltip += "\n网络延迟异常，建议检查网络连接";
    }
  }

  return tooltip;
});
</script>

<style lang="scss" scoped>
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: $gradient-bg-1, $gradient-bg-2;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.server-latency-display {
  display: inline-flex;
  align-items: center;
}

.latency-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &.size-small {
    font-size: 12px;

    .latency-dot {
      width: 6px;
      height: 6px;
    }
  }

  &.size-medium {
    font-size: 13px;

    .latency-dot {
      width: 8px;
      height: 8px;
    }
  }

  &.size-large {
    font-size: 14px;

    .latency-dot {
      width: 10px;
      height: 10px;
    }
  }
}

.latency-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.latency-dot {
  border-radius: 50%;
  flex-shrink: 0;
  transition: all $duration-normal $ease-standard;

  &.normal {
    background-color: var(--el-color-success);
    box-shadow: 0 0 4px rgba(103, 194, 58, 0.3);
  }

  &.high {
    background-color: var(--el-color-warning);
    box-shadow: 0 0 4px rgba(230, 162, 60, 0.3);
  }

  &.abnormal {
    background-color: var(--el-color-danger);
    box-shadow: 0 0 4px rgba(245, 108, 108, 0.3);
    animation: pulse 2s infinite;
  }

  &.unknown {
    background-color: var(--el-color-info);
    opacity: 0.6;
  }
}

.latency-text {
  font-weight: 500;
  font-size: 12px;
  transition: color $duration-normal $ease-standard;

  .normal & {
    color: var(--el-color-success);
  }

  .high & {
    color: var(--el-color-warning);
  }

  .abnormal & {
    color: var(--el-color-danger);
  }

  .unknown & {
    color: var(--el-color-info);
    opacity: 0.7;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 4px rgba(245, 108, 108, 0.3);
  }
  50% {
    box-shadow: 0 0 8px rgba(245, 108, 108, 0.6);
  }
  100% {
    box-shadow: 0 0 4px rgba(245, 108, 108, 0.3);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .latency-indicator {
    &.size-medium {
      font-size: 12px;

      .latency-dot {
        width: 6px;
        height: 6px;
      }
    }

    &.size-large {
      font-size: 13px;

      .latency-dot {
        width: 8px;
        height: 8px;
      }
    }
  }
}
</style>

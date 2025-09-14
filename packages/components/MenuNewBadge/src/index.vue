<template>
  <span v-if="showBadge" class="menu-new-badge" :class="badgeClass">
    {{ badgeText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getConfig } from "@repo/config";

/**
 * 菜单新增标识组件
 * @author CH
 * @version 1.0.0
 * @created 2025-01-14
 */

interface Props {
  /** 菜单创建时间 */
  createTime?: string | Date;
  /** 强制显示标识 */
  forceShow?: boolean;
  /** 自定义标识文本 */
  customText?: string;
  /** 标识样式类型 */
  type?: "default" | "primary" | "success" | "warning" | "danger";
}

const props = withDefaults(defineProps<Props>(), {
  createTime: undefined,
  forceShow: false,
  customText: "",
  type: "primary"
});

// 获取配置
const config = getConfig();

/**
 * 计算是否显示新增标识
 */
const showBadge = computed(() => {
  // 如果强制显示，直接返回true
  if (props.forceShow) {
    return true;
  }

  // 检查全局配置是否启用新菜单显示
  if (!config.ShowNewMenu) {
    return false;
  }

  // 如果没有创建时间，不显示
  if (!props.createTime) {
    return false;
  }

  // 计算时间差
  const createTime = new Date(props.createTime);
  const now = new Date();
  const diffHours = (now.getTime() - createTime.getTime()) / (1000 * 60 * 60);

  // 获取时间限制配置（默认168小时，即7天）
  const timeLimit = config.NewMenuTimeLimit || 168;

  // 如果在时间限制内，显示标识
  return diffHours <= timeLimit;
});

/**
 * 标识文本
 */
const badgeText = computed(() => {
  if (props.customText) {
    return props.customText;
  }
  return config.NewMenuText || "new";
});

/**
 * 标识样式类
 */
const badgeClass = computed(() => {
  return `menu-new-badge--${props.type}`;
});
</script>

<style lang="scss" scoped>
.menu-new-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: 6px;
  vertical-align: middle;
  animation: pulse 2s infinite;
  position: relative;
  overflow: hidden;

  // 添加光泽效果
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.6s ease;
  }

  &:hover::before {
    left: 100%;
  }

  // 默认样式
  &--default {
    background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
    color: #606266;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  // 主要样式
  &--primary {
    background: linear-gradient(135deg, #409eff, #66b1ff);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
  }

  // 成功样式
  &--success {
    background: linear-gradient(135deg, #67c23a, #85ce61);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3);
  }

  // 警告样式
  &--warning {
    background: linear-gradient(135deg, #e6a23c, #ebb563);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(230, 162, 60, 0.3);
  }

  // 危险样式
  &--danger {
    background: linear-gradient(135deg, #f56c6c, #f78989);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3);
  }

  // 暗色主题适配
  .dark & {
    &--default {
      background: linear-gradient(135deg, #4c4d4f, #696969);
      color: #e5eaf3;
    }

    &--primary {
      background: linear-gradient(135deg, #337ecc, #529de6);
    }

    &--success {
      background: linear-gradient(135deg, #529b2e, #6cb52d);
    }

    &--warning {
      background: linear-gradient(135deg, #b88230, #d4a574);
    }

    &--danger {
      background: linear-gradient(135deg, #c45656, #e67e7e);
    }
  }
}

// 脉冲动画
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}
</style>

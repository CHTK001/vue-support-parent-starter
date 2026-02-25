<template>
  <span v-if="showBadge" class="menu-new-badge" :class="[badgeClass, animationClass]">
    {{ badgeText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGlobal } from "@pureadmin/utils";
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
  /** 动画类型 */
  animation?: "none" | "bounce" | "pulse" | "shake";
}

const props = withDefaults(defineProps<Props>(), {
  createTime: undefined,
  forceShow: false,
  customText: "",
  type: "primary",
  animation: "bounce"
});

// 获取静态平台配置
const config = getConfig();

// 获取本地响应式存储（用于覆盖平台默认配置）
const { $storage } = useGlobal();

/**
 * 计算是否显示新增标识
 */
const showBadge = computed(() => {
  // 强制显示时直接返回
  if (props.forceShow) {
    return true;
  }

  // 读取本地覆盖配置（优先级高于平台配置）
  const localShow = $storage?.configure?.showNewMenu as boolean | undefined;
  const enabled =
    typeof localShow === "boolean"
      ? localShow
      : (config.ShowNewMenu ?? true);

  if (!enabled) {
    return false;
  }

  // 没有创建时间则不显示
  if (!props.createTime) {
    return false;
  }

  // 计算时间差
  const createTime = new Date(props.createTime);
  const now = new Date();
  const diffHours = (now.getTime() - createTime.getTime()) / (1000 * 60 * 60);

  // 从本地配置读取时间限制，未配置时回退到平台默认
  const localLimit = $storage?.configure?.newMenuTimeLimit as number | undefined;
  const timeLimit =
    typeof localLimit === "number" && localLimit > 0
      ? localLimit
      : (config.NewMenuTimeLimit || 168);

  // 在时间限制内才显示标识
  return diffHours <= timeLimit;
});

/**
 * 标识文本
 */
const badgeText = computed(() => {
  // 单个菜单自定义文本优先
  if (props.customText) {
    return props.customText;
  }

  // 本地设置面板中的文本优先于平台默认配置
  const localText = $storage?.configure?.newMenuText as string | undefined;
  if (localText && localText.trim().length > 0) {
    return localText.trim();
  }

  // 平台配置或默认值
  return config.NewMenuText || "new";
});

/**
 * 标识样式类
 */
const badgeClass = computed(() => {
  return `menu-new-badge--${props.type}`;
});

/**
 * 动画样式类
 */
const animationClass = computed(() => {
  if (props.animation === 'none') return '';
  return `animate-${props.animation}`;
});
</script>

<style lang="scss" scoped>
.menu-new-badge {
  display: inline-block;
  padding: 1px 4px;
  font-size: 9px !important;
  height: 20px !important;
  line-height: 20px !important;
  transform: scale(0.83);
  transform-origin: left center;
  font-weight: 600;
  color: #fff !important;
  line-height: 1;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: 4px;
  vertical-align: middle;
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

// 动画类
.animate-pulse {
  animation: pulse 2s infinite;
}

.animate-bounce {
  animation: bounce 2s infinite;
}

.animate-shake {
  animation: shake 3s infinite;
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

// 弹跳动画
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-4px);
  }
  60% {
    transform: translateY(-2px);
  }
}

// 摇晃动画
@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(-10deg); }
  20% { transform: rotate(8deg); }
  30% { transform: rotate(-8deg); }
  40% { transform: rotate(6deg); }
  50% { transform: rotate(-4deg); }
  60% { transform: rotate(2deg); }
  70% { transform: rotate(0deg); }
}
</style>
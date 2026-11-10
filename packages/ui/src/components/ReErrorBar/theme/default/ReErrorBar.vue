<!--
  ReErrorBar —— 统一错误提示条（default 主题）
  Props:
    - message: 错误文案
    - retryText: 重试按钮文案
    - retryLoading: 重载中
  Slots:
    - message: 覆盖文案
    - action: 覆盖重试按钮右侧区域
-->
<template>
  <!--
    空文案不渲染：错误条没有错误文案时只是一条空的红色色块。
    调用方即使漏写 v-if，也不会在页面上常驻一条假错误（2026-11-09 实测：
    AssetsView / WorkbenchView 替换时丢了 v-if，网络正常也一直显示）。
    用 #message 插槽覆盖文案时，message 可以为空，此时仍按插槽渲染。
  -->
  <div
    v-if="message || $slots.message"
    class="re-error-bar"
    role="alert"
    :aria-live="retryLoading ? 'polite' : 'off'"
  >
    <div class="re-error-bar__icon">
      <ReIcon name="CircleCloseFilled" :size="18" />
    </div>

    <div class="re-error-bar__body">
      <slot name="message">
        {{ message }}
      </slot>
    </div>

    <div class="re-error-bar__footer">
      <div class="re-error-bar__actions">
        <button
          v-if="retryText"
          class="re-error-bar__action"
          type="button"
          :disabled="retryLoading"
          @click="$emit('retry')"
        >
          <ReIcon v-if="retryLoading" name="Loading" :size="16" class="re-error-bar__spin" />
          <span>{{ retryText }}</span>
        </button>
        <slot name="action" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReErrorBar 默认主题实现。
 * 错误色源见 packages/theme/src/styles/tokens.css（--status-error-*，亮/暗党均定义）。
 */
defineOptions({ name: "ReErrorBar", inheritAttrs: true });

defineProps<{
  /** 错误文案（必传） */
  message: string;
  /** 重试按钮文案，传空串时不显示 */
  retryText?: string;
  /** 重载中 */
  retryLoading?: boolean;
}>();

defineEmits<{
  /** 单击重试按钮 */
  retry: [];
}>();
</script>

<style scoped>
.re-error-bar {
  display: flex;
  /* 单行：图标 | 文案 | 按钮（支持 XL 屏折行，不换列） */
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin: 0 0 5px 0;
  padding: 8px 14px;
  height: 36px;
  font-size: 14px;
  line-height: 1.4;
  color: var(--status-error-text);
  background: var(--status-error-bg);
  border: 1px solid var(--status-error-border);
  border-radius: var(--radius-lg, 8px);
  min-width: 0;
  box-sizing: border-box;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 18, 33, 0.04));
}

/* 中高度容器，所有子元素垂直居中 */
.re-error-bar__icon,
.re-error-bar__body,
.re-error-bar__footer {
  display: flex;
  align-items: center;
}

.re-error-bar__body {
  flex: 1;
  min-width: 0;
}

.re-error-bar__footer {
  flex-shrink: 0;
}

.re-error-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.re-error-bar__action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px solid var(--status-error-border);
  border-radius: var(--radius-md, 6px);
  background: rgba(255, 255, 255, 0.7);
  color: var(--status-error-text);
  font-size: 14px;
  line-height: 1.4;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

html.dark .re-error-bar__action {
  background: rgba(255, 255, 255, 0.08);
}

.re-error-bar__action:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
  border-color: var(--status-error);
  color: var(--status-error);
}

.re-error-bar__action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.re-error-bar__action span {
  font-family: inherit;
}

/* 操作区补充插槽 */
.re-error-bar__actions :deep(*) {
  color: inherit;
  font-size: inherit;
}

/* 图标 */
.re-error-bar__icon :deep(.re-icon) {
  color: var(--status-error);
  flex-shrink: 0;
}

/* 旋转动画 */
@keyframes re-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.re-error-bar__spin {
  animation: re-spin 1s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .re-error-bar__spin {
    animation: none;
  }
}

/* 窄屏必须压缩，不允许内容撑满整列 */
@media (max-width: 480px) {
  .re-error-bar {
    height: 34px;
    padding: 8px 14px;
    gap: 8px;
    font-size: 13px;
  }
  .re-error-bar__action {
    padding: 6px 10px;
    font-size: 13px;
  }
}
</style>

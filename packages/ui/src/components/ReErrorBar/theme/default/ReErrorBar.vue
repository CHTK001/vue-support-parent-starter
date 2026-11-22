<!--
  ReErrorBar —— 统一错误提示条（default 主题 · Signal 信号条形态）
  视觉：白/暗色卡片底 + 3px 红色左缘线 + 淡红圆形图标底，重试为实心红图标按钮。
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
      <ReIcon name="CircleCloseFilled" :size="15" />
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
          :aria-label="retryText"
          :title="retryText"
          @click="$emit('retry')"
        >
          <ReIcon v-if="retryLoading" name="Loading" :size="14" class="re-error-bar__spin" />
          <ReIcon v-else name="RefreshRight" :size="14" />
        </button>
        <slot name="action" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReErrorBar 默认主题实现（Signal 信号条）。
 * 错误色源见 packages/theme/src/styles/tokens.css（--status-error-*，亮/暗均定义），
 * 卡片底色用 --bg-container（亮 #ffffff / 暗 #1a1d27）。
 */
defineOptions({ name: "ReErrorBar", inheritAttrs: true });

defineProps<{
  /** 错误文案（必传） */
  message: string;
  /** 重试按钮的无障碍标签与悬浮提示（不显示为可见文字）；传空串时不显示按钮 */
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
  /* 单行：图标 | 文案 | 按钮（不换列） */
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin: 0 0 5px 0;
  padding: 8px 12px 8px 10px;
  height: 36px;
  font-size: 13.5px;
  line-height: 1.4;
  color: var(--status-error-text);
  /* Signal 形态：卡片底 + 红色左缘线，替代整条粉色底 */
  background: var(--bg-container, #ffffff);
  border: 1px solid var(--status-error-border);
  border-left: 3px solid var(--status-error);
  border-radius: var(--radius-md, 8px);
  min-width: 0;
  box-sizing: border-box;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 18, 33, 0.04));
  /* 入场：左侧轻滑入（只用 transform/opacity，不走布局属性） */
  animation: re-error-bar-in 0.28s ease-out both;
}

@keyframes re-error-bar-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 图标：淡红圆形底（koi 令牌 --status-error-bg，亮/暗主题自动切换） */
.re-error-bar__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--status-error-bg);
  color: var(--status-error);
  flex-shrink: 0;
}

.re-error-bar__icon :deep(.re-icon) {
  color: var(--status-error);
  flex-shrink: 0;
}

/* 中高度容器，所有子元素垂直居中 */
.re-error-bar__body,
.re-error-bar__footer {
  display: flex;
  align-items: center;
}

.re-error-bar__body {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  /* 单行省略：错误条固定 36px 高，长文案不允许撑破 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.re-error-bar__footer {
  flex-shrink: 0;
}

.re-error-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 重试按钮：实心红图标按钮（尺寸与左侧图标圆底一致；文字语义走 aria-label/title） */
.re-error-bar__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm, 6px);
  background: var(--status-error);
  color: var(--text-inverse, #ffffff);
  cursor: pointer;
  transition: filter 0.15s ease, opacity 0.15s ease;
}

.re-error-bar__action:hover:not(:disabled) {
  filter: brightness(0.94);
}

.re-error-bar__action:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.re-error-bar__action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* 操作区补充插槽（排除内置重试按钮：按钮固定红底白图标，不随文案色继承） */
.re-error-bar__actions :deep(*:not(.re-error-bar__action)) {
  color: inherit;
  font-size: inherit;
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
  .re-error-bar {
    animation: none;
  }
  .re-error-bar__spin {
    animation: none;
  }
}

/* 窄屏必须压缩，不允许内容撑满整列 */
@media (max-width: 480px) {
  .re-error-bar {
    height: 34px;
    padding: 6px 10px 6px 8px;
    gap: 8px;
    font-size: 13px;
  }
  .re-error-bar__icon {
    width: 22px;
    height: 22px;
  }
  .re-error-bar__action {
    width: 22px;
    height: 22px;
  }
}
</style>

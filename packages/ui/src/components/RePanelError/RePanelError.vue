<template>
  <!-- loading：骨架屏占位 -->
  <ReSkeleton v-if="state === 'loading'" :rows="rows" :count="1" :animated="animated" loading />

  <!--
    unavailable：功能未开启。
    这是正常部署形态（端点没暴露 / 没配数据源），重试永远不会成功，
    所以给「怎么开启」的接入指引，不给骗人的重试按钮。
  -->
  <div
    v-else-if="state === 'unavailable'"
    class="re-panel-state re-panel-state--unavailable"
    :class="{ 'is-compact': compact }"
    role="status"
  >
    <div class="re-panel-state__icon"><ReIcon name="InfoFilled" :size="18" /></div>
    <div class="re-panel-state__body">
      <div class="re-panel-state__title">{{ title || "功能未开启" }}</div>
      <div class="re-panel-state__text">
        <slot name="hint">{{ hint || message || "后端未部署或未暴露该能力，请先在后端开启。" }}</slot>
      </div>
    </div>
    <div v-if="$slots.action" class="re-panel-state__footer"><slot name="action" /></div>
  </div>

  <!-- error：真故障（网络 / 500 / 解析失败 / 鉴权失败）—— 给重试 -->
  <div
    v-else-if="state === 'error'"
    class="re-panel-state re-panel-state--error"
    :class="{ 'is-compact': compact }"
    role="alert"
  >
    <div class="re-panel-state__icon"><ReIcon name="CircleCloseFilled" :size="18" /></div>
    <div class="re-panel-state__body">
      <div v-if="title" class="re-panel-state__title">{{ title }}</div>
      <div class="re-panel-state__text"><slot name="message">{{ message || "加载失败，请稍后重试。" }}</slot></div>
    </div>
    <div class="re-panel-state__footer">
      <slot name="action">
        <button
          v-if="retryText"
          class="re-panel-state__retry"
          type="button"
          :disabled="retryLoading"
          @click="emit('retry')"
        >
          <ReIcon :name="retryLoading ? 'Loading' : 'RefreshRight'" :size="13" :class="{ 'is-spin': retryLoading }" />
          <span>{{ retryLoading ? "重试中…" : retryText }}</span>
        </button>
      </slot>
    </div>
  </div>

  <!-- ready：正常内容 -->
  <template v-else>
    <slot />
  </template>
</template>

<script setup lang="ts">
/**
 * RePanelError —— 面板级三态（加载 / 未开启 / 故障）组件
 *
 * <p>把「一块面板」的首屏状态收敛成统一表面：</p>
 * <ul>
 *   <li><b>loading</b> —— 骨架屏（ReSkeleton）；</li>
 *   <li><b>unavailable</b> —— 功能未开启（404 / 405 / 501 / 未配数据源），
 *       给接入指引，不给重试；</li>
 *   <li><b>error</b> —— 真故障，给重试按钮；鉴权失败文案加「鉴权失败：」前缀；</li>
 *   <li><b>ready</b> —— 渲染默认插槽内容。</li>
 * </ul>
 *
 * <p>状态语义照抄 pages/actuator 的黄金范式 {@code useCardResource.ts}；
 * 错误分类辅助函数（{@code isUnavailableError / isAuthError / toErrorMessage /
 * panelStateFromError}）从本组件子路径一并导出。</p>
 *
 * <p>用法：直接包住面板内容即可，组件会在非 ready 态替换内容：</p>
 * <pre>&lt;RePanelError :state="state" :message="error" @retry="load"&gt;
 *   &lt;MyPanel /&gt;
 * &lt;/RePanelError&gt;</pre>
 */
import ReIcon from "../ReIcon";
import ReSkeleton from "../ReSkeleton/ReSkeleton.vue";
import type { PanelState } from "./state";

defineOptions({ name: "RePanelError" });

withDefaults(
  defineProps<{
    /** 面板状态 */
    state: PanelState;
    /** error 文案 / unavailable 的说明 */
    message?: string;
    /** unavailable 的接入指引（覆盖默认指引） */
    hint?: string;
    /** 面板标题（unavailable / error 态显示） */
    title?: string;
    /** 重试按钮文案；传空串不渲染重试按钮 */
    retryText?: string;
    /** 重试中（按钮禁用 + 转圈） */
    retryLoading?: boolean;
    /** loading 态骨架行数 */
    rows?: number;
    /** loading 态骨架是否动画 */
    animated?: boolean;
    /** 紧凑模式（卡片内使用，内边距更小） */
    compact?: boolean;
  }>(),
  {
    message: "",
    hint: "",
    title: "",
    retryText: "重试",
    retryLoading: false,
    rows: 4,
    animated: true,
    compact: false,
  },
);

const emit = defineEmits<{
  /** 单击重试按钮 */
  retry: [];
}>();
</script>

<style scoped>
/* 三态面板：unavailable 用中性信息色，error 用状态错误色（与 ReErrorBar 同一色源） */
.re-panel-state {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  margin: 0 0 5px 0;
  border-radius: var(--radius-lg, 8px);
  font-size: 14px;
  line-height: 1.5;
  min-width: 0;
  box-sizing: border-box;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 18, 33, 0.04));
}

.re-panel-state.is-compact {
  padding: 10px 12px;
}

.re-panel-state__icon,
.re-panel-state__footer {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.re-panel-state__body {
  flex: 1;
  min-width: 0;
}

.re-panel-state__title {
  font-weight: 600;
  margin-bottom: 2px;
}

.re-panel-state__text {
  word-break: break-word;
}

/* unavailable：中性信息色（koi 令牌，亮 / 暗主题均定义） */
.re-panel-state--unavailable {
  color: var(--text-secondary, var(--el-text-color-regular, #606266));
  background: var(--bg-fill, var(--el-fill-color-light, #f5f7fa));
  border: 1px solid var(--border-default, var(--el-border-color-lighter, #ebeef5));
}

.re-panel-state--unavailable .re-panel-state__icon :deep(.re-icon) {
  color: var(--text-secondary, var(--el-color-info, #909399));
}

/* error：错误红（koi 令牌 --status-error-*，亮 / 暗主题均定义） */
.re-panel-state--error {
  color: var(--status-error-text);
  background: var(--status-error-bg);
  border: 1px solid var(--status-error-border);
}

.re-panel-state--error .re-panel-state__icon :deep(.re-icon) {
  color: var(--status-error);
}

.re-panel-state__retry {
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

html.dark .re-panel-state__retry {
  background: rgba(255, 255, 255, 0.08);
}

.re-panel-state__retry:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
  border-color: var(--status-error);
  color: var(--status-error);
}

.re-panel-state__retry:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* 重试中转圈 */
@keyframes re-panel-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.re-panel-state__retry .is-spin {
  animation: re-panel-spin 1s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .re-panel-state__retry .is-spin {
    animation: none;
  }
}
</style>

<template>
  <!-- 变体 Focus：沉浸式最小化 — 阶段内容居中放大 + 品牌光晕 + 角落计时 + 慢呼吸 -->
  <div class="bw-card bw-focus" :class="{ 'is-error': scene.phase === 'error' }">
    <!-- 品牌光晕背景 -->
    <div class="bw-focus__glow" aria-hidden="true" />

    <div class="bw-focus__inner">
      <!-- 极简状态行 -->
      <div class="bw-focus__status" :class="{ 'is-error': scene.phase === 'error' }">
        <span class="bw-focus__dot" :class="scene.phase" />
        <span class="bw-focus__text">{{ statusText }}</span>
      </div>

      <!-- 阶段内容：放大沉浸 -->
      <div class="bw-focus__stage" :class="`is-${scene.stage}`">
        <BindStageContent :scene="scene" />
      </div>

      <!-- 品牌落款 -->
      <div class="bw-focus__foot">
        <span class="bw-focus__brand">{{ scene.displayName }}</span>
        <span class="bw-focus__method">{{ scene.method }}</span>
      </div>

      <!-- 角落计时（等待时） -->
      <div v-if="scene.phase === 'waiting'" class="bw-focus__clock">{{ scene.elapsed }}s</div>
    </div>

    <!-- 底部：纯文本操作 -->
    <div class="bw-focus__actions">
      <button class="bw-focus__link" type="button" :disabled="scene.phase === 'starting'">重新发起</button>
      <span class="bw-focus__sep">·</span>
      <button class="bw-focus__link" type="button">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BindStageContent, { type BindWaitingScene } from './BindStageContent.vue'

const props = defineProps<{ scene: BindWaitingScene }>()

const statusText = computed(() => {
  if (props.scene.phase === 'error') return props.scene.error || '授权失败'
  if (props.scene.phase === 'starting') return '正在创建登录会话'
  if (props.scene.stage === 'qr-code') return '用微信扫一扫，授权后自动绑定'
  if (props.scene.stage === 'device-code') return '在设备中输入下方授权码'
  if (props.scene.stage === 'browser-oauth') return '授权页已打开，请完成登录'
  return '请完成凭据配置'
})
</script>

<style scoped>
.bw-card {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: var(--radius-xl, 16px);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(15, 23, 42, 0.06));
  padding: 30px 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 14px;
}
/* 品牌光晕 */
.bw-focus__glow {
  position: absolute;
  inset: -40% -30% auto;
  height: 68%;
  background: radial-gradient(50% 50% at 50% 0%, var(--brand-50, rgba(37, 99, 235, 0.16)) 0%, transparent 70%);
  pointer-events: none;
}
.bw-focus__inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
/* 状态行 */
.bw-focus__status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary, #475569);
}
.bw-focus__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand-500, #3b82f6);
  animation: bw-focus-breathe 2.2s ease-in-out infinite;
  flex: none;
}
.bw-focus__dot.starting { background: var(--brand-400, #60a5fa); }
.bw-focus__dot.error { background: var(--el-color-danger, #f56c6c); animation: none; }
@keyframes bw-focus-breathe {
  0%, 100% { opacity: 0.55; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.15); }
}
.bw-focus__status.is-error { color: var(--el-color-danger, #f56c6c); }
/* 阶段：放大 */
.bw-focus__stage { width: 100%; display: flex; justify-content: center; }
.bw-focus__stage :deep(.bw-code) { background: transparent; border-color: transparent; padding: 6px 0; }
.bw-focus__stage :deep(.bw-code-value) { font-size: 30px; letter-spacing: 4px; }
.bw-focus__stage :deep(.bw-qr-box) { width: 216px; height: 216px; }
.bw-focus__stage :deep(.bw-qr-box svg) { width: 200px; height: 200px; }
/* 品牌落款 */
.bw-focus__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
}
.bw-focus__brand { font-weight: 650; color: var(--text-secondary, #475569); }
.bw-focus__method {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--bg-fill, #f1f5fb);
}
/* 角落计时 */
.bw-focus__clock {
  position: absolute;
  top: 4px;
  right: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary, #94a3b8);
}
/* 底部纯文本操作 */
.bw-focus__actions {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-top: 1px solid var(--border-subtle, #eef2f8);
  padding-top: 12px;
}
.bw-focus__link {
  border: none;
  background: none;
  padding: 2px 4px;
  font-size: 13px;
  color: var(--text-secondary, #475569);
  cursor: pointer;
}
.bw-focus__link:hover { color: var(--brand-600, #2563eb); }
.bw-focus__link:disabled { opacity: 0.5; cursor: not-allowed; }
.bw-focus__sep { color: var(--border-default, #e2e9f3); }
</style>
<template>
  <!-- 变体 Console：运维仪表风格 — 大号等宽授权码 + 秒表计时 + 状态进度条 -->
  <div class="bw-card bw-console" :class="{ 'is-error': scene.phase === 'error' }">
    <!-- 顶部：品牌 + 秒表 -->
    <div class="bw-console__head">
      <div class="bw-console__brand">
        <span class="bw-console__badge">{{ scene.channel.slice(0, 1).toUpperCase() }}</span>
        <div class="bw-console__brandtext">
          <b>{{ scene.displayName }}</b>
          <span>{{ scene.method }} · 绑定新账号</span>
        </div>
      </div>
      <div class="bw-console__clock">
        <span class="bw-console__clock-label">已等待</span>
        <b class="bw-console__clock-value">{{ pad(scene.elapsed) }}s</b>
      </div>
    </div>

    <!-- 状态行：点 + 文案 + 进度条 -->
    <div class="bw-console__status" :class="{ 'is-error': scene.phase === 'error' }">
      <span class="bw-console__dot" :class="scene.phase" />
      <span class="bw-console__status-text">{{ statusText }}</span>
      <span class="bw-console__meter" :class="{ 'is-error': scene.phase === 'error' }">
        <i :class="{ 'is-error': scene.phase === 'error' }" />
      </span>
    </div>

    <!-- 阶段内容：浅色仪表面板 -->
    <div class="bw-console__stage">
      <BindStageContent :scene="scene" />
    </div>

    <!-- 底部：等宽小字操作 -->
    <div class="bw-console__actions">
      <button class="bw-console__btn" type="button" :disabled="scene.phase === 'starting'">重新发起</button>
      <button class="bw-console__btn bw-console__btn--primary" type="button">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BindStageContent, { type BindWaitingScene } from './BindStageContent.vue'

const props = defineProps<{ scene: BindWaitingScene }>()

const pad = (n: number) => String(n).padStart(2, '0')

const statusText = computed(() => {
  if (props.scene.phase === 'error') return props.scene.error || '失败'
  if (props.scene.phase === 'starting') return '正在创建登录会话'
  if (props.scene.stage === 'qr-code') return '请用微信扫码授权'
  if (props.scene.stage === 'api-key') return '请填写 API key 后提交'
  if (props.scene.callbackAuto) return '已打开授权页，完成后会自动绑定'
  return '已打开授权页，请在那里完成登录'
})
</script>

<style scoped>
.bw-card {
  width: 100%;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-card, 0 1px 2px rgba(15, 23, 42, 0.04));
  padding: 16px 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* 头部：品牌 + 秒表 */
.bw-console__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.bw-console__brand { display: flex; align-items: center; gap: 10px; }
.bw-console__badge {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--brand-600, #2563eb);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}
.bw-console__brandtext { display: flex; flex-direction: column; gap: 1px; }
.bw-console__brandtext b { font-size: 14px; font-weight: 700; color: var(--text-primary, #0f172a); }
.bw-console__brandtext span { font-size: 12px; color: var(--text-secondary, #475569); }
.bw-console__clock {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: var(--radius-sm, 6px);
  background: var(--bg-elevated, #f8fafc);
}
.bw-console__clock-label { font-size: 11px; color: var(--text-tertiary, #94a3b8); }
.bw-console__clock-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 18px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary, #0f172a);
}
/* 状态行 */
.bw-console__status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-regular, #475569);
}
.bw-console__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand-500, #3b82f6);
  animation: bw-console-pulse 1.2s ease-in-out infinite;
  flex: none;
}
.bw-console__dot.starting { background: var(--brand-400, #60a5fa); }
.bw-console__dot.error { background: var(--el-color-danger, #f56c6c); animation: none; }
@keyframes bw-console-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}
.bw-console__status-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bw-console__status.is-error { color: var(--el-color-danger, #f56c6c); }
.bw-console__meter {
  flex: none;
  width: 64px;
  height: 4px;
  border-radius: 999px;
  background: var(--border-subtle, #eef2f8);
  overflow: hidden;
}
.bw-console__meter i {
  display: block;
  height: 100%;
  width: 40%;
  border-radius: 999px;
  background: var(--brand-500, #3b82f6);
  animation: bw-console-meter 1.6s ease-in-out infinite;
}
.bw-console__meter.is-error i { background: var(--el-color-danger, #f56c6c); animation: none; width: 100%; }
@keyframes bw-console-meter {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(260%); }
}
/* 阶段仪表面板 */
.bw-console__stage {
  background: var(--bg-elevated, #f8fafc);
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: var(--radius-md, 8px);
  padding: 14px;
}
/* 底部 */
.bw-console__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.bw-console__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.bw-console__btn:hover { border-color: var(--brand-400, #60a5fa); color: var(--brand-600, #2563eb); }
.bw-console__btn--primary {
  border-color: var(--brand-600, #2563eb);
  background: var(--brand-600, #2563eb);
  color: #fff;
}
.bw-console__btn--primary:hover { background: var(--brand-500, #3b82f6); }
.bw-console__btn:disabled { opacity: 0.55; cursor: not-allowed; }
</style>

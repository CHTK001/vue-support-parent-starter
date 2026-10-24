<template>
  <!-- 变体 Beacon：叙事大标题 + 灯塔光点 + 状态胶囊 + 居中阶段卡 -->
  <div class="bw-card bw-beacon" :class="{ 'is-error': scene.phase === 'error' }">
    <!-- 顶部：叙事标题（唯一的强调处） -->
    <div class="bw-beacon__hero">
      <h2 class="bw-beacon__title">{{ heroTitle }}</h2>
      <p class="bw-beacon__sub">{{ heroSub }}</p>
    </div>

    <!-- 灯塔光点 + 状态胶囊 -->
    <div class="bw-beacon__status">
      <span class="bw-beacon__lamp" :class="scene.phase" />
      <span class="bw-beacon__status-text">{{ statusText }}</span>
      <span v-if="scene.phase === 'waiting'" class="bw-beacon__elapsed">{{ scene.elapsed }}s</span>
    </div>

    <!-- 阶段内容：居中大卡 -->
    <div class="bw-beacon__stage">
      <BindStageContent :scene="scene" />
    </div>

    <!-- 底部操作：弱化到胶囊组 -->
    <div class="bw-beacon__actions">
      <button class="bw-beacon__btn" type="button" :disabled="scene.phase === 'starting'">重新发起</button>
      <button class="bw-beacon__btn bw-beacon__btn--primary" type="button">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BindStageContent, { type BindWaitingScene } from './BindStageContent.vue'

const props = defineProps<{ scene: BindWaitingScene }>()

const heroTitle = computed(() => {
  if (props.scene.phase === 'error') return '授权未能完成'
  if (props.scene.phase === 'starting') return `正在准备 ${props.scene.displayName} 授权…`
  return `等待你在 ${props.scene.displayName} 完成授权`
})
const heroSub = computed(() => {
  if (props.scene.phase === 'error') return props.scene.error || '请重新发起绑定，或检查网络后重试'
  if (props.scene.stage === 'qr-code') return '扫码后无需回到本页，成功将自动绑定'
  if (props.scene.stage === 'browser-oauth') return '授权页已打开，完成登录后会自动绑定'
  if (props.scene.stage === 'device-code') return '把下方的授权码填进设备，即可完成登录'
  return '请输入凭据完成绑定'
})
const statusText = computed(() => {
  if (props.scene.phase === 'error') return '失败'
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
  padding: 22px 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
/* 叙事标题 */
.bw-beacon__hero { text-align: center; }
.bw-beacon__title {
  font-size: 17px;
  font-weight: 650;
  color: var(--text-primary, #0f172a);
  margin: 0 0 4px;
  line-height: 1.35;
}
.bw-beacon__sub {
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
  margin: 0;
}
/* 状态胶囊 */
.bw-beacon__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  align-self: center;
  padding: 5px 12px;
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: 999px;
  background: var(--bg-elevated, #f8fafc);
  font-size: 12px;
  color: var(--text-secondary, #475569);
}
.bw-beacon__lamp {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand-500, #3b82f6);
  animation: bw-pulse 1.4s ease-in-out infinite;
  flex: none;
}
.bw-beacon__lamp.starting { background: var(--brand-400, #60a5fa); }
.bw-beacon__lamp.error { background: var(--el-color-danger, #f56c6c); animation: none; }
@keyframes bw-pulse {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 color-mix(in srgb, var(--brand-500) 40%, transparent); }
  50% { opacity: 0.45; transform: scale(0.82); box-shadow: 0 0 0 6px transparent; }
}
.bw-beacon__status-text { font-weight: 500; }
.bw-beacon__elapsed {
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary, #94a3b8);
  font-size: 11px;
}
/* 阶段大卡 */
.bw-beacon__stage {
  background: var(--bg-elevated, #f8fafc);
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: var(--radius-md, 8px);
  padding: 18px 16px;
}
/* 操作胶囊组 */
.bw-beacon__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.bw-beacon__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.bw-beacon__btn:hover { border-color: var(--brand-400, #60a5fa); color: var(--brand-600, #2563eb); }
.bw-beacon__btn--primary {
  border-color: var(--brand-600, #2563eb);
  background: var(--brand-600, #2563eb);
  color: #fff;
}
.bw-beacon__btn--primary:hover { background: var(--brand-500, #3b82f6); }
.bw-beacon__btn:disabled { opacity: 0.55; cursor: not-allowed; }
</style>

<template>
  <!-- 变体 Steps：显式三步流程线 — 发起→授权→绑定，当前步骤高亮呼吸 -->
  <div class="bw-card bw-steps" :class="{ 'is-error': scene.phase === 'error' }">
    <!-- 步骤线（信息即结构：三态真实对应流程阶段） -->
    <ol class="bw-steps__rail">
      <li v-for="(s, i) in steps" :key="s.key" class="bw-steps__item"
          :class="{ 'is-done': done(i), 'is-active': active(i), 'is-error': scene.phase === 'error' && i === 1 }">
        <span class="bw-steps__index">{{ done(i) ? '✓' : String(i + 1) }}</span>
        <span class="bw-steps__label">{{ s.label }}</span>
      </li>
    </ol>

    <!-- 当前步骤说明 -->
    <div class="bw-steps__now">
      <span class="bw-steps__now-dot" :class="scene.phase" />
      <span class="bw-steps__now-text">{{ nowText }}</span>
      <span v-if="scene.phase === 'waiting'" class="bw-steps__elapsed">{{ scene.elapsed }}s</span>
    </div>

    <!-- 阶段内容 -->
    <div class="bw-steps__stage">
      <BindStageContent :scene="scene" />
    </div>

    <!-- 底部 -->
    <div class="bw-steps__actions">
      <button class="bw-steps__btn" type="button" :disabled="scene.phase === 'starting'">重新发起</button>
      <button class="bw-steps__btn bw-steps__btn--primary" type="button">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BindStageContent, { type BindWaitingScene } from './BindStageContent.vue'

const props = defineProps<{ scene: BindWaitingScene }>()

const steps = [
  { key: 'init', label: '发起授权' },
  { key: 'auth', label: '完成授权' },
  { key: 'bind', label: '自动绑定' },
]

const stepIndex = computed(() => {
  if (props.scene.phase === 'starting') return 0
  if (props.scene.phase === 'error') return 1
  return 1 // waiting 停在「完成授权」
})

const done = (i: number) => i < stepIndex.value
const active = (i: number) => i === stepIndex.value

const nowText = computed(() => {
  if (props.scene.phase === 'error') return props.scene.error || '授权失败'
  if (props.scene.phase === 'starting') return '正在创建登录会话…'
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
  padding: 18px 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
/* 步骤线 */
.bw-steps__rail {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: flex-start;
  gap: 0;
}
.bw-steps__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  color: var(--text-tertiary, #94a3b8);
}
.bw-steps__item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 13px;
  left: 55%;
  width: 90%;
  height: 2px;
  background: var(--border-subtle, #eef2f8);
  border-radius: 999px;
}
.bw-steps__item.is-done:not(:last-child)::after { background: var(--brand-500, #3b82f6); }
.bw-steps__index {
  position: relative;
  z-index: 1;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 650;
  border: 2px solid var(--border-subtle, #eef2f8);
  background: var(--bg-container, #fff);
  color: var(--text-tertiary, #94a3b8);
  transition: all 0.2s ease;
}
.bw-steps__item.is-done .bw-steps__index {
  background: var(--brand-500, #3b82f6);
  border-color: var(--brand-500, #3b82f6);
  color: #fff;
}
.bw-steps__item.is-active .bw-steps__index {
  border-color: var(--brand-500, #3b82f6);
  color: var(--brand-600, #2563eb);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-500) 16%, transparent);
  animation: bw-steps-breathe 1.6s ease-in-out infinite;
}
.bw-steps__item.is-error .bw-steps__index {
  border-color: var(--el-color-danger, #f56c6c);
  color: var(--el-color-danger, #f56c6c);
}
@keyframes bw-steps-breathe {
  0%, 100% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-500) 16%, transparent); }
  50% { box-shadow: 0 0 0 7px transparent; }
}
.bw-steps__label { font-size: 12px; color: currentColor; }
/* 当前步骤说明 */
.bw-steps__now {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-regular, #475569);
}
.bw-steps__now-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand-500, #3b82f6);
  animation: bw-steps-dot 1.2s ease-in-out infinite;
  flex: none;
}
.bw-steps__now-dot.starting { background: var(--brand-400, #60a5fa); }
.bw-steps__now-dot.error { background: var(--el-color-danger, #f56c6c); animation: none; }
@keyframes bw-steps-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
.bw-steps__now-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bw-steps__elapsed { font-variant-numeric: tabular-nums; color: var(--text-tertiary, #94a3b8); font-size: 12px; }
/* 阶段 */
.bw-steps__stage {
  background: var(--bg-elevated, #f8fafc);
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: var(--radius-md, 8px);
  padding: 16px;
}
/* 底部 */
.bw-steps__actions { display: flex; justify-content: flex-end; gap: 8px; }
.bw-steps__btn {
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
.bw-steps__btn:hover { border-color: var(--brand-400, #60a5fa); color: var(--brand-600, #2563eb); }
.bw-steps__btn--primary {
  border-color: var(--brand-600, #2563eb);
  background: var(--brand-600, #2563eb);
  color: #fff;
}
.bw-steps__btn--primary:hover { background: var(--brand-500, #3b82f6); }
.bw-steps__btn:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
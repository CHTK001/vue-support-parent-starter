<template>
  <!-- 变体 Compact：双栏紧凑 — 左品牌叙事 + 右状态/操作，桌面工具感高密度 -->
  <div class="bw-card bw-compact" :class="{ 'is-error': scene.phase === 'error' }">
    <!-- 左栏：品牌 + 叙事 -->
    <aside class="bw-compact__aside">
      <div class="bw-compact__brand">
        <span class="bw-compact__badge" :style="iconStyle">{{ scene.channel.slice(0, 1).toUpperCase() }}</span>
        <div class="bw-compact__brandtext">
          <b>{{ scene.displayName }}</b>
          <span>{{ scene.method }}</span>
        </div>
      </div>
      <p class="bw-compact__line">{{ line }}</p>
    </aside>

    <!-- 右栏：状态 + 阶段 + 操作 -->
    <section class="bw-compact__main">
      <div class="bw-compact__status" :class="{ 'is-error': scene.phase === 'error' }">
        <span class="bw-compact__dot" :class="scene.phase" />
        <span class="bw-compact__status-text">{{ statusText }}</span>
        <span v-if="scene.phase === 'waiting'" class="bw-compact__elapsed">{{ scene.elapsed }}s</span>
      </div>

      <div class="bw-compact__stage">
        <BindStageContent :scene="scene" />
      </div>

      <div class="bw-compact__actions">
        <button class="bw-compact__btn" type="button" :disabled="scene.phase === 'starting'">重新发起</button>
        <button class="bw-compact__btn bw-compact__btn--primary" type="button">取消</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BindStageContent, { type BindWaitingScene } from './BindStageContent.vue'

const props = defineProps<{ scene: BindWaitingScene }>()

const iconStyle = computed(() => ({ backgroundColor: 'var(--brand-600, #2563eb)' }))

const line = computed(() => {
  if (props.scene.phase === 'error') return '授权未能完成，请重试或检查网络'
  if (props.scene.phase === 'starting') return '正在准备授权会话…'
  if (props.scene.stage === 'browser-oauth') return '无需回到本页，登录后自动绑定'
  if (props.scene.stage === 'qr-code') return '右栏二维码，扫码即完成授权'
  if (props.scene.stage === 'device-code') return '授权码已生成，备用请复制'
  return '请在右侧完成凭据配置'
})

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
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 132px 1fr;
  gap: 16px;
}
@media (max-width: 420px) {
  .bw-card { grid-template-columns: 1fr; }
  .bw-compact__aside { border-right: none !important; padding-right: 0 !important; border-bottom: 1px solid var(--border-subtle, #eef2f8); padding-bottom: 10px; }
}
/* 左栏 */
.bw-compact__aside {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 16px;
  border-right: 1px solid var(--border-subtle, #eef2f8);
}
.bw-compact__brand { display: flex; align-items: center; gap: 9px; }
.bw-compact__badge {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}
.bw-compact__brandtext { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.bw-compact__brandtext b { font-size: 13px; font-weight: 700; color: var(--text-primary, #0f172a); line-height: 1.2; }
.bw-compact__brandtext span { font-size: 11px; color: var(--text-tertiary, #94a3b8); }
.bw-compact__line {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary, #475569);
}
/* 右栏 */
.bw-compact__main { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.bw-compact__status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-regular, #475569);
}
.bw-compact__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand-500, #3b82f6);
  animation: bw-compact-dot 1.2s ease-in-out infinite;
  flex: none;
}
.bw-compact__dot.starting { background: var(--brand-400, #60a5fa); }
.bw-compact__dot.error { background: var(--el-color-danger, #f56c6c); animation: none; }
@keyframes bw-compact-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
.bw-compact__status-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bw-compact__status.is-error { color: var(--el-color-danger, #f56c6c); }
.bw-compact__elapsed { font-variant-numeric: tabular-nums; color: var(--text-tertiary, #94a3b8); font-size: 12px; }
.bw-compact__stage { background: var(--bg-elevated, #f8fafc); border: 1px solid var(--border-subtle, #eef2f8); border-radius: var(--radius-md, 8px); padding: 12px; }
.bw-compact__actions { display: flex; justify-content: flex-end; gap: 8px; }
.bw-compact__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.bw-compact__btn:hover { border-color: var(--brand-400, #60a5fa); color: var(--brand-600, #2563eb); }
.bw-compact__btn--primary { border-color: var(--brand-600, #2563eb); background: var(--brand-600, #2563eb); color: #fff; }
.bw-compact__btn--primary:hover { background: var(--brand-500, #3b82f6); }
.bw-compact__btn:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
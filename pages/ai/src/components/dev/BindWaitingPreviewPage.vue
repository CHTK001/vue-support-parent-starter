<template>
  <!-- 渠道绑定等待框 · 设计探索预览页（临时路由 /preview/bind-waiting，验证完即删） -->
  <div class="bw-preview">
    <header class="bw-preview__bar">
      <div class="bw-preview__title">
        <b>绑定等待框 · 设计探索</b>
        <span>5 个变体 · Mode B（保持现有 token 体系）</span>
      </div>
      <div class="bw-preview__controls">
        <div class="bw-preview__group">
          <span class="bw-preview__label">变体</span>
          <button v-for="v in VARIANTS" :key="v.key" class="bw-preview__chip"
                  :class="{ 'is-active': variant === v.key }" type="button" @click="select(v.key)">
            {{ v.name }}
          </button>
        </div>
        <div class="bw-preview__group">
          <span class="bw-preview__label">阶段</span>
          <button v-for="s in SCENES" :key="s" class="bw-preview__chip"
                  :class="{ 'is-active': sceneKey === s }" type="button" @click="setScene(s)">
            {{ s }}
          </button>
        </div>
        <div class="bw-preview__group">
          <span class="bw-preview__label">状态</span>
          <button v-for="p in PHASES" :key="p" class="bw-preview__chip"
                  :class="{ 'is-active': phase === p }" type="button" @click="setPhase(p)">
            {{ p }}
          </button>
        </div>
      </div>
    </header>

    <!-- 变体容器：当前变体卡片 -->
    <main class="bw-preview__stage">
      <div class="bw-preview__frame" :style="frameStyle">
        <component :is="current" :key="variant + sceneKey + phase" :scene="scene" />
      </div>
      <p class="bw-preview__desc">{{ currentDesc }}</p>
    </main>

    <!-- 变体横排对比（一次看全） -->
    <section class="bw-preview__matrix">
      <div v-for="v in VARIANTS" :key="'m-' + v.key" class="bw-preview__cell">
        <b class="bw-preview__cell-name">{{ v.name }}</b>
        <div class="bw-preview__cell-frame">
          <component :is="v.comp" :key="v.key + sceneKey + phase" :scene="scene" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, reactive, ref } from 'vue'
import BindStageContent from './bindwait/BindStageContent.vue'
import type { BindWaitingScene } from './bindwait/BindStageContent.vue'
import VariantBeacon from './bindwait/VariantBeacon.vue'
import VariantConsole from './bindwait/VariantConsole.vue'
import VariantSteps from './bindwait/VariantSteps.vue'
import VariantFocus from './bindwait/VariantFocus.vue'
import VariantCompact from './bindwait/VariantCompact.vue'

type VariantKey = 'beacon' | 'console' | 'steps' | 'focus' | 'compact'

const VARIANTS = [
  { key: 'beacon', name: 'Beacon', comp: markRaw(VariantBeacon), desc: '叙事大标题 + 灯塔光点 + 状态胶囊：把「等待」讲成一句话，其余安静。' },
  { key: 'console', name: 'Console', comp: markRaw(VariantConsole), desc: '运维仪表：秒表式计时 + 状态进度条 + 等宽授权码，信息密度最高。' },
  { key: 'steps', name: 'Steps', comp: markRaw(VariantSteps), desc: '显式三步流程线（发起→授权→绑定），当前步骤高亮呼吸。' },
  { key: 'focus', name: 'Focus', comp: markRaw(VariantFocus), desc: '沉浸最小化：二维码/授权码居中放大 + 品牌光晕 + 慢呼吸 + 角落计时。' },
  { key: 'compact', name: 'Compact', comp: markRaw(VariantCompact), desc: '左品牌叙事右操作的双栏紧凑布局，桌面工具感。' },
] as const

const SCENES = ['device-code', 'qr-code', 'browser-oauth', 'api-key'] as const
const PHASES = ['starting', 'waiting', 'error'] as const

const variant = ref<VariantKey>((new URLSearchParams(window.location.search).get('variant') as VariantKey) || 'beacon')
const sceneKey = ref<(typeof SCENES)[number]>('qr-code')
const phase = ref<(typeof PHASES)[number]>('waiting')

const current = computed(() => VARIANTS.find((v) => v.key === variant.value)?.comp ?? VariantBeacon)
const currentDesc = computed(() => VARIANTS.find((v) => v.key === variant.value)?.desc ?? '')

function select(key: VariantKey) {
  variant.value = key
  const url = new URL(window.location.href)
  url.searchParams.set('variant', key)
  window.history.replaceState(null, '', url.toString())
}

function setScene(s: (typeof SCENES)[number]) { sceneKey.value = s }
function setPhase(p: (typeof PHASES)[number]) { phase.value = p }

// mock 场景数据：device-code（设备码）/ qr-code（微信扫码）/ browser-oauth（授权页）/ api-key
const scenes = reactive<Record<string, BindWaitingScene>>({
  'device-code': {
    channel: 'cline', displayName: 'Cline', method: '设备码',
    phase: 'waiting', elapsed: 42, stage: 'device-code',
    userCode: 'CL-8F2K-9QX', callbackAuto: false,
  },
  'qr-code': {
    channel: 'loomy', displayName: 'Loomy（讯飞）', method: '微信扫码',
    phase: 'waiting', elapsed: 18, stage: 'qr-code', callbackAuto: false,
  },
  'browser-oauth': {
    channel: 'trae', displayName: 'TRAE (字节)', method: '浏览器授权',
    phase: 'waiting', elapsed: 61, stage: 'browser-oauth', callbackAuto: true,
  },
  'api-key': {
    channel: 'opencode', displayName: 'OpenCode', method: 'API Key',
    phase: 'waiting', elapsed: 0, stage: 'api-key', callbackAuto: false,
  },
})

const scene = computed<BindWaitingScene>(() => {
  const base = scenes[sceneKey.value] ?? scenes['qr-code']
  const errorText = phase.value === 'error'
    ? '授权等待超时（180s），请重新发起绑定'
    : undefined
  return {
    ...base,
    phase: phase.value,
    error: errorText,
  }
})

const frameStyle = computed(() => ({ maxWidth: '440px' }))
</script>

<style scoped>
.bw-preview {
  min-height: 100vh;
  padding: 20px 24px 40px;
  background: var(--bg-page, #f8fafc);
  color: var(--text-primary, #0f172a);
  font-family: var(--font-sans, system-ui, sans-serif);
}
.bw-preview__bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-subtle, #eef2f8);
  margin-bottom: 20px;
}
.bw-preview__title { display: flex; flex-direction: column; gap: 2px; }
.bw-preview__title b { font-size: 16px; }
.bw-preview__title span { font-size: 12px; color: var(--text-tertiary, #94a3b8); }
.bw-preview__controls { display: flex; gap: 14px; flex-wrap: wrap; }
.bw-preview__group { display: flex; align-items: center; gap: 6px; }
.bw-preview__label { font-size: 12px; color: var(--text-tertiary, #94a3b8); }
.bw-preview__chip {
  border: 1px solid var(--border-subtle, #eef2f8);
  background: var(--bg-container, #fff);
  color: var(--text-secondary, #475569);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.bw-preview__chip:hover { border-color: var(--brand-400, #60a5fa); }
.bw-preview__chip.is-active {
  border-color: var(--brand-600, #2563eb);
  background: var(--brand-600, #2563eb);
  color: #fff;
}
.bw-preview__stage { display: flex; flex-direction: column; gap: 12px; }
.bw-preview__frame { width: 100%; }
.bw-preview__desc { font-size: 13px; color: var(--text-secondary, #475569); line-height: 1.6; margin: 0; }
.bw-preview__matrix {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.bw-preview__cell { display: flex; flex-direction: column; gap: 8px; }
.bw-preview__cell-name { font-size: 13px; color: var(--text-secondary, #475569); }
.bw-preview__cell-frame {
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, #eef2f8);
  border-radius: var(--radius-lg, 12px);
  padding: 16px;
}
/* 深色兼容 */
@media (prefers-color-scheme: dark) {
  .bw-preview { background: var(--bg-page, #0f172a); }
}
</style>

<!--
  会话详情弹层

  抓包页的主界面只有「新增会话 + 会话表」，报文 / 统计 / 会话流 / 诊断按行打开本弹层，
  并默认停在用户点的那一页。弹层本身只负责外壳与切页，数据与面板仍由父级传入，
  避免在弹层里再建一份 useTshark（会重复建 SSE 连接）。
-->
<template>
  <ReDialog
    :model-value="modelValue"
    :title="title"
    width="92%"
    top="4vh"
    footer-hidden
    @update:model-value="onOpenChange"
  >
    <div class="detail-shell">
      <div class="detail-head">
        <span class="detail-name" :title="session?.sessionName || ''">{{ session?.sessionName || '未命名会话' }}</span>
        <span v-if="session?.captureStatus === 1" class="ts-pill ts-pill--run">
          <span class="ts-pill__dot" />抓包中
        </span>
        <span v-else class="ts-pill ts-pill--stop">
          <span class="ts-pill__dot" />已停止
        </span>
        <span class="detail-meta">{{ ifaceLabel || session?.captureInterface || '—' }}</span>
        <span class="detail-meta ts-num">{{ session?.packetCount ?? 0 }} 包</span>
        <span class="detail-meta ts-num">{{ session?.startTime || '—' }}</span>
        <span class="detail-spacer" />
        <span class="detail-live" :class="{ 'is-on': session?.captureStatus === 1 && liveConnected }">
          <i class="detail-live__dot" />
          {{
            session?.captureStatus === 1
              ? (liveConnected ? `实时推送 +${liveCount}` : '推送连接中…')
              : '历史会话'
          }}
        </span>
      </div>

      <ScTsharkFilterBar
        :model-value="packetFilter || ''"
        :error="filterError"
        @apply="v => emit('apply-filter', v)"
      />

      <ReTab
        class="detail-tabs"
        variant="underline"
        :tabs="tabs"
        :model-value="tab"
        stretch
        @update:model-value="onTabChange"
      >
        <template #packet><slot name="packet" /></template>
        <template #stats><slot name="stats" /></template>
        <template #flow><slot name="flow" /></template>
        <template #insight><slot name="insight" /></template>
      </ReTab>
    </div>
  </ReDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ReDialog from '@repo/ui/re-dialog'
import ReTab from '@repo/ui/re-tab'
import ScTsharkFilterBar from './ScTsharkFilterBar.vue'
import type { TsharkSession, TsharkTabKey } from './types'

const props = defineProps<{
  modelValue: boolean
  session: TsharkSession | null
  /** 网卡的友好显示名（Ethernet / WLAN）；父级已按 tshark -D 映射过 */
  ifaceLabel?: string
  initialTab: TsharkTabKey
  liveConnected: boolean
  liveCount: number
  /** 已生效的显示过滤（报文 / 统计 / 会话流共用） */
  packetFilter?: string
  /** 过滤表达式被后端拒绝时的提示 */
  filterError?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'update:packetFilter', v: string): void
  (e: 'apply-filter', v: string): void
}>()

const tab = ref<TsharkTabKey>('packet')

const tabs = computed(() => [
  { name: 'packet', label: '报文', icon: 'Tickets' },
  { name: 'stats', label: '统计', icon: 'PieChart' },
  { name: 'flow', label: '会话流', icon: 'TrendCharts' },
  { name: 'insight', label: '诊断', icon: 'FirstAidKit' },
])

const title = computed(() => `会话详情 · ${props.session?.sessionName || ''}`)

watch(
  () => [props.modelValue, props.initialTab] as const,
  ([visible, initial]) => {
    if (visible) tab.value = initial || 'packet'
  },
  { immediate: true },
)

function onOpenChange(v: unknown) {
  emit('update:modelValue', !!v)
}

function onTabChange(name: string) {
  tab.value = (name || 'packet') as TsharkTabKey
}
</script>

<style scoped>
.detail-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 76vh;
  min-height: 420px;
}
.detail-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
  padding: 9px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  overflow: hidden;
}
/* 与抓包页遥测条同一张网格底纹，让详情像同一台控制台里的一页 */
.detail-head::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(var(--ts-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--ts-grid) 1px, transparent 1px);
  background-size: 22px 22px;
}
.detail-head > * { position: relative; }
.detail-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  max-width: 46%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.detail-spacer { flex: 1 1 auto; }
.detail-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}
.detail-live__dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.detail-live.is-on { color: var(--ts-run); }
.detail-live.is-on .detail-live__dot {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ts-run) 22%, transparent);
  animation: ts-pulse 1.6s ease-in-out infinite;
}
.detail-tabs {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.detail-tabs :deep(.re-tab-underline__panel) {
  min-height: 0;
  display: flex;
  flex-direction: column;
}
@media (prefers-reduced-motion: reduce) {
  /* 呼吸只是附加动效，颜色本身已经表达「在推」 */
  .detail-live.is-on .detail-live__dot { animation: none; }
}
</style>

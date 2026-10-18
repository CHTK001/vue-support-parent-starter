<!--
  会话详情弹层

  抓包页的主界面只有「新增会话 + 会话表」，报文 / 统计 / 会话流按行打开本弹层，
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
        <ReTag :type="session?.captureStatus === 1 ? 'success' : 'info'" effect="plain">
          {{ session?.captureStatus === 1 ? '抓包中' : '已停止' }}
        </ReTag>
        <span class="detail-meta">{{ session?.captureInterface || '—' }}</span>
        <span class="detail-meta">{{ session?.packetCount ?? 0 }} 包</span>
        <span class="detail-meta">{{ session?.startTime || '—' }}</span>
        <span class="detail-spacer" />
        <span class="detail-live" :class="{ 'is-on': liveConnected }">
          {{ liveConnected ? `实时推送 +${liveCount}` : '推送未连接' }}
        </span>
      </div>

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
      </ReTab>
    </div>
  </ReDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ReDialog from '@repo/ui/re-dialog'
import ReTab from '@repo/ui/re-tab'
import ReTag from '@repo/ui/re-tag'
import type { TsharkSession, TsharkTabKey } from './types'

const props = defineProps<{
  modelValue: boolean
  session: TsharkSession | null
  initialTab: TsharkTabKey
  liveConnected: boolean
  liveCount: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const tab = ref<TsharkTabKey>('packet')

const tabs = computed(() => [
  { name: 'packet', label: '报文', icon: 'Tickets' },
  { name: 'stats', label: '统计', icon: 'PieChart' },
  { name: 'flow', label: '会话流', icon: 'TrendCharts' },
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
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}
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
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
}
.detail-live.is-on { color: var(--el-color-success); }
.detail-tabs {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.detail-tabs :deep(.el-tabs__content) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
</style>

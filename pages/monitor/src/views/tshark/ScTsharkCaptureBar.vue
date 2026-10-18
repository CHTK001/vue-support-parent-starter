<!--
  顶部抓包条

  全宽标签工作台（布局 C）没有左侧会话栏，所以「当前在看哪个会话」必须由这条
  工具条承担：左边是状态 + 会话切换，右边是抓包参数。窄屏自动换行成两行。
-->
<template>
  <div class="tshark-bar">
    <div class="tshark-bar__group">
      <span class="tshark-status" :class="tsharkOk ? 'tshark-status--ok' : 'tshark-status--bad'">
        <span class="tshark-status__dot"></span>
        <span>{{ tsharkOk ? 'TShark 可用' : 'TShark 未就绪' }}</span>
      </span>

      <ReSelect
        class="tshark-bar__session"
        :model-value="activeSessionId"
        :data="sessionOptions"
        placeholder="选择抓包会话"
        filterable
        clearable
        @update:model-value="onSelectSession"
      />

      <ReTag v-if="activeSession" :type="activeSession.captureStatus === 1 ? 'success' : 'info'" effect="light">
        {{ activeSession.captureStatus === 1 ? '抓包中' : '已停止' }}
      </ReTag>
      <ReTag :type="liveConnected ? 'success' : 'info'" effect="light">
        {{ liveConnected ? `实时推送 +${liveCount}` : '推送未连接' }}
      </ReTag>

      <ReButton icon="Refresh" layout="square" tip="刷新会话与报文" @click="emit('refresh')" />
    </div>

    <span class="tshark-bar__spacer"></span>
    <span class="tshark-bar__sep"></span>

    <div class="tshark-bar__group">
      <ReSelect
        class="tshark-bar__iface"
        :model-value="iface"
        :data="ifaceOptions"
        placeholder="选择网卡"
        clearable
        filterable
        @update:model-value="onIface"
      />
      <ReInput
        class="tshark-bar__bpf"
        :model-value="filter"
        placeholder="BPF 过滤，如 tcp port 8080"
        clearable
        @update:model-value="onFilter"
      />
      <ReInputNumber
        class="tshark-bar__num"
        :model-value="count"
        :min="0"
        :max="1000000"
        placeholder="包数(0=不限)"
        title="留空或 0 表示一直抓到手动停止；填正数才在抓到该包数时自动结束"
        @update:model-value="onCount"
      />
      <ReInputNumber
        class="tshark-bar__num"
        :model-value="timeout"
        :min="0"
        :max="86400"
        placeholder="时长/s(0=不限)"
        title="留空或 0 表示不限时长；填秒数到点自动停止"
        @update:model-value="onTimeout"
      />
      <ReButton
        type="primary"
        icon="VideoPlay"
        show-text
        :loading="starting"
        :disabled="!tsharkOk"
        :tip="tsharkOk ? '' : 'tshark 未安装或不在 PATH 中，无法抓包'"
        @click="emit('start')"
      >
        开始抓包
      </ReButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TsharkSession } from './types'

const props = defineProps<{
  tsharkOk: boolean
  /** 会话候选（用于切换器；传全量，不受列表页筛选影响） */
  sessions: TsharkSession[]
  activeSessionId: number | null
  activeSession: TsharkSession | null
  liveConnected: boolean
  liveCount: number
  ifaceOptions: Array<{ label: string; value: string }>
  iface: string
  filter: string
  count: number
  timeout: number
  starting: boolean
}>()

const emit = defineEmits<{
  (e: 'update:iface', v: string): void
  (e: 'update:filter', v: string): void
  (e: 'update:count', v: number | undefined): void
  (e: 'update:timeout', v: number | undefined): void
  (e: 'select-session', id: number | null): void
  (e: 'start'): void
  (e: 'refresh'): void
}>()

/**
 * 会话下拉项。
 *
 * 带上包数与运行状态的文字描述：光靠会话名（默认是「网卡名 + 启动时间」）区分不出
 * 哪个是正在跑的那个，而下拉选中后旁边那个 ReTag 只描述当前项。
 */
const sessionOptions = computed(() => props.sessions.map(s => ({
  label: `${s.sessionName || s.captureInterface || `会话 ${s.id}`} · ${s.packetCount ?? 0} 包`,
  value: s.id,
})))

// 子组件的 v-model 事件都收成闭包再抛出去：直接在模板里写箭头函数，
// 参数类型在 vue-tsc 下推不出来，也看不清每个字段是怎么归一化的。

function onSelectSession(v: unknown) {
  emit('select-session', v === null || v === undefined || v === '' ? null : Number(v))
}
function onIface(v: unknown) {
  emit('update:iface', v === null || v === undefined ? '' : String(v))
}
function onFilter(v: unknown) {
  emit('update:filter', v === null || v === undefined ? '' : String(v))
}
function onCount(v: unknown) {
  emit('update:count', v === null || v === undefined || v === '' ? undefined : Number(v))
}
function onTimeout(v: unknown) {
  emit('update:timeout', v === null || v === undefined || v === '' ? undefined : Number(v))
}
</script>

<style scoped>
/* 网卡下拉去掉 EP 默认的聚焦描边：工具条上连着 5 个控件，每个都带一圈主色描边会很吵，
   保留 hover 底色作为可点反馈即可（与页面原有做法一致）。 */
.tshark-bar__iface :deep(.el-select__wrapper),
.tshark-bar__iface :deep(.el-select__wrapper:hover),
.tshark-bar__iface :deep(.el-select.is-focused .el-select__wrapper),
.tshark-bar__session :deep(.el-select__wrapper),
.tshark-bar__session :deep(.el-select__wrapper:hover),
.tshark-bar__session :deep(.el-select.is-focused .el-select__wrapper) {
  box-shadow: none !important;
  border-color: var(--el-border-color-lighter) !important;
}
.tshark-bar__iface :deep(.el-select__wrapper:hover),
.tshark-bar__session :deep(.el-select__wrapper:hover) {
  background: var(--el-fill-color-light);
}
</style>

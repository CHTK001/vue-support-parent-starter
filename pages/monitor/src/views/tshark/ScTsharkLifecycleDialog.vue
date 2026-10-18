<!--
  报文生命周期（TCP 握手 / 数据 / 挥手）

  入口：报文表右键「查看生命周期」。后端 `/tshark/packets/{id}/handshake` 按四元组
  还原整条流（HTTP / TLS / SSH 等 TCP 上的协议同样支持），返回客户端 / 服务端方向、
  三次或四次握手判定，以及按时间排好的报文序列。

  两段展示：
    ① 时序图：客户端 / 服务端两条泳道，箭头按方向画，点箭头直接打开该报文详情；
    ② 明细表：用 ReTable 列出每一步的时间、方向、TCP 标志、长度与摘要 ——
       时序图给「长什么样」，表给「具体值」，截图与排查都用得上。

  为什么不画成 ECharts：步骤数通常个位数到几十，原生 DOM 已经够用；
  引入图表库只为一条时间线，打包体积与主题适配都不划算。
-->
<template>
  <ReDialog
    :model-value="modelValue"
    :title="title"
    width="1000px"
    top="5vh"
    footer-hidden
    @update:model-value="onOpenChange"
  >
    <div v-if="loading" v-loading="true" class="lc-loading" element-loading-text="正在还原整条 TCP 流…" />

    <div v-else-if="error" class="lc-error">
      <ReEmpty :description="error" layout="modern" />
      <ReButton icon="Refresh" @click="load">重试</ReButton>
    </div>

    <template v-else-if="data">
      <div class="lc-head">
        <ReTag :type="kindType" effect="plain">{{ data.handshake.label }}</ReTag>
        <ReTag :type="data.handshake.closed ? 'success' : 'info'" effect="plain">
          {{ data.handshake.closed ? '已关闭' : '未关闭' }}
        </ReTag>
        <span class="tshark-mono lc-endpoint">{{ endpoint(data.clientIp, data.clientPort) }}</span>
        <ReIcon name="Right" :size="12" />
        <span class="tshark-mono lc-endpoint">{{ endpoint(data.serverIp, data.serverPort) }}</span>
        <span class="spacer" />
        <span class="lc-meta">{{ steps.length }} 个报文 · 跨度 {{ formatMs(durationMs) }}</span>
      </div>

      <p v-if="data.handshake.detail" class="lc-detail">{{ data.handshake.detail }}</p>

      <!-- ==================== 时序图 ==================== -->
      <div class="lc-seq-wrap">
        <div class="lc-lane-head">
          <span class="lc-lane-label is-client">客户端</span>
          <span class="lc-lane-label is-server">服务端</span>
        </div>

        <div class="lc-seq" :style="{ height: seqHeight + 'px' }">
          <span class="lc-lifeline is-client" />
          <span class="lc-lifeline is-server" />

          <button
            v-for="(step, i) in steps"
            :key="step.packetId"
            type="button"
            class="lc-step"
            :class="step.fromClient ? 'is-request' : 'is-response'"
            :style="{ top: 10 + i * STEP_H + 'px' }"
            :title="`${step.info || ''}（点击查看报文详情）`"
            @click="emit('open-detail', step.packetId)"
          >
            <span class="lc-step__line" />
            <span class="lc-step__arrow" />
            <span class="lc-step__label">
              <b>{{ stepLabel(step) }}</b>
              <span v-if="step.info" class="lc-step__info">{{ step.info }}</span>
            </span>
          </button>
        </div>
      </div>

      <!-- ==================== 明细（ReTable） ==================== -->
      <ReTable
        class="lc-table"
        :data="steps as unknown as Record<string, unknown>[]"
        :columns="columns"
        :pagination="false"
        :toolbar="false"
        row-key="packetId"
        :layout-table="{ maxHeight: 280 }"
        stripe
        empty-text="这条流没有可展示的报文"
        @row-click="onRowClick"
      >
        <template #rel="{ row }">
          <span class="tshark-mono">{{ row.relativeMs === 0 ? '0ms' : `+${formatMs(Number(row.relativeMs))}` }}</span>
        </template>
        <template #dir="{ row }">
          <span class="lc-dir" :class="row.fromClient ? 'is-request' : 'is-response'">
            {{ row.fromClient ? '客户端 → 服务端' : '服务端 → 客户端' }}
          </span>
        </template>
        <template #flags="{ row }">
          <ReTag v-if="row.flags" type="info" effect="plain">{{ row.flags }}</ReTag>
          <span v-else class="lc-muted">DATA</span>
        </template>
        <template #action="{ row }">
          <ReButton link type="primary" @click.stop="emit('open-detail', row.packetId)">详情</ReButton>
        </template>
      </ReTable>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReEmpty from '@repo/ui/re-empty'
import ReIcon from '@repo/ui/re-icon'
import ReTable from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'
import { getTsharkHandshake } from '../../api'
import type { ReTableColumn } from '@repo/ui/re-table'
import type { TsharkHandshake, TsharkPacket, TsharkStep } from './types'

/** 时序图每步的行高（px）：箭头 + 标签要放得下，又不能把几十步拉成一条长卷 */
const STEP_H = 42

const props = defineProps<{
  modelValue: boolean
  /** 触发右键的报文；只用到 id（后端按 id 找回整条流） */
  packet: TsharkPacket | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'open-detail', packetId: number): void
}>()

const loading = ref(false)
const error = ref('')
const data = ref<TsharkHandshake | null>(null)

const steps = computed<TsharkStep[]>(() => data.value?.steps ?? [])
const durationMs = computed(() => steps.value.length ? steps.value[steps.value.length - 1].relativeMs : 0)
const seqHeight = computed(() => Math.max(120, 10 + steps.value.length * STEP_H + 12))

const title = computed(() => {
  const p = props.packet
  if (!p) return 'TCP 生命周期'
  return `TCP 生命周期 · ${p.protocol || 'OTHER'} ${p.sourceIp || '?'} → ${p.destIp || '?'}`
})

const kindType = computed(() => {
  const kind = data.value?.handshake.kind
  if (kind === 'THREE_WAY') return 'success'
  if (kind === 'FOUR_WAY') return 'warning'
  return 'info'
})

const columns: ReTableColumn[] = [
  { prop: 'relativeMs', label: '相对时间', width: 112, slot: 'rel', align: 'right' },
  { prop: 'fromClient', label: '方向', width: 150, slot: 'dir' },
  { prop: 'flags', label: '标志', width: 110, slot: 'flags', align: 'center' },
  { prop: 'length', label: '长度', width: 86, align: 'right' },
  { prop: 'info', label: '摘要', minWidth: 240, showOverflowTooltip: true },
  { prop: 'action', label: '操作', width: 72, slot: 'action', align: 'center' },
]

watch(
  () => [props.modelValue, props.packet?.id] as const,
  ([visible]) => {
    if (visible) void load()
  },
  { immediate: true },
)

/**
 * 拉取生命周期。
 *
 * <p>404 不是错误：UDP / ICMP / ARP 本来就没有握手，后端按「没有」返回，
 * 页面要说清楚原因，而不是弹一个「请求失败」让人以为接口坏了。</p>
 */
async function load() {
  const id = props.packet?.id
  if (id == null) return
  loading.value = true
  error.value = ''
  data.value = null
  try {
    data.value = await getTsharkHandshake(id) as TsharkHandshake
    if (!data.value?.steps?.length) {
      error.value = '这条流还没有可展示的报文'
    }
  } catch (e: any) {
    if (e?.status === 404) {
      error.value = '该报文不是 TCP 流（UDP / ICMP / ARP），没有握手与挥手生命周期'
    } else {
      error.value = `加载生命周期失败：${e?.message || e}`
    }
  } finally {
    loading.value = false
  }
}

function onOpenChange(v: unknown) {
  emit('update:modelValue', !!v)
}

function onRowClick(row: Record<string, unknown>) {
  emit('open-detail', Number(row.packetId))
}

/** 箭头上的短标签：标志位优先，没有标志就是数据帧 */
function stepLabel(step: TsharkStep): string {
  return step.flags || 'DATA'
}

function endpoint(ip?: string | null, port?: number | null): string {
  const host = ip || '?'
  return port === null || port === undefined ? host : `${host}:${port}`
}

function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)}s`
}
</script>

<style scoped>
.spacer { flex: 1 1 auto; }

.lc-loading { height: 220px; }
.lc-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 0 8px;
}

.lc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.lc-endpoint {
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.lc-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.lc-detail {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ==================== 时序图 ==================== */
.lc-seq-wrap {
  margin-bottom: 12px;
  padding: 10px 14px 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
  max-height: 400px;
  overflow: auto;
}
.lc-lane-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  padding: 2px 18% 8px;
  background: inherit;
}
.lc-lane-label {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}
.lc-lane-label.is-client { color: var(--el-color-primary); }
.lc-lane-label.is-server { color: var(--el-color-success); }

.lc-seq {
  position: relative;
  margin: 0 6%;
}
.lc-lifeline {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--el-border-color);
}
.lc-lifeline.is-client { left: 18%; }
.lc-lifeline.is-server { right: 18%; }

/* 每一步是一整行按钮：箭头是视觉，命中区是整行，鼠标不用瞄准细线 */
.lc-step {
  position: absolute;
  left: 0;
  right: 0;
  height: 34px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: inherit;
  text-align: center;
}
.lc-step__line {
  position: absolute;
  top: 16px;
  height: 1px;
  background: color-mix(in srgb, var(--el-color-primary) 55%, transparent);
}
.lc-step.is-request .lc-step__line { left: 18%; right: 82%; }
.lc-step.is-response .lc-step__line { left: 82%; right: 18%; }
.lc-step__arrow {
  position: absolute;
  top: 11px;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
}
.lc-step.is-request .lc-step__arrow {
  right: 18%;
  border-left: 7px solid var(--el-color-primary);
}
.lc-step.is-response .lc-step__arrow {
  left: 18%;
  border-right: 7px solid var(--el-color-success);
}
.lc-step.is-response .lc-step__line {
  background: color-mix(in srgb, var(--el-color-success) 55%, transparent);
}
.lc-step__label {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  max-width: 44%;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--el-fill-color-lighter);
  font-size: 11px;
  line-height: 16px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  white-space: nowrap;
}
.lc-step__info {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-mono, monospace);
}
.lc-step:hover .lc-step__label {
  background: color-mix(in srgb, var(--el-color-primary) 12%, var(--el-bg-color));
}
.lc-step:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
  border-radius: 6px;
}

/* ==================== 明细表 ==================== */
.lc-table { box-shadow: none; }
.lc-dir { font-size: 12px; }
.lc-dir.is-request { color: var(--el-color-primary); }
.lc-dir.is-response { color: var(--el-color-success); }
.lc-muted { color: var(--el-text-color-placeholder); font-size: 12px; }
</style>

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
        <span v-if="data.rttMs != null" class="lc-metric" title="TCP 建连 RTT：SYN → SYN-ACK">RTT {{ formatMs(data.rttMs) }}</span>
        <span v-if="data.ttfbMs != null" class="lc-metric" title="首字节时间：首个 HTTP 请求 → 首个 HTTP 响应">TTFB {{ formatMs(data.ttfbMs) }}</span>
        <span class="lc-meta">跨度 {{ formatMs(durationMs) }}</span>
      </div>

      <p v-if="data.handshake.detail" class="lc-detail">{{ data.handshake.detail }}</p>

      <div class="lc-tools">
        <ReButton link type="primary" @click="hideAck = !hideAck">
          {{ hideAck ? '显示全部报文' : '隐藏纯 ACK' }}
        </ReButton>
        <span class="lc-meta">
          {{ visibleSteps.length }} / {{ data.totalSteps ?? steps.length }} 个报文
          <template v-if="data.truncated">（原流报文过多，仅保留首尾与关键帧）</template>
        </span>
        <span class="spacer" />
        <span class="lc-legend">
          <i class="lc-dot phase-tcp"></i>TCP
          <i class="lc-dot phase-tls"></i>TLS
          <i class="lc-dot phase-http"></i>HTTP
          <i class="lc-dot phase-data"></i>DATA
          <i class="lc-dot phase-close"></i>CLOSE
        </span>
      </div>

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
            v-for="(step, i) in visibleSteps"
            :key="step.packetId"
            type="button"
            class="lc-step"
            :class="[
              step.fromClient ? 'is-request' : 'is-response',
              phaseClass(step),
              { 'is-retrans': step.retransmission, 'is-reset': step.reset },
            ]"
            :style="{ top: 10 + i * STEP_H + 'px' }"
            :title="`${step.info || ''}（点击查看报文详情）`"
            @click="emit('open-detail', step.packetId)"
          >
            <span class="lc-step__line" />
            <span class="lc-step__arrow" />
            <span class="lc-step__label">
              <i class="lc-dot" :class="phaseClass(step)"></i>
              <b>{{ stepLabel(step) }}</b>
              <span v-if="step.retransmission" class="lc-badge is-retrans" title="重传 / 乱序 / 重复 ACK">重传</span>
              <span v-if="step.reset" class="lc-badge is-reset" title="连接被重置（RST）">RST</span>
              <span v-if="step.info" class="lc-step__info">{{ step.info }}</span>
            </span>
          </button>
        </div>
      </div>

      <!-- ==================== 明细（ReTable） ==================== -->
      <ReTable
        class="lc-table"
        :data="visibleSteps as unknown as Record<string, unknown>[]"
        row-key="packetId"
        size="small"
        :layout-table="{ maxHeight: 280 }"
        stripe
        empty-text="这条流没有可展示的报文"
        @row-click="onRowClick"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      >
        <ReTableColumn prop="relativeMs" label="相对时间" width="112" align="right">
          <template #default="{ row }">
            <span class="tshark-mono">{{ row.relativeMs === 0 ? '0ms' : `+${formatMs(Number(row.relativeMs))}` }}</span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="阶段" width="82" align="center">
          <template #default="{ row }">
            <span class="lc-phase" :class="phaseClass(row)">
              <i class="lc-dot" :class="phaseClass(row)"></i>{{ row.phase || 'DATA' }}
            </span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="方向" width="140">
          <template #default="{ row }">
            <span class="lc-dir" :class="row.fromClient ? 'is-request' : 'is-response'">
              {{ row.fromClient ? '客户端 → 服务端' : '服务端 → 客户端' }}
            </span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="标志" width="140" align="center">
          <template #default="{ row }">
            <ReTag v-if="row.flags" type="info" effect="plain">{{ row.flags }}</ReTag>
            <span v-else class="lc-muted">DATA</span>
            <ReTag v-if="row.retransmission" type="warning" effect="plain" class="lc-flag-tag">重传</ReTag>
            <ReTag v-if="row.reset" type="danger" effect="plain" class="lc-flag-tag">RST</ReTag>
          </template>
        </ReTableColumn>
        <ReTableColumn prop="length" label="长度" width="80" align="right">
          <template #default="{ row }">{{ row.length }}</template>
        </ReTableColumn>
        <ReTableColumn prop="info" label="摘要" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.info || '—' }}</template>
        </ReTableColumn>
        <ReTableColumn label="操作" width="72" align="center">
          <template #default="{ row }">
            <ReButton link type="primary" @click.stop="emit('open-detail', row.packetId)">详情</ReButton>
          </template>
        </ReTableColumn>
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
/** 是否隐藏纯 ACK：握手/挥手/数据帧都在，被纯 ACK 淹没时打开 */
const hideAck = ref(true)

const steps = computed<TsharkStep[]>(() => data.value?.steps ?? [])
const visibleSteps = computed<TsharkStep[]>(() =>
  hideAck.value ? steps.value.filter(s => !isPureAck(s)) : steps.value)
const durationMs = computed(() => steps.value.length ? steps.value[steps.value.length - 1].relativeMs : 0)
const seqHeight = computed(() => Math.max(120, 10 + visibleSteps.value.length * STEP_H + 12))

/** 纯 ACK：只带 ACK 标志、无载荷、且不是 HTTP/TLS 语义帧 */
function isPureAck(step: TsharkStep): boolean {
  const flags = (step.flags || '').toUpperCase()
  if (!flags.includes('ACK')) return false
  if (flags.includes('SYN') || flags.includes('FIN') || flags.includes('RST')) return false
  if ((step.length ?? 0) > 0) return false
  const phase = (step.phase || 'DATA').toUpperCase()
  return phase === 'DATA' || phase === 'TCP'
}

/** 阶段对应的配色 class；后端给的是 TCP / TLS / HTTP / DATA / CLOSE */
function phaseClass(step: TsharkStep | Record<string, unknown>): string {
  const phase = String((step as TsharkStep).phase || 'DATA').toUpperCase()
  const known = ['TCP', 'TLS', 'HTTP', 'DATA', 'CLOSE']
  return `phase-${(known.includes(phase) ? phase : 'DATA').toLowerCase()}`
}

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

.lc-metric {
  font-family: 'SF Mono', 'Cascadia Code', ui-monospace, monospace;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 999px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  font-variant-numeric: tabular-nums;
}
.lc-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.lc-legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.lc-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  flex: none;
}
.lc-dot.phase-tcp { background: var(--ts-run); }
.lc-dot.phase-tls { background: var(--el-color-primary); }
.lc-dot.phase-http { background: var(--el-color-success); }
.lc-dot.phase-data { background: var(--metric-jvm, #14b8a6); }
.lc-dot.phase-close { background: var(--metric-disk, #f59e0b); }
.lc-phase {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--el-text-color-regular);
}
.lc-badge {
  padding: 0 5px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 15px;
  font-weight: 600;
}
.lc-badge.is-retrans { color: var(--el-color-warning); background: color-mix(in srgb, var(--el-color-warning) 16%, transparent); }
.lc-badge.is-reset { color: var(--el-color-danger); background: color-mix(in srgb, var(--el-color-danger) 16%, transparent); }
.lc-flag-tag { margin-left: 4px; }

/* ==================== 时序图 ==================== */
.lc-seq-wrap {
  margin-bottom: 12px;
  padding: 10px 14px 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
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
  font-family: 'SF Mono', 'Cascadia Code', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}
.lc-lane-label.is-client { color: var(--el-color-primary); }
.lc-lane-label.is-server { color: var(--ts-run); }

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

/* 每一步是一整行按钮：箭头是视觉，命中区是整行，鼠标不用瞄准细线。
   线/箭头颜色跟着「阶段」走（--lc-c），方向交给箭头落在哪一侧表达。 */
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
  --lc-c: var(--el-text-color-secondary);
}
.lc-step.phase-tcp { --lc-c: var(--ts-run); }
.lc-step.phase-tls { --lc-c: var(--el-color-primary); }
.lc-step.phase-http { --lc-c: var(--el-color-success); }
.lc-step.phase-data { --lc-c: var(--metric-jvm, #14b8a6); }
.lc-step.phase-close { --lc-c: var(--metric-disk, #f59e0b); }
.lc-step.is-retrans { --lc-c: var(--metric-disk, #f59e0b); }
.lc-step.is-reset { --lc-c: var(--el-color-danger); }
.lc-step__line {
  position: absolute;
  top: 16px;
  height: 1px;
  background: color-mix(in srgb, var(--lc-c) 62%, transparent);
}
/* 重传 / 乱序：虚线，与「正常一次往返」在视觉上分开 */
.lc-step.is-retrans .lc-step__line {
  background: repeating-linear-gradient(90deg, var(--lc-c) 0 7px, transparent 7px 12px);
}
.lc-step.is-request .lc-step__line { left: 18%; right: 18%; }
.lc-step.is-response .lc-step__line { left: 18%; right: 18%; }
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
  border-left: 7px solid var(--lc-c);
}
.lc-step.is-response .lc-step__arrow {
  left: 18%;
  border-right: 7px solid var(--lc-c);
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
  background: color-mix(in srgb, var(--lc-c) 14%, var(--el-bg-color));
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
.lc-dir.is-response { color: var(--ts-run); }
.lc-muted { color: var(--el-text-color-placeholder); font-size: 12px; }
</style>

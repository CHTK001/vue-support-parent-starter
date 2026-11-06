<!--
  报文生命周期（TCP 握手 / 数据 / 挥手）

  入口：报文表右键「查看生命周期」。后端 `/tshark/packets/{id}/handshake` 按四元组
  还原整条流（HTTP / TLS / SSH 等 TCP 上的协议同样支持），返回客户端 / 服务端方向、
  三次或四次握手判定，以及按时间排好的报文序列。

  形态：80% 宽的抽屉，内部左右分栏 ——
    左：① 头部（握手判定 / RTT / TTFB / 跨度）；② 一次请求的阶段耗时；③ 时序图；
        ④ 明细表（ReTable）。
    右：选中报文的字段详情 + 它所属的 HTTP 事务（请求头 / 请求体 / 响应头 / 响应体，
        由 ScTsharkHttpInfo 渲染，与报文详情抽屉共用一套）。

  交互：点时间线箭头或明细行只切换右侧内容，不再叠第二层抽屉；真要单独看一帧，
  右栏顶部有「单独打开」。HTTP 头与正文来自解析阶段入库的列，不打开时回扫 pcap。

  为什么不画成 ECharts：步骤数通常个位数到几十，原生 DOM 已经够用；
  引入图表库只为一条时间线，打包体积与主题适配都不划算。
-->
<template>
  <ReDrawer
    :model-value="modelValue"
    :title="title"
    size="80%"
    footer-hidden
    @update:model-value="onOpenChange"
  >
    <div v-if="loading" v-loading="true" class="lc-loading" element-loading-text="正在还原整条 TCP 流…" />

    <div v-else-if="error" class="lc-error">
      <ReEmpty :description="error" layout="modern" />
      <ReButton icon="Refresh" @click="load">重试</ReButton>
    </div>

    <div v-else-if="data" class="lc-body">
      <section class="lc-left">
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

      <!-- ==================== 这一次请求的时间花在哪 ==================== -->
      <div v-if="breakdown.phases.length" class="lc-phases">
        <div class="lc-phases__head">
          <span class="lc-phases__title">一次请求的阶段耗时</span>
          <span class="lc-meta">总计 {{ formatMs(breakdown.totalMs) }}</span>
        </div>

        <div class="lc-phases__bar">
          <span
            v-for="phase in breakdown.phases"
            :key="phase.key"
            class="lc-phases__seg"
            :class="`seg-${phase.key}`"
            :style="{ flexGrow: Math.max(phase.share, 0.008) }"
            :title="`${phase.label} ${formatMs(phase.ms)}（${Math.round(phase.share * 100)}%）`"
          />
        </div>

        <div class="lc-phases__legend">
          <span v-for="phase in breakdown.phases" :key="phase.key" class="lc-phases__item">
            <i class="lc-dot" :class="`seg-${phase.key}`" />
            <span class="lc-phases__label">{{ phase.label }}</span>
            <span class="lc-phases__ms tshark-mono">{{ formatMs(phase.ms) }}</span>
            <span class="lc-phases__share">{{ Math.round(phase.share * 100) }}%</span>
          </span>
        </div>

        <p v-if="breakdown.verdict" class="lc-phases__verdict">{{ breakdown.verdict }}</p>
      </div>

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
              { 'is-retrans': step.retransmission, 'is-reset': step.reset, 'is-selected': step.packetId === selectedId },
            ]"
            :style="{ top: 10 + i * STEP_H + 'px' }"
            :title="`${step.info || ''}${step.restored ? ' · ' + step.restored : ''}（点击在右侧查看详情）`"
            @click="selectStep(step.packetId)"
          >
            <span class="lc-step__line" />
            <span class="lc-step__arrow" />
            <span class="lc-step__label">
              <i class="lc-dot" :class="phaseClass(step)"></i>
              <b>{{ stepLabel(step) }}</b>
              <span v-if="step.retransmission" class="lc-badge is-retrans" title="重传 / 乱序 / 重复 ACK">重传</span>
              <span v-if="step.reset" class="lc-badge is-reset" title="连接被重置（RST）">RST</span>
              <span v-if="step.info" class="lc-step__info">{{ step.info }}</span>
              <span v-if="step.restored" class="lc-step__restored" :title="step.restored">{{ step.restored }}</span>
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
        <ReTableColumn label="阶段" width="96" align="center">
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
        <ReTableColumn prop="restored" label="还原" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="tshark-mono" :title="row.restored">{{ row.restored || '—' }}</span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="操作" width="72" align="center">
          <template #default="{ row }">
            <ReButton link type="primary" @click.stop="emit('open-detail', row.packetId)">详情</ReButton>
          </template>
        </ReTableColumn>
      </ReTable>
      </section>

      <aside class="lc-right">
        <header class="lc-right__head">
          <h4>报文详情</h4>
          <span v-if="selectedStep" class="lc-meta">
            {{ selectedStep.relativeMs === 0 ? '0ms' : '+' + formatMs(selectedStep.relativeMs) }}
          </span>
          <span class="spacer"></span>
          <ReButton v-if="selectedId != null" link type="primary" @click="emit('open-detail', selectedId)">
            单独打开
          </ReButton>
        </header>

        <template v-if="selectedStep">
          <ReDescriptions :column="2" border size="small">
            <ReDescriptionsItem label="时间">{{ selectedStep.time || '—' }}</ReDescriptionsItem>
            <ReDescriptionsItem label="方向">
              {{ selectedStep.fromClient ? '客户端 → 服务端' : '服务端 → 客户端' }}
            </ReDescriptionsItem>
            <ReDescriptionsItem label="标志">{{ selectedStep.flags || 'DATA' }}</ReDescriptionsItem>
            <ReDescriptionsItem label="长度">{{ selectedStep.length ?? 0 }} 字节</ReDescriptionsItem>
            <ReDescriptionsItem label="摘要" :span="2">{{ selectedStep.info || '—' }}</ReDescriptionsItem>
          </ReDescriptions>

          <div v-if="transaction.request || transaction.response" class="lc-http">
            <div class="lc-http__head">
              <h4>HTTP 事务</h4>
              <span class="lc-meta">请求头 · 请求体 · 响应头 · 响应体</span>
            </div>
            <template v-if="transaction.request">
              <ScTsharkHttpInfo :packet="transaction.request" />
            </template>
            <template v-if="transaction.response">
              <ScTsharkHttpInfo :packet="transaction.response" />
            </template>
          </div>

          <div v-else-if="selectedDetail?.httpRequestHead || selectedDetail?.httpResponseHead" class="lc-http">
            <ScTsharkHttpInfo :packet="selectedDetail" />
          </div>

          <section v-if="selectedDetail?.restoredText" class="lc-block">
            <h4>协议还原</h4>
            <pre class="lc-pre">{{ selectedDetail.restoredText }}</pre>
          </section>
        </template>

        <ReEmpty v-else description="点左侧时序图或明细行查看该报文" layout="modern" />
      </aside>
    </div>
  </ReDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ReButton from '@repo/ui/re-button'
import ReDrawer from '@repo/ui/re-drawer'
import ReEmpty from '@repo/ui/re-empty'
import ReIcon from '@repo/ui/re-icon'
import ReTable from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'
import { getTsharkHandshake, getTsharkPacketDetail } from '../../api'
import { buildLifecycleBreakdown } from './lifecyclePhases'
import ScTsharkHttpInfo from './ScTsharkHttpInfo.vue'
import type { TsharkHandshake, TsharkPacket, TsharkStep } from './types'

/** 时序图每步的行高（px）：箭头 + 标签要放得下，又不能把几十步拉成一条长卷 */
const STEP_H = 42

const props = defineProps<{
  modelValue: boolean
  /** 触发右键的报文；只用到 id（后端按 id 找回整条流） */
  packet: TsharkPacket | null
  /** 报文所属会话 id：报文按会话分库（SQLite 一库一会话），后端按它路由 */
  sessionId: number | null
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

// ==================== 右侧：选中报文详情 + HTTP 事务 ====================
/** 当前选中的步骤（右侧详情跟着它走） */
const selectedId = ref<number | null>(null)
const selectedStep = computed<TsharkStep | null>(() =>
  steps.value.find(s => s.packetId === selectedId.value) ?? null)

/** 报文完整详情（含 HTTP 头 / 正文）：按 id 缓存，来回点不用重复拉 */
const detailCache = new Map<number, TsharkPacket>()
const selectedDetail = ref<TsharkPacket | null>(null)
const requestDetail = ref<TsharkPacket | null>(null)
const responseDetail = ref<TsharkPacket | null>(null)

/** 当前 HTTP 事务：选中请求就是它自己 + 后面的响应；选中响应就是前面的请求 + 它自己 */
const transaction = computed(() => ({
  request: requestDetail.value,
  response: responseDetail.value,
}))

/** 把步骤区限定为 HTTP 帧（phase 由后端按 info 判定） */
function isHttpStep(step: TsharkStep): boolean {
  return String(step.phase || '').toUpperCase() === 'HTTP'
}

/**
 * 为某个步骤找出它所属的 HTTP 请求 / 响应。
 *
 * <p>生命周期里用户关心的是「这一次请求到底发了什么、回了什么」：选中响应包时
 * 也要能看到它对应的请求头与请求体，所以按相邻的请求-响应配对，而不是只看选中帧。</p>
 *
 * @param id 选中的报文 id
 * @returns 请求 / 响应各自的报文 id；没有则为 null
 */
function pairIds(id: number): { req: number | null, resp: number | null } {
  const all = steps.value
  const idx = all.findIndex(s => s.packetId === id)
  if (idx < 0) {
    return { req: null, resp: null }
  }
  const selected = all[idx]
  let reqIdx = -1
  if (isHttpStep(selected)) {
    if (selected.fromClient) {
      reqIdx = idx
    } else {
      for (let i = idx - 1; i >= 0; i--) {
        if (isHttpStep(all[i]) && all[i].fromClient) {
          reqIdx = i
          break
        }
      }
    }
  } else {
    // 握手 / ACK / 挥手帧本身没有 HTTP 头：给它找最近的 HTTP 事务（优先向后），
    // 右侧仍然能回答「这条流请求了什么、回了什么」
    for (let i = idx + 1; i < all.length; i++) {
      if (isHttpStep(all[i]) && all[i].fromClient) {
        reqIdx = i
        break
      }
    }
    if (reqIdx < 0) {
      for (let i = idx - 1; i >= 0; i--) {
        if (isHttpStep(all[i]) && all[i].fromClient) {
          reqIdx = i
          break
        }
      }
    }
  }
  let respIdx = -1
  if (reqIdx >= 0) {
    for (let i = reqIdx + 1; i < all.length; i++) {
      if (isHttpStep(all[i]) && !all[i].fromClient) {
        respIdx = i
        break
      }
    }
  }
  return {
    req: reqIdx >= 0 ? all[reqIdx].packetId : null,
    resp: respIdx >= 0 ? all[respIdx].packetId : null,
  }
}

/**
 * 选中一步并在右侧补齐详情。
 *
 * @param id 报文 id
 */
async function selectStep(id: number) {
  selectedId.value = id
  await loadSelected()
}

/**
 * 拉取选中报文与配对报文的详情。
 *
 * <p>详情包含 HTTP 头与正文，列表接口不返回；这里按需取，且同一帧只取一次。</p>
 */
async function loadSelected() {
  const id = selectedId.value
  const sid = props.sessionId
  if (id == null || sid == null) return

  const pair = pairIds(id)
  const need = new Set<number>([id])
  if (pair.req != null) need.add(pair.req)
  if (pair.resp != null) need.add(pair.resp)

  // 先用缓存渲染，避免每次点击都空一下
  applyDetails(pair)

  const pending = [...need].filter(x => !detailCache.has(x))
  await Promise.allSettled(pending.map(async x => {
    try {
      detailCache.set(x, await getTsharkPacketDetail(sid, x) as TsharkPacket)
    } catch {
      // 单帧详情失败不影响整条生命周期，右侧保留已拿到的部分
    }
  }))
  // 竞态丢弃：慢请求回来时用户可能已经点了别的步骤
  if (selectedId.value !== id) return
  applyDetails(pair)
}

/**
 * 把缓存里的详情映射到右侧三个槽位。
 *
 * @param pair 请求 / 响应报文 id
 */
function applyDetails(pair: { req: number | null, resp: number | null }) {
  const id = selectedId.value
  selectedDetail.value = id != null ? (detailCache.get(id) ?? null) : null
  requestDetail.value = pair.req != null ? (detailCache.get(pair.req) ?? null) : null
  responseDetail.value = pair.resp != null ? (detailCache.get(pair.resp) ?? null) : null
}

/**
 * 阶段耗时。
 *
 * <p>用「全部报文」而不是过滤掉纯 ACK 之后的集合：纯 ACK 虽然不承载数据，
 * 但它的到达时刻正是握手/传输的真实终点，滤掉会让各段都偏短。</p>
 */
const breakdown = computed(() => buildLifecycleBreakdown(steps.value))
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
  () => [props.modelValue, props.packet?.id, props.sessionId] as const,
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
  const sid = props.sessionId
  if (id == null || sid == null) return
  loading.value = true
  error.value = ''
  data.value = null
  // 换了一条流：旧帧详情不能复用（id 是会话内自增，跨流会撞号）
  detailCache.clear()
  selectedDetail.value = null
  requestDetail.value = null
  responseDetail.value = null
  selectedId.value = null
  try {
    data.value = await getTsharkHandshake(sid, id) as TsharkHandshake
    if (!data.value?.steps?.length) {
      error.value = '这条流还没有可展示的报文'
    } else {
      // 打开就能看到内容：优先选中第一个 HTTP 请求，没有就选第一步
      const first = data.value.steps.find(s => String(s.phase || '').toUpperCase() === 'HTTP' && s.fromClient)
        ?? data.value.steps[0]
      void selectStep(first.packetId)
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

/**
 * 明细行点击 = 在右侧看这条报文。
 *
 * <p>与时间线箭头保持一致：抽屉内部不再叠一层抽屉，右侧面板就是「详情」。</p>
 *
 * @param row 表格行
 */
function onRowClick(row: Record<string, unknown>) {
  void selectStep(Number(row.packetId))
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

/* ==================== 整体：左生命周期 / 右报文详情 ====================
   80% 宽的抽屉足够把「整条流长什么样」和「这一帧到底发了什么」并排放；
   左侧自适应宽度并能独立滚动，右侧固定 420px 只滚自己的内容。 */
.lc-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 16px;
  align-items: start;
}
.lc-left {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.lc-right {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  max-height: calc(100vh - 140px);
  overflow: auto;
  padding-left: 16px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.lc-right__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lc-right__head h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.lc-http {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
}
.lc-http__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.lc-http__head h4 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.lc-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lc-block h4 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.lc-pre {
  margin: 0;
  padding: 10px 12px;
  max-height: 220px;
  overflow: auto;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-lighter);
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 11px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--el-text-color-regular);
}

/* 窄屏（抽屉 80% 也可能不够宽）时上下堆叠，右侧不再是侧栏 */
@media (max-width: 1180px) {
  .lc-body { grid-template-columns: minmax(0, 1fr); }
  .lc-right {
    position: static;
    max-height: none;
    padding-left: 0;
    border-left: 0;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

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

/* ===== 一次请求的阶段耗时 ===== */
.lc-phases {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}
.lc-phases__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.lc-phases__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.lc-phases__bar {
  display: flex;
  gap: 2px;
  height: 8px;
  margin-bottom: 10px;
}
.lc-phases__seg {
  flex-basis: 0;
  min-width: 3px;
  border-radius: 2px;
  background: var(--lc-seg-c, var(--el-color-info));
}
.lc-phases__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-bottom: 8px;
}
.lc-phases__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
}
.lc-phases__label { color: var(--el-text-color-regular); }
.lc-phases__ms {
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.lc-phases__share {
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.lc-phases__verdict {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
/* 阶段配色：与时间线上的 phase-* 保持同一套语义 */
.seg-connect { --lc-seg-c: var(--ts-run); background: var(--ts-run); }
.seg-tls { --lc-seg-c: var(--el-color-primary); background: var(--el-color-primary); }
.seg-request { --lc-seg-c: var(--el-color-success); background: var(--el-color-success); }
.seg-wait {
  --lc-seg-c: var(--el-color-warning);
  background: var(--el-color-warning);
}
.seg-transfer { --lc-seg-c: var(--metric-jvm, #14b8a6); background: var(--metric-jvm, #14b8a6); }
.seg-close { --lc-seg-c: var(--metric-disk, #f59e0b); background: var(--metric-disk, #f59e0b); }
.lc-phases__item .lc-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--lc-seg-c, var(--el-color-info));
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
  white-space: nowrap;
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
/** 协议还原明文：比摘要浅色，文字溢出时省略 */
.lc-step__restored {
  display: block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  line-height: 14px;
  font-family: var(--el-font-family-mono, monospace);
}
.lc-step:hover .lc-step__label {
  background: color-mix(in srgb, var(--lc-c) 14%, var(--el-bg-color));
}
/* 当前选中：左侧点谁，右侧就是谁，所以选中态必须显眼（描边 + 底色） */
.lc-step.is-selected .lc-step__label {
  background: color-mix(in srgb, var(--lc-c) 20%, var(--el-bg-color));
  box-shadow: inset 0 0 0 1px var(--lc-c);
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

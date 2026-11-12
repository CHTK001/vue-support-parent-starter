<script setup lang="ts">
/**
 * 路由页：一条请求怎么走。
 *
 * <p>三层台账——入站 AppKey → 路由组网关 → 上游成员。中间用 SVG 贝塞尔连线连起来，
 * 命中成员的连线点亮并流动，失败标红；所有数据都来自真实接口，没有请求时只保留
 * 静态连线，不伪造选中。</p>
 *
 * <p>数据契约：{@code GET /api/providers/{id}/router-group/topology} 一次返回
 * 配置 / 入站聚合 / 上游成员 / 最近决策，避免三层各打一个接口导致时序错位。
 * 入站聚合来自 {@code sys_ai_service_access_log}，上游命中来自进程内
 * {@code RouterGroupActivity}（容量 20，重启清空）。</p>
 *
 * @author CH
 * @since 4.0.0.58
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh as RefreshIcon } from '@element-plus/icons-vue'

import RePageHead from '@/components/ui/RePageHead.vue'
import { adminApi } from '@/framework/context'
import ProviderLogo from '../models/ProviderLogo.vue'
import { resolveProviderBrand } from '../models/model.utils'

/** 路由组供应商的平台标识（与后端 ProviderRouteTargets 一致） */
const ROUTER_GROUP_PLATFORM = 'router-group'
/** 实时轮询间隔 */
const POLL_MS = 2000
/** 路由组清单重读间隔（新建/改名后页面能自己跟上） */
const GROUP_RELOAD_MS = 30000
/** 一次决策在两个刷新周期内都算「刚发生」 */
const ACTIVE_WINDOW = 15000
/** 入站聚合默认条数 */
const KEY_LIMIT = 8

const WINDOW_OPTIONS = [
  { label: '最近 1 小时', value: 1 },
  { label: '最近 6 小时', value: 6 },
  { label: '最近 24 小时', value: 24 },
  { label: '最近 7 天', value: 168 },
]

const STRATEGY_LABELS: Record<string, string> = {
  smart: '智能',
  order: '顺序',
  until_exhausted: '用完再换',
  round_robin: '轮流',
  least_used: '最少使用',
  expire_first: '到期前用完',
  free_first: '免费优先',
  speed_first: '速度优先',
  cheapest_first: '最便宜',
  free_quota_first: '免费额度先到先用',
  weighted: '按权重',
  manual: '手动',
}

const STRATEGY_HINTS: Record<string, string> = {
  smart: '按价格、延迟、成功率打分：轻活给便宜的，重活给更强的。',
  order: '永远先试列表第一个，失败再往下。',
  until_exhausted: '一直用当前成员，直到它被限流或报错才换。',
  round_robin: '每个请求换一个成员，把配额摊平。',
  least_used: '优先派给累计调用次数最少的成员。',
  expire_first: '离额度到期最近的先派出去，避免额度白白过期。',
  free_first: '免费成员用尽才用付费成员。',
  speed_first: '优先派给实测首字延迟最低的成员。',
  cheapest_first: '优先派给价格最低的成员。',
  free_quota_first: '免费成员按额度到期时间先后使用。',
  weighted: '按成员配置的权重分配请求。',
  manual: '只调用手动选中的那一个，不自动切换。',
}

interface RouterGroupOption {
  provider_id: string
  name: string
  platform?: string
}

interface InboundKey {
  app_key: string
  name?: string | null
  calls: number
  success_calls: number
  tokens: number
  avg_latency_ms?: number | null
  last_at?: number | null
  balance?: number | string | null
  total_cost?: number | string | null
  status?: number | null
  total_tokens?: number | null
  max_tokens?: number | null
  use_count?: number | null
  max_use?: number | null
  overdraft_enabled?: number | null
}

interface InboundTotal {
  calls: number
  success_calls: number
  tokens: number
  avg_latency_ms?: number | null
  last_at?: number | null
}

interface Upstream {
  provider_id: string
  model: string
  label?: string
  alias?: string | null
  provider_name?: string
  platform?: string
  enabled?: boolean
  weight?: number
  effort?: string | null
  free?: boolean
  expire_at?: number | null
  context_window?: number | null
  metrics?: Record<string, any> | null
  hits?: number
  success_hits?: number
  avg_cost_ms?: number | null
  hit_rate?: number | null
}

interface Decision {
  member_label: string
  member_model?: string
  at: number
  success: boolean
  cost_ms?: number
}

interface Topology {
  group: Record<string, any>
  gateway: Record<string, any>
  inbound: {
    window_hours: number
    total: InboundTotal
    keys: InboundKey[]
  }
  upstreams: Upstream[]
  decisions: Decision[]
  window_hours: number
  server_time: number
}

/** 连线几何（单位：画布内像素） */
interface Geometry {
  gateway: { x: number; y: number; w: number; h: number } | null
  inbound: Array<{ x: number; y: number }>
  upstream: Array<{ x: number; y: number }>
}

const loading = ref(false)
const error = ref('')
const groups = ref<RouterGroupOption[]>([])
const groupId = ref('')
const windowHours = ref(1)
const snapshot = ref<Topology | null>(null)
const nowTick = ref(Date.now())
const lastFetchAt = ref(0)
const online = ref(false)
const refreshing = ref(false)

const geo = ref<Geometry>({ gateway: null, inbound: [], upstream: [] })
const svgW = ref(0)
const svgH = ref(0)
const boardRef = ref<HTMLElement | null>(null)

const group = computed(() => snapshot.value?.group ?? null)
const upstreams = computed<Upstream[]>(() => {
  const list = Array.isArray(snapshot.value?.upstreams) ? [...snapshot.value!.upstreams] : []
  // 命中多的排前面：列表顺序就是「谁在真正干活」
  list.sort((a, b) => {
    const hitsDiff = Number(b.hits || 0) - Number(a.hits || 0)
    if (hitsDiff !== 0) return hitsDiff
    return Number(b.weight || 0) - Number(a.weight || 0)
  })
  return list
})
const inboundKeys = computed<InboundKey[]>(() =>
  Array.isArray(snapshot.value?.inbound?.keys) ? snapshot.value!.inbound.keys : [],
)
const decisions = computed<Decision[]>(() =>
  Array.isArray(snapshot.value?.decisions) ? snapshot.value!.decisions : [],
)
const total = computed<InboundTotal>(
  () => snapshot.value?.inbound?.total ?? { calls: 0, success_calls: 0, tokens: 0 },
)

const kpi = computed(() => {
  const calls = Number(total.value.calls || 0)
  const ok = Number(total.value.success_calls || 0)
  return {
    calls,
    successRate: calls === 0 ? null : Math.round((ok * 1000) / calls) / 10,
    latency: total.value.avg_latency_ms == null ? null : Number(total.value.avg_latency_ms),
    keys: inboundKeys.value.length,
    upstreams: upstreams.value.length,
  }
})

/** 最近 15 秒内的最新决策：视图只按它点亮一条线 */
const activeDecision = computed<Decision | null>(() => {
  const fresh = decisions.value.find((d) => nowTick.value - Number(d.at || 0) < ACTIVE_WINDOW)
  return fresh ?? null
})
const activeLabel = computed(() => activeDecision.value?.member_label ?? '')
const activeFailed = computed(() => activeDecision.value != null && activeDecision.value.success === false)

const strategyCode = computed(() => String(group.value?.strategy || 'smart'))
const strategyLabel = computed(() => STRATEGY_LABELS[strategyCode.value] || '智能')
const strategyHint = computed(() => STRATEGY_HINTS[strategyCode.value] || STRATEGY_HINTS.smart)

const activeUpstreamIndex = computed(() =>
  activeLabel.value ? upstreams.value.findIndex((m) => memberLabel(m) === activeLabel.value) : -1,
)

/** 入站节点是否「刚有流量」：该 Key 最近一次请求落在窗口内 */
const isKeyHot = (key?: InboundKey) =>
  !!key && Number(key.last_at || 0) > 0 && nowTick.value - Number(key.last_at) < ACTIVE_WINDOW

const isUpstreamHot = (_m: Upstream | undefined, i: number) => i === activeUpstreamIndex.value
const isUpstreamFailed = (m: Upstream | undefined, i: number) => isUpstreamHot(m, i) && activeFailed.value

const memberLabel = (m: Upstream) => m.label || `${m.provider_id}:${m.model}`

/** 路由组自建标识的品牌（解析后得到 router-group，对应群节点 logo） */
const groupBrand = computed(() => resolveProviderBrand({ platform: ROUTER_GROUP_PLATFORM }))

const initial = (name?: string | null) => {
  const text = String(name || '?').trim()
  return text.charAt(0).toUpperCase() || '?'
}

const fmtCompact = (n: number | null | undefined) => {
  const value = Number(n || 0)
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

const fmtMoney = (value: number | string | null | undefined) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `¥${n.toFixed(2)}`
}

const fmtCtx = (value?: number | null) =>
  value ? (value >= 1000 ? `${Math.round(value / 1000)}K` : String(value)) : ''

const fmtMs = (ms?: number | null) => (ms == null ? '—' : `${(Number(ms) / 1000).toFixed(2)}s`)

const fmtTime = (ms?: number | null) => {
  if (!ms) return '—'
  const d = new Date(Number(ms))
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(
    d.getSeconds(),
  ).padStart(2, '0')}`
}

const relative = (ms?: number | null) => {
  if (!ms) return '无调用'
  const diff = nowTick.value - Number(ms)
  if (diff < 0) return '刚刚'
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return `${Math.floor(diff / 86_400_000)} 天前`
}

const priceText = (m: Upstream) => {
  if (m.free) return '免费额度'
  const metrics = m.metrics || {}
  const price = Number(
    metrics.price_input_per_musd ?? metrics.price_input ?? metrics.input_price ?? Number.NaN,
  )
  return Number.isFinite(price) ? `$${price}/1M in` : '价格未采集'
}

/** 命中率：以最近 20 条决策为分母，样本太小就显示 — */
const hitRateText = (m: Upstream) => (m.hit_rate == null ? '—' : `${m.hit_rate}%`)

const successRateText = (m: Upstream) => {
  const hits = Number(m.hits || 0)
  if (hits === 0) return '暂无命中'
  const ok = Number(m.success_hits || 0)
  return `成功率 ${Math.round((ok * 1000) / hits) / 10}%`
}

const distItems = computed(() => {
  const totalHits = upstreams.value.reduce((sum, m) => sum + Number(m.hits || 0), 0)
  const palette = [
    'var(--u-primary)',
    'var(--u-success)',
    'var(--u-warning)',
    'var(--u-purple)',
    'var(--u-danger)',
  ]
  return upstreams.value
    .filter((m) => Number(m.hits || 0) > 0)
    .map((m, i) => ({
      label: m.alias || m.model,
      hits: Number(m.hits || 0),
      percent: totalHits === 0 ? 0 : Math.round((Number(m.hits || 0) * 1000) / totalHits) / 10,
      color: palette[i % palette.length],
    }))
})

// ==================== 连线几何 ====================

const inPaths = computed(() => {
  const gateway = geo.value.gateway
  if (!gateway) return [] as string[]
  return geo.value.inbound.map((p) => {
    const gy = gateway.y + gateway.h / 2
    const bend = Math.max(24, (gateway.x - p.x) * 0.55)
    return `M ${p.x} ${p.y} C ${p.x + bend} ${p.y}, ${gateway.x - bend} ${gy}, ${gateway.x} ${gy}`
  })
})

const upPaths = computed(() => {
  const gateway = geo.value.gateway
  if (!gateway) return [] as string[]
  const gx = gateway.x + gateway.w
  const gy = gateway.y + gateway.h / 2
  return geo.value.upstream.map((p) => {
    const bend = Math.max(24, (p.x - gx) * 0.55)
    return `M ${gx} ${gy} C ${gx + bend} ${gy}, ${p.x - bend} ${p.y}, ${p.x} ${p.y}`
  })
})

let measureRaf = 0
const measure = () => {
  const board = boardRef.value
  if (!board) return
  const br = board.getBoundingClientRect()
  svgW.value = Math.round(br.width)
  svgH.value = Math.round(br.height)
  const rel = (el: Element) => {
    const r = el.getBoundingClientRect()
    return { x: r.left - br.left, y: r.top - br.top, w: r.width, h: r.height }
  }
  const gwEl = board.querySelector<HTMLElement>('.rt-gw-node')
  const gateway = gwEl ? rel(gwEl) : null
  const inbound = Array.from(board.querySelectorAll<HTMLElement>('.rt-in')).map((el) => {
    const r = rel(el)
    return { x: r.x + r.w, y: r.y + r.h / 2 }
  })
  const upstream = Array.from(board.querySelectorAll<HTMLElement>('.rt-up')).map((el) => {
    const r = rel(el)
    return { x: r.x, y: r.y + r.h / 2 }
  })
  geo.value = { gateway, inbound, upstream }
}

const scheduleMeasure = () => {
  if (measureRaf) cancelAnimationFrame(measureRaf)
  measureRaf = requestAnimationFrame(() => {
    measureRaf = 0
    measure()
  })
}

// ==================== 取数 ====================

const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res)

/** 路由组清单：/api/providers 里 platform=router-group 的行 */
const loadGroups = async () => {
  try {
    const data = unwrap(await adminApi.get('/api/providers'))
    const list: any[] = Array.isArray(data) ? data : []
    groups.value = list
      .filter((p) => p && String(p.platform || '').toLowerCase() === ROUTER_GROUP_PLATFORM && p.provider_id)
      .map((p) => ({ provider_id: String(p.provider_id), name: p.name || String(p.provider_id), platform: p.platform }))
    if (groups.value.length === 0) {
      groupId.value = ''
      snapshot.value = null
      return
    }
    if (!groupId.value || !groups.value.some((g) => g.provider_id === groupId.value)) {
      groupId.value = groups.value[0].provider_id
    }
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  }
}

const loadTopology = async (manual = false) => {
  if (!groupId.value) return
  // 轮询慢于后端响应时不叠请求：同一时刻只保留一个快照读取
  if (!manual && inFlight) return
  inFlight = true
  if (manual) refreshing.value = true
  try {
    const data = unwrap(
      await adminApi.get(
        `/api/providers/${encodeURIComponent(groupId.value)}/router-group/topology`,
        { params: { window_hours: windowHours.value, key_limit: KEY_LIMIT } },
      ),
    )
    snapshot.value = data as Topology
    online.value = true
    error.value = ''
    lastFetchAt.value = Date.now()
    await nextTick()
    scheduleMeasure()
  } catch (e: any) {
    online.value = false
    error.value = e?.message ?? String(e)
    if (manual) ElMessage.error(`拓扑读取失败：${error.value}`)
  } finally {
    inFlight = false
    loading.value = false
    refreshing.value = false
  }
}

const load = async () => {
  loading.value = true
  await loadGroups()
  await loadTopology()
}

/** 拓扑请求在飞标记：防止 2s 轮询叠请求 */
let inFlight = false

let pollTimer: ReturnType<typeof setInterval> | null = null
let groupTimer: ReturnType<typeof setInterval> | null = null

const onResize = () => scheduleMeasure()

watch(groupId, () => {
  snapshot.value = null
  geo.value = { gateway: null, inbound: [], upstream: [] }
  loadTopology()
})

watch(windowHours, () => loadTopology())

watch([() => snapshot.value, () => upstreams.value.length, () => inboundKeys.value.length], async () => {
  await nextTick()
  scheduleMeasure()
})

onMounted(async () => {
  await load()
  // 只看数据年龄：没有新决策也要让「刚刚 / N 分钟前」走字
  pollTimer = setInterval(() => {
    nowTick.value = Date.now()
    loadTopology()
  }, POLL_MS)
  groupTimer = setInterval(loadGroups, GROUP_RELOAD_MS)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (groupTimer) clearInterval(groupTimer)
  pollTimer = null
  groupTimer = null
  if (measureRaf) cancelAnimationFrame(measureRaf)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="rt-page">
    <RePageHead title="路由" subtitle="入站 Key 打到哪个路由组，最终命中哪个上游成员。">
      <template #meta>
        <span class="rt-live" :class="{ on: online }">
          <i class="rt-dot" />{{ online ? '实时 · 2s' : '已断流' }}
        </span>
        <span v-if="lastFetchAt" class="rt-updated">{{ relative(lastFetchAt) }}更新</span>
      </template>
      <template #actions>
        <el-select
          v-if="groups.length"
          v-model="groupId"
          class="rt-select"
          placeholder="选择路由组"
          size="default"
        >
          <el-option v-for="g in groups" :key="g.provider_id" :label="g.name" :value="g.provider_id" />
        </el-select>
        <el-select v-model="windowHours" class="rt-select rt-select--sm" size="default">
          <el-option v-for="w in WINDOW_OPTIONS" :key="w.value" :label="w.label" :value="w.value" />
        </el-select>
        <el-button :loading="refreshing" @click="loadTopology(true)">
          <el-icon v-if="!refreshing" class="rt-btn-icon" aria-hidden="true"><RefreshIcon /></el-icon>
          刷新
        </el-button>
      </template>
    </RePageHead>

    <div v-if="error" class="rt-alert is-danger">
      <span>{{ error }}</span>
      <button @click="load">重试</button>
    </div>

    <el-empty
      v-if="!loading && groups.length === 0"
      description="还没有路由组。到「模型管理 → 供应商」把平台设为 router-group 后回来。"
    />

    <template v-else>
      <div class="rt-kpis">
        <div class="rt-kpi">
          <div class="k">{{ snapshot?.window_hours || windowHours }}h 请求</div>
          <div class="v mono">{{ kpi.calls.toLocaleString() }}<small>次</small></div>
          <div class="bar"><i :style="{ width: '100%' }" /></div>
        </div>
        <div class="rt-kpi">
          <div class="k">成功率</div>
          <div class="v mono">
            {{ kpi.successRate == null ? '—' : kpi.successRate }}<small v-if="kpi.successRate != null">%</small>
          </div>
          <div class="bar">
            <i :style="{ width: `${kpi.successRate ?? 0}%`, background: 'var(--u-success)' }" />
          </div>
        </div>
        <div class="rt-kpi">
          <div class="k">平均延迟</div>
          <div class="v mono">
            {{ kpi.latency == null ? '—' : fmtMs(kpi.latency) }}<small v-if="kpi.latency != null">· 入站</small>
          </div>
          <div class="bar">
            <i
              :style="{
                width: `${kpi.latency == null ? 0 : Math.min(100, Math.round(kpi.latency / 40))}%`,
                background: 'var(--u-warning)',
              }"
            />
          </div>
        </div>
        <div class="rt-kpi">
          <div class="k">入站 Key / 上游成员</div>
          <div class="v mono">{{ kpi.keys }}<small>/ {{ kpi.upstreams }}</small></div>
          <div class="bar">
            <i
              :style="{
                width: `${kpi.upstreams === 0 ? 0 : Math.round((kpi.keys / kpi.upstreams) * 100)}%`,
                background: 'var(--u-purple)',
              }"
            />
          </div>
        </div>
      </div>

      <div ref="boardRef" class="rt-board">
        <svg class="rt-links" :width="svgW" :height="svgH" aria-hidden="true">
          <path
            v-for="(d, i) in inPaths"
            :key="`in-link-${i}`"
            class="rt-link"
            :class="{ hot: isKeyHot(inboundKeys[i]) }"
            :d="d"
          />
          <path
            v-for="(d, i) in upPaths"
            :key="`up-link-${i}`"
            class="rt-link"
            :class="{ hot: isUpstreamHot(upstreams[i], i), bad: isUpstreamFailed(upstreams[i], i) }"
            :d="d"
          />
        </svg>

        <div>
          <div class="rt-col-h">
            <span>入站</span>
            <span class="mono">{{ inboundKeys.length }} KEYS</span>
          </div>
          <div v-if="inboundKeys.length === 0" class="rt-col-empty">
            窗口内没有带 AppKey 的请求
          </div>
          <div class="rt-inbounds">
            <div
              v-for="key in inboundKeys"
              :key="key.app_key"
              class="rt-in"
              :class="{ hot: isKeyHot(key) }"
              :title="key.app_key"
            >
              <span class="rt-mark">{{ initial(key.name || key.app_key) }}</span>
              <div class="rt-in-main">
                <div class="rt-in-name mono">{{ key.name || `${key.app_key.slice(0, 10)}…` }}</div>
                <div class="rt-in-meta">
                  {{ key.calls }} 次 · {{ fmtCompact(key.tokens) }} tok
                  <span v-if="key.avg_latency_ms != null">· {{ fmtMs(key.avg_latency_ms) }}</span>
                </div>
              </div>
              <div class="rt-in-end">
                <b class="mono">{{ fmtMoney(key.balance) }}</b>
                <span>余额</span>
              </div>
            </div>
            <div v-if="inboundKeys.length" class="rt-more">{{ relative(total.last_at) }}有入站流量</div>
          </div>
        </div>

        <div class="rt-gw">
          <div class="rt-chips">
            <span
              v-for="(label, code) in STRATEGY_LABELS"
              :key="code"
              class="rt-chip"
              :class="{ on: code === strategyCode }"
              :title="STRATEGY_HINTS[code]"
            >
              {{ label }}
            </span>
          </div>
          <div class="rt-gw-node" :class="{ busy: activeDecision != null }">
            <ProviderLogo
              :pid="groupBrand"
              :name="group?.name || '路由组'"
              :size="34"
              class="rt-gw-logo"
            />
            <div class="rt-gw-name">{{ group?.name || groups.find((g) => g.provider_id === groupId)?.name || '路由组' }}</div>
            <div class="rt-gw-st">router-group · {{ upstreams.length }} 成员 · {{ strategyLabel }}</div>
          </div>
          <div class="rt-gw-hint">{{ strategyHint }}</div>
        </div>

        <div>
          <div class="rt-col-h">
            <span>上游</span>
            <span class="mono">按命中排序</span>
          </div>
          <div v-if="upstreams.length === 0" class="rt-col-empty">
            这个路由组还没有成员。去「模型管理」把模型加进来。
          </div>
          <div class="rt-ups">
            <div
              v-for="(m, i) in upstreams"
              :key="memberLabel(m)"
              class="rt-up"
              :class="{ hot: isUpstreamHot(m, i), bad: isUpstreamFailed(m, i) }"
            >
              <i class="rt-pulse" />
              <span class="rt-mark">{{ initial(m.alias || m.model) }}</span>
              <div class="rt-up-main">
                <div class="rt-up-name">
                  {{ m.alias || m.model }}
                  <span v-if="m.context_window" class="rt-tag">{{ fmtCtx(m.context_window) }}</span>
                  <span v-if="m.free" class="rt-tag free">免费</span>
                  <span v-if="m.effort" class="rt-tag">{{ m.effort }}</span>
                  <span v-if="m.enabled === false" class="rt-tag warn">停用</span>
                </div>
                <div class="rt-up-meta">
                  <span>{{ m.provider_name || m.provider_id }}</span>
                  <span v-if="m.platform">· {{ m.platform }}</span>
                  <span v-if="m.weight">· 权重 {{ m.weight }}</span>
                  <span class="mono">· {{ priceText(m) }}</span>
                </div>
              </div>
              <div class="rt-up-stat" :title="`命中率 ${hitRateText(m)}`">
                <b class="mono">{{ isUpstreamHot(m, i) ? (activeFailed ? '失败' : '命中') : '空闲' }}</b>
                <span>{{ successRateText(m) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rt-tail">
        <div class="rt-dec">
          <div class="h">
            <span>最近决策</span>
            <span class="mono">RouterGroupActivity · {{ decisions.length }}</span>
          </div>
          <div v-if="decisions.length === 0" class="rt-empty-line">
            还没有真实路由决策。发一次对话请求，这里会出现命中的成员。
          </div>
          <div
            v-for="(d, i) in decisions.slice(0, 6)"
            :key="`${d.at}-${i}`"
            class="rt-row"
            :class="{ fresh: i === 0 && nowTick - Number(d.at || 0) < ACTIVE_WINDOW }"
          >
            <span class="t mono">{{ fmtTime(d.at) }}</span>
            <span class="rt-row-name">
              {{ d.member_model || d.member_label }}
              <em v-if="d.member_label !== d.member_model">{{ d.member_label }}</em>
            </span>
            <span class="mono" :class="d.success === false ? 'no' : 'ok'">{{ fmtMs(d.cost_ms) }}</span>
            <span :class="d.success === false ? 'no' : 'ok'">{{ d.success === false ? '失败' : '成功' }}</span>
          </div>
        </div>

        <div class="rt-side">
          <div class="h">命中分布 · 最近 {{ decisions.length }} 条</div>
          <div v-if="distItems.length === 0" class="rt-empty-line">暂无命中样本</div>
          <div v-for="item in distItems" :key="item.label" class="rt-split">
            <span class="rt-split-name">{{ item.label }}</span>
            <span class="mono">{{ item.percent }}%</span>
            <span class="track">
              <i :style="{ width: `${item.percent}%`, background: item.color }" />
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.rt-page {
  padding: 0 0 24px;
}

/* 数字统一等宽 + 等距数字：台账页里「次数 / 金额 / 延迟」要对齐成列 */
.rt-page .mono {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}

.rt-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--u-text-2);
}
.rt-live .rt-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--u-text-3);
}
.rt-live.on .rt-dot {
  background: var(--u-success);
  box-shadow: 0 0 0 3px rgba(0, 180, 42, 0.12);
  animation: rt-blink 1.4s ease-in-out infinite;
}
@keyframes rt-blink {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}
.rt-updated {
  font-size: 11px;
  color: var(--u-text-3);
}
.rt-select {
  width: 180px;
}
.rt-select--sm {
  width: 132px;
}
.rt-btn-icon {
  margin-right: 4px;
}

.rt-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 12px 0;
  padding: 10px 14px;
  border-radius: var(--u-radius);
  font-size: 12.5px;
}
.rt-alert.is-danger {
  background: rgba(245, 63, 63, 0.08);
  border: 1px solid rgba(245, 63, 63, 0.24);
  color: var(--u-danger);
}
.rt-alert button {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.rt-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 14px 0;
}
.rt-kpi {
  background: var(--u-card);
  border: 1px solid var(--u-border);
  border-radius: var(--u-radius);
  padding: 12px 14px;
}
.rt-kpi .k {
  font-size: 11px;
  color: var(--u-text-3);
}
.rt-kpi .v {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.rt-kpi .v small {
  font-size: 11px;
  font-weight: 400;
  color: var(--u-text-3);
  margin-left: 4px;
}
.rt-kpi .bar {
  margin-top: 8px;
  height: 3px;
  border-radius: 2px;
  background: var(--u-page);
  overflow: hidden;
}
.rt-kpi .bar i {
  display: block;
  height: 100%;
  background: var(--u-primary);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.rt-board {
  position: relative;
  background: var(--u-card);
  border: 1px solid var(--u-border);
  border-radius: var(--u-radius);
  padding: 16px 18px;
  display: grid;
  grid-template-columns: 250px 208px minmax(0, 1.35fr);
  gap: 24px 96px;
  min-height: 330px;
  align-content: start;
}

/* 连线画在卡片下面：卡片自己的底色会盖住穿过的线段，
   只留下两列之间的间隙里可见的那一段 */
.rt-board > div {
  position: relative;
  z-index: 1;
}

.rt-col-h {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--u-text-3);
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.rt-col-empty {
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--u-text-3);
  padding: 8px 0;
}

.rt-inbounds {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.rt-in {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  border: 1px solid var(--u-border);
  border-radius: 7px;
  background: var(--u-card);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.rt-in.hot {
  border-color: var(--u-primary);
  box-shadow: 0 0 0 3px var(--u-primary-weak);
}
.rt-in-main {
  min-width: 0;
  flex: 1;
}
.rt-in-name {
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rt-in-meta {
  font-size: 10.5px;
  color: var(--u-text-3);
}
.rt-in-end {
  margin-left: auto;
  text-align: right;
  flex: none;
}
.rt-in-end b {
  font-size: 11.5px;
  font-weight: 600;
}
.rt-in-end span {
  display: block;
  font-size: 10px;
  color: var(--u-text-3);
}
.rt-more {
  font-size: 11px;
  color: var(--u-text-3);
  padding: 2px 2px;
}

.rt-gw {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  text-align: center;
}
.rt-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
}
.rt-chip {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--u-border);
  background: var(--u-card);
  color: var(--u-text-2);
}
.rt-chip.on {
  background: var(--u-primary);
  border-color: var(--u-primary);
  color: #fff;
}
.rt-gw-node {
  width: 100%;
  padding: 16px 12px;
  border: 1px solid var(--u-border);
  border-radius: 10px;
  background: var(--u-card);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: box-shadow 0.3s, border-color 0.3s;
}
.rt-gw-node.busy {
  border-color: var(--u-primary);
  box-shadow: 0 0 0 4px var(--u-primary-weak);
}
.rt-gw-logo {
  margin: 0 auto 8px;
}
.rt-gw-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--u-text);
}
.rt-gw-st {
  font-size: 10.5px;
  color: var(--u-text-3);
  margin-top: 3px;
}
.rt-gw-hint {
  font-size: 11px;
  line-height: 1.6;
  color: var(--u-text-3);
  max-width: 210px;
}

.rt-ups {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rt-up {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 11px;
  border: 1px solid var(--u-border);
  border-radius: 8px;
  background: var(--u-card);
  transition: border-color 0.22s, box-shadow 0.22s, transform 0.22s;
}
.rt-up.hot {
  border-color: var(--u-primary);
  box-shadow: 0 0 0 3px var(--u-primary-weak);
  transform: translateX(2px);
}
.rt-up.bad {
  border-color: var(--u-danger);
  box-shadow: 0 0 0 3px rgba(245, 63, 63, 0.1);
}
.rt-up-main {
  min-width: 0;
  flex: 1;
}
.rt-up-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rt-up-meta {
  margin-top: 2px;
  font-size: 10.5px;
  color: var(--u-text-3);
  display: flex;
  gap: 4px 7px;
  flex-wrap: wrap;
}
.rt-up-stat {
  flex: none;
  text-align: right;
}
.rt-up-stat b {
  font-size: 11.5px;
  color: var(--u-text-2);
}
.rt-up.hot .rt-up-stat b {
  color: var(--u-primary);
}
.rt-up.bad .rt-up-stat b {
  color: var(--u-danger);
}
.rt-up-stat span {
  display: block;
  font-size: 10px;
  color: var(--u-text-3);
}

.rt-mark {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  background: var(--u-page);
  color: var(--u-text-2);
  border: 1px solid var(--u-border);
  flex: none;
}
.rt-tag {
  font-size: 10px;
  line-height: 16px;
  padding: 0 6px;
  border-radius: 6px;
  background: var(--u-page);
  color: var(--u-text-2);
  border: 1px solid var(--u-border);
  font-weight: 400;
}
.rt-tag.free {
  background: rgba(0, 180, 42, 0.1);
  color: var(--u-success);
  border-color: rgba(0, 180, 42, 0.18);
}
.rt-tag.warn {
  background: rgba(255, 125, 0, 0.1);
  color: var(--u-warning);
  border-color: rgba(255, 125, 0, 0.18);
}

.rt-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--u-primary);
  flex: none;
  display: none;
  animation: rt-pulse 1.1s ease-in-out infinite;
}
.rt-up.hot .rt-pulse {
  display: block;
}
.rt-up.bad .rt-pulse {
  background: var(--u-danger);
  display: block;
}
@keyframes rt-pulse {
  0%, 100% { transform: scale(0.7); opacity: 0.45; }
  50% { transform: scale(1.2); opacity: 1; }
}

.rt-links {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
  z-index: 0;
}
.rt-link {
  fill: none;
  stroke: var(--u-border);
  stroke-width: 1.4;
  transition: stroke 0.2s;
}
.rt-link.hot {
  stroke: var(--u-primary);
  stroke-width: 1.8;
  stroke-dasharray: 5 11;
  opacity: 0.95;
  animation: rt-dash 0.75s linear infinite;
}
.rt-link.bad {
  stroke: var(--u-danger);
}
@keyframes rt-dash {
  to { stroke-dashoffset: -16; }
}

.rt-tail {
  margin-top: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 14px;
}
.rt-dec,
.rt-side {
  background: var(--u-card);
  border: 1px solid var(--u-border);
  border-radius: var(--u-radius);
  padding: 12px 14px;
}
.rt-dec .h,
.rt-side .h {
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--u-text-3);
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.rt-row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: center;
  padding: 6px 0;
  border-top: 1px solid var(--u-page);
  font-size: 11.5px;
}
.rt-row:first-of-type {
  border-top: 0;
}
.rt-row .t {
  color: var(--u-text-3);
  font-size: 10.5px;
}
.rt-row-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rt-row-name em {
  font-style: normal;
  font-size: 10px;
  color: var(--u-text-3);
  margin-left: 6px;
}
.rt-row.fresh {
  animation: rt-rowin 0.5s ease-out both;
  background: var(--u-primary-weak);
}
@keyframes rt-rowin {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}
.rt-dec .ok,
.rt-side .ok {
  color: var(--u-success);
}
.rt-dec .no {
  color: var(--u-danger);
}
.rt-empty-line {
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--u-text-3);
  padding: 4px 0;
}

.rt-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 8px;
  font-size: 11px;
  margin-bottom: 8px;
}
.rt-split-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--u-text-2);
}
.rt-split .track {
  grid-column: 1 / -1;
  height: 6px;
  border-radius: 3px;
  background: var(--u-page);
  overflow: hidden;
  display: flex;
}
.rt-split .track i {
  height: 100%;
  transition: width 0.5s ease;
}

@media (max-width: 1080px) {
  .rt-board {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .rt-links {
    display: none;
  }
  .rt-tail {
    grid-template-columns: 1fr;
  }
  .rt-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .rt-page * {
    animation: none !important;
    transition: none !important;
  }
}
</style>

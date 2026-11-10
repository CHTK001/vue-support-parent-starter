<template>
  <section class="rglive">
    <div class="rglive-head">
      <div class="rglive-head-text">
        <div class="rglive-title">实时 · 路由组正在做的决定</div>
        <div class="rglive-desc">{{ strategyHint }}</div>
      </div>
      <div class="rglive-head-meta">
        <span class="rglive-count">{{ members.length }} 个成员</span>
        <span class="rglive-live" :class="{ on: liveOn }">
          <i class="rglive-dot"></i>{{ liveOn ? '实时' : '待命' }}
        </span>
      </div>
    </div>

    <div v-if="members.length === 0" class="rglive-empty">
      还没有成员。先在下方把模型库里的模型加进来，这里会显示实时路由。
    </div>

    <div v-else class="rglive-canvas" :style="{ height: canvasHeight + 'px' }">
      <svg
        class="rglive-links"
        :viewBox="`0 0 1000 ${canvasHeight}`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <template v-for="(m, i) in members" :key="'ln' + (m.label || i)">
          <path
            :id="`rglive-link-${i}`"
            class="rglive-link"
            :d="linkPath(i)"
            vector-effect="non-scaling-stroke"
          />
          <path
            class="rglive-flow"
            :class="{ active: i === activeIndex }"
            :d="linkPath(i)"
            vector-effect="non-scaling-stroke"
          />
        </template>
        <!-- 每条真实路由决策播一次：小鸟沿对应成员的扇出线飞过去 -->
        <g
          v-if="flightIndex >= 0 && flightDecision"
          :key="flightDecision.key"
          class="rglive-bird-flight"
          :class="{ failed: !flightDecision.success }"
          aria-hidden="true"
        >
          <animateMotion dur="1.25s" fill="freeze" rotate="auto">
            <mpath :href="`#rglive-link-${flightIndex}`" />
          </animateMotion>
          <g class="rglive-bird" transform="translate(-13 -10)">
            <!-- 小鸟剪影：圆润的身形、尖嘴与双翼，翅膀独立扑动 -->
            <path class="rglive-bird-body" d="M4 13c1-4.8 5-8 10-8 3.2 0 5.8 1.2 7.7 3.4l4.8-1.6-2.8 4.1c.2.7.3 1.4.3 2.1 0 4.9-4.2 8.5-9.7 8.5H9.8L5 25l1.5-5.2A9.2 9.2 0 0 1 4 13Z" />
            <path class="rglive-bird-belly" d="M10 17c2.4 1.5 5.7 1.8 8.4.8-1.1 2.2-3.1 3.5-5.8 3.5H9.8L7.5 23l1-3.5A8 8 0 0 1 7 17.8c1 .1 2 .1 3-.8Z" />
            <path class="rglive-bird-wing" d="M10 12.5c2-4.2 6.1-5.4 9.7-3.1-1 3.9-4.3 6.1-8 5.8" />
            <circle class="rglive-bird-eye" cx="20.5" cy="11.2" r=".8" />
            <path class="rglive-bird-tail" d="m5.4 14-3.4-1.4 1.6 3.2" />
          </g>
        </g>
      </svg>

      <div class="rglive-group" :class="{ busy: liveOn }" :style="{ top: groupTop + 'px' }">
        <ProviderLogo :pid="groupBrand" :name="providerName" size="lg" />
        <div class="rglive-group-name" :title="providerName">{{ providerName }}</div>
        <div class="rglive-group-strategy">{{ strategyLabel }} ›</div>
      </div>

      <div
        v-for="(m, i) in members"
        :key="m.label || i"
        class="rglive-member"
        :class="{ active: i === activeIndex, failed: i === activeIndex && activeFailed }"
        :style="{ top: i * ROW_H + 8 + 'px' }"
      >
        <ProviderLogo
          :pid="brandFor(m)"
          :name="m.provider_name"
          size="sm"
          class="rglive-avatar"
        />
        <div class="rglive-info">
          <div class="rglive-name">
            {{ m.alias || m.model }}
            <span v-if="isFree(m)" class="rglive-tag free">免费</span>
            <span v-if="m.effort" class="rglive-tag">{{ m.effort }}</span>
            <span v-if="m.exists === false" class="rglive-tag warn">已删除</span>
          </div>
          <div class="rglive-meta">
            <span>{{ m.provider_name || m.provider_id }}</span>
            <span v-if="m.platform">· {{ m.platform }}</span>
            <span v-if="m.context_window">· 上下文 {{ fmtCtx(m.context_window) }}</span>
          </div>
        </div>
        <div class="rglive-state" :class="{ active: i === activeIndex, failed: i === activeIndex && activeFailed }">
          <template v-if="i === activeIndex">
            <span class="rglive-pulse"></span>
            {{ stateText }}
          </template>
          <template v-else>空闲</template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 路由组实时决策视图。
 *
 * <p>左侧是组节点（组名 + 策略徽标），右侧是成员列表，中间用扇出连线连起来；
 * 连线上的流动虚线表示「这条通道可用」，当后端记录到最近一次真实路由决策时，
 * 对应那条连线变黄并在成员行显示「回答中 / 命中」，失败会标红。</p>
 *
 * <p>数据是真实的：决策来自 {@code GET /api/providers/{id}/router-group/live}
 * （内存快照，进程重启清空）；没有请求时只保留静态流动，不伪造选中。</p>
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { adminApi } from '@/framework/context'
import { resolveProviderBrand } from './model.utils'
import ProviderLogo from './ProviderLogo.vue'

const props = withDefaults(defineProps<{ providerId: string; providerName?: string }>(), {
  providerName: '',
})

/** 单行占位高度（行高 50 + 间隔 8） */
const ROW_H = 58
/** 行高 */
const ROW_BODY = 50
/** 行距顶部的内边距 */
const ROW_PAD = 8

/** 决策保持高亮的窗口（毫秒） */
const ACTIVE_WINDOW = 15000

const setting = ref<Record<string, any>>({ strategy: 'smart' })
const members = ref<any[]>([])
const activeLabel = ref<string | null>(null)
const activeFailed = ref(false)
const activeCost = ref(0)
const activeAt = ref(0)
const liveOn = ref(false)
const nowTick = ref(Date.now())
/** 最近一次决策的小鸟飞行动画（同一决策轮询不重播） */
const flightDecision = ref<{
  key: string
  memberLabel: string
  success: boolean
} | null>(null)
const lastFlightKey = ref('')

const STRATEGY_LABELS: Record<string, string> = {
  smart: '智能',
  order: '按顺序',
  until_exhausted: '用完再换',
  round_robin: '轮流',
  least_used: '最少使用',
  expire_first: '到期前用完',
  free_first: '免费优先',
  speed_first: '速度优先',
  cheapest_first: '最便宜优先',
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

const strategyLabel = computed(
  () => STRATEGY_LABELS[setting.value.strategy] || STRATEGY_LABELS.smart,
)
const strategyHint = computed(
  () => STRATEGY_HINTS[setting.value.strategy] || STRATEGY_HINTS.smart,
)

const canvasHeight = computed(() => Math.max(120, members.value.length * ROW_H + 16))
const groupTop = computed(() => Math.max(6, canvasHeight.value / 2 - 46))

const activeIndex = computed(() => {
  if (!activeLabel.value) return -1
  return members.value.findIndex((m) => m.label === activeLabel.value)
})

const flightIndex = computed(() => {
  if (!flightDecision.value) return -1
  return members.value.findIndex((m) => m.label === flightDecision.value?.memberLabel)
})

const stateText = computed(() => {
  if (activeFailed.value) return '失败，已切换'
  // 决策刚发生（3 秒内）视为仍在出字；之后显示耗时结果
  if (nowTick.value - activeAt.value < 3000) return '回答中…'
  return activeCost.value > 0 ? `命中 · ${(activeCost.value / 1000).toFixed(1)}s` : '命中'
})

const linkPath = (i: number) => {
  const gy = canvasHeight.value / 2
  const ry = i * ROW_H + ROW_PAD + ROW_BODY / 2
  // 组节点右边缘约 22%，成员行左边缘 38%：中间留出可视的扇出空间
  return `M 222 ${gy} C 280 ${gy}, 300 ${ry}, 382 ${ry}`
}

const fmtCtx = (value: number) => (value >= 1000 ? `${Math.round(value / 1000)}K` : String(value))

/** 路由组自建标识的品牌（解析后得到 `router-group`，对应群节点 logo） */
const groupBrand = computed(() => resolveProviderBrand({ platform: ROUTER_GROUP_PLATFORM }))

/** 成员品牌：由成员类别 + 供应商名解析品牌，取到 logo，取不到 fall 首字母 */
const brandFor = (m: any) => resolveProviderBrand({
  platform: m.platform,
  provider_id: m.provider_id,
  name: m.provider_name,
  base_url: '',
})

/** 成员名称 Fey（首字母装饰） */
const initial = (m: any) => {
  const name = String(m?.alias || m?.model || m?.provider_name || '?')
  return name.trim().charAt(0).toUpperCase() || '?'
}

const isFree = (m: any) => m?.free === true

/** 路由组供应商的平台标识（与后端 ProviderRouteTargets 一致） */
const ROUTER_GROUP_PLATFORM = 'router-group'

/** 读取配置 + 成员 */
const loadConfig = async () => {
  if (!props.providerId) return
  try {
    const res: any = await adminApi.get(
      `/api/providers/${encodeURIComponent(props.providerId)}/router-group`,
    )
    const data = res?.data ?? res
    if (data?.setting) setting.value = data.setting
    if (Array.isArray(data?.members)) members.value = data.members
  } catch {
    // 配置读取失败不打断实时视图；保留已有数据
  }
}

/** 拉一次实时决策 */
const pollLive = async () => {
  if (!props.providerId) return
  nowTick.value = Date.now()
  try {
    const res: any = await adminApi.get(
      `/api/providers/${encodeURIComponent(props.providerId)}/router-group/live`,
    )
    const data = res?.data ?? res
    const list: any[] = Array.isArray(data?.decisions) ? data.decisions : []
    const fresh = list.find((d) => nowTick.value - Number(d.at || 0) < ACTIVE_WINDOW)
    if (fresh) {
      const at = Number(fresh.at || nowTick.value)
      const success = fresh.success !== false
      const decisionKey = `${at}:${fresh.member_label}:${success}`
      activeLabel.value = fresh.member_label
      activeFailed.value = !success
      activeCost.value = Number(fresh.cost_ms || 0)
      activeAt.value = at
      liveOn.value = true
      // API 每两秒返回同一条快照，只在决策 key 变化时重播，避免小鸟原地循环
      if (decisionKey !== lastFlightKey.value) {
        lastFlightKey.value = decisionKey
        flightDecision.value = {
          key: decisionKey,
          memberLabel: fresh.member_label,
          success,
        }
      }
    } else if (nowTick.value - activeAt.value > ACTIVE_WINDOW) {
      // 超过窗口没有新决策：回到待命，不把旧的一次请求当成正在处理
      liveOn.value = false
      activeLabel.value = null
      activeFailed.value = false
      activeCost.value = 0
      flightDecision.value = null
      lastFlightKey.value = ''
    }
  } catch {
    // 接口不可用（后端旧版本）时保持待命
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null
let configTimer: ReturnType<typeof setInterval> | null = null

const start = () => {
  loadConfig()
  pollLive()
  pollTimer = setInterval(pollLive, 2000)
  // 配置（成员/策略）在下方面板里改动后，视图需要跟上
  configTimer = setInterval(loadConfig, 8000)
}

const stop = () => {
  if (pollTimer) clearInterval(pollTimer)
  if (configTimer) clearInterval(configTimer)
  pollTimer = null
  configTimer = null
}

watch(
  () => props.providerId,
  () => {
    activeLabel.value = null
    activeFailed.value = false
    flightDecision.value = null
    lastFlightKey.value = ''
    members.value = []
    loadConfig()
    pollLive()
  },
)

onMounted(start)
onUnmounted(stop)
</script>

<style scoped>
.rglive {
  margin-bottom: 18px;
  padding: 14px 16px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}
.rglive-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.rglive-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.rglive-desc {
  margin-top: 4px;
  max-width: 640px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.rglive-head-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rglive-count {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 9px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}
.rglive-live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.rglive-live.on {
  color: var(--el-color-warning);
}
.rglive-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 0 var(--el-color-warning);
}
.rglive-live.on .rglive-dot {
  animation: rglive-blink 1.6s ease-in-out infinite;
}
@keyframes rglive-blink {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}

.rglive-empty {
  padding: 22px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}

.rglive-canvas {
  position: relative;
  width: 100%;
}
.rglive-links {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.rglive-link {
  fill: none;
  stroke: var(--el-border-color);
  stroke-width: 1;
  opacity: 0.8;
}
.rglive-flow {
  fill: none;
  stroke: var(--el-color-warning);
  stroke-width: 1.6;
  stroke-dasharray: 5 12;
  opacity: 0.22;
  animation: rglive-dash 1.6s linear infinite;
}
.rglive-flow.active {
  opacity: 1;
  stroke-width: 2.2;
  animation-duration: 0.65s;
}
@keyframes rglive-dash {
  to { stroke-dashoffset: -17; }
}

/* 请求决策沿对应分支飞行一次；不做定时假轮播，只有后端快照变化才重播。 */
.rglive-bird-flight {
  pointer-events: none;
  animation: rglive-bird-arrive 1.3s ease-out both;
}
.rglive-bird-flight.failed {
  animation-duration: 1.15s;
}
.rglive-bird {
  overflow: visible;
}
.rglive-bird-body {
  fill: #30343b;
  stroke: #202329;
  stroke-width: .8;
  stroke-linejoin: round;
}
.rglive-bird-belly {
  fill: #f7f8fa;
  stroke: #d7dbe0;
  stroke-width: .45;
  stroke-linejoin: round;
}
.rglive-bird-wing {
  fill: #515761;
  stroke: #202329;
  stroke-width: .7;
  stroke-linejoin: round;
  transform-box: fill-box;
  transform-origin: 60% 100%;
  animation: rglive-bird-flap .18s ease-in-out infinite alternate;
}
.rglive-bird-eye { fill: #fff; }
.rglive-bird-tail {
  fill: none;
  stroke: #202329;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.rglive-bird-flight.failed .rglive-bird-body { fill: #8c3a3a; stroke: #6b2020; }
.rglive-bird-flight.failed .rglive-bird-wing { fill: #bd5a50; stroke: #6b2020; }
@keyframes rglive-bird-flap {
  from { transform: rotate(-15deg) scaleY(.78); }
  to { transform: rotate(17deg) scaleY(1.05); }
}
@keyframes rglive-bird-arrive {
  0% { opacity: 0; }
  8% { opacity: 1; }
  76% { opacity: 1; }
  100% { opacity: 0; }
}

.rglive-group {
  position: absolute;
  left: 0;
  width: 22%;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-bg-color);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}
.rglive-group.busy {
  border-color: var(--el-color-warning);
  box-shadow: 0 0 0 3px var(--el-color-warning-light-9);
}
.rglive-group-logo {
  color: var(--el-text-color-primary);
}
.rglive-group-name {
  max-width: 100%;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rglive-group-strategy {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 9px;
  background: var(--el-text-color-primary);
  color: var(--el-bg-color);
}

.rglive-member {
  position: absolute;
  left: 38%;
  right: 0;
  height: 50px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 9px;
  background: var(--el-bg-color);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}
.rglive-member.active {
  border-color: var(--el-color-warning);
  box-shadow: 0 0 0 2px var(--el-color-warning-light-9);
}
.rglive-member.failed {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 2px var(--el-color-danger-light-9);
}
.rglive-avatar {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
}
.rglive-info {
  flex: 1;
  min-width: 0;
}
.rglive-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rglive-meta {
  margin-top: 2px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rglive-tag {
  flex: none;
  font-size: 10px;
  padding: 0 5px;
  border-radius: 8px;
  line-height: 15px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}
.rglive-tag.free {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}
.rglive-tag.warn {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}
.rglive-state {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.rglive-state.active {
  color: var(--el-color-warning);
}
.rglive-state.failed {
  color: var(--el-color-danger);
}
.rglive-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: rglive-pulse 1.1s ease-in-out infinite;
}
@keyframes rglive-pulse {
  0%, 100% { transform: scale(0.7); opacity: 0.45; }
  50% { transform: scale(1.15); opacity: 1; }
}

@media (max-width: 640px) {
  .rglive-group { width: 34%; min-width: 96px; }
  .rglive-member { left: 40%; }
}

@media (prefers-reduced-motion: reduce) {
  .rglive-flow,
  .rglive-pulse,
  .rglive-live.on .rglive-dot,
  .rglive-bird-flight {
    animation: none;
  }
  .rglive-bird-flight { display: none; }
}
</style>

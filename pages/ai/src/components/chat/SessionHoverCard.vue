<!--
  侧栏会话悬停卡（用户口径 2026-11-14）：鼠标停在「任务列表」里的会话行上，
  浮出该会话的上下文构成 treemap + 关键用量信息。

  <p>数据按需拉取：第一次悬停才请求 {@code GET /v2/sessions/{id}/token-stats}，
  同一会话 30 秒内复用，避免列表滑动时把接口打爆。切会话立即作废。</p>

  <p>只读展示，不改变会话状态；点行本身仍然是打开会话。</p>
-->
<template>
  <CustomPopover :show="visible" :anchor-el="anchorEl" :width="304" placement="right" :offset="8" :max-height="440"
    popper-class="shc-popover" @mouseenter="onCardEnter" @mouseleave="onCardLeave">
    <div class="shc">
      <div class="shc__title" :title="session?.title || ''">{{ session?.title || '' }}</div>

      <div v-if="loading" class="shc__state">读取上下文统计…</div>
      <div v-else-if="error" class="shc__state">上下文统计读取失败</div>
      <template v-else>
        <ContextTreemapMini :items="treemapItems" :width="272" :height="80" />

        <div class="shc__legend">
          <span v-for="item in legendItems" :key="item.key" class="shc__legend-item">
            <i class="shc__dot" :style="{ background: item.color }" aria-hidden="true"></i>
            {{ item.label }} {{ formatTokens(item.tokens) }}
          </span>
        </div>

        <div class="shc__rows">
          <div class="shc__row">
            <span class="shc__label">模型</span>
            <span class="shc__value" :title="modelName">{{ modelName }}</span>
          </div>
          <div class="shc__row">
            <span class="shc__label">上下文</span>
            <span class="shc__value">
              {{ formatTokens(usedTokens) }}<template v-if="contextWindow > 0"> / {{ formatTokens(contextWindow) }}（{{ percentText }}）</template>
              <template v-else>（窗口未登记）</template>
            </span>
          </div>
          <div class="shc__row">
            <span class="shc__label">累计 Token</span>
            <span class="shc__value">{{ formatTokens(accumulatedTokens) }}</span>
          </div>
          <div class="shc__row">
            <span class="shc__label">创建于</span>
            <span class="shc__value">{{ createdText }}</span>
          </div>
          <div class="shc__row">
            <span class="shc__label">最近活跃</span>
            <span class="shc__value">{{ lastActiveText }}</span>
          </div>
        </div>
      </template>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CustomPopover from '../ui/CustomPopover.vue'
import ContextTreemapMini from './ContextTreemapMini.vue'
import { apiService } from '@/services/ApiService'

/** 上下文分类的元信息：与「执行轨迹 → 上下文窗口」同一套键与配色 */
const BREAKDOWN_META = [
  { key: 'systemPrompt', label: '系统提示词', color: 'var(--el-color-primary)' },
  { key: 'tools', label: '工具定义', color: 'var(--el-color-danger)' },
  { key: 'summary', label: '摘要', color: 'var(--el-color-info)' },
  { key: 'userPrompt', label: '用户输入', color: 'var(--el-color-success)' },
  { key: 'history', label: '对话消息', color: 'var(--el-color-warning)' },
] as const

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  session: {
    id: string | number
    title?: string
    modelId?: string
    createdAt?: string
    lastActiveAt?: string
    updatedAt?: string
  } | null
}>()

const emit = defineEmits<{
  'card-enter': []
  'card-leave': []
}>()

const loading = ref(false)
const error = ref(false)
const stats = ref<any>(null)
// 会话详情只用来取 modelId：列表接口不下发它，token-stats 也不带模型名，
// 不补这一下卡片里的「模型」永远是「—」。
const detail = ref<any>(null)
let loadedFor: string | null = null
let loadedAt = 0

const sessionId = computed(() => (props.session ? String(props.session.id) : ''))

async function ensureLoaded(): Promise<void> {
  const sid = sessionId.value
  if (!sid) return
  // 同一会话 30 秒内复用；否则每次悬停都打一次接口
  if (loadedFor === sid && Date.now() - loadedAt < 30_000) return
  loading.value = true
  error.value = false
  try {
    const [statRes, detailRes] = await Promise.all([
      apiService.fetchSessionTokenStats(sid),
      // 详情失败不影响统计展示：模型一栏退化为「—」
      apiService.fetchSession(sid).catch(() => null),
    ])
    stats.value = statRes ?? null
    detail.value = detailRes ?? null
    loadedFor = sid
    loadedAt = Date.now()
  } catch (e) {
    console.warn('[SessionHoverCard] 读取上下文统计失败', e)
    error.value = true
    stats.value = null
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (visible) => {
  if (visible) void ensureLoaded()
})
watch(sessionId, () => {
  loadedFor = null
  stats.value = null
  detail.value = null
  error.value = false
})

const breakdown = computed<Record<string, number>>(() => {
  const raw = (stats.value?.breakdown || {}) as Record<string, number>
  const out: Record<string, number> = {}
  for (const meta of BREAKDOWN_META) out[meta.key] = Number(raw[meta.key]) || 0
  return out
})

const treemapItems = computed(() =>
  BREAKDOWN_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    color: meta.color,
    tokens: breakdown.value[meta.key] || 0,
  })),
)

const legendItems = computed(() => treemapItems.value.filter((item) => item.tokens > 0))

const usedTokens = computed(() => Number(stats.value?.usedTokens) || 0)
const contextWindow = computed(() => Number(stats.value?.effectiveContextWindow) || 0)
const accumulatedTokens = computed(() => {
  const prompt = Number(stats.value?.promptTokens) || 0
  const completion = Number(stats.value?.completionTokens) || 0
  const sum = prompt + completion
  return sum > 0 ? sum : Number(stats.value?.totalTokens) || 0
})

const percentText = computed(() =>
  contextWindow.value > 0 ? `${Math.round((usedTokens.value / contextWindow.value) * 100)}%` : '',
)

/** 模型名：stats → 会话详情 modelId → 行数据 modelId，逐级兜底 */
const modelName = computed(() => {
  const fromStats = String(stats.value?.modelName || '').trim()
  if (fromStats) return fromStats
  const raw = String(detail.value?.modelId || props.session?.modelId || '').trim()
  if (!raw) return '—'
  // modelId 可能是「供应商标识:模型名」，卡片只显示模型名
  const sep = raw.indexOf(':')
  return sep >= 0 ? raw.slice(sep + 1) : raw
})

/** 创建时间：详情给的是秒级时间戳，列表接口给的是「YYYY-MM-DD HH:mm:ss」 */
const createdText = computed(() => {
  const raw = String(detail.value?.createdAt || props.session?.createdAt || '').trim()
  if (!raw) return '—'
  let time: number
  if (/^\d+$/.test(raw)) {
    // 10 位按秒、13 位按毫秒
    time = raw.length <= 10 ? Number(raw) * 1000 : Number(raw)
  } else {
    time = new Date(raw.replace(' ', 'T')).getTime()
  }
  if (!Number.isFinite(time) || time <= 0) return raw.slice(0, 10)
  const d = new Date(time)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})

const lastActiveText = computed(() => {
  const raw = props.session?.lastActiveAt || props.session?.updatedAt || ''
  const time = Date.parse(String(raw).replace(' ', 'T'))
  if (!Number.isFinite(time)) return '—'
  const diff = Date.now() - time
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`
  const d = new Date(time)
  return `${d.getMonth() + 1}/${d.getDate()}`
})

function formatTokens(value: number): string {
  const n = Number(value) || 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(Math.round(n))
}

const onCardEnter = () => emit('card-enter')
const onCardLeave = () => emit('card-leave')
</script>

<style scoped>
.shc {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 4px 6px 6px;
}

.shc__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shc__state {
  padding: 10px 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.shc__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.shc__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.shc__dot {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  flex-shrink: 0;
}

.shc__rows {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 6px;
}

.shc__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
}

.shc__label {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.shc__value {
  color: var(--el-text-color-primary);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

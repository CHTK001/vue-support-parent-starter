<template>
  <!--
    吸底条（模型管理 07 版式）：整块常驻在模型区底部，一行放完「汇总 + 每个 Key」。
    多 Key 详情卡在页面里滚走时余额就看不见了，所以这里不再是一张卡，
    而是贴住右栏底边的一条状态栏 —— 滚多少模型它都在。
  -->
  <section v-if="compact" class="pc-bar" :class="{ 'is-loading': loading }">
    <div class="pc-bar__main">
      <span class="pc-bar__title">余额与用量</span>
      <span v-if="kindLabel" class="pc-kind">{{ kindLabel }}</span>
      <span v-if="rows.length" class="pc-scope">{{ rows.length }} 个 Key</span>

      <span
        v-for="t in totals"
        :key="t.currency || 'unknown'"
        class="pc-bar__total"
        :title="t.title"
      >
        <span class="pc-bar__label">总余额</span>
        <span class="pc-bar__value">{{ t.text }}</span>
        <span
          v-if="t.percent !== null"
          class="pc-bar__bar"
          role="progressbar"
          :aria-valuenow="t.percent"
          aria-valuemin="0"
          aria-valuemax="100"
        ><i :style="{ width: t.percent + '%' }" /></span>
        <span v-if="t.percent !== null" class="pc-bar__pct">{{ t.percent }}%</span>
        <span v-if="t.counted > 1" class="pc-bar__scope">{{ t.counted }} 个 Key 合计</span>
      </span>

      <!-- 每个 Key 一枚小胶囊：够看清「哪个 Key 快见底」，明细仍在 detail 形态里 -->
      <span
        v-for="row in rowsView"
        :key="row.index"
        class="pc-bar__key"
        :class="{ 'is-low': row.ok && row.percent !== null && row.percent <= 20, 'is-bad': !row.ok }"
        :title="row.ok
          ? `${row.mask}：剩余 ${money(row.remain)}，已用 ${money(row.used)}，总量 ${money(row.total)}${row.currency ? ' ' + row.currency : ''}`
          : `${row.mask}：${row.error || '未查到读数'}`"
      >
        <span class="pc-bar__mask">{{ row.mask }}</span>
        <b v-if="row.ok && row.percent !== null">{{ row.percent }}%</b>
        <b v-else>—</b>
      </span>

      <span v-if="error" class="pc-bar__err" :title="error">{{ error }}</span>
      <span v-else-if="!rows.length" class="pc-bar__err">
        {{ loading ? '正在查询余额…' : '没有可查的 Key' }}
      </span>

      <button class="pc-reload pc-bar__reload" type="button" :disabled="loading" @click="load">
        {{ loading ? '查询中…' : '刷新' }}
      </button>
    </div>
  </section>

  <section v-else class="pc" :class="{ 'is-pinned': pinned, 'is-loading': loading }">
    <header class="pc-head">
      <div class="pc-head-main">
        <span class="pc-title">余额与用量</span>
        <!-- 口径写在屏上：这里是「N 个 Key 汇总」，卡片是「单个 Key」，两个数字本来就不会相等 -->
        <span v-if="kindLabel" class="pc-kind">{{ kindLabel }}</span>
        <span v-if="rows.length" class="pc-scope">{{ rows.length }} 个 Key</span>
      </div>
      <button class="pc-reload" type="button" :disabled="loading" @click="load">
        {{ loading ? '查询中…' : '刷新' }}
      </button>
    </header>

    <!--
      顶部汇总：剩余 / 总量 + 64×5 进度条 + 百分比。
      没有总量（上游只给余额）时退化成数字，不画 0% 的条。
    -->
    <div v-if="totals.length" class="pc-total">
      <div v-for="t in totals" :key="t.currency || 'unknown'" class="pc-total__item" :title="t.title">
        <span class="pc-total__label">总余额</span>
        <span class="pc-total__value">{{ t.text }}</span>
        <span
          v-if="t.percent !== null"
          class="pc-total__bar"
          role="progressbar"
          :aria-valuenow="t.percent"
          aria-valuemin="0"
          aria-valuemax="100"
        ><i :style="{ width: t.percent + '%' }" /></span>
        <span v-if="t.percent !== null" class="pc-total__pct">{{ t.percent }}%</span>
        <span v-if="t.counted > 1" class="pc-total__scope">{{ t.counted }} 个 Key 合计</span>
      </div>
    </div>

    <p v-if="error" class="pc-error">{{ error }}</p>

    <div v-if="!rows.length" class="pc-empty">
      {{ loading ? '正在查询余额…' : (error ? '这次没查到读数' : '没有可查的 Key。') }}
    </div>

    <!-- 一行两个 Key（容器窄于 860px 时自动退回一列，和渠道管理页同口径） -->
    <div v-else class="pc-list">
      <article
        v-for="row in rowsView"
        :key="row.index"
        class="pc-card"
        :class="{ 'is-bad': !row.ok }"
      >
        <div class="pc-card__top">
          <span class="pc-card__mask" :title="row.mask">{{ row.mask }}</span>
          <span v-if="row.source" class="pc-card__src">{{ sourceLabel(row.source) }}</span>
          <span
            v-if="row.ok && row.percent !== null"
            class="pc-card__pct"
            :class="{ 'is-low': row.percent <= 20 }"
          >剩余 {{ row.percent }}%</span>
        </div>

        <template v-if="row.ok">
          <div class="pc-card__nums">
            <span class="pc-card__value">{{ money(row.remain) }}</span>
            <span class="pc-card__of">/ {{ money(row.total) }} {{ row.currency || '' }}</span>
          </div>
          <span v-if="row.percent !== null" class="pc-card__bar">
            <i :style="{ width: row.percent + '%' }" />
          </span>
          <div class="pc-card__meta">
            <span>已用 {{ money(row.used) }} {{ row.currency || '' }}</span>
            <span v-if="(row.parts?.length ?? 0) > 2">另 {{ (row.parts?.length ?? 0) - 2 }} 项读数</span>
          </div>
        </template>

        <p v-else class="pc-card__error" :title="row.error">{{ row.error }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 提供商「余额与用量」面板。
 *
 * <p>数据来自 {@code GET /api/providers/{id}/credit}：后端把这家供应商的每个 Key
 * 各查一次（复用渠道管理页的余额 SPI），本组件只负责排版，不再关心任何厂商口径。</p>
 *
 * <p>两种形态：{@code compact=false} 是详情卡（顶部汇总 pill：剩余 / 总量 + 64×5 条 +
 * 百分比，下面每个 Key 一张卡，≤20% 红徽章，容器宽于 860px 并两列）；
 * {@code compact=true} 是模型管理 07 版式的吸底条——宿主把它贴在右栏底边，
 * 一行放「汇总 + 每个 Key 的占比胶囊」，滚多少模型都看得见余额。</p>
 *
 * <p>不轮询：余额接口会逐个 Key 出网，只在打开供应商或点「刷新」时查一次。</p>
 */
import { computed, onMounted, ref, watch } from 'vue'
import { adminApi } from '@/framework/context'

const props = withDefaults(
  defineProps<{
    providerId?: string
    /**
     * 吸底条形态（模型管理 07 版式）。
     *
     * <p>false = 详情卡（汇总 pill + 每 Key 一张卡，吸在滚动区底部）；
     * true = 一行状态栏，由宿主贴在自己右栏底边，滚模型列表时始终可见。</p>
     */
    compact?: boolean
  }>(),
  { providerId: '', compact: false },
)

/** 单条 Key 读数（后端 creditOfKey 的行结构） */
interface CreditRow {
  index: number
  mask: string
  ok: boolean
  source?: string
  remain?: number | string | null
  used?: number | string | null
  total?: number | string | null
  currency?: string | null
  parts?: Array<{ label?: string; amount?: number | string | null; currency?: string | null }>
  error?: string
}

const rows = ref<CreditRow[]>([])
const loading = ref(false)
const error = ref('')
const meta = ref<{
  kind?: string
  currency?: string | null
  total?: { remain?: number; used?: number; total?: number } | null
  ok?: boolean
  message?: string
  keys?: CreditRow[]
}>({})

/** 查询方式的中文名（auto 时后端会回落，页面只显示「自动识别」） */
const KIND_LABELS: Record<string, string> = {
  auto: '自动识别',
  'new-api': 'new-api 中转站',
  sub2api: 'sub2api 中转站',
  openai: 'OpenAI 官方',
  host: '厂商官方',
  expression: '自定义口径',
}

/** 读数来源的短标签（卡片右上角） */
const SOURCE_LABELS: Record<string, string> = {
  host: '厂商官方',
  'new-api': 'new-api',
  sub2api: 'sub2api',
  openai: 'OpenAI',
  expression: '自定义',
}

const kindLabel = computed(() => KIND_LABELS[String(meta.value.kind || '')] || '')
const pinned = computed(() => rows.value.length > 1)

/** 金额：不写千分位、不带货币符号，货币用码单独显示（与渠道管理页一致） */
const money = (value: unknown) => {
  const n = Number(value)
  if (value === null || value === undefined || !Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  const digits = abs >= 100 ? 0 : abs >= 1 ? 2 : 4
  return n.toFixed(digits)
}

const sourceLabel = (source: string) => SOURCE_LABELS[source] || source

/** 剩余占比：没有总量（或总量为 0）时返回 null，不画 0% 的条 */
const percentOf = (remain: unknown, total: unknown): number | null => {
  const r = Number(remain)
  const t = Number(total)
  if (!Number.isFinite(r) || !Number.isFinite(t) || t <= 0) return null
  return Math.max(0, Math.min(100, Math.round((r / t) * 100)))
}

/** 每行的占比（渲染时算一次，模板里反复用） */
const rowsView = computed(() => rows.value.map((row) => {
  if (!row.ok) return { ...row, percent: null }
  const total = row.total ?? row.remain
  return {
    ...row,
    total,
    percent: percentOf(row.remain, total),
    parts: row.parts || [],
  }
}))

/**
 * 顶部汇总。
 *
 * <p>优先用后端的 total（它只累加同币种的行）；后端没给时按当前行自己加一遍，
 * 避免「有卡片没汇总」。</p>
 */
const totals = computed(() => {
  const okRows = rows.value.filter((row) => row.ok)
  if (!okRows.length) return []
  const backend = meta.value.total
  const currency = String(meta.value.currency || okRows[0]?.currency || '')
  let remain = Number(backend?.remain)
  let used = Number(backend?.used)
  let total = Number(backend?.total)
  if (!Number.isFinite(remain) || !Number.isFinite(total)) {
    remain = 0
    used = 0
    total = 0
    for (const row of okRows) {
      const r = Number(row.remain)
      const u = Number(row.used)
      if (!Number.isFinite(r)) continue
      remain += r
      if (Number.isFinite(u)) {
        used += u
        total += r + u
      } else {
        total += r
      }
    }
  }
  const text = `${money(remain)} / ${money(total)}${currency ? ' ' + currency : ''}`
  return [{
    currency,
    text,
    percent: percentOf(remain, total),
    counted: okRows.length,
    title: `剩余 ${money(remain)}，总量 ${money(total)}${currency ? ' ' + currency : ''}`
      + `（${okRows.length} 个 Key 合计，已用 ${money(used)}）`,
  }]
})

/** 拉一次余额（失败不抛：错误写进 error，面板保持可见） */
const load = async () => {
  const providerId = String(props.providerId || '').trim()
  if (!providerId || loading.value) return
  loading.value = true
  error.value = ''
  try {
    const res: any = await adminApi.get(`/api/providers/${encodeURIComponent(providerId)}/credit`)
    const data = res?.data ?? res
    meta.value = data && typeof data === 'object' ? data : {}
    rows.value = Array.isArray(meta.value.keys) ? (meta.value.keys as CreditRow[]) : []
    if (meta.value.message) error.value = String(meta.value.message)
  } catch (e: any) {
    rows.value = []
    meta.value = {}
    error.value = e?.response?.data?.message || e?.message || '余额接口不可用'
  } finally {
    loading.value = false
  }
}

watch(() => props.providerId, () => {
  rows.value = []
  meta.value = {}
  error.value = ''
  load()
})

onMounted(load)
</script>

<style scoped>
/* ===== 吸底条（07 版式）=====
   贴住宿主右栏底边：只有上边一条发丝线，不描边、不圆角，
   避免在页面里看起来像一个「飘着的卡片」。 */
.pc-bar {
  flex-shrink: 0;
  padding: 7px 16px;
  border-top: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  background: color-mix(in srgb, var(--el-bg-color) 94%, transparent);
  backdrop-filter: blur(8px);
}
.pc-bar__main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}
.pc-bar__title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
.pc-bar__total {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  background: var(--bg-elevated, var(--el-fill-color-lighter));
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.pc-bar__label { color: var(--text-tertiary, var(--el-text-color-placeholder)); }
.pc-bar__value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}
.pc-bar__bar {
  position: relative;
  width: 52px;
  height: 5px;
  border-radius: 3px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.pc-bar__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-primary);
  transition: width 0.25s ease;
}
.pc-bar__pct {
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
}
.pc-bar__scope {
  font-size: 10.5px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  padding-left: 6px;
  border-left: 1px solid var(--border-subtle, var(--el-border-color-lighter));
}
.pc-bar__key {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  cursor: help;
}
.pc-bar__key b {
  font-weight: 700;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}
.pc-bar__key.is-low {
  border-color: color-mix(in srgb, var(--el-color-danger) 35%, var(--el-border-color-lighter));
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
}
.pc-bar__key.is-low b { color: var(--el-color-danger); }
.pc-bar__key.is-bad { opacity: 0.7; }
.pc-bar__mask {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 10.5px;
}
.pc-bar__err {
  font-size: 11px;
  color: var(--el-color-danger);
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pc-bar__reload { margin-left: auto; }

.pc {
  /*
   * 区块自己当容器：两列与否只看本块宽度，不看窗口宽度（详情的左栏可能很窄）。
   */
  container-type: inline-size;
  margin: 14px 0 4px auto;
  max-width: 980px;
  padding: 12px 14px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: 10px;
  background: var(--bg-elevated, var(--el-bg-color));
}
/* 多个 Key：整块吸在底部，滚模型列表时余额一直在视野里 */
.pc.is-pinned {
  position: sticky;
  bottom: 8px;
  z-index: 3;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(6px);
}
.pc-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pc-head-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.pc-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.pc-kind,
.pc-scope {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  white-space: nowrap;
}
.pc-kind {
  border: 1px dashed var(--el-border-color);
  background: transparent;
}
.pc-reload {
  margin-left: auto;
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.pc-reload:hover:not(:disabled) {
  color: var(--el-color-primary);
}
.pc-reload:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* 顶部汇总 pill：剩余 / 总量 + 64×5 条 + 百分比 */
.pc-total {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.pc-total__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  background: var(--bg-elevated, var(--el-fill-color-lighter));
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.pc-total__label {
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}
.pc-total__value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}
.pc-total__bar {
  position: relative;
  width: 64px;
  height: 5px;
  border-radius: 3px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.pc-total__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-primary);
  transition: width 0.25s ease;
}
.pc-total__pct {
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
}
.pc-total__scope {
  font-size: 11px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  padding-left: 6px;
  border-left: 1px solid var(--border-subtle, var(--el-border-color-lighter));
}

.pc-empty {
  margin-top: 10px;
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: 8px;
}
.pc-error {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-color-danger);
  word-break: break-all;
}

/* 每个 Key 一张卡：一行两列（容器够宽时） */
.pc-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  margin-top: 10px;
}
@container (min-width: 860px) {
  .pc-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.pc-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  background: var(--el-bg-color);
  min-width: 0;
}
.pc-card.is-bad {
  background: var(--el-bg-color);
}
.pc-card__top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.pc-card__mask {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-card__src {
  padding: 0 6px;
  border: 1px dashed var(--el-border-color);
  border-radius: 999px;
  font-size: 10px;
  line-height: 16px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  white-space: nowrap;
}
.pc-card__pct {
  margin-left: auto;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  white-space: nowrap;
}
/* 只剩两成以下才变红：正常余额不该一直报警 */
.pc-card__pct.is-low {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}
.pc-card__nums {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.pc-card__value {
  font-size: 19px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}
.pc-card__of {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-card__bar {
  position: relative;
  display: block;
  height: 6px;
  border-radius: 3px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.pc-card__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-primary);
  transition: width 0.25s ease;
}
.pc-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.pc-card__error {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-color-danger);
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .pc-total__bar i,
  .pc-bar__bar i,
  .pc-card__bar i { transition: none; }
}
</style>

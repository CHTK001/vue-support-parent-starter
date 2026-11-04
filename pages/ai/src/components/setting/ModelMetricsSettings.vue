<template>
  <div class="model-metrics">
    <!-- 推送配置 -->
    <SettingsCard title="推送配置">
      <template #actions>
        <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
      </template>
      <SettingsRow label="模型指标推送" description="开启后定时全量采集模型价格、速度、延迟等指标">
        <el-switch v-model="form.enabled" />
      </SettingsRow>
      <SettingsRow label="采集间隔" description="每次采集全量同步指标库（最小 30 秒）" control-width="200">
        <el-select v-model="form.intervalSec">
          <el-option label="30 秒" :value="30" />
          <el-option label="1 分钟" :value="60" />
          <el-option label="5 分钟" :value="300" />
          <el-option label="10 分钟" :value="600" />
          <el-option label="30 分钟" :value="1800" />
          <el-option label="1 小时" :value="3600" />
          <el-option label="6 小时" :value="21600" />
        </el-select>
      </SettingsRow>
      <SettingsRow label="手动操作" description="立即拉取全量指标，或仅同步官方定价">
        <div class="flex gap-2">
          <el-button type="primary" :loading="refreshing" @click="manualRefresh">全量同步指标</el-button>
          <el-button :loading="syncing" @click="manualSyncPricing">同步官方定价</el-button>
        </div>
      </SettingsRow>
    </SettingsCard>

    <!-- 指标图表 -->
    <SettingsCard
      title="指标图表"
      subtitle="按任意单项指标对全量模型排行（价格、智能指数、人类评测等），并以「智能指数 × 输出价」看性价比象限。图表取指标库全量快照，与下方分页表同一份数据。"
    >
      <template #actions>
        <div class="chart-actions">
          <el-select v-model="chartMetric" class="chart-metric" filterable placeholder="选择指标">
            <el-option-group v-for="g in chartMetricGroups" :key="g.label" :label="g.label">
              <el-option v-for="m in g.items" :key="m.snake" :label="m.label" :value="m.snake" />
            </el-option-group>
          </el-select>
          <el-select v-model="chartTopN" class="chart-num">
            <el-option v-for="n in chartTopNOptions" :key="n" :label="'Top ' + n" :value="n" />
          </el-select>
          <el-select v-model="chartOrder" class="chart-order">
            <el-option label="高 → 低" value="desc" />
            <el-option label="低 → 高" value="asc" />
          </el-select>
        </div>
      </template>

      <div v-loading="chartLoading" class="chart-grid">
        <section class="chart-box">
          <header class="chart-box__head">
            <span class="chart-box__title">{{ chartMetricLabel }} · 模型排行</span>
            <span class="chart-box__sub">{{ rankPool.length }} 个模型有该指标，展示前 {{ rankModels.length }} 个</span>
          </header>
          <ReEcharts :option="rankOption" height="420px" not-merge />
        </section>

        <section class="chart-box">
          <header class="chart-box__head">
            <span class="chart-box__title">性价比象限 · 智能指数 × 输出价</span>
            <span class="chart-box__sub">纵轴为对数刻度，越靠左上越划算</span>
          </header>
          <ReEcharts :option="scatterOption" height="420px" not-merge />
        </section>
      </div>
    </SettingsCard>

    <!-- 能力 × 成本 四象限（复用同一份指标库全量快照） -->
    <SettingsCard
      title="能力 × 成本 四象限"
      subtitle="横轴单项任务成本、纵轴 Artificial Analysis 智能指数。帕累托前沿上的模型是「没有更便宜且更强的替代」；严格替代区内的模型可被同象限前沿模型完全取代。绿色区=比参照模型便宜但更弱，橙色区=更贵但更强。"
    >
      <template #actions>
        <div class="chart-actions">
          <el-checkbox v-model="quadShowAllLabels">显示全部名称</el-checkbox>
          <el-checkbox v-model="quadLogCost">对数成本</el-checkbox>
        </div>
      </template>

      <div v-loading="chartLoading" class="quad-wrap">
        <ReEcharts :option="quadrantOption" height="560px" not-merge />
        <p v-if="quadPoints.length === 0 && !chartLoading" class="quad-empty">
          指标库中暂无同时具备「智能指数」与「任务成本」的模型
        </p>
      </div>
    </SettingsCard>

    <!-- 模型指标库 -->
    <SettingsCard
      title="模型指标库"
      subtitle="数据源 Artificial Analysis 的全量模型指标，与本地配置模型无关。点击锁形图标可手动改值并锁定，锁定字段同步不再覆盖；再次点击解锁即恢复指标源值。"
    >
      <template #actions>
        <el-input v-model="keyword" clearable class="metrics-search"
          placeholder="搜索模型 / 厂商" @input="onSearch" @clear="onSearch">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </template>

      <div class="table-scroll">
        <ReTable
          :data="rows"
          :columns="tableColumns"
          :loading="loadingRows"
          engine="element"
          :pagination="false"
          :toolbar="false"
          :settings="{ border: false }"
          :layout-table="{ minHeight: 0 }"
          row-key="key"
          empty-text="暂无模型指标数据"
          style="width: 100%"
        >
          <template #col-model="{ row }">
            <div class="model-cell">
              <img v-if="row.icon" :src="row.icon" class="model-icon" alt=""
                @error="onImgError" />
              <span v-else class="model-icon model-icon--ph">
                {{ (row.modelName || '?').charAt(0).toUpperCase() }}
              </span>
              <div class="model-meta">
                <div class="model-name">{{ row.modelName }}</div>
                <div class="model-provider">{{ row.sub }}</div>
              </div>
            </div>
          </template>
          <template
            v-for="col in columns"
            :key="col.snake"
            #[`col-metric-${col.snake}`]="{ row }"
          >
            <div class="metric-cell" :class="{ 'is-locked': isLocked(row, col.snake) }">
              <el-input v-if="isLocked(row, col.snake)" v-model.number="row.values[col.snake]"
                type="number" class="metric-input" @input="markDirty(row)" />
              <span v-else class="metric-val">{{ fmtVal(row, col) }}</span>
              <button type="button" class="lock-btn" :class="{ 'is-on': isLocked(row, col.snake) }"
                :title="isLocked(row, col.snake) ? '已锁定，点击解锁恢复指标源值' : '手动改值并锁定（同步不再覆盖）'"
                @click="toggleLock(row, col)">
                <svg v-if="isLocked(row, col.snake)" viewBox="0 0 24 24" fill="currentColor">
                  <path fill-rule="evenodd" clip-rule="evenodd"
                    d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5z" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M8 10.5V6.75a4 4 0 1 1 8 0M5.25 10.5h10.5a2.25 2.25 0 0 1 2.25 2.25v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18.75v-6a2.25 2.25 0 0 1 2.25-2.25z" />
                </svg>
              </button>
            </div>
          </template>
          <!-- 操作列统一 ReButton square（纯图标 + tooltip）：
               未改动时两个按钮都禁用，避免误点保存空改动 -->
          <template #col-actions="{ row }">
            <div class="op-cell row-actions">
              <ReButton layout="square" type="primary" :icon="Select" tip="保存本行"
                :disabled="!row.dirty" :loading="row.saving" @click="saveRow(row)" />
              <ReButton layout="square" type="default" :icon="RefreshLeft" tip="还原本行"
                :disabled="!row.dirty" @click="discardRow(row)" />
            </div>
          </template>
        </ReTable>
      </div>

      <template #footer>
        <div class="metrics-foot">
          <el-pagination background small :current-page="page" :page-size="size"
            :page-sizes="[10, 20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next"
            @current-change="onPageChange" @size-change="onSizeChange" />
        </div>
      </template>
    </SettingsCard>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed, onMounted } from 'vue'

import ReEcharts from '@repo/ui/re-echarts'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import type { EChartsOption } from 'echarts'

import { Search, Select, RefreshLeft } from '@element-plus/icons-vue'

import { modelMetricsApi } from '@/services/javaApi'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'
import ReButton from '@repo/ui/re-button'

/** tooltip 里要拼 HTML，模型名/厂商来自指标源，先转义避免破坏标签结构 */
const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** 模型图标加载失败时隐藏 img，落到占位首字母 */
function onImgError(e: Event) {
  const el = e.target as HTMLElement | null
  if (el) el.style.visibility = 'hidden'
}

const form = ref({
  enabled: true,
  intervalSec: 300,
})

const saving = ref(false)
const refreshing = ref(false)
const syncing = ref(false)

const load = async () => {
  try {
    const res = await modelMetricsApi.getConfig()
    const cfg = res?.data ?? res
    if (cfg && typeof cfg === 'object') {
      form.value.enabled = cfg.enabled ?? true
      form.value.intervalSec = cfg.intervalSec ?? 300
    }
  } catch (e) {
    console.error('加载模型指标配置失败:', e)
  }
}

const save = async () => {
  saving.value = true
  try {
    await modelMetricsApi.updateConfig({
      enabled: form.value.enabled,
      intervalSec: form.value.intervalSec,
    })
    message.success('模型指标配置保存成功')
  } catch (e) {
    console.error('保存模型指标配置失败:', e)
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

const manualRefresh = async () => {
  refreshing.value = true
  try {
    await modelMetricsApi.refresh()
    message.success('全量指标已同步')
    await loadTable()
    await loadChartData()
  } catch (e) {
    console.error('全量同步失败:', e)
    message.error('同步失败')
  } finally {
    refreshing.value = false
  }
}

const manualSyncPricing = async () => {
  syncing.value = true
  try {
    await modelMetricsApi.syncPricing()
    message.success('官方定价已同步')
  } catch (e) {
    console.error('同步定价失败:', e)
    message.error('同步失败')
  } finally {
    syncing.value = false
  }
}

// ==================== 指标库 ====================
interface Column {
  snake: string
  camel: string
  label: string
  unit?: string
}

const columns: Column[] = [
  { snake: 'price_input_per_musd', camel: 'priceInputPerMusd', label: '输入价', unit: '$/M' },
  { snake: 'price_output_per_musd', camel: 'priceOutputPerMusd', label: '输出价', unit: '$/M' },
  { snake: 'price_cache_hit_per_musd', camel: 'priceCacheHitPerMusd', label: '缓存价', unit: '$/M' },
  { snake: 'intelligence_index', camel: 'intelligenceIndex', label: '智能指数' },
  { snake: 'hle_score', camel: 'hleScore', label: 'HLE' },
  { snake: 'omniscience_index', camel: 'omniscienceIndex', label: '全知指数' },
  { snake: 'gpqa_score', camel: 'gpqaScore', label: 'GPQA' },
  { snake: 'aime25_score', camel: 'aime25Score', label: 'AIME25' },
  { snake: 'livecodebench_score', camel: 'livecodebenchScore', label: 'LiveCodeBench' },
  { snake: 'scicode_score', camel: 'scicodeScore', label: 'SciCode' },
  { snake: 'ifbench_score', camel: 'ifbenchScore', label: 'IFBench' },
  { snake: 'critpt_score', camel: 'critptScore', label: 'CritPt' },
  { snake: 'mmmu_pro_score', camel: 'mmmuProScore', label: 'MMMU-Pro' },
  { snake: 'tau2_score', camel: 'tau2Score', label: 'Tau2-Bench' },
  { snake: 'tau_banking_score', camel: 'tauBankingScore', label: 'Tau-Banking' },
  { snake: 'lcr_score', camel: 'lcrScore', label: 'LCR' },
  { snake: 'terminalbench_hard_score', camel: 'terminalbenchHardScore', label: 'TerminalBench-Hard' },
  { snake: 'terminal_bench21_score', camel: 'terminalBench21Score', label: 'TerminalBench-2.1' },
  { snake: 'terminal_bench40_score', camel: 'terminalBench40Score', label: 'TerminalBench-4.0' },
  { snake: 'automation_bench_score', camel: 'automationBenchScore', label: 'AutomationBench' },
  { snake: 'gdpval_normalized_score', camel: 'gdpvalNormalizedScore', label: 'GDPval' },
  { snake: 'briefcase_score', camel: 'briefcaseScore', label: 'Briefcase' },
  { snake: 'harvey_lab_score', camel: 'harveyLabScore', label: 'HarveyLab' },
  { snake: 'apex_agents_score', camel: 'apexAgentsScore', label: 'ApexAgents' },
  { snake: 'itbench_sre_score', camel: 'itbenchSreScore', label: 'ITBench-SRE' },
  { snake: 'omniscience_accuracy', camel: 'omniscienceAccuracy', label: '全知准确率' },
  { snake: 'omniscience_non_hallucination', camel: 'omniscienceNonHallucination', label: '全知非幻觉' },
  { snake: 'elo', camel: 'elo', label: 'Elo' },
  { snake: 'cost_per_task', camel: 'costPerTask', label: '任务成本(USD)' },
  { snake: 'output_speed_tps', camel: 'outputSpeedTps', label: '输出速度', unit: 't/s' },
  { snake: 'latency_first_token_seconds', camel: 'latencyFirstTokenSeconds', label: '首Token', unit: 's' },
  { snake: 'context_window_tokens', camel: 'contextWindowTokens', label: '上下文窗口' },
]

// 每个元素都显式标注 ReTableColumn：否则数组字面量与 map 回调里的
// `align: 'center'` 会被推成宽泛的 string，整组列定义就与 ReTableColumn[]
// 不再兼容（TS 只认字面量窄化成 "left" | "center" | "right"）。
const tableColumns = computed<ReTableColumn[]>(() => [
  {
    prop: 'model',
    label: '模型',
    minWidth: 190,
    slot: 'model',
    className: 'model-col',
  } as ReTableColumn,
  ...columns.map((c): ReTableColumn => ({
    prop: c.snake,
    label: c.unit ? `${c.label} ${c.unit}` : c.label,
    minWidth: 110,
    align: 'center',
    className: 'num-col',
    slot: `metric-${c.snake}`,
  })),
  {
    prop: 'actions',
    label: '操作',
    width: 130,
    align: 'center',
    className: 'op-col',
    slot: 'actions',
  } as ReTableColumn,
])

interface RowState {
  key: string
  icon: string
  modelName: string
  sub: string
  locked: string[]
  values: Record<string, number>
  dirty: boolean
  saving: boolean
  _raw: Record<string, any>
}

const rows = ref<RowState[]>([])
const loadingRows = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)
const keyword = ref('')

const buildRow = (r: Record<string, any>): RowState => {
  const locked: string[] = Array.isArray(r.manualLocked) ? [...r.manualLocked] : []
  const values: Record<string, number> = {}
  columns.forEach((c) => {
    if (locked.includes(c.snake)) {
      const v = r[c.camel]
      values[c.snake] = v == null || v === '' ? 0 : Number(v)
    }
  })
  return {
    key: r.modelKey,
    icon: r.iconUrl || '',
    modelName: r.modelName || r.modelKey,
    sub: r.provider || r.source || '',
    locked,
    values,
    dirty: false,
    saving: false,
    _raw: r,
  }
}

const loadTable = async () => {
  loadingRows.value = true
  try {
    const res = await modelMetricsApi.table({
      page: page.value,
      size: size.value,
      keyword: keyword.value || undefined,
    })
    const data = res?.data ?? res
    total.value = Number(data?.total ?? 0)
    rows.value = Array.isArray(data?.records) ? data.records.map(buildRow) : []
  } catch (e) {
    console.error('加载指标库失败:', e)
    message.error('加载指标库失败')
  } finally {
    loadingRows.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
const onSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadTable()
  }, 300)
}

const onPageChange = (p: number) => {
  page.value = p
  loadTable()
}

const onSizeChange = (s: number) => {
  size.value = s
  page.value = 1
  loadTable()
}

const isLocked = (row: RowState, snake: string) => row.locked.includes(snake)

const toggleLock = (row: RowState, col: Column) => {
  const i = row.locked.indexOf(col.snake)
  if (i >= 0) {
    row.locked.splice(i, 1)
    delete row.values[col.snake]
  } else {
    row.locked.push(col.snake)
    const cur = row._raw[col.camel]
    row.values[col.snake] = cur == null || cur === '' ? 0 : Number(cur)
  }
  row.dirty = true
}

const markDirty = (row: RowState) => {
  row.dirty = true
}

const saveRow = async (row: RowState) => {
  row.saving = true
  try {
    const res = await modelMetricsApi.saveManual({
      key: row.key,
      values: row.values,
      locked: row.locked,
      operator: 'admin',
    })
    const data = res?.data ?? res
    if (data?.row) {
      const fresh = buildRow(data.row)
      const i = rows.value.findIndex((r) => r.key === row.key)
      if (i >= 0) rows.value.splice(i, 1, fresh)
    }
    message.success('已保存，同步将跳过锁定字段')
  } catch (e) {
    console.error('保存手动指标失败:', e)
    message.error('保存失败')
  } finally {
    row.saving = false
  }
}

const discardRow = (row: RowState) => {
  const fresh = buildRow(row._raw)
  const i = rows.value.findIndex((r) => r.key === row.key)
  if (i >= 0) rows.value.splice(i, 1, fresh)
}

/** 指标数值的展示格式：表格、tooltip 与坐标轴共用同一套口径 */
const fmtNum = (snake: string, n: number): string => {
  if (snake === 'context_window_tokens') return n.toLocaleString()
  if (snake === 'elo') return n.toFixed(0)
  if (snake === 'cost_per_task') return '$' + n
  if (snake.endsWith('_score') || snake === 'omniscience_accuracy' || snake === 'omniscience_non_hallucination') return Number((n * 100).toFixed(1)) + '%'
  if (snake === 'omniscience_index') return String(Number(n.toFixed(4)))
  if (snake.startsWith('price')) return '$' + n
  return String(n)
}

/** 坐标轴刻度用的紧凑格式（与 tooltip 的完整格式区分开，避免刻度挤成一团） */
const shortNum = (snake: string, n: number): string => {
  if (snake === 'context_window_tokens') return n >= 10000 ? (n / 10000).toFixed(0) + '万' : String(n)
  if (snake === 'elo') return String(Math.round(n))
  if (snake.startsWith('price') || snake === 'cost_per_task') return '$' + Number(n.toFixed(2))
  if (snake.endsWith('_score') || snake === 'omniscience_accuracy' || snake === 'omniscience_non_hallucination') return Math.round(n * 100) + '%'
  if (snake === 'omniscience_index') return n.toFixed(2)
  return String(Number(n.toFixed(2)))
}

/** 模型名在 Y 轴上截断，避免超长模型名把绘图区挤窄 */
const shortName = (name: string): string => (name.length > 26 ? name.slice(0, 25) + '…' : name)

const fmtVal = (row: RowState, col: Column) => {
  const v = row._raw[col.camel]
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return v
  return fmtNum(col.snake, n)
}

// ==================== 指标图表 ====================
/** 图表用的模型行（values 只保留有限数值，缺测指标直接不进图表） */
interface MetricRow {
  key: string
  modelName: string
  provider: string
  values: Record<string, number>
}

const columnBySnake = (snake: string): Column | undefined => columns.find((c) => c.snake === snake)

/** 人类评测（Human evaluation）口径：题库 / 竞赛 / 智能体类基准，与「智能指数」区分开 */
const HUMAN_EVAL_SNAKES = [
  'hle_score', 'gpqa_score', 'aime25_score', 'livecodebench_score', 'scicode_score', 'ifbench_score',
  'critpt_score', 'mmmu_pro_score', 'tau2_score', 'tau_banking_score', 'lcr_score',
  'terminalbench_hard_score', 'terminal_bench21_score', 'terminal_bench40_score',
  'automation_bench_score', 'gdpval_normalized_score', 'briefcase_score', 'harvey_lab_score',
  'apex_agents_score', 'itbench_sre_score', 'omniscience_accuracy', 'omniscience_non_hallucination',
]

/** 图表可选指标（沿用表格 columns，按语义分组） */
const chartMetricGroups: Array<{ label: string; items: Column[] }> = [
  {
    label: '价格',
    items: columns.filter((c) => c.snake.startsWith('price') || c.snake === 'cost_per_task'),
  },
  {
    label: '智能',
    items: columns.filter((c) => ['intelligence_index', 'omniscience_index', 'elo'].includes(c.snake)),
  },
  {
    label: '人类评测',
    items: columns.filter((c) => HUMAN_EVAL_SNAKES.includes(c.snake)),
  },
  {
    label: '速度与容量',
    items: columns.filter((c) =>
      ['output_speed_tps', 'latency_first_token_seconds', 'context_window_tokens'].includes(c.snake)),
  },
]

const chartMetric = ref('intelligence_index')
const chartTopN = ref(20)
const chartOrder = ref<'desc' | 'asc'>('desc')
const chartTopNOptions = [10, 15, 20, 30, 50]

const chartRows = ref<MetricRow[]>([])
const chartLoading = ref(false)

const chartMetricLabel = computed(
  () => columnBySnake(chartMetric.value)?.label ?? '智能指数',
)

/** 当前指标下有值的全部模型（未做 Top 截断，用于显示分母） */
const rankPool = computed<MetricRow[]>(() => {
  const col = columnBySnake(chartMetric.value)
  if (!col) return []
  return chartRows.value.filter((r) => Number.isFinite(r.values[col.snake]))
})

/** 排序并截断到 Top N */
const rankModels = computed<MetricRow[]>(() => {
  const col = columnBySnake(chartMetric.value)
  if (!col) return []
  const sorted = [...rankPool.value].sort((a, b) =>
    chartOrder.value === 'desc'
      ? b.values[col.snake] - a.values[col.snake]
      : a.values[col.snake] - b.values[col.snake])
  return sorted.slice(0, chartTopN.value)
})

const toMetricRow = (r: Record<string, any>): MetricRow => {
  const values: Record<string, number> = {}
  columns.forEach((c) => {
    const v = r[c.camel]
    if (v == null || v === '') return
    const n = Number(v)
    if (Number.isFinite(n)) values[c.snake] = n
  })
  return {
    key: r.modelKey,
    modelName: r.modelName || r.modelKey,
    provider: r.provider || r.source || '',
    values,
  }
}

/**
 * 拉取指标库全量数据供图表使用。
 *
 * <p>分页表只返回当前页，图表要算「Top N」必须先拿到全量，因此按 200 条一页
 * 把 total 拉完（最多 5 页 / 1000 条，足够覆盖指标源全量，且不会打爆接口）。</p>
 */
const loadChartData = async () => {
  chartLoading.value = true
  try {
    const acc: MetricRow[] = []
    const pageSize = 200
    let page = 1
    for (;;) {
      const res = await modelMetricsApi.table({ page, size: pageSize })
      const data = res?.data ?? res
      const total = Number(data?.total ?? 0)
      const records = Array.isArray(data?.records) ? data.records : []
      records.forEach((r: Record<string, any>) => acc.push(toMetricRow(r)))
      if (records.length < pageSize || acc.length >= total || page >= 5) break
      page += 1
    }
    chartRows.value = acc
  } catch (e) {
    console.error('加载指标图表数据失败:', e)
    message.error('加载指标图表失败')
  } finally {
    chartLoading.value = false
  }
}

/** 单项指标排行（横向条形图，最高的排最上面） */
const rankOption = computed<EChartsOption>(() => {
  const col = columnBySnake(chartMetric.value)
  const models = [...rankModels.value].reverse()
  return {
    tooltip: {
      trigger: 'item',
      confine: true,
      valueFormatter: (v: any) => (col ? fmtNum(col.snake, Number(v)) : String(v)),
    },
    grid: { left: 8, right: 64, top: 12, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => (col ? shortNum(col.snake, v) : String(v)) },
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: models.map((m) => shortName(m.modelName)),
      axisLabel: { width: 140, overflow: 'truncate' },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          formatter: (p: any) => (col ? fmtNum(col.snake, Number(p.value)) : String(p.value)),
        },
        data: models.map((m) => ({ value: m.values[col?.snake ?? ''], name: m.modelName })),
      },
    ],
  }
})

/** 性价比象限：智能指数 × 输出价（纵轴对数刻度，越靠左上越划算） */
const scatterOption = computed<EChartsOption>(() => {
  const points = chartRows.value
    .filter(
      (r) =>
        Number.isFinite(r.values.intelligence_index) &&
        Number.isFinite(r.values.price_output_per_musd) &&
        r.values.price_output_per_musd > 0,
    )
    .map((r) => ({
      value: [r.values.intelligence_index, r.values.price_output_per_musd],
      name: r.modelName,
      provider: r.provider,
    }))
  return {
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (p: any) => {
        const d = p.data
        return (
          `<b>${esc(String(d.name))}</b><br/>智能指数：${Number(d.value[0]).toFixed(1)}` +
          `<br/>输出价：$${d.value[1]}` +
          (d.provider ? `<br/>${esc(String(d.provider))}` : '')
        )
      },
    },
    grid: { left: 8, right: 24, top: 24, bottom: 36, containLabel: true },
    xAxis: {
      name: '智能指数',
      type: 'value',
      scale: true,
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    yAxis: {
      name: '输出价 ($/M)',
      type: 'log',
      logBase: 10,
      minorSplitLine: { show: false },
      axisLabel: { formatter: (v: number) => '$' + v },
    },
    series: [
      {
        type: 'scatter',
        symbolSize: 9,
        itemStyle: { opacity: 0.75, borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1 },
        emphasis: { itemStyle: { opacity: 1 }, scale: 1.4 },
        data: points,
      },
    ],
  }
})

// ==================== 能力 × 成本 四象限 ====================
const quadShowAllLabels = ref(false)
const quadLogCost = ref(true)

/** 单项任务成本低于此值视为「便宜」；$0.0032 起算，对齐指标源本身的成本分布下界 */
const QUAD_MIN_COST = 0.0032

interface QuadPoint {
  name: string
  provider: string
  cost: number
  ability: number
  reasoning: boolean
  /** 是否在帕累托前沿（不存在更便宜且同等/更强的模型） */
  frontier: boolean
}

const quadPoints = computed<QuadPoint[]>(() =>
  chartRows.value
    .filter(
      (r) =>
        Number.isFinite(r.values.intelligence_index) &&
        Number.isFinite(r.values.cost_per_task) &&
        r.values.cost_per_task > 0,
    )
    .map((r) => ({
      name: r.modelName,
      provider: r.provider,
      cost: r.values.cost_per_task,
      ability: r.values.intelligence_index,
      reasoning: r.values.reasoning != null ? Number(r.values.reasoning) > 0 : false,
      frontier: false,
    })),
)

/**
 * 计算帕累托前沿：按成本升序扫描，记录目前见过的最高能力；
 * 能力严格超过历史最高的即为前沿点。同成本时能力高的先被扫到，不会误判。
 */
const quadFrontierSet = computed<Set<string>>(() => {
  const out = new Set<string>()
  let best = -Infinity
  for (const p of [...quadPoints.value].sort((a, b) => a.cost - b.cost || b.ability - a.ability)) {
    if (p.ability > best) {
      best = p.ability;
      out.add(p.name)
    }
  }
  return out
})

/** 严格替代：前沿之外、且被某个前沿点在「更便宜且更强」两个维度同时压过的点 */
const quadDominatedSet = computed<Set<string>>(() => {
  const out = new Set<string>()
  const frontier = quadPoints.value.filter((p) => quadFrontierSet.value.has(p.name))
  for (const p of quadPoints.value) {
    if (quadFrontierSet.value.has(p.name)) continue
    if (frontier.some((f) => f.cost <= p.cost && f.ability >= p.ability)) out.add(p.name)
  }
  return out
})

/** 参照模型取前沿中「成本与能力都比较居中」的一个，避免拿极端点当分界线把图切歪 */
const quadReference = computed<QuadPoint | null>(() => {
  const f = quadPoints.value.filter((p) => quadFrontierSet.value.has(p.name))
  if (!f.length) return null
  if (f.length === 1) return f[0]
  const medianCost = [...f].sort((a, b) => a.cost - b.cost)[Math.floor(f.length / 2)]
  return medianCost
})

const quadrantOption = computed<EChartsOption>(() => {
  const pts = quadPoints.value
  const ref0 = quadReference.value
  const log = quadLogCost.value
  const axisCost = (v: number) => (log ? `$${v}` : `$${v.toFixed(4)}`)

  const dimmed = pts.filter((p) => !quadDominatedSet.value.has(p.name))
  const dominated = pts.filter((p) => quadDominatedSet.value.has(p.name))
  const frontierPts = dimmed.filter((p) => quadFrontierSet.value.has(p.name))

  const toXY = (p: QuadPoint) => [p.cost, p.ability]
  const baseItem = {
    symbolSize: 9,
    emphasis: { scale: 1.35 },
  }

  // 帕累托前沿折线：按成本升序连成折线，代价是同一成本的多点会重叠，
  // 但这正是前沿的真实形状（能力随成本单调不减）
  const frontierLine = [...frontierPts].sort((a, b) => a.cost - b.cost).map(toXY)

  const series: any[] = []

  // —— 象限底色：以参照模型为界，左绿（更便宜但更弱）右橙（更贵但更强）——
  if (ref0) {
    series.push({
      type: 'line',
      silent: true,
      data: [],
      markArea: {
        silent: true,
        itemStyle: { opacity: 1 },
        data: [
          [
            { xAxis: log ? Math.log10(QUAD_MIN_COST) : QUAD_MIN_COST, yAxis: 0,
              itemStyle: { color: 'rgba(31,136,110,0.07)' } },
            { xAxis: ref0.cost, yAxis: 65 },
          ],
          [
            { xAxis: ref0.cost, yAxis: 0, itemStyle: { color: 'rgba(200,90,50,0.07)' } },
            { xAxis: log ? Math.log10(10) : 10, yAxis: 65 },
          ],
        ],
      },
      markLine: {
        silent: true,
        symbol: 'none',
        label: {
          formatter: `参照：${ref0.name}`,
          position: 'insideEndTop',
          fontSize: 11,
          color: 'var(--el-text-color-secondary)',
        },
        lineStyle: { color: '#B0BEC5', type: 'dashed', width: 1.5 },
        data: [{ xAxis: ref0.cost }],
      },
    })
  }

  // —— 普通模型（淡色，被严格替代的另开一条）——
  series.push({
    name: '模型',
    type: 'scatter',
    ...baseItem,
    itemStyle: { opacity: 0.22 },
    data: dimmed.map((p) => ({ value: toXY(p), name: p.name, provider: p.provider })),
  })
  series.push({
    name: '严格替代',
    type: 'scatter',
    ...baseItem,
    symbol: 'rect',
    symbolSize: 10,
    itemStyle: { color: '#C85A32', opacity: 0.85 },
    data: dominated.map((p) => ({ value: toXY(p), name: p.name, provider: p.provider })),
  })
  // —— 思考等级：叠加一层描边空心圈，与散点同坐标区分，不额外占图例位 ——
  series.push({
    name: '思考等级',
    type: 'scatter',
    symbol: 'circle',
    symbolSize: 20,
    itemStyle: { color: 'transparent', borderColor: '#4E79A7', borderWidth: 1.2, opacity: 0.55 },
    silent: true,
    data: pts.filter((p) => p.reasoning).map((p) => ({ value: toXY(p), name: p.name })),
  })
  // —— 帕累托前沿折线 ——
  series.push({
    name: '帕累托前沿',
    type: 'line',
    showSymbol: true,
    symbolSize: 6,
    smooth: false,
    lineStyle: { color: '#5B6B7B', width: 1.6 },
    itemStyle: { color: '#5B6B7B' },
    data: frontierLine,
  })
  // —— 前沿点上的名称（勾选后显示全部，否则只标最便宜/最强两端）——
  if (quadShowAllLabels.value) {
    series.push({
      name: '名称',
      type: 'scatter',
      symbolSize: 1,
      label: {
        show: true,
        position: 'top',
        fontSize: 10,
        color: 'var(--el-text-color-regular)',
        formatter: (p: any) => p.data.name,
      },
      itemStyle: { color: 'transparent' },
      data: pts.map((p) => ({ value: toXY(p), name: p.name })),
    })
  }

  return {
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (p: any) => {
        const d = p.data
        if (!d || !Array.isArray(d.value)) return ''
        const src = quadPoints.value.find((x) => x.name === d.name)
        return (
          `<b>${esc(String(d.name))}</b><br/>` +
          `能力 ${Number(d.value[1]).toFixed(1)}　成本 $${Number(d.value[0]).toFixed(3)}` +
          (src?.reasoning ? '　<span style="color:#4E79A7">思考</span>' : '')
        )
      },
    },
    legend: {
      top: 0,
      icon: 'roundRect',
      data: ['帕累托前沿', '严格替代', '思考等级', '模型'],
    },
    grid: { left: 16, right: 24, top: 40, bottom: 56, containLabel: true },
    xAxis: {
      type: log ? 'log' : 'value',
      logBase: 10,
      name: '单项任务成本（USD，对数刻度）',
      nameLocation: 'middle',
      nameGap: 32,
      min: QUAD_MIN_COST,
      max: 10,
      axisLabel: { formatter: (v: number) => axisCost(v) },
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      name: 'Artificial Analysis Intelligence Index',
      nameLocation: 'middle',
      nameGap: 46,
      min: 0,
      max: 65,
      splitLine: { lineStyle: { type: 'dashed' } },
    },
    series,
  } as EChartsOption
})

onMounted(() => {
  load()
  loadTable()
  loadChartData()
})
</script>

<style scoped>
.model-metrics { display: flex; flex-direction: column; gap: 18px; }
.metrics-search { width: 220px; }

.table-scroll { overflow-x: auto; }
.metrics-table { width: 100%; font-size: 13px; }

.metrics-table :deep(.el-table__header th) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-weight: 600; text-align: left;
  padding: 10px 12px; white-space: nowrap;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.metrics-table :deep(.num-col) { text-align: center; }

.metrics-table :deep(.el-table__cell) {
  padding: 9px 12px; vertical-align: middle;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.metrics-table :deep(.el-table__row:last-child) .el-table__cell { border-bottom: none; }
.metrics-table :deep(.op-col) { text-align: center; }

.model-col { min-width: 190px; }
.model-cell { display: flex; align-items: center; gap: 10px; }
.model-icon {
  width: 28px; height: 28px;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px); object-fit: contain; flex-shrink: 0;
  background: var(--el-fill-color-light);
}
.model-icon--ph {
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--el-text-color-secondary); font-size: 13px; font-weight: 600;
}
.model-meta { min-width: 0; }
.model-name { font-weight: 600; color: var(--el-text-color-primary); white-space: nowrap; }
.model-provider { font-size: 11px; color: var(--el-text-color-secondary); white-space: nowrap; }

/* 指标单元格 */
.metric-cell {
  display: inline-flex; align-items: center; gap: 4px;
  /* 原值 8px → md 档 */
  padding: 2px 4px; border-radius: var(--el-radius-md, 8px);
}
.metric-cell.is-locked {
  background: var(--el-color-warning-light-9);
  box-shadow: inset 0 0 0 1px var(--el-color-warning-light-7);
}
.metric-val { min-width: 48px; display: inline-block; color: var(--el-text-color-regular); white-space: nowrap; }
.metric-input { width: 96px; }
.metric-input :deep(.el-input__wrapper) { padding: 1px 7px; }

.lock-btn {
  border: none; background: transparent; cursor: pointer;
  width: 22px; height: 22px; padding: 2px;
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-border-color);
  display: inline-flex; align-items: center; justify-content: center;
  transition: color 0.15s ease, background 0.15s ease;
}
.lock-btn svg { width: 15px; height: 15px; }
.lock-btn:hover { color: var(--el-text-color-secondary); background: var(--el-fill-color-light); }
.lock-btn.is-on { color: var(--el-color-warning); }

.op-cell { display: inline-flex; gap: 6px; }

.metrics-foot { display: flex; justify-content: flex-end; }

/* ==================== 指标图表 ==================== */
.chart-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
/* 四象限图较高，单独包一层以便空态与图表占位不互相挤压 */
.quad-wrap { position: relative; min-height: 200px; }
.quad-empty { text-align: center; color: var(--el-text-color-secondary); padding: 28px 0; font-size: 13px; }
.chart-metric { width: 190px; }
.chart-num, .chart-order { width: 96px; }

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 14px;
  padding: 14px;
  min-height: 200px;
}

.chart-box {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px 12px 4px;
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-lighter);
  min-width: 0;
}
.chart-box__head { display: flex; flex-direction: column; gap: 2px; }
.chart-box__title {
  font-size: 13px; font-weight: 700;
  color: var(--el-text-color-primary);
}
.chart-box__sub {
  font-size: 11.5px; color: var(--el-text-color-secondary);
}

/* 动效降级：系统开启「减少动态效果」时，锁定按钮的颜色与底色直接到位。
   只关 .lock-btn 自己的 transition，不写 `*` / .lock-btn * 通配，
   避免把 el-input / el-pagination 内部 Element Plus 组件的合法过渡一起掐掉。
   .lock-btn.is-on 的警示色是状态表达（静态声明），停掉过渡后照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .lock-btn {
    transition: none;
  }
}
</style>

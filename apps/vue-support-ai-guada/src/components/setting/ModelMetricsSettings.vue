<template>
  <div class="model-metrics">
    <!-- 推送配置 -->
    <SettingsCard title="推送配置">
      <template #actions>
        <el-button type="primary" size="small" :loading="saving" @click="save">保存配置</el-button>
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
          <el-button size="small" type="primary" :loading="refreshing" @click="manualRefresh">全量同步指标</el-button>
          <el-button size="small" :loading="syncing" @click="manualSyncPricing">同步官方定价</el-button>
        </div>
      </SettingsRow>
    </SettingsCard>

    <!-- 模型指标库 -->
    <SettingsCard
      title="模型指标库"
      subtitle="数据源 Artificial Analysis 的全量模型指标，与本地配置模型无关。点击锁形图标可手动改值并锁定，锁定字段同步不再覆盖；再次点击解锁即恢复指标源值。"
    >
      <template #actions>
        <el-input v-model="keyword" size="small" clearable class="metrics-search"
          placeholder="搜索模型 / 厂商" @input="onSearch" @clear="onSearch">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </template>

      <div class="table-scroll">
        <table class="metrics-table">
          <thead>
            <tr>
              <th class="model-col">模型</th>
              <th v-for="col in columns" :key="col.snake" class="num-col">
                <span>{{ col.label }}</span>
                <span v-if="col.unit" class="th-unit">{{ col.unit }}</span>
              </th>
              <th class="op-col">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key">
              <td>
                <div class="model-cell">
                  <img v-if="row.icon" :src="row.icon" class="model-icon" alt=""
                    @error="(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')" />
                  <span v-else class="model-icon model-icon--ph">
                    {{ (row.modelName || '?').charAt(0).toUpperCase() }}
                  </span>
                  <div class="model-meta">
                    <div class="model-name">{{ row.modelName }}</div>
                    <div class="model-provider">{{ row.sub }}</div>
                  </div>
                </div>
              </td>
              <td v-for="col in columns" :key="col.snake" class="num-col">
                <div class="metric-cell" :class="{ 'is-locked': isLocked(row, col.snake) }">
                  <el-input v-if="isLocked(row, col.snake)" v-model.number="row.values[col.snake]"
                    type="number" size="small" class="metric-input" @input="markDirty(row)" />
                  <span v-else class="metric-val">{{ fmtVal(row, col) }}</span>
                  <button type="button" class="lock-btn" :class="{ 'is-on': isLocked(row, col.snake) }"
                    :title="isLocked(row, col.snake) ? '已锁定，点击解锁恢复指标源值' : '手动改值并锁定（同步不再覆盖）'"
                    @click="toggleLock(row, col)">
                    <svg v-if="isLocked(row, col.snake)" viewBox="0 0 24 24" fill="currentColor">
                      <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5z" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M8 10.5V6.75a4 4 0 1 1 8 0M5.25 10.5h10.5a2.25 2.25 0 0 1 2.25 2.25v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18.75v-6a2.25 2.25 0 0 1 2.25-2.25z" />
                    </svg>
                  </button>
                </div>
              </td>
              <td class="op-col">
                <div class="op-cell">
                  <el-button size="small" type="primary" :disabled="!row.dirty" :loading="row.saving"
                    @click="saveRow(row)">保存</el-button>
                  <el-button size="small" :disabled="!row.dirty" @click="discardRow(row)">还原</el-button>
                </div>
              </td>
            </tr>
            <tr v-if="!loadingRows && rows.length === 0">
              <td :colspan="columns.length + 2" class="empty-row">暂无模型指标数据</td>
            </tr>
          </tbody>
        </table>
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { modelMetricsApi } from '@/services/javaApi'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'

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
    ElMessage.success('模型指标配置保存成功')
  } catch (e) {
    console.error('保存模型指标配置失败:', e)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const manualRefresh = async () => {
  refreshing.value = true
  try {
    await modelMetricsApi.refresh()
    ElMessage.success('全量指标已同步')
    await loadTable()
  } catch (e) {
    console.error('全量同步失败:', e)
    ElMessage.error('同步失败')
  } finally {
    refreshing.value = false
  }
}

const manualSyncPricing = async () => {
  syncing.value = true
  try {
    await modelMetricsApi.syncPricing()
    ElMessage.success('官方定价已同步')
  } catch (e) {
    console.error('同步定价失败:', e)
    ElMessage.error('同步失败')
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
    ElMessage.error('加载指标库失败')
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
    ElMessage.success('已保存，同步将跳过锁定字段')
  } catch (e) {
    console.error('保存手动指标失败:', e)
    ElMessage.error('保存失败')
  } finally {
    row.saving = false
  }
}

const discardRow = (row: RowState) => {
  const fresh = buildRow(row._raw)
  const i = rows.value.findIndex((r) => r.key === row.key)
  if (i >= 0) rows.value.splice(i, 1, fresh)
}

const fmtVal = (row: RowState, col: Column) => {
  const v = row._raw[col.camel]
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return v
  if (col.snake === 'context_window_tokens') return n.toLocaleString()
  if (col.snake === 'elo') return n.toFixed(0)
  if (col.snake === 'cost_per_task') return '$' + n
  if (col.snake.endsWith('_score') || col.snake === 'omniscience_accuracy' || col.snake === 'omniscience_non_hallucination') return Number((n * 100).toFixed(1)) + '%'
  if (col.snake === 'omniscience_index') return Number(n.toFixed(4))
  if (col.snake.startsWith('price')) return '$' + n
  return n
}

onMounted(() => {
  load()
  loadTable()
})
</script>

<style scoped>
.model-metrics { display: flex; flex-direction: column; gap: 18px; }
.metrics-search { width: 220px; }

.table-scroll { overflow-x: auto; }
.metrics-table { width: 100%; border-collapse: collapse; font-size: 13px; }

.metrics-table th {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-weight: 600; text-align: left;
  padding: 10px 12px; white-space: nowrap;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.metrics-table th.num-col, .metrics-table td.num-col { text-align: center; }
.th-unit { margin-left: 3px; font-weight: 400; font-size: 11px; color: var(--el-text-color-placeholder); }

.metrics-table td {
  padding: 9px 12px; vertical-align: middle;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.metrics-table tr:last-child td { border-bottom: none; }
.metrics-table td.op-col { text-align: center; }

.model-col { min-width: 190px; }
.model-cell { display: flex; align-items: center; gap: 10px; }
.model-icon {
  width: 28px; height: 28px; border-radius: 8px; object-fit: contain; flex-shrink: 0;
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
  padding: 2px 4px; border-radius: 8px;
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
  width: 22px; height: 22px; padding: 2px; border-radius: 6px;
  color: var(--el-border-color);
  display: inline-flex; align-items: center; justify-content: center;
  transition: color 0.15s ease, background 0.15s ease;
}
.lock-btn svg { width: 15px; height: 15px; }
.lock-btn:hover { color: var(--el-text-color-secondary); background: var(--el-fill-color-light); }
.lock-btn.is-on { color: var(--el-color-warning); }

.op-cell { display: inline-flex; gap: 6px; }
.empty-row { text-align: center; color: var(--el-text-color-secondary); padding: 28px 12px; }

.metrics-foot { display: flex; justify-content: flex-end; }
</style>

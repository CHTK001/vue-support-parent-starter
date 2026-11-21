<template>
  <div class="h-full overflow-hidden flex flex-col" data-page="model-pricing">
    <PageHeader title="模型价格">
      <template #actions>
        <el-button circle :loading="loading" title="刷新" @click="() => load(false)">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </template>
    </PageHeader>

    <div v-loading="loading && models.length === 0" class="mp-body">
      <!-- 概览：可比价模型数 / 提供商数 / 价格带分布（点选即筛选） -->
      <section class="mp-summary">
        <div class="mp-stat">
          <span class="mp-stat__num">{{ overview.withPrice }}</span>
          <span class="mp-stat__label">可比价模型</span>
        </div>
        <div class="mp-stat">
          <span class="mp-stat__num">{{ overview.providerCount }}</span>
          <span class="mp-stat__label">提供商</span>
        </div>
        <div class="mp-bands" role="group" aria-label="按价格带筛选">
          <button
            v-for="b in bandChips"
            :key="b.key"
            type="button"
            class="mp-band"
            :class="{ active: band === b.key }"
            :aria-pressed="band === b.key"
            @click="toggleBand(b.key)"
          >
            <span class="mp-band__dot" :data-band="b.key" />
            <span class="mp-band__name">{{ b.label }}</span>
            <span class="mp-band__count">{{ overview.bands[b.key] ?? 0 }}</span>
          </button>
        </div>
      </section>

      <!-- 筛选条：关键字 / 提供商 / 排序 -->
      <section class="mp-toolbar">
        <el-input
          v-model="keyword"
          clearable
          class="mp-search"
          placeholder="搜索模型名或提供商"
          :prefix-icon="Search"
        />
        <el-select v-model="provider" clearable class="mp-provider" placeholder="全部提供商">
          <el-option
            v-for="p in overview.providers"
            :key="p.provider"
            :label="`${p.provider}（${p.count}）`"
            :value="p.provider"
          />
        </el-select>
        <el-select v-model="sortKey" class="mp-sort">
          <el-option label="价格最低优先" value="price" />
          <el-option label="性价比最高优先" value="value" />
          <el-option label="智能指数最高优先" value="index" />
        </el-select>
        <span class="mp-total">共 {{ overview.total }} 个模型</span>
      </section>

      <!-- 空态 -->
      <div v-if="!loading && models.length === 0" class="mp-empty">
        <p class="mp-empty__title">暂无可比价的模型</p>
        <p class="mp-empty__sub">指标库中还没有带价格的模型数据，可到「设置 → 模型指标」手动同步指标后重试。</p>
      </div>

      <!-- 卡片墙：每卡一个模型，卡内按提供商列报价并画相对价格条 -->
      <section class="mp-grid">
        <article v-for="m in models" :key="m.model" class="mp-card">
          <header class="mp-card__head">
            <div class="mp-card__title-wrap">
              <h3 class="mp-card__title" :title="m.model">{{ m.model }}</h3>
              <span v-if="m.band" class="mp-card__band" :data-band="m.band">{{ bandLabel(m.band) }}</span>
            </div>
            <div class="mp-card__price">
              <span class="mp-card__price-num">{{ fmtPrice(m.minPrice) }}</span>
              <span class="mp-card__price-unit">/1M tok 起</span>
            </div>
          </header>

          <div class="mp-card__meta">
            <span v-if="m.intelligenceIndex != null">智能指数 {{ m.intelligenceIndex }}</span>
            <span v-if="m.valueScore != null">性价比 {{ m.valueScore }}</span>
            <span>{{ m.providers.length }} 个报价</span>
          </div>

          <ul class="mp-quotes">
            <li
              v-for="q in m.providers"
              :key="q.provider ?? ''"
              class="mp-quote"
              :class="{ 'is-cheapest': q.cheapest }"
            >
              <div class="mp-quote__row">
                <span class="mp-quote__provider" :title="q.provider ?? ''">{{ q.provider || '未标注' }}</span>
                <span v-if="q.cheapest" class="mp-quote__tag">最便宜</span>
                <span class="mp-quote__price">{{ fmtPrice(q.price) }}</span>
              </div>
              <div
                class="mp-quote__bar"
                role="img"
                :aria-label="`${q.provider || '未标注'} 报价 ${fmtPrice(q.price)}/1M token`"
              >
                <i :style="{ width: barWidth(q, m) }" />
              </div>
              <div class="mp-quote__detail">
                <span>入 {{ fmtPrice(q.input) }}</span>
                <span>出 {{ fmtPrice(q.output) }}</span>
                <span v-if="q.cacheHit != null">缓存命中 {{ fmtPrice(q.cacheHit) }}</span>
              </div>
            </li>
          </ul>
        </article>
      </section>

      <!-- 加载更多（分页追加） -->
      <div v-if="models.length < overview.total" class="mp-more">
        <el-button :loading="loading" @click="loadMore">
          加载更多（还有 {{ overview.total - models.length }} 个）
        </el-button>
      </div>

      <p v-if="overview.cnyPricingSkipped > 0" class="mp-note">
        已跳过 {{ overview.cnyPricingSkipped }} 条非 USD 定价行（人工 CNY 单价不参与本页比价）
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { message } from '@repo/core'
import { Search, Refresh } from '@element-plus/icons-vue'

import PageHeader from '@/components/PageHeader.vue'
import { modelMetricsApi } from '@/services/javaApi'

/** 单个提供商对某模型的一条报价（后端 price-overview 返回结构） */
interface ProviderQuote {
  provider: string | null
  input: number | null
  output: number | null
  cacheHit: number | null
  cacheWrite: number | null
  price: number | null
  source: string
  cheapest: boolean
}

/** 单个模型的聚合卡片（providers 按报价升序，最低价标 cheapest） */
interface ModelCard {
  model: string
  intelligenceIndex: number | null
  band: string | null
  minPrice: number | null
  maxPrice: number | null
  valueScore: number | null
  providers: ProviderQuote[]
}

/** /api/model-metrics/price-overview 响应 */
interface Overview {
  total: number
  page: number
  size: number
  totalModels: number
  withPrice: number
  providerCount: number
  bands: Record<string, number>
  providers: { provider: string; count: number }[]
  cnyPricingSkipped: number
  models: ModelCard[]
}

const PAGE_SIZE = 24

const loading = ref(false)
const models = ref<ModelCard[]>([])
const overview = ref<Overview>({
  total: 0, page: 1, size: PAGE_SIZE, totalModels: 0, withPrice: 0,
  providerCount: 0, bands: {}, providers: [], cnyPricingSkipped: 0, models: [],
})

const keyword = ref('')
const provider = ref('')
const band = ref('')
const sortKey = ref<'price' | 'value' | 'index'>('price')

const bandChips = [
  { key: 'economy', label: '经济 <$1' },
  { key: 'value', label: '实惠 $1–5' },
  { key: 'standard', label: '标准 $5–15' },
  { key: 'flagship', label: '旗舰 ≥$15' },
]

const BAND_LABELS: Record<string, string> = {
  economy: '经济档',
  value: '实惠档',
  standard: '标准档',
  flagship: '旗舰档',
}

const bandLabel = (b: string) => BAND_LABELS[b] ?? b

/** 价格显示：USD/百万 token，去掉多余尾零 */
const fmtPrice = (v: number | null | undefined) => {
  if (v == null || Number.isNaN(Number(v))) return '—'
  const n = Number(v)
  const s = n >= 100 ? n.toFixed(0) : n >= 1 ? n.toFixed(2) : n.toFixed(3)
  return `$${s.replace(/\.?0+$/, '')}`
}

/** 进度条宽度 = 该报价 ÷ 本卡最高价（单报价或零价时拉满） */
const barWidth = (q: ProviderQuote, m: ModelCard) => {
  if (q.price == null) return '0%'
  const max = m.maxPrice ?? q.price
  if (!max || max <= 0) return '100%'
  return `${Math.max(4, Math.round((q.price / max) * 100))}%`
}

const toggleBand = (key: string) => {
  band.value = band.value === key ? '' : key
}

const load = async (append = false) => {
  loading.value = true
  const page = append ? overview.value.page + 1 : 1
  try {
    const res = await modelMetricsApi.priceOverview({
      page,
      size: PAGE_SIZE,
      keyword: keyword.value || undefined,
      provider: provider.value || undefined,
      band: band.value || undefined,
      sort: sortKey.value,
      // 价格升序找便宜；性价比 / 智能指数降序找最强
      order: sortKey.value === 'price' ? 'asc' : 'desc',
    })
    const data = (res?.data ?? res) as Overview
    if (!append) {
      overview.value = { ...overview.value, ...data }
      models.value = Array.isArray(data?.models) ? data.models : []
    } else {
      overview.value = { ...overview.value, ...data }
      models.value = [...models.value, ...(Array.isArray(data?.models) ? data.models : [])]
    }
  } catch (e) {
    console.error('加载模型价格失败:', e)
    message.error('加载模型价格失败')
  } finally {
    loading.value = false
  }
}

const loadMore = () => load(true)

// 关键字防抖；其余筛选/排序变更立即回第一页重查
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(keyword, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(false), 300)
})
watch([provider, band, sortKey], () => load(false))

onMounted(() => load(false))
</script>

<style scoped>
.mp-body {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 14px 20px 32px;
  display: flex; flex-direction: column; gap: 14px;
}

/* ===== 概览条 ===== */
.mp-summary {
  display: flex; align-items: center; gap: 22px; flex-wrap: wrap;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}
.mp-stat { display: flex; flex-direction: column; gap: 2px; }
.mp-stat__num { font-size: 22px; font-weight: 700; line-height: 1.1; color: var(--el-text-color-primary); }
.mp-stat__label { font-size: 12px; color: var(--el-text-color-secondary); }
.mp-bands { display: flex; gap: 8px; flex-wrap: wrap; margin-left: auto; }
.mp-band {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 10px; border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
  font-size: 12px; cursor: pointer; user-select: none;
  transition: border-color .15s, background .15s;
}
.mp-band:hover { border-color: var(--el-color-primary); }
.mp-band.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}
.mp-band__dot { width: 8px; height: 8px; border-radius: 50%; }
.mp-band__dot[data-band='economy'] { background: #16a34a; }
.mp-band__dot[data-band='value'] { background: #3b82f6; }
.mp-band__dot[data-band='standard'] { background: #d97706; }
.mp-band__dot[data-band='flagship'] { background: #9333ea; }
.mp-band__count { font-variant-numeric: tabular-nums; color: var(--el-text-color-secondary); }
.mp-band.active .mp-band__count { color: var(--el-color-primary); }

/* ===== 筛选条 ===== */
.mp-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.mp-search { width: 240px; }
.mp-provider { width: 190px; }
.mp-sort { width: 170px; }
.mp-total { margin-left: auto; font-size: 12px; color: var(--el-text-color-secondary); }

/* ===== 卡片墙 ===== */
.mp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
}
.mp-card {
  display: flex; flex-direction: column; gap: 10px;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  transition: box-shadow .15s, border-color .15s;
}
.mp-card:hover {
  border-color: var(--el-border-color);
  box-shadow: var(--el-box-shadow-light);
}
.mp-card__head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
}
.mp-card__title-wrap { display: flex; align-items: center; gap: 8px; min-width: 0; }
.mp-card__title {
  margin: 0; font-size: 14px; font-weight: 600; color: var(--el-text-color-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 230px;
}
.mp-card__band {
  flex: none; padding: 1px 8px; border-radius: 999px;
  font-size: 11px; line-height: 18px; color: #fff;
}
.mp-card__band[data-band='economy'] { background: #16a34a; }
.mp-card__band[data-band='value'] { background: #3b82f6; }
.mp-card__band[data-band='standard'] { background: #d97706; }
.mp-card__band[data-band='flagship'] { background: #9333ea; }
.mp-card__price { display: flex; align-items: baseline; gap: 4px; flex: none; }
.mp-card__price-num { font-size: 18px; font-weight: 700; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }
.mp-card__price-unit { font-size: 11px; color: var(--el-text-color-secondary); }
.mp-card__meta {
  display: flex; gap: 12px; flex-wrap: wrap;
  font-size: 12px; color: var(--el-text-color-secondary);
}

/* ===== 卡内报价行 ===== */
.mp-quotes { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.mp-quote {
  padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}
.mp-quote.is-cheapest {
  border-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.mp-quote__row { display: flex; align-items: center; gap: 8px; }
.mp-quote__provider {
  font-size: 12px; font-weight: 600; color: var(--el-text-color-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mp-quote__tag {
  flex: none; padding: 0 6px; border-radius: 999px;
  font-size: 10px; line-height: 16px;
  color: #fff; background: var(--el-color-success);
}
.mp-quote__price {
  margin-left: auto; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}
.mp-quote.is-cheapest .mp-quote__price { color: var(--el-color-success); }
.mp-quote__bar {
  margin-top: 6px; height: 6px; border-radius: 999px; overflow: hidden;
  background: var(--el-fill-color);
}
.mp-quote__bar i {
  display: block; height: 100%; border-radius: inherit;
  background: var(--el-color-primary); opacity: .55;
}
.mp-quote.is-cheapest .mp-quote__bar i { background: var(--el-color-success); opacity: .9; }
.mp-quote__detail {
  margin-top: 4px; display: flex; gap: 10px; flex-wrap: wrap;
  font-size: 11px; color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums;
}

/* ===== 其余 ===== */
.mp-more { display: flex; justify-content: center; padding: 4px 0 0; }
.mp-note { margin: 0; font-size: 12px; color: var(--el-text-color-secondary); }
.mp-empty {
  padding: 60px 20px; text-align: center;
  border: 1px dashed var(--el-border-color-lighter); border-radius: 10px;
}
.mp-empty__title { margin: 0 0 6px; font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); }
.mp-empty__sub { margin: 0; font-size: 13px; color: var(--el-text-color-secondary); }
</style>

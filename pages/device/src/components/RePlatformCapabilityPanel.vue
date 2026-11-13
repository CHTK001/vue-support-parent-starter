<template>
  <div class="pcm">
    <!-- 工具条：搜索 + 只看有缺口 + 厂商页签 -->
    <header class="pcm-tools">
      <el-input
        v-model="keyword"
        clearable
        size="small"
        placeholder="搜索平台 / 能力位"
        class="pcm-search"
      >
        <template #prefix>
          <ReIcon name="Search" :size="13" />
        </template>
      </el-input>
      <button
        type="button"
        class="pcm-toggle"
        :class="{ 'is-on': onlyGap }"
        :aria-pressed="onlyGap"
        @click="onlyGap = !onlyGap"
      >
        <i class="pcm-toggle__dot" />只看有缺口
      </button>
      <span class="pcm-grow" />
      <span class="pcm-scope">共 {{ scopedRows.length }} 个平台 · {{ CAP_ORDER.length }} 个能力位</span>
    </header>

    <nav class="pcm-tabs" role="tablist" aria-label="按厂商筛选平台">
      <button
        type="button"
        class="pcm-tab"
        :class="{ 'is-active': !vendorFilter }"
        role="tab"
        :aria-selected="!vendorFilter"
        @click="vendorFilter = ''"
      >
        全部厂商
        <b>{{ matrixRows.length }}</b>
      </button>
      <button
        v-for="tab in vendorTabs"
        :key="tab.vendor"
        type="button"
        class="pcm-tab"
        :class="{ 'is-active': vendorFilter === tab.vendor }"
        role="tab"
        :aria-selected="vendorFilter === tab.vendor"
        @click="vendorFilter = tab.vendor"
      >
        {{ tab.name }}
        <b>{{ tab.count }}</b>
        <i v-if="tab.gaps" class="pcm-tab__gap" :title="`${tab.gaps} 个平台还有待实现能力`">{{ tab.gaps }}</i>
      </button>
    </nav>

    <!-- 汇总：把「支持 / 未验证 / 待实现 / 不具备」摊开，避免只看覆盖率自我安慰 -->
    <section class="pcm-sum">
      <div class="pcm-sum__kpi">
        <b>{{ visible.length }}</b>
        <span>平台</span>
      </div>
      <div class="pcm-sum__kpi is-yes">
        <b>{{ stats.yes }}</b>
        <span>已验证支持</span>
      </div>
      <div class="pcm-sum__kpi is-unverified">
        <b>{{ stats.unverified }}</b>
        <span>已实现未验证</span>
      </div>
      <div class="pcm-sum__kpi is-todo">
        <b>{{ stats.todo }}</b>
        <span>待实现</span>
      </div>
      <div class="pcm-sum__kpi is-no">
        <b>{{ stats.no }}</b>
        <span>平台不具备</span>
      </div>
      <div class="pcm-sum__meter">
        <span class="pcm-sum__label">已实现占比</span>
        <span class="pcm-meter">
          <i :style="{ width: `${stats.coverage}%` }" />
        </span>
        <b class="pcm-sum__pct">{{ stats.coverage }}%</b>
      </div>
    </section>

    <p class="pcm-legend">
      <span class="pcm-lg is-yes"><i />支持</span>
      <span class="pcm-lg is-unverified"><i />已实现未验证</span>
      <span class="pcm-lg is-todo"><i />待实现</span>
      <span class="pcm-lg is-no"><i />平台不具备</span>
      <span class="pcm-lg is-none"><i />未声明</span>
      <span class="pcm-legend__hint">只有前两种会生成前端入口；点任意能力位可看原因。</span>
    </p>

    <!-- 平台卡片：一行一个平台，16 个能力位固定顺序，横向可对比 -->
    <div v-if="visible.length" class="pcm-list">
      <article
        v-for="row in visible"
        :key="row.key"
        class="pcm-card"
        :data-platform="row.key"
        :data-gaps="row.todo"
      >
        <header class="pcm-card__head">
          <span class="pcm-tile">{{ monogram(row.vendorName) }}</span>
          <span class="pcm-card__titles">
            <b>{{ row.title }}</b>
            <code>{{ row.key }}</code>
          </span>
          <span class="pcm-grow" />
          <span class="pcm-card__counts">
            <span v-if="row.yes" class="pcm-cnt is-yes" :title="`${row.yes} 项已验证支持`">{{ row.yes }}</span>
            <span v-if="row.unverified" class="pcm-cnt is-unverified" :title="`${row.unverified} 项已实现未验证`">
              {{ row.unverified }}
            </span>
            <span v-if="row.todo" class="pcm-cnt is-todo" :title="`${row.todo} 项待实现`">{{ row.todo }}</span>
            <span v-if="row.none" class="pcm-cnt is-none" :title="`${row.none} 项未在能力矩阵中声明`">{{ row.none }}</span>
          </span>
          <span class="pcm-card__meter">
            <span class="pcm-meter is-slim">
              <i :style="{ width: `${row.coverage}%` }" />
            </span>
            <b>{{ row.coverage }}%</b>
          </span>
          <button
            type="button"
            class="pcm-card__add"
            :title="`按「${row.title}」新增一套接入凭据`"
            @click="emit('create', { vendor: row.vendor, platform: row.code })"
          >
            新增凭据
          </button>
        </header>

        <ul class="pcm-caps">
          <li v-for="item in row.cells" :key="item.code">
            <button
              type="button"
              class="pcm-cap"
              :class="`is-${item.cell.support.toLowerCase()}`"
              :data-cap="item.code"
              :data-support="item.cell.support"
              :title="capTitle(item)"
              @click="togglePick(row.key, item.code)"
            >
              <i class="pcm-cap__dot" />
              <span class="pcm-cap__name">{{ item.name }}</span>
              <em v-if="item.cell.apiCount" class="pcm-cap__api">{{ item.cell.apiCount }}</em>
            </button>
          </li>
        </ul>

        <div v-if="pickedOf(row.key)" class="pcm-note">
          <span class="pcm-note__head">
            <b>{{ pickedOf(row.key)?.name }}</b>
            <span
              class="pcm-note__state"
              :class="`is-${pickedOf(row.key)?.cell.support.toLowerCase()}`"
            >
              {{ supportLabel(pickedOf(row.key)?.cell.support || 'NO') }}
            </span>
            <span v-if="pickedOf(row.key)?.cell.apiCount" class="pcm-note__api">
              官方接口 {{ pickedOf(row.key)?.cell.apiCount }} 个
            </span>
          </span>
          <p class="pcm-note__text">{{ pickedOf(row.key)?.cell.note || '能力矩阵未给出说明。' }}</p>
        </div>

        <footer v-if="row.todo" class="pcm-gaps">
          <button type="button" class="pcm-gaps__btn" @click="toggleGaps(row.key)">
            {{ openGaps[row.key] ? '收起缺口' : `查看 ${row.todo} 项待实现的原因` }}
          </button>
          <ul v-show="openGaps[row.key]" class="pcm-gaps__list">
            <li v-for="gap in row.gaps" :key="gap.code">
              <b>{{ gap.name }}</b>
              <span>{{ gap.note || '未取证' }}</span>
            </li>
          </ul>
        </footer>
      </article>
    </div>

    <div v-else class="pcm-empty">
      <span class="pcm-empty__title">没有匹配的平台</span>
      <span class="pcm-empty__text">
        当前筛选下没有平台。{{ onlyGap ? '去掉「只看有缺口」可以看到全部平台。' : '换个关键词试试。' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 平台能力矩阵面板。
 *
 * <p>数据来源是后端 {@code /api/device/capability/matrix}：平台 × 能力位四态
 * （支持 / 已实现未验证 / 待实现 / 平台不具备）。这里只做展示与筛选，不再自行推断：
 * 能力强弱、缺口原因全部取自能力矩阵的 note，避免前端写死一套「看起来支持」的假象。</p>
 *
 * <p>为什么不用厂商级能力位：厂商级取的是各平台并集，只能做粗判断。
 * 例如海康同时有云曜与萤石，云曜有组织架构、萤石没有，
 * 厂商并集会让人误以为萤石也能同步组织。因此本面板一律按平台展示。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed, reactive, ref, watch } from 'vue'
import ReIcon from '@repo/ui/re-icon'
import type {
  CapabilityCell,
  CapabilitySupport,
  DeviceCapability,
  DeviceVendorDescriptor,
  PlatformCapabilityMatrix
} from '../types/device'

const props = defineProps<{
  /** 厂商描述符（取厂商展示名与平台展示名） */
  vendors: DeviceVendorDescriptor[]
  /** 平台标识 → 能力矩阵 */
  matrix: Record<string, PlatformCapabilityMatrix>
  /** 能力位字典（编码 + 展示名） */
  dictionary: Array<{ code: string; name: string }>
  /** 打开时预先选中的厂商（可空） */
  focusVendor?: string
}>()

/**
 * 卡片上的「新增凭据」：把厂商与平台带到凭据表单，少一次两次下拉。
 */
const emit = defineEmits<{
  (event: 'create', payload: { vendor: string; platform: string }): void
}>()

/**
 * 能力位固定顺序：按业务域从设备主数据到外围能力排列。
 *
 * <p>每张平台卡都用同一顺序，横向扫一眼就能看出「这家平台缺哪一段」。</p>
 */
const CAP_ORDER: DeviceCapability[] = [
  'DEVICE',
  'DEVICE_WRITE',
  'CHANNEL',
  'MEDIA',
  'RECORD',
  'CAPTURE',
  'PTZ',
  'EVENT',
  'ACCESS',
  'ACCESS_WRITE',
  'ORG',
  'ORG_WRITE',
  'PERSON',
  'PERSON_WRITE',
  'METRIC',
  'PARKING'
]

/** 后端字典取不到时的兜底文案（与 DeviceCapability 展示名一致） */
const FALLBACK_NAME: Record<DeviceCapability, string> = {
  DEVICE: '设备同步',
  DEVICE_WRITE: '设备增删改',
  CHANNEL: '通道',
  MEDIA: '实时视频',
  RECORD: '录像回放',
  PTZ: '云台',
  EVENT: '事件',
  ACCESS: '门禁',
  ACCESS_WRITE: '门禁增删改',
  ORG: '组织',
  ORG_WRITE: '组织增删改',
  PERSON: '人员',
  PERSON_WRITE: '人员增删改',
  CAPTURE: '抓图',
  METRIC: '环境指标',
  PARKING: '停车场'
}

/** 未在矩阵中声明的格子：不伪造支持度，单独标「未声明」 */
const UNDECLARED: CapabilityCell = {
  support: 'NO',
  apiCount: 0,
  note: '能力矩阵未声明该能力，按「不支持」处理。'
}

interface CellView {
  code: DeviceCapability
  name: string
  cell: CapabilityCell
}

interface PlatformRow {
  /** 平台标识，形如 hikvision.ezviz */
  key: string
  /** 厂商标识 */
  vendor: string
  /** 平台编码（不含厂商前缀），用于「按该平台新增凭据」 */
  code: string
  /** 厂商展示名 */
  vendorName: string
  /** 平台展示名 */
  title: string
  cells: CellView[]
  /** 已验证支持格数 */
  yes: number
  /** 已实现未验证格数 */
  unverified: number
  /** 待实现格数 */
  todo: number
  /** 平台不具备格数 */
  no: number
  /** 未声明格数 */
  none: number
  /** 已实现占「官方支持」的百分比 */
  coverage: number
  /** 待实现清单 */
  gaps: Array<{ code: DeviceCapability; name: string; note: string }>
}

const keyword = ref('')
const onlyGap = ref(false)
const vendorFilter = ref(props.focusVendor || '')

/** 抽屉每次打开会换 focusVendor，跟着切过去 */
watch(
  () => props.focusVendor,
  (value) => {
    if (value !== undefined) vendorFilter.value = value
  }
)

const nameMap = computed<Map<string, string>>(() => {
  const map = new Map<string, string>()
  for (const item of props.dictionary || []) map.set(item.code, item.name)
  return map
})

function nameOf(code: DeviceCapability): string {
  return nameMap.value.get(code) || FALLBACK_NAME[code] || code
}

/** 平台标识拆成厂商 + 平台编码；厂商名优先取描述符 */
function splitPlatform(key: string): { vendor: string; platform: string } {
  const index = key.indexOf('.')
  if (index < 0) return { vendor: key, platform: key }
  return { vendor: key.slice(0, index), platform: key.slice(index + 1) }
}

function vendorNameOf(vendor: string): string {
  return props.vendors.find((item) => item.vendor === vendor)?.name || vendor
}

function platformTitleOf(key: string, title: string): string {
  if (title) return title
  const { vendor, platform } = splitPlatform(key)
  return props.vendors.find((item) => item.vendor === vendor)?.platforms.find((item) => item.code === platform)?.name || platform
}

/** 全部平台行（一次算好，筛选只做过滤，不改统计口径） */
const matrixRows = computed<PlatformRow[]>(() =>
  Object.values(props.matrix || {})
    .map((entry) => buildRow(entry))
    .sort((a, b) => a.key.localeCompare(b.key))
)

function buildRow(entry: PlatformCapabilityMatrix): PlatformRow {
  const { vendor, platform } = splitPlatform(entry.platform)
  let yes = 0
  let unverified = 0
  let todo = 0
  let no = 0
  let none = 0
  const gaps: Array<{ code: DeviceCapability; name: string; note: string }> = []
  const cells: CellView[] = CAP_ORDER.map((code) => {
    const declared = entry.cells?.[code] as CapabilityCell | undefined
    const cell = declared || UNDECLARED
    const name = nameOf(code)
    if (!declared) {
      none += 1
    } else if (cell.support === 'YES') {
      yes += 1
    } else if (cell.support === 'IMPLEMENTED_UNVERIFIED') {
      unverified += 1
    } else if (cell.support === 'TODO') {
      todo += 1
      gaps.push({ code, name, note: cell.note })
    } else {
      no += 1
    }
    return { code, name, cell }
  })
  const supported = yes + unverified + todo
  return {
    key: entry.platform,
    vendor,
    code: platform,
    vendorName: vendorNameOf(vendor),
    title: platformTitleOf(entry.platform, entry.title),
    cells,
    yes,
    unverified,
    todo,
    no,
    none,
    coverage: supported ? Math.round(((yes + unverified) / supported) * 100) : 0,
    gaps
  }
}

/** 厂商页签：只列矩阵里真的出现过的厂商 */
const vendorTabs = computed(() => {
  const map = new Map<string, { vendor: string; name: string; count: number; gaps: number }>()
  for (const row of matrixRows.value) {
    const hit = map.get(row.vendor) || { vendor: row.vendor, name: row.vendorName, count: 0, gaps: 0 }
    hit.count += 1
    if (row.todo) hit.gaps += 1
    map.set(row.vendor, hit)
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
})

/** 厂商过滤后的范围（统计与页签计数用这一层，关键词只影响展示） */
const scopedRows = computed<PlatformRow[]>(() => {
  if (!vendorFilter.value) return matrixRows.value
  return matrixRows.value.filter((row) => row.vendor === vendorFilter.value)
})

/** 最终展示：关键词 + 只看有缺口 */
const visible = computed<PlatformRow[]>(() => {
  const word = keyword.value.trim().toLowerCase()
  return scopedRows.value.filter((row) => {
    if (onlyGap.value && !row.todo) return false
    if (!word) return true
    if (row.title.toLowerCase().includes(word) || row.key.toLowerCase().includes(word)) return true
    // 能力名也参与搜索：搜「视频」应命中声明了 MEDIA 的平台
    return row.cells.some((item) => item.name.toLowerCase().includes(word))
  })
})

/** 汇总统计：按当前展示集算，筛选后数据自洽 */
const stats = computed(() => {
  const total = { yes: 0, unverified: 0, todo: 0, no: 0 }
  for (const row of visible.value) {
    total.yes += row.yes
    total.unverified += row.unverified
    total.todo += row.todo
    total.no += row.no
  }
  const supported = total.yes + total.unverified + total.todo
  return {
    ...total,
    coverage: supported ? Math.round(((total.yes + total.unverified) / supported) * 100) : 0
  }
})

/** 某平台当前展开的能力位（点同一个再点一次收起） */
const picked = reactive<Record<string, DeviceCapability | ''>>({})

function togglePick(platform: string, code: DeviceCapability): void {
  picked[platform] = picked[platform] === code ? '' : code
}

function pickedOf(platform: string): CellView | undefined {
  const code = picked[platform]
  if (!code) return undefined
  return matrixRows.value.find((row) => row.key === platform)?.cells.find((item) => item.code === code)
}

/** 缺口展开状态 */
const openGaps = reactive<Record<string, boolean>>({})

function toggleGaps(platform: string): void {
  openGaps[platform] = !openGaps[platform]
}

function supportLabel(support: CapabilitySupport): string {
  switch (support) {
    case 'YES':
      return '已验证支持'
    case 'IMPLEMENTED_UNVERIFIED':
      return '已实现未验证'
    case 'TODO':
      return '待实现'
    default:
      return '平台不具备'
  }
}

function capTitle(item: CellView): string {
  const api = item.cell.apiCount ? `（官方接口 ${item.cell.apiCount} 个）` : ''
  const note = item.cell.note ? `：${item.cell.note}` : ''
  return `${item.name} · ${supportLabel(item.cell.support)}${api}${note}`
}

function monogram(name?: string): string {
  const text = (name || '').trim()
  return text ? text.slice(0, 1) : '?'
}
</script>

<style scoped>
/* ============================================================
   平台能力矩阵：平台 × 16 个能力位
   视觉沿用「提供商」页的卡片语言（16px 圆角 / 细边 / 主色点缀），
   状态色只借用 Element 的成功 / 警告 / 信息三色，不自造皮肤。
   ============================================================ */
.pcm {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--el-text-color-primary);
}

.pcm-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pcm-search {
  width: 220px;
}

.pcm-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.pcm-toggle:hover {
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
}

.pcm-toggle__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--el-border-color);
}

.pcm-toggle.is-on {
  border-color: color-mix(in srgb, var(--el-color-warning) 45%, transparent);
  background: color-mix(in srgb, var(--el-color-warning) 9%, transparent);
  color: var(--el-color-warning-dark-2, var(--el-color-warning));
}

.pcm-toggle.is-on .pcm-toggle__dot {
  background: var(--el-color-warning);
}

.pcm-grow {
  flex: 1;
  min-width: 0;
}

.pcm-scope {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
}

/* 厂商页签：与提供商页的胶囊条同构，但更紧凑 */
.pcm-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.pcm-tab {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-bg-color);
  color: inherit;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.pcm-tab:hover {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-fill-color-light);
}

.pcm-tab.is-active {
  border-color: var(--el-color-primary-light-5);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
  font-weight: 600;
}

.pcm-tab b {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 10.5px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.pcm-tab.is-active b {
  color: var(--el-color-primary);
}

/* 有缺口的厂商：页签上直接挂一个警告点 + 平台数 */
.pcm-tab__gap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  height: 14px;
  padding: 0 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-warning) 16%, transparent);
  color: var(--el-color-warning-dark-2, var(--el-color-warning));
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
}

/* 汇总条：五段计数 + 覆盖率 */
.pcm-sum {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-large, 12px);
}

.pcm-sum__kpi {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  padding-right: 10px;
  border-right: 1px solid var(--el-border-color);
}

.pcm-sum__kpi:last-of-type {
  border-right: none;
}

.pcm-sum__kpi b {
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.pcm-sum__kpi span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.pcm-sum__kpi.is-yes b { color: var(--el-color-primary); }
.pcm-sum__kpi.is-unverified b { color: var(--el-color-primary-light-3); }
.pcm-sum__kpi.is-todo b { color: var(--el-color-warning); }
.pcm-sum__kpi.is-no b { color: var(--el-text-color-placeholder); }

.pcm-sum__meter {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.pcm-sum__label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.pcm-sum__pct {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

/* 进度条：支持度越高越接近主色，低覆盖时降到警告色，避免误读 */
.pcm-meter {
  display: block;
  flex: 1;
  min-width: 60px;
  height: 6px;
  border-radius: 999px;
  background: var(--el-fill-color-dark);
  overflow: hidden;
}

.pcm-meter.is-slim {
  height: 4px;
}

.pcm-meter i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    var(--el-color-primary-light-5),
    var(--el-color-primary)
  );
  transition: width 0.3s ease;
}

/* 图例：状态色 + 一句话口径 */
.pcm-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.pcm-lg {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.pcm-lg i {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: var(--el-border-color);
}

.pcm-lg.is-yes i { background: var(--el-color-primary); }
.pcm-lg.is-unverified i {
  background: color-mix(in srgb, var(--el-color-primary) 45%, transparent);
  outline: 1px dashed var(--el-color-primary-light-5);
  outline-offset: 1px;
}
.pcm-lg.is-todo i { background: var(--el-color-warning); }
.pcm-lg.is-no i { background: var(--el-text-color-placeholder); }
.pcm-lg.is-none i { background: transparent; border: 1px dashed var(--el-border-color); }

.pcm-legend__hint {
  margin-left: auto;
  color: var(--el-text-color-placeholder);
}

/* 平台卡片 */
.pcm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pcm-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-large, 12px);
  transition: border-color 0.15s ease;
}

.pcm-card:hover {
  border-color: var(--el-border-color-light);
}

.pcm-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  row-gap: 6px;
  min-width: 0;
}

.pcm-tile {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 700;
}

.pcm-card__titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}

.pcm-card__titles b {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pcm-card__titles code {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

.pcm-card__counts {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;
}

.pcm-cnt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  padding: 0 4px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.pcm-cnt.is-yes {
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
  color: var(--el-color-primary);
}

.pcm-cnt.is-unverified {
  background: color-mix(in srgb, var(--el-color-primary) 7%, transparent);
  color: var(--el-color-primary-light-3);
}

.pcm-cnt.is-todo {
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
  color: var(--el-color-warning-dark-2, var(--el-color-warning));
}

.pcm-cnt.is-none {
  background: transparent;
  border: 1px dashed var(--el-border-color);
  color: var(--el-text-color-placeholder);
}

.pcm-card__meter {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  width: 150px;
}

.pcm-card__meter b {
  width: 34px;
  font-size: 11px;
  font-weight: 600;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-regular);
}

.pcm-card__add {
  flex: none;
  padding: 0;
  border: 0;
  background: none;
  color: var(--el-color-primary);
  font: inherit;
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
}

.pcm-card__add:hover {
  text-decoration: underline;
}

/* 能力位：固定顺序的胶囊，状态靠底色 + 边框 + 圆点三处同时表达 */
.pcm-caps {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pcm-cap {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.pcm-cap:hover {
  border-color: var(--el-border-color);
}

.pcm-cap__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}

.pcm-cap__name {
  line-height: 1;
}

.pcm-cap__api {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 9.5px;
  font-style: normal;
  color: var(--el-text-color-placeholder);
}

.pcm-cap.is-yes {
  background: color-mix(in srgb, var(--el-color-primary) 11%, transparent);
  color: var(--el-color-primary-dark-2, var(--el-color-primary));
  border-color: color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}

.pcm-cap.is-yes .pcm-cap__dot {
  background: var(--el-color-primary);
}

.pcm-cap.is-unverified {
  background: color-mix(in srgb, var(--el-color-primary) 5%, transparent);
  color: var(--el-color-primary-light-3);
  border-color: color-mix(in srgb, var(--el-color-primary) 26%, transparent);
  border-style: dashed;
}

.pcm-cap.is-unverified .pcm-cap__dot {
  border-radius: 50%;
  background: transparent;
  border: 1px solid var(--el-color-primary-light-3);
}

.pcm-cap.is-todo {
  background: color-mix(in srgb, var(--el-color-warning) 9%, transparent);
  color: var(--el-color-warning-dark-2, var(--el-color-warning));
  border-color: color-mix(in srgb, var(--el-color-warning) 30%, transparent);
}

.pcm-cap.is-todo .pcm-cap__dot {
  background: var(--el-color-warning);
}

.pcm-cap.is-no {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
}

.pcm-cap.is-no .pcm-cap__dot {
  background: var(--el-border-color);
}

.pcm-cap.is-no .pcm-cap__name {
  text-decoration: line-through;
  text-decoration-color: var(--el-border-color);
}

/* 能力说明：点开后只在卡片内展开，不弹窗打断对比 */
.pcm-note {
  padding: 7px 9px;
  border-left: 3px solid var(--el-color-primary-light-5);
  border-radius: 4px 8px 8px 4px;
  background: var(--el-fill-color-lighter);
}

.pcm-note__head {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  font-size: 12px;
}

.pcm-note__state {
  font-size: 10.5px;
  font-weight: 600;
}

.pcm-note__state.is-yes { color: var(--el-color-primary); }
.pcm-note__state.is-unverified { color: var(--el-color-primary-light-3); }
.pcm-note__state.is-todo { color: var(--el-color-warning-dark-2, var(--el-color-warning)); }
.pcm-note__state.is-no { color: var(--el-text-color-placeholder); }

.pcm-note__api {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

.pcm-note__text {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--el-text-color-regular);
}

/* 缺口清单 */
.pcm-gaps {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pcm-gaps__btn {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  color: var(--el-color-warning-dark-2, var(--el-color-warning));
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
}

.pcm-gaps__btn:hover {
  text-decoration: underline;
}

.pcm-gaps__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0 0 0 2px;
  list-style: none;
}

.pcm-gaps__list li {
  display: flex;
  gap: 8px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.pcm-gaps__list b {
  flex: none;
  min-width: 82px;
  font-weight: 600;
  color: var(--el-color-warning-dark-2, var(--el-color-warning));
}

.pcm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 40px 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-large, 12px);
}

.pcm-empty__title {
  font-size: 13px;
  font-weight: 600;
}

.pcm-empty__text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 640px) {
  .pcm-search {
    width: 100%;
  }

  .pcm-card__meter {
    width: 96px;
  }

  .pcm-gaps__list li {
    flex-direction: column;
    gap: 1px;
  }

  .pcm-gaps__list b {
    min-width: 0;
  }
}
</style>

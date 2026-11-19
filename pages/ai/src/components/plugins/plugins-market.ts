/**
 * 插件市场共享状态（V1+V2 融合稿）：
 * PluginsPage 作为市场壳，持有四个市场的筛选状态与真实计数；
 * 各市场组件挂载后把类目 / 状态分桶回填进来，供左侧索引栏与 Bento 卡片展示。
 * 这里只承载展示与交互状态，不实现任何后端业务规则。
 */
import { reactive } from 'vue'

export type MarketKey = 'characters' | 'skills' | 'mcp' | 'local-tools'

export type MarketStatusTone = 'success' | 'warning' | 'info' | 'neutral'

/** 市场排序方式：default = 目录原序；name = 按名称字典序 */
export type MarketSort = 'default' | 'name'

export interface MarketStatusBucket {
  /** 状态键（选中后写入 slice.status） */
  key: string
  /** 展示名 */
  label: string
  /** 该状态下的真实条数（由组件从后端数据统计） */
  count: number
  /** 状态点颜色档 */
  tone: MarketStatusTone
}

export interface MarketSlice {
  /** 搜索关键词（页头搜索框双向绑定） */
  keyword: string
  /** 当前类目（'' = 全部） */
  category: string
  /** 当前状态（'' = 全部，取值为某个 MarketStatusBucket.key） */
  status: string
  /** 排序方式（MarketToolbar 写入，各市场列表 computed 消费） */
  sort: MarketSort
  /** 市场条目总数（真实计数） */
  total: number
  /** 类目清单（不含「全部」） */
  categories: string[]
  /** 各类目条数 */
  categoryCounts: Record<string, number>
  /** 状态分桶（含真实计数） */
  statuses: MarketStatusBucket[]
  /** 左侧索引栏是否隐藏（如 MCP 管理视图） */
  railHidden: boolean
}

function makeSlice(): MarketSlice {
  return {
    keyword: '',
    category: '',
    status: '',
    sort: 'default',
    total: 0,
    categories: [],
    categoryCounts: {},
    statuses: [],
    railHidden: false,
  }
}

export const pluginsMarket = reactive<Record<MarketKey, MarketSlice>>({
  characters: makeSlice(),
  skills: makeSlice(),
  mcp: makeSlice(),
  'local-tools': makeSlice(),
})

/** 组件回填本市场的类目 / 状态 / 计数（浅合并，组件持真实数据口径） */
export function syncMarketSlice(key: MarketKey, patch: Partial<MarketSlice>) {
  Object.assign(pluginsMarket[key], patch)
}

export interface HighlightSegment {
  /** 分段文本 */
  text: string
  /** 是否命中搜索关键词（渲染为 <mark class="pm-hl">） */
  hit: boolean
}

/**
 * 按关键词把文本切分成「命中 / 未命中」分段，供模板做无 v-html 的安全高亮。
 * 关键词为空返回单段原文；大小写不敏感；全部命中位置都标出。
 */
export function splitHighlight(text: string, keyword: string): HighlightSegment[] {
  const src = text ?? ''
  const kw = (keyword ?? '').trim()
  if (!kw) return src ? [{ text: src, hit: false }] : []
  const lowerSrc = src.toLowerCase()
  const lowerKw = kw.toLowerCase()
  const segments: HighlightSegment[] = []
  let from = 0
  while (from <= src.length) {
    const idx = lowerSrc.indexOf(lowerKw, from)
    if (idx === -1) {
      if (from < src.length) segments.push({ text: src.slice(from), hit: false })
      break
    }
    if (idx > from) segments.push({ text: src.slice(from, idx), hit: false })
    segments.push({ text: src.slice(idx, idx + kw.length), hit: true })
    from = idx + kw.length
  }
  return segments
}

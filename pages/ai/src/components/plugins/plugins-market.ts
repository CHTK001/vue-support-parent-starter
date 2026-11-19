/**
 * 插件市场共享状态（V1+V2 融合稿）：
 * PluginsPage 作为市场壳，持有四个市场的筛选状态与真实计数；
 * 各市场组件挂载后把类目 / 状态分桶回填进来，供左侧索引栏与 Bento 卡片展示。
 * 这里只承载展示与交互状态，不实现任何后端业务规则。
 */
import { reactive } from 'vue'

export type MarketKey = 'characters' | 'skills' | 'mcp' | 'local-tools'

export type MarketStatusTone = 'success' | 'warning' | 'info' | 'neutral'

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

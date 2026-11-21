/**
 * 插件市场共享状态（V1+V2 融合稿）：
 * PluginsPage 作为市场壳，持有四个市场的筛选状态与真实计数；
 * 各市场组件挂载后把类目 / 状态分桶回填进来，供左侧索引栏与 Bento 卡片展示。
 * 这里只承载展示与交互状态，不实现任何后端业务规则。
 */
import { reactive } from 'vue'

export type MarketKey = 'characters' | 'skills' | 'mcp' | 'local-tools'

export type MarketStatusTone = 'success' | 'warning' | 'info' | 'neutral'

/** 市场排序方式：default = 目录原序；name = 按名称字典序；pinned = 收藏优先（组内保持原序） */
export type MarketSort = 'default' | 'name' | 'pinned'

const MARKET_STORE_PREFIX = 'plugins-market:'

/** 从 localStorage 恢复字符串集合（折叠分组等本地交互态） */
export function loadStoredSet(market: MarketKey, kind: 'collapsed' | 'favorites'): Set<string> {
  try {
    const raw = localStorage.getItem(`${MARKET_STORE_PREFIX}${kind}:${market}`)
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr.filter((v: unknown) => typeof v === 'string') : [])
  } catch {
    return new Set()
  }
}

export function saveStoredSet(market: MarketKey, kind: 'collapsed' | 'favorites', set: Set<string>) {
  try {
    localStorage.setItem(`${MARKET_STORE_PREFIX}${kind}:${market}`, JSON.stringify([...set]))
  } catch { /* 存储不可用（隐私模式等）时静默降级为会话内状态 */ }
}

/** 各市场收藏集合（本地偏好，仅影响展示排序，不实现任何后端业务）。
 *  用 reactive 包装 Set：组件 computed 读取 has() 建立依赖，切换后列表/星标同步刷新。 */
const favoriteSets: Record<MarketKey, Set<string>> = {
  characters: reactive(loadStoredSet('characters', 'favorites')),
  skills: reactive(loadStoredSet('skills', 'favorites')),
  mcp: reactive(loadStoredSet('mcp', 'favorites')),
  'local-tools': reactive(loadStoredSet('local-tools', 'favorites')),
}

export function isFavorite(market: MarketKey, id: string): boolean {
  return favoriteSets[market].has(id)
}

/** 切换收藏态，返回切换后是否收藏 */
export function toggleFavorite(market: MarketKey, id: string): boolean {
  const set = favoriteSets[market]
  if (set.has(id)) set.delete(id)
  else set.add(id)
  saveStoredSet(market, 'favorites', set)
  return set.has(id)
}

/**
 * 市场列表统一排序：name = 名称字典序；pinned = 收藏优先（稳定分区，组内保持目录原序）。
 * 四个市场共用，避免各写一份比较逻辑。
 */
export function sortMarketList<T>(
  market: MarketKey,
  list: T[],
  mode: MarketSort,
  idOf: (item: T) => string,
  nameOf: (item: T) => string,
): T[] {
  if (mode === 'name') {
    return [...list].sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'zh-Hans-CN'))
  }
  if (mode === 'pinned') {
    return [...list].sort((a, b) => Number(isFavorite(market, idOf(b))) - Number(isFavorite(market, idOf(a))))
  }
  return list
}

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
  /** 我的托盘（左栏常驻清单；目前仅助手市场回填「已召唤/自建」角色） */
  tray?: MarketTrayItem[]
}

/** 托盘条目：轻量展示字段，由各市场组件从真实数据映射 */
export interface MarketTrayItem {
  /** 唯一键（同时作 v-for key） */
  id: string
  /** 展示名 */
  title: string
  /** 类目（小字说明） */
  category?: string
  /** 头像地址（空则由 CardAvatar 按名字渲染首字） */
  avatar?: string
  /** 关联角色记录 id（自建角色才有；有值时托盘点按直达对话） */
  roleId?: string
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

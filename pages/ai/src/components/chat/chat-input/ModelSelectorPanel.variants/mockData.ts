/**
 * 模型选择面板 — 5 个设计变体的共享 mock 数据。
 * 仅供 Phase 2 探索使用，Phase 3 选定后删除。
 */

export interface MockModel {
  id: string
  modelName: string
  provider: string
  /** 供应商 logo 文件名（/images/models/ 下） */
  logo: string
  description: string
  /** 上下文窗口（token） */
  contextWindow: number
  /** 单次输出上限（token） */
  maxOutput: number
  /** 输入价 USD / 1M token */
  priceIn: number
  /** 输出价 USD / 1M token */
  priceOut: number
  /** 缓存读价 USD / 1M token */
  priceCacheRead: number
  /** 缓存写价 USD / 1M token */
  priceCacheWrite: number
  /** 输入模态 */
  inputModalities: string[]
  /** 输出模态 */
  outputModalities: string[]
  /** 附加特性 */
  features: string[]
  /** 知识截止 */
  knowledgeCutoff: string
  /** 发布时间 */
  releaseDate: string
  isFavorite?: boolean
}

export const MOCK_MODELS: MockModel[] = [
  {
    id: 'openai:gpt-5',
    modelName: 'gpt-5',
    provider: 'OpenAI',
    logo: 'OpenAI.svg',
    description: '新一代旗舰通用模型，推理与多模态全面升级',
    contextWindow: 400000,
    maxOutput: 128000,
    priceIn: 1.25,
    priceOut: 10,
    priceCacheRead: 0.125,
    priceCacheWrite: 1.875,
    inputModalities: ['text', 'image', 'audio', 'video'],
    outputModalities: ['text'],
    features: ['tools', 'thinking', 'web-search'],
    knowledgeCutoff: '2026-06',
    releaseDate: '2026-04-08',
    isFavorite: true,
  },
  {
    id: 'anthropic:claude-4.5',
    modelName: 'claude-4.5-sonnet',
    provider: 'Anthropic',
    logo: 'claude.svg',
    description: '长程智能体任务最强选手，代码与文档理解出色',
    contextWindow: 200000,
    maxOutput: 64000,
    priceIn: 3,
    priceOut: 15,
    priceCacheRead: 0.3,
    priceCacheWrite: 3.75,
    inputModalities: ['text', 'image', 'file'],
    outputModalities: ['text'],
    features: ['tools', 'thinking'],
    knowledgeCutoff: '2025-08',
    releaseDate: '2026-05-01',
    isFavorite: true,
  },
  {
    id: 'google:gemini-3-pro',
    modelName: 'gemini-3-pro',
    provider: 'Google',
    logo: 'Google.svg',
    description: '原生多模态百万上下文，深度推理与检索一体',
    contextWindow: 1000000,
    maxOutput: 8192,
    priceIn: 1.25,
    priceOut: 5,
    priceCacheRead: 0.3125,
    priceCacheWrite: 0,
    inputModalities: ['text', 'image', 'audio', 'video', 'file'],
    outputModalities: ['text'],
    features: ['tools', 'thinking', 'web-search'],
    knowledgeCutoff: '2025-12',
    releaseDate: '2026-07-16',
  },
  {
    id: 'deepseek:deepseek-r2',
    modelName: 'deepseek-r2',
    provider: 'DeepSeek',
    logo: 'DeepSeek.svg',
    description: '高性价比推理模型，开源可自托管',
    contextWindow: 128000,
    maxOutput: 32768,
    priceIn: 0.55,
    priceOut: 2.19,
    priceCacheRead: 0.14,
    priceCacheWrite: 0,
    inputModalities: ['text'],
    outputModalities: ['text'],
    features: ['tools', 'thinking'],
    knowledgeCutoff: '2025-06',
    releaseDate: '2026-02-10',
  },
  {
    id: 'zhipu:glm-5',
    modelName: 'glm-5',
    provider: '智谱AI',
    logo: 'zhipu.svg',
    description: '中文场景深度优化，长文档与代码兼备',
    contextWindow: 128000,
    maxOutput: 96000,
    priceIn: 0.6,
    priceOut: 2.4,
    priceCacheRead: 0.15,
    priceCacheWrite: 0,
    inputModalities: ['text', 'image', 'file'],
    outputModalities: ['text'],
    features: ['tools', 'thinking'],
    knowledgeCutoff: '2026-01',
    releaseDate: '2026-03-22',
  },
  {
    id: 'kimi:kimi-k2',
    modelName: 'kimi-k2',
    provider: 'Kimi',
    logo: 'kimi.png',
    description: '超长上下文王者，百万 token 内精准定位',
    contextWindow: 131072,
    maxOutput: 8192,
    priceIn: 2,
    priceOut: 10,
    priceCacheRead: 0.4,
    priceCacheWrite: 2.5,
    inputModalities: ['text', 'image', 'file'],
    outputModalities: ['text'],
    features: ['tools', 'web-search'],
    knowledgeCutoff: '2025-11',
    releaseDate: '2025-07-11',
  },
  {
    id: 'mock:agentic-planner',
    modelName: 'planner-x',
    provider: 'Agentic',
    logo: '',
    description: '规划型 Agent 专用小模型（无 logo 的兜底示例）',
    contextWindow: 32000,
    maxOutput: 4096,
    priceIn: 0.1,
    priceOut: 0.4,
    priceCacheRead: 0,
    priceCacheWrite: 0,
    inputModalities: ['text'],
    outputModalities: ['text'],
    features: ['tools'],
    knowledgeCutoff: '2024-10',
    releaseDate: '2025-01-15',
  },
]

/** 模型图标路径（与 modelUtils.getModelAvatarPath 相同的口径） */
export function mockLogoPath(logo: string, base = '/images/models/'): string | null {
  if (!logo) return null
  return `${base}${logo}`
}

/** 价格格式化：US$0.50；0 → 免费 */
export function fmtPrice(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  if (v === 0) return '免费'
  return `US$${v.toFixed(2)}`
}

/** 上下文格式化：128K / 1M */
export function fmtContext(n: number | null | undefined): string {
  if (!n || n <= 0) return ''
  if (n >= 1000000) return `${Math.round(n / 1000000)}M`
  if (n >= 1000) return `${Math.round(n / 1000)}K`
  return String(n)
}

/** 日期格式化：2026-04-08 → 2026年4月8日 */
export function fmtDate(v: string | null | undefined): string {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}


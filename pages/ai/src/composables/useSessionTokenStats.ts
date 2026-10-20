import { ref, watch, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useSessionStore } from '@/stores/session'
import { apiService } from '@/services/ApiService'

export interface TokenBreakdown {
  systemPrompt: number
  summary: number
  userPrompt: number
  history: number
  tools: number
}

export interface TokenStatsData {
  usedTokens: number
  /**
   * 上下文窗口（分母），不是「累计消耗」。
   *
   * 后端 `GET /sessions/{id}/token-stats` 同时返回 `effectiveContextWindow`（窗口）
   * 与 `totalTokens`（max(已用, 累计 prompt+completion)，是累计消耗）。两个字段名
   * 长得很像，早年直接拿 `totalTokens` 当窗口用，于是占用率被算成个位数百分比、
   * 「已用 / 窗口」显示成一个巨大的分母。这里统一由 normalizeTokenStats 归一化成窗口。
   */
  totalTokens: number
  remainingTokens: number
  percentage: number
  modelName: string
  messageCount: number
  breakdown: TokenBreakdown
  /** 累计输入 token（会话级，用于 Token 用量卡的口径对齐） */
  promptTokens?: number
  /** 累计输出 token */
  completionTokens?: number
}

const EMPTY_BREAKDOWN: TokenBreakdown = {
  systemPrompt: 0,
  summary: 0,
  userPrompt: 0,
  history: 0,
  tools: 0,
}

/**
 * 把后端响应归一化成界面可直接用的形状。
 *
 * 后端可能给三种形态：① 只给窗口和已用（settings 里有快照）；
 * ② 只给累计 prompt/completion（没有快照）；③ 字段缺失。这里统一兜住，
 * 并保证 `percentage` 与 `remainingTokens` 始终自洽 —— 否则界面会算出
 * NaN / 负数，或者把「累计消耗」当窗口算出离谱的占用率。
 */
function normalizeTokenStats(raw: any): TokenStatsData {
  const usedTokens = Number(raw?.usedTokens) || 0
  // 窗口优先取 effectiveContextWindow；字段缺失时退回 totalTokens（老后端只有一个字段）
  const contextWindow = Number(raw?.effectiveContextWindow) || Number(raw?.totalTokens) || 0
  const percentage = contextWindow > 0
    ? Math.min(100, Math.max(0, (usedTokens / contextWindow) * 100))
    : 0

  return {
    usedTokens,
    totalTokens: contextWindow,
    remainingTokens: Math.max(0, contextWindow - usedTokens),
    percentage,
    modelName: raw?.modelName || '',
    messageCount: Number(raw?.messageCount) || 0,
    breakdown: { ...EMPTY_BREAKDOWN, ...(raw?.breakdown || {}) },
    promptTokens: Number(raw?.promptTokens) || 0,
    completionTokens: Number(raw?.completionTokens) || 0,
  }
}

const tokenStats = ref<TokenStatsData | null>(null)
const loading = ref(false)
let currentSessionId: string | null = null

/**
 * SSE 上下文统计已更新标志
 * 当 finish 事件携带 contextStats 时置为 true，
 * debouncedRefresh 检测到此标志后跳过 REST 刷新。
 */
let sseUpdated = false

/**
 * 从 SSE finish 事件注入上下文统计
 *
 * 后端在 finish 事件中携带轻量上下文统计（usedTokens / effectiveContextWindow），
 * 前端直接更新环形指示器，无需流式结束后再发起 REST 请求重建上下文。
 * 详细 breakdown 仍由弹窗按需通过 REST 获取。
 *
 * 同时把快照落库到会话（PUT /sessions/{id}/token-stats），使页面刷新后
 * 仍能从后台恢复上下文占用率，而不是必须再对话一轮。
 */
export function updateTokenStatsFromSSE(
  stats: {
    usedTokens: number
    effectiveContextWindow: number
    /** token 构成（系统提示词/摘要/用户输入/历史消息/工具定义），后端按估算下发 */
    breakdown?: Partial<TokenBreakdown> | null
  },
  sessionId?: string | null,
) {
  sseUpdated = true
  // 后端只在拿得到模型窗口时才下发 effectiveContextWindow；
  // 缺省时退回上一次已知窗口，避免一次「未登记模型」的轮次把占用率打回 0。
  const window = Number(stats.effectiveContextWindow) || tokenStats.value?.totalTokens || 0
  const used = Number(stats.usedTokens) || 0
  const breakdown: TokenBreakdown = { ...EMPTY_BREAKDOWN, ...(stats.breakdown || {}) }

  const sid = sessionId ?? currentSessionId
  if (sid) {
    apiService
      .saveSessionTokenStats(sid, {
        usedTokens: used,
        effectiveContextWindow: window,
        // 构成同样落库：不存的话刷新后「上下文已用」卡片只剩占用条，明细整块消失
        breakdown,
      })
      .catch((error: any) => {
        console.warn('[useSessionTokenStats] 上下文快照落库失败:', error)
      })
  }
  // 窗口为 0 时不能做除法：直接给 0，否则会算出 Infinity/NaN 一路传到界面
  const percentage = window > 0
    ? Math.min(100, Math.max(0, (used / window) * 100))
    : 0
  tokenStats.value = {
    usedTokens: used,
    totalTokens: window,
    remainingTokens: Math.max(0, window - used),
    percentage,
    modelName: tokenStats.value?.modelName || '',
    messageCount: tokenStats.value?.messageCount || 0,
    breakdown,
  }
}

/**
 * 会话级 Token 统计共享状态
 *
 * 模块级 ref 确保所有调用方共享同一份数据，
 * 谁 fetch 了大家都更新，避免按钮和弹窗各管各的。
 */
export function useSessionTokenStats(sessionId: Ref<string | null>) {
  const sessionStore = useSessionStore()

  /**
   * 从 API 获取 Token 统计
   */
  async function fetchTokenStats() {
    const sid = sessionId.value
    if (!sid) return
    loading.value = true
    try {
      tokenStats.value = normalizeTokenStats(await apiService.fetchSessionTokenStats(sid))
      currentSessionId = sid
    } catch (error: any) {
      console.error('[useSessionTokenStats] 加载 Token 统计失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 流结束后自动刷新（防抖 1s）
   * 若 SSE finish 已携带 contextStats，则跳过 REST 刷新
   */
  const debouncedRefresh = useDebounceFn(() => {
    if (!sessionId.value) return
    if (sseUpdated) {
      sseUpdated = false
      return
    }
    fetchTokenStats()
  }, 1000)

  watch(
    () => (sessionId.value ? sessionStore.sessionIsStreaming(sessionId.value) : false),
    (isStreaming, wasStreaming) => {
      if (wasStreaming && !isStreaming) {
        debouncedRefresh()
      }
    },
  )

  // sessionId 变化时重新获取
  watch(sessionId, (newId) => {
    if (newId) {
      // 如果已有同 session 的数据不再重复获取（按钮需手动刷新时可用）
      if (currentSessionId !== newId) {
        // 立即清除旧数据，避免短暂显示上一个会话的进度
        tokenStats.value = null
        fetchTokenStats()
      }
    } else {
      tokenStats.value = null
    }
  })

  return {
    tokenStats,
    loading,
    fetchTokenStats,
  }
}

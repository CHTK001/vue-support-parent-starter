import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiService } from '@/services/ApiService'
import type { GoalDto, GoalState } from '@/services/modules/goal.api'

/** 本地持久化键：后端端点未上线时目标仍可跨刷新保留 */
const STORAGE_KEY = 'ai-guada:session-goals:v1'

/**
 * 目标模式的默认令牌预算。
 *
 * 与工具侧 goal 模式的 `goalTokenBudget` 同义：计数器显示「已用 / 预算」，
 * 后端未下发预算时用它兜底（5000 是产品口径的默认档）。
 */
export const DEFAULT_GOAL_TOKEN_BUDGET = 5000

/**
 * 目标状态的中文标签，与后端 GoalStatus 的文案保持同一套，避免两端各写一份。
 */
const STATE_LABELS: Record<GoalState, string> = {
  PENDING: '待开始',
  RUNNING: '进行中',
  PAUSED: '已暂停',
  COMPLETED: '已完成',
  FAILED: '失败',
  CANCELED: '已取消',
}

/**
 * 令牌数格式化为带 K / M 单位的可读文本，与后端 GoalStatus.formatTokens 对齐。
 *
 * @param tokens 令牌数
 * @returns 如 `717K 令牌` / `1.2M 令牌` / `512 令牌`
 */
export function formatTokens(tokens: number): string {
  const value = Number.isFinite(tokens) ? Math.max(0, tokens) : 0
  if (value < 1000) {
    return `${value} 令牌`
  }
  if (value < 1_000_000) {
    return `${trimZero(value / 1000)}K 令牌`
  }
  return `${trimZero(value / 1_000_000)}M 令牌`
}

/**
 * 令牌数格式化为计数器口径：一万以内原样，更大用 K，百万级用 M。
 *
 * 与 formatTokens 的区别是不带「令牌」后缀 —— 计数器里写 `27/5000`，
 * 预算 5000 这种四位数也要原样显示，不能被压成 `5K`。
 *
 * @param tokens 令牌数
 * @returns 如 `27` / `5000` / `12K` / `3M`
 */
export function formatTokenCounter(tokens: number): string {
  const value = Number.isFinite(tokens) ? Math.max(0, Math.floor(tokens)) : 0
  if (value < 10_000) {
    return String(value)
  }
  if (value < 1_000_000) {
    return `${trimZero(value / 1000)}K`
  }
  return `${trimZero(value / 1_000_000)}M`
}

/**
 * 保留一位小数并去掉多余的 `.0`。
 *
 * @param value 数值
 * @returns 形如 `717` 或 `1.2`
 */
function trimZero(value: number): string {
  const text = value.toFixed(1)
  return text.endsWith('.0') ? text.slice(0, -2) : text
}

/**
 * 从 localStorage 读取全部目标。
 *
 * @returns 会话标识到目标的映射；损坏数据按空处理
 */
function loadAll(): Record<string, GoalDto> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, GoalDto>) : {}
  } catch {
    return {}
  }
}

/**
 * 写回 localStorage；失败（隐私模式/配额）不影响内存态。
 *
 * @param all 全部目标
 */
function saveAll(all: Record<string, GoalDto>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // 存储不可用时保持内存态即可
  }
}

/**
 * 会话目标 store：前后端目标的唯一入口。
 *
 * <p>写入策略是「本地先落地，再尝试后端」：后端端点尚未上线时调用会 404，
 * 此时保留本地态并继续可用；后端上线后同一份代码自动切换为服务端为准。
 */
export const useGoalStore = defineStore('goal', () => {
  const goals = ref<Record<string, GoalDto>>(loadAll())

  /**
   * 某会话当前的目标。
   *
   * @param sessionId 会话标识
   * @returns 目标或 null
   */
  const goalOf = computed(() => (sessionId?: string | null): GoalDto | null => {
    if (!sessionId) {
      return null
    }
    return goals.value[sessionId] ?? null
  })

  /**
   * 某会话是否处于「目标进行中」（输入框据此激活目标）。
   *
   * @param sessionId 会话标识
   * @returns 进行中或已暂停返回 true
   */
  const isActive = computed(() => (sessionId?: string | null): boolean => {
    const goal = goalOf.value(sessionId)
    return !!goal && (goal.state === 'PENDING' || goal.state === 'RUNNING' || goal.state === 'PAUSED')
  })

  /**
   * 写入（覆盖）某会话的目标。
   *
   * @param sessionId 会话标识
   * @param goal      目标
   */
  function put(sessionId: string, goal: GoalDto): void {
    const prev = goals.value[sessionId]
    // 后端 DTO 不带预算 / 基线（那是前端口径）：合并时保留本地值，别被一次远端回包清掉。
    const merged: GoalDto = {
      ...goal,
      sessionId,
      tokenBudget: goal.tokenBudget ?? prev?.tokenBudget ?? DEFAULT_GOAL_TOKEN_BUDGET,
      tokensBase: goal.tokensBase !== undefined ? goal.tokensBase : (prev?.tokensBase ?? null),
    }
    goals.value = { ...goals.value, [sessionId]: merged }
    saveAll(goals.value)
  }

  /**
   * 构造一个本地目标对象。
   *
   * @param sessionId 会话标识
   * @param title     标题
   * @param detail    说明
   * @param state     状态
   * @param base      参考的既有目标（保留令牌/轮次/创建时间）
   * @returns 目标对象
   */
  function localGoal(
    sessionId: string,
    title: string,
    detail: string,
    state: GoalState,
    base?: GoalDto | null,
    tokenBudget: number = DEFAULT_GOAL_TOKEN_BUDGET,
  ): GoalDto {
    // 换了标题 = 换了一个目标：令牌与轮次必须归零，否则新目标一上来就带着旧目标的用量。
    const prev = base && base.title === title ? base : null
    return {
      id: base?.id ?? `goal-${sessionId}-${Date.now()}`,
      sessionId,
      title,
      detail,
      state,
      tokensUsed: prev?.tokensUsed ?? 0,
      rounds: prev?.rounds ?? 0,
      tokenBudget,
      tokensBase: prev?.tokensBase ?? null,
      updatedAt: Date.now(),
    }
  }

  /**
   * 从后端拉取目标并合并到本地（后端无该端点时静默保留本地态）。
   *
   * @param sessionId 会话标识
   */
  async function load(sessionId: string): Promise<void> {
    try {
      const remote = await apiService.fetchGoal(sessionId)
      if (remote && remote.id) {
        put(sessionId, remote)
      }
    } catch {
      // 端点未上线 / 网络异常：保留本地态
    }
  }

  /**
   * 新建或覆盖目标（默认进入进行中）。
   *
   * @param sessionId   会话标识
   * @param title       目标标题
   * @param detail      目标说明
   * @param tokenBudget 令牌预算（默认 5000）
   */
  async function setGoal(
    sessionId: string,
    title: string,
    detail = '',
    tokenBudget: number = DEFAULT_GOAL_TOKEN_BUDGET,
  ): Promise<GoalDto> {
    const local = localGoal(sessionId, title, detail, 'RUNNING', goals.value[sessionId], tokenBudget)
    put(sessionId, local)
    try {
      const remote = await apiService.saveGoal(sessionId, { title, detail })
      if (remote && remote.id) {
        put(sessionId, remote)
        return goals.value[sessionId] ?? local
      }
    } catch {
      // 端点未上线：以本地态为准
    }
    return local
  }

  /**
   * 暂停目标。
   *
   * @param sessionId 会话标识
   */
  async function pause(sessionId: string): Promise<void> {
    const current = goals.value[sessionId]
    if (!current) {
      return
    }
    put(sessionId, { ...current, state: 'PAUSED', updatedAt: Date.now() })
    try {
      const remote = await apiService.pauseGoal(sessionId)
      if (remote && remote.id) {
        put(sessionId, remote)
      }
    } catch {
      // 保留本地态
    }
  }

  /**
   * 恢复目标。
   *
   * @param sessionId 会话标识
   */
  async function resume(sessionId: string): Promise<void> {
    const current = goals.value[sessionId]
    if (!current) {
      return
    }
    put(sessionId, { ...current, state: 'RUNNING', updatedAt: Date.now() })
    try {
      const remote = await apiService.resumeGoal(sessionId)
      if (remote && remote.id) {
        put(sessionId, remote)
      }
    } catch {
      // 保留本地态
    }
  }

  /**
   * 用会话累计令牌刷新目标的「已用」计数。
   *
   * <p>口径：目标创建后第一次拿到会话累计值时记下基线，此后
   * `已用 = 会话累计 - 基线`。这样目标加在会话中途时，计数器不会把
   * 目标之前的花费也算进来；刷新页面后基线仍在 localStorage 里，数值不跳变。</p>
   *
   * @param sessionId     会话标识
   * @param sessionTokens 会话累计令牌（prompt + completion）
   */
  function syncTokens(sessionId: string, sessionTokens: number): void {
    const current = goals.value[sessionId]
    if (!current || !Number.isFinite(sessionTokens)) {
      return
    }
    const total = Math.max(0, Math.floor(sessionTokens))
    const base = current.tokensBase ?? total
    const used = Math.max(0, total - base)
    if (current.tokensBase === base && current.tokensUsed === used) {
      return
    }
    put(sessionId, { ...current, tokensBase: base, tokensUsed: used, updatedAt: Date.now() })
  }

  /**
   * 取消目标：用户已明确要求「整个目标条销毁，前后端都不保留」，
   * 因此取消后直接删除本地目标条目（含 localStorage 持久化），不再展示「已取消」。
   *
   * @param sessionId 会话标识
   * @param reason    取消原因
   */
  async function cancel(sessionId: string, reason = '用户取消'): Promise<void> {
    remove(sessionId)
    try {
      await apiService.cancelGoal(sessionId, reason)
    } catch {
      // 本地已销毁：后端端点缺失也不影响
    }
  }

  /**
   * 彻底删除某会话的本地目标（目标条销毁：内存 + localStorage 都不要了）。
   *
   * @param sessionId 会话标识
   */
  function remove(sessionId: string): void {
    if (!sessionId || !(sessionId in goals.value)) {
      return
    }
    const next = { ...goals.value }
    delete next[sessionId]
    goals.value = next
    saveAll(next)
  }

  /**
   * 目标状态中文标签。
   *
   * @param state 状态
   * @returns 中文标签
   */
  function stateLabel(state: GoalState): string {
    return STATE_LABELS[state] ?? state
  }

  return {
    goals,
    goalOf,
    isActive,
    load,
    setGoal,
    pause,
    resume,
    syncTokens,
    cancel,
    remove,
    stateLabel,
    formatTokens,
  }
})

/**
 * 告警实时通道的降级决策。
 *
 * <p>抽成纯函数的原因：通道选择直接决定「告警能不能收到」，是这条链路里
 * 唯一值得单独钉死的规则。三个输入（SSE 是否连上、socket 是否可用、
 * 是否已过建连窗口）决定了当前该走哪条通道。</p>
 *
 * <p>优先级：SSE > socket > 轮询。SSE 走 Servlet 长连接，不依赖消息队列与
 * socket 组件；socket 依赖这两者，任一未装配就会静默丢消息；轮询只作为
 * 「推送整体不可用」时的兜底，间隔较大，不追求实时。</p>
 */

/** 当前生效的实时通道 */
export type LiveMode = 'sse' | 'socket' | 'poll' | 'off'

/** 通道选择所需的输入 */
export interface LiveState {
  /** SSE 是否已建立（收到 ready 或 onOpen） */
  sseConnected: boolean
  /** socket 是否可用（组件存在且已订阅） */
  socketAvailable: boolean
  /** 是否已超过 SSE 建连窗口 */
  windowElapsed: boolean
}

/**
 * 决定当前应使用的通道。
 *
 * <p>建连窗口内且尚无任何通道就绪时返回 {@code off}，表示「还在建连」，
 * 不立即启动轮询——否则每次进页面都会先跑一轮多余请求。</p>
 *
 * @param state 通道状态
 * @returns 应使用的通道
 */
export function resolveLiveMode(state: LiveState): LiveMode {
  if (state.sseConnected) return 'sse'
  if (state.socketAvailable) return 'socket'
  if (state.windowElapsed) return 'poll'
  return 'off'
}

/**
 * SSE 断开后应回落到哪条通道。
 *
 * <p>SSE 断开不等于推送不可用：socket 仍可能在工作。只有 socket 也不可用时
 * 才降级到轮询。</p>
 *
 * @param socketAvailable socket 是否可用
 * @returns 回落通道
 */
export function fallbackAfterSseLost(socketAvailable: boolean): LiveMode {
  return socketAvailable ? 'socket' : 'poll'
}

/** 通道状态文案 */
export function liveModeText(mode: LiveMode, pollSeconds: number): string {
  switch (mode) {
    case 'sse': return '实时推送'
    case 'socket': return 'Socket 推送'
    case 'poll': return `轮询 ${pollSeconds}s`
    default: return '未连接'
  }
}

/** 通道状态颜色档（对应 ReTag 的 type） */
export function liveModeTone(mode: LiveMode): 'success' | 'warning' | 'danger' {
  switch (mode) {
    case 'sse': return 'success'
    case 'socket':
    case 'poll': return 'warning'
    default: return 'danger'
  }
}

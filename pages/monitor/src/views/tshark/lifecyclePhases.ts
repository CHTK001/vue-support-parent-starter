/**
 * 一次请求的生命周期分段。
 *
 * <p>后端 {@code /tshark/packets/{id}/handshake} 给的是「这条流的所有报文，按时间排好，
 * 每步标了 phase」。运维真正要的回答是另一句话：<b>这一次请求，时间花在哪一段</b>。
 * 所以这里把报文序列切成互不重叠的几段，加起来正好等于总跨度：</p>
 *
 * <pre>
 * 0 ──建连──▶ 握手完成 ──TLS──▶ 加密就绪 ──请求──▶ 请求发完 ──首字节──▶ 首个响应
 *   ──传输──▶ 响应收完 ──收尾──▶ 最后一步
 * </pre>
 *
 * <p><b>为什么分段边界取「报文时刻」而不是后端给的 rttMs / ttfbMs</b>：那两个指标只覆盖
 * 首尾两点，中间（TLS、请求发送、响应传输）没有落点，拼不出一条连续的时间轴；
 * 而 rttMs/ttfbMs 仍会单独展示，两者对不上时说明该流被截断过，本身也是有用信息。</p>
 *
 * <p>全部计算在已拉取的报文上做，不额外请求后端；纯函数，便于单测。</p>
 */
import type { TsharkStep } from './types'

/** 阶段标识 */
export type LifecyclePhaseKey = 'connect' | 'tls' | 'request' | 'wait' | 'transfer' | 'close'

/** 一个阶段的耗时与占比 */
export interface LifecyclePhase {
  key: LifecyclePhaseKey
  label: string
  ms: number
  /** 占总跨度的比例 0~1 */
  share: number
}

/** 分段结果 */
export interface LifecycleBreakdown {
  /** 总跨度（毫秒），取自最后一步的相对时间 */
  totalMs: number
  /** 按时间顺序的阶段；耗时为 0 或无法定位的阶段会被省略 */
  phases: LifecyclePhase[]
  /** 占比最大的阶段；没有可用报文时为 null */
  dominant: LifecyclePhase | null
  /** 一句话结论，直接给运维看 */
  verdict: string
}

/** 阶段中文名：与时间线上的顺序一致 */
const LABELS: Record<LifecyclePhaseKey, string> = {
  connect: '建连',
  tls: 'TLS 握手',
  request: '请求',
  wait: '首字节',
  transfer: '传输',
  close: '收尾',
}

/** 各阶段的固定顺序（渲染与结论都依赖它） */
const ORDER: LifecyclePhaseKey[] = ['connect', 'tls', 'request', 'wait', 'transfer', 'close']

/** 请求/响应这类「承载应用数据」的阶段 */
const PAYLOAD_PHASES = new Set(['HTTP', 'DATA'])

/** 取报文阶段（后端可能给空） */
function phaseOf(step: TsharkStep): string {
  return String(step.phase || 'DATA').toUpperCase()
}

/** 报文是否有载荷 */
function hasPayload(step: TsharkStep): boolean {
  return (step.length ?? 0) > 0
}

/** 是否是承载应用数据的报文 */
function isPayloadStep(step: TsharkStep): boolean {
  return PAYLOAD_PHASES.has(phaseOf(step)) && hasPayload(step)
}

/**
 * 把负值 / NaN 归零：抓包里偶有乱序（后抓到的包时间更早），
 * 直接显示负耗时会让人怀疑整个页面。
 */
function nonNegative(ms: number): number {
  return Number.isFinite(ms) && ms > 0 ? ms : 0
}

/**
 * 计算一次请求的阶段耗时。
 *
 * @param steps 按时间排好序的报文序列（后端已排好）
 * @returns 分段结果；没有报文时 totalMs 为 0、phases 为空
 */
export function buildLifecycleBreakdown(steps: TsharkStep[]): LifecycleBreakdown {
  const empty: LifecycleBreakdown = { totalMs: 0, phases: [], dominant: null, verdict: '' }
  if (!steps?.length) return empty

  // 总跨度取最大相对时间，而不是数组最后一项：后端本该按时间排序，
  // 但抓包尾部偶有乱序，用 max 才不会把总时长算短
  const totalMs = steps.reduce((max, s) => Math.max(max, nonNegative(s.relativeMs)), 0)
  if (totalMs <= 0) return empty

  // ① 建连结束：第一条「能承载应用数据」的报文（TLS / HTTP / 有载荷的 DATA）；
  //    没有应用数据时取最后一条 TCP 报文（握手真正结束的时刻），避免把尾段空闲算进建连
  const connectEndStep = steps.find(s => {
    const phase = phaseOf(s)
    if (phase === 'TLS' || phase === 'HTTP') return true
    return phase === 'DATA' && hasPayload(s)
  })
  const lastTcpStep = [...steps].reverse().find(s => phaseOf(s) === 'TCP')
  const connectEnd = connectEndStep
    ? nonNegative(connectEndStep.relativeMs)
    : (lastTcpStep ? nonNegative(lastTcpStep.relativeMs) : totalMs)

  // ② TLS 结束：TLS 阶段的最后一步之后（没有 TLS 就等于建连结束）
  const tlsSteps = steps.filter(s => phaseOf(s) === 'TLS')
  const tlsEnd = tlsSteps.length
    ? nonNegative(tlsSteps[tlsSteps.length - 1].relativeMs)
    : connectEnd

  // ③ 首轮请求：客户端发出的第一段应用数据
  const payload = steps.filter(isPayloadStep)
  const firstRequest = payload.find(s => s.fromClient)
  // ④ 首个响应：请求之后服务端发出的第一条应用数据
  const firstResponse = firstRequest
    ? payload.find(s => !s.fromClient && s.relativeMs >= firstRequest.relativeMs)
    : undefined
  // ⑤ 响应收完：下一个客户端请求之前的最后一条服务端数据
  const nextRequest = payload.find(s =>
    s.fromClient && firstResponse != null && s.relativeMs > firstResponse.relativeMs)
  const responseEnd = payload
    .filter(s => !s.fromClient && s.relativeMs >= (firstResponse?.relativeMs ?? Infinity)
      && (nextRequest == null || s.relativeMs < nextRequest.relativeMs))
    .reduce<TsharkStep | null>((last, s) => (last == null || s.relativeMs > last.relativeMs ? s : last), null)

  /**
   * 逐段取「结束边界 - 前一个边界」，保证各段首尾相接、总和等于总跨度：
   * 某一段缺失时直接用上一个边界顶上（该段为 0），不会凭空多出或漏掉时间。
   */
  const connectBoundary = connectEnd
  const tlsBoundary = Math.max(tlsEnd, connectBoundary)
  const requestBoundary = firstRequest
    ? Math.max(firstRequest.relativeMs, tlsBoundary)
    : tlsBoundary
  const responseStartBoundary = firstResponse
    ? Math.max(firstResponse.relativeMs, requestBoundary)
    : requestBoundary
  const responseEndBoundary = responseEnd
    ? Math.max(responseEnd.relativeMs, responseStartBoundary)
    : responseStartBoundary

  // ⑥ 收尾开始：最后一条响应之后即视为收尾（含连接关闭与尾段空闲）
  const closeStart = Math.min(totalMs, responseEndBoundary)

  const raw: Record<LifecyclePhaseKey, number> = {
    connect: nonNegative(connectBoundary),
    tls: nonNegative(tlsBoundary - connectBoundary),
    request: nonNegative(requestBoundary - tlsBoundary),
    wait: nonNegative(responseStartBoundary - requestBoundary),
    transfer: nonNegative(responseEndBoundary - responseStartBoundary),
    close: nonNegative(totalMs - closeStart),
  }

  // 没有 TLS 报文时该段必然是 0，直接不展示，避免运维以为「TLS 0ms」
  const phases: LifecyclePhase[] = ORDER
    .filter(key => !(key === 'tls' && tlsSteps.length === 0))
    .map(key => ({
      key,
      label: LABELS[key],
      ms: Math.round(raw[key]),
      share: totalMs > 0 ? Math.min(1, raw[key] / totalMs) : 0,
    }))
    .filter(phase => phase.ms > 0 || phase.key === 'connect')

  const dominant = phases.reduce<LifecyclePhase | null>(
    (max, phase) => (max == null || phase.ms > max.ms ? phase : max), null)

  return {
    totalMs: Math.round(totalMs),
    phases,
    dominant,
    verdict: verdictOf(dominant, phases, totalMs),
  }
}

/**
 * 生成一句话结论。
 *
 * @param dominant 占比最大的阶段
 * @param phases   全部阶段
 * @param totalMs  总跨度
 * @returns 面向运维的结论文案
 */
function verdictOf(
  dominant: LifecyclePhase | null,
  phases: LifecyclePhase[],
  totalMs: number,
): string {
  if (!dominant || dominant.ms <= 0 || totalMs <= 0) return ''
  const percent = Math.round(dominant.share * 100)
  // 占比不到四成时说「主要」会误导：说明时间比较分散
  if (percent < 40) {
    return `耗时分散，没有单一瓶颈（最长的是「${dominant.label}」${percent}%）`
  }
  const hint: Record<LifecyclePhaseKey, string> = {
    connect: '网络往返偏慢，先看链路延迟与目标端口',
    tls: '握手偏慢，检查证书链、TLS 版本与现场密钥交换开销',
    request: '客户端发送请求偏慢，多半是请求体过大或客户端 CPU / 带宽受限',
    wait: '服务端处理与首包来回占了大头，重点查应用处理与后端依赖',
    transfer: '响应体传输耗时最多，看带宽、报文重传与响应大小',
    close: '请求早已完成，收尾阶段拖长（连接复用 / FIN 慢 / 抓包尾段空闲）',
  }
  return `时间主要花在「${dominant.label}」（${percent}%）：${hint[dominant.key]}`
}

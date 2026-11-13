import { computed, type ComputedRef, type Ref } from 'vue';

/**
 * 会话级「轮次 / 步数 / 耗时 / Token / 速度」聚合。
 *
 * 为什么要单独抽出来：原先 SessionStatusPanel（会话工作状态面板）和
 * SessionStatsBar（底部状态条）各写了一份聚合逻辑，口径已经不一致了 ——
 * 面板用 `completion / 总耗时` 当速度，底部条用 `completion / 解码窗口`，
 * 同一个会话两处能差出 30% 以上；usage 的取值路径也不同（面板只看
 * message.metadata，底部条还看 content.metadata，于是流式中的会话
 * 面板显示 0、底部条却有数）。
 *
 * 这里统一成一份，两边都从这里取，保证「同一个会话，同一个数」。
 */

export interface TurnStats {
  /** 轮数：role=user 的消息数 */
  rounds: number;
  /** 步数：各 content.metadata.toolCalls 数量之和 */
  steps: number;
  /** 输入 token 合计（含缓存命中部分） */
  prompt: number;
  /** 输出 token 合计 */
  completion: number;
  /** 总 token 合计 */
  total: number;
  /** 缓存读取（命中）token 合计，是 prompt 的子集 */
  cached: number;
  /** 未缓存输入 = prompt - cached，夹到 >= 0 */
  uncachedInput: number;
  /** 助手消息总耗时合计 */
  duration: number;
  /** 工具执行耗时合计（仅流式期间采集，历史消息为 0） */
  toolDuration: number;
  /** 模型耗时 = duration - toolDuration */
  modelDuration: number;
  /** 首 token 耗时合计（用于从解码窗口里扣掉） */
  ttftSum: number;
  /** 首 token 耗时均值；无任何样本时为 0 */
  ttftAvg: number;
  /** 输出速度（tok/s）= completion / 解码窗口 */
  tokensPerSecond: number;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * 流式中的输出 token 估算（只在 usage 还没回来的那一轮用）。
 *
 * <p>与后端 {@code AiUsage.tokensPerSecond()} 的差异只存在于「本轮还没结束」的
 * 这段时间：那时 token 数根本不存在，先用字符数估一个速率让数字动起来；
 * usage 一到就切换到精确值，结束后的读数与后端完全一致。</p>
 *
 * <p>估算口径：CJK 字符按 1 token，其余按 4 字符 1 token。</p>
 */
function estimateTokens(text: string): number {
  if (!text) return 0;
  let cjk = 0;
  let other = 0;
  for (const ch of text) {
    if (/[\u3400-\u9fff\uf900-\ufaff]/.test(ch)) cjk += 1;
    else other += 1;
  }
  return cjk + Math.round(other / 4);
}

/** 该助手消息是否仍在流式生成中 */
function isStreamingMessage(message: any): boolean {
  if (message?.state?.isStreaming === true) return true;
  return (message?.contents || []).some((c: any) => c?.state?.isStreaming === true);
}

/** 一条助手消息的正文（用于流式期间的 token 估算） */
function textOf(message: any): string {
  return (message?.contents || [])
    .map((c: any) => (typeof c?.content === 'string' ? c.content : ''))
    .join('');
}

/**
 * 取一条助手消息的 usage。
 *
 * 历史消息的 usage 在 message.metadata 与 content.metadata 各有一份
 * （见 AiSessionController#messages），优先 message 级；流式期间只落在 content 级，
 * 所以两级都要看，否则「正在跑的会话」会一直显示 0。
 */
function usageOf(message: any): any {
  const direct = message?.metadata?.usage;
  if (direct) return direct;

  for (const content of message?.contents || []) {
    const nested = content?.metadata?.usage;
    if (nested) return nested;
  }
  return null;
}

/**
 * 纯函数版本：给不需要响应式的场合（测试、导出）复用。
 */
export function computeTurnStats(messages: any[] | undefined | null): TurnStats {
  const list = Array.isArray(messages) ? messages : [];

  let rounds = 0;
  let steps = 0;
  let prompt = 0;
  let completion = 0;
  let total = 0;
  let cached = 0;
  let duration = 0;
  let toolDuration = 0;
  let ttftSum = 0;
  let ttftCount = 0;
  /** 速度分子：已完成轮用 usage 的 completion，流式中用字符估算 */
  let speedTokens = 0;
  /** 速度分母：与后端一致，逐条消息的解码窗口（毫秒）之和 */
  let decodeWindowSum = 0;

  for (const message of list) {
    if (!message) continue;

    if (message.role === 'user') {
      rounds += 1;
      continue;
    }
    if (message.role !== 'assistant') continue;

    const usage = usageOf(message);
    const messageDuration = num(message.totalDurationMs);
    let ttft = 0;
    if (usage) {
      const p = num(usage.promptTokens);
      const c = num(usage.completionTokens);
      prompt += p;
      completion += c;
      total += num(usage.totalTokens) || p + c;
      // 缓存命中字段：新链路是 cachedTokens，历史/兼容字段是 promptCacheHitTokens
      cached += num(usage.cachedTokens ?? usage.promptCacheHitTokens);

      ttft = num(usage.firstTokenLatencyMs ?? usage.firstTokenLatency);
      if (ttft > 0) {
        ttftSum += ttft;
        ttftCount += 1;
      }
      speedTokens += c;
    } else if (isStreamingMessage(message)) {
      // 本轮 usage 还没回来：用字符估算让速度条实时变化（结束后会被精确值覆盖）
      speedTokens += estimateTokens(textOf(message));
    }

    /**
     * 解码窗口：与后端 {@code AiUsage.tokensPerSecond()} 逐行同口径 ——
     * 有首字耗时时扣掉它；扣完不足 1 秒则退化为「输出 ÷ 总耗时」
     * （服务商粗块推送时窗口只有几十毫秒，反推会得到几千 tok/s 的假象）。
     */
    if (messageDuration > 0) {
      const window = ttft > 0 ? messageDuration - ttft : messageDuration;
      decodeWindowSum += window >= 1000 ? window : messageDuration;
    }

    duration += messageDuration;
    toolDuration += num(message.toolDurationMs);

    for (const content of message.contents || []) {
      steps += num(content?.metadata?.toolCalls?.length);
    }
  }

  const modelDuration = Math.max(0, duration - toolDuration);
  // 每条消息各自的解码窗口已按后端口径累加（见循环内的 decodeWindowSum）
  const tokensPerSecond = decodeWindowSum > 0 ? speedTokens / (decodeWindowSum / 1000) : 0;

  return {
    rounds,
    steps,
    prompt,
    completion,
    total,
    cached,
    // 差值可能是负数（部分供应商的 cached 口径含输出），故夹到 0
    uncachedInput: Math.max(0, prompt - cached),
    duration,
    toolDuration,
    modelDuration,
    ttftSum,
    ttftAvg: ttftCount > 0 ? ttftSum / ttftCount : 0,
    tokensPerSecond,
  };
}

/**
 * 响应式包装：传 computed 或 ref 均可。
 */
export function useTurnStats(
  messages: Ref<any[]> | ComputedRef<any[]>,
): ComputedRef<TurnStats> {
  return computed(() => computeTurnStats(messages.value));
}

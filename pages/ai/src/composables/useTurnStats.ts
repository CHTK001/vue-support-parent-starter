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

  for (const message of list) {
    if (!message) continue;

    if (message.role === 'user') {
      rounds += 1;
      continue;
    }
    if (message.role !== 'assistant') continue;

    const usage = usageOf(message);
    if (usage) {
      const p = num(usage.promptTokens);
      const c = num(usage.completionTokens);
      prompt += p;
      completion += c;
      total += num(usage.totalTokens) || p + c;
      // 缓存命中字段：新链路是 cachedTokens，历史/兼容字段是 promptCacheHitTokens
      cached += num(usage.cachedTokens ?? usage.promptCacheHitTokens);

      const ttft = num(usage.firstTokenLatencyMs ?? usage.firstTokenLatency);
      if (ttft > 0) {
        ttftSum += ttft;
        ttftCount += 1;
      }
    }

    duration += num(message.totalDurationMs);
    toolDuration += num(message.toolDurationMs);

    for (const content of message.contents || []) {
      steps += num(content?.metadata?.toolCalls?.length);
    }
  }

  const modelDuration = Math.max(0, duration - toolDuration);
  // 每条消息都有自己的首字等待，故按 Σttft 扣减（不是按平均值扣一次）
  const decodeWindow = Math.max(0, modelDuration - ttftSum);
  const tokensPerSecond = decodeWindow > 0 ? completion / (decodeWindow / 1000) : 0;

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

/**
 * 触发轨迹：按 cron 表达式算出「最近 N 次已触发」与「接下来 N 次将触发」的时刻。
 *
 * <p>为什么在前端算而不是加后端接口：{@link CronExpression} 是服务端
 * {@code com.chua.common.support.task.scheduler.CronExpression} 的逐行镜像，
 * 「后续 5 次执行时间」弹层（JobFireTimesDialog）已经在用它，口径与调度器一致。
 * 加一个只读接口去算同一件事，只会多一条需要同步维护的路径。</p>
 *
 * <p>回溯实现：解析器只提供 {@code nextExecutionTime}，没有上一个匹配点的 API。
 * 因此从「现在 - 1 分钟」起算，窗口不够就把窗口翻倍重扫，直到窗口内命中数够 N 个，
 * 取最后 N 个即为离现在最近的 N 次。窗口上限 5 年，与解析器自身的回溯上限一致。</p>
 *
 * <p><strong>游标推进必须只加 1 毫秒。</strong> {@code nextExecutionTime(t)} 返回的是
 * <em>严格晚于</em> t 的第一个匹配点；若按 {@code setSeconds(+1)} 推进，下一秒、每两秒
 * 这类表达式会被跳过一半（实测 {@code *&#47;1 * * * * ?} 只能拿到 20/22/24…）。
 * 这里统一用 +1ms，两个方向都走同一套扫描，也就不依赖 {@code getFireTimes} 的内部步进。</p>
 */
import { CronExpression } from "@repo/utils";

/** 一次触发轨迹的内容：过去 N 次 + 未来 N 次（毫秒时间戳，升序） */
export interface FireTrailResult {
  /** 最近 N 次已触发时刻，升序（最后一个最靠近现在） */
  past: number[];
  /** 接下来 N 次触发时刻，升序 */
  future: number[];
}

/** 回溯窗口上限：5 年，与 CronExpression 的内部回溯上限对齐 */
const MAX_LOOKBACK_MS = 5 * 365 * 86400_000;

/** 单次窗口扫描的步数上限：防止每秒触发的表达式把一次渲染拖成死循环 */
const STEP_LIMIT = 600;

/** 初始回溯窗口：1 分钟。高频表达式（每分钟/每秒）一次就能取够 */
const INITIAL_SPAN_MS = 60_000;

/** 游标推进量：只要严格大于上一个匹配点即可，1 毫秒是最小的安全值 */
const CURSOR_STEP_MS = 1;

function emptyResult(): FireTrailResult {
  return { past: [], future: [] };
}

/**
 * 从 from 起按 cron 逐个取匹配点，取满 limit 个或越过 until 即停。
 *
 * @param cron   解析好的表达式
 * @param from   起点（不含：只会返回严格晚于它的点）
 * @param until  上界（含）
 * @param limit  最多取多少个
 * @returns 升序的匹配时刻（毫秒）
 */
function collectBetween(cron: CronExpression, from: Date, until: number, limit: number): number[] {
  const hits: number[] = [];
  let cursor = from;
  for (let i = 0; i < limit; i++) {
    const next = cron.nextExecutionTime(cursor);
    if (next === null) {
      break;
    }
    const at = next.getTime();
    if (!Number.isFinite(at) || at > until) {
      break;
    }
    hits.push(at);
    cursor = new Date(at + CURSOR_STEP_MS);
  }
  return hits;
}

/**
 * 算出某个 cron 表达式在 now 附近的触发轨迹。
 *
 * <p>表达式为空 / 非法时返回空结果，调用方据此显示占位符——不为了「看起来有内容」
 * 编造一条轨迹，那会让人误以为任务真的按时在跑。</p>
 *
 * @param expression cron 表达式
 * @param now        基准时刻（毫秒）
 * @param pastCount  需要多少个历史点，默认 4
 * @param futureCount 需要多少个未来点，默认 4
 * @returns 过去与未来的触发时刻
 */
export function buildFireTrail(
  expression: string | null | undefined,
  now: number,
  pastCount = 4,
  futureCount = 4,
): FireTrailResult {
  const text = String(expression ?? "").trim();
  if (!text) {
    return emptyResult();
  }
  let cron: CronExpression;
  try {
    cron = new CronExpression(text);
  } catch {
    return emptyResult();
  }

  /* 未来点：从 now 起往后扫，同样用 +1ms 推进，秒级表达式不会漏半 */
  const future = futureCount > 0
    ? collectBetween(cron, new Date(now), now + MAX_LOOKBACK_MS, futureCount)
    : [];

  /* 历史点：窗口不够就翻倍，直到窗口里命中数够 N 个，取最后 N 个 */
  let past: number[] = [];
  if (pastCount > 0) {
    let span = INITIAL_SPAN_MS;
    while (span <= MAX_LOOKBACK_MS) {
      const hits = collectBetween(cron, new Date(now - span), now, STEP_LIMIT);
      if (hits.length >= pastCount) {
        past = hits.slice(-pastCount);
        break;
      }
      // 窗口内还不够：先记住已经扫到的，窗口翻倍继续找更早的
      past = hits;
      span *= 2;
    }
  }

  return { past, future };
}

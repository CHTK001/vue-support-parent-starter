/**
 * 轻量级 Cron 表达式解析器（前端版，与后端 CronExpression 保持一致）。
 *
 * <p>支持 5 字段或 6 字段（Quartz 格式，含秒）：
 * <pre>
 *   6 字段: seconds  minutes  hours  day-of-month  month  day-of-week
 *   5 字段:            minutes  hours  day-of-month  month  day-of-week
 * </pre>
 *
 * <p>仅用于前端展示"下次触发时间"，不参与实际调度。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
export class CronExpression {
  private static readonly SECOND_RANGE: [number, number] = [0, 59];
  private static readonly MINUTE_RANGE: [number, number] = [0, 59];
  private static readonly HOUR_RANGE: [number, number] = [0, 23];
  private static readonly DOM_RANGE: [number, number] = [1, 31];
  private static readonly MONTH_RANGE: [number, number] = [1, 12];
  private static readonly DOW_RANGE: [number, number] = [1, 7];

  private readonly hasSeconds: boolean;
  private readonly expression: string;
  private readonly seconds: Set<number>;
  private readonly minutes: Set<number>;
  private readonly hours: Set<number>;
  private readonly daysOfMonth: Set<number>;
  private readonly months: Set<number>;
  private readonly daysOfWeek: Set<number>;
  private readonly domIsAny: boolean;
  private readonly dowIsAny: boolean;

  constructor(expr: string) {
    if (!expr || !expr.trim()) {
      throw new Error("cron 表达式不能为空");
    }
    this.expression = expr.trim();
    const parts = this.expression.split(/\s+/);
    if (parts.length < 5 || parts.length > 6) {
      throw new Error(`cron 表达式需要 5-6 个字段，当前: ${parts.length}`);
    }
    this.hasSeconds = parts.length === 6;
    let p = 0;
    if (this.hasSeconds) {
      this.seconds = parseField(parts[p++], CronExpression.SECOND_RANGE);
    } else {
      this.seconds = anySet(CronExpression.SECOND_RANGE);
    }
    this.minutes = parseField(parts[p++], CronExpression.MINUTE_RANGE);
    this.hours = parseField(parts[p++], CronExpression.HOUR_RANGE);
    this.daysOfMonth = parseField(parts[p++], CronExpression.DOM_RANGE);
    this.months = parseField(parts[p++], CronExpression.MONTH_RANGE);
    this.daysOfWeek = parseField(parts[p++], CronExpression.DOW_RANGE);
    this.domIsAny = isWildcard(this.daysOfMonth);
    this.dowIsAny = isWildcard(this.daysOfWeek);
  }

  /**
   * 计算从基准时间之后的下一次触发时间。
   *
   * @param base 基准时间（不含本次）
   * @returns 下次触发时间；找不到返回 null
   */
  nextAfter(base: Date): Date | null {
    const cursor = new Date(base.getTime());
    if (this.hasSeconds) {
      cursor.setSeconds(cursor.getSeconds() + 1, 0);
    } else {
      cursor.setSeconds(0, 0);
      cursor.setMinutes(cursor.getMinutes() + 1);
    }
    const maxIter = 366 * 24 * 60;
    for (let i = 0; i < maxIter; i++) {
      if (this.matches(cursor)) {
        return cursor;
      }
      cursor.setMinutes(cursor.getMinutes() + 1);
    }
    return null;
  }

  /**
   * 判断给定时间是否匹配。
   *
   * <p>DOM / DOW 遵循 Quartz OR 语义。</p>
   */
  matches(d: Date): boolean {
    if (!this.months.has(d.getMonth() + 1)) return false;
    if (this.hasSeconds && !this.seconds.has(d.getSeconds())) return false;
    if (!this.minutes.has(d.getMinutes())) return false;
    if (!this.hours.has(d.getHours())) return false;
    const dom = d.getDate();
    const dow = d.getDay() === 0 ? 7 : d.getDay();
    const domMatch = this.daysOfMonth.has(dom);
    const dowMatch = this.daysOfWeek.has(dow);
    if (this.domIsAny && this.dowIsAny) return true;
    if (this.domIsAny) return dowMatch;
    if (this.dowIsAny) return domMatch;
    return domMatch || dowMatch;
  }
}

function isWildcard(set: Set<number>): boolean {
  const [min, max] = findRangeFor(set);
  if (!min) return false;
  return set.size === max - min + 1;
}

function findRangeFor(_set: Set<number>): [number, number] | null {
  // 简化：DOM/DOW 都是从 1 开始连续
  return [1, 31];
}

function anySet([min, max]: [number, number]): Set<number> {
  const s = new Set<number>();
  for (let v = min; v <= max; v++) s.add(v);
  return s;
}

/**
 * 解析单个 cron 字段。
 */
function parseField(expr: string, [min, max]: [number, number]): Set<number> {
  if (expr === "*" || expr === "?") {
    return anySet([min, max]);
  }
  const slash = expr.indexOf("/");
  if (slash >= 0) {
    const step = parseInt(expr.substring(slash + 1), 10);
    const startPart = expr.substring(0, slash);
    const start = startPart === "*" || startPart === "" ? min : parseInt(startPart, 10);
    const s = new Set<number>();
    for (let v = start; v <= max; v += step) s.add(v);
    return s;
  }
  if (expr.startsWith("*/")) {
    const step = parseInt(expr.substring(2), 10);
    const s = new Set<number>();
    for (let v = min; v <= max; v += step) s.add(v);
    return s;
  }
  if (expr.includes(",")) {
    const items = expr.split(",");
    const s = new Set<number>();
    for (const it of items) s.add(parseInt(it, 10));
    return s;
  }
  const v = parseInt(expr, 10);
  if (v < min || v > max) {
    throw new Error(`字段值 ${v} 超出范围 [${min}, ${max}]`);
  }
  return new Set([v]);
}

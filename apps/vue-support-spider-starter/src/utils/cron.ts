/**
 * 轻量级 Cron 表达式解析器（前端版）。
 *
 * <p>支持 5 字段：分钟 小时 日 月 周。</p>
 * <ul>
 *   <li>{@code *} — 任意</li>
 *   <li>{@code N} — 固定值</li>
 *   <li>{@code */N} — 步进</li>
 *   <li>{@code a,b,c} — 列表</li>
 * </ul>
 *
 * <p>仅用于前端展示"下次触发时间"，不参与实际调度。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
export class CronExpression {
  /** 字段最小值 [minute, hour, day, month, weekday] */
  private static readonly RANGES: Array<[number, number]> = [
    [0, 59],
    [0, 23],
    [1, 31],
    [1, 12],
    [1, 7],
  ];

  private readonly fields: Array<Set<number>>;

  constructor(expr: string) {
    const parts = expr.trim().split(/\s+/);
    if (parts.length < 5 || parts.length > 6) {
      throw new Error(`Cron 表达式需要 5-6 个字段，当前: ${parts.length}`);
    }
    this.fields = [];
    for (let i = 0; i < 5; i++) {
      const [min, max] = CronExpression.RANGES[i];
      this.fields.push(parseField(parts[i], min, max));
    }
  }

  /**
   * 计算从 base 之后的下一次触发时间。
   *
   * @param base 基准时间（不含本次）
   * @returns 下次触发时间，未找到返回 null
   */
  nextAfter(base: Date): Date | null {
    const cursor = new Date(base.getTime());
    cursor.setSeconds(0, 0);
    cursor.setMinutes(cursor.getMinutes() + 1);
    for (let i = 0; i < 366 * 24 * 60; i++) {
      if (this.matches(cursor)) {
        return cursor;
      }
      cursor.setMinutes(cursor.getMinutes() + 1);
    }
    return null;
  }

  /**
   * 判断给定时间是否匹配。
   */
  matches(d: Date): boolean {
    if (!this.fields[3].has(d.getMonth() + 1)) return false;
    if (!this.fields[2].has(d.getDate())) return false;
    if (!this.fields[0].has(d.getMinutes())) return false;
    if (!this.fields[1].has(d.getHours())) return false;
    return this.fields[4].has(d.getDay() === 0 ? 7 : d.getDay());
  }
}

/**
 * 解析单个字段。
 */
function parseField(expr: string, min: number, max: number): Set<number> {
  const set = new Set<number>();
  for (const part of expr.split(",")) {
    if (part === "*") {
      for (let v = min; v <= max; v++) set.add(v);
    } else if (part.startsWith("*/")) {
      const step = parseInt(part.substring(2), 10);
      if (step > 0) for (let v = min; v <= max; v += step) set.add(v);
    } else {
      const v = parseInt(part, 10);
      if (v >= min && v <= max) set.add(v);
    }
  }
  return set;
}

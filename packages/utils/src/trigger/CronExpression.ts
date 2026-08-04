/**
 * Cron 表达式解析引擎
 *
 * 负责解析标准的 6 字段 Cron 表达式（秒 分 时 日 月 周），并提供基于时间点的
 * 匹配和计算能力。将表达式编译为布尔位图（boolean[]）以实现高效的匹配判定。
 *
 * 支持的表达式语法：
 *  - `*` —— 所有值
 *  - `?` —— 不指定值（仅用于日和周字段）
 *  - `-` —— 范围（如 1-5）
 *  - `,` —— 列表（如 MON,WED,FRI）
 *  - `/` —— 步进（如 `*&#47;5`）
 *  - `L` —— 最后一天或最后一个工作日
 *  - `W` —— 最近的工作日
 *  - `#` —— 第 N 个星期几（如 3#2 表示第二个星期二）
 */
export class CronExpression {
  /** 秒字段位图（0-59） */
  private seconds: boolean[] = new Array(60).fill(false);
  /** 分钟字段位图（0-59） */
  private minutes: boolean[] = new Array(60).fill(false);
  /** 小时字段位图（0-23） */
  private hours: boolean[] = new Array(24).fill(false);
  /** 日期字段位图（1-31） */
  private daysOfMonth: boolean[] = new Array(32).fill(false);
  /** 月份字段位图（1-12） */
  private months: boolean[] = new Array(13).fill(false);
  /** 星期字段位图（0-7，0 和 7 均表示周日） */
  private daysOfWeek: boolean[] = new Array(8).fill(false);

  /** 是否使用月末标记（L） */
  private lastDayOfMonth = false;
  /** 是否使用最后一个工作日标记（L，星期字段） */
  private lastDayOfWeek = false;
  /** 最近的工作日（W 修饰符） */
  private nearestWeekday: number | null = null;
  /** 第 N 个星期几（# 修饰符） */
  private nthDayOfWeek: number | null = null;

  /**
   * 构造一个 Cron 表达式解析器
   *
   * @param expression 6 字段 Cron 表达式
   * @throws Error 如果表达式格式不正确或字段数不为 6
   */
  constructor(expression: string) {
    const fields = expression.trim().split(/\s+/);
    if (fields.length !== 6) {
      throw new Error(
        "Cron expression must have 6 fields (second minute hour day-of-month month day-of-week)",
      );
    }
    this.parseSeconds(fields[0]);
    this.parseMinutes(fields[1]);
    this.parseHours(fields[2]);
    this.parseDaysOfMonth(fields[3]);
    this.parseMonths(fields[4]);
    this.parseDaysOfWeek(fields[5]);
  }

  /** 解析秒字段（0-59） */
  private parseSeconds(field: string): void {
    this.parseField(field, 0, 59, this.seconds);
  }

  /** 解析分钟字段（0-59） */
  private parseMinutes(field: string): void {
    this.parseField(field, 0, 59, this.minutes);
  }

  /** 解析小时字段（0-23） */
  private parseHours(field: string): void {
    this.parseField(field, 0, 23, this.hours);
  }

  /** 解析月份字段（1-12），支持 JAN-DEC 英文缩写 */
  private parseMonths(field: string): void {
    const resolved = this.resolveNames(
      field,
      "JAN,FEB,MAR,APR,MAY,JUN,JUL,AUG,SEP,OCT,NOV,DEC",
    );
    this.parseField(resolved, 1, 12, this.months);
  }

  /** 解析日期字段（1-31），支持 L、W 修饰符 */
  private parseDaysOfMonth(field: string): void {
    if (field === "?") {
      return;
    }
    if (field === "L" || field.startsWith("LW")) {
      this.lastDayOfMonth = true;
      return;
    }
    if (field.endsWith("W") && field.length > 1) {
      this.nearestWeekday = Number.parseInt(field.substring(0, field.length - 1), 10);
      return;
    }
    this.parseField(field, 1, 31, this.daysOfMonth);
  }

  /** 解析星期字段（0-7），支持 L、# 修饰符和 SUN-SAT 英文缩写 */
  private parseDaysOfWeek(field: string): void {
    if (field === "?") {
      return;
    }
    const resolved = this.resolveNames(field, "SUN,MON,TUE,WED,THU,FRI,SAT")
      .replace(/7/g, "0");
    if (resolved === "L") {
      this.lastDayOfWeek = true;
      return;
    }
    if (resolved.includes("#")) {
      const parts = resolved.split("#");
      this.nthDayOfWeek = Number.parseInt(parts[0], 10);
      this.daysOfWeek[Number.parseInt(parts[1], 10)] = true;
      return;
    }
    this.parseField(resolved, 0, 7, this.daysOfWeek);
    if (this.daysOfWeek[7]) {
      this.daysOfWeek[0] = true;
    }
  }

  /**
   * 将英文名称解析为数字
   *
   * @param field 原始字段值
   * @param names 逗号分隔的名称列表
   * @returns 将名称替换为数字后的字段值
   */
  private resolveNames(field: string, names: string): string {
    const nameArr = names.split(",");
    let result = field.toUpperCase();
    for (let i = 0; i < nameArr.length; i++) {
      result = result.replace(new RegExp(nameArr[i], "g"), String(i + 1));
    }
    return result;
  }

  /** 解析标准字段（支持 *、逗号列表） */
  private parseField(field: string, min: number, max: number, bits: boolean[]): void {
    if (field === "*") {
      for (let i = min; i <= max; i++) bits[i] = true;
      return;
    }
    for (const part of field.split(",")) {
      this.parseFieldPart(part, min, max, bits);
    }
  }

  /** 解析字段中的单个部分（支持范围 - 和步进 /） */
  private parseFieldPart(part: string, min: number, max: number, bits: boolean[]): void {
    let step = 1;
    const slash = part.indexOf("/");
    if (slash !== -1) {
      step = Number.parseInt(part.substring(slash + 1), 10);
      part = part.substring(0, slash);
    }
    let rangeMin: number;
    let rangeMax: number;
    const dash = part.indexOf("-");
    if (part === "*") {
      rangeMin = min;
      rangeMax = max;
    } else if (dash !== -1) {
      rangeMin = Number.parseInt(part.substring(0, dash), 10);
      rangeMax = Number.parseInt(part.substring(dash + 1), 10);
    } else {
      rangeMin = Number.parseInt(part, 10);
      rangeMax = Number.parseInt(part, 10);
    }
    // 步进场景（如 0/5、5/15）：若未显式指定范围上限，则将上限扩展到字段最大值
    if (slash !== -1 && rangeMax === rangeMin) {
      rangeMax = max;
    }
    for (let i = rangeMin; i <= rangeMax; i += step) {
      if (i >= 0 && i < bits.length) bits[i] = true;
    }
  }

  /** 判断位图是否为空 */
  private isEmpty(bits: boolean[]): boolean {
    return bits.every((v) => !v);
  }

  /**
   * 计算从指定时间之后的下一个匹配时间点
   *
   * 按照年-月-日-时-分-秒的层级逐级递增匹配：
   *  1. 先匹配月份，不匹配则跳到下个月第一天
   *  2. 再匹配日期和星期，日和周采用或逻辑（只要一个满足即可）
   *  3. 然后匹配小时、分钟、秒
   *
   * @param from 基准时间
   * @returns 下一个匹配的 Cron 时间点
   */
  nextExecutionTime(from: Date): Date | null {
    let candidate = new Date(from);
    candidate.setMilliseconds(0);
    candidate.setSeconds(candidate.getSeconds() + 1);

    // 防止极端异常表达式导致死循环
    let guard = 0;
    const MAX_ITERATIONS = 2000;

    while (guard++ < MAX_ITERATIONS) {
      const y = candidate.getFullYear();
      const m = candidate.getMonth() + 1;

      if (!this.months[m]) {
        candidate = new Date(y, m, 1, 0, 0, 0, 0);
        continue;
      }

      const dom = candidate.getDate();
      // 星期转换：JS getDay() 0=周日，与 Java 的 (getDayOfWeek % 7) 语义一致
      const dow = candidate.getDay();

      let domMatch =
        this.daysOfMonth[dom] ||
        (this.lastDayOfMonth && dom === this.lengthOfMonth(y, m));
      let dowMatch =
        this.daysOfWeek[dow] || (this.lastDayOfWeek && this.isLastWeekDay(candidate));

      if (this.nthDayOfWeek !== null && this.daysOfWeek[this.nthDayOfWeek]) {
        dowMatch = this.isNthDayOfWeek(candidate);
      }
      if (this.nearestWeekday !== null) {
        domMatch = this.isNearestWeekday(y, m, candidate);
      }
      // 日/周字段全未设置时，放宽为任意日期
      if (
        (this.isEmpty(this.daysOfMonth) && !this.lastDayOfMonth && this.nearestWeekday === null) ||
        (this.isEmpty(this.daysOfWeek) && !this.lastDayOfWeek && this.nthDayOfWeek === null)
      ) {
        domMatch = true;
        dowMatch = true;
      }

      if (!domMatch || !dowMatch) {
        candidate = new Date(y, m, dom + 1, 0, 0, 0, 0);
        continue;
      }

      const h = candidate.getHours();
      if (!this.hours[h]) {
        candidate = new Date(y, m, dom, h + 1, 0, 0, 0);
        continue;
      }

      const min = candidate.getMinutes();
      if (!this.minutes[min]) {
        candidate = new Date(y, m, dom, h, min + 1, 0, 0);
        continue;
      }

      const sec = candidate.getSeconds();
      if (!this.seconds[sec]) {
        candidate = new Date(y, m, dom, h, min, sec + 1, 0);
        continue;
      }

      return candidate;
    }

    return null;
  }

  /**
   * 从指定时间开始获取 N 个执行时间点
   *
   * @param count 需要获取的数量
   * @param from  基准时间
   * @returns 执行时间点列表
   */
  getFireTimes(count: number, from: Date): Date[] {
    const result: Date[] = [];
    let current = new Date(from);
    for (let i = 0; i < count; i++) {
      const next = this.nextExecutionTime(current);
      if (next === null) {
        break;
      }
      result.push(next);
      current = new Date(next);
      current.setSeconds(current.getSeconds() + 1);
    }
    return result;
  }

  /** 获取指定月份的天数 */
  private lengthOfMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  /** 判断是否为该月最后一个工作日 */
  private isLastWeekDay(dt: Date): boolean {
    const lastDay = this.lengthOfMonth(dt.getFullYear(), dt.getMonth() + 1);
    return dt.getDate() === lastDay || dt.getDay() === new Date(dt.getFullYear(), dt.getMonth(), lastDay).getDay();
  }

  /** 判断是否为第 N 个星期几 */
  private isNthDayOfWeek(dt: Date): boolean {
    const weekOfMonth = Math.floor((dt.getDate() - 1) / 7) + 1;
    const dow = dt.getDay();
    return this.daysOfWeek[dow] && dow === this.nthDayOfWeek;
  }

  /** 判断是否为最近的工作日（W 修饰符） */
  private isNearestWeekday(year: number, month: number, dt: Date): boolean {
    const nearest = this.nearestWeekday!;
    const target = new Date(year, month - 1, nearest);
    let adjusted = new Date(target);
    const day = target.getDay();
    if (day === 6) {
      adjusted = new Date(year, month - 1, nearest - 1);
    } else if (day === 0) {
      adjusted = new Date(year, month - 1, nearest + 1);
    }
    if (adjusted.getMonth() + 1 !== month) {
      adjusted = new Date(year, month - 1, nearest - 1);
    }
    return dt.getFullYear() === adjusted.getFullYear() &&
      dt.getMonth() === adjusted.getMonth() &&
      dt.getDate() === adjusted.getDate();
  }
}

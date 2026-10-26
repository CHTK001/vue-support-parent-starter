/**
 * 数据库控制台：日期 / 时间列的形态识别与取值规范化。
 *
 * <p><b>为什么单独一份</b>：数据网格的「格内编辑」和「编辑行 / 新增行」弹窗
 * 都要按列类型决定渲染哪个选择器，也都要把数据库原样下发的字符串规范化成
 * 选择器 {@code value-format} 能解析的形状。两处各写一份必然漂移 ——
 * 以前 {@code isDateCol} 只服务弹窗一处，格内编辑压根没看类型，于是时间列
 * 只能当普通文本框敲。</p>
 *
 * <p><b>下发的取值长什么样</b>（同一列在不同方言 / 驱动下并不统一）：</p>
 * <ul>
 *   <li>MySQL：{@code 2026-10-26 12:00:00}、{@code 12:00:00}、{@code 2026}</li>
 *   <li>PostgreSQL：{@code 2026-10-26T12:00:00}、{@code 2026-10-26 12:00:00.123456}</li>
 *   <li>Oracle DATE：类型名只有 {@code DATE}，但值里带时刻 {@code 2026-10-26 12:00:00}</li>
 * </ul>
 *
 * <p><b>只做展示侧规范化，不改提交值</b>：用户没动过的单元格不会回写，
 * 所以 {@code datetime(6)} 的微秒不会被选择器截断；只有真的选了新值才写库。</p>
 *
 * @author CH
 * @since 4.0.0.47
 */

/** 选择器形态：日期 / 日期时间 / 时间 / 年份 */
export type DbTemporalKind = "date" | "datetime" | "time" | "year";

/**
 * 列类型 → 选择器形态。
 *
 * <p>判定顺序有讲究：{@code DATETIME} / {@code TIMESTAMP} 必须先于
 * {@code DATE} / {@code TIME} 判断，否则 {@code DATETIME} 会被 {@code DATE}
 * 先命中而丢掉时刻。</p>
 *
 * @param type 数据库原样类型名（大小写、长度、时区后缀都可能带）
 * @return 选择器形态；不是日期时间类返回 null
 */
export function dbTemporalKind(type: string | null | undefined): DbTemporalKind | null {
  const t = (type ?? "").toUpperCase();
  if (!t) {
    return null;
  }
  if (/DATETIME|TIMESTAMP/.test(t)) {
    return "datetime";
  }
  if (/\bYEAR\b/.test(t)) {
    return "year";
  }
  // TIMETZ 是 PostgreSQL 的带时区时间；\bTIME\b 不会命中 TIMETZ（E 后面还是词字符）
  if (/\bTIMETZ\b/.test(t) || /\bTIME\b/.test(t)) {
    return "time";
  }
  if (/\bDATE\b/.test(t)) {
    return "date";
  }
  return null;
}

/**
 * 选择器形态 → Element Plus 的 {@code value-format}。
 *
 * <p>这个格式同时是「选择器回传给我们的形状」：选完值直接就是数据库能吃的字符串，
 * 不需要再做一次格式化（多一次转换就多一次格式写错的机会）。</p>
 *
 * @param kind 选择器形态
 * @return dayjs 格式串
 */
export function dbTemporalValueFormat(kind: DbTemporalKind): string {
  switch (kind) {
    case "date":
      return "YYYY-MM-DD";
    case "datetime":
      return "YYYY-MM-DD HH:mm:ss";
    case "time":
      return "HH:mm:ss";
    case "year":
      return "YYYY";
    default:
      return "YYYY-MM-DD HH:mm:ss";
  }
}

/**
 * 结合当前值修正形态。
 *
 * <p>只有一种修正：类型名是 {@code DATE}，但值里带非零时刻时升级成
 * {@code datetime}。Oracle 的 DATE 是「日期 + 时刻」的复合类型，若按纯日期渲染，
 * 用户一选值就把时刻清零了 —— 而界面上完全看不出丢了东西。</p>
 *
 * <p>零点不升级：{@code 2026-10-26 00:00:00} 与 {@code 2026-10-26} 语义相同，
 * 按日期渲染不会丢信息，还能少一次「为什么这列有时带时间」的困惑。</p>
 *
 * @param type 数据库原样类型名
 * @param raw  当前取值（数据库原样下发的字符串）
 * @return 选择器形态
 */
export function resolveTemporalKind(
  type: string | null | undefined,
  raw: unknown,
): DbTemporalKind | null {
  const base = dbTemporalKind(type);
  if (base !== "date") {
    return base;
  }
  const s = raw === null || raw === undefined ? "" : String(raw).trim();
  if (!/\d{1,2}:\d{2}/.test(s)) {
    return base;
  }
  return /(?:^|[T ])00:00(?::00(?:\.0+)?)?$/.test(s) ? base : "datetime";
}

/**
 * 判断一个取值是不是「epoch 毫秒数」。
 *
 * <p>后端已改为下发文本（见 {@code DbTransferCodec.cellValue}），这里保留对
 * 数值形态的识别只是为了兼容尚未升级的后端：老版本把
 * {@code java.sql.Date / Time / Timestamp} 直接交给 Jackson，输出就是这种数字。</p>
 *
 * <p>下界取 1970-01-01（含 0），上界取 2100 年：真实业务时间戳都在这个区间。</p>
 *
 * <p><b>为什么不覆盖 TIME</b>：{@code java.sql.Time} 的 epoch 是「1970-01-01 当日时刻」，
 * 最大值 {@code 86_399_999 + 时区偏移}，也就是 8–9 位数字 —— 掉不进这里的
 * 10–13 位区间。所以 TIME 列另走 {@link isTimeOfDayMillis}，别把它并进来：
 * 把下界放宽到 1 位会让任何小整数（如 {@code id=3}）都被当成时间。</p>
 *
 * @param raw 数据库原样取值
 * @returns 是 epoch 毫秒数返回 true
 */
export function isEpochMillis(raw: unknown): boolean {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw >= 0 && raw < 4_102_444_800_000;
  }
  if (typeof raw === "string" && /^\d{10,13}$/.test(raw.trim())) {
    const n = Number(raw.trim());
    return n >= 0 && n < 4_102_444_800_000;
  }
  return false;
}

/**
 * TIME 列的「当日毫秒数」判定。
 *
 * <p><b>为什么单独一个函数</b>：后端 {@code DbTransferCodec} 把所有数值转成文本
 * 下发（避免 JS 精度丢失），于是 {@code TIME '08:30:00'} 到前端是字符串
 * {@code "1800000"}。{@link isEpochMillis} 要求 10–13 位，而当日毫秒最多
 * {@code 86_399_999}（8 位）+ 时区偏移（9 位），永远命中不了 ——
 * 结果 TIME 列被当成「无法识别的文本」，选择器显示空白，
 * 用户一打开面板 Element Plus 就填入当前时间，等于静默改值。</p>
 *
 * <p>上界取 {@code 1e9}：覆盖 23:59:59.999 加任意正负时区偏移；
 * 同时把「看起来像年份的 4 位数」等小整数挡在外面 —— 只有 TIME 列才会走到这里，
 * 而 TIME 列不存在「合法的小整数文本值」。</p>
 *
 * @param kind 选择器形态
 * @param raw  数据库原样取值
 * @returns 是当日毫秒数返回 true
 */
function isTimeOfDayMillis(kind: DbTemporalKind, raw: unknown): boolean {
  if (kind !== "time") {
    return false;
  }
  const s = typeof raw === "number" ? String(raw) : String(raw).trim();
  if (!/^\d{1,9}$/.test(s)) {
    return false;
  }
  const n = Number(s);
  return n >= 0 && n < 1_000_000_000;
}

/**
 * 数据库取值 → 选择器能解析的字符串。
 *
 * <p>Element Plus 用 {@code dayjs(value, valueFormat)} 严格解析模型值，
 * 多一个字符（{@code T}、微秒、时区后缀）就会被判非法而显示为空 ——
 * 看起来像「这行没数据」，实际是格式没对上。所以进选择器前统一收敛。</p>
 *
 * <p>三种来源都要认：ISO 文本、{@code T} 分隔、以及 epoch 毫秒数（见
 * {@link isEpochMillis}）。数值按 UTC 解读 —— 后端序列化 {@code java.sql.*}
 * 时用的是同一个 epoch，用 UTC 还原才不会因为浏览器时区把日期整体挪一天。</p>
 *
 * @param kind 选择器形态
 * @param raw  数据库原样取值
 * @return 规范化后的字符串；无法识别时返回空串（选择器显示为空，不会误判成合法值）
 */
export function toTemporalPickerValue(kind: DbTemporalKind, raw: unknown): string {
  if (raw === null || raw === undefined) {
    return "";
  }
  if (isEpochMillis(raw) || isTimeOfDayMillis(kind, raw)) {
    return fromEpochMillis(kind, Number(raw));
  }
  const s = String(raw).trim();
  if (!s) {
    return "";
  }
  if (kind === "year") {
    const y = s.match(/(\d{4})/);
    return y ? y[1] : "";
  }
  if (kind === "time") {
    const t = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    return t ? `${pad2(t[1])}:${t[2]}:${t[3] ?? "00"}` : "";
  }
  const d = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!d) {
    return "";
  }
  const date = `${d[1]}-${pad2(d[2])}-${pad2(d[3])}`;
  if (kind === "date") {
    return date;
  }
  // 日期段里的 "-" 不含冒号，这里不会误命中日期
  const t = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  return t ? `${date} ${pad2(t[1])}:${t[2]}:${t[3] ?? "00"}` : `${date} 00:00:00`;
}

/**
 * epoch 毫秒数 → 选择器格式串（按本地时区还原）。
 *
 * <p><b>只在兼容老后端时走到这里</b>：新后端下发文本，不进这个分支。
 * 老后端 Jackson 用 {@code TimeZone.getDefault()} 序列化 {@code java.sql.*}，
 * 所以 {@code DATE} 的 epoch 是「服务端本地零点」；按浏览器本地时区还原，
 * 只有两边时区一致才正确。这就是必须从后端改掉的原因 —— 前端补不回来。</p>
 *
 * @param kind 选择器形态
 * @param ms   epoch 毫秒数
 * @returns 规范化后的字符串
 */
function fromEpochMillis(kind: DbTemporalKind, ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const y = String(d.getFullYear()).padStart(4, "0");
  if (kind === "year") {
    // YEAR 列在 MySQL 驱动里是 java.sql.Date（当年 1 月 1 日），取年份即可
    return y;
  }
  const mo = pad2(String(d.getMonth() + 1));
  const day = pad2(String(d.getDate()));
  const hh = pad2(String(d.getHours()));
  const mi = pad2(String(d.getMinutes()));
  const ss = pad2(String(d.getSeconds()));
  if (kind === "time") {
    return `${hh}:${mi}:${ss}`;
  }
  const date = `${y}-${mo}-${day}`;
  return kind === "date" ? date : `${date} ${hh}:${mi}:${ss}`;
}

/**
 * 两位补零。
 *
 * @param v 数字或数字字符串
 * @return 补零后的字符串
 */
function pad2(v: string): string {
  return v.length >= 2 ? v : `0${v}`;
}

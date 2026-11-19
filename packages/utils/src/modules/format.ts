/**
 * 展示格式化工具。
 *
 * <p>收敛各业务页重复实现的「百分数量纲兼容」等展示格式，
 * 保证同一份数据在不同页面看到同一个样子。</p>
 */

/**
 * 百分数展示（缺省一位小数）。
 *
 * <p>后端历史口径里 0-1 与 0-100 两种量纲都出现过：≤1 视为小数比例放大
 * 100 倍，>1 视为已经是百分数原样保留。相似度、置信度等字段共用本口径。</p>
 *
 * @param value 原始数值
 * @param digits 小数位，缺省 1
 * @returns 形如 `98.6%`；缺失或非法时为空串
 */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) {
    return "";
  }
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(digits)}%`;
}

/** 字节换算档位 */
export type ByteUnit = "B" | "KB" | "MB" | "GB" | "TB";

/** 单档小数位口径：数字为固定小数位；`"raw"` 为原样整数；`"smart"` 为值 <10 保留 1 位、其余取整 */
export type ByteDigitsSpec = number | "raw" | "smart";

/** 字节档位 → 小数位覆盖表（未覆盖的档位回落到 1 位） */
export type ByteDigitsMap = Partial<Record<ByteUnit, ByteDigitsSpec>>;

export interface FormatBytesOptions {
  /** 空值、非有限数或负数时的占位文本，默认 `"—"` */
  emptyText?: string;
  /** 0 的展示文本；缺省按正常换算输出 `0 B` */
  zeroText?: string;
  /** ≥1KB 档位的小数位：统一数值、按档位覆盖（对象形式）或 `"smart"`，默认 1 */
  digits?: number | "smart" | ByteDigitsMap;
  /** B 档小数位，默认原样整数 */
  bDigits?: ByteDigitsSpec;
  /** 最高换算档位，默认 `"MB"` */
  maxUnit?: ByteUnit;
  /** ≥1KB 档位是否做千分位分组（zh-CN 口径） */
  grouping?: boolean;
  /** 是否去掉小数尾零（`1.00` → `1`） */
  trimZeros?: boolean;
}

const BYTE_UNITS: readonly ByteUnit[] = ["B", "KB", "MB", "GB", "TB"];

function renderByteValue(n: number, spec: ByteDigitsSpec): string {
  if (spec === "raw") {
    return String(n);
  }
  if (spec === "smart") {
    return n < 10 ? n.toFixed(1) : String(Math.round(n));
  }
  return n.toFixed(spec);
}

/**
 * 字节数 → 人类可读文本。
 *
 * <p>收敛各业务页重复实现的换算展示：1024 进制，B 原样整数，KB 起按
 * {@link FormatBytesOptions.digits} 控制小数位，超出 {@link FormatBytesOptions.maxUnit}
 * 时停在最高档。空值、非有限数与负数返回占位文本。</p>
 *
 * @param value 字节数
 * @param options 展示口径（占位文本、小数位、最高档位、千分位、去尾零）
 * @returns 形如 `512 B` / `2.5 KB` / `1.25 MB`；非法输入为占位文本
 */
export function formatBytes(value: number | null | undefined, options: FormatBytesOptions = {}): string {
  const { emptyText = "—", zeroText, digits = 1, bDigits = "raw", maxUnit = "MB", grouping = false, trimZeros = false } = options;
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0) {
    return emptyText;
  }
  if (value === 0 && zeroText !== undefined) {
    return zeroText;
  }
  const maxIndex = Math.max(0, BYTE_UNITS.indexOf(maxUnit));
  let unitIndex = 0;
  let n = value;
  while (n >= 1024 && unitIndex < maxIndex) {
    n /= 1024;
    unitIndex += 1;
  }
  const unit = BYTE_UNITS[unitIndex];
  let spec: ByteDigitsSpec;
  if (unitIndex === 0) {
    spec = bDigits;
  } else if (typeof digits === "object") {
    spec = digits[unit] ?? 1;
  } else {
    spec = digits;
  }
  let text = renderByteValue(n, spec);
  if (unitIndex > 0 && (grouping || trimZeros)) {
    const num = Number(text);
    text = grouping ? num.toLocaleString("zh-CN") : String(num);
  }
  return `${text} ${unit}`;
}

export interface FormatDateTimeOptions {
  /** 空值（`null` / `undefined` / 空串 / `0`）时的占位文本，默认 `"—"` */
  emptyText?: string;
  /** 输出风格：`"date"` 为 `YYYY-MM-DD`；`"datetime"` 为 `YYYY-MM-DD HH:mm`（默认）；`"datetime-seconds"` 追加秒 */
  style?: "date" | "datetime" | "datetime-seconds";
  /** 值存在但无法解析时的兜底：`"empty"` 占位（默认）、`"raw"` 返回原文、`"raw-slice16"` 返回原文前 16 字 */
  fallback?: "empty" | "raw" | "raw-slice16";
  /** 本地化输出（Intl）；提供时优先于 {@link FormatDateTimeOptions.style} */
  intl?: { locale?: string; options: Intl.DateTimeFormatOptions };
}

function parseDateTimeText(text: string): Date | null {
  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }
  // 兼容后端常见的 `yyyy-MM-dd HH:mm:ss`（空格分隔，非严格 ISO）
  const normalized = new Date(text.trim().replace(" ", "T"));
  return Number.isNaN(normalized.getTime()) ? null : normalized;
}

/**
 * 时间 → 展示文本。
 *
 * <p>收敛各业务页重复实现的时间格式化：入参兼容 `Date`、毫秒时间戳与
 * ISO / `yyyy-MM-dd HH:mm:ss` 文本；输出支持固定 `YYYY-MM-DD [HH:mm[:ss]]`
 * 或 Intl 本地化口径。空值（含 `0` 时间戳）返回占位文本。</p>
 *
 * @param value 时间（`Date` / 毫秒 / 文本）
 * @param options 展示口径（占位文本、风格、解析失败兜底、本地化）
 * @returns 展示文本；空值或无法解析时为占位/兜底文本
 */
export function formatDateTime(value: Date | number | string | null | undefined, options: FormatDateTimeOptions = {}): string {
  const { emptyText = "—", style = "datetime", fallback = "empty", intl } = options;
  if (!value) {
    return emptyText;
  }
  let d: Date;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return emptyText;
    }
    d = value;
  } else {
    const parsed = typeof value === "number" ? new Date(value) : parseDateTimeText(String(value));
    if (!parsed || Number.isNaN(parsed.getTime())) {
      if (fallback === "raw") {
        return String(value);
      }
      if (fallback === "raw-slice16") {
        return String(value).slice(0, 16);
      }
      return emptyText;
    }
    d = parsed;
  }
  if (intl) {
    return d.toLocaleString(intl.locale ?? "zh-CN", intl.options);
  }
  const p = (x: number) => String(x).padStart(2, "0");
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  if (style === "date") {
    return date;
  }
  const time = style === "datetime-seconds" ? `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` : `${p(d.getHours())}:${p(d.getMinutes())}`;
  return `${date} ${time}`;
}

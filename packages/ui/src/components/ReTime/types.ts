/** ReTime 支持的格式化类型 */
export type ReTimeFormat =
  /** 完整日期时间 YYYY-MM-DD HH:mm:ss */
  | "YYYY-MM-DD HH:mm:ss"
  /** 日期 YYYY-MM-DD */
  | "YYYY-MM-DD"
  /** 时间 HH:mm:ss */
  | "HH:mm:ss"
  /** 时间 HH:mm */
  | "HH:mm"
  /** ISO 字符串 */
  | "iso"
  /** 毫秒时间戳 */
  | "timestamp"
  /** 秒时间戳 */
  | "timestamp-s"
  /** 毫秒数（输入按时间戳处理，原样输出毫秒） */
  | "ms"
  /** 时长（输入按毫秒时长处理：800 → "800 毫秒"，90000 → "1.5 分钟"） */
  | "duration"
  /** 自定义格式化字符串（支持 YYYY/MM/DD/HH/mm/ss） */
  | string;

/** ReTime 接受的输入 */
export type ReTimeValue = Date | string | number | null | undefined;
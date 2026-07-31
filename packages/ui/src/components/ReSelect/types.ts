/** ReSelect 选项类型 */
export interface ReOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  /** 卡片模式：图标名（Element Plus / Iconify 三方库） */
  icon?: string;
  /** 卡片模式：副标题 / 描述 */
  description?: string;
  /** 表格模式：额外字段（key: value） */
  [key: string]: unknown;
}

/** ReSelect 布局模式 */
export type ReSelectLayout = "default" | "card" | "table";
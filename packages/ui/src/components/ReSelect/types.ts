/** ReSelect 选项类型 */
export interface ReOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  /** 卡片模式：图标名（Element Plus / Iconify 三方库） */
  icon?: string;
  /** 卡片模式：副标题 / 描述 */
  description?: string;
  /** 卡片模式：标签（如"升级""Pro""Beta"） */
  tag?: string;
  /** 卡片模式：标签颜色（默认浅蓝） */
  tagColor?: string;
  /** 卡片模式：是否为高阶/付费模型（高亮背景） */
  premium?: boolean;
  /** 卡片模式：消耗说明（如"4 倍消耗"） */
  consumption?: string;
  /** 卡片模式：分组标题 */
  group?: string;
  /** 表格模式：额外字段（key: value） */
  [key: string]: unknown;
}

/** ReSelect 布局模式（card-dropdown 为 card 的历史别名，行为相同） */
export type ReSelectLayout = "default" | "card" | "table" | "modern" | "pill" | "square" | "tree" | "card-dropdown";
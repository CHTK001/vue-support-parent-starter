/** ReSelect 选项类型 */
export interface ReOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  /** 卡片模式：图标名（Element Plus / Iconify 三方库） */
  icon?: string;
  /** 卡片模式：左侧图片地址（URL），优先于 icon 显示 */
  image?: string;
  /** 卡片模式：悬停提示（el-tooltip） */
  tip?: string;
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

/**
 * ReSelect 远程加载器签名。
 *
 * <p>用于 {@code data} 传函数或 {@code loader} 传函数两种等价写法（与 ReTable 的
 * {@code data} / {@code loader} 同一约定）：接收「合并了 keyword 与 params 的查询参数」，
 * 返回选项数组，可同步或异步。</p>
 *
 * <p>远程请求的防抖 / 重试 / 竞态丢弃由组件内部的 useDataSource 统一处理，
 * 这里只管把参数交给使用方。</p>
 */
export type ReSelectLoader = (params?: Record<string, unknown>) => ReOption[] | Promise<ReOption[]>;

/** ReSelect 远程结果缓存的载体：session（默认，随标签页关闭失效）/ local（跨会话保留） */
export type ReSelectCacheStorage = "local" | "session";

/** ReSelect 布局模式（card-dropdown 为 card 的历史别名，行为相同） */
export type ReSelectLayout = "default" | "modern" | "card" | "table" | "square" | "tree" | "card-dropdown";

/**
 * 控件尺寸档位。
 *
 * 与 Element Plus 的 el-select 尺寸语义对齐：small 28px / default 34px / large 40px。
 * 五种布局（default / modern / card / table / square）共用这一套档位。
 */
export type ReSelectSize = "large" | "default" | "small";
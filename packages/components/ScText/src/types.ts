/**
 * ScText 组件类型定义
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
 */

/**
 * 文本类型
 */
export type ScTextType = "primary" | "success" | "warning" | "danger" | "info" | "default";

/**
 * 文本大小
 */
export type ScTextSize = "large" | "default" | "small";

/**
 * 文本特效
 */
export type ScTextEffect = "gradient" | "typing" | "glow" | "shadow" | "none";

/**
 * 渐变方向
 */
export type ScTextGradientDirection = "to-right" | "to-left" | "to-top" | "to-bottom" | "to-top-right" | "to-top-left" | "to-bottom-right" | "to-bottom-left";

/**
 * 提示位置
 */
export type ScTextTooltipPlacement = "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end";

/**
 * ScText 组件属性
 */
export interface ScTextProps {
  // ==================== el-text 原有属性 ====================
  /**
   * 文本类型
   * @default 'default'
   */
  type?: ScTextType;

  /**
   * 文本大小
   * @default 'default'
   */
  size?: ScTextSize;

  /**
   * 是否显示省略号（单行截断）
   * @default false
   */
  truncated?: boolean;

  /**
   * 行数限制（多行截断）
   */
  lineClamp?: number;

  /**
   * 自定义渲染标签
   * @default 'span'
   */
  tag?: string;

  // ==================== 扩展属性 ====================
  /**
   * 主文本内容
   */
  text?: string;

  /**
   * 副文本内容
   */
  subtext?: string;

  /**
   * 副文本位置
   * @default 'bottom'
   */
  subtextPosition?: "top" | "bottom" | "left" | "right";

  /**
   * 副文本样式
   */
  subtextStyle?: Record<string, string>;

  // ==================== 提示功能 ====================
  /**
   * 提示内容（支持字符串或 HTML）
   */
  tooltip?: string;

  /**
   * 提示位置
   * @default 'top'
   */
  tooltipPlacement?: ScTextTooltipPlacement;

  /**
   * 提示主题
   * @default 'dark'
   */
  tooltipEffect?: "dark" | "light";

  /**
   * 是否仅在截断时显示提示
   * @default true
   */
  tooltipOnlyTruncated?: boolean;

  // ==================== 编辑功能 ====================
  /**
   * 是否可编辑
   * @default false
   */
  editable?: boolean;

  /**
   * 编辑模式下的占位符
   */
  editPlaceholder?: string;

  /**
   * 编辑模式下的最大长度
   */
  editMaxLength?: number;

  /**
   * 编辑时是否自动获取焦点
   * @default true
   */
  editAutoFocus?: boolean;

  // ==================== 复制功能 ====================
  /**
   * 是否可复制
   * @default false
   */
  copyable?: boolean;

  /**
   * 复制的文本（默认为显示的文本）
   */
  copyText?: string;

  /**
   * 复制成功的提示文本
   * @default '复制成功'
   */
  copySuccessText?: string;

  // ==================== 字体样式 ====================
  /**
   * 字体
   */
  fontFamily?: string;

  /**
   * 字体大小（支持数字或字符串）
   */
  fontSize?: number | string;

  /**
   * 字体粗细
   */
  fontWeight?: number | string;

  /**
   * 字体颜色
   */
  color?: string;

  // ==================== 文本装饰 ====================
  /**
   * 是否加粗
   * @default false
   */
  bold?: boolean;

  /**
   * 是否斜体
   * @default false
   */
  italic?: boolean;

  /**
   * 是否下划线
   * @default false
   */
  underline?: boolean;

  /**
   * 是否删除线
   * @default false
   */
  delete?: boolean;

  /**
   * 是否标记/高亮背景
   * @default false
   */
  mark?: boolean;

  /**
   * 标记背景色
   */
  markColor?: string;

  /**
   * 是否代码样式
   * @default false
   */
  code?: boolean;

  /**
   * 是否键盘样式
   * @default false
   */
  keyboard?: boolean;

  // ==================== 特效功能 ====================
  /**
   * 文本特效
   * @default 'none'
   */
  effect?: ScTextEffect;

  /**
   * 渐变颜色（当 effect 为 'gradient' 时生效）
   */
  gradientColors?: string[];

  /**
   * 渐变方向
   * @default 'to-right'
   */
  gradientDirection?: ScTextGradientDirection;

  /**
   * 打字机效果速度（ms）
   * @default 50
   */
  typingSpeed?: number;

  /**
   * 打字机效果是否循环
   * @default false
   */
  typingLoop?: boolean;

  // ==================== 高亮功能 ====================
  /**
   * 高亮关键词
   */
  highlight?: string | string[];

  /**
   * 高亮颜色
   * @default '#ffc069'
   */
  highlightColor?: string;

  /**
   * 高亮是否区分大小写
   * @default false
   */
  highlightCaseSensitive?: boolean;

  // ==================== 前后缀 ====================
  /**
   * 前缀图标
   */
  prefixIcon?: string;

  /**
   * 后缀图标
   */
  suffixIcon?: string;

  /**
   * 前缀文本
   */
  prefix?: string;

  /**
   * 后缀文本
   */
  suffix?: string;

  // ==================== 链接功能 ====================
  /**
   * 链接地址（设置后变为链接模式）
   */
  href?: string;

  /**
   * 链接打开方式
   * @default '_blank'
   */
  target?: "_blank" | "_self" | "_parent" | "_top";

  // ==================== 徽章功能 ====================
  /**
   * 徽章内容
   */
  badge?: string | number;

  /**
   * 徽章类型
   * @default 'danger'
   */
  badgeType?: ScTextType;

  /**
   * 是否为圆点徽章
   * @default false
   */
  badgeDot?: boolean;

  // ==================== 状态 ====================
  /**
   * 是否加载中（显示骨架屏）
   * @default false
   */
  loading?: boolean;

  /**
   * 骨架屏宽度
   */
  loadingWidth?: number | string;

  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean;

  /**
   * 是否可选中
   * @default true
   */
  selectable?: boolean;

  // ==================== 远程调用 ====================
  /**
   * 远程获取文本的函数
   * 返回 Promise<string> 或 string
   */
  fetchText?: () => Promise<string> | string;

  /**
   * 是否立即调用远程函数
   * @default true
   */
  fetchImmediate?: boolean;

  /**
   * 远程调用失败时显示的文本
   * @default '加载失败'
   */
  fetchErrorText?: string;

  /**
   * 远程调用的轮询间隔（毫秒），0 表示不轮询
   * @default 0
   */
  fetchInterval?: number;

  // ==================== TypeIt 打字机 ====================
  /**
   * 是否使用 TypeIt 库实现打字机效果（更丰富的动画）
   * @default false
   */
  useTypeIt?: boolean;

  /**
   * TypeIt 配置选项
   */
  typeItOptions?: {
    /**
     * 打字速度（毫秒）
     * @default 50
     */
    speed?: number;
    /**
     * 删除速度（毫秒）
     */
    deleteSpeed?: number;
    /**
     * 是否显示光标
     * @default true
     */
    cursor?: boolean;
    /**
     * 光标字符
     * @default '|'
     */
    cursorChar?: string;
    /**
     * 光标速度（毫秒）
     */
    cursorSpeed?: number;
    /**
     * 是否循环
     * @default false
     */
    loop?: boolean;
    /**
     * 循环延迟（毫秒）
     */
    loopDelay?: number;
    /**
     * 开始延迟（毫秒）
     */
    startDelay?: number;
    /**
     * 打字后延迟（毫秒）
     */
    afterComplete?: () => void;
    /**
     * 是否在视口内才开始
     * @default false
     */
    waitUntilVisible?: boolean;
    /**
     * 生命周期钩子
     */
    lifeCycle?: boolean;
  };

  /**
   * TypeIt 多段文本序列
   * 例如: ['Hello', 'World'] 会先打 Hello，删除后打 World
   */
  typeItStrings?: string[];
}

/**
 * TypeIt 实例类型
 */
export interface TypeItInstance {
  type: (text: string) => TypeItInstance;
  delete: (num?: number) => TypeItInstance;
  pause: (ms: number) => TypeItInstance;
  break: () => TypeItInstance;
  go: () => TypeItInstance;
  destroy: () => void;
  reset: () => TypeItInstance;
  freeze: () => void;
  unfreeze: () => void;
  is: (status: string) => boolean;
}

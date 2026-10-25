/**
 * ReLoader 类型定义
 *
 * <p>把「加载态」的公共契约集中在这里：组件 props、命令式句柄、回调与关闭原因。
 * 组件与服务（{@link ./service}）共用同一套类型，避免两处签名漂移。</p>
 */

/** 内置动画形态 */
export type ReLoaderVariant =
  /** 进度条：确定进度时给百分比，不确定进度时走条纹滚动 */
  | "progress"
  /** 海浪缓慢上升：不确定型加载的主视觉（默认） */
  | "wave"
  /** 科技双环：小尺寸下最清晰，用于内联提示 */
  | "spin";

/** 尺寸档位 */
export type ReLoaderSize = "sm" | "md" | "lg" | "auto";

/**
 * 完整的尺寸取值。
 *
 * <ul>
 *   <li>{@code sm / md / lg}：固定档位，跨页面观感一致；</li>
 *   <li>{@code number}：精确像素（如 {@code 120}），用于对齐设计稿；</li>
 *   <li>{@code auto}：自适应容器（带上下限，全屏遮罩里不会无限放大）。</li>
 * </ul>
 */
export type ReLoaderSizeValue = ReLoaderSize | number;

/**
 * 与默认插槽的组合方式。
 *
 * <ul>
 *   <li>{@code overlay}：内容照常渲染，上面盖一层半透明遮罩 + 动画（不改变布局）；</li>
 *   <li>{@code replace}：加载期间隐藏内容，只显示动画；</li>
 *   <li>{@code skeleton}：加载期间用 {@code #skeleton} 插槽（或内置骨架）占位，
 *       让「内容要占多大」提前被视觉承诺，避免加载完成后页面跳动。</li>
 * </ul>
 */
export type ReLoaderMode = "overlay" | "replace" | "skeleton";

/**
 * 关闭原因。
 *
 * <ul>
 *   <li>{@code manual}：调用方显式 {@code close()} / 用户点关闭按钮；</li>
 *   <li>{@code auto}：由 {@code loading=false} 驱动的自然结束；</li>
 *   <li>{@code timeout}：超过 {@code timeout} 被自动关闭；</li>
 *   <li>{@code error}：调用了 {@code error()}，或异常回调未阻止默认行为。</li>
 * </ul>
 */
export type ReLoaderCloseReason = "manual" | "auto" | "timeout" | "error" | "cancel";

/** 进度回调载荷 */
export interface ReLoaderProgressPayload {
  /** 0-100；{@code null} 表示不确定进度 */
  percent: number | null;
  /** 触发本次进度的实例 id */
  id: string;
}

/** 设置进度时的选项 */
export interface ReLoaderSetProgressOptions {
  /**
   * 是否平滑过渡到目标值。
   *
   * <p>{@code true} 用默认时长（320ms），也可传具体毫秒数。
   * 批量任务里进度常被频繁更新（每处理完一条 +1），直接跳变会一卡一顿；
   * 平滑过渡把这些小跳变连成连续推进。</p>
   */
  smooth?: boolean | number;
}

/** 重置时的选项 */
export interface ReLoaderResetOptions {
  /** 重置到的进度（默认 0）；传 {@code null} 回到不确定态 */
  percent?: number | null;
  /**
   * 是否重启进度估算（estimateProgress 开启时生效）。
   *
   * <p>默认 **false**：重启后估算器会立刻往上走，进度在几十毫秒内就不再是 0，
   * 与"重置"的字面语义对不上。需要"重置并重新计时"时显式传 true。</p>
   */
  restartEstimate?: boolean;
}

/**
 * 命令式加载句柄。
 *
 * <p>{@link ReLoaderService.open} 返回该句柄，调用方据此推进进度、上报异常、提前关闭。</p>
 */
export interface ReLoaderHandle {
  /** 实例 id（同一页面可能同时存在多个加载态） */
  readonly id: string;
  /** 是否仍处于打开状态 */
  readonly visible: boolean;
  /** 是否处于失败态（可重试时，遮罩显示「重试/关闭」而非动画） */
  readonly failed: boolean;
  /** 当前进度（0-100；null 表示不确定态） */
  readonly percent: number | null;
  /**
   * 设置进度（0-100）；传 {@code null} 回到不确定态。
   *
   * @param percent 目标进度
   * @param options {@code smooth} 为真（或给毫秒数）时平滑过渡而非直接跳变
   */
  setProgress(percent: number | null, options?: ReLoaderSetProgressOptions): ReLoaderHandle;
  /**
   * 重置进度（常用于"重试/重新开始"）。
   *
   * @param options 重置到多少、是否重启进度估算
   */
  reset(options?: ReLoaderResetOptions): ReLoaderHandle;
  /** 更新文案 / 动画形态等可变项 */
  update(patch: Partial<ReLoaderServiceOptions>): ReLoaderHandle;
  /**
   * 上报异常。
   *
   * <p>默认行为是「回调后自动关闭」—— 异常继续挂着加载动画，用户会一直等一个
   * 永远不会来的结果。若调用方在 {@code onError} 里显式 {@code return false}
   * 或在回调中重新 {@code open}，则保留加载态由调用方自己收尾。</p>
   */
  error(err: unknown): ReLoaderHandle;
  /** 关闭（幂等） */
  close(reason?: ReLoaderCloseReason): void;
  /**
   * 取消：通知调用方中止底层操作（onCancel 收到 AbortSignal），然后关闭。
   * 对应遮罩上的「取消」按钮 / Esc。
   */
  cancel(): void;
  /**
   * 重试：仅在 {@code retryable + onRetry} 且处于失败态时有效。
   * 成功后遮罩自动关闭；再次失败则留在失败态。
   */
  retry(): void;
  /** 等待关闭（便于 {@code await} 串联流程） */
  whenClosed(): Promise<ReLoaderCloseReason>;
}

/** 命令式服务参数 */
export interface ReLoaderServiceOptions {
  /** 提示文案 */
  text?: string;
  /** 动画形态 */
  variant?: ReLoaderVariant;
  /** 尺寸：档位 / 精确像素 / auto 自适应 */
  size?: ReLoaderSizeValue;
  /** 动画主色（不传沿用 Element Plus 主色） */
  color?: string;
  /** 初始进度；{@code null} 为不确定态 */
  progress?: number | null;
  /**
   * 初始进度的别名（与组件的 {@code percent} prop 同名）。
   *
   * <p>为什么要别名：组件层叫 {@code percent}、命令式层叫 {@code progress}，
   * 同一个概念两个名字，写业务时很容易传错 —— 而传错会被**静默忽略**
   * （多传了 TS 不认识的字段），表现为"进度怎么设都不动"。这里两个都接受，
   * {@code percent} 优先。</p>
   */
  percent?: number | null;
  /**
   * 无真实进度时是否自动估算（默认 false）。
   *
   * <p>开启后进度按时间渐近逼近上限（默认 90%），{@link ReLoaderHandle.setProgress}
   * 上报真实进度时自动接管，{@code close()} 时补到 100%。
   * 适合"知道会花几秒但拿不到进度"的场景（AI 推理、批量导出等）。</p>
   */
  estimateProgress?: boolean;
  /** 估算上限（默认 90），仅 estimateProgress 时生效 */
  estimateCeiling?: number;
  /** 估算时间常数（毫秒，默认 8000），越大越慢 */
  estimateTau?: number;
  /**
   * 单例模式（默认 false）。
   *
   * <p>为 true 时同一 {@code singletonKey} 只保留一个加载态：重复 open 复用已有实例
   * 并把引用计数 +1，最后一个 close 才真正关闭。用于"并发多个请求共用一个遮罩"。</p>
   */
  singleton?: boolean;
  /** 单例键（默认 "default"）；不同键对应各自独立的单例 */
  singletonKey?: string;
  /**
   * 是否属于「路由级」加载态（默认 false）。
   *
   * <p>路由切换时只有这类会被自动关闭（{@code closeRouterScoped}）。
   * 页面内的局部加载态不应打这个标 —— 否则切回来会看到永远转圈的页面。</p>
   */
  routerScoped?: boolean;
  /** 是否全屏遮罩（默认 true） */
  fullscreen?: boolean;
  /** 是否显示遮罩底色（默认 true；false 时只浮动画，适合轻量局部加载） */
  mask?: boolean;
  /** 是否显示关闭按钮（让用户能主动中止）（默认 false） */
  closable?: boolean;
  /**
   * 取消回调。
   *
   * <p>用户点「取消」（或按 Esc）时触发。调用方应在这里真正中止底层操作 ——
   * 拿到 {@code signal} 传给 fetch/axios 即可；不传也不会报错，只是"遮罩关了
   * 请求还在跑"（比卡着好，但会浪费一次请求）。</p>
   */
  onCancel?: (signal: AbortSignal) => void;
  /** 是否支持按 Esc 取消（默认 true，仅在 closable 时生效） */
  cancelOnEsc?: boolean;
  /**
   * 失败后是否显示「重试」按钮（默认 false）。
   *
   * <p>与 {@link onRetry} 配合：错误发生时遮罩**不自动关闭**，而是切换成失败态，
   * 由用户决定重试或关闭。这样"网络抖一下"不必让用户从头再走一遍流程。</p>
   */
  retryable?: boolean;
  /**
   * 重试回调。
   *
   * <p>返回 Promise：成功后遮罩关闭；再次失败则停留在失败态可继续重试。</p>
   */
  onRetry?: (handle: ReLoaderHandle) => Promise<unknown> | unknown;
  /** 失败态的提示文案（默认"加载失败"） */
  errorText?: string;
  /** 延迟显示（毫秒）：快请求不闪一下白（默认 0） */
  delay?: number;
  /**
   * 最短展示时长（毫秒）：避免「闪一下就消失」造成的视觉抖动（默认 0）。
   * 与 {@code delay} 配合即为常见的「防抖 + 防闪烁」组合。
   */
  minDuration?: number;
  /** 超时自动关闭（毫秒，0/undefined = 不限） */
  timeout?: number;
  /** 打开回调 */
  onOpen?: (handle: ReLoaderHandle) => void;
  /** 进度回调 */
  onProgress?: (payload: ReLoaderProgressPayload) => void;
  /** 关闭回调（任何原因都会触发一次） */
  onClose?: (reason: ReLoaderCloseReason) => void;
  /** 超时回调（在自动关闭之前触发） */
  onTimeout?: (handle: ReLoaderHandle) => void;
  /**
   * 异常回调。
   *
   * @return 返回 {@code false} 表示「不要自动关闭」，由调用方自行收尾；
   *         其它返回值（含 undefined）按默认行为自动关闭
   */
  onError?: (err: unknown, handle: ReLoaderHandle) => boolean | void;
}

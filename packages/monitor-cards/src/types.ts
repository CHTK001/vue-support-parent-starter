/**
 * 监控大屏卡片的<b>共享契约</b>（宿主与各 {@code pages/xx} 贡献方共用）
 *
 * <p>这份类型原来住在 {@code @pages/system} 的监控大屏目录里。问题是贡献方
 * （{@code @pages/actuator}、{@code @pages/apm}）为了声明一张卡片，只能反向依赖
 * 整个系统管理包 —— 一个只读 {@code /actuator/**} 的模块被迫拖进系统域的 API 层、
 * 视图与依赖树。卡片契约是双方共同的语言，按依赖方向应当放在<b>更低</b>的一层：
 * 宿主与贡献方都只依赖本包，谁也不用认识谁。</p>
 *
 * <p>本包只有类型 + 一张运行时注册表，没有任何 UI 组件，也不感知网格布局 ——
 * 卡片摆在哪、多大、怎么持久化，仍然是监控大屏自己的事（见 {@code @pages/system}
 * 的 {@code views/monitor/cards/types.ts}）。</p>
 *
 * @since 4.0.0.51
 */

/**
 * 卡片类型标识。
 *
 * <p>刻意开放为 {@code string} 而不是封闭联合：TypeScript 的模块增强只对
 * interface / namespace 生效，对联合类型无效，{@code pages/xx} 无法用 {@code .d.ts}
 * 扩展一个封闭联合。要让模块贡献自己的卡片，唯一办法是开放类型、改由运行时注册表校验
 * —— 未注册的 type 会渲染成<b>占位卡片</b>（而不是静默丢弃或坏卡片）。</p>
 */
export type MonitorCardType = string;

/**
 * 卡片分类（决定「组件目录」面板里的分组）。
 *
 * <ul>
 *   <li>{@code page} —— 宿主页原生区块（KPI、RESTful 趋势、磁盘分区…），由页面自己渲染</li>
 *   <li>{@code actuator} —— Spring Actuator 端点可视化（由 {@code @pages/actuator} 贡献）</li>
 *   <li>{@code apm} —— APM 观测数据（由 {@code @pages/apm} 贡献，SkyWalking / OTel 合并视图）</li>
 *   <li>{@code custom} —— 用户自建卡片（自定义数据源 / iframe）</li>
 * </ul>
 *
 * <p><b>分类是开放的</b>：宿主只维护「自己认识的几类」，各 {@code pages/xx} 模块贡献卡片时
 * 若用了新分类，目录面板会把它排在末尾而不是丢掉。</p>
 */
export type MonitorCardCategory = "page" | "actuator" | "apm" | "custom";

/** 卡片默认尺寸（网格单位） */
export interface MonitorCardSize {
  /** 横向占几列（1..12） */
  w: number;
  /** 纵向占几行 */
  h: number;
}

/**
 * 数据源配置（自定义卡片必填，内置卡片按需使用）。
 *
 * <p>内置卡片只用到 {@code intervalSec}（轮询间隔）等少量字段；
 * 自定义卡片则要用户自选数据源与展示方式 —— 这正是「自己定制卡片」的入口。</p>
 */
export interface MonitorCardSourceConfig {
  /**
   * 数据源类型：
   * - {@code actuator} 走宿主 API 代理的 /actuator 端点（同源、带登录态，推荐）
   * - {@code url} 直连绝对地址（需对方允许跨域）
   * - {@code iframe} 直接把地址嵌进卡片（不受跨域限制，但不能取数加工）
   */
  kind?: "actuator" | "url" | "iframe";
  /** actuator 路径（如 {@code metrics/jvm.memory.used}）或绝对 URL */
  path?: string;
  /** 自动刷新间隔（秒），0 或未填 = 不自动刷新 */
  intervalSec?: number;
  /** 取值路径（点号分段，支持数组下标），如 {@code measurements.0.value} */
  valuePath?: string;
  /** 展示方式 */
  render?: "kv" | "table" | "json" | "value";
  /** 数值单位后缀（render = value 时生效） */
  unit?: string;
  /** 表格 / 键值列表最多展示条数，未填 = 不截断 */
  limit?: number;
}

/**
 * 已放置的卡片（宿主持久化，卡片组件按它取自己的配置）。
 *
 * <p>贡献方的卡片组件只读 {@code config} 与 {@code title}，不写这份数据 ——
 * 落盘、迁移、清洗都在宿主侧完成。</p>
 */
export interface MonitorCardItem {
  /** 唯一 id（新增时生成，同时是网格坐标的 key） */
  id: string;
  /** 卡片类型（决定渲染器） */
  type: MonitorCardType;
  /** 显示标题（可覆盖注册项默认标题） */
  title: string;
  /**
   * 贡献该卡片的模块标识，随卡片持久化。
   *
   * <p>当前应用未注册该 type 时，渲染成占位卡片并显示「由 xx 模块提供」，
   * 而不是把卡片丢弃 —— 位置得以保留，切回有该模块的应用即可复原。</p>
   */
  source?: string;
  /** 卡片配置（自定义卡片必填，内置卡片选填） */
  config?: MonitorCardSourceConfig;
}

/** 目录元数据（「组件目录」面板用，剥离组件与图标） */
export interface MonitorCardCatalogItem {
  type: MonitorCardType;
  title: string;
  description: string;
  /** 内置图标名（不在内置映射里时回退默认图标） */
  icon: string;
  category: MonitorCardCategory;
  /** 新增卡片时的默认尺寸 */
  defaultSize: MonitorCardSize;
  /** 最多添加几份（0 或负数视为不限） */
  maxCount: number;
  /** 新增时的默认配置 */
  defaultConfig?: MonitorCardSourceConfig;
  /** 是否在设置弹窗里暴露「数据源 / 刷新 / 展示方式」等字段 */
  editableSource?: boolean;
  /** 已添加数量（运行时计算，不参与持久化） */
  counted?: number;
}

/**
 * Actuator 页签与端点元数据（页面与卡片目录共用一份）
 *
 * <p>页签（{@link ActuatorTab}）与端点路径（{@link ACTUATOR_ENDPOINTS}）是
 * {@code /actuator} 独立页面对齐的事实来源：11 个页签各自对应一个原生 Actuator 端点
 * （{@code /actuator/<endpoint>}），页签上的展示口径与卡片（{@code actuatorCards.ts}）
 * 的数据结构互为镜像，避免两侧各抄一份导致不一致。</p>
 *
 * <p>没有卡片（{@code conditions}、{@code configprops}）也进页签：它们同样是排障时要看的
 * 原生端点，卡片目录只放「有独立卡片」的端点，页面页签覆盖全部。</p>
 *
 * @since 4.0.0.51
 */

/** Actuator 页签标识（11 个页签） */
export type ActuatorTab =
  | "health"
  | "info"
  | "metrics"
  | "env"
  | "loggers"
  | "mappings"
  | "beans"
  | "conditions"
  | "threaddump"
  | "configprops"
  | "scheduledtasks";

/** 端点元数据：页签 → 原生端点路径与说明 */
export interface ActuatorEndpointMeta {
  /** 页签标识（与 {@link ActuatorTab} 一致） */
  key: ActuatorTab;
  /** 原生端点路径（相对 {@code /actuator}） */
  path: string;
  /** 中文页签名 */
  label: string;
  /** 端点用途说明 */
  description: string;
}

/**
 * 全部 Actuator 端点元数据（顺序与页签顺序一致）。
 *
 * <p>静态数组而非对象映射：页签顺序在路由与菜单里以数组声明，保持同一份顺序，
 * 避免两处各维护一个顺序导致页签顺序漂移。</p>
 */
export const ACTUATOR_ENDPOINTS: ActuatorEndpointMeta[] = [
  {
    key: "health",
    path: "health",
    label: "健康状态",
    description: "总体 UP/DOWN 与各组件（db、diskSpace、ping…）状态，用于快速判断服务可用性",
  },
  {
    key: "info",
    path: "info",
    label: "应用信息",
    description: "应用自身配置与构建信息（git、build 信息、自定义 info.* 属性）",
  },
  {
    key: "metrics",
    path: "metrics",
    label: "指标",
    description: "Micrometer 指标名清单，每个指标需单独取一次数值（内存 / 线程 / GC / HTTP）",
  },
  {
    key: "env",
    path: "env",
    label: "环境属性",
    description: "属性源结构（配置来源：yml / 环境变量 / 启动参数等）",
  },
  {
    key: "loggers",
    path: "loggers",
    label: "日志级别",
    description: "日志级别清单，可编辑每台 logger 的显式配置级别",
  },
  {
    key: "mappings",
    path: "mappings",
    label: "请求映射",
    description: "已注册的 HTTP 路由与处理器映射（结合 RESTful 统计展示请求次数 / 耗时 / 访问 IP）",
  },
  {
    key: "beans",
    path: "beans",
    label: "Bean 列表",
    description: "所有 Spring Bean 的类别、作用域与来源",
  },
  {
    key: "conditions",
    path: "conditions",
    label: "自动配置",
    description: "Spring Boot 自动配置的条件命中情况（positiveMatches / negativeMatches）",
  },
  {
    key: "threaddump",
    path: "threaddump",
    label: "线程快照",
    description: "线程状态分布与阻塞/等待最久的线程栈顶（不铺整份 threaddump）",
  },
  {
    key: "configprops",
    path: "configprops",
    label: "配置属性",
    description: "各 Bean 的 property 配置项（前缀 / 属性名 / 值）",
  },
  {
    key: "scheduledtasks",
    path: "scheduledtasks",
    label: "定时任务",
    description: "Spring 托管定时任务与动态调度注册中心的任务（可编辑 cron / 启停 / 立即执行）",
  },
];

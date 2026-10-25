/**
 * 服务管理列表页的纯展示逻辑。
 *
 * <p>抽出来不是为了「代码更干净」，而是因为这一段是<b>用户唯一能看到真相的地方</b>：
 * 状态灯、统计数字、搜索命中范围全在这里算。它原先写在 `.vue` 的
 * `computed` 里，改错了 TypeScript 与构建全绿，只有真人对着屏幕才发现
 * 「异常」却看不到原因、或者搜索搜不到明明在列表里的节点。</p>
 *
 * <p>三条口径必须与后端 {@code ServerNodeView} 对齐，改动前先读
 * {@code ServerManageServiceImpl#toView}：</p>
 * <ul>
 *   <li>{@code status} 只有 {@code RUNNING / STOPPED / ERROR} 三种，
 *       但后端允许写入未知值（历史数据、手工改库），因此这里必须有兜底分支，
 *       不能让未知状态渲染成空白或「运行中」。</li>
 *   <li>{@code error} 只在 {@code ERROR} 时有值，但后端并不保证它一定非空
 *       （节点定义还在、运行态刚失败时可能是空串）。</li>
 *   <li>统计口径：{@code plugins} 累加各节点过滤器数，
 *       <b>不按 enabled 去重</b> —— 停用的过滤器仍占位，显示的是「挂了多少个」，
 *       而不是「生效了多少个」。</li>
 * </ul>
 */
import type { ProtocolMeta, ServerNodeView } from "../api/serviceManage";

/** 状态灯的展示类型（与 ReStatusIndicator 的 type 对齐） */
export type StatusTone = "success" | "info" | "danger";

/** 单个节点的状态展示结果 */
export interface NodeStatusMeta {
  /** 中文状态文案 */
  text: string;
  /** 状态灯色调 */
  tone: StatusTone;
  /** 是否呼吸动画（仅运行中） */
  pulse: boolean;
  /**
   * 需要向用户展示的失败原因；空串表示「没有可展示的原因」。
   *
   * <p>单独抽成字段而不是让模板去判断，是为了让「异常但没有原因」这件事
   * 在测试里可断言 —— 它是最容易被漏掉的分支，而漏掉的表现恰好是
   * 用户看到红点却得不到任何解释。</p>
   */
  reason: string;
}

/** 列表统计 */
export interface NodeStats {
  /** 节点总数 */
  total: number;
  /** 运行中 */
  running: number;
  /** 已停止 */
  stopped: number;
  /** 异常 */
  error: number;
  /** 未知状态（后端写入的非枚举值），正常情况下为 0 */
  unknown: number;
  /** 挂载的过滤器总数 */
  plugins: number;
}

/** 列表过滤条件 */
export interface NodeFilter {
  /** 关键字，匹配名称/协议/描述/监听地址 */
  keyword?: string;
  /** 协议精确匹配，空串表示不过滤 */
  protocol?: string;
  /**
   * 状态精确匹配，空串表示不过滤。
   *
   * <p>{@code UNKNOWN} 是合法取值：它匹配所有既非 RUNNING 也非 STOPPED /
   * ERROR 的节点（后端写入的非枚举状态、字段缺失）。状态页签的「未知」档
   * 必须能选中这类节点，否则它们会在页签计数里被统计却点不到。</p>
   */
  status?: string;
}

/**
 * 判断节点是否属于某个状态档。
 *
 * <p>与 {@link summarizeNodes} 用同一套判定规则，保证「页签上的计数」
 * 和「点进去看到的行数」永远一致。两处若各写一套，未知状态这类边界
 * 就会出现计数是 3、点开却只有 1 行的矛盾。</p>
 *
 * @param node 节点
 * @param status 状态档（RUNNING / STOPPED / ERROR / UNKNOWN）
 * @return 是否属于该档
 */
export function matchStatusSlot(
  node: ServerNodeView | null | undefined,
  status: string,
): boolean {
  const actual = node?.status ?? "";
  if (!actual) {
    return status === "UNKNOWN";
  }
  if (status === "UNKNOWN") {
    return !(actual in STATUS_TEXT);
  }
  return actual === status;
}

/** 状态文案表：未知状态走 unknown 兜底，不复用任何已有文案 */
const STATUS_TEXT: Record<string, string> = {
  RUNNING: "运行中",
  STOPPED: "已停止",
  ERROR: "异常",
};

/** 状态色调表 */
const STATUS_TONE: Record<string, StatusTone> = {
  RUNNING: "success",
  STOPPED: "info",
  ERROR: "danger",
  unknown: "info",
};

/**
 * 取空白安全的原因文案。
 *
 * @param raw 后端原样返回的 error 字段
 * @return 去掉首尾空白后的原因；没有可用内容时返回空串
 */
function normalizeReason(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * 计算单个节点的状态展示信息。
 *
 * @param node 节点视图
 * @return 状态展示结果；传入 null 时按「未知」处理
 */
export function deriveStatusMeta(node: ServerNodeView | null | undefined): NodeStatusMeta {
  const status = node?.status ?? "";
  const known = status in STATUS_TEXT;
  return {
    // 未知状态显式标注，不让红点/绿点替它撒谎
    text: known ? STATUS_TEXT[status] : `未知(${status || "空"})`,
    tone: STATUS_TONE[known ? status : "unknown"],
    pulse: status === "RUNNING",
    reason: status === "ERROR" ? normalizeReason(node?.error) : "",
  };
}

/**
 * 统计列表。
 *
 * @param nodes 节点列表
 * @return 统计结果；传入空列表时全部为 0，不返回 NaN
 */
export function summarizeNodes(nodes: readonly ServerNodeView[] | null | undefined): NodeStats {
  const stats: NodeStats = {
    total: 0,
    running: 0,
    stopped: 0,
    error: 0,
    unknown: 0,
    plugins: 0,
  };
  if (!Array.isArray(nodes)) {
    return stats;
  }
  for (const node of nodes) {
    stats.total += 1;
    const status = node?.status ?? "";
    if (status === "RUNNING") {
      stats.running += 1;
    } else if (status === "STOPPED") {
      stats.stopped += 1;
    } else if (status === "ERROR") {
      stats.error += 1;
    } else {
      // 后端写入枚举外的值时必须单独计数，否则 total 对不上分项之和，
      // 统计卡片会出现「1+2+3 ≠ 总数」而没人说得清多出来的是什么
      stats.unknown += 1;
    }
    stats.plugins += node?.filters?.length ?? 0;
  }
  return stats;
}

/**
 * 取节点参与搜索匹配的文本。
 *
 * <p>刻意包含 {@code error}：节点异常时用户最想搜的就是报错关键字
 * （如端口号、BindException），只搜名称等于把排障入口堵死。</p>
 *
 * @param node 节点视图
 * @return 小写化的匹配文本
 */
function searchableText(node: ServerNodeView): string {
  return [
    node.name,
    node.protocol,
    node.protocolDesc ?? "",
    node.host ?? "",
    node.port ?? "",
    node.engine ?? "",
    node.serverUrl ?? "",
    node.error ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * 按关键字与协议过滤节点。
 *
 * @param nodes 节点列表
 * @param filter 过滤条件
 * @return 命中过滤的节点（保持原顺序，不复制元素）
 */
export function filterNodes(
  nodes: readonly ServerNodeView[] | null | undefined,
  filter: NodeFilter = {},
): ServerNodeView[] {
  if (!Array.isArray(nodes)) {
    return [];
  }
  const keyword = (filter.keyword ?? "").trim().toLowerCase();
  const protocol = filter.protocol ?? "";
  const status = filter.status ?? "";
  return nodes.filter(node => {
    if (protocol && node?.protocol !== protocol) {
      return false;
    }
    if (status && !matchStatusSlot(node, status)) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    return searchableText(node).includes(keyword);
  });
}

/**
 * 渲染监听地址。
 *
 * <p>空端口渲染成 {@code -} 而不是 {@code null}：列表里「监听地址」为空
 * 通常意味着定义不完整，是需要被看见的异常状态。</p>
 *
 * @param node 节点视图
 * @return 形如 {@code 0.0.0.0:19080} 的文本
 */
export function formatListenText(node: ServerNodeView | null | undefined): string {
  const host = node?.host?.trim() ? node.host.trim() : "0.0.0.0";
  const port = node?.port;
  return `${host}:${port ?? "-"}`;
}

/**
 * 协议下拉选项。
 *
 * <p>SPI 动态发现的协议加「（SPI）」后缀，与既有列表展示保持一致，
 * 避免同一个协议在筛选框和表格里长得不一样。</p>
 *
 * @param protocols 协议元数据
 * @return 下拉选项
 */
export function buildProtocolOptions(
  protocols: readonly ProtocolMeta[] | null | undefined,
): Array<{ label: string; value: string }> {
  if (!Array.isArray(protocols)) {
    return [];
  }
  return protocols
    .filter(p => !!p?.alias)
    .map(p => ({
      label: `${p.alias}${p.spi ? "（SPI）" : ""} - ${p.desc ?? ""}`,
      value: p.alias,
    }));
}

/**
 * 判断是否为反向代理类协议（表格里用不同颜色区分）。
 *
 * @param protocol 协议编码
 * @return true 表示代理类
 */
export function isProxyProtocol(protocol: unknown): boolean {
  return typeof protocol === "string" && protocol.indexOf("proxy") >= 0;
}
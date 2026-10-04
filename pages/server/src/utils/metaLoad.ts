/**
 * 首屏三类数据的加载结果归类。
 *
 * <p><b>要解决的问题</b>：列表、协议元数据、插件元数据是三个独立请求，
 * 原实现对后两个直接 {@code .catch(() => [])}。于是在协议接口故障时，
 * 界面表现是「协议下拉是空的」，而没有任何提示：用户点「新增服务」，
 * 面对一个空下拉框，只能猜是接口挂了还是自己没有权限。</p>
 *
 * <p>更糟的是它<b>看起来是加载成功</b> —— 表格正常渲染、统计卡正常出数，
 * 唯独下拉是空的。这类「静默降级」比直接报错更难排查，因为没有任何一处
 * 报错的痕迹。</p>
 *
 * <p>这里把三类结果归成一条明确口径：<b>节点列表失败 = 致命（阻断），
 * 元数据失败 = 降级但必须出声</b>。</p>
 */

/** 三个请求各自的成败 */
export interface MetaLoadResult {
  /** 节点列表是否成功 */
  nodesOk: boolean;
  /** 协议元数据是否成功 */
  protocolsOk: boolean;
  /** 插件元数据是否成功 */
  filtersOk: boolean;
  /** 节点列表的错误信息 */
  nodesError?: string;
  /** 协议元数据的错误信息 */
  protocolsError?: string;
  /** 插件元数据的错误信息 */
  filtersError?: string;
}

/** 界面应当展示的提示 */
export interface MetaLoadNotice {
  /** 是否需要展示提示条 */
  show: boolean;
  /** 提示类型：error 表示核心功能不可用，warning 表示降级但可用 */
  tone: "error" | "warning";
  /** 提示文案 */
  text: string;
}

/**
 * 按加载结果生成提示。
 *
 * @param result 三类请求的成败与错误信息
 * @returns 提示；一切正常时 {@code show=false}
 */
export function describeMetaLoad(result: MetaLoadResult): MetaLoadNotice {
  const {
    nodesOk,
    protocolsOk,
    filtersOk,
    nodesError,
    protocolsError,
    filtersError,
  } = result;

  // 节点列表挂了就没有任何可管理的内容，属于致命失败
  if (!nodesOk) {
    return {
      show: true,
      tone: "error",
      text: `服务列表加载失败：${nodesError ?? "未知原因"}`,
    };
  }

  const degraded: string[] = [];
  if (!protocolsOk) {
    degraded.push(`协议列表（${protocolsError ?? "未知原因"}）`);
  }
  if (!filtersOk) {
    degraded.push(`插件列表（${filtersError ?? "未知原因"}）`);
  }
  if (degraded.length > 0) {
    return {
      show: true,
      tone: "warning",
      text: `部分元数据加载失败：${degraded.join("、")}。协议与插件下拉可能不完整，新建/编辑前请先刷新确认。`,
    };
  }

  return { show: false, tone: "warning", text: "" };
}
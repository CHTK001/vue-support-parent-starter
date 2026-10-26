/**
 * 中间件管理页（InfluxDB / Neo4j / Nacos / ZooKeeper）共用逻辑
 *
 * <p>这四页只做一件事：把「数据源管理」里登记的连接配置读出来，再调用各自的后台接口取真实数据。
 * 后台接口缺失或目标服务不可达时，把原因摊开给使用者，不再回退到任何内置演示数据。</p>
 *
 * <p>数据源解析有两种策略，由 {@link MiddlewareSourceOptions.strict} 选择：</p>
 * <ul>
 *   <li><b>宽松（默认）</b>：路由未带 {@code datasourceId} 时，自动挑选该类型的第一个数据源。
 *       四个管理页的菜单项均 {@code showLink: false}，正常入口是从数据源中心点击进入，
 *       但直接输地址栏访问时也能工作。</li>
 *   <li><b>严格</b>：路由必须带合法 {@code datasourceId}，缺失或类型不匹配都直接给出原因。
 *       适用于只能从数据源中心进入、不允许猜测的场景。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0
 */
import { ref, type Ref } from "vue";
import { useRoute } from "vue-router";
import { fetchDataSource, fetchDataSources, getDatasourceHubBase, type DataSourceInfo } from "@pages/datasource";

/**
 * 「目标实例连不上」类错误的特征。
 *
 * <p>后端把驱动侧的 {@code ConnectException} 原样塞进 msg，直接把类名摆给使用者没有任何指导意义，
 * 因此统一识别成「连不上某个地址」并补上该看哪里。</p>
 */
const CONNECT_FAILURE =
  /ConnectException|Connection refused|connect timed out|Read timed out|UnknownHost|No route to host|Network is unreachable|ECONNREFUSED|ECONNRESET|SocketTimeout|Connection reset|连接被拒绝|拒绝连接|连接超时|读取超时|无法连接|连接失败/i;

/** 单个接口的失败记录 */
interface EndpointFailure {
  /** 失败的接口路径 */
  api: string;
  /** 失败归类：missing=后端没这个接口，conn=目标实例连不上，other=其它原因 */
  kind: "missing" | "conn" | "other";
  /** 可直接展示的原因文本 */
  message: string;
}

/** 中间件数据源状态 */
export interface MiddlewareSourceState {
  /** 当前页要操作的数据源 ID */
  datasourceId: Ref<number | undefined>;
  /** 数据源配置（主机/端口/名称），未解析到时为 null */
  source: Ref<DataSourceInfo | null>;
  /** 非空即「读不到真实数据」的原因，页面据此提示 */
  gap: Ref<string>;
  /** 解析数据源：优先路由参数 datasourceId，宽松模式下缺省取该类型的第一个数据源 */
  bind: (type: string) => Promise<void>;
  /** 记录一次接口失败原因 */
  fail: (error: unknown, api: string) => void;
  /**
   * 标记某个接口已恢复正常。
   *
   * <p>传入接口路径时只清除该接口的失败记录，别处尚未解决的问题继续留在提示条上；
   * 不传参数表示整页状态清空（历史行为，兼容既有调用点）。</p>
   */
  ready: (api?: string) => void;
  /**
   * 读取数据源的展示字段，值为空时返回兜底文本。
   *
   * <p>页面已持有 {@link MiddlewareSourceState.source} 时可直接调用，
   * 无需再单独 import {@link extraText}。</p>
   */
  readField: (datasource: DataSourceInfo | null, keys: string[], fallback?: string) => string;
}

/** 数据源解析选项 */
export interface MiddlewareSourceOptions {
  /**
   * 严格模式：路由必须带合法 {@code datasourceId}，否则直接给出原因，不自动挑选数据源。
   *
   * @default false
   */
  strict?: boolean;
}

/**
 * 创建中间件数据源状态。
 *
 * @param options 解析策略选项
 * @returns 数据源状态与配套方法
 */
export function useMiddlewareSource(options: MiddlewareSourceOptions = {}): MiddlewareSourceState {
  const { strict = false } = options;
  const route = useRoute();
  const queryId = Number(route.query.datasourceId);
  const datasourceId = ref<number | undefined>(Number.isFinite(queryId) && queryId > 0 ? queryId : undefined);
  const source = ref<DataSourceInfo | null>(null);
  const gap = ref("");
  /** 当前页的数据源类型，只用于把「连不上」的提示写具体（Neo4j / Nacos …） */
  let sourceType = "";
  /**
   * 按接口聚合失败原因。
   *
   * <p>以前的提示条是一个裸字符串，谁最后失败就写谁：Neo4j 先查 labels 再查 relationships，
   * 实例连不上时两个接口都失败，使用者却只看到 relationships 那一条，labels 的失败被静默吞掉。
   * 改成按接口记录后，一次读取轮次里所有失败的接口都会如实列出。</p>
   */
  const failures = new Map<string, EndpointFailure>();

  const clearGap = () => {
    failures.clear();
    gap.value = "";
  };

  /** 数据源的可读地址，形如 {@code 127.0.0.1:7474}；未解析到数据源时为空串 */
  const targetAddress = (): string => {
    const current = source.value as unknown as Record<string, unknown> | null;
    if (!current) return "";
    const host = String(current.host ?? "").trim();
    if (!host) return "";
    const port = current.port;
    return port === undefined || port === null || String(port).trim() === "" ? host : `${host}:${port}`;
  };

  /** 把已记录的失败摊成一句人话 */
  const renderGap = () => {
    const list = [...failures.values()];
    if (list.length === 0) {
      gap.value = "";
      return;
    }
    const missing = list.filter(item => item.kind === "missing");
    if (missing.length > 0) {
      const listed = missing.map(item => item.api).slice(0, 3).join("、");
      gap.value = `后端未提供 ${listed}${missing.length > 3 ? " 等接口" : ""}（HTTP 404），本页无真实数据可显示`;
      return;
    }
    if (list.every(item => item.kind === "conn")) {
      const address = targetAddress();
      const who = sourceType ? ` ${sourceType} 实例` : "目标服务";
      gap.value = `连不上${who}${address ? ` ${address}` : ""}，请确认实例已启动且端口可达（失败接口：${list
        .map(item => item.api)
        .join("、")}）`;
      return;
    }
    gap.value =
      list.length === 1 ? list[0].message : `${list.length} 处读取失败：${list.map(item => item.message).join("；")}`;
  };

  /**
   * 读取数据源的展示字段，值为空时返回兜底文本。
   *
   * <p>数据源详情接口当前只返回 {@link DataSourceInfo} 上声明的平铺字段，
   * 没有额外的 config map，因此按字段名依次取第一个非空值；未来接口若新增扩展字段，
   * 只需在此处补一个取值分支。</p>
   *
   * @param datasource 数据源详情
   * @param keys       字段名，按优先级排列
   * @param fallback   未配置时的兜底文本
   * @returns 字段文本
   */
  const readField = (datasource: DataSourceInfo | null, keys: string[], fallback = "-"): string => {
    if (!datasource) return fallback;
    const record = datasource as unknown as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value);
      }
    }
    return fallback;
  };

  const bind = async (type: string) => {
    sourceType = type;
    try {
      if (datasourceId.value) {
        const found = await fetchDataSource(datasourceId.value);
        if (found && found.type !== type) {
          gap.value = `数据源 #${datasourceId.value} 是 ${found.type} 类型，与本页 ${type} 管理不匹配`;
          return;
        }
        source.value = found;
        clearGap();
        return;
      }
      if (strict) {
        gap.value = `请先在「数据源管理」中新增一个 ${type} 数据源，再从列表点击进入本页面`;
        return;
      }
      const all = await fetchDataSources();
      const picked = (all || []).find(d => d.type === type);
      if (!picked) {
        gap.value = `尚未登记 ${type} 数据源，请先在「数据源管理」新增后再回到本页`;
        return;
      }
      datasourceId.value = picked.id;
      source.value = picked;
      clearGap();
    } catch (e) {
      fail(e, `${getDatasourceHubBase()}/list`);
    }
  };

  const fail = (error: unknown, api: string) => {
    const msg = String((error as Error)?.message ?? error ?? "").trim();
    // 目标实例压根连不上：这类原因跟「接口不存在」「业务报错」的处理方式完全不同，
    // 必须单独说清是哪个地址连不上，使用者才知道该去看实例还是看后端
    if (CONNECT_FAILURE.test(msg)) {
      const address = targetAddress();
      const who = sourceType ? `${sourceType} 实例` : "目标服务";
      failures.set(api, { api, kind: "conn", message: address ? `连不上 ${who} ${address}` : `连不上${who}` });
      renderGap();
      return;
    }
    // 只认 axios 对 HTTP 404 的固定文案与后端明确的「无路由」提示；
    // 业务失败的 msg 里也可能带远端状态码（如 Nacos 配置不存在），不能按裸 404 判定
    if (/status code 404|No static resource|no handler|资源不存在/i.test(msg)) {
      failures.set(api, { api, kind: "missing", message: msg });
      renderGap();
      return;
    }
    failures.set(api, { api, kind: "other", message: `调用 ${api} 失败：${msg || "未知错误"}` });
    renderGap();
  };

  const ready = (api?: string) => {
    if (!api) {
      clearGap();
      return;
    }
    // 只销自己这条：别的接口还没恢复时，提示条不能被这次成功抹掉
    if (failures.delete(api)) renderGap();
  };

  return { datasourceId, source, gap, bind, fail, ready, readField };
}

/**
 * 读取数据源的展示字段，值为空时返回兜底文本。
 *
 * <p>与 {@link useMiddlewareSource} 内部实现一致，供页面在已持有 {@code source} 时
 * 单独取字段（如「组织」这类可能落在不同列上的扩展信息）。</p>
 *
 * @param datasource 数据源详情
 * @param keys       字段名，按优先级排列
 * @param fallback   未配置时的兜底文本
 * @returns 字段文本
 */
export function extraText(
  datasource: DataSourceInfo | null,
  keys: string[],
  fallback = "-"
): string {
  if (!datasource) return fallback;
  const record = datasource as unknown as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return fallback;
}

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
  /** 成功后清理原因 */
  ready: () => void;
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
  /** 累积「后端未提供」的端点，避免并发加载互相覆盖 */
  const missing = new Set<string>();

  const clearGap = () => {
    missing.clear();
    gap.value = "";
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
    const msg = String((error as Error)?.message ?? error ?? "");
    // 只认 axios 对 HTTP 404 的固定文案与后端明确的「无路由」提示；
    // 业务失败的 msg 里也可能带远端状态码（如 Nacos 配置不存在），不能按裸 404 判定
    if (/status code 404|No static resource|no handler|资源不存在/i.test(msg)) {
      missing.add(api);
      const listed = [...missing].slice(0, 3).join("、");
      gap.value = `后端未提供 ${listed}${missing.size > 3 ? " 等接口" : ""}（HTTP 404），本页无真实数据可显示`;
      return;
    }
    gap.value = `调用 ${api} 失败：${msg || "未知错误"}`;
  };

  const ready = () => {
    clearGap();
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

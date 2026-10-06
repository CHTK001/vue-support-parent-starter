import { ref, watch, type Ref } from "vue";
import { fetchDataSource, type DataSourceInfo } from "@pages/datasource";

/**
 * 外部服务管理页（InfluxDB / Neo4j / Nacos / ZooKeeper）共用的数据源解析。
 *
 * <p>四个管理页的接口都要求携带 {@code datasourceId}（后端不做兜底），
 * 该 id 由「数据源管理」列表点击进入时通过路由 query 传入。
 * 本组合式函数负责：解析 query 中的 id、回查数据源详情、
 * 校验类型是否匹配，并在缺失/不匹配时给出可直接展示的提示文案。</p>
 *
 * @author CH
 * @since 4.0.0
 */
export interface ExternalDatasource {
  /** 数据源 id，缺失或非法时为 null */
  datasourceId: Ref<number | null>;
  /** 数据源详情，尚未加载或加载失败时为 null */
  datasource: Ref<DataSourceInfo | null>;
  /** 错误提示文案，无问题时为空串 */
  error: Ref<string>;
  /** 是否为首次加载中 */
  loading: Ref<boolean>;
  /** 重新回查数据源详情 */
  reload: () => Promise<void>;
}

/**
 * 解析并校验当前路由对应的外部服务数据源。
 *
 * @param query        路由 query（响应式）
 * @param expectedType 期望的数据源类型，如 {@code influxdb}
 * @param typeLabel    类型中文名，用于提示文案
 * @returns 数据源引用
 */
export function useExternalDatasource(
  query: () => Record<string, unknown>,
  expectedType: string,
  typeLabel: string
): ExternalDatasource {
  const datasourceId = ref<number | null>(null);
  const datasource = ref<DataSourceInfo | null>(null);
  const error = ref("");
  const loading = ref(false);

  const missing = (reason: string) => {
    datasourceId.value = null;
    datasource.value = null;
    error.value = reason;
  };

  /**
   * 重新解析并回查数据源详情。
   *
   * <p>注意赋值顺序：详情加载成功后才同时写入 {@code datasource} 与
   * {@code datasourceId}，两者在同一个 tick 内变更，页面侧的
   * {@code watch([datasourceId, error])} 因此只会收到一次回调，且回调里
   * 读到的 {@code datasource} 已经是最新值（连接探测依赖 host/port/凭据）。</p>
   */
  const reload = async () => {
    error.value = "";
    datasource.value = null;

    const raw = query().datasourceId;
    const text = Array.isArray(raw) ? raw[0] : raw;
    if (text === undefined || text === null || String(text).trim() === "") {
      missing(`请先在「数据源管理」中新增一个 ${typeLabel} 数据源，再从列表点击进入本页面`);
      return;
    }
    const id = Number(text);
    if (!Number.isFinite(id) || id <= 0) {
      missing(`路由参数 datasourceId 非法：${String(text)}`);
      return;
    }

    loading.value = true;
    try {
      const info = await fetchDataSource(id);
      if (info?.type && info.type !== expectedType) {
        missing(
          `数据源「${info.name ?? id}」类型为 ${info.type}，与 ${typeLabel} 管理页不匹配，请在「数据源管理」中选择 ${expectedType} 类型的数据源`
        );
        return;
      }
      // 同一 tick 内写入 id 与详情，保证 watch 回调读到一致状态
      datasource.value = info;
      datasourceId.value = id;
    } catch (e) {
      missing(`数据源加载失败：${(e as Error)?.message ?? String(e)}`);
    } finally {
      loading.value = false;
    }
  };

  watch(() => query().datasourceId, reload, { immediate: true });

  return { datasourceId, datasource, error, loading, reload };
}

/**
 * 读取数据源扩展字段（{@code config} map），值为空时返回兜底文本。
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
  for (const key of keys) {
    const value = datasource.config?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return fallback;
}

/**
 * 中间件管理页（InfluxDB / Neo4j / Nacos / ZooKeeper）共用逻辑
 *
 * <p>这四页只做一件事：把「数据源管理」里登记的连接配置读出来，再调用各自的后台接口取真实数据。
 * 后台接口缺失或目标服务不可达时，把原因摊开给使用者，不再回退到任何内置演示数据。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { ref, type Ref } from "vue";
import { useRoute } from "vue-router";
import { fetchDataSource, fetchDataSources, type DataSourceInfo } from "@pages/datasource";

/** 中间件数据源状态 */
export interface MiddlewareSourceState {
  /** 当前页要操作的数据源 ID */
  datasourceId: Ref<number | undefined>;
  /** 数据源配置（主机/端口/名称），未解析到时为 null */
  source: Ref<DataSourceInfo | null>;
  /** 非空即「读不到真实数据」的原因，页面据此提示 */
  gap: Ref<string>;
  /** 解析数据源：优先路由参数 datasourceId，缺省取该类型的第一个数据源 */
  bind: (type: string) => Promise<void>;
  /** 记录一次接口失败原因 */
  fail: (error: unknown, api: string) => void;
  /** 成功后清理原因 */
  ready: () => void;
}

/**
 * 创建中间件数据源状态。
 * @returns 数据源状态与配套方法
 */
export function useMiddlewareSource(): MiddlewareSourceState {
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
      fail(e, "/ms/monitor/datasource");
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

  return { datasourceId, source, gap, bind, fail, ready };
}

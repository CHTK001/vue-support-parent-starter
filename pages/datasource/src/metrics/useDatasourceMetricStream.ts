/**
 * 数据源监控指标的实时推送（SSE）订阅。
 *
 * <p>与 {@code ../nginx/useNginxStream} 同构，差异有一处是结构性的：
 * 指标是一个数据源的一组数值，不是 7 条独立曲线，所以不需要「按指标各自封顶」；
 * 二是推送载荷自带一小段窗口（{@code points}），因此这里是把窗口整体替换成
 * 服务端给的版本，而不是逐点追加 —— 服务端窗口已经做过抽稀与「保留最后一点」，
 * 前端再逐点合并反而会把抽稀后的稀疏点重新堆回密集。</p>
 *
 * <p>用共享的 {@code http().sse()} 而不是裸 {@code EventSource}：后者不能带自定义
 * header，而本项目所有 {@code /ms/**} 请求都靠 token 鉴权，裸 EventSource 建连会拿不到
 * 数据且只在控制台留一条不显眼的报错。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import { http } from "@repo/utils";
import {
  datasourceMetricStreamUrl,
  type DatasourceMetricPoint,
  type DatasourceMetricPush,
} from "../api";

/** SSE 连接状态，供界面显示「实时中 / 重连中」。 */
export type MetricStreamState = "idle" | "connecting" | "open" | "error";

/** 单次会话最多保留的点数。60s 一轮 × 6 小时 ≈ 360 点，留出余量。 */
const MAX_POINTS = 600;

export interface DatasourceMetricStreamOptions {
  /** 一轮采集的结果（用于刷新顶部状态胶囊） */
  onPush?: (push: DatasourceMetricPush) => void;
  /** 曲线点已更新（窗口被替换） */
  onPoints?: (points: DatasourceMetricPoint[]) => void;
}

export interface DatasourceMetricStreamHandle {
  /** 连接状态 */
  state: Ref<MetricStreamState>;
  /** 最近一次推送时刻 */
  lastPushAt: Ref<string | null>;
  /** 关闭连接 */
  close: () => void;
}

/**
 * 订阅某数据源的指标实时推送，并在数据源切换时自动重连。
 *
 * @param datasourceId 响应式数据源 id
 * @param options       回调
 * @returns 控制句柄
 */
export function useDatasourceMetricStream(
  datasourceId: Ref<number | undefined>,
  options: DatasourceMetricStreamOptions = {},
): DatasourceMetricStreamHandle {
  const state = ref<MetricStreamState>("idle");
  const lastPushAt = ref<string | null>(null);
  let client: { close: () => void } | null = null;

  const close = (): void => {
    client?.close();
    client = null;
    state.value = "idle";
  };

  const connect = (): void => {
    close();
    const id = datasourceId.value;
    if (!id) {
      return;
    }
    state.value = "connecting";
    // 泛型给 unknown：共享客户端的 parseData 已经把 data 解析成对象了，
    // 真正的解析在 safeParse 里按实际形态分支
    client = http()
      .get(datasourceMetricStreamUrl(id))
      .sse<unknown>({
        onOpen: () => {
          state.value = "open";
        },
        onMessage: ev => {
          state.value = "open";
          // ready 事件只说明链路通了，没有任何业务数据，不更新时间戳：
          // 否则「最近更新」会显示成一个比上一次真实采集还新的时间。
          if (ev.event !== "metric") {
            return;
          }
          lastPushAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
          const push = safeParse<DatasourceMetricPush>(ev.data);
          if (!push) {
            return;
          }
          options.onPush?.(push);
          const points = push.points?.points ?? [];
          if (points.length) {
            options.onPoints?.(capPoints(points));
          }
        },
        onError: () => {
          state.value = "error";
        },
        onClose: () => {
          state.value = "idle";
        },
        // 采集 60s 一轮，容忍连续几轮失败再放弃重连；否则后端重启一次前端就永久断流
        maxReconnectAttempts: 10,
        reconnectInterval: 3000,
      });
  };

  // 切换数据源：断开旧流、按新 id 重连。
  // 这里刻意**没有**「connecting 去重」标志：那个标志一旦置 true 就再也不复位，
  // 于是第二次以后的切换全被 `!connecting` 挡掉，流会一直挂在旧数据源上 ——
  // 界面表现是「点别的数据源，数字纹丝不动」，而流本身健康得没有任何报错。
  // connect() 开头就 close()，重复建连已经天然被挡住。
  watch(datasourceId, () => connect(), { immediate: true });

  onBeforeUnmount(close);

  return { state, lastPushAt, close };
}

/**
 * 封顶点数，丢最旧的。
 *
 * <p>实时看板看当下；历史完整度由首屏那次趋势查询保证。</p>
 *
 * @param points 服务端给的窗口点
 * @returns 封顶后的新数组
 */
export function capPoints(points: DatasourceMetricPoint[]): DatasourceMetricPoint[] {
  if (points.length <= MAX_POINTS) {
    return points;
  }
  return points.slice(points.length - MAX_POINTS);
}

/** 反序列化，失败返回 null 而不是抛 —— 一条脏帧不该把整条流打死 */
function safeParse<T>(raw: unknown): T | null {
  if (typeof raw !== "string") {
    return (raw as T) ?? null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
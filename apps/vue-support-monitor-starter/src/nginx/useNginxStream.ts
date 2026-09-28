/**
 * Nginx 指标 / 运行态实时推送（SSE）订阅。
 *
 * <p>用共享的 {@code http().sse()} 客户端而不是裸 {@code EventSource}：后者不能带
 * 自定义 header，而本项目所有 {@code /ms/**} 请求都靠 token 鉴权（token 同时走
 * {@code Authorization} 头与 {@code x-oauth-token} query），裸 EventSource 建连
 * 会拿不到数据且只在控制台留一条不显眼的报错。</p>
 *
 * <p><strong>首屏历史不在这条链路上</strong>：SSE 只做增量推送，首屏仍由
 * {@code GET /metric/trend} 一次性拉取。否则建连瞬间就要推 2880 个点/指标，
 * 而页面往往在历史到达前就断了。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import { http } from "@repo/utils";
import {
  nginxMetricStreamUrl,
  type NginxMetricPush,
  type NginxRuntime,
  type NginxTrendPoint,
} from "./api";

/** SSE 连接状态，供界面显示「实时中 / 重连中」。 */
export type StreamState = "idle" | "connecting" | "open" | "error";

/**
 * 单指标点数上限：30s 采集 × 24h = 2880 点。
 *
 * <p><strong>必须按指标各自封顶，不能对合并后的总数组封顶</strong>：后端一轮采集
 * 写 7 个指标（accepts / active / handled / reading / requests / waiting / writing，
 * 已实测），满窗数据是 2880 × 7 = 20160 点。若拿 2880 去卡总数组，
 * 每个指标只剩约 411 点（约 3.4 小时），而图表标题和脚注仍写着「24 小时趋势」——
 * 用户会以为「下午到现在没数据」，实际是被前端悄悄截掉了。
 * 前缀早就在，后缀的窗口就名不副实了。</p>
 */
const MAX_POINTS_PER_METRIC = 2880;

/**
 * 点位去重键。
 *
 * <p>提到模块级：`mergePoints` 是纯函数、不在组件作用域内，
 * 放在 `useNginxStream` 内部它就访问不到。</p>
 */
const keyOf = (p: NginxTrendPoint): string => `${p.name}|${p.time}`;

export interface NginxStreamOptions {
  /** 指标新点（每个指标一个） */
  onMetric?: (points: NginxTrendPoint[]) => void;
  /** 实时运行态 */
  onRuntime?: (runtime: NginxRuntime) => void;
}

export interface NginxStreamHandle {
  /** 连接状态 */
  state: Ref<StreamState>;
  /** 最近一次推送时刻（界面显示「最近更新」用） */
  lastPushAt: Ref<string | null>;
  /** 关闭连接 */
  close: () => void;
}

/**
 * 订阅某数据源的实时推送，并在数据源切换时自动重连。
 *
 * @param datasourceId 响应式数据源 id
 * @param options       回调
 * @returns 控制句柄
 */
export function useNginxStream(
  datasourceId: Ref<number | undefined>,
  options: NginxStreamOptions = {},
): NginxStreamHandle {
  const state = ref<StreamState>("idle");
  const lastPushAt = ref<string | null>(null);
  let client: { close: () => void } | null = null;
  /** 手动建连与由 watch 触发的重连之间需要去重，否则一次切换会建两条流 */
  let connecting = false;

  /** 已推送过的 (name|time)，防止重连后同一点被追加两次而在曲线上叠出双峰 */
  const seen = new Set<string>();

  const close = (): void => {
    client?.close();
    client = null;
    connecting = false;
    state.value = "idle";
  };

  const connect = (): void => {
    close();
    const id = datasourceId.value;
    if (!id) {
      return;
    }
    connecting = true;
    state.value = "connecting";
    // 泛型给 unknown 而不是 string：共享客户端的 parseData 已经把 data 解析成对象了，
    // 写 string 会让类型骗人，真正的解析在 safeParse 里按实际形态分支
    client = http()
      .get(nginxMetricStreamUrl(id))
      .sse<unknown>({
        // 服务端用注释帧保活，共享客户端会丢弃无 data 的空事件，这里不会收到心跳
        onOpen: () => {
          state.value = "open";
        },
        onMessage: ev => {
          state.value = "open";
          lastPushAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
          if (ev.event === "metric") {
            const push = safeParse<NginxMetricPush>(ev.data);
            const points = (push?.points ?? []).filter(p => {
              if (!p?.name || !p.time) {
                return false;
              }
              const k = keyOf(p);
              if (seen.has(k)) {
                return false;
              }
              seen.add(k);
              return true;
            });
            if (points.length) {
              options.onMetric?.(points);
            }
          } else if (ev.event === "runtime") {
            const runtime = safeParse<NginxRuntime>(ev.data);
            if (runtime) {
              options.onRuntime?.(runtime);
            }
          }
        },
        onError: () => {
          state.value = "error";
        },
        onClose: () => {
          state.value = "idle";
        },
        // 采集间隔 30s，容忍连续几轮失败再放弃重连；否则后端重启一次前端就永久断流
        maxReconnectAttempts: 10,
        reconnectInterval: 3000,
      });
  };

  // 数据源切换：断开旧流、按新 id 重连。去重集合也一并清掉，
  // 否则切回上一个数据源时它自己的点会被当成「已见过」而不再追加。
  watch(
    datasourceId,
    id => {
      seen.clear();
      if (id && !connecting) {
        connect();
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(close);

  return { state, lastPushAt, close };
}

/**
 * 合并新点进已有序列：同名同刻替换，同名新刻追加。
 *
 * <p>不做降采样：交给 ECharts 自带的 `sampling: 'lttb'` 处理，
 * 那是在渲染层按像素宽度抽点，既保形状又不丢尖峰，
 * 而前端按固定步长抽会真切掉毛刺。</p>
 *
 * <p><strong>上限按指标各自生效</strong>，见 {@link MAX_POINTS_PER_METRIC} 的说明。
 * 截断时丢最旧的点：实时看板看当下，历史完整度由首屏那次
 * {@code GET /metric/trend} 保证，那次是按窗口查的，不受这里影响。</p>
 *
 * @param prev  已有序列
 * @param added 新到的点
 * @param cap   **单指标**点数上限
 * @returns 合并后的新数组（不改动入参）
 */
export function mergePoints(
  prev: NginxTrendPoint[],
  added: NginxTrendPoint[],
  cap = MAX_POINTS_PER_METRIC,
): NginxTrendPoint[] {
  if (!added.length) {
    return prev;
  }
  const byKey = new Map<string, NginxTrendPoint>();
  for (const p of prev) {
    byKey.set(keyOf(p), p);
  }
  for (const p of added) {
    byKey.set(keyOf(p), p);
  }
  // time 是 ISO 8601 字符串，字典序即时间序；同刻再按 name 排，保证结果稳定可复现
  const all = [...byKey.values()].sort(
    (a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name),
  );
  // 倒着走一遍，每个指标各留最新的 cap 个；正序回填以保持时间升序
  const perMetric = new Map<string, number>();
  const kept: NginxTrendPoint[] = [];
  for (let i = all.length - 1; i >= 0; i--) {
    const p = all[i];
    const n = perMetric.get(p.name) ?? 0;
    if (n >= cap) {
      continue;
    }
    perMetric.set(p.name, n + 1);
    kept.push(p);
  }
  return kept.reverse();
}

/** 反序列化，失败返回 null 而不是抛——一条脏帧不该把整条流打死 */
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

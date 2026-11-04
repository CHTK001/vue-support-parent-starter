/**
 * 监控大屏 APM 卡片的「可用性闸门」
 *
 * <p>APM 卡片和 APM 页面面对同一件事：{@code /api/apm/v1/status} 说本服务器没有可用
 * 引擎时，卡片不该是一片空白，更不该继续按秒打数据接口。这里把判断收敛成一个
 * {@link ApmGateVerdict}，卡片与 {@code ApmCardBody} 共用：</p>
 *
 * <ul>
 *   <li>{@code module-off} —— 前端配置关掉了 APM 模块（与后端无关）；</li>
 *   <li>{@code probing} —— 状态还没回来（首次挂载）；</li>
 *   <li>{@code unreachable} —— 状态接口本身失败（后端不可达），给重试；</li>
 *   <li>{@code absent} —— 后端明确回答「没有可用引擎」，给引擎清单入口；</li>
 *   <li>{@code unsupported} —— 有引擎，但当前引擎缺少这张卡片需要的能力；</li>
 *   <li>{@code ready} —— 可以取数。</li>
 * </ul>
 *
 * <p>{@code ensure()} 只在卡片挂载时调用一次：状态是模块级共享单例，
 * 同屏 5 张卡片不会打 5 次 {@code /status}。</p>
 *
 * @since 4.0.0.51
 */
import { computed, type ComputedRef } from "vue";
import { apmConfig } from "../config";
import { useApmStatus } from "../composables/useApmStatus";

/** 闸门结论 */
export type ApmGateVerdict = "module-off" | "probing" | "unreachable" | "absent" | "unsupported" | "ready";

/** 能力 → 中文名（错误文案用） */
const CAPABILITY_LABEL: Record<string, string> = {
  services: "服务目录",
  instances: "实例",
  endpoints: "端点",
  traces: "链路",
  topology: "拓扑",
  metrics: "指标",
  alarms: "告警",
  alerts: "告警分析",
  logs: "日志",
  runtime: "运行时",
  profiles: "性能剖析",
};

/** 闸门状态 */
export interface ApmCardGate {
  /** 结论 */
  verdict: ComputedRef<ApmGateVerdict>;
  /** 结论是否已允许取数 */
  ready: ComputedRef<boolean>;
  /** 状态接口失败原因（unreachable 时有值） */
  error: ComputedRef<string>;
  /** 当前引擎的能力清单（ready / unsupported 时有值） */
  capabilities: ComputedRef<string[]>;
  /** 引擎名（有状态时） */
  engine: ComputedRef<string>;
  /** 引擎说明（absent 时是后端给的原因） */
  message: ComputedRef<string>;
  /** 当前卡片需要的能力（没有则空串） */
  capability: ComputedRef<string>;
  /** 该能力的中文名 */
  capabilityLabel: ComputedRef<string>;
  /** 首次挂载探活（幂等） */
  ensure: () => void;
  /** 强制重探 */
  refresh: () => Promise<void>;
}

/**
 * 建一个闸门。
 *
 * @param getCapability 卡片需要的能力（如 {@code "traces"}）；不传表示只要引擎可用即可
 */
export function useApmCardGate(getCapability?: () => string | undefined): ApmCardGate {
  const { status, loading, error, ensure, refresh, supports } = useApmStatus();

  const capability = computed(() => (getCapability?.() ?? "").trim());

  const verdict = computed<ApmGateVerdict>(() => {
    if (!apmConfig().enable) return "module-off";
    if (!status.value) {
      // 没状态且没报错 = 正在探；报错 = 接口不可达
      return loading.value || !error.value ? "probing" : "unreachable";
    }
    if (!status.value.present) return "absent";
    const cap = capability.value;
    if (cap && !supports(cap)) return "unsupported";
    return "ready";
  });

  return {
    verdict,
    ready: computed(() => verdict.value === "ready"),
    error,
    capabilities: computed(() => status.value?.capabilities ?? []),
    engine: computed(() => status.value?.name ?? ""),
    message: computed(() => status.value?.message ?? ""),
    capability,
    capabilityLabel: computed(() => CAPABILITY_LABEL[capability.value] ?? capability.value),
    ensure: () => void ensure(),
    refresh,
  };
}

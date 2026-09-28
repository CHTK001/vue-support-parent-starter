/**
 * 策略命中统计 —— 跨 5 个页签共用（限流 / IP 名单 / 账号名单 / 消息头 / 接口管控）
 *
 * <p>命中次数与命中明细是「一条策略有没有真的起作用」的唯一可见证据，五个页签都要显示，
 * 所以做成 composable 而不是塞进某一个页签组件。</p>
 *
 * <p>统计是<b>内存态</b>（后端 {@code PolicyHitCollector} 单例），进程重启归零，
 * 因此这里不做本地累加，只在写操作后重新拉一次。</p>
 */
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { policyHitCounts, policyHitDetail } from "../../../../api/systemApi";
import type { PolicyHitDetail, PolicyHitType, RateLimitRule } from "../../../../api/types";

export function usePolicyHit() {
  const { t } = useI18n();

  /**
   * 全部策略的命中次数，键为 `类型|策略键`
   *
   * <p>整张映射一次取回，五个页签的「命中次数」列共用。取不到就退化成全 0 ——
   * 统计是辅助信息，不该让整页加载失败。</p>
   */
  const hitCounts = ref<Record<string, number>>({});

  const hitDialogVisible = ref(false);
  const hitLoading = ref(false);
  const hitTitle = ref("");
  const hitDetail = ref<PolicyHitDetail | null>(null);

  /** 拉取命中次数（页签切换与任何会改变生效状态的写操作之后调用） */
  async function loadHitCounts(): Promise<void> {
    try {
      const res = await policyHitCounts();
      hitCounts.value = res.data ?? {};
    } catch {
      hitCounts.value = {};
    }
  }

  /** 拼后端的复合键 */
  function hitKeyOf(type: PolicyHitType, key?: string | null): string {
    return `${type}|${key ?? ""}`;
  }

  /** 取某条策略的命中次数 */
  function hitCountOf(type: PolicyHitType, key?: string | null): number {
    return hitCounts.value[hitKeyOf(type, key)] ?? 0;
  }

  /** IP 名单类型：后端 0=白名单、1=黑名单 */
  function ipHitType(listType?: number | null): PolicyHitType {
    return listType === 0 ? "IP_WHITE" : "IP_BLACK";
  }

  /** 账号名单类型：后端 1=黑名单、2=白名单 */
  function accHitType(listType?: number | null): PolicyHitType {
    return listType === 2 ? "ACCOUNT_WHITE" : "ACCOUNT_BLACK";
  }

  /** 限流规则的策略键：与运行时令牌桶缓存键一致（维度:目标） */
  function rateHitKey(row: RateLimitRule): string {
    return `${row.dimension ?? ""}:${row.target ?? ""}`;
  }

  /** 打开命中明细弹窗 */
  async function openHitDetail(type: PolicyHitType, key: string, label: string): Promise<void> {
    hitTitle.value = label;
    hitDetail.value = null;
    hitDialogVisible.value = true;
    hitLoading.value = true;
    try {
      const res = await policyHitDetail(type, key);
      hitDetail.value = res.data ?? null;
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : t("policy.hit.loadFailed"));
    } finally {
      hitLoading.value = false;
    }
  }

  /** 趋势点的时间标签（分钟粒度，跨小时时才有必要看日期，这里只看时分） */
  function hitTimeLabel(ms: number): string {
    const d = new Date(ms);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  /**
   * 分钟级命中趋势的文字摘要
   *
   * <p>趋势本身由 {@code hitTrendOption} 交给 ReEChart 画折线；这里只把「哪些分钟有命中」
   * 压成一行文字，供下方空态提示判断用（没有趋势点时给出说明，而不是留一块空白）。</p>
   */
  const hitTrendText = computed(() => {
    const pts = hitDetail.value?.trend ?? [];
    if (!pts.length) {
      return "";
    }
    // 只显示有命中的分钟，60 个桶全列出来没人看得下去
    return pts
      .filter((p) => p.count > 0)
      .map((p) => `${hitTimeLabel(p.time)} ×${p.count}`)
      .join("　");
  });

  /** 来源 IP Top 10 横向柱状图 */
  const hitTopOption = computed(() => {
    const rows = (hitDetail.value?.topIps ?? []).slice(0, 10).reverse();
    return {
      grid: { left: 8, right: 40, top: 12, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: { type: "value", name: t("policy.common.hits"), minInterval: 1 },
      yAxis: {
        type: "category",
        data: rows.map((r) => r.ip),
        axisLabel: { width: 130, overflow: "truncate" },
      },
      series: [
        {
          type: "bar",
          data: rows.map((r) => r.count),
          barMaxWidth: 18,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: "right" },
        },
      ],
    };
  });

  /** 分钟级命中趋势折线图 */
  const hitTrendOption = computed(() => {
    const pts = hitDetail.value?.trend ?? [];
    return {
      grid: { left: 8, right: 16, top: 28, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: pts.map((p) => hitTimeLabel(p.time)),
      },
      yAxis: { type: "value", name: t("policy.common.hits"), minInterval: 1 },
      series: [
        {
          type: "line",
          smooth: true,
          // 点多时关掉 symbol，否则 60 个点会糊成一片
          showSymbol: pts.length <= 30,
          data: pts.map((p) => p.count),
          areaStyle: { opacity: 0.15 },
        },
      ],
    };
  });

  return {
    hitCounts,
    hitDialogVisible,
    hitLoading,
    hitTitle,
    hitDetail,
    hitTrendText,
    hitTopOption,
    hitTrendOption,
    loadHitCounts,
    hitCountOf,
    hitKeyOf,
    ipHitType,
    accHitType,
    rateHitKey,
    openHitDetail,
  };
}

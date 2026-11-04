/**
 * 用量看板 · 明细表（13 列 + 后端分页）
 *
 * <p>明细表是纯 loader 模式：时间范围与模型过滤放在 {@code params} 里，
 * ReTable 会 watch params 变化自动回到第 1 页重新取数 —— 页面不用手动 reload，
 * 也就不会出现「切区间打两次接口」。</p>
 */

import { ref, computed } from "vue";
import { message } from "@repo/core";
import type { ReTableColumn } from "@repo/ui/re-table";
import { usageApi } from "@/services/javaApi";
import type { TimeParams } from "./types";
import type { UsageFormat } from "./format";

export function useUsageDetail(getTimeParams: () => TimeParams, fmt: UsageFormat) {
  const detailRecords = ref<any[]>([]);
  const detailLoading = ref(false);
  const detailTotal = ref(0);
  const detailModelFilter = ref("");
  const detailUserFilter = ref("");
  /**
   * 费用等敏感数据是否可见（默认隐藏）。
   *
   * <p>明细表里费用默认只渲染眼睛图标，点「用量明细」头部的
   * 显示费用开关才露出金额 —— 截屏/分享场景不泄露账单数据。</p>
   */
  const costVisible = ref(false);

  const detailColumns = computed<ReTableColumn[]>(() => [
    // 时间列固定在左侧：明细表有 13 列、横滚是常态，时间不钉住的话滚到右边
    // 就不知道这一行是什么时候的记录了。
    { prop: "time", label: "时间", width: 160, slot: "time", fixed: "left" },
    { prop: "model", label: "模型", minWidth: 180, showOverflowTooltip: true, slot: "model" },
    { prop: "group", label: "分组", width: 140, showOverflowTooltip: true, slot: "group" },
    { prop: "user", label: "账号", width: 90, slot: "user" },
    { prop: "provider", label: "服务商", width: 100, slot: "provider" },
    { prop: "endpoint", label: "端点", width: 185, showOverflowTooltip: true, slot: "endpoint" },
    { prop: "strength", label: "强度", width: 90, slot: "strength" },
    { prop: "ip", label: "请求 IP", width: 130, showOverflowTooltip: true, slot: "ip" },
    { prop: "tokens", label: "Token", width: 170, align: "right", slot: "tokens" },
    { prop: "cost", label: `费用(${fmt.currencySymbol.value})`, width: 90, align: "right", slot: "cost" },
    { prop: "latency", label: "耗时", width: 150, slot: "latency" },
    { prop: "type", label: "类型", width: 130, slot: "type" },
    { prop: "callType", label: "调用类型", width: 95, slot: "callType" },
  ]);

  /** 查询参数（时间范围 + 模型过滤），作为 ReTable 的 params 传下去 */
  const detailQueryParams = computed(() => {
    const p: Record<string, unknown> = { ...getTimeParams() };
    if (detailModelFilter.value) p.model = detailModelFilter.value;
    return p;
  });

  /**
   * ReTable 的 loader（后端分页）：组件在远程模式下会自己调它取当前页，
   * 并按返回的 total 算页数 —— 这才是后端分页的正确接法。
   */
  async function loadDetailPage({ page, pageSize, params }: { page: number; pageSize: number; params: Record<string, unknown> }) {
    detailLoading.value = true;
    try {
      const { page: _p, pageSize: _ps, ...rest } = params as Record<string, unknown>;
      const res: any = await usageApi.detailList({ ...rest, page, size: pageSize });
      const payload = res.data || res || {};
      const records = payload.records || payload.data || payload.list || [];
      detailRecords.value = Array.isArray(records) ? records : [];
      detailTotal.value = Number(payload.total ?? res?.total ?? 0) || 0;
      return { total: detailTotal.value, records: detailRecords.value };
    } catch (e: any) {
      message.error("加载明细失败: " + (e?.message || e));
      return { total: 0, records: [] };
    } finally {
      detailLoading.value = false;
    }
  }

  return {
    detailRecords,
    detailLoading,
    detailTotal,
    detailModelFilter,
    detailUserFilter,
    costVisible,
    detailColumns,
    detailQueryParams,
    loadDetailPage,
  };
}

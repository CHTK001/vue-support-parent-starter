/**
 * 用量看板 · 时间区间筛选
 *
 * <p>四个快捷胶囊（今天 / 近7天 / 近30天 / 全部）+ 一个自定义区间。选完即刷新：
 * 既然用户点的是「看这个区间」，再让他多点一次刷新就是在浪费动作。</p>
 */

import { ref, computed } from "vue";
import type { QuickFilterKey, TimeParams } from "./types";

/** 快捷胶囊的键与文案，页头直接遍历渲染 */
export const QUICK_FILTERS: Array<{ key: QuickFilterKey; label: string }> = [
  { key: "today", label: "今天" },
  { key: "7d", label: "近7天" },
  { key: "30d", label: "近30天" },
  { key: "all", label: "全部" },
];

/** `YYYY-MM-DD`（本地时区，不用 toISOString —— 那会按 UTC 切日，东八区凌晨会差一天） */
export function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 把快捷键换算成后端要的 startTime / endTime */
export function rangeOf(key: QuickFilterKey, now = new Date()): TimeParams {
  if (key === "all" || key === "custom") return {};
  if (key === "today") {
    const d = fmtDate(now);
    return { startTime: `${d} 00:00:00`, endTime: `${d} 23:59:59` };
  }
  const days = key === "7d" ? 7 : 30;
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return {
    startTime: `${fmtDate(start)} 00:00:00`,
    endTime: `${fmtDate(now)} 23:59:59`,
  };
}

export function useUsageRange(onChange: () => void) {
  const activeFilter = ref<QuickFilterKey>("today");
  const customRange = ref<[string, string] | null>(null);
  const timeParams = ref<TimeParams>({});

  /** 当前时间范围的人类可读描述（页头与明细表副标题共用） */
  const rangeLabel = computed(() => {
    const map: Record<string, string> = {
      today: "今天", "7d": "近 7 天", "30d": "近 30 天", all: "全部时间", custom: "自定义区间",
    };
    const base = map[activeFilter.value] || "自定义区间";
    const { startTime, endTime } = timeParams.value;
    if (activeFilter.value === "today" && startTime) return `${base} · ${startTime.slice(0, 10)}`;
    if (startTime && endTime) return `${base} · ${startTime.slice(0, 10)} 至 ${endTime.slice(0, 10)}`;
    return base;
  });

  function setQuickFilter(key: QuickFilterKey) {
    activeFilter.value = key;
    customRange.value = null;
    timeParams.value = rangeOf(key);
    onChange();
  }

  function onCustomRange(val: [string, string] | null) {
    if (!val || !val[0] || !val[1]) return;
    activeFilter.value = "custom";
    timeParams.value = {
      startTime: `${val[0]} 00:00:00`,
      endTime: `${val[1]} 23:59:59`,
    };
    onChange();
  }

  return { activeFilter, customRange, timeParams, rangeLabel, setQuickFilter, onCustomRange };
}

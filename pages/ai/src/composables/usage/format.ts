/**
 * 用量看板 · 数值与文案格式化
 *
 * <p>Token / 费用的展示口径全部收敛在这里：KPI 卡、图表 tooltip、排行条、
 * 明细表用的都是同一套函数，避免「同一页三处数字格式不一样」。</p>
 *
 * <p>货币与 Token 单位是从「用量配置」读出来的用户设置，所以这里返回的是
 * 带 {@code ref} 的格式化器而非纯函数 —— 配置一变，页面上所有读数的格式同步变。</p>
 */

import { ref } from "vue";
import { usageApi } from "@/services/javaApi";

export type CurrencyCode = "CNY" | "USD" | "EUR";

export function useUsageFormat() {
  // ---------- 单位设置（来自用量配置，保存后联动）----------
  const currency = ref<CurrencyCode>("CNY");
  const currencySymbol = ref("¥");
  const autoConvert = ref(true);
  const rateUsd = ref(7.1);
  const rateEur = ref(7.8);
  const tokenScale = ref<"auto" | "raw">("auto");

  function formatNumber(v: number | null | undefined): string {
    const n = Number(v) || 0;
    return n.toLocaleString("en-US");
  }

  function formatCompact(v: number | null | undefined): string {
    const n = Number(v) || 0;
    const abs = Math.abs(n);
    if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
    return String(n);
  }

  /** Token 读数：跟随「单位设置」里的紧凑/原值偏好 */
  const fmtToken = (v: number | null | undefined): string =>
    tokenScale.value === "raw" ? formatNumber(v) : formatCompact(v);

  function convertCost(v: number | null | undefined): number {
    const n = Number(v) || 0;
    if (!autoConvert.value || currency.value === "CNY") return n;
    if (currency.value === "USD") return n / rateUsd.value;
    if (currency.value === "EUR") return n / rateEur.value;
    return n;
  }

  function money(v: number | null | undefined): string {
    return convertCost(v).toFixed(2);
  }

  async function loadUnits() {
    try {
      const res: any = await usageApi.config();
      const list = res?.data || res;
      if (!Array.isArray(list)) return;
      const symMap = { CNY: "¥", USD: "$", EUR: "€" } as Record<string, string>;
      for (const row of list) {
        if (row.field === "usage_currency") {
          const code = (["CNY", "USD", "EUR"].includes(row.value) ? row.value : "CNY") as CurrencyCode;
          currency.value = code;
          currencySymbol.value = symMap[code];
        }
        if (row.field === "usage_currency_auto_convert") {
          autoConvert.value = String(row.value) === "true";
        }
        if (row.field === "usage_rate_usd") {
          const r = Number(row.value);
          if (Number.isFinite(r) && r > 0) rateUsd.value = r;
        }
        if (row.field === "usage_rate_eur") {
          const r = Number(row.value);
          if (Number.isFinite(r) && r > 0) rateEur.value = r;
        }
        if (row.field === "usage_token_scale") {
          tokenScale.value = row.value === "raw" ? "raw" : "auto";
        }
      }
    } catch {
      /* 读取失败沿用默认单位 */
    }
  }

  /**
   * 耗时：<1s 用 ms（整数），1s~60s 用两位小数秒，再往上给 m/s、h/m。
   * 0 与缺测统一给「—」——「0ms」会被误读成「瞬时返回」。
   */
  function formatLatency(ms: number | null | undefined): string {
    if (ms == null || ms === 0) return "—";
    if (ms < 1000) return Math.round(ms) + "ms";
    const s = ms / 1000;
    if (s < 60) return (Math.round(s * 100) / 100) + "s";
    const m = Math.floor(s / 60);
    const rs = Math.round(s % 60);
    if (m < 60) return m + "m " + rs + "s";
    const h = Math.floor(m / 60);
    const rm = Math.round(m % 60);
    return h + "h " + rm + "m";
  }

  /** 解码速率：无效或缺失值显示占位符 */
  function formatSpeed(v: number | null | undefined): string {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return "—";
    return n.toFixed(1) + " tok/s";
  }

  /** 时间：后端可能给数组（Jackson），统一成 `YYYY-MM-DD HH:mm:ss` */
  function formatTime(v: any): string {
    if (v == null) return "-";
    if (Array.isArray(v)) {
      const p = (x: number) => String(x).padStart(2, "0");
      return `${v[0]}-${p(v[1])}-${p(v[2])} ${p(v[3] || 0)}:${p(v[4] || 0)}:${p(v[5] || 0)}`;
    }
    return String(v).replace("T", " ").slice(0, 19);
  }

  return {
    currency,
    currencySymbol,
    autoConvert,
    rateUsd,
    rateEur,
    tokenScale,
    formatNumber,
    formatCompact,
    fmtToken,
    convertCost,
    money,
    formatLatency,
    formatSpeed,
    formatTime,
    loadUnits,
  };
}

export type UsageFormat = ReturnType<typeof useUsageFormat>;

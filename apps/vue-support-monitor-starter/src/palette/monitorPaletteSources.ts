/**
 * monitor 壳：为顶栏命令面板注册的业务数据源（主机资产 / 告警策略 / 告警规则）
 *
 * <p>分层口径与 home widget 一致：契约注册表定义在 theme 包
 * （{@code @repo/theme/.../paletteRegistry.ts}，零业务依赖），本文件只做
 * 「业务 API → 面板条目」的适配，由 {@code main.ts} 经 {@code definePaletteContribution}
 * 走 {@code createContextApp().widgets(...)} 通道注册。theme 层不反向依赖任何 pages 包。</p>
 *
 * <p>搜索策略：主机量大且后端 {@code queryHosts} 原生支持 keyword，走后端直查；
 * 告警策略 / 规则总量小（单页管理），全量拉取后前端过滤。</p>
 */
import type { PaletteSource } from "@repo/theme/koi/layouts/components/Header/components/paletteRegistry";
import { queryHosts } from "@pages/server/src/api";
import { fetchAlarmPolicies, fetchAlarmRules } from "@pages/monitor/src/api/monitorApi";

/** 主机资产：关键字直查后端 /ms/server/host，命中即跳资产页深链（applyDeepLink 打开该主机） */
const hostSource: PaletteSource = {
  key: "monitor-hosts",
  groupLabel: "主机资产",
  icon: "Cpu",
  query: async (keyword) => {
    const kw = keyword.trim();
    if (!kw) return [];
    const list = await queryHosts({ keyword: kw });
    return (list ?? []).map((h: any) => ({
      id: `host:${h?.id}`,
      title: h?.serverHostName ?? `主机 #${h?.id ?? ""}`,
      hint: h?.serverHostAddress ?? "主机资产",
      path: h?.id != null ? `/assets?hostId=${h.id}` : "/assets",
    }));
  },
};

/** 告警策略：全量拉取后前端过滤，命中跳策略页（默认 tab=policy） */
const policySource: PaletteSource = {
  key: "monitor-alarm-policies",
  groupLabel: "告警策略",
  icon: "Bell",
  query: async (keyword) => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return [];
    const list = await fetchAlarmPolicies();
    return (list ?? [])
      .filter((p) => String(p.msMonitorAlarmPolicyName ?? "").toLowerCase().includes(kw))
      .map((p) => ({
        id: `policy:${p.id}`,
        title: p.msMonitorAlarmPolicyName ?? `策略 #${p.id}`,
        hint: p.msMonitorAlarmPolicyRemark || "告警策略",
        path: "/alarm-policies?tab=policy",
      }));
  },
};

/** 告警规则：全量拉取后前端过滤（按指标名），命中跳规则页签 */
const ruleSource: PaletteSource = {
  key: "monitor-alarm-rules",
  groupLabel: "告警规则",
  icon: "SetUp",
  query: async (keyword) => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return [];
    const list = await fetchAlarmRules();
    return (list ?? [])
      .filter((r) => String(r.msMonitorAlarmRuleMetricName ?? "").toLowerCase().includes(kw))
      .map((r) => ({
        id: `rule:${r.id}`,
        title: r.msMonitorAlarmRuleMetricName ?? `规则 #${r.id}`,
        hint: `${r.msMonitorAlarmRuleCondition ?? ""} ${r.msMonitorAlarmRuleThreshold ?? ""} · ${r.msMonitorAlarmRuleLevel ?? ""}`,
        path: "/alarm-policies?tab=rule",
      }));
  },
};

/** 全部业务源（保持注册顺序：主机 → 策略 → 规则） */
export const monitorPaletteSources: readonly PaletteSource[] = [
  hostSource,
  policySource,
  ruleSource,
];
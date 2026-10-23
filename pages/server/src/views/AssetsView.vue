<script setup lang="ts">
/**
 * 主机资产 v2 —— 对齐 prototype.html §4.2
 * KPI + FilterBar + 表格 + 完整 CRUD（新增/编辑/删除/启停/批量）+ 行内「连接」直达远控
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onBeforeUnmount, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox, ElProgress, ElDropdown, ElDropdownMenu, ElDropdownItem, ElPopover, ElTooltip } from "element-plus";
import { ReFormItem } from "@repo/ui/re-kit";
import type { ReFilterItem } from "@repo/ui/components/ReFilter/types";
import { queryHosts, delHost, switchHost, getGroups, getIdentities, listBoundIdentities, bindIdentity, unbindIdentity, scanPorts, installNginxHost } from "../api";
import HostFormDialog from "./HostFormDialog.vue";
import HostConfigDialog from "./HostConfigDialog.vue";
import HostProfileDialog from "./HostProfileDialog.vue";
import ScInstallDialog from "../components/ScInstallDialog.vue";
import { useDialogPrerender } from "../utils/dialogPrerender";
import { osIconSvg } from "../utils/osIcon";
import {useSocketService, message} from "@repo/core";
import ReMaskDialog from "../components/ReMaskDialog.vue";
import AgentDeployDialog from "../components/AgentDeployDialog.vue";
import ReProgressTask from "@repo/ui/components/ReProgress/ReProgressTask.vue";
import { submitAgentAction } from "../api";
import type { Component } from "vue";
import { CircleCheck, DocumentChecked, Download, Tickets } from "@element-plus/icons-vue";
import ReStatCard from "@repo/ui/re-stat-card";
import ReEcharts from "@repo/ui/re-echarts";

export interface Host {
  id: number;
  serverHostName: string;
  serverHostCode?: string | null;
  serverHostAddress: string;
  serverHostPort: number;
  /** 是否开启 SSH（1 开启；未开启的主机不能用于安装/命令执行） */
  serverHostSshEnabled?: number | null;
  /** Agent 监听端口（表单可选字段，仅编辑弹窗使用） */
  serverHostAgentPort?: number | null;
  serverHostOsType: string;
  serverHostOsArch?: string | null;
  serverHostOsVersion?: string | null;
  serverHostCpuCores?: number | null;
  serverHostMemoryMb?: number | null;
  serverHostDiskGb?: number | null;
  serverHostPublicIp?: string | null;
  serverHostPrivateIp?: string | null;
  serverHostStatus: number;
  serverHostOnline: number;
  serverHostCollectMode: string;
  serverHostCollectEnabled?: number;
  serverHostCollectInterval?: number;
  serverHostLastCollectTime?: string | null;
  /** CPU 使用率 %（最近一次采集/上报落库值） */
  serverHostCpuUsage?: number | null;
  /** 内存使用率 % */
  serverHostMemUsage?: number | null;
  /** 磁盘使用率 % */
  serverHostDiskUsage?: number | null;
  serverHostOnlineEnabled?: number;
  serverHostOnlineInterval?: number;
  serverHostDelayEnabled?: number;
  serverHostDelayInterval?: number;
  serverHostDelayMs?: number | null;
  serverHostLastDelayTime?: string | null;
  serverHostPorts?: string | null;
  serverHostLastPortScanTime?: string | null;
  serverHostAgentEnabled: number;
  /** Agent 是否已安装（1 已装，由生命周期服务回写） */
  serverHostAgentInstalled?: number | null;
  /** Agent 版本号 */
  serverHostAgentVersion?: string | null;
  /** 最近一次 Agent 操作失败原因 */
  serverHostAgentError?: string | null;
  serverHostRemoteEnabled: number;
  serverHostOnlineTime?: string;
  /** 分组（后端字段 msmsServerGroupId） */
  msServerGroupId?: number | null;
  /** 标签（后端字段 msServerHostTags，逗号分隔） */
  serverHostTags?: string | null;
  /** 描述/备注（后端字段 msServerHostDescription） */
  serverHostDescription?: string | null;
  /** 登录账号（瞬态，新增表单直接提交，不落库） */
  serverHostAccount?: string | null;
  /** 登录密码（瞬态） */
  serverHostPassword?: string | null;
  /** PEM 私钥（瞬态） */
  serverHostPrivateKey?: string | null;
  /** 远控协议（SSH/RDP/VNC，空表示按平台推断） */
  serverHostRemoteProtocol?: string | null;
  /** 远控端口（空表示按协议默认） */
  serverHostRemotePort?: number | null;
  /** 远控通道：GUACD 中转 / DIRECT 直连 */
  serverHostRemoteMode?: string | null;
  /** VNC 口令（落库 AES 加密，详情接口回显明文） */
  serverHostVncPassword?: string | null;
}

export interface Group { id: number; msServerGroupName: string; msServerGroupColor?: string | null; }
interface Identity { id: number; msServerIdentityName: string; msServerIdentityAuthType: string; msServerIdentityUsername: string; msServerIdentityRemark?: string; }

const router = useRouter();
const hosts = ref<Host[]>([]);
const groups = ref<Group[]>([]);
const identities = ref<Identity[]>([]);
const loading = ref(false);
const loadError = ref("");
/** fetchAll 序号：并发触发时只采用最新一次结果，丢弃过期响应 */
let fetchSeq = 0;
const selection = ref<Host[]>([]);
/** 实时延迟（hostId → delayMs，socket host-delay 推送更新；-1 表不可达） */
const liveDelay = ref<Record<number, number>>({});
/** 实时在线状态（hostId → 1/0，socket host-online 推送翻转） */
const liveOnline = ref<Record<number, number>>({});
let unsubDelay: (() => void) | undefined;
let unsubOnline: (() => void) | undefined;
let unsubMetrics: (() => void) | undefined;
let unsubDeploy: (() => void) | undefined;
let unsubPortScan: (() => void) | undefined;

/** 视图模式：card（默认，卡片网格）/ table（表格） */
const viewMode = ref<"card" | "table">("card");

/** ReFilter 过滤状态（由 ReFilter 组件统一驱动，替代手写 keyword/status/group 三个 ref） */
const filterState = ref<Record<string, unknown>>({ keyword: "", status: "", group: "", tag: "" });
/**
 * ReFilter 过滤项变更
 * @param prop 过滤属性名
 * @param value 过滤值
 */
/**
 * ReFilter 过滤项变更
 * @param prop 过滤属性名
 * @param value 过滤值
 */
function onFilterChange(prop: string, value: unknown): void {
  filterState.value[prop] = value;
}
/**
 * 重置全部过滤条件
 */
function onFilterReset(): void {
  filterState.value = { keyword: "", status: "", group: "", tag: "" };
}

/** 空态卡片里的「重置筛选」按钮：复用同一套重置逻辑，不再另写一份 */
function resetFilters(): void {
  onFilterReset();
}

/** ReFilter 筛选项配置（"标签"项仅在存在标签数据时显示，避免空的筛选项） */
const filterItems = computed<ReFilterItem[]>(() => {
  const items: ReFilterItem[] = [
    { prop: "keyword", label: "名称/IP", type: "input", placeholder: "搜索名称 / IP", clearable: true, always: true },
    { prop: "status", label: "状态", type: "select", placeholder: "状态", clearable: true, options: [
      { label: "在线", value: "online" },
      { label: "离线", value: "offline" },
      { label: "远控启用", value: "remote" },
    ], always: true },
    { prop: "group", label: "分组", type: "select", placeholder: "分组", clearable: true, options: groups.value.map(g => ({ label: g.msServerGroupName, value: g.id })), always: true },
  ];
  if (allTags.value.length > 0) {
    items.push({ prop: "tag", label: "标签", type: "slot", always: false });
  }
  return items;
});

/** 弹窗内 ReSelect 选项（computed 缓存，避免每次渲染重算） */
const identityOptions = computed(() => identities.value.map(i => ({
  label: `${i.msServerIdentityName}（${i.msServerIdentityUsername}）${i.msServerIdentityAuthType === "PUBLIC_KEY" ? "私钥" : "密码"}`,
  value: i.id,
})));
const groupOptions = computed(() => groups.value.map(g => ({ label: g.msServerGroupName, value: g.id })));

/** 标签集合（用于筛选/展示） */
const allTags = computed(() => {
  const s = new Set<string>();
  for (const h of hosts.value) {
    for (const t of splitTags(h.serverHostTags)) s.add(t);
  }
  return [...s];
});

/**
 * 逗号分隔标签拆分为数组
 * @param tags 标签字符串
 */
function splitTags(tags?: string | null): string[] {
  if (!tags || !tags.trim()) return [];
  // 同时兼容中英文逗号分隔（后端/手工录入可能用「，」）
  return tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
}

/** 端口扫描结果项 */
interface PortItem { port: string; protocol?: string; service?: string; state?: string; }

/** 解析端口扫描 JSON */
function parsePorts(raw?: string | null): PortItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/** 端口文案：22/tcp ssh */
function portText(p: PortItem): string {
  const parts = [`${p.port}${p.protocol ? "/" + p.protocol : ""}`];
  if (p.service) parts.push(p.service);
  return parts.join(" ");
}

/** 端口状态 → OPEN/CLOSED 标记：state 含 open/open 视为 OPEN（绿点），其余/空视为 CLOSED（红点） */
function portStatusM(state?: string): { open: boolean | null; text: string } {
  const s = String(state ?? "").trim().toLowerCase();
  if (!s || s === "unknown") return { open: null, text: "" };
  const openWords = ["open", "listen", "listening", "running", "active", "established"];
  if (openWords.some(w => s === w || s.includes(w))) return { open: true, text: "OPEN" };
  return { open: false, text: "CLOSED" };
}

/** 端口扫描（后台异步，完成后由 host-portscan socket 事件回填，不阻塞/轮询） */
async function scanHostPorts(h: Host): Promise<void> {
  try {
    const r: any = await scanPorts(h.id);
    message.success(r?.msg || `端口扫描已开始，完成后自动更新 ${h.serverHostAddress}`);
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}
/**
 * 分组 ID 查名称
 * @param id 分组 ID
 */
function groupName(id?: number | null): string {
  if (!id) return "未分组";
  return groups.value.find(g => g.id === id)?.msServerGroupName ?? "组#" + id;
}
/** 分组背景色开关：开启时分组标记按分组配置颜色显示底色 */
const groupColorEnabled = ref(true);

/**
 * 趋势环比文案：首尾采样之差，让「涨还是在降」不用盯着折线猜。
 *
 * @param id 主机标识
 * @returns 形如 ↑ 3.2% / ↓ 1.4% / — 的短文本
 */
function trendDeltaText(id: number): string {
  const arr = rtTrend[id] ?? [];
  if (arr.length < 2) return '—';
  const delta = arr[arr.length - 1] - arr[0];
  if (Math.abs(delta) < 0.1) return '持平';
  return `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta).toFixed(1)}%`;
}

/**
 * 环比上升（负载变差）标红，下降标绿。
 *
 * @param id 主机标识
 * @returns 样式类名
 */
function trendDeltaClass(id: number): string {
  const arr = rtTrend[id] ?? [];
  if (arr.length < 2) return '';
  const delta = arr[arr.length - 1] - arr[0];
  if (Math.abs(delta) < 0.1) return '';
  return delta > 0 ? 'is-up' : 'is-down';
}

/**
 * 占用环的 conic-gradient 样式：把百分比画成一段弧。
 *
 * @param pct 占用百分比（0-100）
 * @returns 内联样式
 */
function ringStyle(pct: number | undefined): Record<string, string> {
  const v = Math.max(0, Math.min(100, Math.round(pct ?? 0)));
  return {
    background: `conic-gradient(${barColor(v)} ${v * 3.6}deg, var(--el-fill-color) 0deg)`,
  };
}

// ---- 实时指标（默认开启，socket 推送，不轮询） ----
const realtimeEnabled = ref(localStorage.getItem('assets-realtime-enabled') !== 'false');
const rtMetrics = reactive<Record<number, { cpu: number; mem: number; disk: number; tx: string; rx: string }>>({});

/** CPU 趋势采样窗口（保留最近 N 个点，足够画一条可读的迷你折线又不至于吃内存） */
const TREND_POINTS = 24;
/** 每台主机的 CPU 历史采样，按 id 索引；用于卡片右侧迷你趋势图 */
const rtTrend = reactive<Record<number, number[]>>({});

/**
 * 采样一个 CPU 点进趋势缓冲。
 *
 * <p>只在指标真正变化时推入，避免 socket 抖动造成折线全是同一数值；
 * 超过 {@link TREND_POINTS} 时丢最旧的，保持固定窗口长度。</p>
 *
 * @param id  主机标识
 * @param cpu CPU 使用率（0-100）
 */
function pushTrend(id: number, cpu: number): void {
  if (!rtTrend[id]) rtTrend[id] = [];
  const arr = rtTrend[id];
  const last = arr[arr.length - 1];
  if (last !== undefined && Math.abs(last - cpu) < 0.05) return;
  arr.push(cpu);
  if (arr.length > TREND_POINTS) arr.splice(0, arr.length - TREND_POINTS);
}

/**
 * 卡片右侧 CPU 迷你趋势图配置。
 *
 * <p>刻意压掉坐标轴、图例与网格，只留一条带面积渐变的折线 —— 卡片右侧空间窄，
 * 堆坐标轴会变成噪音。y 轴固定 0-100，避免不同主机的曲线看起来「一样高」。</p>
 *
 * @param id 主机标识
 * @returns ECharts 配置；无数据时返回空折线
 */
function trendOption(id: number): Record<string, unknown> {
  const data = rtTrend[id] ?? [];
  // 必须用具体色值：ECharts 走 Canvas，解析不了 CSS 变量
  const color = barColorHex(data[data.length - 1] ?? 0);
  return {
    animation: false,
    grid: { left: 2, right: 2, top: 6, bottom: 2 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value', show: false, min: 0, max: 100 },
    tooltip: {
      trigger: 'axis',
      confine: true,
      formatter: (ps: any[]) => `${Number(ps?.[0]?.value ?? 0).toFixed(1)}%`,
    },
    series: [{
      type: 'line',
      data,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color },
      areaStyle: {
        opacity: 0.18,
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color },
            { offset: 1, color: 'transparent' },
          ],
        },
      },
    }],
  };
}

/**
 * 使用率对应的状态色 —— 给 DOM / Element 组件用（CSS 变量解析得到真实颜色）。
 *
 * @param pct 使用率（0-100）
 */
function barColor(pct: number): string {
  if (pct >= 90) return 'var(--el-color-danger)';
  if (pct >= 70) return 'var(--el-color-warning)';
  return 'var(--el-color-success)';
}

/**
 * 使用率对应的状态色 —— 给 ECharts / Canvas 用。
 *
 * <p>Canvas 的 addColorStop 只认具体色值，传 `var(--el-color-xxx)` 会抛
 * `Failed to execute 'addColorStop' ... could not be parsed as a color`。
 * 这个异常发生在 ECharts 的渲染循环里，会打断所在组件的更新 ——
 * 表现为卡片里的按钮点了没反应、`@click` 完全静默。</p>
 *
 * @param pct 使用率（0-100）
 */
function barColorHex(pct: number): string {
  if (pct >= 90) return '#f56c6c';
  if (pct >= 70) return '#e6a23c';
  return '#67c23a';
}

function onRealtimeToggle(v: boolean): void {
  localStorage.setItem('assets-realtime-enabled', String(v));
  if (!v) {
    // 关闭即清空，重新打开时由下一次列表刷新或推送铺值
    Object.keys(rtMetrics).forEach(k => delete rtMetrics[Number(k)]);
    Object.keys(rtTrend).forEach(k => delete rtTrend[Number(k)]);
    return;
  }
  syncRtFromHosts();
}

/**
 * 用主机台账里最近一次采集/上报的使用率铺首帧
 * <p>socket 推送只覆盖「推送之后」的时间窗，列表每次刷新都要按落库值重算，
 * 否则刷新页面要等一个采集周期才有指标。</p>
 */
function syncRtFromHosts(): void {
  if (!realtimeEnabled.value) return;
  for (const h of hosts.value) {
    if (h.serverHostCpuUsage == null && h.serverHostMemUsage == null && h.serverHostDiskUsage == null) {
      continue;
    }
    const prev = rtMetrics[h.id];
    const cpu = Math.round((Number(h.serverHostCpuUsage) || 0) * 10) / 10;
    rtMetrics[h.id] = {
      cpu,
      mem: Math.round((Number(h.serverHostMemUsage) || 0) * 10) / 10,
      disk: Math.round((Number(h.serverHostDiskUsage) || 0) * 10) / 10,
      tx: prev?.tx ?? '—',
      rx: prev?.rx ?? '—',
    };
    pushTrend(h.id, cpu);
  }
}
/** 取分组颜色（未配置或关闭开关时返回空，不使用背景色） */
function groupColor(id?: number | null): string {
  if (!groupColorEnabled.value || !id) return "";
  return groups.value.find(g => g.id === id)?.msServerGroupColor ?? "";
}
/** 分组标签背景样式：按颜色值生成带透明度的底色与匹配文字色 */
function groupColorStyle(id?: number | null): Record<string, string> {
  const c = groupColor(id);
  if (!c) return {};
  // 解析 #RRGGBB
  const hex = c.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return {};
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // 亮度感知文字色（深底浅字 / 浅底深字）
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const text = luminance > 0.6 ? "#3a3f4b" : "#ffffff";
  return {
    backgroundColor: `${c}26`, // 15% 透明底
    color: text,
    borderColor: `${c}55`,
  };
}

/**
 * 生效远控协议：主机配置优先，未配置时按平台推断
 * @param h 主机
 */
function protocolOf(h: Host): string {
  const p = (h.serverHostRemoteProtocol ?? "").toUpperCase();
  if (p === "SSH" || p === "RDP" || p === "VNC") return p.toLowerCase();
  const s = (h.serverHostOsType ?? "").toUpperCase();
  if (s.includes("WIN")) return "rdp";
  if (s.includes("MAC")) return "vnc";
  return "ssh";
}
/**
 * 生效远控端口：协议与台账一致时用台账端口，否则按协议默认（见 TerminalView.remotePortOf 说明）。
 * @param h 主机
 */
function remotePortOf(h: Host): number {
  const p = protocolOf(h);
  const configured = (h.serverHostRemoteProtocol ?? "").toLowerCase();
  if (configured === p && h.serverHostRemotePort && h.serverHostRemotePort > 0) return h.serverHostRemotePort;
  if (p === "ssh") return h.serverHostPort || 22;
  return p === "rdp" ? 3389 : 5900;
}
/**
 * 在线状态：online/offline/unknown
 * @param h 主机
 */
function onlineState(h: Host): "online" | "offline" | "unknown" {
  const v = h.serverHostOnline;
  if (v === 1) return "online";
  if (v === 0) return "offline";
  return "unknown";
}
/**
 * 在线状态文案
 * @param h 主机
 */
function onlineText(h: Host): string {
  const v = h.serverHostOnline;
  return v === 1 ? "在线" : v === 0 ? "离线" : "未知";
}

const onlineCount = computed(() => hosts.value.filter(h => h.serverHostOnline === 1).length);
const remoteCount = computed(() => hosts.value.filter(h => h.serverHostRemoteEnabled === 1).length);
const offlineCount = computed(() => hosts.value.length - onlineCount.value);

/**
 * 统计卡定义。
 *
 * <p>与「账号管理 / 代理管理」同口径：{@code icon} 必须是组件
 * （ReStatCard 内部走 {@code <component :is="icon" />}），所以引用
 * @element-plus/icons-vue 的组件而不是图标名字符串；{@code iconColor}
 * 用 koi 令牌，不写死品牌色。</p>
 */
interface HostKpi {
  key: string;
  title: string;
  value: number | string;
  desc: string;
  icon: Component;
  iconColor: string;
}

const hostKpis = computed<HostKpi[]>(() => [
  {
    key: "total",
    title: "可远控目标",
    value: hosts.value.length,
    desc: "共注册可远控目标",
    icon: DocumentChecked,
    iconColor: "var(--brand-500, var(--el-color-primary))",
  },
  {
    key: "online",
    title: "可连接资产",
    value: `${onlineCount.value} / ${hosts.value.length}`,
    desc: "当前在线可连接",
    icon: CircleCheck,
    iconColor: "var(--el-color-success)",
  },
  {
    key: "offline",
    title: "需关注处理",
    value: offlineCount.value,
    desc: "离线或采集异常",
    icon: Tickets,
    iconColor: "var(--el-text-color-placeholder)",
  },
  {
    key: "remote",
    title: "支持远程连接",
    value: remoteCount.value,
    desc: "已开启远控协议",
    icon: Download,
    iconColor: "var(--metric-cpu, var(--el-color-primary))",
  },
]);

const filtered = computed(() => {
  const fs = filterState.value;
  let list = hosts.value;
  const status = String(fs.status ?? "");
  if (status === "online") list = list.filter(h => h.serverHostOnline === 1);
  else if (status === "offline") list = list.filter(h => h.serverHostOnline !== 1);
  else if (status === "remote") list = list.filter(h => h.serverHostRemoteEnabled === 1);
  // 仅当分组值是有效分组（非 null/空串/0）时才过滤，避免组件回传脏值把整列清空
  if (fs.group != null && fs.group !== "" && fs.group !== 0) {
    const gid = String(fs.group);
    list = list.filter(h => String(h.msServerGroupId ?? "") === gid);
  }
  // 标签仅在为非空字符串时过滤
  if (typeof fs.tag === "string" && fs.tag) {
    // 先取出到常量，避免闭包内丢失 typeof 收窄
    const tag = fs.tag;
    list = list.filter(h => splitTags(h.serverHostTags).includes(tag));
  }
  const kw = typeof fs.keyword === "string" ? fs.keyword.toLowerCase() : "";
  if (kw) {
    list = list.filter(h => (h.serverHostName ?? "").toLowerCase().includes(kw) || (h.serverHostAddress ?? "").toLowerCase().includes(kw));
  }
  return list;
});

/**
 * 注解数据：每张 KPI 卡的统计口径。
 *
 * <p>KPI 卡的 {@code desc} 只有四五个字（「离线或采集异常」），读者并不知道
 * 「离线」是心跳超时还是 Agent 掉线、「需关注」到底合并了哪几类。
 * 这里把口径写全，与 {@link hostKpis} 同 key 对应，改卡片时不会漏改注解。</p>
 *
 * <p>呈现方式：挂在各卡标题旁的 tip（见模板里的 #title 插槽）。
 * 早先是页面底部一张常驻的 ElCard，四行说明固定占掉约 120px 高度 ——
 * 而这四条注解绝大多数人一辈子不会点开，纯属白占版面。改成按需浮层后零占位，
 * 且注解紧贴它所属的那张卡，不用上下对照。</p>
 */
const hostKpiNotes = computed<Array<{ key: string; title: string; note: string }>>(() => [
  {
    key: "total",
    title: "可远控目标",
    note: "台账中登记的全部主机，含离线与停用采集的；右键可编辑、删除、绑定身份。",
  },
  {
    key: "online",
    title: "可连接资产",
    note: "分子为当前在线（近一次心跳 / 探测正常），分母为台账总数；网络不可达时计数不增长。",
  },
  {
    key: "offline",
    title: "需关注处理",
    note: "合并三类：心跳超时、采集通道异常、远端凭证失效。任一类命中即计入，需要逐台排查。",
  },
  {
    key: "remote",
    title: "支持远程连接",
    note: "已开启 SSH / RDP / VNC 之一且填写了协议端口的主机；未开启的不出现在远控入口。",
  },
]);

/**
 * 按 key 取该 KPI 卡的口径说明，供标题旁的 tip 使用。
 *
 * @param key 与 {@link hostKpis} 对应的卡标识
 * @return 说明文本；该卡没有注解时返回空串（此时不渲染 tip 图标）
 */
function noteOf(key: string): string {
  return hostKpiNotes.value.find((n) => n.key === key)?.note ?? "";
}

/**
 * 是否存在主机（与筛选结果无关）。
 *
 * <p>用于区分空态的两种情况：库里一台都没有 vs. 筛选把结果清空了。
 * 这两种情况给同一个「暂无主机」文案，用户会以为系统坏了而不是自己筛得太严。</p>
 */
const hasHosts = computed(() => hosts.value.length > 0);

/**
 * 空态文案。
 *
 * <p>三种情况刻意分开，不能压缩成两种：加载失败时 {@code hosts} 也是空数组，
 * 若只按「有没有主机」判，就会把「没读到」显示成「暂无主机」——
 * 用户照着提示去点「新增主机」，增完刷新还是空的，完全被带偏。</p>
 */
const emptyDescription = computed(() => {
  if (loadError.value) return "数据加载失败，请重试";
  return hasHosts.value ? "当前筛选条件下没有匹配的主机" : "暂无主机";
});

/** ReTable 列定义 */
const tableColumns = computed(() => [
  { prop: "serverHostName", label: "名称", minWidth: 150, slot: "name" },
  { prop: "serverHostAddress", label: "地址", width: 150, slot: "addr" },
  { prop: "msServerGroupId", label: "分组", width: 92, slot: "group" },
  { prop: "serverHostTags", label: "标签", minWidth: 120, slot: "tags" },
  { prop: "serverHostOsType", label: "协议", width: 100, slot: "proto" },
  { prop: "serverHostOnline", label: "状态", width: 84, slot: "status" },
  { prop: "serverHostDelayMs", label: "延迟", width: 84, slot: "delay" },
  { prop: "serverHostCollectMode", label: "采集模式", width: 100, formatter: (_: unknown, __: unknown, v: unknown) => collectModeLabel(String(v ?? "")) },
  { prop: "serverHostPorts", label: "端口", minWidth: 140, slot: "ports" },
  { prop: "serverHostAgentEnabled", label: "Agent", width: 90, slot: "agent" },
  { prop: "id", label: "操作", width: 140, fixed: "right", slot: "actions" },
]);

/** 表格合计统计（筛选后数量顶部展示） */
const batchDeleteToolbar = computed(() => ({
  enabled: true,
  confirmMessage: `确认批量删除选中的 ${selection.value.length} 台主机？`,
  handler: async (rows: Record<string, unknown>[]) => {
    for (const r of rows) {
      const id = Number(r.id);
      if (id) { try { await delHost(id); } catch { /* 单条失败继续 */ } }
    }
    selection.value = [];
    await fetchAll();
  },
}));

async function fetchAll(): Promise<void> {
  const seq = ++fetchSeq;
  loading.value = true;
  loadError.value = "";
  try {
    const [h, g, i] = await Promise.all([queryHosts(), getGroups(), getIdentities()]);
    if (seq !== fetchSeq) return; // 已被更新的一次 fetch 取代，丢弃过期结果，避免旧数据覆盖新数据
    hosts.value = Array.isArray(h) ? h.sort((a, b) => (b.serverHostOnline ?? 0) - (a.serverHostOnline ?? 0)) : [];
    groups.value = g ?? [];
    identities.value = i ?? [];
    syncRtFromHosts();
  } catch (e) {
    if (seq === fetchSeq) loadError.value = String((e as Error)?.message ?? e);
  } finally {
    if (seq === fetchSeq) loading.value = false;
  }
}

/**
 * 跳转远程控制台并携带连接参数
 * @param h 主机
 */
function connect(h: Host): void {
  router.push({ path: "/terminal", query: { hostId: String(h.id), protocol: protocolOf(h) } });
}
function openDetail(h: Host): void {
  router.push(`/host/${h.id}`);
}

/** 认证方式/采集方式选项已随弹窗拆入 HostFormDialog 子组件 */

// ---- 新增/编辑表单 ----
// ---- 新增/编辑弹窗（空闲时预渲染，首次打开毫秒级——dialogPrerender.ts） ----
const formVisible = ref(false);
useDialogPrerender(formVisible);
const formIsEdit = ref(false);
/** 编辑时的行数据（传给弹窗子组件，打开后由子组件异步回填详情） */
const editHost = ref<Host | null>(null);

function collectModeLabel(m?: string | null): string {
  const map: Record<string, string> = {
    NONE: "不采集", OPENSSH: "OpenSSH采集", SCHEDULED: "定时采集", WINRM: "WinRM采集", AGENT: "Agent采集", LOCAL: "本机自采集", PROMETHEUS: "Prometheus采集", HTTP: "HTTP采集",
  };
  return map[m ?? ""] ?? m ?? "—";
}

// ---- 连接时选择身份（空闲时预渲染，首次打开毫秒级——dialogPrerender.ts） ----
const connectVisible = ref(false);
useDialogPrerender(connectVisible);
const connectTarget = ref<Host | null>(null);
const connectIdentityId = ref<number | null>(null);
const hostBoundIdentities = ref<number[]>([]);

function openConnect(h: Host): void {
  connectTarget.value = h;
  connectIdentityId.value = null;
  connectVisible.value = true;
  listBoundIdentities(h.id).then((list: any) => {
    hostBoundIdentities.value = list ?? [];
  }).catch(() => { hostBoundIdentities.value = []; });
}
function doConnect(): void {
  const h = connectTarget.value;
  if (!h) return;
  const identityId = connectIdentityId.value;
  router.push({
    path: "/terminal",
    query: { hostId: String(h.id), protocol: protocolOf(h), ...(identityId != null ? { identityId: String(identityId) } : {}) },
  });
  connectVisible.value = false;
}

/** 身份管理（新增/删除）已统一迁至左侧「账号管理」页（/account）；
 *  本页仅保留身份选择（连接弹窗）与绑定/解绑 */
/** 在连接弹窗里绑定/解绑身份 */
async function toggleBind(hostId: number, identityId: number, bind: boolean): Promise<void> {
  try {
    if (bind) await bindIdentity(hostId, identityId);
    else await unbindIdentity(hostId, identityId);
    message.success(bind ? "已绑定该身份" : "已解绑");
    const list = await listBoundIdentities(hostId);
    hostBoundIdentities.value = list ?? [];
  } catch (e) { message.error(String((e as Error)?.message ?? e)); }
}

// ---- 更多菜单：在离线 / 指标 / 延迟检测（后台 HostOnlineScheduler 三项检测）----
const configVisible = ref(false);
useDialogPrerender(configVisible);
const configHost = ref<Host | null>(null);
const configMode = ref<"online" | "metric" | "delay">("metric");
// 画像抽屉定位：打开时预选的主机与分区
const profileHostId = ref<number | null>(null);
const profileTab = ref("overview");
/** 每次打开自增，保证重复打开同一台主机也会重新定位并刷新 */
const profileSeq = ref(0);

// 协议服务器管理弹窗已移除

// ---- 主机画像（master-detail：左主机列表 + 右 ReTab 详情） ----
const profileVisible = ref(false);
const deployDialogVisible = ref(false);
const deployProgress = ref(0);
const deployMessage = ref("");
const deployStatus = ref<"info" | "success" | "warn" | "error">("info");
const deployInfo = reactive({ hostId: 0, hostName: "", action: "" as "install" | "reinstall" | "upgrade" | "uninstall" });
const deployMinimized = ref(false);
const deployLogs = ref<string[]>([]);
const deployTask = ref<any>({
  id: "agent-deploy",
  title: "Agent 部署",
  progress: 0,
  status: "running",
  text: "准备中...",
  createdAt: Date.now(),
  startedAt: Date.now(),
  history: [],
});
useDialogPrerender(profileVisible);

/** 软件安装（nginx）对话框状态 */
const installVisible = ref(false);
const installHost = ref<Host | null>(null);

/** 顶部「新增」右侧功能菜单开关（ElPopover 自管 visible） */
const toolbarMenuOpen = ref(false);
/** 卡片「更多」当前展开的主机 id（同一时刻只允许一张卡片展开） */
const morePopover = ref<number | null>(null);

/** 关闭顶部功能区菜单 */
function closeToolbarMenu(): void {
  toolbarMenuOpen.value = false;
}
/** 关闭卡片「更多」菜单 */
function closeMoreMenu(): void {
  morePopover.value = null;
}

/**
 * 没有实时指标时的说明文案。
 *
 * <p>区别于「还在等推送」与「这台主机本来就采不到」：前者刷新一下就好，
 * 后者要去改采集方式，提示必须能把这两件事分开，否则用户只会反复刷新。</p>
 *
 * @param h 主机
 */
function rtMetricsMissingText(h: Host): string {
  const mode = (h.serverHostCollectMode ?? "").toUpperCase();
  if (mode === "MANUAL") return "手动采集模式，暂无实时指标";
  if (h.serverHostStatus === 0) return "主机离线，暂无实时指标";
  return "等待采集上报…";
}

/**
 * 点击菜单外部时关闭：自定义指令。
 *
 * <p>不用 el-popover 的 onClickOutside，是因为要用同一个开关状态驱动
 * 「点击按钮取反」，而 Element 的 popper 触发器在当前构建下没能把 ref 交回来
 * （全页 84 个 .el-tooltip__trigger 只有 3 个拿到 aria-haspopup），点开是无响应。
 * 这里用 mousedown 判定，避免与菜单项自身的 click 抢先后。</p>
 */
const vClickOutsideMenu = {
  mounted(el: HTMLElement, binding: { value?: () => void }) {
    const handler = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) binding.value?.();
    };
    (el as HTMLElement & { __menuOutside?: (e: MouseEvent) => void }).__menuOutside = handler;
    // 冒泡阶段：菜单项自身 @click.stop 已处理，这里只兜底外部点击
    document.addEventListener("mousedown", handler);
  },
  unmounted(el: HTMLElement) {
    const h = (el as HTMLElement & { __menuOutside?: (e: MouseEvent) => void }).__menuOutside;
    if (h) document.removeEventListener("mousedown", h);
  },
};

/** 打开软件安装对话框 */
function onOpenInstall(h: Host): void {
  installHost.value = h;
  installVisible.value = true;
}

/** 安装完成回调：刷新主机列表 */
function onInstalled(): void {
  fetchAll();
}

/**
 * 顶部「新增资产」按钮弹出的功能菜单命令分发。
 *
 * <p>设计取舍：右上角按钮本身是「新增」这个最高频动作（点击即开表单），
 * 悬停时展开的功能菜单是它的补充入口 —— 把原先堆在每张卡片底部的一排操作
 * 收敛到一处，卡片只留「远控 / 监控」两个真正的主操作。</p>
 *
 * <p>需要一台具体主机才能执行的动作（画像 / 编辑 / 安装 / 删除）不在这里列出，
 * 卡片底部只保留「远控 / 监控 / 更多」，右键菜单仍可直达全部动作 —— 在没有任何
 * 行上下文的位置放这些项，点下去只能二选一：静默无反应，或误作用于列表第一台。</p>
 *
 * @param cmd 菜单命令
 */
function onToolbarCommand(cmd: string): void {
  switch (cmd) {
    case "add-host":
      openAdd();
      break;
    case "refresh":
      fetchAll();
      break;
    case "card-mode":
      viewMode.value = "card";
      break;
    case "table-mode":
      viewMode.value = "table";
      break;
    case "toggle-realtime":
      realtimeEnabled.value = !realtimeEnabled.value;
      onRealtimeToggle(realtimeEnabled.value);
      break;
    case "reset-filter":
      resetFilters();
      break;
    default:
      break;
  }
}

function openSysMgr(type: string, row: Host): void {
  // 画像页现在全量走 Agent：未安装时不再拦在门外，进去后由画像页给出
  // 「Agent 未就绪 + 最近错误 + 安装 Agent」的引导，避免用户完全看不到主机状态
  profileHostId.value = row.id;
  profileTab.value = type;
  profileSeq.value++;
  profileVisible.value = true;
}

function onMoreCommand(cmd: string, row: Host): void {
  if (cmd === "remote-config") {
    // 远控配置已并入编辑弹窗的「远控配置」区块
    openEdit(row);
    return;
  }
  // 所有系统管理项都合并到主机画像弹窗
  const tabMap: Record<string, string> = {
    "online": "process",
    "metric": "process",
    "delay": "process",
    "process": "process",
    "system-service": "service",
    "network-interface": "network-interface",
    "network-connection": "network-connection",
    "disk": "disk",
    "partition": "disk",
    "firewall": "firewall",
    "driver": "driver",
  };
  const tab = tabMap[cmd] || "process";
  openSysMgr(tab, row);
}

function openAdd(): void {
  formIsEdit.value = false;
  editHost.value = null;
  formVisible.value = true;
}
function openEdit(h: Host): void {
  // 弹窗子组件内部负责：行数据立即填充 + 详情异步回填（打开不再阻塞、不再触发本组件大 diff）
  formIsEdit.value = true;
  editHost.value = h;
  formVisible.value = true;
}
// ---- 删除 / 启停 / 批量 ----
/** Agent 动作文案 */
const AGENT_ACTION_LABEL: Record<string, string> = {
  install: "安装", reinstall: "重装", upgrade: "升级", uninstall: "卸载",
};

// 打开 Agent 自动部署弹窗
async function openDeploy(
  h: Host | { id: number; serverHostName: string; action: string },
  action?: 'install' | 'reinstall' | 'upgrade' | 'uninstall',
) {
  // 支持两种调用方式：openDeploy(h, 'upgrade') 或 openDeploy({ id, serverHostName, action })
  let hostId: number, hostName: string, act: 'install' | 'reinstall' | 'upgrade' | 'uninstall';
  if (action) {
    hostId = (h as Host).id;
    hostName = (h as Host).serverHostName || '';
    act = action;
  } else {
    hostId = (h as any).id;
    hostName = (h as any).serverHostName || '';
    act = (((h as any).action || 'install') as typeof act);
  }
  if (act === 'uninstall') {
    try {
      await ElMessageBox.confirm(
        `卸载主机「${hostName}」上的 Agent？卸载后主机画像、实时指标与远程控制将全部停用，需要重新安装才能恢复。`,
        "卸载确认", { type: "warning", confirmButtonText: "卸载", cancelButtonText: "取消" },
      );
    } catch { return; }
  }
  deployInfo.hostId = hostId;
  deployInfo.hostName = hostName;
  deployInfo.action = act;
  deployProgress.value = 0;
  deployMessage.value = '准备中...';
  deployStatus.value = 'info';
  deployDialogVisible.value = true;
  const label = AGENT_ACTION_LABEL[act] ?? act;
  deployLogs.value = [`[${new Date().toLocaleTimeString()}] 开始${label} Agent...`];
  deployTask.value = {
    id: "agent-deploy",
    title: `${label} Agent - ${hostName}`,
    progress: 0.05,
    status: "running",
    text: "准备中...",
    createdAt: Date.now(),
    startedAt: Date.now(),
    history: [{ time: Date.now(), progress: 0.05, status: "running" }],
  };
  try {
    await submitAgentAction(hostId, act);
  } catch (e: any) {
    deployStatus.value = 'error';
    deployMessage.value = '请求失败: ' + (e?.message ?? e);
    deployTask.value = { ...deployTask.value, status: "failed", text: '请求失败' };
  }
}

async function removeHost(h: Host): Promise<void> {
  await ElMessageBox.confirm(`删除主机「${h.serverHostName}」？`, "删除确认", { type: "warning" });
  try {
    const ok = await delHost(h.id);
    if (ok === false) { message.warning("删除未生效（可能仍有绑定）"); return; }
    message.success("已删除");
    await fetchAll();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

/** 采集模式是否为 Agent（决定 Agent 生命周期入口显隐） */
function isAgentMode(h: Host): boolean {
  return h.serverHostCollectMode === "AGENT";
}

/** Agent 是否已安装 */
function isAgentInstalled(h: Host): boolean {
  return h.serverHostAgentInstalled === 1;
}

/**
 * 表格「更多」下拉命令分发
 * @param cmd 下拉项 command
 * @param h 当前行主机
 */
function runRowCommand(cmd: string, h: Host): void {
  switch (cmd) {
    case "detail": openDetail(h); break;
    case "scan": scanHostPorts(h); break;
    case "profile": openSysMgr("disk", h); break;
    case "edit": openEdit(h); break;
    case "install-nginx": onOpenInstall(h); break;
    case "agent-install": openDeploy(h, "install"); break;
    case "agent-reinstall": openDeploy(h, "reinstall"); break;
    case "agent-upgrade": openDeploy(h, "upgrade"); break;
    case "agent-uninstall": openDeploy(h, "uninstall"); break;
    case "delete": removeHost(h); break;
    default: break;
  }
}

/** 右键上下文菜单状态 */
const ctxMenu = reactive<{ visible: boolean; x: number; y: number; host: Host | null }>({
  visible: false,
  x: 0,
  y: 0,
  host: null,
});
/** 菜单估算尺寸，用于边缘翻转避免超出视口 */
const CTX_MENU_W = 208;
const CTX_MENU_H = 380;
/** 打开右键菜单（卡片/表格行右键触发） */
function openCtxMenu(event: MouseEvent, h: Host): void {
  event.preventDefault();
  let x = event.clientX;
  let y = event.clientY;
  if (x + CTX_MENU_W > window.innerWidth - 8) x = window.innerWidth - CTX_MENU_W - 8;
  if (y + CTX_MENU_H > window.innerHeight - 8) y = window.innerHeight - CTX_MENU_H - 8;
  ctxMenu.host = h;
  ctxMenu.x = Math.max(8, x);
  ctxMenu.y = Math.max(8, y);
  ctxMenu.visible = true;
}
/** 关闭右键菜单 */
function closeCtxMenu(): void {
  ctxMenu.visible = false;
  ctxMenu.host = null;
}
/** 右键菜单命令分发（连接/编辑直连本组件方法，其余走行命令） */
function ctxCommand(cmd: string): void {
  const h = ctxMenu.host;
  closeCtxMenu();
  if (!h) return;
  if (cmd === "connect") { openConnect(h); return; }
  if (cmd === "edit") { openEdit(h); return; }
  runRowCommand(cmd, h);
}
/** 表格根上的原生右键：把 <tr> 按行序号映射回主机并打开统一菜单（主表体/固定列同序）
 *
 * <p>选择器必须**同时**认两套引擎的行类名：本页 ReTable 未传 engine，当前走默认的
 * element 引擎（{@code tr.el-table__row}）；一旦该表格改用 {@code engine="vxe"}，
 * 行会变成 {@code tr.vxe-body--row}，只写 element 那支时 closest 返回 null、
 * 这里直接 return，右键菜单**静默失效且不报错**，排查成本很高。</p>
 *
 * <p>固定列（element 的 fixed / vxe 的 fixed-right wrapper）会各自渲染一份同序、
 * 同数量的行，所以在任一 tbody 内取 :scope 直接子行，序号都与 filtered 对齐。</p>
 */
function onTableContextMenu(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  const tr = target?.closest?.("tr.el-table__row, tr.vxe-body--row") as HTMLElement | null;
  if (!tr) return;
  const tbody = tr.parentElement;
  if (!tbody) return;
  const rows = Array.from(
    tbody.querySelectorAll(":scope > tr.el-table__row, :scope > tr.vxe-body--row"),
  );
  const idx = rows.indexOf(tr);
  const h = filtered.value[idx];
  if (h) openCtxMenu(event, h);
}
async function toggleHost(h: Host): Promise<void> {
  try {
    await switchHost(h.id, h.serverHostRemoteEnabled !== 1);
    message.success("已切换");
    await fetchAll();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}
async function batchDelete(): Promise<void> {
  if (selection.value.length === 0) return;
  await ElMessageBox.confirm(`批量删除 ${selection.value.length} 台主机？`, "批量删除", { type: "warning" });
  let ok = 0;
  for (const h of selection.value) {
    try { await delHost(h.id); ok++; } catch { /* 单条失败继续 */ }
  }
  message.success(`删除 ${ok}/${selection.value.length}`);
  selection.value = [];
  await fetchAll();
}

onMounted(() => {
  fetchAll();
  // 实时延迟 + 在线状态：socket 推送（后台 HostOnlineScheduler 检测后广播）
  const socket = useSocketService();
  unsubDelay = socket?.subscribe("monitor", "host-delay", (msg) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; delayMs?: number | null };
      if (d && d.hostId != null) liveDelay.value[d.hostId] = d.delayMs ?? -1;
    } catch { /* 静默 */ }
  });
  unsubOnline = socket?.subscribe("monitor", "host-online", (msg) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; online?: number };
      if (d && d.hostId != null) liveOnline.value[d.hostId] = d.online ? 1 : 0;
    } catch { /* 静默 */ }
  });
  // 实时 CPU/内存/磁盘：socket host-metrics 推送
  // Agent 自动部署进度推送
  unsubDeploy = socket?.subscribe("monitor", "agent-deploy", (msg) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; progress?: number; message?: string; status?: string };
      if (d && d.hostId === deployInfo.hostId) {
        const pct = (d.progress ?? 0) / 100;
        deployProgress.value = d.progress ?? 0;
        deployMessage.value = d.message ?? '';
        const s = d.status;
        deployStatus.value = s === 'success' || s === 'warn' || s === 'error' ? s : 'info';
        deployLogs.value.push(`[${new Date().toLocaleTimeString()}] ${d.message} (${d.progress}%)`);
        deployTask.value = {
          ...deployTask.value,
          progress: pct,
          status: d.status === 'success' ? 'success' : d.status === 'error' ? 'failed' : 'running',
          text: d.message ?? '',
          history: [...deployTask.value.history, { time: Date.now(), progress: pct, status: d.status === 'success' ? 'success' : d.status === 'error' ? 'failed' : 'running' }],
        };
        // 终态意味着台账里的 installed/版本/端口都已变更，列表必须跟着刷新
        if (d.status === 'success' || d.status === 'error') {
          fetchAll();
        }
      }
    } catch { /* 静默 */ }
  });
  unsubMetrics = socket?.subscribe("monitor", "host-metrics", (msg) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; cpu?: number; mem?: number; disk?: number };
      if (!realtimeEnabled.value) return;
      if (d && d.hostId != null) {
        const cpu = Math.round((Number(d.cpu) || 0) * 10) / 10;
        rtMetrics[d.hostId] = {
          cpu,
          mem: Math.round((Number(d.mem) || 0) * 10) / 10,
          disk: Math.round((Number(d.disk) || 0) * 10) / 10,
          tx: '—', rx: '—'
        };
        // 同步进趋势缓冲，卡片右侧折线才有时序形状
        pushTrend(d.hostId, cpu);
      }
    } catch { /* 静默 */ }
  });
  // 端口扫描完成：后台异步扫描落库后推送，实时回填端口字段与扫描时间
  unsubPortScan = socket?.subscribe("monitor", "host-portscan", (msg) => {
    try {
      const d = (msg.data ?? msg) as {
        hostId?: number; success?: boolean; openCount?: number;
        elapsedSeconds?: number; portsJson?: string | null; scanTime?: string; error?: string;
      };
      if (!d || d.hostId == null) return;
      const target = hosts.value.find(h => h.id === d.hostId);
      if (target) {
        target.serverHostPorts = d.portsJson ?? "[]";
        target.serverHostLastPortScanTime = d.scanTime ?? null;
      }
      if (d.success) {
        message.success(`端口扫描完成：发现 ${d.openCount ?? 0} 个开放端口（耗时 ${d.elapsedSeconds ?? 0}s）`);
      } else {
        message.error(`端口扫描失败：${d.error ?? "未知错误"}`);
      }
    } catch { /* 静默 */ }
  });
});
onBeforeUnmount(() => {
  unsubDelay?.();
  unsubOnline?.();
  unsubMetrics?.();
  unsubDeploy?.();
  unsubPortScan?.();
});

/** 实时在线状态（socket 优先，回退 host.serverHostOnline；本机恒在线） */
function liveOnlineState(h: Host): number {
  if (h.serverHostCollectMode === "LOCAL") {
    return 1;
  }
  return liveOnline.value[h.id] ?? h.serverHostOnline;
}
/** 实时延迟（socket 优先，回退 host.serverHostDelayMs；本机恒 0ms） */
function liveDelayMs(h: Host): number | null {
  if (h.serverHostCollectMode === "LOCAL") {
    return 0;
  }
  const v = liveDelay.value[h.id];
  if (v != null) return v;
  return h.serverHostDelayMs ?? null;
}
/** 延迟显示文案 */
function delayText(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 0) return "不可达";
  return ms + " ms";
}
/** 延迟是否异常（高延迟红色） */
function delayBad(ms: number | null): boolean {
  return ms != null && (ms < 0 || ms > 200);
}

/**
 * OS 图标底纹类（按系统类型给卡片图标一个品牌语义淡底）
 * @param h 主机
 */
function osTileClass(h: Host): string {
  const os = (h.serverHostOsType ?? "").toLowerCase();
  if (os.includes("win")) return "is-windows";
  if (os.includes("mac") || os.includes("darwin")) return "is-macos";
  if (os.includes("linux") || os.includes("ubuntu") || os.includes("centos")
      || os.includes("red hat") || os.includes("unix")) return "is-linux";
  return "is-other";
}
</script>

<template>
  <div class="as">
    <div v-if="loadError" class="as-error">
      <span>数据加载失败：{{ loadError }}</span>
      <ReButton icon="RefreshRight" type="primary" :show-text="true" @click="fetchAll">重试</ReButton>
    </div>

    <!-- 统计卡：ReStatCard 紧凑档，与「账号管理 / 代理管理」同规格 -->
    <section class="host-kpis">
      <ReStatCard
        v-for="k in hostKpis"
        :key="k.key"
        size="compact"
        :title="k.title"
        :value="k.value"
        :desc="k.desc"
        :icon="k.icon"
        :icon-color="k.iconColor"
      >
        <!-- 口径说明挂在标题旁：按需浮层，不占版面。
             注解与卡同 key 绑定，改卡片时不会漏改注解。 -->
        <template #title>
          <span class="kpi-title">
            <span class="kpi-title__text">{{ k.title }}</span>
            <ElTooltip
              v-if="noteOf(k.key)"
              :content="noteOf(k.key)"
              placement="top"
              :show-after="200"
            >
              <span class="kpi-title__tip" @click.stop>
                <ReIcon name="QuestionFilled" :size="12" />
              </span>
            </ElTooltip>
          </span>
        </template>
      </ReStatCard>
    </section>

    <!-- 筛选条（对齐 UI 稿：独立白色圆角面板） -->
    <div class="as-panel as-filter">
      <div class="filter">
        <ReFilter
          :items="filterItems"
          :columns="3"
          :collapsible="false"
          :show-actions="false"
          @change="onFilterChange"
          @reset="onFilterReset"
          style="flex:1;min-width:0"
        >
          <template #tag>
            <div v-if="allTags.length" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              <span class="muted">标签:</span>
              <ReTag
                v-for="t in allTags"
                :key="t"
                :class="['chip', { active: filterState.tag === t }]"
                @click="filterState.tag = filterState.tag === t ? '' : t"
              >{{ t }}</ReTag>
            </div>
          </template>
        </ReFilter>
        <span v-if="filtered.length !== hosts.length" class="muted">{{ filtered.length }} / {{ hosts.length }}</span>
        <div class="view-toggle">
          <button class="vt-btn" :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'">
            <ReIcon name="Grid" :size="14" />卡片
          </button>
          <button class="vt-btn" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">
            <ReIcon name="Menu" :size="14" />列表
          </button>
        </div>
        <!-- 操作区：统一 ReButton square（图标 + tip），落在视图切换右侧 -->
        <div class="filter-ops">
          <label class="color-switch">
            <span>实时监控</span>
            <el-switch v-model="realtimeEnabled" @change="onRealtimeToggle" />
          </label>
          <ReButton icon="RefreshRight" layout="square" tip="刷新" :loading="loading" @click="fetchAll" />
          <!-- 「新增资产」= 点击直接开表单（最高频动作）；右侧箭头才是功能区菜单：
               刷新 / 视图切换 / 实时监控 / 重置筛选 收敛到一处。
               用 split 而不是「整颗按钮都弹菜单」——后者让最高频的「新增」多一次点击。 -->
          <div class="filter-ops__add" v-click-outside-menu="closeToolbarMenu">
            <ReButton icon="Plus" layout="square" type="primary" tip="新增资产" @click="openAdd" />
            <!-- 用原生 v-show 定位菜单，不依赖 el-popover / el-dropdown：
                 当前构建下 Element 的 popper 触发器链路大面积失效（全页 84 个
                 .el-tooltip__trigger 里只有 3 个拿到 aria-haspopup），点开是空响应。 -->
            <button
              class="filter-ops__add-more"
              type="button"
              title="更多功能"
              aria-label="更多功能"
              aria-haspopup="menu"
              :aria-expanded="toolbarMenuOpen ? 'true' : 'false'"
              @click.stop="toolbarMenuOpen = !toolbarMenuOpen"
            >
              <ReIcon name="ArrowDown" :size="12" />
            </button>
            <transition name="hc-menu-fade">
              <div v-show="toolbarMenuOpen" class="hc-more-menu hc-more-menu--anchor" role="menu">
                <button class="hc-more-item" @click="onToolbarCommand('add-host'); toolbarMenuOpen = false"><ReIcon name="Plus" />新增主机</button>
                <div class="hc-more-sep" />
                <button class="hc-more-item" @click="onToolbarCommand('refresh'); toolbarMenuOpen = false"><ReIcon name="RefreshRight" />刷新列表</button>
                <button class="hc-more-item" @click="onToolbarCommand('card-mode'); toolbarMenuOpen = false"><ReIcon name="Grid" />卡片视图</button>
                <button class="hc-more-item" @click="onToolbarCommand('table-mode'); toolbarMenuOpen = false"><ReIcon name="Menu" />列表视图</button>
                <button class="hc-more-item" @click="onToolbarCommand('toggle-realtime'); toolbarMenuOpen = false"><ReIcon name="TrendCharts" />{{ realtimeEnabled ? '关闭' : '开启' }}实时监控</button>
                <div class="hc-more-sep" />
                <button class="hc-more-item" @click="onToolbarCommand('reset-filter'); toolbarMenuOpen = false"><ReIcon name="Refresh" />重置筛选</button>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>

        <!-- 卡片视图（默认）：吃满一行，显示详细指标
             用 el-card 而非 ReCard：el-card 支持 header / footer 插槽，结构与页面一致；
             底下把它的页面级装饰复位成扁平容器，视觉与页面其余面板统一。 -->
      <div
        v-if="viewMode === 'card'"
        class="host-card-grid"
        :class="{ 'host-card-grid--empty': filtered.length === 0 }"
      >
        <ElCard
          v-for="h in filtered"
          :key="h.id"
          :body-style="{ paddingTop: '10px', paddingBottom: '10px' }"
          @contextmenu="openCtxMenu($event, h)"
        >
          <template #header>
            <div class="hc-head">
              <span class="hc-os" :class="osTileClass(h)">
                <span v-html="osIconSvg(h.serverHostOsType)"></span>
              </span>
              <div class="hc-name-wrap">
                <div class="hc-title-row">
                  <b class="hc-name">{{ h.serverHostName }}</b>
                  <span v-if="h.serverHostOsType" class="hc-os-tag" :title="h.serverHostOsVersion || h.serverHostOsType">{{ h.serverHostOsType }}</span>
                  <span class="hc-online" :class="liveOnlineState(h) === 1 ? 'is-on' : 'is-off'">
                    <i class="hc-dot" />{{ liveOnlineState(h) === 1 ? '在线' : '离线' }}
                  </span>
                </div>
                <div class="hc-addr mono">{{ h.serverHostAddress }}:{{ h.serverHostPort }}</div>
                <div v-if="h.serverHostPublicIp || h.serverHostPrivateIp" class="hc-ip mono">
                  <span v-if="h.serverHostPublicIp">公网 {{ h.serverHostPublicIp }}</span>
                  <span v-if="h.serverHostPublicIp && h.serverHostPrivateIp" class="hc-ip-sep">·</span>
                  <span v-if="h.serverHostPrivateIp">内网 {{ h.serverHostPrivateIp }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- 关键属性胶囊（延迟 / 采集 / 协议 / Agent） -->
          <div class="hc-chips">
            <span class="hc-chip">
              <i>延迟</i>
              <b class="mono" :class="{ bad: delayBad(liveDelayMs(h)) }">{{ delayText(liveDelayMs(h)) }}</b>
            </span>
            <span class="hc-chip"><i>采集</i><b>{{ collectModeLabel(h.serverHostCollectMode) }}</b></span>
            <span class="hc-chip"><i>协议</i><b>{{ protocolOf(h).toUpperCase() }}</b></span>
            <span class="hc-chip"><i>Agent</i><b>{{ h.serverHostAgentEnabled === 1 ? '已注册' : '未注册' }}</b></span>
          </div>

          <!-- 实时指标区：左侧条形 + 右侧 CPU 趋势迷你图（socket host-metrics 推送） -->
          <div v-if="realtimeEnabled && rtMetrics[h.id]" class="hc-metrics">
            <div class="hc-metrics__bars">
              <div class="hc-bar-row">
                <span class="hc-bar-label">CPU</span>
                <ElProgress
                  :percentage="Math.round(rtMetrics[h.id].cpu ?? 0)"
                  :color="barColor(rtMetrics[h.id].cpu)"
                  :stroke-width="16"
                  :show-text="false"
                  class="hc-bar-progress"
                />
                <span class="hc-bar-val">{{ (rtMetrics[h.id].cpu ?? 0).toFixed(1) }}%</span>
              </div>
              <div class="hc-bar-row">
                <span class="hc-bar-label">内存</span>
                <ElProgress
                  :percentage="Math.round(rtMetrics[h.id].mem ?? 0)"
                  :color="barColor(rtMetrics[h.id].mem)"
                  :stroke-width="16"
                  :show-text="false"
                  class="hc-bar-progress"
                />
                <span class="hc-bar-val">{{ (rtMetrics[h.id].mem ?? 0).toFixed(1) }}%</span>
              </div>
              <div class="hc-bar-row">
                <span class="hc-bar-label">磁盘</span>
                <ElProgress
                  :percentage="Math.round(rtMetrics[h.id].disk ?? 0)"
                  :color="barColor(rtMetrics[h.id].disk)"
                  :stroke-width="16"
                  :show-text="false"
                  class="hc-bar-progress"
                />
                <span class="hc-bar-val">{{ (rtMetrics[h.id].disk ?? 0).toFixed(1) }}%</span>
              </div>
            </div>

            <!-- 右侧可视化：CPU 时序折线 + 三项占用环，一眼看出负载走势而不只是当前值 -->
            <div class="hc-metrics__viz" :title="`CPU 趋势（最近 ${TREND_POINTS} 次采样）`">
              <div class="hc-viz-head">
                <span class="hc-viz-title">CPU 趋势</span>
                <span class="hc-viz-delta" :class="trendDeltaClass(h.id)">{{ trendDeltaText(h.id) }}</span>
              </div>
              <ReEcharts class="hc-viz-chart" :option="trendOption(h.id)" height="52px" />
              <div class="hc-viz-rings">
                <span class="hc-ring" :style="ringStyle(rtMetrics[h.id].cpu)">
                  <b>{{ Math.round(rtMetrics[h.id].cpu ?? 0) }}</b><i>CPU</i>
                </span>
                <span class="hc-ring" :style="ringStyle(rtMetrics[h.id].mem)">
                  <b>{{ Math.round(rtMetrics[h.id].mem ?? 0) }}</b><i>内存</i>
                </span>
                <span class="hc-ring" :style="ringStyle(rtMetrics[h.id].disk)">
                  <b>{{ Math.round(rtMetrics[h.id].disk ?? 0) }}</b><i>磁盘</i>
                </span>
              </div>
            </div>
          </div>

          <!-- 无实时指标时的占位：主机还没采集到使用率（MANUAL / 离线 / 刚加入）时，
               不渲染指标区，但要占住同样的高度 —— 否则同一行的卡片高低不齐、
               操作栏也会跳到不同位置，看起来像「渲染坏了」。 -->
          <div v-else-if="realtimeEnabled" class="hc-metrics hc-metrics--empty">
            <span class="hc-metrics__placeholder">
              <ReIcon name="DataLine" :size="14" />
              {{ rtMetricsMissingText(h) }}
            </span>
          </div>

          <!-- 分组 + 标签（无分组无标签时整块不渲染，不再显示“未分组”） -->
          <div v-if="h.msServerGroupId || splitTags(h.serverHostTags).length" class="hc-tags">
            <ReTag
              v-if="h.msServerGroupId"

              :value="String(h.msServerGroupId)"
              :tag-options="[{ dictValue: String(h.msServerGroupId), dictLabel: groupName(h.msServerGroupId), dictTag: 'primary' }]"
            />
            <ReTag
              v-for="t in splitTags(h.serverHostTags)"
              :key="t"

              :value="t"
              :tag-options="[{ dictValue: t, dictLabel: t, dictTag: 'info' }]"
            />
          </div>

          <!-- 端口：收敛为单个标签，hover 弹层列出全部 -->
          <div v-if="parsePorts(h.serverHostPorts).length" class="hc-ports">
            <ElPopover trigger="hover" placement="top-start" :width="260" popper-class="ports-popover">
              <template #reference>
                <ReTag effect="plain" type="info">端口 {{ parsePorts(h.serverHostPorts).length }}</ReTag>
              </template>
              <div class="ports-pop-list">
                <div v-for="p in parsePorts(h.serverHostPorts)" :key="p.port" class="ports-pop-item">
                  <span class="mono">{{ portText(p) }}</span>
                  <span v-if="portStatusM(p.state).open !== null" class="port-status" :class="portStatusM(p.state).open ? 'ps-open' : 'ps-closed'">
                    <i class="ps-dot"></i>{{ portStatusM(p.state).text }}
                  </span>
                </div>
              </div>
            </ElPopover>
          </div>

          <!-- 卡片操作：只保留两个主操作，图标态 + 悬停提示。
               原先「远控 / 监控 / 扫描 / 更多」四个文字按钮要占一整行（约 61px），
               窄卡片里还会折行；扫描与其余低频动作已收敛到右上角功能菜单与右键菜单。
               图标态点击区仍是 28px，且都带 title，识别成本低于多占一行的收益。 -->
          <template #footer>
            <div class="hc-actions">
              <ReButton icon="Connection" layout="square" type="primary" tip="远控" @click="openConnect(h)" />
              <ReButton icon="TrendCharts" layout="square" tip="监控" @click="openDetail(h)" />
              <!-- 「更多」= 原生定位菜单（同顶部功能区）：不依赖 Element 的 popper 触发器链路 -->
              <div class="hc-more-wrap" v-click-outside-menu="closeMoreMenu">
                <button
                  class="hc-more"
                  type="button"
                  title="更多操作"
                  aria-label="更多操作"
                  aria-haspopup="menu"
                  :aria-expanded="morePopover === h.id ? 'true' : 'false'"
                  @click.stop="morePopover = morePopover === h.id ? null : h.id"
                >
                  <ReIcon name="MoreFilled" :size="14" />
                </button>
                <transition name="hc-menu-fade">
                  <div v-show="morePopover === h.id" class="hc-more-menu hc-more-menu--anchor" role="menu">
                    <button class="hc-more-item" @click="runRowCommand('scan', h); morePopover = null"><ReIcon name="Aim" />端口扫描</button>
                    <button class="hc-more-item" @click="runRowCommand('profile', h); morePopover = null"><ReIcon name="Histogram" />主机画像</button>
                    <button class="hc-more-item" @click="runRowCommand('edit', h); morePopover = null"><ReIcon name="EditPen" />编辑主机</button>
                    <div class="hc-more-sep" />
                    <button class="hc-more-item" @click="runRowCommand('install-nginx', h); morePopover = null"><ReIcon name="Box" />安装 Nginx</button>
                    <template v-if="isAgentMode(h) && !isAgentInstalled(h)">
                      <div class="hc-more-sep" />
                      <button class="hc-more-item" @click="runRowCommand('agent-install', h); morePopover = null"><ReIcon name="Download" />安装 Agent</button>
                    </template>
                    <template v-else-if="isAgentMode(h)">
                      <div class="hc-more-sep" />
                      <button class="hc-more-item" @click="runRowCommand('agent-reinstall', h); morePopover = null"><ReIcon name="RefreshRight" />重装 Agent</button>
                      <button class="hc-more-item" @click="runRowCommand('agent-upgrade', h); morePopover = null"><ReIcon name="Top" />升级 Agent</button>
                      <button class="hc-more-item" @click="runRowCommand('agent-uninstall', h); morePopover = null"><ReIcon name="DeleteFilled" />卸载 Agent</button>
                    </template>
                    <div class="hc-more-sep" />
                    <button class="hc-more-item is-danger" @click="runRowCommand('delete', h); morePopover = null"><ReIcon name="Delete" />删除主机</button>
                  </div>
                </transition>
              </div>
            </div>
          </template>
        </ElCard>
        <!-- 空态：外层套一个独立 el-card，与主机卡片同规格（同一套边框/圆角/阴影），
             避免 ElEmpty 裸放在 grid 里时和卡片容器风格不一致。
             空态分三种：加载失败 / 一台都没有 / 筛选用完没匹配上。
             加载失败单列一种是有意的：此时 hosts 是空数组，按前两种判都会说成
             「暂无主机」或「没有匹配」，把「没读到」说成「没有」是误导 ——
             虽然顶部已有红条，但空态卡本身也该自解释。 -->
        <ElCard v-if="filtered.length === 0" class="hc-empty-card" shadow="never">
          <ElEmpty
            :description="emptyDescription"
            :image-size="120"
          >
            <ReButton v-if="loadError" icon="RefreshRight" type="primary" :show-text="true" @click="fetchAll">重试</ReButton>
            <ReButton v-else-if="hasHosts" icon="Refresh" :show-text="true" @click="resetFilters">重置筛选</ReButton>
            <ReButton v-else type="primary" icon="Plus" :show-text="true" @click="openAdd">新增主机</ReButton>
          </ElEmpty>
        </ElCard>
      </div>

      <!-- 表格视图 -->
      <ReTable
        v-else
        :data="filtered.map(h => ({ ...h }))"
        :columns="tableColumns"
        :loading="loading"
        :table-id="'asset-host-list'"

        border
        style="width:100%"
        empty-text="暂无主机"
        :toolbar="true"
        :toolbar-config="{ position: 'top', refresh: true, columnSettings: true, tableSettings: true, batchSelect: { enabled: true, tip: '批量选择' }, batchDelete: { enabled: true, confirmMessage: '确认批量删除选中的主机？', handler: batchDelete } }"
        @selection-change="selection = $event"
        @contextmenu="onTableContextMenu"
      >
        <template #col-name="{ row }">
          <span class="h-os">
            <span v-html="osIconSvg(row.serverHostOsType)"></span>
          </span>
          <b style="vertical-align:middle;margin-left:6px">{{ row.serverHostName }}</b>
        </template>
        <template #col-addr="{ row }"><span class="mono">{{ row.serverHostAddress }}:{{ row.serverHostPort }}</span></template>
        <template #col-group="{ row }">
          <ReTag
            v-if="row.msServerGroupId"

            :value="String(row.msServerGroupId)"
            :tag-options="[{ dictValue: String(row.msServerGroupId), dictLabel: groupName(row.msServerGroupId), dictTag: 'primary' }]"
          />
        </template>
        <template #col-tags="{ row }">
          <div v-if="splitTags(row.serverHostTags).length" style="display:flex;gap:4px;flex-wrap:wrap">
            <ReTag v-for="t in splitTags(row.serverHostTags)" :key="t" :value="t" :tag-options="[{ dictValue: t, dictLabel: t, dictTag: 'info' }]" />
          </div>
          <span v-else class="dim">—</span>
        </template>
        <template #col-proto="{ row }">
          <ReTag :value="protocolOf(row)" :tag-options="[
            { dictValue: 'ssh', dictLabel: 'SSH', dictTag: 'primary' },
            { dictValue: 'rdp', dictLabel: 'RDP', dictTag: 'warning' },
            { dictValue: 'vnc', dictLabel: 'VNC', dictTag: 'info' },
          ]" />
        </template>
        <template #col-status="{ row }">
          <span class="st-cell"><ReStatusIndicator :type="liveOnlineState(row) === 1 ? 'success' : 'danger'" />{{ liveOnlineState(row) === 1 ? '在线' : '离线' }}</span>
        </template>
        <template #col-delay="{ row }">
          <span class="delay-live" :class="{ bad: delayBad(liveDelayMs(row)) }">{{ delayText(liveDelayMs(row)) }}</span>
        </template>
        <template #col-agent="{ row }">
          <ReTag :value="row.serverHostAgentEnabled === 1 ? 'on' : 'off'" :tag-options="[
            { dictValue: 'on', dictLabel: '已注册', dictTag: 'success' },
            { dictValue: 'off', dictLabel: '未注册', dictTag: 'info' },
          ]" />
        </template>
        <template #col-ports="{ row }">
          <ElPopover v-if="parsePorts(row.serverHostPorts).length" trigger="hover" placement="top-start" :width="260" popper-class="ports-popover">
            <template #reference>
              <ReTag effect="plain" type="info">端口 {{ parsePorts(row.serverHostPorts).length }}</ReTag>
            </template>
            <div class="ports-pop-list">
              <div v-for="p in parsePorts(row.serverHostPorts)" :key="p.port" class="ports-pop-item">
                <span class="mono">{{ portText(p) }}</span>
                <span v-if="portStatusM(p.state).open !== null" class="port-status" :class="portStatusM(p.state).open ? 'ps-open' : 'ps-closed'">
                  <i class="ps-dot"></i>{{ portStatusM(p.state).text }}
                </span>
              </div>
            </div>
          </ElPopover>
          <span v-else class="dim">未扫描</span>
        </template>
        <template #col-actions="{ row }">
          <div class="op-cell">
            <ReButton icon="Connection" layout="square" type="primary" @click="openConnect(row)">连接</ReButton>
            <ReButton icon="EditPen" layout="square" @click="openEdit(row)">编辑</ReButton>
            <ElDropdown trigger="click" placement="bottom-end" @command="(cmd) => runRowCommand(cmd as string, row)">
              <ReButton icon="MoreFilled" layout="square" aria-label="更多" />
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem command="detail"><ReIcon name="TrendCharts" />监控</ElDropdownItem>
                  <ElDropdownItem command="scan"><ReIcon name="Search" />端口扫描</ElDropdownItem>
                  <ElDropdownItem command="profile"><ReIcon name="Histogram" />主机画像</ElDropdownItem>
                  <ElDropdownItem command="install-nginx" divided><ReIcon name="Box" />安装 Nginx</ElDropdownItem>
                  <ElDropdownItem v-if="isAgentMode(row) && !isAgentInstalled(row)" command="agent-install" divided><ReIcon name="Download" />安装 Agent</ElDropdownItem>
                  <template v-else-if="isAgentMode(row)">
                    <ElDropdownItem command="agent-reinstall" divided><ReIcon name="RefreshRight" />重装 Agent</ElDropdownItem>
                    <ElDropdownItem command="agent-upgrade"><ReIcon name="Top" />升级 Agent</ElDropdownItem>
                    <ElDropdownItem command="agent-uninstall"><ReIcon name="DeleteFilled" />卸载 Agent</ElDropdownItem>
                  </template>
                  <ElDropdownItem command="delete" divided style="color:var(--el-color-danger,#f56c6c)"><ReIcon name="Delete" />删除</ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </div>
        </template>
      </ReTable>

    <!-- 新增/编辑弹窗（独立子组件——弹窗渲染只在子组件内进行，不再触发本组件全量 diff） -->
    <HostFormDialog
      v-model="formVisible"
      :is-edit="formIsEdit"
      :host="editHost"
      :identity-options="identityOptions"
      :group-options="groupOptions"
      @saved="fetchAll"
      @deploy-agent="openDeploy"
    />

    <!-- 连接弹窗（选择登录身份） -->
    <ReDialog v-model="connectVisible" :title="`连接 ${connectTarget?.serverHostName ?? ''}`" width="460px">
      <div v-if="!connectTarget" />
      <template v-else>
        <p class="muted" style="margin-top:0">{{ connectTarget.serverHostAddress }}:{{ remotePortOf(connectTarget) }} · {{ protocolOf(connectTarget).toUpperCase() }}</p>
        <div class="muted" style="margin-bottom:8px">登录身份（账号密码 / 私钥）</div>
        <ReSelect v-model="connectIdentityId" placeholder="使用默认凭据" clearable style="width:100%" :options="[
          ...hostBoundIdentities.map(b => ({ label: `${identities.find(i => i.id === b)?.msServerIdentityName ?? ''}（${identities.find(i => i.id === b)?.msServerIdentityUsername ?? ''}）`, value: b, group: '已绑定' })),
          ...identities.filter(x => !hostBoundIdentities.includes(x.id)).map(i => ({ label: `${i.msServerIdentityName}（${i.msServerIdentityUsername}）`, value: i.id, group: '全部身份' })),
        ]" />
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center">
          <ReButton icon="Key" :show-text="true" plain title="统一在左侧「账号管理」维护" @click="router.push('/account')">账号管理</ReButton>
          <template v-for="b in hostBoundIdentities" :key="b">
            <ReButton icon="Unlink" :show-text="true" type="warning" plain :title="`解绑 ${identities.find(i => i.id === b)?.msServerIdentityName ?? ''}`" @click="toggleBind(connectTarget!.id, b, false)">解绑 {{ identities.find(i => i.id === b)?.msServerIdentityName }}</ReButton>
          </template>
        </div>
      </template>
      <template #footer>
        <ReButton @click="connectVisible = false">取消</ReButton>
        <ReButton type="primary" icon="Connection" :show-text="true" @click="doConnect">{{ connectIdentityId ? "以此身份连接" : "默认凭据连接" }}</ReButton>
      </template>
    </ReDialog>

    <!-- 协议服务器管理弹窗已移除 -->

    <HostConfigDialog v-model="configVisible" :host="configHost" :mode="configMode" @saved="fetchAll" />

    <!-- 主机画像弹窗（独立子组件：左主机列表 + 右分区详情，数据全部来自 Agent） -->
    <HostProfileDialog
      v-model="profileVisible"
      :hosts="hosts"
      :groups="groups"
      :live-delay="liveDelay"
      :live-online="liveOnline"
      :initial-host-id="profileHostId"
      :initial-tab="profileTab"
      :open-seq="profileSeq"
      @connect="(h) => openConnect(h)"
      @edit="(h) => openEdit(h)"
      @detail="(h) => openDetail(h)"
      @deploy-agent="(h) => openDeploy(h, 'install')"
      @refreshed="fetchAll"
    />

    <!-- 远控配置已并入主机编辑弹窗（HostFormDialog 的「远控配置」区块） -->
  </div>
    <!-- Agent 自动部署进度弹窗（socket 实时推送，支持最小化和断点续传） -->
    <AgentDeployDialog
      v-model="deployDialogVisible"
      v-model:minimized="deployMinimized"
      :task="deployTask"
      :logs="deployLogs.map(l => ({ time: new Date().toLocaleTimeString(), msg: l }))"
    />

    <!-- 软件安装（nginx）对话框 -->
    <ScInstallDialog v-model="installVisible" :host="installHost" :hosts="hosts" @installed="onInstalled" />

    <!-- 主机右键上下文菜单（卡片/表格统一，动作直连，点击外侧关闭） -->
    <Teleport to="body">
      <div v-if="ctxMenu.visible" class="host-ctx-backdrop" @click="closeCtxMenu" @contextmenu.prevent="closeCtxMenu" />
      <div
        v-if="ctxMenu.visible && ctxMenu.host"
        class="host-ctx-menu"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        @contextmenu.prevent
      >
        <div class="host-ctx-item" @click="ctxCommand('connect')">
          <ReIcon name="Connection" /><span>连接远控</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('detail')">
          <ReIcon name="TrendCharts" /><span>监控详情</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('profile')">
          <ReIcon name="Histogram" /><span>主机画像</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('scan')">
          <ReIcon name="Aim" /><span>端口扫描</span>
        </div>
        <div class="host-ctx-item" @click="ctxCommand('install-nginx')">
          <ReIcon name="Box" /><span>安装 Nginx</span>
        </div>
        <div class="host-ctx-sep" />
        <div class="host-ctx-item" @click="ctxCommand('edit')">
          <ReIcon name="EditPen" /><span>编辑主机</span>
        </div>
        <template v-if="ctxMenu.host && isAgentMode(ctxMenu.host)">
          <div class="host-ctx-sep" />
          <div v-if="!isAgentInstalled(ctxMenu.host)" class="host-ctx-item" @click="ctxCommand('agent-install')">
            <ReIcon name="Download" /><span>安装 Agent</span>
          </div>
          <template v-else>
            <div class="host-ctx-item" @click="ctxCommand('agent-reinstall')">
              <ReIcon name="RefreshRight" /><span>重装 Agent</span>
            </div>
            <div class="host-ctx-item" @click="ctxCommand('agent-upgrade')">
              <ReIcon name="Top" /><span>升级 Agent</span>
            </div>
            <div class="host-ctx-item is-danger" @click="ctxCommand('agent-uninstall')">
              <ReIcon name="DeleteFilled" /><span>卸载 Agent</span>
            </div>
          </template>
        </template>
        <div class="host-ctx-sep" />
        <div class="host-ctx-item is-danger" @click="ctxCommand('delete')">
          <ReIcon name="Delete" /><span>删除主机</span>
        </div>
      </div>
    </Teleport>
</template>

<style scoped lang="scss">
/* 页面容器：直接铺在布局灰底上（白卡片浮于其上，对齐 UI 稿）
   纵向 flex + 吃满高度：上方 KPI 与筛选条是定高区块，高度全给下方主机区。
   不这样做的话，主机少时内容撑不满视口，底部会留一大片灰 —— 去掉口径说明卡后
   这块空白更明显了。父级 el-main 是 flex:1 的滚动容器，height:100% 有确定值可解析。 */
.as {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}
/* 定高区块不参与纵向压缩：视口变矮时该由主机区（min-height:0）让位，
   而不是把 KPI 卡和筛选条一起压扁。 */
.as > .host-kpis,
.as > .as-filter {
  flex-shrink: 0;
}

/* ============================================================
   统计卡（ReStatCard 紧凑档横排，卡片外壳规格由组件基线提供）
   —— 顶部 hero（大标题 + 主操作）已删除：页面标题由外壳面包屑承担，
   原 hero 上的「实时监控 / 刷新 / 新增资产」下沉到筛选行右侧。
   ============================================================ */
.host-kpis {
  display: grid;
  /* 紧凑档单卡较窄，auto-fit 让 4 张按可用宽度自动换行，无需断点硬切 */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

/* ============================================================
   KPI 标题内的口径 tip：文字 + 问号图标
   ============================================================ */
.kpi-title {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 100%;
  min-width: 0;
}
/* ReStatCard 的标题自带 nowrap + ellipsis，但省略号只作用在插槽内容这一层，
   里面再嵌了行内 flex 就落不到文字上了 —— 文字这层要自己声明。 */
.kpi-title__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kpi-title__tip {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  cursor: help;
  color: var(--el-text-color-placeholder);
  transition: color 0.15s ease;
}
.kpi-title__tip:hover {
  color: var(--el-color-primary);
}

/* ============================================================
   筛选面板（对齐 UI 稿：独立白色圆角条）
   ============================================================ */
.as-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.as-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin: 16px 0;
}
.as-filter .filter { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; }
/* 筛选行右侧操作区：统一 ReButton square（图标 + tip），与视图切换同一行 */
.filter-ops {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
/* 「新增资产」按钮 + 右侧小箭头：共用同一个圆角块，箭头只是打开功能菜单的入口。
   不把整颗按钮都做成下拉 —— 新增是最高频动作，不该为了菜单多一次点击。
   position: relative 让功能菜单锚定在这一块上（.hc-more-menu--anchor）。 */
.filter-ops__add {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  overflow: visible;
  border-radius: var(--el-border-radius-base, 6px);
}
/* 按钮本身仍要保持圆角块外观；外层 overflow 放开是为了菜单不被裁掉 */
.filter-ops__add > .re-button__tip-wrap,
.filter-ops__add > button:first-child {
  overflow: hidden;
  border-radius: var(--el-border-radius-base, 6px) 0 0 var(--el-border-radius-base, 6px);
}
.filter-ops__add-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  padding: 0;
  margin-left: 1px;
  color: var(--el-color-white, #fff);
  cursor: pointer;
  background: var(--el-color-primary-dark-2, #337ecc);
  border: none;
  border-radius: 0 var(--el-border-radius-base, 6px) var(--el-border-radius-base, 6px) 0;
  transition: background 0.15s ease;
}
.filter-ops__add-more:hover {
  background: var(--el-color-primary-dark-3, #2a6aa8);
}
/* 视图切换（UI 稿：胶囊分段） */
.view-toggle {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  flex: none;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
}
.vt-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 14px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.vt-btn:hover { color: var(--el-text-color-primary); }
.vt-btn.active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  font-weight: 600;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px 28px;
  padding: 16px 8px 8px;
}
/* 上下布局：label 独占一行在上，控件在下 */
.form-vertical {
  :deep(.el-form-item) {
    display: block;
    width: 100%;
    margin-bottom: 14px;
  }
  :deep(.el-form-item__label) {
    display: block;
    height: auto;
    margin-bottom: 6px;
    line-height: 1.4;
    padding: 0;
    font-size: 13px;
    color: var(--text-secondary);
  }
  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
  :deep(.el-form-item__content > .re-input),
  :deep(.el-form-item__content > .el-input-number) {
    width: 100%;
  }
}
/* 分节标题：左侧品牌色竖条 + 留白 */
.form-section {
  position: relative;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 0 0 8px 12px;
  margin-top: 14px;
  border-bottom: 1px solid var(--border-subtle);
}
.form-section::before {
  content: "";
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 10px;
  width: 3px;
  border-radius: 2px;
  background: var(--brand-500, #6d5dfc);
}
.form-section:first-child {
  margin-top: 0;
}
.form-section.full {
  grid-column: 1 / -1;
}
.col-span-2 {
  grid-column: span 2;
}
.as-error {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--status-error-text);
  background: var(--status-error-bg);
  border: 1px solid var(--status-error-border);
  border-radius: var(--radius-sm);
}
.h-os { display: inline-flex; align-items: center; vertical-align: middle; color: var(--brand-500); font-size: 17px; }
.h-os :deep(svg) { display: block; }
.kpi-ico { position: absolute; top: 12px; right: 12px; opacity: 0.14; pointer-events: none; }
.st-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
.delay-live { font-family: var(--font-mono, monospace); font-size: 12px; color: var(--text-secondary, #8b90a0); }
.delay-live.bad { color: var(--danger, #f56c6c); font-weight: 600; }
.color-switch { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary,#8b90a0); }

/* ============================================================
   主机卡片（对齐 UI 稿：OS 图标 + 名称/地址 + 属性胶囊 + 指标条 + 操作）
   ============================================================ */
.host-card-grid {
  /* 吃掉上方定高区块之外的全部高度；min-height:0 是 flex 子项能被压到内容以下的前提 */
  flex: 1;
  min-height: 0;
  display: grid;
  /* 卡片收窄到 320px：一行放下更多主机。指标区左右两栏（条形 + 趋势）在 320px
     下仍能并排不挤压 —— 右侧可视列固定 124px，左侧条形至少留 140px。
     数值取自实测：350px 卡片下条形区曾只有 130px，进度条短到读不出差异。 */
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  /* 有卡片时按自然高度排布、不把卡片拉高（卡片高度由自身内容决定）；
     剩余空间宁可留在网格下方，也不要把每张主机卡撑成同一个死板的高度。 */
  align-content: start;
  /* 行高跟随内容最大高度：卡片（el-card 是 flex column + body overflow:auto）
     若行被压矮，指标条会在卡片内部出现滚动条；内容超出网格时宁可整页滚动。
     指标区不是定高的，卡片没有自己的高度上限，靠这条保证「指标完整显示」。 */
  grid-auto-rows: max-content;
  gap: 14px;
  padding: 0 0 8px;
}
/* 空态例外：网格里只有一张空态卡，让它吃满 —— 否则卡片只有一条内容高，
   底下又是一大片灰，比「没撑满」更显眼。 */
.host-card-grid--empty {
  align-content: stretch;
}
@media (max-width: 1100px) {
  .host-card-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
}
@media (max-width: 640px) {
  .host-card-grid { grid-template-columns: 1fr; }
}
/* el-card 自带页面级样式（koi 主题装饰、深色块背景、按钮点击态），
   这里显式复位成扁平容器，只保留边框/圆角/阴影三种视觉，
   与页面其余面板（ds-panel / ReCard）保持一致。 */
.host-card-grid :deep(.el-card) {
  margin: 0;
  padding: 0;
  overflow: hidden;
  /* 不再设 min-height：卡片高度完全由内容决定。
     设了固定下限后，窄卡片里指标区一旦换行就会顶到下限、body 被压出滚动条；
     现在高度跟着内容走，指标永远完整显示（页面整体滚动，而非卡片内滚动）。 */
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
/* 去掉 el-card 自带的头部底色和分隔线：卡片头部区域由 .hc-head 自己排版 */
.host-card-grid :deep(.el-card__header) {
  padding: 0;
  border-bottom: 0;
  background: transparent;
}
.host-card-grid :deep(.el-card__body) {
  padding: 10px 0;
  /* body 不设 overflow：卡片内部永不出现滚动条（滚动只发生在页面级） */
  overflow: visible;
}
/* footer 的 18px 上下内边距是纯留白：里面只有一个 28px 高的按钮行，
   叠加 .hc-actions 自己的 8px 后，底栏白白占掉 84px（实测）。收到 0，
   底部留白交给 .hc-actions 统一控制，底栏高度回落到按钮高度本身。 */
.host-card-grid :deep(.el-card__footer) {
  padding: 0;
  border-top: 0;
}
.host-card-grid :deep(.el-card:hover) {
  transform: translateY(-3px);
  box-shadow: var(--el-box-shadow, var(--shadow-2));
  border-color: var(--el-color-primary-light-7, var(--el-border-color));
}

/* 头部：OS 图标 + 名称/地址 + 状态 */
.hc-head { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px 8px; }
.hc-os {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: none;
  font-size: 26px;
  line-height: 1;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-light);
}
.hc-os :deep(svg) { display: block; }
.hc-os.is-windows { background: color-mix(in srgb, var(--metric-mem, #8b5cf6) 12%, var(--el-bg-color)); }
.hc-os.is-linux { background: color-mix(in srgb, var(--metric-disk, #f59e0b) 14%, var(--el-bg-color)); }
.hc-os.is-macos { background: color-mix(in srgb, var(--el-text-color-placeholder) 14%, var(--el-bg-color)); }

.hc-name-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.hc-title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
.hc-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hc-os-tag {
  flex: none;
  padding: 1px 8px;
  font-size: 11px;
  line-height: 18px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: var(--el-radius-full, 9999px);
}
.hc-online {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.hc-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--el-color-success); }
.hc-online.is-off .hc-dot { background: var(--el-color-danger); }
.hc-online.is-on .hc-dot { box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 18%, transparent); }
.hc-addr { font-size: 12.5px; color: var(--el-text-color-secondary); }
.hc-ip { font-size: 12px; color: var(--el-text-color-placeholder); }
.hc-ip-sep { margin: 0 4px; }

/* 关键属性胶囊 */
.hc-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 2px 16px 10px; }
.hc-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-extra-light, var(--el-fill-color-light));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
}
/* 350px 的卡片里，四个胶囊按原尺寸会折成「3+1」两行 —— 70px 只显示一行信息量。
   收紧内边距与字号后四个能并排：高度不变（仍是一行高），但省掉整行 32px。 */
@media (min-width: 641px) {
  .hc-chip {
    height: 24px;
    padding: 0 8px;
    gap: 4px;
    font-size: 11.5px;
  }
}
.hc-chip i { font-style: normal; color: var(--el-text-color-placeholder); }
.hc-chip b { font-weight: 600; color: var(--el-text-color-primary); }
.hc-chip b.bad { color: var(--el-color-danger); }

/* 实时指标区：左侧条形 + 右侧趋势可视化（对齐 UI 稿的粗条与大号数值） */
.hc-metrics {
  display: grid;
  /* 右列由 168px 收到 150px：卡片宽度降到 320px 后，仍保证左侧条形（标签+条+数值）
     有 130px 以上可画 —— 否则条形会被压成一条细线，指标等于看不出来。
     注意容器查询/断点只按视口宽度判，卡片宽度远小于视口时不会触发，
     所以这里的收缩必须靠固定列宽 + minmax(0,1fr) 配合完成，而不是靠媒体查询。 */
  grid-template-columns: minmax(0, 1fr) 150px;
  gap: 12px;
  align-items: stretch;
  padding: 0 16px 12px;
}
/* 卡片收窄到 350px 后，150px 的右列把左侧条形压到只剩 130px 出头，
   而右侧「趋势图 + 三个环」在 130px 里也挤成一团 —— 两边都不好读。
   这里换成更划算的分法：右列降到 124px（趋势图仍可读，环缩到 34px），
   省出的宽度全部给左侧进度条，CPU/内存/磁盘的差异才看得出来。 */
.host-card-grid :deep(.el-card) .hc-metrics {
  grid-template-columns: minmax(0, 1fr) 124px;
  gap: 10px;
}
.hc-metrics__bars { display: flex; flex-direction: column; gap: 10px; justify-content: center; min-width: 0; }
/* 无指标占位：高度对齐真实指标区（条形 3 行 + 趋势图 = 约 131px），
   这样同一行卡片的操作栏始终对齐，不会因为某台主机采不到数据而高低不齐。 */
.hc-metrics--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 131px;
}
.hc-metrics__placeholder {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--el-text-color-placeholder);
}
.hc-bar-row { display: flex; align-items: center; gap: 8px; }
.hc-bar-label {
  width: 34px;
  flex: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.hc-bar-progress { flex: 1; min-width: 0; }
.hc-bar-progress :deep(.el-progress-bar__outer) {
  background-color: var(--el-fill-color);
  border-radius: var(--el-radius-full, 9999px);
}
.hc-bar-progress :deep(.el-progress-bar__inner) {
  border-radius: var(--el-radius-full, 9999px);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.hc-bar-val {
  width: 46px;
  flex: none;
  text-align: right;
  font-size: 12.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

/* ── 卡片右侧可视化：CPU 迷你趋势 + 占用环 ──
   窄列只放「走势」和「现在多少」，不放坐标轴/图例，避免变成噪音。 */
.hc-metrics__viz {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding-left: 10px;
  border-left: 1px dashed var(--el-border-color-lighter);
}
.hc-viz-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}
.hc-viz-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
}
.hc-viz-delta {
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.hc-viz-delta.is-up { color: var(--el-color-danger); }
.hc-viz-delta.is-down { color: var(--el-color-success); }
.hc-viz-chart { width: 100%; flex: none; }
.hc-viz-rings {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding-top: 2px;
}
/* 占用环：conic-gradient 由 ringStyle() 内联写入，内部用实心圆挖空 */
.hc-ring {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: 50%;
  transition: background 0.5s ease;
}
/* 右列降到 124px 后，三个 40px 环 + 间距会溢出（40*3+12=132）。
   缩到 34px：环内数字仍能放下两位数 + 单位，且不换行。 */
.host-card-grid :deep(.el-card) .hc-ring {
  width: 34px;
  height: 34px;
}
.hc-ring::before {
  content: "";
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: var(--el-bg-color);
}
.hc-ring b,
.hc-ring i {
  position: relative;
  z-index: 1;
  font-style: normal;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}
.hc-ring b { font-size: 12px; font-weight: 700; color: var(--el-text-color-primary); }
.hc-ring i { font-size: 9px; color: var(--el-text-color-secondary); }
/* 34px 环的内高只有 26px，12px + 9px 两行会顶满并压到边。
   数字收到 11.5px、单位 8.5px，两行合计约 21px，留出呼吸空间。 */
.host-card-grid :deep(.el-card) .hc-ring b { font-size: 11.5px; }
.host-card-grid :deep(.el-card) .hc-ring i { font-size: 8.5px; }
@media (max-width: 520px) {
  .hc-metrics { grid-template-columns: 1fr; }
  .hc-metrics__viz {
    padding-left: 0;
    padding-top: 10px;
    border-left: 0;
    border-top: 1px dashed var(--el-border-color-lighter);
  }
}

/* 标签 / 端口 / 操作 */
.hc-tags { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 8px; }
.hc-ports { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 10px; }
/* 卡片底部：只剩两个主操作 + 「更多」图标，靠右对齐、单行不折。
   高度约 44px（原先四个文字按钮一行 61px，窄卡片里还会折成两行）。 */
.hc-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding: 8px 16px;
}
/* 底栏与指标区之间用一条 inset 分隔线（左右留白对齐正文），
   比贴边通栏的 border-top 更轻，也不会和大卡片边框形成两道平行线。
   padding 上收到 6px：上面已无 footer 内边距，再留 8px 会显得按钮悬空。 */
.host-card-grid :deep(.el-card__footer) .hc-actions {
  padding: 6px 16px;
  box-shadow: inset 0 1px 0 var(--el-border-color-lighter);
}
/* 「更多」与 ReButton square 同尺寸同底色的图标按钮 */
.hc-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-fill-color-light, #f3f4f6);
  border: 1px solid transparent;
  border-radius: var(--el-border-radius-base, 6px);
  transition: color 0.15s ease, background 0.15s ease;
}
.hc-more:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9, #ecf5ff);
}

/* 自管的操作菜单（卡片「更多」与顶部功能区共用）：视觉对齐 el-dropdown-menu */
.hc-more-menu {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}
/* 锚定到触发按钮右下方：绝对定位在定位祖先上，不依赖 popper。
   宽度用固定值而非 max-content —— 后者会被较长的菜单文字（如「关闭实时监控」）撑宽，
   导致 right:0 也贴不住按钮右缘。 */
.hc-more-menu--anchor {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 3000;
  width: 168px;
  box-sizing: border-box;
  background: var(--el-bg-color-overlay, var(--el-bg-color));
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base, 6px);
  box-shadow: var(--el-box-shadow-light, 0 6px 16px rgba(0, 0, 0, 0.08));
}
.hc-more-wrap {
  position: relative;
  display: inline-flex;
}
.hc-menu-fade-enter-active,
.hc-menu-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.hc-menu-fade-enter-from,
.hc-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.hc-more-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 12px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--el-text-color-regular);
  text-align: left;
  cursor: pointer;
  background: none;
  border: none;
  transition: color 0.15s ease, background 0.15s ease;
}
.hc-more-item:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light, #f3f4f6);
}
.hc-more-item.is-danger { color: var(--el-color-danger, #f56c6c); }
.hc-more-item.is-danger:hover { background: var(--el-color-danger-light-9, #fef0f0); }
.hc-more-sep {
  height: 1px;
  margin: 4px 0;
  background: var(--el-border-color-lighter);
}
/* 空态卡：与主机卡片同规格（独立 el-card + 扁平容器），
   占满 grid 整行，不让 ElEmpty 裸奔在网格里 */
.hc-empty-card {
  grid-column: 1 / -1;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.hc-empty-card :deep(.el-card__body) {
  /* 空态卡被网格拉到满高，body 居中让 ElEmpty 落在视觉中心，
     而不是顶部 —— 满高卡片里内容顶在上面的观感更像是「没加载完」。 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}/* 表格操作列：主操作 + 更多下拉，按钮固定窄列内不折行 */
.op-cell { display: flex; align-items: center; gap: 2px; white-space: nowrap; }
</style>

<style lang="scss">
/* 端口弹层（teleport 到 body，需全局样式） */
.ports-popover.el-popover {
  padding: 8px;
}
.ports-pop-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 260px;
  overflow-y: auto;
}
.ports-pop-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-regular, #4b5563);
  padding: 3px 8px;
  border-radius: 4px;
}
.ports-pop-item:hover {
  background: var(--el-fill-color-light, #f3f4f6);
}
/* 端口开放情况：浅灰底圆角块 + 圆点 + 同色大写半粗文字（图片 1 的标记样式） */
.port-status {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 1px 8px; border-radius: 999px;
  background: var(--el-fill-color-light, #f3f4f6);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  font-size: 11px; font-weight: 600; letter-spacing: 0.4px;
  line-height: 1.5;
  font-family: var(--font-mono, monospace);
  flex-shrink: 0;
}
.ps-dot {
  width: 8px; height: 8px; border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.4);
}
.ps-open { color: var(--el-color-success, #67c23a); }
.ps-open .ps-dot { background: var(--el-color-success, #67c23a); box-shadow: 0 0 0 1.5px rgba(103, 194, 58, 0.45); }
.ps-closed { color: var(--el-color-danger, #f56c6c); }
.ps-closed .ps-dot { background: var(--el-color-danger, #f56c6c); box-shadow: 0 0 0 1.5px rgba(245, 108, 108, 0.45); }

/* 主机右键上下文菜单（teleport 到 body） */
.host-ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2990;
  background: transparent;
}
.host-ctx-menu {
  position: fixed;
  z-index: 2991;
  min-width: 176px;
  padding: 5px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter, #e6e8eb);
  border-radius: var(--el-border-radius-base, 8px);
  box-shadow: var(--el-box-shadow-light, 0 8px 24px rgba(15, 23, 42, 0.12));
}
.host-ctx-item {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 32px;
  padding: 0 9px;
  font-size: 13px;
  color: var(--el-text-color-regular, #4b5563);
  border-radius: var(--el-border-radius-small, 6px);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s ease, color 0.12s ease;
}
.host-ctx-item .re-icon,
.host-ctx-item svg {
  font-size: 15px;
  flex-shrink: 0;
}
.host-ctx-item:hover {
  background: var(--el-fill-color-light, #f3f4f6);
  color: var(--el-color-primary, #409eff);
}
.host-ctx-item.is-danger {
  color: var(--el-color-danger, #f56c6c);
}
.host-ctx-item.is-danger:hover {
  background: var(--el-color-danger-light-9, #fef0f0);
  color: var(--el-color-danger, #f56c6c);
}
.host-ctx-sep {
  height: 1px;
  margin: 5px 7px;
  background: var(--el-border-color-lighter, #eceef1);
}
</style>

<script setup lang="ts">
/**
 * 主机画像 —— master-detail 布局（数据全部来自目标机 Agent）
 * 左侧：主机列表（OS 图标 + 名称 + 地址 + 在线状态），点选切换
 * 右侧：概览条 + 资源仪表 + 分段区（概览 / 监听端口 / 进程 / 服务 / 磁盘 / 网络 / 环境变量）
 *
 * 约定：
 *  - 每一项远端数据都经 /ms/server/host/profile/** 由后端转发到主机上的 Agent，页面不再自己走 SSH/WinRM；
 *  - Agent 不可达时必须把原因显式呈现在页面上，不能留一片空白让人以为「这台机器没数据」。
 * @author CH
 * @since 4.0.0
 */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { fetchHostProfile, fetchHostProfileSection } from "../monitorApi";
import { osIconSvg } from "../utils/osIcon";
import type { Host, Group } from "./AssetsView.vue";

interface Props {
  hosts: Host[];
  groups: Group[];
  /** 实时延迟（hostId → delayMs） */
  liveDelay?: Record<number, number>;
  /** 实时在线（hostId → 1/0） */
  liveOnline?: Record<number, number>;
  /** 打开画像时预选主机 */
  initialHostId?: number | null;
  /** 打开画像时预选分区 */
  initialTab?: string | null;
  /** 父组件每打开一次画像自增，保证重复打开同一台主机也会重新定位刷新 */
  openSeq?: number;
}
const props = withDefaults(defineProps<Props>(), {
  liveDelay: () => ({}),
  liveOnline: () => ({}),
  initialHostId: null,
  initialTab: null,
  openSeq: 0,
});

const emit = defineEmits<{
  (e: "connect", host: Host): void;
  (e: "edit", host: Host): void;
  (e: "detail", host: Host): void;
  (e: "deploy-agent", host: Host): void;
  (e: "refreshed"): void;
}>();

/** 画像分区 */
type SectionKey = "overview" | "ports" | "processes" | "services" | "disks" | "network" | "env";

/** 分区定义（概览走 /info+/metrics，其余走对应 agent 端点） */
const sections: Array<{ name: SectionKey; label: string }> = [
  { name: "overview", label: "概览" },
  { name: "ports", label: "监听端口" },
  { name: "processes", label: "进程" },
  { name: "services", label: "服务" },
  { name: "disks", label: "磁盘" },
  { name: "network", label: "网络" },
  { name: "env", label: "环境变量" },
];

/** 各分区的列定义 */
const COLUMNS: Record<SectionKey, Array<{ key: string; label: string; width?: string }>> = {
  overview: [],
  ports: [
    { key: "proto", label: "协议", width: "72px" },
    { key: "local", label: "监听地址", width: "170px" },
    { key: "port", label: "端口", width: "88px" },
    { key: "state", label: "状态", width: "120px" },
    { key: "pid", label: "PID", width: "88px" },
    { key: "pidName", label: "进程" },
  ],
  processes: [
    { key: "pid", label: "PID", width: "88px" },
    { key: "name", label: "进程名", width: "220px" },
    { key: "cpu", label: "CPU%", width: "88px" },
    { key: "mem", label: "MEM%", width: "88px" },
    { key: "rss", label: "RSS(KB)", width: "110px" },
    { key: "args", label: "命令行" },
  ],
  services: [
    { key: "name", label: "服务名", width: "280px" },
    { key: "status", label: "状态", width: "140px" },
    { key: "pid", label: "PID", width: "100px" },
  ],
  disks: [
    { key: "mount", label: "挂载点", width: "170px" },
    { key: "name", label: "名称", width: "200px" },
    { key: "size", label: "容量", width: "110px" },
    { key: "used", label: "已用", width: "110px" },
    { key: "avail", label: "可用", width: "110px" },
    { key: "use%", label: "使用率", width: "96px" },
  ],
  network: [
    { key: "ifname", label: "网卡", width: "150px" },
    { key: "mac", label: "MAC", width: "170px" },
    { key: "ipv4", label: "IPv4" },
    { key: "ipv6", label: "IPv6" },
    { key: "mtu", label: "MTU", width: "90px" },
  ],
  env: [
    { key: "name", label: "变量", width: "260px" },
    { key: "value", label: "值" },
  ],
};

/** 自动刷新周期（毫秒） */
const AUTO_REFRESH_MILLIS = 10000;

/** 左侧选中的主机 id */
const selectedId = ref<number | null>(null);
/** 左侧搜索关键词 */
const search = ref("");
/** 当前分区 */
const active = ref<SectionKey>("overview");
/** 分页（仅进程/服务生效） */
const page = ref(1);
const pageSize = ref(50);

const info = ref<Record<string, any>>({});
const metrics = ref<Record<string, any>>({});
const snapshot = ref<Record<string, any>>({});
const agentPort = ref(0);
const osMismatch = ref("");
const rows = ref<Record<string, any>[]>([]);

const loadingProfile = ref(false);
const loadingSection = ref(false);
const profileError = ref("");
const sectionError = ref("");
const autoRefresh = ref(true);
let timer: number | undefined;

const selectedHost = computed(() => props.hosts.find(h => h.id === selectedId.value) ?? null);
const agentReady = computed(() => Object.keys(info.value).length > 0);
const agentVersion = computed(() => String(info.value.agentVersion || snapshot.value.serverHostAgentVersion || ""));
const columns = computed(() => COLUMNS[active.value] ?? []);

const visibleHosts = computed(() => {
  const kw = search.value.toLowerCase();
  if (!kw) return props.hosts;
  return props.hosts.filter(h =>
    h.serverHostName.toLowerCase().includes(kw) || h.serverHostAddress.toLowerCase().includes(kw));
});

/* ================== 选择与切换 ================== */

function selectHost(id: number): void {
  if (selectedId.value === id) return;
  selectedId.value = id;
  rows.value = [];
  sectionError.value = "";
  page.value = 1;
  loadProfile(true);
  if (active.value !== "overview") loadSection();
}

function pickSection(name: SectionKey): void {
  active.value = name;
  page.value = 1;
  if (name !== "overview") loadSection();
}

watch(visibleHosts, (list) => {
  if (list.length && !list.some(h => h.id === selectedId.value)) {
    selectHost(list[0].id);
  }
}, { immediate: true });

watch([() => props.openSeq, () => props.initialHostId], () => focusRequested());

/** 父组件请求定位到某台主机（重复打开同一台也要重新拉数据） */
function focusRequested(): void {
  const id = props.initialHostId;
  if (id == null || !props.hosts.some(h => h.id === id)) return;
  const target = mapTab(props.initialTab) ?? "overview";
  selectedId.value = id;
  active.value = target;
  page.value = 1;
  rows.value = [];
  sectionError.value = "";
  loadProfile();
  if (target !== "overview") loadSection();
  if (autoRefresh.value && !timer) restartTimer();
}

/** 兼容旧入口传来的分区名（原「系统管理」那套 key） */
function mapTab(tab?: string | null): SectionKey | null {
  if (!tab) return null;
  const key = tab.trim().toLowerCase();
  if (key.startsWith("network-interface") || key.startsWith("network-connection")) return "network";
  if (key === "partition") return "disks";
  if (key === "system-service") return "services";
  if (key === "online" || key === "delay" || key === "metric" || key === "firewall" || key === "driver") return "overview";
  return sections.some(s => s.name === key) ? (key as SectionKey) : "overview";
}

/* ================== 数据加载 ================== */

/**
 * 拉取概览与实时指标。
 *
 * @param manual 是否用户主动刷新（只有主动刷新才回通知父组件重载列表，避免自动刷新把整表反复拉下来）
 */
async function loadProfile(manual = false): Promise<void> {
  const host = selectedHost.value;
  if (!host) return;
  loadingProfile.value = true;
  profileError.value = "";
  try {
    const data = await fetchHostProfile(host.id, true);
    info.value = data?.info ?? {};
    metrics.value = data?.metrics ?? {};
    snapshot.value = data?.host ?? {};
    agentPort.value = Number(data?.port) || 0;
    osMismatch.value = data?.osMismatch ?? "";
    if (manual) emit("refreshed");
  } catch (e) {
    profileError.value = String((e as Error)?.message ?? e);
    info.value = {};
    metrics.value = {};
  } finally {
    loadingProfile.value = false;
  }
}

async function loadSection(): Promise<void> {
  const host = selectedHost.value;
  if (!host || active.value === "overview") return;
  loadingSection.value = true;
  sectionError.value = "";
  try {
    const paged = active.value === "processes" || active.value === "services";
    rows.value = await fetchHostProfileSection(host.id, active.value, paged ? page.value : undefined, paged ? pageSize.value : undefined);
  } catch (e) {
    rows.value = [];
    sectionError.value = String((e as Error)?.message ?? e);
  } finally {
    loadingSection.value = false;
  }
}

function changePage(delta: number): void {
  const next = page.value + delta;
  if (next < 1) return;
  page.value = next;
  loadSection();
}

/* ================== 自动刷新 ================== */

function restartTimer(): void {
  if (timer) {
    window.clearInterval(timer);
    timer = undefined;
  }
  if (!autoRefresh.value) return;
  timer = window.setInterval(() => {
    if (!selectedHost.value || document.hidden) return;
    loadProfile();
    if (active.value !== "overview") loadSection();
  }, AUTO_REFRESH_MILLIS);
}
watch(autoRefresh, restartTimer);
watch(selectedId, () => { if (autoRefresh.value && !timer) restartTimer(); });
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});

/* ================== 展示辅助 ================== */

function onlineState(h: Host): number {
  return props.liveOnline[h.id] ?? h.serverHostOnline;
}
function delayOf(h: Host): number | null {
  const v = props.liveDelay[h.id];
  if (v != null) return v;
  return h.serverHostDelayMs ?? null;
}
function delayText(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 0) return "不可达";
  return ms + " ms";
}
function delayBad(ms: number | null): boolean {
  return ms != null && (ms < 0 || ms > 200);
}
function protocolOf(h: Host): string {
  const configured = (h.serverHostRemoteProtocol ?? "").toUpperCase();
  if (configured === "SSH" || configured === "RDP" || configured === "VNC") return configured.toLowerCase();
  const s = (h.serverHostOsType ?? "").toUpperCase();
  if (s.includes("WIN")) return "rdp";
  if (s.includes("MAC")) return "vnc";
  return "ssh";
}
function groupName(id?: number | null): string {
  if (!id) return "未分组";
  return props.groups.find(g => g.id === id)?.msServerGroupName ?? "组#" + id;
}
function show(v: unknown, fallback = "—"): string {
  if (v === null || v === undefined) return fallback;
  const text = String(v).trim();
  return text === "" ? fallback : text;
}
function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}
function fmtNum(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) ? String(Math.round(n * 10) / 10) : "—";
}
function humanUptime(sec: number): string {
  if (!sec || sec <= 0) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} 天 ${h} 小时`;
  if (h > 0) return `${h} 小时 ${m} 分`;
  return `${m} 分`;
}

const uptimeText = computed(() => humanUptime(Number(metrics.value.uptimeSec ?? info.value.uptimeSec ?? 0)));

interface Gauge { label: string; percent: number; detail: string; bad: boolean; }
const gauges = computed<Gauge[]>(() => {
  const m = metrics.value;
  const cpu = num(m.cpuPercent);
  const memPct = num(m.memoryPercent);
  const diskPct = num(m.diskPercent);
  return [
    { label: "CPU", percent: cpu, detail: `${m.processCount ?? "—"} 进程 · ${m.threadCount ?? "—"} 线程`, bad: cpu >= 85 },
    { label: "内存", percent: memPct, detail: `${fmtNum(m.memoryUsedMb)} / ${fmtNum(m.memoryTotalMb)} MB`, bad: memPct >= 90 },
    { label: "磁盘", percent: diskPct, detail: `${fmtNum(m.diskUsedGb)} / ${fmtNum(m.diskTotalGb)} GB`, bad: diskPct >= 90 },
  ];
});

const overviewRows = computed<Array<{ label: string; value: string; mono?: boolean }>>(() => {
  const i = info.value;
  const h = selectedHost.value;
  const row: any = snapshot.value || {};
  return [
    { label: "主机名", value: show(i.hostname) },
    { label: "操作系统", value: `${show(i.os, h?.serverHostOsType ?? "—")} ${show(i.osVersion, "")}`.trim() },
    { label: "架构", value: show(i.arch) },
    { label: "CPU 核数", value: show(i.cpuCores) },
    { label: "内存", value: i.memoryMb ? `${fmtNum(i.memoryMb)} MB` : "—" },
    { label: "磁盘总量", value: i.diskTotalGb ? `${fmtNum(i.diskTotalGb)} GB` : "—" },
    { label: "内网 IP", value: show(i.privateIp), mono: true },
    { label: "公网 IP", value: show(i.publicIp), mono: true },
    { label: "网卡 MAC", value: show(i.mac), mono: true },
    { label: "运行时长", value: uptimeText.value },
    { label: "Java 版本", value: show(i.javaVersion) },
    { label: "Agent 版本", value: show(agentVersion.value) },
    { label: "Agent 端口", value: show(agentPort.value || i.agentPort) },
    { label: "Agent PID", value: show(i.pid) },
    { label: "主机编码", value: show(h?.serverHostCode), mono: true },
    { label: "分组", value: groupName(h?.msServerGroupId) },
    { label: "最后采集", value: show(row.serverHostAgentTime || row.serverHostLastCollectTime) },
    { label: "备注", value: show(h?.serverHostDescription) },
  ];
});
</script>

<template>
  <div class="profile">
    <!-- 左侧：主机列表 -->
    <aside class="profile-rail">
      <div class="rail-head">
        <span class="rail-title">主机画像</span>
        <span class="rail-count">{{ hosts.length }}</span>
      </div>
      <ReInput v-model="search" placeholder="搜索名称 / IP" clearable size="small" class="rail-search" />
      <ReScrollbar class="rail-list">
        <div
          v-for="h in visibleHosts"
          :key="h.id"
          :class="['rail-item', { active: selectedId === h.id }]"
          @click="selectHost(h.id)"
        >
          <span class="ri-os"><span v-html="osIconSvg(h.serverHostOsType)"></span></span>
          <div class="ri-meta">
            <b class="ri-name">{{ h.serverHostName }}</b>
            <span class="ri-addr mono">{{ h.serverHostAddress }}</span>
          </div>
          <ReStatusIndicator :type="onlineState(h) === 1 ? 'success' : 'danger'" />
        </div>
        <div v-if="visibleHosts.length === 0" class="rail-empty">无匹配主机</div>
      </ReScrollbar>
    </aside>

    <!-- 右侧：画像详情 -->
    <section class="profile-detail">
      <div v-if="!selectedHost" class="detail-empty">
        <ReEmpty description="从左侧选择一台主机查看画像" />
      </div>
      <template v-else>
        <div class="profile-head">
          <span class="ph-os"><span v-html="osIconSvg(selectedHost.serverHostOsType)"></span></span>
          <div class="ph-name-wrap">
            <b class="ph-name">{{ selectedHost.serverHostName }}</b>
            <span class="ph-addr mono">
              {{ selectedHost.serverHostAddress }}:{{ selectedHost.serverHostPort }} ·
              {{ protocolOf(selectedHost).toUpperCase() }} · Agent :{{ agentPort || '—' }}
            </span>
          </div>
          <div class="ph-pills">
            <span :class="['pill', onlineState(selectedHost) === 1 ? 'pill-ok' : 'pill-bad']">
              {{ onlineState(selectedHost) === 1 ? '在线' : '离线' }}
            </span>
            <span :class="['pill', delayBad(delayOf(selectedHost)) ? 'pill-warn' : 'pill-mute']">
              {{ delayText(delayOf(selectedHost)) }}
            </span>
            <span v-if="agentReady" class="pill pill-agent">Agent v{{ agentVersion || '?' }}</span>
            <span v-else class="pill pill-bad">Agent 未就绪</span>
          </div>
          <div class="ph-actions">
            <ReButton icon="Refresh" layout="square" size="small" type="primary" :loading="loadingProfile"
              @click="loadProfile(true)">刷新主机</ReButton>
            <ReButton v-if="!agentReady" icon="Download" layout="square" size="small" type="success"
              @click="emit('deploy-agent', selectedHost)">安装 Agent</ReButton>
            <ReButton icon="Connection" layout="square" size="small" @click="emit('connect', selectedHost)">连接</ReButton>
            <ReButton icon="TrendCharts" layout="square" size="small" @click="emit('detail', selectedHost)">监控详情</ReButton>
            <ReButton icon="EditPen" layout="square" size="small" @click="emit('edit', selectedHost)">编辑</ReButton>
            <label class="auto-switch">
              <ReSwitch v-model="autoRefresh" />
              <span>10s 自动刷新</span>
            </label>
          </div>
        </div>

        <div v-if="profileError" class="alert alert-error">
          <b>读取 Agent 失败：</b>{{ profileError }}
          <div class="dim">
            画像各分区都依赖 Agent。主机台账记录的最近错误：{{ show(snapshot.serverHostAgentError, '无') }}；
            未安装时可点右上「安装 Agent」。
          </div>
        </div>
        <div v-else-if="osMismatch" class="alert alert-warn">{{ osMismatch }}</div>

        <!-- 资源仪表 -->
        <div class="gauges">
          <div v-for="g in gauges" :key="g.label" class="gauge">
            <div class="gauge-top">
              <span class="gauge-label">{{ g.label }}</span>
              <span :class="['gauge-val', { bad: g.bad }]">{{ g.percent }}%</span>
            </div>
            <div class="gauge-bar"><i :class="{ bad: g.bad }" :style="{ width: Math.min(100, g.percent) + '%' }" /></div>
            <div class="gauge-sub mono">{{ agentReady ? g.detail : '等待 Agent 数据' }}</div>
          </div>
          <div class="gauge gauge-facts">
            <div class="fact"><span>核数</span><b class="mono">{{ show(info.cpuCores) }}</b></div>
            <div class="fact"><span>内存</span><b class="mono">{{ info.memoryMb ? fmtNum(info.memoryMb) + ' MB' : '—' }}</b></div>
            <div class="fact"><span>运行</span><b class="mono">{{ uptimeText }}</b></div>
            <div class="fact"><span>采集</span><b class="mono dim">{{ show(metrics.collectTime) }}</b></div>
          </div>
        </div>

        <!-- 分段切换 -->
        <div class="seg">
          <button
            v-for="s in sections"
            :key="s.name"
            :class="['seg-item', { active: active === s.name }]"
            @click="pickSection(s.name)"
          >{{ s.label }}</button>
        </div>

        <div class="seg-body">
          <div v-if="active === 'overview'" class="tab-grid">
            <div v-for="row in overviewRows" :key="row.label" class="tab-item">
              <span class="tab-label">{{ row.label }}</span>
              <span :class="['tab-value', { mono: row.mono, dim: row.value === '—' }]">{{ row.value }}</span>
            </div>
          </div>

          <template v-else>
            <div class="sec-bar">
              <span class="dim">共 {{ rows.length }} 条{{ page > 1 ? `（第 ${page} 页）` : '' }}</span>
              <div class="sec-pager">
                <ReButton size="small" :disabled="page <= 1 || loadingSection" @click="changePage(-1)">上一页</ReButton>
                <span class="mono page-no">{{ page }}</span>
                <ReButton size="small" :disabled="loadingSection || rows.length < pageSize" @click="changePage(1)">下一页</ReButton>
                <ReButton size="small" type="primary" :loading="loadingSection" @click="loadSection">刷新</ReButton>
              </div>
            </div>
            <div v-if="sectionError" class="alert alert-error">{{ sectionError }}</div>
            <div v-else-if="loadingSection && !rows.length" class="dim sec-loading">正在从 Agent 拉取…</div>
            <div v-else-if="!rows.length" class="dim sec-loading">该分区无数据</div>
            <div v-else class="tbl-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th v-for="col in columns" :key="col.key" :style="col.width ? { width: col.width } : {}">{{ col.label }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, idx) in rows" :key="idx">
                    <td v-for="col in columns" :key="col.key">{{ show(r[col.key], '') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped lang="scss">
.profile { display: flex; height: 100%; min-height: 0; }
/* 左侧列表 */
.profile-rail {
  width: 300px; flex-shrink: 0; display: flex; flex-direction: column;
  border-right: 1px solid var(--border-subtle); background: var(--bg-container);
}
.rail-head { display: flex; align-items: center; gap: 8px; padding: 14px 14px 8px; }
.rail-title { font-size: 15px; font-weight: 600; }
.rail-count {
  font-size: 11px; color: var(--brand-600, #6d5ce7); background: var(--brand-50, #f3f1ff);
  border: 1px solid var(--brand-200, #d5ccff); border-radius: 999px; padding: 0 7px; line-height: 18px;
}
.rail-search { padding: 0 14px 8px; }
.rail-list { flex: 1; min-height: 0; padding: 0 10px; }
.rail-item {
  display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; cursor: pointer;
  border: 1px solid transparent; transition: all .15s;
  &:hover { background: var(--brand-50, #f3f1ff); }
  &.active { background: var(--brand-100, #e8e4ff); border-color: var(--brand-200, #d5ccff); }
}
.ri-os {
  display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px;
  font-size: 18px; color: var(--brand-500); background: var(--bg-fill, #f5f6fa); flex-shrink: 0;
}
.ri-os :deep(svg) { display: block; }
.ri-meta { flex: 1; min-width: 0; }
.ri-name { display: block; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ri-addr { font-size: 11px; color: var(--text-tertiary, #a0a4b0); }
.rail-empty { text-align: center; padding: 30px; color: var(--text-tertiary); font-size: 13px; }

/* 右侧 */
.profile-detail { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow-y: auto; padding: 16px 20px; }
.detail-empty { height: 100%; display: flex; align-items: center; justify-content: center; }
.profile-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding-bottom: 14px; border-bottom: 1px solid var(--border-subtle); }
.ph-os {
  display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 12px;
  font-size: 24px; color: var(--brand-500); background: var(--bg-fill, #f5f6fa); flex-shrink: 0;
}
.ph-os :deep(svg) { display: block; }
.ph-name-wrap { flex: 1; min-width: 220px; }
.ph-name { display: block; font-size: 17px; font-weight: 700; }
.ph-addr { font-size: 12px; color: var(--text-tertiary, #a0a4b0); margin-top: 3px; }
.ph-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.pill {
  font-size: 12px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--border-subtle);
  background: var(--bg-fill, #f5f6fa); white-space: nowrap;
}
.pill-ok { color: var(--status-success-text, #34c759); border-color: rgba(52, 199, 89, .35); }
.pill-bad { color: var(--status-error-text, #f56c6c); border-color: rgba(245, 108, 108, .35); }
.pill-warn { color: var(--status-warning-text, #e6a23c); border-color: rgba(230, 162, 60, .35); }
.pill-mute { color: var(--text-tertiary, #a0a4b0); }
.pill-agent { color: var(--brand-600, #6d5ce7); border-color: var(--brand-200, #d5ccff); background: var(--brand-50, #f3f1ff); }
.ph-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.auto-switch { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-tertiary); margin-left: 4px; }

.alert { margin: 12px 0 0; padding: 10px 12px; border-radius: 8px; font-size: 12.5px; line-height: 1.7; }
.alert-error { background: rgba(245, 108, 108, .1); border: 1px solid rgba(245, 108, 108, .3); color: var(--status-error-text, #d9484b); }
.alert-warn { background: rgba(230, 162, 60, .1); border: 1px solid rgba(230, 162, 60, .3); color: var(--status-warning-text, #b8741a); }

.gauges { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin: 14px 0 4px; }
.gauge { padding: 12px 14px; border: 1px solid var(--border-subtle); border-radius: 10px; background: var(--bg-fill, #f8f9fc); }
.gauge-top { display: flex; align-items: baseline; justify-content: space-between; }
.gauge-label { font-size: 11px; letter-spacing: .4px; text-transform: uppercase; color: var(--text-tertiary); }
.gauge-val { font-size: 18px; font-weight: 600; &.bad { color: var(--danger, #f56c6c); } }
.gauge-bar {
  height: 6px; border-radius: 999px; background: var(--border-subtle); overflow: hidden; margin: 8px 0 6px;
  i { display: block; height: 100%; background: var(--brand-500, #6d5ce7); transition: width .3s; &.bad { background: var(--danger, #f56c6c); } }
}
.gauge-sub { font-size: 11px; color: var(--text-tertiary); }
.gauge-facts { display: flex; flex-direction: column; gap: 6px; justify-content: center; }
.fact { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; font-size: 12px; color: var(--text-tertiary); }
.fact b { font-size: 13px; color: var(--text-primary); font-weight: 600; }

.seg { display: flex; gap: 4px; flex-wrap: wrap; margin: 16px 0 0; padding: 4px; border-radius: 10px; background: var(--bg-fill, #f5f6fa); }
.seg-item {
  border: 0; background: transparent; color: var(--text-secondary, #5c6070); font-size: 13px; padding: 6px 14px;
  border-radius: 8px; cursor: pointer; transition: all .15s;
  &:hover { color: var(--brand-600, #6d5ce7); }
  &.active { background: var(--bg-container, #fff); color: var(--brand-600, #6d5ce7); font-weight: 600; box-shadow: 0 1px 4px rgba(20, 20, 40, .08); }
}
.seg-body { padding: 6px 0 20px; }
.tab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px 24px; padding: 14px 0; }
.tab-item { display: flex; flex-direction: column; gap: 4px; }
.tab-label { font-size: 12px; color: var(--text-tertiary, #a0a4b0); }
.tab-value { font-size: 14px; word-break: break-all; }
.tab-value.mono { font-family: var(--font-mono, monospace); }
.tab-value.dim { color: var(--text-tertiary); }

.sec-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 12px 0 10px; }
.sec-pager { display: flex; align-items: center; gap: 6px; }
.page-no { font-size: 12px; color: var(--text-tertiary); min-width: 22px; text-align: center; }
.sec-loading { padding: 24px; text-align: center; font-size: 13px; }
.tbl-wrap { overflow: auto; border: 1px solid var(--border-subtle); border-radius: 10px; max-height: calc(100vh - 420px); }
.tbl { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.tbl th, .tbl td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border-subtle); white-space: nowrap; }
.tbl td { white-space: pre-wrap; word-break: break-all; font-family: var(--font-mono, monospace); }
.tbl th { position: sticky; top: 0; background: var(--bg-fill, #f8f9fc); font-weight: 600; color: var(--text-tertiary); z-index: 1; }
.tbl tbody tr:hover td { background: var(--brand-50, #f3f1ff); }
.mono { font-family: var(--font-mono, monospace); }
.dim { color: var(--text-tertiary, #a0a4b0); }
</style>

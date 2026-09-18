<script setup lang="ts">
/**
 * 主机画像 —— master-detail 布局
 * 左侧：主机列表（OS 图标 + 名称 + 地址 + 在线状态），点选切换
 * 右侧：ReTab 分区（概览 / 实时指标 / 端口 / 采集配置 / 远控），展示选中主机详情
 * @author CH
 * @since 4.0.0
 */
import { computed, ref, watch } from "vue";
import { useSocketService } from "@repo/core";
import type { Host, Group } from "../AssetsView.vue";

interface Props {
  hosts: Host[];
  groups: Group[];
  /** 实时延迟（hostId → delayMs） */
  liveDelay?: Record<number, number>;
  /** 实时在线（hostId → 1/0） */
  liveOnline?: Record<number, number>;
}
const props = withDefaults(defineProps<Props>(), {
  liveDelay: () => ({}),
  liveOnline: () => ({}),
});

const emit = defineEmits<{
  (e: "connect", host: Host): void;
  (e: "edit", host: Host): void;
  (e: "detail", host: Host): void;
  (e: "scan-ports", host: Host): void;
}>();

/** 左侧选中的主机 id */
const selectedId = ref<number | null>(null);
/** 左侧搜索关键词 */
const search = ref("");

/** 当前选中主机 */
const selectedHost = computed(() =>
  props.hosts.find(h => h.id === selectedId.value) ?? null,
);

/** 左侧过滤后的主机列表 */
const visibleHosts = computed(() => {
  const kw = search.value.toLowerCase();
  if (!kw) return props.hosts;
  return props.hosts.filter(h =>
    h.serverHostName.toLowerCase().includes(kw) || h.serverHostAddress.toLowerCase().includes(kw));
});

/** 首次打开默认选中第一台 */
watch(visibleHosts, (list) => {
  if (list.length && !selectedHost.value) {
    selectedId.value = list[0].id;
  }
}, { immediate: true });

function selectHost(id: number): void {
  selectedId.value = id;
}

/** 在线状态（socket 优先） */
function onlineState(h: Host): number {
  return props.liveOnline[h.id] ?? h.serverHostOnline;
}
/** 延迟（socket 优先） */
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

/** OS 图标（复用 AssetsView 的 osIcon/osSvg/osImgSrc 逻辑——这里内联精简版） */
function osKey(t?: string): string {
  const s = (t ?? "").toUpperCase();
  if (s.includes("ANDROID")) return "android";
  if (s.includes("WIN")) return "windows";
  if (s.includes("LINUX")) return "linux";
  if (s.includes("MAC") || s.includes("DARWIN")) return "macos";
  return "terminal";
}
function osImgSrc(os: string): string {
  const map: Record<string, string> = { linux: "os-linux", windows: "os-windows", macos: "os-macos", android: "os-android" };
  const name = map[os];
  return name ? `${import.meta.env.BASE_URL}os/${name}.svg` : "";
}
function protocolOf(h: Host): string {
  const s = (h.serverHostOsType ?? "").toUpperCase();
  if (s.includes("WIN")) return "rdp";
  if (s.includes("MAC")) return "vnc";
  return "ssh";
}
function collectModeLabel(m?: string | null): string {
  const map: Record<string, string> = { SCHEDULED: "定时采集", AGENT: "Agent采集", HTTP: "HTTP采集", PROMETHEUS: "Prometheus采集" };
  return map[m ?? ""] ?? m ?? "—";
}
function groupName(id?: number | null): string {
  if (!id) return "未分组";
  return props.groups.find(g => g.id === id)?.msServerGroupName ?? "组#" + id;
}
function splitTags(tags?: string | null): string[] {
  if (!tags || !tags.trim()) return [];
  return tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
}
interface PortItem { port: string; protocol?: string; service?: string; }
function parsePorts(raw?: string | null): PortItem[] {
  if (!raw) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a : []; } catch { return []; }
}
function portText(p: PortItem): string {
  const parts = [`${p.port}${p.protocol ? "/" + p.protocol : ""}`];
  if (p.service) parts.push(p.service);
  return parts.join(" ");
}

/** ReTab 配置 */
const tabs = [
  { name: "overview", label: "概览", icon: "Monitor" },
  { name: "metrics", label: "实时指标", icon: "DataLine" },
  { name: "ports", label: "端口", icon: "Connection" },
  { name: "collect", label: "采集配置", icon: "Timer" },
  { name: "remote", label: "远控", icon: "VideoCamera" },
];

/** 基本信息行 */
interface InfoRow { label: string; value: string; mono?: boolean; }
const overviewRows = computed<InfoRow[]>(() => {
  const h = selectedHost.value;
  if (!h) return [];
  return [
    { label: "主机编码", value: h.serverHostCode || "—", mono: true },
    { label: "操作系统", value: h.serverHostOsType || "—" },
    { label: "架构", value: h.serverHostOsArch || "—" },
    { label: "系统版本", value: h.serverHostOsVersion || "—" },
    { label: "公网 IP", value: h.serverHostPublicIp || "—", mono: true },
    { label: "内网 IP", value: h.serverHostPrivateIp || "—", mono: true },
    { label: "分组", value: groupName(h.msServerGroupId) },
    { label: "最后在线", value: h.serverHostOnlineTime || "—" },
    { label: "备注", value: h.serverHostDescription || "—" },
  ];
});
</script>

<template>
  <div class="profile">
    <!-- 左侧：主机列表 -->
    <aside class="profile-rail">
      <div class="rail-head">
        <span class="rail-title">主机画像</span>
        <ReBadge :model-value="hosts.length" />
      </div>
      <ReInput v-model="search" placeholder="搜索名称 / IP" clearable size="small" class="rail-search" />
      <ReScrollbar class="rail-list">
        <div
          v-for="h in visibleHosts"
          :key="h.id"
          :class="['rail-item', { active: selectedId === h.id }]"
          @click="selectHost(h.id)"
        >
          <span class="ri-os">
            <img
              v-if="osImgSrc(osKey(h.serverHostOsType))"
              :src="osImgSrc(osKey(h.serverHostOsType))"
              class="ri-os-img"
              alt=""
            />
          </span>
          <div class="ri-meta">
            <b class="ri-name">{{ h.serverHostName }}</b>
            <span class="ri-addr mono">{{ h.serverHostAddress }}:{{ h.serverHostPort }}</span>
          </div>
          <ReStatusIndicator :type="onlineState(h) === 1 ? 'success' : 'danger'" />
        </div>
        <div v-if="visibleHosts.length === 0" class="rail-empty">无匹配主机</div>
      </ReScrollbar>
    </aside>

    <!-- 右侧：ReTab 详情 -->
    <section class="profile-detail">
      <div v-if="!selectedHost" class="detail-empty">
        <ReEmpty description="从左侧选择一台主机查看画像" />
      </div>
      <template v-else>
        <!-- 头部：主机概览条（图标 + 名称 + 关键状态） -->
        <div class="profile-head">
          <span class="ph-os">
            <img
              v-if="osImgSrc(osKey(selectedHost.serverHostOsType))"
              :src="osImgSrc(osKey(selectedHost.serverHostOsType))"
              class="ph-os-img"
              alt=""
            />
          </span>
          <div class="ph-name-wrap">
            <b class="ph-name">{{ selectedHost.serverHostName }}</b>
            <span class="ph-addr mono">{{ selectedHost.serverHostAddress }}:{{ selectedHost.serverHostPort }} · {{ protocolOf(selectedHost).toUpperCase() }}</span>
          </div>
          <div class="ph-status">
            <ReStatusIndicator :type="onlineState(selectedHost) === 1 ? 'success' : 'danger'" />
            <span :class="onlineState(selectedHost) === 1 ? 'on' : 'off'">{{ onlineState(selectedHost) === 1 ? '在线' : '离线' }}</span>
          </div>
          <div class="ph-actions">
            <ReButton icon="Connection" layout="square" size="small" type="primary" title="连接" @click="emit('connect', selectedHost)" />
            <ReButton icon="TrendCharts" layout="square" size="small" title="监控详情" @click="emit('detail', selectedHost)" />
            <ReButton icon="Search" layout="square" size="small" type="warning" title="端口扫描" @click="emit('scan-ports', selectedHost)" />
            <ReButton icon="EditPen" layout="square" size="small" title="编辑" @click="emit('edit', selectedHost)" />
          </div>
        </div>

        <!-- ReTab 分区 -->
        <ReTab :tabs="tabs" variant="capsule" class="profile-tabs">
          <!-- 概览 -->
          <template #overview>
            <div class="tab-grid">
              <div class="tab-item" v-for="row in overviewRows" :key="row.label">
                <span class="tab-label">{{ row.label }}</span>
                <span :class="['tab-value', { mono: row.mono, dim: row.value === '—' }]">{{ row.value }}</span>
              </div>
            </div>
          </template>

          <!-- 实时指标 -->
          <template #metrics>
            <div class="metrics-grid">
              <div class="metric">
                <span class="metric-label">延迟</span>
                <span class="metric-val mono" :class="{ bad: delayBad(delayOf(selectedHost)) }">{{ delayText(delayOf(selectedHost)) }}</span>
                <span class="metric-sub">socket 实时 / 最近检测</span>
              </div>
              <div class="metric">
                <span class="metric-label">在线状态</span>
                <span class="metric-val" :class="onlineState(selectedHost) === 1 ? 'good' : 'bad'">{{ onlineState(selectedHost) === 1 ? '在线' : '离线' }}</span>
                <span class="metric-sub">{{ selectedHost.serverHostOnlineTime || '未知' }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">采集模式</span>
                <span class="metric-val">{{ collectModeLabel(selectedHost.serverHostCollectMode) }}</span>
                <span class="metric-sub">间隔 {{ selectedHost.serverHostCollectInterval ?? '—' }}s</span>
              </div>
              <div class="metric">
                <span class="metric-label">Agent</span>
                <span class="metric-val">{{ selectedHost.serverHostAgentEnabled === 1 ? '已注册' : '未注册' }}</span>
                <span class="metric-sub mono">{{ selectedHost.serverHostAgentKey ? selectedHost.serverHostAgentKey.slice(0, 12) + '…' : '—' }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">CPU 核数</span>
                <span class="metric-val mono">{{ selectedHost.serverHostCpuCores ?? '—' }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">内存</span>
                <span class="metric-val mono">{{ selectedHost.serverHostMemoryMb ? (selectedHost.serverHostMemoryMb / 1024).toFixed(1) + ' GB' : '—' }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">磁盘</span>
                <span class="metric-val mono">{{ selectedHost.serverHostDiskGb ? selectedHost.serverHostDiskGb + ' GB' : '—' }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">远控</span>
                <span class="metric-val">{{ selectedHost.serverHostRemoteEnabled === 1 ? '启用' : '停用' }}</span>
              </div>
            </div>
          </template>

          <!-- 端口 -->
          <template #ports>
            <div class="ports-box">
              <div v-if="parsePorts(selectedHost.serverHostPorts).length" class="ports-list">
                <ReTag
                  v-for="p in parsePorts(selectedHost.serverHostPorts)"
                  :key="p.port"
                  size="small"
                  :value="p.port"
                  :tag-options="[{ dictValue: p.port, dictLabel: portText(p), dictTag: 'info' }]"
                />
              </div>
              <div v-else class="dim">未扫描，点右上「端口扫描」触发</div>
              <div v-if="selectedHost.serverHostLastPortScanTime" class="dim ports-time">
                最后扫描：{{ selectedHost.serverHostLastPortScanTime }}
              </div>
            </div>
          </template>

          <!-- 采集配置 -->
          <template #collect>
            <div class="tab-grid">
              <div class="tab-item"><span class="tab-label">采集开关</span><span class="tab-value">{{ selectedHost.serverHostCollectEnabled === 1 ? '启用' : '停用' }}</span></div>
              <div class="tab-item"><span class="tab-label">采集模式</span><span class="tab-value">{{ collectModeLabel(selectedHost.serverHostCollectMode) }}</span></div>
              <div class="tab-item"><span class="tab-label">采集间隔</span><span class="tab-value mono">{{ selectedHost.serverHostCollectInterval ?? '—' }} s</span></div>
              <div class="tab-item"><span class="tab-label">最后采集</span><span class="tab-value">{{ selectedHost.serverHostLastCollectTime || '—' }}</span></div>
              <div class="tab-item"><span class="tab-label">在离线检测</span><span class="tab-value">{{ selectedHost.serverHostOnlineEnabled === 1 ? '启用' : '停用' }}</span></div>
              <div class="tab-item"><span class="tab-label">检测间隔</span><span class="tab-value mono">{{ selectedHost.serverHostOnlineInterval ?? '—' }} s</span></div>
              <div class="tab-item"><span class="tab-label">延迟检测</span><span class="tab-value">{{ selectedHost.serverHostDelayEnabled === 1 ? '启用' : '停用' }}</span></div>
              <div class="tab-item"><span class="tab-label">延迟间隔</span><span class="tab-value mono">{{ selectedHost.serverHostDelayInterval ?? '—' }} s</span></div>
            </div>
          </template>

          <!-- 远控 -->
          <template #remote>
            <div class="tab-grid">
              <div class="tab-item"><span class="tab-label">远控协议</span><span class="tab-value">{{ protocolOf(selectedHost).toUpperCase() }}</span></div>
              <div class="tab-item"><span class="tab-label">目标端口</span><span class="tab-value mono">{{ selectedHost.serverHostPort }}</span></div>
              <div class="tab-item"><span class="tab-label">远控开关</span><span class="tab-value">{{ selectedHost.serverHostRemoteEnabled === 1 ? '启用' : '停用' }}</span></div>
              <div class="tab-item"><span class="tab-label">连接</span><span class="tab-value">
                <ReButton icon="Connection" :show-text="true" size="small" type="primary" @click="emit('connect', selectedHost)">连接</ReButton>
              </span></div>
            </div>
          </template>
        </ReTab>
      </template>
    </section>
  </div>
</template>

<style scoped lang="scss">
.profile {
  display: flex;
  height: 100%;
  min-height: 0;
}
/* 左侧主机列表 */
.profile-rail {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-container);
}
.rail-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 14px 8px;
}
.rail-title { font-size: 15px; font-weight: 600; }
.rail-search { padding: 0 14px 8px; }
.rail-list { flex: 1; min-height: 0; padding: 0 10px; }
.rail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all .15s;
  &:hover { background: var(--brand-50, #f3f1ff); }
  &.active { background: var(--brand-100, #e8e4ff); border-color: var(--brand-200, #d5ccff); }
}
.ri-os {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--bg-fill, #f5f6fa); flex-shrink: 0;
}
.ri-os-img { width: 18px; height: 18px; object-fit: contain; }
.ri-meta { flex: 1; min-width: 0; }
.ri-name {
  display: block; font-size: 13px; font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ri-addr { font-size: 11px; color: var(--text-tertiary, #a0a4b0); }
.rail-empty { text-align: center; padding: 30px; color: var(--text-tertiary); font-size: 13px; }

/* 右侧详情 */
.profile-detail {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px 20px;
}
.detail-empty { height: 100%; display: flex; align-items: center; justify-content: center; }
/* 头部概览条 */
.profile-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 14px;
}
.ph-os {
  display: inline-flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 12px;
  background: var(--bg-fill, #f5f6fa); flex-shrink: 0;
}
.ph-os-img { width: 26px; height: 26px; object-fit: contain; }
.ph-name-wrap { flex: 1; min-width: 0; }
.ph-name { display: block; font-size: 17px; font-weight: 700; color: var(--text-primary); }
.ph-addr { font-size: 12px; color: var(--text-tertiary, #a0a4b0); margin-top: 3px; }
.ph-status {
  display: inline-flex; align-items: center; gap: 6px; font-size: 13px;
  padding: 4px 12px; border-radius: 20px; background: var(--bg-fill, #f5f6fa);
}
.ph-status .on { color: var(--status-success-text, #34c759); font-weight: 500; }
.ph-status .off { color: var(--status-error-text, #f56c6c); font-weight: 500; }
.ph-actions { display: flex; gap: 6px; }
/* ReTab 区域 */
.profile-tabs { flex: 1; }
/* 概览/配置网格 */
.tab-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;
  padding: 14px 0;
}
.tab-item { display: flex; flex-direction: column; gap: 4px; }
.tab-label { font-size: 12px; color: var(--text-tertiary, #a0a4b0); }
.tab-value { font-size: 14px; color: var(--text-primary); }
.tab-value.mono { font-family: var(--font-mono, monospace); }
.tab-value.dim { color: var(--text-tertiary); }
/* 实时指标 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 14px 0;
}
.metric {
  display: flex; flex-direction: column; gap: 4px;
  padding: 12px 14px;
  background: var(--bg-fill, #f8f9fc);
  border-radius: 10px;
}
.metric-label { font-size: 11px; color: var(--text-tertiary, #a0a4b0); text-transform: uppercase; letter-spacing: .4px; }
.metric-val { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.metric-val.mono { font-family: var(--font-mono, monospace); }
.metric-val.bad { color: var(--danger, #f56c6c); }
.metric-val.good { color: var(--status-success-text, #34c759); }
.metric-sub { font-size: 11px; color: var(--text-tertiary, #a0a4b0); }
.metric-sub.mono { font-family: var(--font-mono, monospace); }
/* 端口 */
.ports-box { padding: 14px 0; }
.ports-list { display: flex; flex-wrap: wrap; gap: 6px; }
.ports-time { margin-top: 10px; font-size: 12px; }
.mono { font-family: var(--font-mono, monospace); }
.dim { color: var(--text-tertiary, #a0a4b0); font-size: 13px; }
</style>

<script setup lang="ts">
/**
 * 网络拓扑图 —— 基于 ReFlowGraph（X6 内核）的可视化关系图
 *
 * <p>展示三类关系：</p>
 * <ol>
 *   <li><b>局域网关系</b>：同子网的其他主机（按 IP 前缀匹配）</li>
 *   <li><b>服务关系</b>：当前主机的监听端口与运行服务</li>
 *   <li><b>内部常用软件</b>：用户可配置的软件节点，与当前主机建立关系</li>
 * </ol>
 *
 * <p>使用 ReFlowGraph 作为只读视图：禁用调色板与属性面板，保留工具栏（缩放 / 适配），
 * 所有数据通过 <code>flowData</code> 计算属性灌入，引擎就绪后自动 <code>fitCenter</code>。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { message } from "@repo/core";
import { ElMessageBox } from "element-plus";
import { http, unwrapResult } from "@repo/utils";
import ReFlowGraph from "@repo/ui/re-flow-graph";
import type { FlowEdge, FlowGraphData, FlowGraphEngine, FlowNode } from "@repo/ui/re-flow-graph";
import { queryHosts } from "../../api";

const props = defineProps<{
  /** 当前主机 id */
  hostId: number;
  /** 当前主机名 */
  hostName: string;
  /** 主机地址 */
  hostAddress?: string;
  /** 主机平台 */
  platform?: string;
}>();

/* ==================== 类型 ==================== */

interface Host {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  serverHostOsType: string;
  serverHostOnline: number;
}

/* ==================== 节点图标（24×24 viewBox SVG path，取自 FLOW_ICON_PATHS） ==================== */

/** 当前主机 —— 实心三角（start） */
const ICON_SELF = "M9 6l10 6-10 6z";
/** 局域网主机 —— 链环（link） */
const ICON_LAN =
  "M10.5 13.5a4 4 0 005.7 0l2.3-2.3a4 4 0 00-5.7-5.7L11.5 6.8M13.5 10.5a4 4 0 00-5.7 0l-2.3 2.3a4 4 0 005.7 5.7l1.3-1.3";
/** 服务 —— 流程框（process） */
const ICON_SERVICE = "M4 6.5h16v11H4zM8.5 12h6.5m0 0l-2.4-2.4M15 12l-2.4 2.4";
/** 端口 —— 网格（request） */
const ICON_PORT =
  "M12 3a9 9 0 100 18 9 9 0 000-18M3.5 9h17M3.5 15h17M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z";
/** 内部软件 —— 代码括号（script） */
const ICON_SOFTWARE = "M9 7L4.6 12 9 17M15 7l4.4 5L15 17";
/** 网卡 —— 圆柱（cache） */
const ICON_IFACE =
  "M12 3.5c4.7 0 8.5 1.4 8.5 3.2S16.7 9.9 12 9.9 3.5 8.5 3.5 6.7 7.3 3.5 12 3.5M3.5 6.7v10.6c0 1.8 3.8 3.2 8.5 3.2s8.5-1.4 8.5-3.2V6.7M3.5 12c0 1.8 3.8 3.2 8.5 3.2s8.5-1.4 8.5-3.2";

/* ==================== ReFlowGraph 节点类型定义 ==================== */

const nodeTypes = [
  { type: "self", label: "当前主机", group: "拓扑", path: ICON_SELF, color: "#4f7cff", tips: "当前主机", fixed: true },
  { type: "lan", label: "局域网主机", group: "拓扑", path: ICON_LAN, color: "#00b96b", tips: "同子网主机" },
  { type: "service", label: "服务", group: "拓扑", path: ICON_SERVICE, color: "#00b96b", tips: "运行服务" },
  { type: "port", label: "端口", group: "拓扑", path: ICON_PORT, color: "#f59a23", tips: "监听端口" },
  { type: "software", label: "内部软件", group: "拓扑", path: ICON_SOFTWARE, color: "#8e4ec6", tips: "内部常用软件" },
  { type: "iface", label: "网卡", group: "拓扑", path: ICON_IFACE, color: "#0aa2c0", tips: "网络接口" },
];

/* ==================== 状态 ==================== */

const hosts = ref<Host[]>([]);
const ports = ref<any[]>([]);
const services = ref<any[]>([]);
const adapters = ref<any[]>([]);
const internalSoftware = ref<string[]>([]);
const loading = ref(false);

/** ReFlowGraph 引擎实例 */
const engine = ref<FlowGraphEngine | null>(null);

/* ==================== 内部常用软件配置（持久化到 localStorage） ==================== */

const SW_KEY = "network-topology-internal-software";

function loadInternalSoftware(): string[] {
  try {
    const raw = localStorage.getItem(SW_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.filter((s: any) => typeof s === "string");
    }
  } catch { /* ignore */ }
  return [];
}

function saveInternalSoftware(): void {
  try {
    localStorage.setItem(SW_KEY, JSON.stringify(internalSoftware.value));
  } catch { /* ignore */ }
}

internalSoftware.value = loadInternalSoftware();

async function addSoftware(): Promise<void> {
  try {
    const { value } = await ElMessageBox.prompt("请输入软件名称", "添加内部软件", {
      confirmButtonText: "添加",
      cancelButtonText: "取消",
      inputValidator: (v: string) => !!v?.trim() || "不能为空",
    });
    const name = value.trim();
    if (!name) return;
    if (internalSoftware.value.includes(name)) {
      message.warning("该软件已存在");
      return;
    }
    internalSoftware.value.push(name);
    saveInternalSoftware();
  } catch { /* cancel */ }
}

async function removeSoftware(name: string): Promise<void> {
  try {
    await ElMessageBox.confirm(`移除「${name}」？`, "确认", { type: "warning" });
    internalSoftware.value = internalSoftware.value.filter(s => s !== name);
    saveInternalSoftware();
  } catch { /* cancel */ }
}

/* ==================== 数据加载 ==================== */

async function loadAll(): Promise<void> {
  loading.value = true;
  try {
    const [hostList, portRows, svcRows, ifaceRows] = await Promise.all([
      queryHosts().catch(() => [] as Host[]),
      fetchSection("ports"),
      fetchSection("services"),
      fetchAdaptersSafe(),
    ]);
    hosts.value = hostList;
    ports.value = portRows;
    services.value = svcRows;
    adapters.value = ifaceRows;
  } catch (e: any) {
    message.error(`加载拓扑数据失败：${e?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

async function fetchSection(section: string): Promise<any[]> {
  try {
    const res = await http().get(`/ms/server/host/${props.hostId}/profile/${section}`)
      .then(r => unwrapResult(r));
    const body = res as any;
    const rows = body?.rows ?? body?.data ?? [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function fetchAdaptersSafe(): Promise<any[]> {
  try {
    const res = await http().get(`/ms/server/host/${props.hostId}/network/adapters`)
      .then(r => unwrapResult(r));
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

/* ==================== 拓扑计算 ==================== */

/** 获取当前主机的 IP 地址列表 */
const hostIPs = computed(() => {
  const ips: string[] = [];
  for (const a of adapters.value) {
    const ip = a.ipv4 || a.address || a.ip;
    if (ip) ips.push(String(ip));
  }
  return ips;
});

/** 子网前缀（如 192.168.1） */
const subnetPrefix = computed(() => {
  for (const ip of hostIPs.value) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
  }
  return null;
});

/** 同子网的主机 */
const lanHosts = computed(() => {
  if (!subnetPrefix.value) return [];
  return hosts.value.filter(h => {
    if (h.id === props.hostId) return false;
    return h.serverHostAddress.startsWith(subnetPrefix.value + ".");
  });
});

/** 监听端口（取前 12 个） */
const topPorts = computed(() => {
  return ports.value.slice(0, 12).map(p => ({
    label: String(p.process ?? p.name ?? `端口 ${p.port ?? "?"}`),
    sub: `:${p.port ?? "?"}`,
    data: p,
  }));
});

/** 运行服务（取前 12 个） */
const topServices = computed(() => {
  return services.value.slice(0, 12).map(s => ({
    label: String(s.name ?? s.serviceName ?? "服务"),
    sub: String(s.status ?? s.state ?? ""),
    data: s,
  }));
});

/* ==================== 布局常量（卡片 180×36） ==================== */

const CARD_W = 180;
const CARD_H = 36;
/** 垂直间距（卡片高 36 + 8px 间隙） */
const V_STEP = 44;
/** 水平间距（卡片宽 180 + 20px 间隙） */
const H_STEP = 200;
/** 画布中心 */
const CENTER_X = 400;
const CENTER_Y = 280;

/** 子网主机列 x 坐标 */
const LAN_X = 80;
/** 端口列 x 坐标 */
const PORT_X = 720;
/** 服务列 x 坐标 */
const SVC_X = 720;
/** 软件行 y 坐标 */
const SW_Y = 560;
/** 网卡列起始 y */
const IFACE_Y0 = 40;
/** 端口列起始 y */
const PORT_Y0 = 80;
/** 服务列起始 y */
const SVC_Y0 = 380;

/* ==================== FlowGraphData 计算 ==================== */

/**
 * 节点副文本（用于 flowStateText，卡片第二行显示）
 */
function subTextOf(n: FlowNode): string {
  switch (n.type) {
    case "self": {
      const ip = hostIPs.value.join(", ") || props.hostAddress || "";
      return ip || "—";
    }
    case "iface": {
      const a = n.data as any;
      return a?.ipv4 || a?.address || a?.mac || "";
    }
    case "lan": {
      const h = n.data as unknown as Host;
      return h ? `${h.serverHostAddress} · ${h.serverHostOnline === 1 ? "在线" : "离线"}` : "";
    }
    case "port": {
      const p = n.data as any;
      return p ? `:${p.port ?? "?"}` : "";
    }
    case "service": {
      const s = n.data as any;
      return s ? String(s.status ?? s.state ?? "") : "";
    }
    default:
      return "";
  }
}

/** 构建拓扑图数据 */
const flowData = computed<FlowGraphData>(() => {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // 中心：当前主机
  nodes.push({
    id: "self",
    type: "self",
    label: props.hostName,
    x: CENTER_X,
    y: CENTER_Y,
    data: { hostId: props.hostId, hostName: props.hostName, hostAddress: props.hostAddress },
  });

  // 网络接口（顶部列，居中于 self 上方）
  const ifaceCount = Math.min(adapters.value.length, 6);
  for (let i = 0; i < ifaceCount; i++) {
    const a = adapters.value[i];
    nodes.push({
      id: `iface-${i}`,
      type: "iface",
      label: String(a.name ?? a.adapterName ?? `网卡 ${i + 1}`),
      x: CENTER_X,
      y: IFACE_Y0 + i * V_STEP,
      data: a,
    });
  }

  // 局域网主机（左侧列，垂直居中于 self）
  const lanCount = Math.min(lanHosts.value.length, 8);
  const lanStartY = CENTER_Y - (lanCount - 1) * V_STEP / 2;
  for (let i = 0; i < lanCount; i++) {
    const h = lanHosts.value[i];
    nodes.push({
      id: `lan-${h.id}`,
      type: "lan",
      label: h.serverHostName,
      x: LAN_X,
      y: lanStartY + i * V_STEP,
      data: h,
    });
  }

  // 监听端口（右侧上列）
  const portCount = Math.min(topPorts.value.length, 8);
  for (let i = 0; i < portCount; i++) {
    const p = topPorts.value[i];
    nodes.push({
      id: `port-${i}`,
      type: "port",
      label: p.label,
      x: PORT_X,
      y: PORT_Y0 + i * V_STEP,
      data: p.data,
    });
  }

  // 运行服务（右侧下列）
  const svcCount = Math.min(topServices.value.length, 8);
  for (let i = 0; i < svcCount; i++) {
    const s = topServices.value[i];
    nodes.push({
      id: `svc-${i}`,
      type: "service",
      label: s.label,
      x: SVC_X,
      y: SVC_Y0 + i * V_STEP,
      data: s.data,
    });
  }

  // 内部常用软件（底部行）
  const swCount = Math.min(internalSoftware.value.length, 10);
  for (let i = 0; i < swCount; i++) {
    nodes.push({
      id: `sw-${i}`,
      type: "software",
      label: internalSoftware.value[i],
      x: LAN_X + i * H_STEP,
      y: SW_Y,
    });
  }

  // 边：self → 每个节点；软件边用 else + transfer:false（灰虚线）
  for (const n of nodes) {
    if (n.id === "self") continue;
    const isSoftware = n.type === "software";
    edges.push({
      id: `${n.id}-edge`,
      from: "self",
      to: n.id,
      kind: isSoftware ? "else" : "normal",
      transfer: !isSoftware,
    });
  }

  return { nodes, edges };
});

/* ==================== 引擎回调 ==================== */

/** ReFlowGraph 就绪：保存引擎引用并自动适配 */
function onReady(eng: FlowGraphEngine): void {
  engine.value = eng;
  nextTick(() => eng.fitCenter());
}

/** 数据变化后：更新节点副文本 + 重新适配视图 */
watch(
  flowData,
  async () => {
    await nextTick();
    if (!engine.value) return;
    // 给每个节点设置 flowStateText（卡片第二行显示 IP / 地址等）
    for (const n of flowData.value.nodes) {
      const sub = subTextOf(n);
      if (sub) {
        engine.value.updateNode(n.id, { stateText: sub });
      }
    }
    nextTick(() => engine.value?.fitCenter());
  },
  { deep: true },
);

/* ==================== 生命周期 ==================== */

onMounted(loadAll);
watch(() => props.hostId, loadAll);
</script>

<template>
  <div class="nt">
    <!-- 页头 -->
    <div class="nt-head">
      <span class="nt-title">网络拓扑</span>
      <span class="lb-pill lb-pill--plain">{{ hostName }}</span>
      <span v-if="subnetPrefix" class="lb-pill lb-info">子网 {{ subnetPrefix }}.*</span>
      <span class="lb-spacer" />
      <button type="button" class="lb-btn" :disabled="loading" @click="loadAll">
        <ReIcon name="RefreshRight" :size="11" />刷新
      </button>
      <button type="button" class="lb-btn is-primary" @click="addSoftware">
        <ReIcon name="Plus" :size="11" />添加软件
      </button>
    </div>

    <!-- 拓扑图 -->
    <div class="nt-canvas-wrap">
      <div v-if="loading" v-loading="true" class="nt-loading" />
      <ReFlowGraph
        :data="flowData"
        :node-types="nodeTypes"
        readonly
        :show-palette="false"
        :show-properties="false"
        :show-toolbar="true"
        :menu-items="[]"
        height="100%"
        @ready="onReady"
      />

      <!-- 图例 -->
      <div class="nt-legend">
        <span class="nt-legend-item"><i class="nt-dot nt-dot--self" />当前主机</span>
        <span class="nt-legend-item"><i class="nt-dot nt-dot--lan" />局域网主机</span>
        <span class="nt-legend-item"><i class="nt-dot nt-dot--service" />服务</span>
        <span class="nt-legend-item"><i class="nt-dot nt-dot--port" />端口</span>
        <span class="nt-legend-item"><i class="nt-dot nt-dot--software" />内部软件</span>
        <span class="nt-legend-item"><i class="nt-dot nt-dot--iface" />网卡</span>
      </div>
    </div>

    <!-- 内部软件管理 -->
    <div v-if="internalSoftware.length" class="nt-software-bar">
      <span class="lb-dim" style="font-size: 11px">内部软件（{{ internalSoftware.length }}）：</span>
      <span v-for="sw in internalSoftware" :key="sw" class="nt-software-tag">
        {{ sw }}
        <button type="button" class="nt-software-remove" @click="removeSoftware(sw)">×</button>
      </span>
    </div>

    <!-- 底部说明 -->
    <div class="nt-foot lb-dim">
      <ReIcon name="InfoFilled" :size="11" />
      局域网主机按子网前缀匹配（{{ subnetPrefix || "未检测到" }}.*）；服务与端口取前 12 项；内部软件配置保存在本地。
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../lab/_lab-kit.scss";

.nt {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 8px;
  padding: 12px 14px;
  box-sizing: border-box;
}
.nt-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  flex-wrap: wrap;
}
.nt-title { font-size: 13px; font-weight: 700; }

.nt-canvas-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  background: var(--el-fill-color-lighter, #fafbfd);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 10px;
  overflow: hidden;
}
.nt-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.nt-legend {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: flex;
  gap: 12px;
  padding: 4px 8px;
  font-size: 10px;
  color: var(--el-text-color-secondary, #5c6270);
  background: rgba(255, 255, 255, 0.85);
  border-radius: 6px;
  flex-wrap: wrap;
  max-width: calc(100% - 16px);
  z-index: 5;
  pointer-events: none;
}
.nt-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.nt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.nt-dot--self { background: var(--el-color-primary, #6d5dfc); }
.nt-dot--lan { background: var(--el-color-success, #2fbf71); }
.nt-dot--service { background: var(--el-color-success, #2fbf71); }
.nt-dot--port { background: var(--el-color-warning, #f59e0b); }
.nt-dot--software { background: var(--el-color-primary-light-5, #b3a9fe); }
.nt-dot--iface { background: var(--el-color-info, #3b82f6); }

.nt-software-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
  flex-wrap: wrap;
  padding: 4px 0;
}
.nt-software-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  font-size: 11px;
  color: var(--el-color-primary, #6d5dfc);
  background: var(--el-color-primary-light-9, #f6f4ff);
  border: 1px solid var(--el-color-primary-light-7, #dcd6ff);
  border-radius: 12px;
}
.nt-software-remove {
  font: inherit;
  font-size: 14px;
  line-height: 1;
  color: var(--el-text-color-placeholder, #a8abb2);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  &:hover { color: var(--el-color-danger, #e5534b); }
}

.nt-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
  font-size: 11px;
  line-height: 1.6;
}
</style>

<script setup lang="ts">
/**
 * 主机网络（网卡）—— Windows「网络连接(ncpa.cpl)」风格
 *  - Windows：网卡磁贴（图标 + 名称 + 状态），支持「状态 / 属性」
 *  - 属性里「Internet 协议版本 4 (TCP/IPv4)」可编辑：DHCP / 静态 IP、前缀、网关、首选/备用 DNS
 *  - 非 Windows：退回通用表格
 * 数据经后端按采集通道（本机 / agent / SSH / WinRM）下发 PowerShell 读取与配置。
 */
import { computed, onMounted, ref, watch } from "vue";
import {
  fetchAdapters,
  fetchAdapterDetail,
  fetchIPv4Config,
  saveIPv4Config,
  type IPv4Config,
  type NetworkAdapterDetail,
} from "../api";
import NetAdapterGlyph from "./NetAdapterGlyph.vue";

const props = defineProps<{
  hostId: number;
  rows: Record<string, any>[];
  platform?: string;
}>();

const emit = defineEmits<{ (e: "applied"): void }>();

/** 是否 Windows（决定磁贴视图） */
const isWindows = computed(() =>
  String(props.platform || "").toUpperCase().includes("WIN"));

/** Windows 系统网卡列表（名称与 Get-NetAdapter 一致），加载失败回退分区 rows */
const winRows = ref<Record<string, any>[]>([]);
const winLoaded = ref(false);
async function loadWinAdapters(): Promise<void> {
  if (!isWindows.value) return;
  try {
    const list = await fetchAdapters(props.hostId);
    winRows.value = (list ?? []).map(d => ({
      name: d.name,
      status: d.status,
      ipv4: (d.ipv4Addresses ?? []).join(", "),
      mac: d.macAddress ?? "",
      description: d.description ?? "",
      linkSpeed: d.linkSpeed ?? "",
    }));
    winLoaded.value = true;
  } catch {
    winLoaded.value = false;
  }
}
/** 归一化 MAC：小写并去掉 - : 等分隔符，便于跨来源比对 */
function normMac(s: string): string {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
/**
 * 磁贴数据源：通用网络枚举（props.rows，全接口含虚拟/回环/隧道）与系统网卡列表
 * （Get-NetAdapter，慢、物理网卡为主，带状态/速率/描述）合并。
 *
 * <p>两来源命名不同（通用枚举是 eth4/net4，系统列表是「以太网」），改用 MAC（归一化）
 * 与 IPv4 关联：匹配上的用系统网卡的可读名与 Up 状态富集，匹配不上的（如 ISATAP 隧道
 * net4）原样保留 —— 慢加载只补字段、不再整体替换或新增重复卡，任何网卡都不消失。</p>
 */
const tiles = computed<Record<string, any>[]>(() => {
  if (!isWindows.value) return props.rows;
  const map = new Map<string, Record<string, any>>();
  const macIdx = new Map<string, string>();
  const ipIdx = new Map<string, string>();
  for (const r of props.rows) {
    const key = String(r.name);
    map.set(key, { ...r, mac: r.mac || "" });
    const m = normMac(r.mac);
    if (m) macIdx.set(m, key);
    String(r.ipv4 || "").split(/[,\s]+/).filter(Boolean).forEach(ip => ipIdx.set(ip, key));
  }
  for (const w of winRows.value) {
    const wm = normMac(w.mac);
    const wips = String(w.ipv4 || "").split(/[,\s]+/).filter(Boolean);
    const hitKey = (wm ? macIdx.get(wm) : undefined)
      || wips.map(ip => ipIdx.get(ip)).find(Boolean);
    if (hitKey) {
      const ex = map.get(hitKey);
      if (ex) {
        const merged = {
          ...ex,
          name: w.name,
          status: w.status || ex.status,
          ipv4: w.ipv4 || ex.ipv4,
          mac: ex.mac || w.mac,
          description: w.description || ex.description,
          linkSpeed: w.linkSpeed || ex.linkSpeed,
        };
        map.delete(hitKey);
        map.set(w.name, merged);
        if (wm) macIdx.set(wm, w.name);
        wips.forEach(ip => ipIdx.set(ip, w.name));
      }
    } else {
      map.set(w.name, { ...w });
    }
  }
  return [...map.values()];
});
onMounted(loadWinAdapters);
// platform 可能异步到达：onMounted 时若还不是 Windows 会提前返回，必须连 platform 一起盯
watch(() => [props.hostId, props.platform], () => {
  if (!winLoaded.value) loadWinAdapters();
});

/** 网卡是否处于连接（Up） */
function isUp(r: Record<string, any>): boolean {
  const s = String(r.status ?? "").toLowerCase();
  return s.includes("up") || s.includes("connected") || s.includes("已连接");
}

/** 按网卡名 / 描述判定图标类型：无线 → wifi，回环 → loopback，其余以太网 */
function adapterKind(r: Record<string, any>): "ethernet" | "wifi" | "loopback" {
  const text = `${r.name ?? ""} ${r.description ?? ""}`.toLowerCase();
  if (/wi-?fi|wlan|wireless|802\.11/.test(text)) return "wifi";
  if (/loopback|^\s*lo\b/.test(text)) return "loopback";
  return "ethernet";
}

/** Windows 风格状态文案 */
function statusText(r: Record<string, any>): string {
  const s = String(r.status ?? "").toLowerCase();
  if (s.includes("disabled") || s.includes("禁用")) return "已禁用";
  if (s.includes("up") || s.includes("connected")) return "已连接";
  if (s.includes("disconnect") || s.includes("拔出")) return "网络电缆被拔出";
  return s ? r.status : "—";
}

/* ---------------- 状态（详情）弹窗 ---------------- */
const statusVisible = ref(false);
const statusLoading = ref(false);
const detail = ref<NetworkAdapterDetail | null>(null);

const detailRows = computed(() => {
  const d = detail.value;
  if (!d) return [];
  const join = (a?: string[]) => (a && a.length ? a.join("，") : "—");
  return [
    { label: "连接状态", value: d.status || "—" },
    { label: "网卡描述", value: d.description || "—" },
    { label: "链路速率", value: d.linkSpeed || "—" },
    { label: "物理地址 (MAC)", value: d.macAddress || "—", mono: true },
    { label: "MTU", value: d.mtu ? String(d.mtu) : "—", mono: true },
    { label: "地址获取方式", value: d.dhcpEnabled ? "DHCP 自动获取" : "静态地址" },
    { label: "IPv4 地址", value: join(d.ipv4Addresses), mono: true },
    { label: "IPv6 地址", value: join(d.ipv6Addresses), mono: true },
    { label: "默认网关", value: join(d.gateways), mono: true },
    { label: "DNS 服务器", value: join(d.dnsServers), mono: true },
  ];
});

async function openStatus(r: Record<string, any>): Promise<void> {
  statusVisible.value = true;
  statusLoading.value = true;
  detail.value = null;
  try {
    detail.value = await fetchAdapterDetail(props.hostId, String(r.name));
  } finally {
    statusLoading.value = false;
  }
}

/* ---------------- 属性弹窗 ---------------- */
const propsVisible = ref(false);
const activeAdapter = ref<Record<string, any> | null>(null);

/** 属性列表（模拟 Windows 网卡属性「网络」选项卡，仅 IPv4 可编辑） */
const propertyItems = [
  { name: "Microsoft 网络客户端", editable: false },
  { name: "Microsoft 网络的文件和打印机共享", editable: false },
  { name: "QoS 数据包计划程序", editable: false },
  { name: "Internet 协议版本 4 (TCP/IPv4)", editable: true },
  { name: "Internet 协议版本 6 (TCP/IPv6)", editable: false },
  { name: "链路层拓扑发现映射器 I/O 驱动程序", editable: false },
  { name: "链路层拓扑发现响应程序", editable: false },
];

function openProps(r: Record<string, any>): void {
  activeAdapter.value = r;
  propsVisible.value = true;
}

function readOnlyItem(): void {
  // 非 IPv4 项在本系统只读
}

/* ---------------- IPv4 编辑弹窗 ---------------- */
const ipv4Visible = ref(false);
const ipv4Loading = ref(false);
const ipv4Saving = ref(false);
const ipv4 = ref<IPv4Config>({ dhcp: true, dnsDhcp: true, prefixLength: 24 });

/** 由前缀长度推导点分子网掩码（仅用于提示） */
function prefixToMask(prefix?: number): string {
  const p = Number(prefix);
  if (!Number.isInteger(p) || p < 0 || p > 32) return "—";
  const mask = (0xffffffff << (32 - p)) >>> 0;
  return [24, 16, 8, 0].map(s => (mask >>> s) & 0xff).join(".");
}
const maskHint = computed(() => prefixToMask(ipv4.value.prefixLength));

async function openIPv4(): Promise<void> {
  if (!activeAdapter.value) return;
  ipv4Visible.value = true;
  ipv4Loading.value = true;
  try {
    const cfg = await fetchIPv4Config(props.hostId, String(activeAdapter.value.name));
    ipv4.value = {
      adapterName: cfg.adapterName ?? String(activeAdapter.value.name),
      ifIndex: cfg.ifIndex,
      dhcp: cfg.dhcp ?? true,
      address: cfg.address ?? "",
      prefixLength: cfg.prefixLength ?? 24,
      gateway: cfg.gateway ?? "",
      dnsDhcp: cfg.dnsDhcp ?? true,
      dnsPreferred: cfg.dnsPreferred ?? "",
      dnsAlternate: cfg.dnsAlternate ?? "",
    };
  } finally {
    ipv4Loading.value = false;
  }
}

async function saveIPv4(): Promise<void> {
  const cfg = ipv4.value;
  if (!cfg.adapterName) return;
  if (!cfg.dhcp && !String(cfg.address ?? "").trim()) {
    return; // 静态方式必须有 IP（后端也会校验）
  }
  if (!cfg.dnsDhcp && !String(cfg.dnsPreferred ?? "").trim()) {
    return; // 手工 DNS 至少填首选
  }
  ipv4Saving.value = true;
  try {
    await saveIPv4Config(props.hostId, {
      ...cfg,
      prefixLength: Number(cfg.prefixLength) || 24,
    });
    ipv4Visible.value = false;
    propsVisible.value = false;
    emit("applied");
  } finally {
    ipv4Saving.value = false;
  }
}

/** 表格列（非 Windows 回退） */
const tableColumns = [
  { key: "name", label: "网卡", width: "150px" },
  { key: "status", label: "状态", width: "110px" },
  { key: "mac", label: "MAC", width: "170px" },
  { key: "ipv4", label: "IPv4" },
  { key: "ipv6", label: "IPv6" },
  { key: "mtu", label: "MTU", width: "90px" },
  { key: "speed", label: "速率", width: "110px" },
];
</script>

<template>
  <div class="hna">
    <!-- Windows：网卡磁贴 -->
    <div v-if="isWindows" class="ncpa-grid">
      <div
        v-for="(r, i) in tiles"
        :key="i"
        :class="['ncpa-tile', { off: !isUp(r) }]"
      >
        <div class="nt-icon">
          <!-- 网卡类型图标（RJ45 / Wi-Fi / 回环），颜色随状态 -->
          <NetAdapterGlyph :kind="adapterKind(r)" :size="44" />
        </div>
        <div class="nt-meta">
          <b class="nt-name">{{ r.name }}</b>
          <span class="nt-status">{{ statusText(r) }}</span>
          <span v-if="isUp(r) && r.ipv4" class="nt-ip mono">{{ r.ipv4 }}</span>
        </div>
        <div class="nt-actions">
          <ReButton layout="square" @click="openStatus(r)">状态</ReButton>
          <ReButton layout="square" @click="openProps(r)">属性</ReButton>
        </div>
      </div>
    </div>

    <!-- 非 Windows：通用表格 -->
    <table v-else class="hna-tbl">
      <thead>
        <tr>
          <th v-for="c in tableColumns" :key="c.key" :style="c.width ? { width: c.width } : {}">{{ c.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in rows" :key="i">
          <td v-for="c in tableColumns" :key="c.key">
            <template v-if="c.key === 'name'">
              <span :class="['tb-net-ico', { off: !isUp(r) }]">
                <NetAdapterGlyph :kind="adapterKind(r)" :size="26" />
              </span>
              {{ r.name }}
            </template>
            <template v-else>{{ r[c.key] ?? "" }}</template>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 状态弹窗 -->
    <ReDialog v-model="statusVisible" :title="`状态：${activeAdapter?.name ?? ''}`" width="460px">
      <div v-if="statusLoading" class="hna-loading">正在读取网卡状态…</div>
      <div v-else class="kv-list">
        <div v-for="row in detailRows" :key="row.label" class="kv-row">
          <span class="kv-label">{{ row.label }}</span>
          <span :class="['kv-val', { mono: row.mono }]">{{ row.value }}</span>
        </div>
      </div>
    </ReDialog>

    <!-- 属性弹窗 -->
    <ReDialog v-model="propsVisible" :title="`属性：${activeAdapter?.name ?? ''}`" width="480px">
      <div class="props-hint">此连接使用下列项目：</div>
      <div class="props-box">
        <div
          v-for="item in propertyItems"
          :key="item.name"
          :class="['props-item', { clickable: item.editable }]"
          @dblclick="item.editable ? openIPv4() : readOnlyItem()"
        >
          <el-checkbox :model-value="true" disabled />
          <span class="pi-name">{{ item.name }}</span>
          <ReButton v-if="item.editable" layout="square" @click="openIPv4()">属性</ReButton>
        </div>
      </div>
    </ReDialog>

    <!-- IPv4 编辑弹窗 -->
    <ReDialog v-model="ipv4Visible" title="Internet 协议版本 4 (TCP/IPv4) 属性" width="460px"
      :close-on-click-modal="false">
      <div v-if="ipv4Loading" class="hna-loading">正在读取 IPv4 配置…</div>
      <div v-else class="ipv4">
        <el-alert type="warning" :closable="false" show-icon class="ipv4-warn">
          修改 IP / 网关可能导致该主机网络中断；若正通过该网卡远程连接，请谨慎操作。
        </el-alert>

        <div class="ip-sec-title">IP 设置</div>
        <el-radio-group v-model="ipv4.dhcp" class="ip-mode">
          <el-radio :value="true">自动获得 IP 地址（DHCP）</el-radio>
          <el-radio :value="false">使用下面的 IP 地址</el-radio>
        </el-radio-group>
        <div v-if="!ipv4.dhcp" class="ip-fields">
          <div class="ipf">
            <label>IP 地址</label>
            <ReInput v-model="ipv4.address" placeholder="192.168.200.33" />
          </div>
          <div class="ipf">
            <label>子网前缀</label>
            <div class="ipf-wrap">
              <ReInput v-model="ipv4.prefixLength" type="number" placeholder="24" />
              <small class="ipf-hint mono">掩码 {{ maskHint }}</small>
            </div>
          </div>
          <div class="ipf">
            <label>默认网关</label>
            <ReInput v-model="ipv4.gateway" placeholder="192.168.200.1" />
          </div>
        </div>

        <div class="ip-sec-title">DNS 设置</div>
        <el-radio-group v-model="ipv4.dnsDhcp" class="ip-mode">
          <el-radio :value="true">自动获得 DNS 服务器地址</el-radio>
          <el-radio :value="false">使用下面的 DNS 服务器地址</el-radio>
        </el-radio-group>
        <div v-if="!ipv4.dnsDhcp" class="ip-fields">
          <div class="ipf">
            <label>首选 DNS</label>
            <ReInput v-model="ipv4.dnsPreferred" placeholder="114.114.114.114" />
          </div>
          <div class="ipf">
            <label>备用 DNS</label>
            <ReInput v-model="ipv4.dnsAlternate" placeholder="可选" />
          </div>
        </div>
      </div>
      <template #footer>
        <ReButton @click="ipv4Visible = false">取消</ReButton>
        <ReButton type="primary" :loading="ipv4Saving" @click="saveIPv4">确定</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.ncpa-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px; padding: 4px;
}
.ncpa-tile {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; border: 1px solid var(--el-border-color);
  border-radius: 10px; background: var(--el-bg-color);
  transition: border-color .15s, box-shadow .15s;
  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 10px rgba(0, 0, 0, .06);
  }
  &.off { color: var(--el-text-color-disabled); }
}
.nt-icon { display: inline-flex; color: var(--el-color-primary); flex-shrink: 0; }
.ncpa-tile.off .nt-icon { color: var(--el-text-color-disabled); }
.nt-meta { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.nt-name { font-size: 13px; }
.nt-status { font-size: 12px; color: var(--el-text-color-secondary); }
.ncpa-tile.off .nt-status { color: var(--el-text-color-disabled); }
.nt-ip { font-size: 11px; color: var(--el-text-color-secondary); }
.nt-actions { display: flex; gap: 6px; flex-shrink: 0; }

.hna-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.hna-tbl th, .hna-tbl td {
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 8px 10px; text-align: left;
}
.hna-tbl th { color: var(--el-text-color-secondary); font-weight: 600; }
.tb-net-ico {
  display: inline-flex; vertical-align: middle; margin-right: 8px;
  color: var(--el-color-primary);
  &.off { color: var(--el-text-color-disabled); }
}

.hna-loading { padding: 24px; text-align: center; color: var(--el-text-color-secondary); font-size: 13px; }

.kv-list { display: flex; flex-direction: column; }
.kv-row {
  display: flex; justify-content: space-between; gap: 14px;
  padding: 7px 2px; border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
}
.kv-label { color: var(--el-text-color-secondary); flex-shrink: 0; }
.kv-val { text-align: right; word-break: break-all; }
.mono { font-family: var(--el-font-family-monospace, monospace); }

.props-hint { font-size: 13px; margin-bottom: 8px; color: var(--el-text-color-regular); }
.props-box {
  border: 1px solid var(--el-border-color); border-radius: 8px;
  padding: 6px; max-height: 280px; overflow: auto;
}
.props-item {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 8px; border-radius: 6px; font-size: 13px;
  &.clickable { cursor: pointer; }
  &.clickable:hover { background: var(--el-fill-color-light); }
}
.pi-name { flex: 1; }

.ipv4 { display: flex; flex-direction: column; gap: 8px; }
.ipv4-warn { margin-bottom: 2px; }
.ip-sec-title {
  font-size: 12px; font-weight: 600; color: var(--el-text-color-secondary);
  letter-spacing: .4px; text-transform: uppercase; margin-top: 6px;
  padding-bottom: 4px; border-bottom: 1px solid var(--el-border-color-lighter);
}
.ip-mode { display: flex; flex-direction: column; gap: 2px; padding: 6px 2px 0; }
.ip-fields { display: flex; flex-direction: column; gap: 8px; padding: 8px 0 2px; }
.ipf { display: grid; grid-template-columns: 80px 1fr; align-items: center; gap: 10px; font-size: 13px; }
.ipf > label { color: var(--el-text-color-regular); }
.ipf-wrap { display: flex; flex-direction: column; gap: 3px; }
.ipf-hint { color: var(--el-text-color-placeholder); font-size: 11px; }
</style>

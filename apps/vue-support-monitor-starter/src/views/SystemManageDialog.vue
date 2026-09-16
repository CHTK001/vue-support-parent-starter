<template>
  <ReDialog v-model="visible" :title="`主机画像 - ${hostName || ''}`" width="92%" top="3vh" class="sys-mgr-dialog profile-dialog" footer-hidden>
    <div class="body-toolbar">
      <ReInput v-model="keyword" placeholder="搜索..." size="small" clearable style="width:160px" @keyup.enter="loadData" />
      <ReButton icon="RefreshRight" size="small" :loading="loading" @click="loadData" />
      <div class="toolbar-auto" v-if="isLiveType">
        <ReSwitch v-model="autoRefresh" size="small" @change="onAutoRefresh" />
      </div>
    </div>
    <div class="host-profile">
      <!-- 左侧：主机基本信息 -->
      <aside class="profile-sidebar">
        <div class="profile-os">
          <div class="os-badge" :class="osTypeClass">
            <span class="os-letter">{{ osLetter }}</span>
          </div>
          <div class="os-name">{{ hostOsType || '未知系统' }}</div>
          <span class="profile-status" :class="online ? 'st-online' : 'st-offline'">
            <i class="st-dot" />{{ online ? '在线' : '离线' }}
          </span>
        </div>
        <ReButton icon="RefreshRight" size="small" :loading="loading" @click="refreshHostInfo" style="width:100%">刷新主机信息</ReButton>
        <div class="profile-info">
          <div class="info-row"><span class="info-label">主机名</span><span class="info-val">{{ hostName || '-' }}</span></div>
          <div class="info-row"><span class="info-label">地址</span><span class="info-val mono">{{ hostAddress || '-' }}</span></div>
          <div class="info-row"><span class="info-label">协议</span><span class="info-val">{{ hostProtocol || '-' }}</span></div>
          <div class="info-row"><span class="info-label">延迟</span><span class="info-val mono">{{ hostDelay != null ? hostDelay + ' ms' : '-' }}</span></div>
          <div class="info-row"><span class="info-label">分组</span><span class="info-val">{{ hostGroup || '-' }}</span></div>
          <div class="info-row"><span class="info-label">公网 IP</span><span class="info-val mono">—</span></div>
          <div class="info-row"><span class="info-label">内网 IP</span><span class="info-val mono">—</span></div>
          <div class="info-row"><span class="info-label">MAC</span><span class="info-val mono">—</span></div>
          <div class="info-row"><span class="info-label">CPU</span><span class="info-val">— 核</span></div>
          <div class="info-row"><span class="info-label">内存</span><span class="info-val">—</span></div>
        </div>
      </aside>

      <!-- 右侧：Tab 管理面板 -->
      <div class="profile-main">
        <ReTab v-model="activeTab" :tabs="tabList" type="card" class="profile-tabs" @tab-change="onTabChange">
          <template #process>
            <ReTable :data="dataList" :columns="processColumns" :loading="loading" size="small" stripe @sort-change="onSortChange" class="mgr-table">
              <template #col-cpu="{ row }">
                <div class="bar-cell">
                  <div class="bar-bar"><div class="bar-fill" :style="{ width: Math.min(Number(row.cpu ?? 0), 100) + '%' }" /></div>
                  <span class="bar-text">{{ Number(row.cpu ?? 0).toFixed(1) }}</span>
                </div>
              </template>
              <template #col-memory="{ row }">
                <div class="bar-cell">
                  <div class="bar-bar bar-bar-mem"><div class="bar-fill bar-fill-mem" :style="{ width: Math.min(Number(row.memory ?? 0) / 10, 100) + '%' }" /></div>
                  <span class="bar-text">{{ formatMem(row.memory) }}</span>
                </div>
              </template>
              <template #col-actions="{ row }">
                <div class="op-cell">
                  <ReButton icon="View" layout="square" size="small" title="子进程" @click="openChildren(row)" />
                  <ReButton icon="List" layout="square" size="small" title="线程" @click="openThreads(row)" />
                  <ReButton icon="Close" layout="square" size="small" type="danger" title="关闭进程" @click="doKill(row)" />
                </div>
              </template>
            </ReTable>
          </template>

          <template #service>
            <ReTable :data="dataList" :columns="serviceColumns" :loading="loading" size="small" stripe class="mgr-table">
              <template #col-status="{ row }">
                <span class="svc-status" :class="isRunning(row) ? 'svc-running' : 'svc-stopped'">
                  <i class="svc-dot" />{{ serviceStatusText(row.Status) }}
                </span>
              </template>
              <template #col-actions="{ row }">
                <div class="op-cell">
                  <ReButton icon="VideoPlay" layout="square" size="small" type="success" title="启动" :disabled="isRunning(row)" @click="doStart(row)" />
                  <ReButton icon="VideoPause" layout="square" size="small" type="warning" title="停止" :disabled="!isRunning(row)" @click="doStop(row)" />
                  <ReButton icon="Refresh" layout="square" size="small" title="重启" @click="doRestart(row)" />
                </div>
              </template>
            </ReTable>
          </template>

          <template #disk>
            <div class="disk-view">
              <div v-for="disk in diskList" :key="disk.FriendlyName" class="disk-card">
                <div class="disk-header">
                  <div class="disk-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/>
                      <line x1="13" y1="10" x2="18" y2="10"/><line x1="13" y1="14" x2="18" y2="14"/>
                    </svg>
                  </div>
                  <div class="disk-info">
                    <div class="disk-name">{{ disk.FriendlyName || '未知磁盘' }}</div>
                    <div class="disk-meta">
                      <span class="disk-tag">{{ disk.MediaType || '-' }}</span>
                      <span class="disk-tag">{{ disk.BusType || '-' }}</span>
                      <span class="disk-tag" :class="disk.HealthStatus === 'Healthy' ? 'tag-ok' : 'tag-warn'">{{ disk.HealthStatus || '-' }}</span>
                    </div>
                  </div>
                  <div class="disk-capacity">{{ formatBytes(disk.Size) }}</div>
                </div>
                <div class="partitions">
                  <div v-for="p in disk.partitions" :key="p.DriveLetter" class="partition-row">
                    <div class="part-letter">{{ p.DriveLetter || '?' }}</div>
                    <div class="part-body">
                      <div class="part-top">
                        <span class="part-label">{{ p.FileSystemLabel || (p.DriveLetter ? p.DriveLetter + ':\\' : '未分配') }}</span>
                        <span class="part-size">{{ formatBytes(p.Size) }} / 可用 {{ formatBytes(p.SizeRemaining) }}</span>
                      </div>
                      <div class="part-bar">
                        <div class="part-bar-fill" :class="usePct(p) > 90 ? 'part-danger' : usePct(p) > 75 ? 'part-warn' : 'part-ok'" :style="{ width: usePct(p) + '%' }" />
                      </div>
                    </div>
                    <div class="part-fs">{{ p.FileSystem }}</div>
                    <div class="part-pct">{{ usePct(p).toFixed(1) }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template #network-interface>
            <ReTable :data="dataList" :columns="networkInterfaceColumns" :loading="loading" size="small" stripe class="mgr-table" />
          </template>

          <template #network-connection>
            <ReTable :data="dataList" :columns="networkConnectionColumns" :loading="loading" size="small" stripe class="mgr-table" />
          </template>

          <template #firewall>
            <ReTable :data="dataList" :columns="firewallColumns" :loading="loading" size="small" stripe class="mgr-table" />
          </template>

          <template #driver>
            <ReTable :data="dataList" :columns="driverColumns" :loading="loading" size="small" stripe class="mgr-table" />
          </template>

          <template #env>
            <ReTable :data="dataList" :columns="envColumns" :loading="loading" size="small" stripe class="mgr-table" />
          </template>

          <template #config>
            <div class="config-panel">
              <div class="config-section">
                <h4>远控配置</h4>
                <div class="config-form">
                  <div class="form-row">
                    <label>连接方式</label>
                    <el-select v-model="configForm.protocol" style="width:200px">
                      <el-option value="host" label="主机直连 (guacd)" />
                      <el-option value="vnc" label="VNC" />
                    </el-select>
                  </div>
                  <template v-if="configForm.protocol === 'vnc'">
                    <div class="form-row">
                      <label>VNC 地址</label>
                      <ReInput v-model="configForm.host" placeholder="如 192.168.1.100" style="width:240px" />
                    </div>
                    <div class="form-row">
                      <label>VNC 端口</label>
                      <ReInput v-model="configForm.port" placeholder="如 5901" style="width:200px" />
                    </div>
                    <div class="form-row">
                      <label>VNC 账号</label>
                      <ReInput v-model="configForm.username" placeholder="VNC 用户名" style="width:200px" />
                    </div>
                    <div class="form-row">
                      <label>VNC 密码</label>
                      <ReInput v-model="configForm.password" type="password" placeholder="VNC 密码" style="width:200px" />
                    </div>
                  </template>
                  <div class="form-row">
                    <label>是否开启远控</label>
                    <ReSwitch v-model="configForm.remoteEnabled" />
                  </div>
                </div>
              </div>

              <div class="config-section">
                <h4>SIP 内网穿透</h4>
                <p class="config-desc">guacd 服务器无法直接访问局域网主机时，通过 SIP 隧道打通。导出三个 tar 包部署：sip 服务端 + visit 访问端（部署到 guacd 服务器）+ provider 提供端（部署到目标主机）。</p>
                <div class="config-form">
                  <div class="form-row">
                    <label>启用 SIP</label>
                    <ReSwitch v-model="configForm.sipEnabled" />
                  </div>
                  <div class="form-row">
                    <label>SIP 服务器</label>
                    <ReInput v-model="configForm.sipHost" placeholder="如 124.221.230.112" style="width:240px" />
                  </div>
                  <div class="form-row">
                    <label>控制端口</label>
                    <ReInput v-model="configForm.sipPort" placeholder="7822" style="width:200px" />
                  </div>
                  <div class="form-row">
                    <label>SIP 密钥</label>
                    <ReInput v-model="configForm.sipSecret" type="password" placeholder="共享密钥" style="width:240px" />
                  </div>
                  <div class="form-row">
                    <label>本机端口映射</label>
                    <ReInput v-model="configForm.sipLocalPort" placeholder="如 13389 (RDP) / 2222 (SSH)" style="width:220px" />
                  </div>
                  <div class="form-row">
                    <label>部署模式</label>
                    <el-select v-model="configForm.sipDeploy" style="width:240px">
                      <el-option value="builtin" label="平台内置 SIP 服务" />
                      <el-option value="external" label="外部独立部署 SIP" />
                    </el-select>
                  </div>
                </div>
              </div>

              <div class="config-actions">
                <ReButton type="primary" @click="saveConfig">保存配置</ReButton>
                <ReButton icon="Download" @click="exportSipTars">导出 SIP 部署包</ReButton>
              </div>
            </div>
          </template>
        </ReTab>
      </div>
    </div>

    <!-- 子进程弹窗 -->
    <ReDialog v-model="childrenVisible" :title="`子进程 - PID ${currentPid}`" width="800px" footer-hidden>
      <ReTable :data="childrenList" :columns="processColumns" size="small" stripe class="mgr-table" />
    </ReDialog>

    <!-- 线程弹窗 -->
    <ReDialog v-model="threadsVisible" :title="`线程列表 - PID ${currentPid}`" width="800px" footer-hidden>
      <ReTable :data="threadsList" :columns="threadColumns" size="small" stripe class="mgr-table" />
    </ReDialog>
  </ReDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted } from "vue";
import {
  fetchProcesses, killProcess, fetchProcessChildren, fetchProcessThreads,
  fetchServices, startService, stopService, restartService,
  fetchNetworkInterfaces, fetchNetworkConnections,
  fetchDisks, fetchPartitions,
  fetchFirewallRules, fetchDrivers,
  type ProcessInfo, type ThreadInfo, type ServiceInfo,
} from "../monitorApi";

const props = defineProps<{
  modelValue: boolean;
  type: string;
  hostId?: number;
  hostName?: string;
  hostAddress?: string;
  hostOsType?: string;
  hostProtocol?: string;
  hostDelay?: number | null;
  hostOnline?: boolean;
  hostGroup?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: v => emit("update:modelValue", v),
});

const loading = ref(false);
const keyword = ref("");
const dataList = ref<any[]>([]);
const sortBy = ref("cpu");
const sortOrder = ref("desc");
const autoRefresh = ref(false);
let autoTimer: any = null;

// 当前 Tab
const activeTab = ref("disk");

// Tab 列表（懒加载：只渲染当前 tab 内容）
const tabList = [
  { name: "disk", label: "磁盘", icon: "FolderOpened" },
  { name: "process", label: "进程", icon: "Cpu" },
  { name: "service", label: "服务", icon: "Setting" },
  { name: "network-interface", label: "网络", icon: "Connection" },
  { name: "firewall", label: "防火墙", icon: "Lock" },
  { name: "driver", label: "驱动", icon: "Monitor" },
  { name: "env", label: "环境变量", icon: "Document" },
  { name: "config", label: "配置", icon: "Setting" },
];

// 磁盘+分区合并数据
const diskList = ref<any[]>([]);

// 子进程/线程
const childrenVisible = ref(false);
const threadsVisible = ref(false);
const childrenList = ref<ProcessInfo[]>([]);
const threadsList = ref<ThreadInfo[]>([]);
const currentPid = ref(0);

const isLiveType = computed(() => activeTab.value === "process" || activeTab.value === "service");

// 左侧信息
const osLetter = computed(() => {
  const os = (props.hostOsType || "").toUpperCase();
  if (os.includes("WINDOWS")) return "W";
  if (os.includes("LINUX")) return "L";
  if (os.includes("MAC")) return "M";
  return "?";
});
const osTypeClass = computed(() => {
  const os = (props.hostOsType || "").toUpperCase();
  if (os.includes("WINDOWS")) return "os-win";
  if (os.includes("LINUX")) return "os-linux";
  if (os.includes("MAC")) return "os-mac";
  return "os-unknown";
});
const online = computed(() => props.hostOnline !== false);

const countText = computed(() => {
  if (activeTab.value === "disk") return `共 ${diskList.length} 块磁盘`;
  return `共 ${dataList.length} 条`;
});

function onTabChange(name: string) {
  activeTab.value = name;
  if (name !== "info") loadData();
}

async function refreshHostInfo() {
  try {
    const res = await fetch("/ms/system/host-info");
    const json = await res.json();
    const info = json.data;
    if (info) {
      if (info.hostname) document.title = `主机画像 - ${info.hostname}`;
      ElMessage.success("主机信息已刷新");
    }
  } catch (e) {
    ElMessage.error("刷新主机信息失败");
  }
  loadData();
}

// 列定义
const processColumns = [
  { prop: "pid", label: "PID", width: 70, sortable: "custom" },
  { prop: "name", label: "进程名称", width: 160, sortable: "custom" },
  { prop: "cpu", label: "CPU", width: 130, sortable: "custom", slot: "cpu" },
  { prop: "memory", label: "内存", width: 130, sortable: "custom", slot: "memory" },
  { prop: "threadCount", label: "线程数", width: 70 },
  { prop: "description", label: "描述", minWidth: 150, showOverflowTooltip: true },
  { prop: "actions", label: "操作", width: 150, fixed: "right", slot: "actions" },
];

const threadColumns = [
  { prop: "Id", label: "TID", width: 80 },
  { prop: "PriorityLevel", label: "优先级", width: 80 },
  { prop: "ThreadState", label: "状态", width: 100, formatter: (r: any) => threadStateText(r.ThreadState) },
  { prop: "WaitReason", label: "等待原因", width: 100, formatter: (r: any) => waitReasonText(r.WaitReason) },
  { prop: "TotalProcessorTime", label: "CPU 时间", width: 120, formatter: (r: any) => formatCpuTime(r.TotalProcessorTime) },
];

const serviceColumns = [
  { prop: "Name", label: "服务名称", width: 180 },
  { prop: "DisplayName", label: "显示名称", minWidth: 220, showOverflowTooltip: true },
  { prop: "Status", label: "状态", width: 100, slot: "status" },
  { prop: "StartType", label: "启动类型", width: 90, formatter: (r: any) => startTypeText(r.StartType) },
  { prop: "actions", label: "操作", width: 150, fixed: "right", slot: "actions" },
];

const networkInterfaceColumns = [
  { prop: "Name", label: "名称", width: 180 },
  { prop: "InterfaceDescription", label: "描述", minWidth: 220, showOverflowTooltip: true },
  { prop: "Status", label: "状态", width: 90 },
  { prop: "MacAddress", label: "MAC 地址", width: 160 },
  { prop: "LinkSpeed", label: "链路速度", width: 100 },
];

const networkConnectionColumns = [
  { prop: "LocalAddress", label: "本地地址", width: 160, formatter: (r: any) => `${r.LocalAddress}:${r.LocalPort}` },
  { prop: "RemoteAddress", label: "远程地址", width: 160, formatter: (r: any) => `${r.RemoteAddress}:${r.RemotePort}` },
  { prop: "State", label: "状态", width: 100, formatter: (r: any) => tcpStateText(r.State) },
  { prop: "OwningProcess", label: "PID", width: 80 },
];

const firewallColumns = [
  { prop: "DisplayName", label: "规则名称", minWidth: 200, showOverflowTooltip: true },
  { prop: "Direction", label: "方向", width: 80, formatter: (r: any) => r.Direction === 1 ? "入站" : "出站" },
  { prop: "Action", label: "动作", width: 80, formatter: (r: any) => r.Action === 1 ? "允许" : "阻止" },
  { prop: "Enabled", label: "启用", width: 80, formatter: (r: any) => r.Enabled === 1 ? "是" : "否" },
];

const driverColumns = [
  { prop: "Name", label: "驱动名", width: 200 },
  { prop: "ClassName", label: "类别", width: 120 },
  { prop: "ProviderName", label: "提供商", width: 120 },
  { prop: "OriginalFileName", label: "驱动文件", minWidth: 250, showOverflowTooltip: true },
  { prop: "BootCritical", label: "关键", width: 80, formatter: (r: any) => r.BootCritical ? "是" : "否" },
];

const envColumns = [
  { prop: "name", label: "变量名", width: 280 },
  { prop: "value", label: "变量值", minWidth: 400 },
];

// 远控/SIP 配置表单
const configForm = reactive({
  protocol: "host",
  host: "",
  port: 22,
  username: "",
  password: "",
  remoteEnabled: true,
  sipEnabled: false,
  sipHost: "",
  sipPort: "7822",
  sipSecret: "",
  sipLocalPort: "",
  sipDeploy: "builtin",
});

async function saveConfig() {
  ElMessage.success("配置已保存");
}

function exportSipTars() {
  ElMessage.info("SIP 部署包导出功能开发中");
}

// ==================== 工具函数 ====================

function formatBytes(bytes: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function formatMem(mb: number): string {
  if (!mb) return "0";
  if (mb < 1024) return mb.toFixed(0) + " MB";
  return (mb / 1024).toFixed(2) + " GB";
}

function usePct(p: any): number {
  if (!p.Size) return 0;
  return ((p.Size - (p.SizeRemaining || 0)) / p.Size) * 100;
}

function tcpStateText(s: any): string {
  const map: Record<number, string> = {
    1: "CLOSED", 2: "LISTEN", 3: "SYN_SENT", 4: "SYN_RCVD",
    5: "ESTAB", 6: "FIN_WAIT1", 7: "FIN_WAIT2", 8: "CLOSE_WAIT",
    9: "CLOSING", 10: "LAST_ACK", 11: "TIME_WAIT", 12: "DELETE_TCB", 100: "LISTEN",
  };
  if (typeof s === "number") return map[s] ?? String(s);
  return String(s ?? "-");
}

function serviceStatusText(s: any): string {
  if (s === 1 || s === "Running") return "运行中";
  if (s === 4 || s === "Stopped") return "已停止";
  return String(s ?? "-");
}

function startTypeText(t: any): string {
  const map: Record<number, string> = { 2: "自动", 3: "手动", 4: "禁用" };
  if (typeof t === "number") return map[t] ?? String(t);
  return String(t ?? "-");
}

function threadStateText(s: any): string {
  const map: Record<number, string> = {
    0: "初始化", 1: "就绪", 2: "运行中", 3: "挂起",
    4: "已终止", 5: "等待", 6: "切换中", 7: "未知",
  };
  if (typeof s === "number") return map[s] ?? String(s);
  return String(s ?? "-");
}

function waitReasonText(s: any): string {
  const map: Record<number, string> = {
    0: "Executive", 1: "FreePage", 2: "PageIn", 3: "Allocation",
    4: "Suspension", 5: "UserRequest", 6: "EventPairLow", 7: "EventPairHigh",
    8: "LpcReceive", 9: "LpcReply", 10: "VirtualMemory", 11: "PageOut",
    12: "Unknown", 13: "WrEvent", 14: "WrRequest", 15: "WrResource",
    16: "WrPushLock", 17: "WrMutex", 18: "WrSemaphore", 19: "WrQueue",
    20: "WrGetMessage", 21: "WrDelayExecution",
  };
  if (typeof s === "number") return map[s] ?? String(s);
  return String(s ?? "-");
}

function formatCpuTime(t: any): string {
  if (!t || typeof t !== "object") return "-";
  const totalSeconds = Number(t.TotalSeconds ?? 0);
  if (totalSeconds < 60) return totalSeconds.toFixed(1) + "s";
  if (totalSeconds < 3600) return (totalSeconds / 60).toFixed(1) + "m";
  return (totalSeconds / 3600).toFixed(1) + "h";
}

function isRunning(row: any): boolean {
  return row.Status === 1 || row.Status === "Running";
}

function onSortChange({ prop, order }: { prop: string; order: string }) {
  sortBy.value = prop;
  sortOrder.value = order === "ascending" ? "asc" : "desc";
  loadData();
}

function onAutoRefresh(v: boolean) {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  if (v) {
    autoTimer = setInterval(() => { if (visible.value) loadData(); }, 3000);
  }
}

async function loadData() {
  loading.value = true;
  try {
    switch (activeTab.value) {
      case "process":
        dataList.value = await fetchProcesses({
          keyword: keyword.value || undefined,
          sortBy: sortBy.value,
          sortOrder: sortOrder.value,
          limit: 200,
        });
        break;
      case "service":
        dataList.value = await fetchServices(keyword.value || undefined);
        break;
      case "network-interface":
        dataList.value = await fetchNetworkInterfaces();
        break;
      case "network-connection":
        dataList.value = await fetchNetworkConnections();
        break;
      case "disk": {
        const [disks, partitions] = await Promise.all([fetchDisks(), fetchPartitions()]);
        diskList.value = disks.map((d: any) => ({
          ...d,
          partitions: (partitions as any[]).filter((p: any) => !p.DriveLetter || true),
        }));
        if (diskList.value.length === 0 && partitions.length > 0) {
          diskList.value = [{
            FriendlyName: "本地磁盘",
            MediaType: "-", BusType: "-", Size: 0, HealthStatus: "-",
            partitions,
          }];
        }
        break;
      }
      case "firewall":
        dataList.value = await fetchFirewallRules();
        break;
      case "driver":
        dataList.value = await fetchDrivers();
        break;
      case "env": {
        const res = await fetch("/ms/system/env");
        const json = await res.json();
        dataList.value = json.data || [];
        break;
      }
    }
  } catch (e) {
    console.error("加载数据失败", e);
    dataList.value = [];
  } finally {
    loading.value = false;
  }
}

async function doKill(row: ProcessInfo) {
  if (!confirm(`确认关闭进程 ${row.name} (PID ${row.pid})?`)) return;
  await killProcess(row.pid);
  loadData();
}

async function openChildren(row: ProcessInfo) {
  currentPid.value = row.pid;
  childrenList.value = await fetchProcessChildren(row.pid);
  childrenVisible.value = true;
}

async function openThreads(row: ProcessInfo) {
  currentPid.value = row.pid;
  threadsList.value = await fetchProcessThreads(row.pid);
  threadsVisible.value = true;
}

async function doStart(row: any) {
  await startService(row.Name);
  loadData();
}

async function doStop(row: any) {
  if (!confirm(`确认停止服务 ${row.Name}?`)) return;
  await stopService(row.Name);
  loadData();
}

async function doRestart(row: any) {
  if (!confirm(`确认重启服务 ${row.Name}?`)) return;
  await restartService(row.Name);
  loadData();
}

watch(visible, v => {
  if (v) {
    activeTab.value = "disk";
    loadData();
  }
});

watch(() => props.type, () => {
  if (visible.value && props.type) {
    const map: Record<string, string> = {
      process: "process", service: "service", disk: "disk",
      "network-interface": "network-interface", firewall: "firewall", driver: "driver",
    };
    activeTab.value = map[props.type] || "disk";
    loadData();
  }
});

onUnmounted(() => {
  if (autoTimer) clearInterval(autoTimer);
});
</script>

<style>
/* 全局覆盖：紧凑画像对话框 */
.el-dialog.koi-dialog-shell:has(.host-profile) .el-dialog__header {
  padding: 8px 16px 0 !important;
  margin-right: 0 !important;
}
.el-dialog.koi-dialog-shell:has(.host-profile) .el-dialog__title {
  font-size: 14px !important;
}
</style>

<style scoped>
.body-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  border-bottom: 1px solid #e2e8f0;
}
.host-profile {
  display: flex;
  gap: 16px;
  padding: 12px 16px 16px;
}

/* 配置面板 */
.config-panel {
  padding: 8px 0;
  max-width: 600px;
}
.config-section { margin-bottom: 20px; }
.config-section h4 {
  font-size: 14px; font-weight: 600; margin: 0 0 10px;
  padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;
}
.config-desc {
  font-size: 12px; color: #94a3b8; margin: 0 0 12px; line-height: 1.5;
}
.config-form { display: flex; flex-direction: column; gap: 12px; }
.form-row { display: flex; align-items: center; gap: 12px; }
.form-row label { width: 120px; font-size: 13px; color: #64748b; flex-shrink: 0; }
.config-actions { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; }

/* 左侧信息栏 */
.profile-sidebar {
  width: 230px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: var(--bg-elevated, #f8fafc);
  border-radius: 12px;
  border: 1px solid var(--border-subtle, #e2e8f0);
}
.profile-os {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle, #e2e8f0);
}
.os-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}
.os-win { background: linear-gradient(135deg, #0078d4, #106ebe); }
.os-linux { background: linear-gradient(135deg, #e67e22, #d35400); }
.os-mac { background: linear-gradient(135deg, #6c757d, #495057); }
.os-unknown { background: linear-gradient(135deg, #94a3b8, #64748b); }
.os-name {
  font-size: 13px;
  font-weight: 600;
}
.profile-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
}
.st-online { background: #dcfce7; color: #166534; }
.st-offline { background: #fee2e2; color: #991b1b; }
.st-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}
.info-label { color: #94a3b8; flex-shrink: 0; }
.info-val { color: #0f172a; font-weight: 500; text-align: right; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: "JetBrains Mono", monospace; }

/* 右侧主区 */
.profile-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.profile-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.profile-tabs { flex: 1; min-height: 0; }
.sys-mgr-count { margin-left: auto; font-size: 12px; color: #94a3b8; }
.toolbar-auto { display: flex; align-items: center; gap: 6px; }
.auto-label { font-size: 12px; color: #64748b; }
.auto-interval { font-size: 11px; color: #94a3b8; }
.op-cell { display: flex; gap: 4px; flex-wrap: nowrap; }
.op-cell .re-btn { flex-shrink: 0; }
.mgr-table { height: calc(100vh - 280px); min-height: 500px; }

/* 基本信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 8px 0;
}
.info-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.ic-label { font-size: 12px; color: #94a3b8; }
.ic-value { font-size: 15px; font-weight: 600; color: #0f172a; }

/* System Informer 风格 CPU/内存 条形图 */
.bar-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bar-bar {
  flex: 1;
  height: 6px;
  background: var(--tel-border-2, #e2e8f0);
  border-radius: 3px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--brand-500, #6366f1);
  border-radius: 3px;
  transition: width 0.3s;
}
.bar-bar-mem {
  background: var(--tel-border-2, #e2e8f0);
}
.bar-fill-mem {
  background: var(--success-500, #10b981);
}
.bar-text {
  width: 48px;
  text-align: right;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--tel-text-1, #1e293b);
}

/* 服务状态 */
.svc-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}
.svc-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.svc-running .svc-dot {
  background: #10b981;
  box-shadow: 0 0 4px rgba(16,185,129,0.4);
}
.svc-stopped .svc-dot {
  background: #94a3b8;
}

/* 磁盘管理卡片 (Windows 风格) */
.disk-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 220px);
  overflow-y: auto;
  padding: 4px;
}
.disk-card {
  background: var(--tel-bg-card, #fff);
  border: 1px solid var(--tel-border, #e2e8f0);
  border-radius: 12px;
  padding: 16px;
}
.disk-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.disk-icon {
  color: var(--brand-500, #6366f1);
  opacity: 0.8;
}
.disk-info {
  flex: 1;
}
.disk-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--tel-text-1, #1e293b);
  margin-bottom: 4px;
}
.disk-meta {
  display: flex;
  gap: 6px;
}
.disk-tag {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  background: var(--tel-bg-2, #f1f5f9);
  color: var(--tel-text-2, #64748b);
}
.disk-tag.tag-ok {
  background: #ecfdf5;
  color: #059669;
}
.disk-tag.tag-warn {
  background: #fef2f2;
  color: #dc2626;
}
.disk-capacity {
  font-size: 16px;
  font-weight: 700;
  color: var(--tel-text-1, #1e293b);
  font-variant-numeric: tabular-nums;
}
.partitions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.partition-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--tel-bg-2, #f8fafc);
  border-radius: 8px;
}
.part-letter {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-50, #eef2ff);
  color: var(--brand-600, #4f46e5);
  font-weight: 700;
  font-size: 13px;
  border-radius: 8px;
}
.part-body {
  flex: 1;
}
.part-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
}
.part-label {
  font-weight: 600;
  color: var(--tel-text-1, #1e293b);
}
.part-size {
  color: var(--tel-text-muted, #94a3b8);
  font-variant-numeric: tabular-nums;
}
.part-bar {
  height: 8px;
  background: var(--tel-border, #e2e8f0);
  border-radius: 4px;
  overflow: hidden;
}
.part-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}
.part-ok { background: #10b981; }
.part-warn { background: #f59e0b; }
.part-danger { background: #ef4444; }
.part-fs {
  width: 70px;
  text-align: center;
  font-size: 11px;
  color: var(--tel-text-2, #64748b);
}
.part-pct {
  width: 60px;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--tel-text-1, #1e293b);
}
</style>

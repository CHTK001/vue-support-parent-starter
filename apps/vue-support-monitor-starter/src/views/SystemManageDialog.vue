<template>
  <ReDialog v-model="visible" :title="dialogTitle" width="900px" class="sys-mgr-dialog">
    <div class="sys-mgr-toolbar">
      <ReInput
        v-model="keyword"
        placeholder="搜索..."
        size="small"
        clearable
        style="width: 220px"
        @keyup.enter="loadData"
      />
      <ReButton icon="RefreshRight" size="small" :loading="loading" @click="loadData">刷新</ReButton>
      <span class="sys-mgr-count">共 {{ dataList.length }} 条</span>
    </div>

    <!-- 进程管理 -->
    <ReTable
      v-if="type === 'process'"
      :data="dataList"
      :columns="processColumns"
      :loading="loading"
      size="small"
      stripe
      @sort-change="onSortChange"
      style="height: 480px"
    >
      <template #col-actions="{ row }">
        <div class="op-cell">
          <ReButton icon="View" layout="square" size="small" title="子进程" @click="openChildren(row)" />
          <ReButton icon="List" layout="square" size="small" title="线程" @click="openThreads(row)" />
          <ReButton icon="Close" layout="square" size="small" type="danger" title="关闭进程" @click="doKill(row)" />
        </div>
      </template>
    </ReTable>

    <!-- 服务管理 -->
    <ReTable
      v-else-if="type === 'service'"
      :data="dataList"
      :columns="serviceColumns"
      :loading="loading"
      size="small"
      stripe
      style="height: 480px"
    >
      <template #col-actions="{ row }">
        <div class="op-cell">
          <ReButton icon="Play" layout="square" size="small" type="success" title="启动" :disabled="isRunning(row)" @click="doStart(row)" />
          <ReButton icon="Pause" layout="square" size="small" type="warning" title="停止" :disabled="!isRunning(row)" @click="doStop(row)" />
          <ReButton icon="Refresh" layout="square" size="small" title="重启" @click="doRestart(row)" />
        </div>
      </template>
    </ReTable>

    <!-- 网络接口 -->
    <ReTable
      v-else-if="type === 'network-interface'"
      :data="dataList"
      :columns="networkInterfaceColumns"
      :loading="loading"
      size="small"
      stripe
      style="height: 480px"
    />

    <!-- 网络连接 -->
    <ReTable
      v-else-if="type === 'network-connection'"
      :data="dataList"
      :columns="networkConnectionColumns"
      :loading="loading"
      size="small"
      stripe
      style="height: 480px"
    />

    <!-- 磁盘 -->
    <ReTable
      v-else-if="type === 'disk'"
      :data="dataList"
      :columns="diskColumns"
      :loading="loading"
      size="small"
      stripe
      style="height: 480px"
    />

    <!-- 磁盘分区 -->
    <ReTable
      v-else-if="type === 'partition'"
      :data="dataList"
      :columns="partitionColumns"
      :loading="loading"
      size="small"
      stripe
      style="height: 480px"
    />

    <!-- 防火墙 -->
    <ReTable
      v-else-if="type === 'firewall'"
      :data="dataList"
      :columns="firewallColumns"
      :loading="loading"
      size="small"
      stripe
      style="height: 480px"
    />

    <!-- 驱动 -->
    <ReTable
      v-else-if="type === 'driver'"
      :data="dataList"
      :columns="driverColumns"
      :loading="loading"
      size="small"
      stripe
      style="height: 480px"
    />

    <!-- 子进程弹窗 -->
    <ReDialog v-model="childrenVisible" :title="`子进程 - PID ${currentPid}`" width="700px">
      <ReTable :data="childrenList" :columns="processColumns" size="small" stripe style="height: 360px" />
    </ReDialog>

    <!-- 线程弹窗 -->
    <ReDialog v-model="threadsVisible" :title="`线程列表 - PID ${currentPid}`" width="700px">
      <ReTable :data="threadsList" :columns="threadColumns" size="small" stripe style="height: 360px" />
    </ReDialog>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 系统管理弹窗
 *
 * 管理目标主机的进程/服务/网络/磁盘/防火墙/驱动等系统级操作。
 * @author CH
 * @since 4.0.0
 */
import { ref, computed, watch } from "vue";
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

// 子进程/线程
const childrenVisible = ref(false);
const threadsVisible = ref(false);
const childrenList = ref<ProcessInfo[]>([]);
const threadsList = ref<ThreadInfo[]>([]);
const currentPid = ref(0);

const dialogTitle = computed(() => {
  const host = props.hostName ? ` - ${props.hostName}` : "";
  const titles: Record<string, string> = {
    process: "进程管理",
    service: "服务管理",
    "network-interface": "网络接口",
    "network-connection": "网络连接",
    disk: "磁盘管理",
    partition: "磁盘分区",
    firewall: "防火墙规则",
    driver: "驱动管理",
  };
  return `${titles[props.type] ?? "系统管理"}${host}`;
});

// 列定义
const processColumns = [
  { prop: "pid", label: "PID", width: 80, sortable: "custom" },
  { prop: "name", label: "进程名称", width: 160, sortable: "custom" },
  { prop: "cpu", label: "CPU %", width: 90, sortable: "custom", formatter: (r: any) => Number(r.cpu ?? 0).toFixed(1) },
  { prop: "memory", label: "内存 MB", width: 100, sortable: "custom", formatter: (r: any) => Number(r.memory ?? 0).toFixed(1) },
  { prop: "threadCount", label: "线程数", width: 80 },
  { prop: "description", label: "描述", minWidth: 150, showOverflowTooltip: true },
  { prop: "actions", label: "操作", width: 140, fixed: "right", slot: "actions" },
];

const threadColumns = [
  { prop: "tid", label: "TID", width: 80 },
  { prop: "name", label: "名称", width: 140 },
  { prop: "cpu", label: "CPU %", width: 90, formatter: (r: any) => Number(r.cpu ?? 0).toFixed(1) },
  { prop: "state", label: "状态", width: 100 },
  { prop: "cpuTime", label: "CPU 时间", width: 120 },
];

const serviceColumns = [
  { prop: "name", label: "服务名称", width: 180 },
  { prop: "displayName", label: "显示名称", width: 200, showOverflowTooltip: true },
  { prop: "status", label: "状态", width: 100, formatter: (r: any) => r.status ?? r.activeState ?? "" },
  { prop: "startType", label: "启动类型", width: 100, formatter: (r: any) => r.startType ?? r.loadState ?? "" },
  { prop: "description", label: "描述", minWidth: 150, showOverflowTooltip: true },
  { prop: "actions", label: "操作", width: 140, fixed: "right", slot: "actions" },
];

const networkInterfaceColumns = [
  { prop: "name", label: "名称", width: 160 },
  { prop: "status", label: "状态", width: 100 },
  { prop: "macAddress", label: "MAC 地址", width: 160 },
  { prop: "linkSpeed", label: "链路速度", width: 120 },
  { prop: "ifIndex", label: "索引", width: 80 },
];

const networkConnectionColumns = [
  { prop: "proto", label: "协议", width: 80 },
  { prop: "state", label: "状态", width: 120 },
  { prop: "localAddress", label: "本地地址", width: 180 },
  { prop: "remoteAddress", label: "远程地址", width: 180 },
  { prop: "process", label: "进程", minWidth: 120, showOverflowTooltip: true },
];

const diskColumns = [
  { prop: "FriendlyName", label: "名称", width: 200 },
  { prop: "MediaType", label: "介质类型", width: 100 },
  { prop: "BusType", label: "总线类型", width: 100 },
  { prop: "Size", label: "容量", width: 120, formatter: (r: any) => formatBytes(r.Size) },
  { prop: "HealthStatus", label: "健康状态", width: 100 },
];

const partitionColumns = [
  { prop: "filesystem", label: "文件系统", width: 160 },
  { prop: "type", label: "类型", width: 100 },
  { prop: "size", label: "总容量", width: 100 },
  { prop: "used", label: "已用", width: 100 },
  { prop: "available", label: "可用", width: 100 },
  { prop: "usePercent", label: "使用率", width: 100 },
  { prop: "mountPoint", label: "挂载点", minWidth: 120 },
];

const firewallColumns = [
  { prop: "chain", label: "链", width: 100 },
  { prop: "num", label: "序号", width: 70 },
  { prop: "target", label: "目标", width: 100 },
  { prop: "protocol", label: "协议", width: 80 },
  { prop: "source", label: "源地址", width: 140 },
  { prop: "destination", label: "目标地址", width: 140 },
  { prop: "info", label: "信息", minWidth: 150, showOverflowTooltip: true },
];

const driverColumns = [
  { prop: "name", label: "驱动名称", width: 200 },
  { prop: "size", label: "大小", width: 120, formatter: (r: any) => formatBytes(r.size) },
  { prop: "usedBy", label: "被引用", width: 100 },
  { prop: "dependsOn", label: "依赖", minWidth: 150, showOverflowTooltip: true },
];

/**
 * 字节数格式化
 * @param bytes 字节数
 */
function formatBytes(bytes: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

/**
 * 服务是否运行中
 * @param row 服务行
 */
function isRunning(row: ServiceInfo): boolean {
  const s = String(row.status ?? row.activeState ?? "").toLowerCase();
  return s === "running" || s === "active";
}

function onSortChange({ prop, order }: { prop: string; order: string }) {
  sortBy.value = prop;
  sortOrder.value = order === "ascending" ? "asc" : "desc";
  loadData();
}

async function loadData() {
  loading.value = true;
  try {
    switch (props.type) {
      case "process":
        dataList.value = await fetchProcesses({
          keyword: keyword.value || undefined,
          sortBy: sortBy.value,
          sortOrder: sortOrder.value,
          limit: 100,
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
      case "disk":
        dataList.value = await fetchDisks();
        break;
      case "partition":
        dataList.value = await fetchPartitions();
        break;
      case "firewall":
        dataList.value = await fetchFirewallRules();
        break;
      case "driver":
        dataList.value = await fetchDrivers();
        break;
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

async function doStart(row: ServiceInfo) {
  await startService(row.name);
  loadData();
}

async function doStop(row: ServiceInfo) {
  if (!confirm(`确认停止服务 ${row.name}?`)) return;
  await stopService(row.name);
  loadData();
}

async function doRestart(row: ServiceInfo) {
  if (!confirm(`确认重启服务 ${row.name}?`)) return;
  await restartService(row.name);
  loadData();
}

watch(visible, v => {
  if (v) loadData();
});

watch(() => props.type, () => {
  if (visible.value) loadData();
});
</script>

<style scoped>
.sys-mgr-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.sys-mgr-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--tel-text-muted, #94a3b8);
}
.op-cell {
  display: flex;
  gap: 4px;
}
</style>

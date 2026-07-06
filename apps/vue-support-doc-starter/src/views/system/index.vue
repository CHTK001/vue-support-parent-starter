<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("system.title") }}</h2>
      <div class="page-header-actions">
        <el-tooltip :content="t('common.refresh')" placement="top">
          <el-button @click="refreshData" circle><el-icon><Refresh /></el-icon></el-button>
        </el-tooltip>
      </div>
    </div>

    <el-row :gutter="16" class="card-tabs">
      <el-col :span="8">
        <div :class="['card-tab', { active: activeTab === 'processes' }]" @click="activeTab = 'processes'">
          <div class="card-tab-header">
            <el-icon :size="24"><Monitor /></el-icon>
            <span class="card-tab-title">{{ t('system.processes') }}</span>
          </div>
          <div class="card-tab-info">
            <span>{{ processes.length }} processes</span>
            <span>{{ formatMemory(totalMemUsage) }}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div :class="['card-tab', { active: activeTab === 'env' }]" @click="activeTab = 'env'">
          <div class="card-tab-header">
            <el-icon :size="24"><Document /></el-icon>
            <span class="card-tab-title">{{ t('system.envVars') }}</span>
          </div>
          <div class="card-tab-info">
            <span>{{ envVars.length }} variables</span>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div :class="['card-tab', { active: activeTab === 'services' }]" @click="activeTab = 'services'">
          <div class="card-tab-header">
            <el-icon :size="24"><Setting /></el-icon>
            <span class="card-tab-title">{{ t('system.services') }}</span>
          </div>
          <div class="card-tab-info">
            <span>{{ services.length }} services</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Processes Panel -->
    <div v-if="activeTab === 'processes'" class="tab-panel">
      <div class="tab-toolbar">
        <el-input v-model="processSearch" :placeholder="t('system.searchProcess')" clearable prefix-icon="Search" style="width: 240px" />
        <el-button type="danger" size="small" :disabled="!selectedPid" @click="handleKill">
          <el-icon><Delete /></el-icon> {{ t('system.kill') }}
        </el-button>
      </div>
        <el-table :data="filteredProcesses" style="width: 100%" max-height="calc(100vh - 360px)" @row-click="selectProcess" row-class-name="clickable-row" highlight-current-row @sort-change="handleSortChange">
          <el-table-column prop="pid" label="PID" width="70" sortable="custom" />
          <el-table-column prop="name" :label="t('system.processName')" min-width="120" sortable="custom" />
          <el-table-column label="CPU" width="80" sortable="custom" prop="cpuUsage">
            <template #default="{ row }">
              <div class="metric-bar">
                <div class="metric-fill cpu" :style="{ width: Math.min(row.cpuUsage, 100) + '%' }"></div>
                <span class="metric-text">{{ row.cpuUsage.toFixed(1) }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Memory" width="110" sortable="custom" prop="memoryUsage">
            <template #default="{ row }">
              <div class="metric-bar">
                <div class="metric-fill mem" :style="{ width: Math.min(row.memoryUsage / totalMemUsage * 100, 100) + '%' }"></div>
                <span class="metric-text">{{ formatMemory(row.memoryUsage) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="childCount" label="Children" width="70" />
          <el-table-column prop="threadCount" label="Threads" width="70" />
          <el-table-column label="Command" min-width="220">
            <template #default="{ row }">
              <code class="env-value">{{ truncateValue(row.command, 60) }}</code>
            </template>
          </el-table-column>
          <el-table-column :label="t('clients.status')" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="row.status === 'Running' ? 'success' : 'danger'">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>

      <!-- Process Tree Dialog -->
      <el-dialog v-model="treeVisible" :title="'Process Tree - ' + selectedProcessName" width="600px" destroy-on-close>
        <el-tree :data="processTreeData" :props="treeProps" default-expand-all highlight-current>
          <template #default="{ node, data }">
            <span class="tree-node">
              <span class="tree-pid">{{ data.pid }}</span>
              <span class="tree-name">{{ data.name }}</span>
              <span class="tree-cpu">CPU: {{ data.cpuUsage.toFixed(1) }}%</span>
              <span class="tree-mem">Mem: {{ formatMemory(data.memoryUsage) }}</span>
            </span>
          </template>
        </el-tree>
      </el-dialog>
    </div>

    <!-- Environment Variables Panel -->
    <div v-if="activeTab === 'env'" class="tab-panel">
      <div class="tab-toolbar">
        <el-input v-model="envSearch" :placeholder="t('system.searchEnv')" clearable prefix-icon="Search" style="width: 240px" />
        <el-button type="primary" size="small" @click="openEnvDialog">
          <el-icon><Plus /></el-icon> {{ t('system.addEnv') }}
        </el-button>
      </div>
      <el-table :data="filteredEnvVars" style="width: 100%" max-height="calc(100vh - 360px)">
        <el-table-column prop="name" :label="t('system.envName')" min-width="200" />
        <el-table-column prop="value" :label="t('system.envValue')" min-width="300">
          <template #default="{ row }"><code class="env-value">{{ truncateValue(row.value) }}</code></template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Services Panel -->
    <div v-if="activeTab === 'services'" class="tab-panel">
      <el-table :data="services" style="width: 100%" max-height="calc(100vh - 360px)">
        <el-table-column prop="name" :label="t('system.serviceName')" min-width="150" />
        <el-table-column prop="displayName" :label="t('system.displayName')" min-width="200" />
        <el-table-column :label="t('clients.status')" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status.includes('RUNNING') ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="150">
          <template #default="{ row }">
            <el-button size="small" text type="success" :disabled="row.status.includes('RUNNING')" @click="handleStartService(row.name)">{{ t('system.start') }}</el-button>
            <el-button size="small" text type="danger" :disabled="!row.status.includes('RUNNING')" @click="handleStopService(row.name)">{{ t('system.stop') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Add Env Dialog -->
    <el-dialog v-model="envDialogVisible" :title="t('system.addEnv')" width="400px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item :label="t('system.envName')"><el-input v-model="envForm.name" /></el-form-item>
        <el-form-item :label="t('system.envValue')"><el-input v-model="envForm.value" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="envDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveEnvVar">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { Refresh, Delete, Plus, Monitor, Document, Setting } from "@element-plus/icons-vue";
import { listProcesses, killProcess, getEnvVars, setEnvVar as apiSetEnvVar, listServices, startService as apiStartService, stopService as apiStopService, getProcessTree, type ProcessInfo, type ProcessTreeNode } from "@/services";

const { t } = useI18n();

const activeTab = ref("processes");
const processSearch = ref("");
const envSearch = ref("");
const selectedPid = ref<number | null>(null);
const selectedProcessName = ref("");
const treeVisible = ref(false);
const processTreeData = ref<ProcessTreeNode[]>([]);

const processes = ref<ProcessInfo[]>([]);
const envVars = ref<{ name: string; value: string }[]>([]);
const services = ref<{ name: string; displayName: string; status: string }[]>([]);
const envDialogVisible = ref(false);
const envForm = ref({ name: "", value: "" });

const totalMemUsage = computed(() => processes.value.reduce((s, p) => s + p.memoryUsage, 0));

const filteredProcesses = computed(() => {
  if (!processSearch.value) return processes.value;
  const q = processSearch.value.toLowerCase();
  return processes.value.filter(p => p.name.toLowerCase().includes(q) || p.pid.toString().includes(q));
});

const filteredEnvVars = computed(() => {
  if (!envSearch.value) return envVars.value;
  const q = envSearch.value.toLowerCase();
  return envVars.value.filter(v => v.name.toLowerCase().includes(q) || v.value.toLowerCase().includes(q));
});

const treeProps = { children: "children", label: "name" };

function formatMemory(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return val.toFixed(1) + " " + units[i];
}

function truncateValue(value: string, maxLen = 80): string {
  if (!value) return "-";
  return value.length > maxLen ? value.substring(0, maxLen) + "..." : value;
}

const sortState = ref({ prop: "", order: "" });
function handleSortChange(sort: { prop: string; order: string }) {
  sortState.value = { prop: sort.prop, order: sort.order };
  if (!sort.prop || !sort.order) return;
  const dir = sort.order === "ascending" ? 1 : -1;
  processes.value.sort((a, b) => {
    const pa = (a as any)[sort.prop] ?? 0;
    const pb = (b as any)[sort.prop] ?? 0;
    return pa > pb ? dir : pa < pb ? -dir : 0;
  });
}

async function selectProcess(row: ProcessInfo) {
  selectedPid.value = row.pid;
  selectedProcessName.value = row.name;
  try {
    const tree = await getProcessTree(row.pid);
    processTreeData.value = [tree];
    treeVisible.value = true;
  } catch { treeVisible.value = false; }
}

async function handleKill() {
  if (!selectedPid.value) return;
  try {
    await killProcess(selectedPid.value);
    ElMessage.success(`Killed process ${selectedPid.value}`);
    await refreshData();
  } catch { ElMessage.error("Failed to kill process"); }
}

async function refreshData() {
  try {
    processes.value = await listProcesses();
    envVars.value = await getEnvVars();
    services.value = await listServices();
  } catch (e) { console.error("Failed to refresh data:", e); }
}

function openEnvDialog() {
  envForm.value = { name: "", value: "" };
  envDialogVisible.value = true;
}

async function saveEnvVar() {
  if (!envForm.value.name) { ElMessage.warning("Name is required"); return; }
  await apiSetEnvVar(envForm.value.name, envForm.value.value);
  envVars.value.push({ ...envForm.value });
  envDialogVisible.value = false;
  ElMessage.success("Environment variable saved");
}

async function handleStartService(name: string) {
  try {
    await apiStartService(name);
    ElMessage.success(`Started: ${name}`);
    await refreshData();
  } catch { ElMessage.error(`Failed to start: ${name}`); }
}

async function handleStopService(name: string) {
  try {
    await apiStopService(name);
    ElMessage.success(`Stopped: ${name}`);
    await refreshData();
  } catch { ElMessage.error(`Failed to stop: ${name}`); }
}

onMounted(() => { refreshData(); });
</script>

<style scoped>
.card-tabs { margin-bottom: 16px; }
.card-tab { background: var(--el-fill-color-lighter); border: 2px solid transparent; border-radius: 12px; padding: 16px; cursor: pointer; transition: all .2s; }
.card-tab:hover { border-color: var(--el-color-primary-light-5); }
.card-tab.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.card-tab-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.card-tab-title { font-size: 15px; font-weight: 600; }
.card-tab-info { font-size: 12px; color: var(--el-text-color-secondary); display: flex; gap: 12px; padding-left: 34px; }
.tab-panel { margin-top: 4px; }
.tab-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.env-value { font-size: 12px; color: var(--el-text-color-secondary); font-family: monospace; word-break: break-all; }
.metric-bar { display: flex; align-items: center; gap: 6px; background: var(--el-fill-color-lighter); border-radius: 4px; height: 18px; position: relative; overflow: hidden; }
.metric-fill { height: 100%; border-radius: 4px; transition: width .3s; }
.metric-fill.cpu { background: var(--el-color-primary); }
.metric-fill.mem { background: var(--el-color-success); }
.metric-text { position: absolute; left: 6px; font-size: 11px; color: var(--el-text-color-regular); white-space: nowrap; }
.tree-node { display: flex; gap: 12px; align-items: center; font-size: 13px; }
.tree-pid { font-weight: 600; color: var(--el-color-primary); width: 50px; }
.tree-name { font-weight: 500; width: 120px; }
.tree-cpu { color: var(--el-color-warning); width: 80px; }
.tree-mem { color: var(--el-color-success); }
:deep(.clickable-row) { cursor: pointer; }
</style>

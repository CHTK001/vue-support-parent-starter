<template>
  <div class="dsm tel-page">
    <div class="dsm-toolbar">
      <div class="dsm-toolbar-left">
        <ReIcon name="Setting" :size="18" class="dsm-title-icon dsm-nacos-icon" />
        <span class="dsm-title">Nacos 配置中心管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton size="small" @click="refresh"><template #icon><ReIcon name="Refresh" /></template>刷新</ReButton>
        <ReButton size="small" type="primary" @click="openCreate"><template #icon><ReIcon name="Plus" /></template>新建配置</ReButton>
      </div>
    </div>

    <div class="dsm-body">
      <div class="dsm-sidebar">
        <div class="dsm-tree">
          <div class="dsm-tree-node dsm-tree-root" @click="toggleNode('root')">
            <ReIcon :name="expandedNodes.has('root') ? 'ArrowDown' : 'ArrowRight'" size="12" />
            <ReIcon name="Setting" size="14" class="dsm-tree-icon dsm-nacos-icon" />
            <span class="dsm-tree-label">{{ connectionName }}</span>
          </div>
          <div v-if="expandedNodes.has('root')" class="dsm-tree-children">
            <div class="dsm-tree-node" @click="toggleNode('ns')">
              <ReIcon :name="expandedNodes.has('ns') ? 'ArrowDown' : 'ArrowRight'" size="12" />
              <ReIcon name="FolderOpened" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">命名空间</span>
              <span class="dsm-tree-count">{{ namespaces.length }}</span>
            </div>
            <div v-if="expandedNodes.has('ns')" class="dsm-tree-children">
              <div v-for="ns in namespaces" :key="ns.id" class="dsm-tree-node dsm-leaf-node" :class="{ active: activeNs === ns.id }" @click="selectNs(ns.id)">
                <ReIcon name="Folder" size="12" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ ns.name }}</span>
                <span class="dsm-tree-count">{{ ns.count }}</span>
              </div>
            </div>
            <div class="dsm-tree-node" @click="activeView = 'services'">
              <ReIcon name="Connection" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">服务列表</span>
            </div>
            <div class="dsm-tree-node" @click="activeView = 'clusters'">
              <ReIcon name="OfficeBuilding" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">集群管理</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dsm-content">
        <div class="dsm-info-card">
          <div class="dsm-info-row"><span class="dsm-info-label">连接地址</span><span class="dsm-info-value">{{ connectionInfo.host }}:{{ connectionInfo.port }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">命名空间</span><span class="dsm-info-value">{{ activeNsName }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">版本</span><span class="dsm-info-value">Nacos {{ connectionInfo.version }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">状态</span><ReTag type="success" size="small">已连接</ReTag></div>
        </div>

        <div v-if="activeView === 'configs'" class="dsm-section">
          <div class="dsm-section-title">
            配置列表
            <div class="dsm-section-actions">
              <ReInput v-model="searchKeyword" placeholder="搜索 Data ID" size="small" style="width: 200px" clearable />
            </div>
          </div>
          <ReTable :data="filteredConfigs" :columns="configColumns" :loading="loading" stripe border height="400px">
            <template #default="{ row }">
              <ReButton size="small" text @click="viewConfig(row)">查看</ReButton>
              <ReButton size="small" text type="primary" @click="editConfig(row)">编辑</ReButton>
              <ReButton size="small" text type="danger" @click="deleteConfig(row)">删除</ReButton>
            </template>
          </ReTable>
        </div>

        <div v-if="activeView === 'services'" class="dsm-section">
          <div class="dsm-section-title">服务列表</div>
          <ReTable :data="services" :columns="serviceColumns" :loading="loading" stripe border height="400px" />
        </div>

        <div v-if="activeView === 'clusters'" class="dsm-section">
          <div class="dsm-section-title">集群节点</div>
          <ReTable :data="clusters" :columns="clusterColumns" :loading="loading" stripe border height="400px" />
        </div>
      </div>
    </div>

    <ReDialog v-model="configVisible" :title="editingConfig ? '编辑配置' : '查看配置'" width="700px">
      <div class="dsm-config-form">
        <div class="dsm-form-row">
          <div class="dsm-form-item"><label>Data ID</label><ReInput v-model="form.dataId" :disabled="!!editingConfig" /></div>
          <div class="dsm-form-item"><label>Group</label><ReInput v-model="form.group" /></div>
        </div>
        <div class="dsm-form-item"><label>配置格式</label>
          <ReSelect v-model="form.format" style="width: 200px">
            <ReOption label="YAML" value="yaml" /><ReOption label="Properties" value="properties" /><ReOption label="JSON" value="json" /><ReOption label="XML" value="xml" />
          </ReSelect>
        </div>
        <div class="dsm-form-item"><label>配置内容</label>
          <textarea v-model="form.content" class="dsm-config-content" rows="12"></textarea>
        </div>
      </div>
      <template #footer>
        <ReButton @click="configVisible = false">关闭</ReButton>
        <ReButton v-if="editingConfig" type="primary" @click="saveConfig"><template #icon><ReIcon name="Check" /></template>保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const connectionName = ref("Nacos 配置中心");
const connectionInfo = reactive({ host: "127.0.0.1", port: 8848, version: "2.3" });
const expandedNodes = ref(new Set(["root", "ns"]));
const activeNs = ref("public");
const activeView = ref("configs");
const loading = ref(false);
const searchKeyword = ref("");

const namespaces = ref([
  { id: "public", name: "public", count: 45 },
  { id: "dev", name: "dev", count: 23 },
  { id: "prod", name: "prod", count: 67 },
]);

const configs = ref([
  { id: 1, dataId: "application.yaml", group: "DEFAULT_GROUP", format: "yaml", content: "server:\n  port: 8080\nspring:\n  application:\n    name: monitor-service", updatedAt: "2024-01-15 10:30:00" },
  { id: 2, dataId: "datasource.properties", group: "DEFAULT_GROUP", format: "properties", content: "spring.datasource.url=jdbc:mysql://localhost:3306/monitor\nspring.datasource.username=root", updatedAt: "2024-01-14 16:20:00" },
  { id: 3, dataId: "redis-config.json", group: "DEFAULT_GROUP", format: "json", content: '{\n  "host": "127.0.0.1",\n  "port": 6379,\n  "database": 0\n}', updatedAt: "2024-01-13 09:15:00" },
]);

const services = ref([
  { id: 1, name: "monitor-service", group: "DEFAULT_GROUP", instances: 3, healthy: 3, trigger: "N/A" },
  { id: 2, name: "gateway-service", group: "DEFAULT_GROUP", instances: 2, healthy: 2, trigger: "N/A" },
  { id: 3, name: "auth-service", group: "DEFAULT_GROUP", instances: 2, healthy: 1, trigger: "N/A" },
]);

const clusters = ref([
  { id: 1, node: "nacos-01", ip: "10.0.0.1", port: 8848, status: "UP", leader: true },
  { id: 2, node: "nacos-02", ip: "10.0.0.2", port: 8848, status: "UP", leader: false },
  { id: 3, node: "nacos-03", ip: "10.0.0.3", port: 8848, status: "DOWN", leader: false },
]);

const configColumns = [
  { prop: "dataId", label: "Data ID", minWidth: 200 },
  { prop: "group", label: "Group", width: 140 },
  { prop: "format", label: "格式", width: 100 },
  { prop: "updatedAt", label: "更新时间", width: 180 },
  { label: "操作", width: 180, fixed: "right" },
];
const serviceColumns = [
  { prop: "name", label: "服务名", minWidth: 180 },
  { prop: "group", label: "分组", width: 140 },
  { prop: "instances", label: "实例数", width: 100 },
  { prop: "healthy", label: "健康实例", width: 100 },
];
const clusterColumns = [
  { prop: "node", label: "节点名", width: 120 },
  { prop: "ip", label: "IP", width: 140 },
  { prop: "port", label: "端口", width: 80 },
  { prop: "status", label: "状态", width: 100 },
  { prop: "leader", label: "Leader", width: 80 },
];

const filteredConfigs = computed(() => {
  if (!searchKeyword.value) return configs.value;
  return configs.value.filter(c => c.dataId.includes(searchKeyword.value));
});

const activeNsName = computed(() => namespaces.value.find(n => n.id === activeNs.value)?.name || "public");

const configVisible = ref(false);
const editingConfig = ref(false);
const form = reactive({ dataId: "", group: "DEFAULT_GROUP", format: "yaml", content: "" });

function toggleNode(key: string) {
  if (expandedNodes.value.has(key)) expandedNodes.value.delete(key);
  else expandedNodes.value.add(key);
}

function selectNs(id: string) { activeNs.value = id; }

function viewConfig(row: any) {
  editingConfig.value = false;
  Object.assign(form, row);
  configVisible.value = true;
}

function editConfig(row: any) {
  editingConfig.value = true;
  Object.assign(form, row);
  configVisible.value = true;
}

function deleteConfig(row: any) {
  if (confirm(`确定删除配置 ${row.dataId} 吗？`)) {
    configs.value = configs.value.filter(c => c.id !== row.id);
  }
}

function openCreate() {
  editingConfig.value = true;
  Object.assign(form, { dataId: "", group: "DEFAULT_GROUP", format: "yaml", content: "" });
  configVisible.value = true;
}

function saveConfig() {
  if (editingConfig.value && form.dataId) {
    const idx = configs.value.findIndex(c => c.dataId === form.dataId);
    if (idx >= 0) configs.value[idx] = { ...configs.value[idx], ...form, updatedAt: new Date().toLocaleString() };
    else configs.value.push({ id: Date.now(), ...form, updatedAt: new Date().toLocaleString() });
  }
  configVisible.value = false;
}

function refresh() {
  loading.value = true;
  setTimeout(() => { loading.value = false; }, 500);
}

onMounted(() => {});
</script>

<style scoped>
.dsm { display: flex; flex-direction: column; height: 100%; min-height: 100%; }
.dsm-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 16px; }
.dsm-toolbar-left { display: flex; align-items: center; gap: 10px; }
.dsm-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.dsm-nacos-icon { color: #fbbf24; }
.dsm-toolbar-right { display: flex; gap: 8px; }
.dsm-body { display: flex; flex: 1; gap: 16px; overflow: hidden; }
.dsm-sidebar { width: 240px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow-y: auto; flex-shrink: 0; }
.dsm-tree { padding: 8px 0; }
.dsm-tree-node { display: flex; align-items: center; gap: 6px; padding: 6px 12px; cursor: pointer; transition: background 0.15s; }
.dsm-tree-node:hover { background: var(--bg-hover); }
.dsm-tree-node.active { background: var(--brand-50); color: var(--brand-600); }
.dsm-tree-root { font-weight: 600; }
.dsm-tree-children { padding-left: 16px; }
.dsm-tree-icon { flex-shrink: 0; }
.dsm-tree-label { flex: 1; font-size: 13px; color: var(--text-primary); }
.dsm-tree-count { font-size: 11px; color: var(--text-tertiary); background: var(--bg-fill); padding: 1px 6px; border-radius: 10px; }
.dsm-content { flex: 1; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.dsm-info-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 14px 16px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); }
.dsm-info-row { display: flex; flex-direction: column; gap: 4px; }
.dsm-info-label { font-size: 12px; color: var(--text-tertiary); }
.dsm-info-value { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.dsm-section { border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow: hidden; }
.dsm-section-title { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; font-size: 14px; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); }
.dsm-section-actions { display: flex; gap: 8px; }
.dsm-config-form { display: flex; flex-direction: column; gap: 14px; }
.dsm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.dsm-form-item { display: flex; flex-direction: column; gap: 6px; }
.dsm-form-item label { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.dsm-config-content { width: 100%; padding: 12px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 13px; border: 1px solid var(--border-default); border-radius: 6px; background: var(--bg-elevated); color: var(--text-primary); resize: vertical; outline: none; }
.dsm-config-content:focus { border-color: var(--brand-400); box-shadow: var(--focus-ring); }
</style>

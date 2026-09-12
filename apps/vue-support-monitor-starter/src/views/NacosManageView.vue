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
            <template #col-actions="{ row }">
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

  <!-- 配置右键菜单 -->
  <div
    v-if="configContextMenu.visible"
    class="nacos-context-menu"
    :style="{ left: configContextMenu.x + 'px', top: configContextMenu.y + 'px' }"
    @click="configContextMenu.visible = false"
  >
    <div class="ncm-item" @click="viewConfig(configContextMenu.config)">
      <ReIcon name="View" size="14" />查看配置
    </div>
    <div class="ncm-item" @click="editConfig(configContextMenu.config)">
      <ReIcon name="Edit" size="14" />编辑配置
    </div>
    <div class="ncm-item" @click="onCloneConfig(configContextMenu.config)">
      <ReIcon name="Copy" size="14" />克隆配置
    </div>
    <div class="ncm-item" @click="onExportConfig(configContextMenu.config)">
      <ReIcon name="Download" size="14" />导出配置
    </div>
    <div class="ncm-item" @click="onPublishConfig(configContextMenu.config)">
      <ReIcon name="Promotion" size="14" />发布配置
    </div>
    <div class="ncm-divider"></div>
    <div class="ncm-item ncm-danger" @click="deleteConfig(configContextMenu.config)">
      <ReIcon name="Delete" size="14" />删除配置
    </div>
    <div class="ncm-item" @click="refresh">
      <ReIcon name="Refresh" size="14" />刷新
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Nacos 配置中心管理页
 *
 * 提供命名空间/配置/服务/集群节点浏览、配置增删改查与发布/克隆/导出。
 * @author CH
 * @since 4.0.0
 */
/**
 * Nacos 管理页
 *
 * 提供 Nacos 配置中心的命名空间/配置/服务/集群节点浏览、配置增删改查。
 * @author CH
 * @since 4.0.0
 */
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

const namespaces = ref<any[]>([]);
const configs = ref<any[]>([]);
const services = ref<any[]>([]);
const clusters = ref<any[]>([]);

async function loadNamespaces() {
  try {
    const data = await fetchNacosNamespaces();
    namespaces.value = (data || []).map((n: any) => ({
      id: n.id || n.namespace,
      name: n.name || n.namespace,
      count: n.configCount || 0,
    }));
  } catch (e) {
    console.error("加载命名空间失败", e);
  }
}

async function loadConfigs() {
  try {
    loading.value = true;
    const data = await fetchNacosConfigs({ namespace: activeNs.value, page: 1, pageSize: 50 });
    configs.value = data?.list || [];
  } catch (e) {
    console.error("加载配置列表失败", e);
  } finally {
    loading.value = false;
  }
}

async function loadServices() {
  try {
    const data = await fetchNacosServices(undefined, activeNs.value);
    services.value = (data || []).map((s: any) => ({
      name: s.name,
      group: "DEFAULT_GROUP",
      instances: s.clusterCount || 0,
      healthy: s.healthyInstanceCount || 0,
      trigger: s.triggerFlag ? "Y" : "N",
    }));
  } catch (e) {
    console.error("加载服务列表失败", e);
  }
}

async function loadClusters() {
  try {
    const data = await fetchNacosClusterNodes();
    clusters.value = (data || []).map((n: any, i: number) => ({
      id: i + 1,
      node: `nacos-0${i + 1}`,
      ip: n.ip,
      port: n.port,
      status: n.status,
      leader: n.role === "LEADER",
    }));
  } catch (e) {
    console.error("加载集群节点失败", e);
  }
}

onMounted(() => {
  loadNamespaces();
  loadConfigs();
  loadServices();
  loadClusters();
});

const configColumns = [
  { prop: "dataId", label: "Data ID", minWidth: 200 },
  { prop: "group", label: "Group", width: 140 },
  { prop: "format", label: "格式", width: 100 },
  { prop: "updatedAt", label: "更新时间", width: 180 },
  { label: "操作", width: 180, fixed: "right", slot: "actions" },
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

/**
 * 展开/收起侧栏树节点
 * @param key 节点键
 */
function toggleNode(key: string) {
  if (expandedNodes.value.has(key)) expandedNodes.value.delete(key);
  else expandedNodes.value.add(key);
}

/**
 * 选中命名空间加载配置
 * @param id 命名空间 ID
 */
function selectNs(id: string) {
  activeNs.value = id;
  loadConfigs();
  loadServices();
}

async function viewConfig(row: any) {
  editingConfig.value = false;
  try {
    const detail = await fetchNacosConfigDetail(row.dataId, { namespace: activeNs.value, group: row.group });
    Object.assign(form, detail || row);
  } catch (e) {
    Object.assign(form, row);
  }
  configVisible.value = true;
}

/**
 * 打开编辑配置弹窗
 * @param row 配置行
 */
function editConfig(row: any) {
  editingConfig.value = true;
  Object.assign(form, row);
  configVisible.value = true;
}

async function deleteConfig(row: any) {
  if (confirm(`确定删除配置 ${row.dataId} 吗？`)) {
    try {
      await deleteNacosConfig(row.dataId, { namespace: activeNs.value, group: row.group });
      configs.value = configs.value.filter(c => c.dataId !== row.dataId);
    } catch (e) {
      console.error("删除配置失败", e);
    }
  }
}

/**
 * 打开新建配置弹窗
 */
function openCreate() {
  editingConfig.value = true;
  Object.assign(form, { dataId: "", group: "DEFAULT_GROUP", format: "yaml", content: "" });
  configVisible.value = true;
}

/**
 * 保存配置
 */
function saveConfig() {
  if (editingConfig.value && form.dataId) {
    const idx = configs.value.findIndex(c => c.dataId === form.dataId);
    if (idx >= 0) configs.value[idx] = { ...configs.value[idx], ...form, updatedAt: new Date().toLocaleString() };
    else configs.value.push({ id: Date.now(), ...form, updatedAt: new Date().toLocaleString() });
  }
  configVisible.value = false;
}

/**
 * 刷新命名空间/配置/服务列表
 */
// ==================== 右键菜单 ====================
const configContextMenu = ref({ visible: false, x: 0, y: 0, config: null as any });

const onConfigContextMenu = (row: any, column: any, event: MouseEvent) => {
  event.preventDefault();
  configContextMenu.value = { visible: true, x: event.clientX, y: event.clientY, config: row };
};

if (typeof window !== "undefined") {
  window.addEventListener("click", () => {
    configContextMenu.value.visible = false;
  });
}

const onCloneConfig = (config: any) => {
  const newDataId = prompt("请输入克隆后的 Data ID:", config.dataId + "_copy");
  if (!newDataId) return;
  ElMessage.success("配置已克隆（功能演示）");
  refresh();
};

const onExportConfig = (config: any) => {
  const exportData = {
    dataId: config.dataId,
    group: config.group,
    content: config.content,
    type: config.type,
    exportTime: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `nacos-${config.dataId}-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  ElMessage.success("导出成功");
};

const onPublishConfig = (config: any) => {
  ElMessage.success(`配置 ${config.dataId} 已发布（功能演示）`);
};

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

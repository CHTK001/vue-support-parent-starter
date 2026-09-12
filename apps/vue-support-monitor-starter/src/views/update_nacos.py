import io

with io.open('NacosManageView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修改导入部分，添加 Nacos API 导入
old_import = 'import { computed, onMounted, reactive, ref } from "vue";'
new_import = '''import { computed, onMounted, reactive, ref } from "vue";
import {
  fetchNacosNamespaces,
  fetchNacosConfigs,
  fetchNacosConfigDetail,
  saveNacosConfig,
  deleteNacosConfig,
  fetchNacosServices,
  fetchNacosClusterNodes,
} from "../monitorApi";'''
content = content.replace(old_import, new_import, 1)

# 2. 替换 mock 数据为响应式空数组 + onMounted 加载
old_data = '''const namespaces = ref([
  { id: "public", name: "public", count: 45 },
  { id: "dev", name: "dev", count: 23 },
  { id: "prod", name: "prod", count: 67 },
]);

const configs = ref([
  { id: 1, dataId: "application.yaml", group: "DEFAULT_GROUP", format: "yaml", content: "server:\\n  port: 8080\\nspring:\\n  application:\\n    name: monitor-service", updatedAt: "2024-01-15 10:30:00" },
  { id: 2, dataId: "datasource.properties", group: "DEFAULT_GROUP", format: "properties", content: "spring.datasource.url=jdbc:mysql://localhost:3306/monitor\\nspring.datasource.username=root", updatedAt: "2024-01-14 16:20:00" },
  { id: 3, dataId: "redis-config.json", group: "DEFAULT_GROUP", format: "json", content: '{\\n  "host": "127.0.0.1",\\n  "port": 6379,\\n  "database": 0\\n}', updatedAt: "2024-01-13 09:15:00" },
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
]);'''

new_data = '''const namespaces = ref<any[]>([]);
const configs = ref<any[]>([]);
const services = ref<any[]>([]);
const clusters = ref<any[]>([]);
const loading = ref(false);

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
});'''

content = content.replace(old_data, new_data, 1)

# 3. 修改 selectNs 函数，切换命名空间时重新加载配置
old_selectNs = 'function selectNs(id: string) { activeNs.value = id; }'
new_selectNs = '''function selectNs(id: string) {
  activeNs.value = id;
  loadConfigs();
  loadServices();
}'''
content = content.replace(old_selectNs, new_selectNs, 1)

# 4. 修改 viewConfig 函数，调用后端接口获取详情
old_viewConfig = '''function viewConfig(row: any) {
  editingConfig.value = false;
  Object.assign(form, row);
  configVisible.value = true;
}'''
new_viewConfig = '''async function viewConfig(row: any) {
  editingConfig.value = false;
  try {
    const detail = await fetchNacosConfigDetail(row.dataId, { namespace: activeNs.value, group: row.group });
    Object.assign(form, detail || row);
  } catch (e) {
    Object.assign(form, row);
  }
  configVisible.value = true;
}'''
content = content.replace(old_viewConfig, new_viewConfig, 1)

# 5. 修改 deleteConfig 函数，调用后端接口
old_deleteConfig = '''function deleteConfig(row: any) {
  if (confirm(`确定删除配置 ${row.dataId} 吗？`)) {
    configs.value = configs.value.filter(c => c.id !== row.id);
  }
}'''
new_deleteConfig = '''async function deleteConfig(row: any) {
  if (confirm(`确定删除配置 ${row.dataId} 吗？`)) {
    try {
      await deleteNacosConfig(row.dataId, { namespace: activeNs.value, group: row.group });
      configs.value = configs.value.filter(c => c.dataId !== row.dataId);
    } catch (e) {
      console.error("删除配置失败", e);
    }
  }
}'''
content = content.replace(old_deleteConfig, new_deleteConfig, 1)

# 6. 修改 saveConfig 函数，调用后端接口
old_saveConfig = '''function saveConfig() {
  if (!form.dataId) {
    alert("Data ID 不能为空");
    return;
  }
  if (editingConfig.value) {
    const idx = configs.value.findIndex(c => c.id === form.id);
    if (idx >= 0) configs.value[idx] = { ...form };
  } else {
    configs.value.push({ ...form, id: Date.now(), updatedAt: new Date().toISOString().slice(0, 19).replace("T", " ") });
  }
  configVisible.value = false;
}'''
new_saveConfig = '''async function saveConfig() {
  if (!form.dataId) {
    alert("Data ID 不能为空");
    return;
  }
  try {
    await saveNacosConfig({ ...form, namespace: activeNs.value });
    await loadConfigs();
    configVisible.value = false;
  } catch (e) {
    console.error("保存配置失败", e);
    alert("保存配置失败: " + (e as Error).message);
  }
}'''
content = content.replace(old_saveConfig, new_saveConfig, 1)

# 7. 修改 refresh 函数
old_refresh = '''function refresh() {
  // 模拟刷新
}'''
new_refresh = '''function refresh() {
  loadNamespaces();
  loadConfigs();
  loadServices();
  loadClusters();
}'''
content = content.replace(old_refresh, new_refresh, 1)

with io.open('NacosManageView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('NacosManageView.vue 已更新为调用真实后端接口')

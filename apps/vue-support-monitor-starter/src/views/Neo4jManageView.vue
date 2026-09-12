<template>
  <div class="dsm tel-page">
    <div class="dsm-toolbar">
      <div class="dsm-toolbar-left">
        <ReIcon name="Share" :size="18" class="dsm-title-icon dsm-neo4j-icon" />
        <span class="dsm-title">Neo4j 图数据库管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton size="small" @click="refresh"><template #icon><ReIcon name="Refresh" /></template>刷新</ReButton>
        <ReButton size="small" type="primary" @click="openCypher"><template #icon><ReIcon name="Search" /></template>Cypher 查询</ReButton>
      </div>
    </div>

    <div class="dsm-body">
      <div class="dsm-sidebar">
        <div class="dsm-tree">
          <div class="dsm-tree-node dsm-tree-root" @click="toggleNode('root')">
            <ReIcon :name="expandedNodes.has('root') ? 'ArrowDown' : 'ArrowRight'" size="12" />
            <ReIcon name="Share" size="14" class="dsm-tree-icon dsm-neo4j-icon" />
            <span class="dsm-tree-label">{{ connectionName }}</span>
          </div>
          <div v-if="expandedNodes.has('root')" class="dsm-tree-children">
            <div class="dsm-tree-node" @click="toggleNode('nodes')">
              <ReIcon :name="expandedNodes.has('nodes') ? 'ArrowDown' : 'ArrowRight'" size="12" />
              <ReIcon name="Circle" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">节点标签 (Labels)</span>
              <span class="dsm-tree-count">{{ nodeLabels.length }}</span>
            </div>
            <div v-if="expandedNodes.has('nodes')" class="dsm-tree-children">
              <div v-for="label in nodeLabels" :key="label" class="dsm-tree-node dsm-leaf-node" @click="selectLabel(label)">
                <ReIcon name="Circle" size="12" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ label }}</span>
              </div>
            </div>
            <div class="dsm-tree-node" @click="toggleNode('rels')">
              <ReIcon :name="expandedNodes.has('rels') ? 'ArrowDown' : 'ArrowRight'" size="12" />
              <ReIcon name="Right" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">关系类型 (Rels)</span>
              <span class="dsm-tree-count">{{ relTypes.length }}</span>
            </div>
            <div v-if="expandedNodes.has('rels')" class="dsm-tree-children">
              <div v-for="rel in relTypes" :key="rel" class="dsm-tree-node dsm-leaf-node" @click="selectRel(rel)">
                <ReIcon name="Right" size="12" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ rel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dsm-content">
        <div class="dsm-info-card">
          <div class="dsm-info-row"><span class="dsm-info-label">连接地址</span><span class="dsm-info-value">bolt://{{ connectionInfo.host }}:{{ connectionInfo.port }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">数据库</span><span class="dsm-info-value">{{ connectionInfo.database }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">版本</span><span class="dsm-info-value">Neo4j {{ connectionInfo.version }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">状态</span><ReTag type="success" size="small">已连接</ReTag></div>
        </div>

        <div class="dsm-stats-row">
          <div class="dsm-stat-card">
            <div class="dsm-stat-value">{{ stats.nodes }}</div>
            <div class="dsm-stat-label">节点总数</div>
          </div>
          <div class="dsm-stat-card">
            <div class="dsm-stat-value">{{ stats.relationships }}</div>
            <div class="dsm-stat-label">关系总数</div>
          </div>
          <div class="dsm-stat-card">
            <div class="dsm-stat-value">{{ nodeLabels.length }}</div>
            <div class="dsm-stat-label">节点标签</div>
          </div>
          <div class="dsm-stat-card">
            <div class="dsm-stat-value">{{ relTypes.length }}</div>
            <div class="dsm-stat-label">关系类型</div>
          </div>
        </div>

        <div class="dsm-section" v-if="activeLabel">
          <div class="dsm-section-title">{{ activeLabel }} - 节点列表</div>
          <ReTable :data="nodes" :columns="nodeColumns" :loading="loading" stripe border height="300px" />
        </div>

        <div v-if="!activeLabel" class="dsm-empty">
          <ReIcon name="Share" size="48" class="dsm-empty-icon" />
          <p>从左侧选择节点标签或关系类型查看详情</p>
        </div>
      </div>
    </div>

    <ReDialog v-model="cypherVisible" title="Cypher 查询" width="700px">
      <div class="dsm-query-area">
        <textarea v-model="cypherQuery" class="dsm-query-editor" placeholder="输入 Cypher 查询语句，例如：&#10;MATCH (n:Person)&#10;RETURN n.name, n.age&#10;LIMIT 10" rows="6"></textarea>
        <div class="dsm-query-result">
          <div class="dsm-query-header">查询结果</div>
          <ReTable v-if="queryResult.columns.length > 0" :data="queryResult.rows" :columns="queryResult.columns.map(c => ({ prop: c, label: c, minWidth: 120 }))" stripe border height="200px" />
          <ReEmpty v-else description="执行查询后显示结果" />
        </div>
      </div>
      <template #footer>
        <ReButton @click="cypherVisible = false">取消</ReButton>
        <ReButton type="primary" @click="executeCypher"><template #icon><ReIcon name="VideoPlay" /></template>执行查询</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const connectionName = ref("Neo4j 图数据库");
const connectionInfo = reactive({ host: "127.0.0.1", port: 7687, database: "neo4j", version: "5.12" });
const expandedNodes = ref(new Set(["root", "nodes"]));
const activeLabel = ref("");
const loading = ref(false);

const nodeLabels = ref(["Person", "Company", "Product", "Order", "Category"]);
const relTypes = ref(["WORKS_AT", "PURCHASED", "BELONGS_TO", "FRIEND_OF", "MANAGES"]);
const stats = reactive({ nodes: 15234, relationships: 45678 });

const nodes = ref<Record<string, unknown>[]>([]);
const nodeColumns = [
  { prop: "id", label: "ID", width: 80 },
  { prop: "name", label: "名称", minWidth: 150 },
  { prop: "properties", label: "属性", minWidth: 250 },
];

const cypherVisible = ref(false);
const cypherQuery = ref('MATCH (n:Person)\nRETURN n.name, n.age\nLIMIT 10');
const queryResult = reactive({ columns: [] as string[], rows: [] as Record<string, unknown>[] });

function toggleNode(key: string) {
  if (expandedNodes.value.has(key)) expandedNodes.value.delete(key);
  else expandedNodes.value.add(key);
}

function selectLabel(label: string) {
  activeLabel.value = label;
  loading.value = true;
  setTimeout(() => {
    nodes.value = [
      { id: 1, name: "张三", properties: "{age: 30, city: '北京'}" },
      { id: 2, name: "李四", properties: "{age: 25, city: '上海'}" },
      { id: 3, name: "王五", properties: "{age: 35, city: '广州'}" },
    ];
    loading.value = false;
  }, 300);
}

function selectRel(rel: string) {
  cypherQuery.value = `MATCH ()-[r:${rel}]->()\nRETURN count(r) as count`;
  cypherVisible.value = true;
}

function refresh() {
  loading.value = true;
  setTimeout(() => { loading.value = false; }, 500);
}

function openCypher() { cypherVisible.value = true; }

function executeCypher() {
  queryResult.columns = ["name", "age", "city"];
  queryResult.rows = [
    { name: "张三", age: 30, city: "北京" },
    { name: "李四", age: 25, city: "上海" },
  ];
}

onMounted(() => {
  if (nodeLabels.value.length > 0) selectLabel(nodeLabels.value[0]);
});
</script>

<style scoped>
.dsm { display: flex; flex-direction: column; height: 100%; min-height: 100%; }
.dsm-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 16px; }
.dsm-toolbar-left { display: flex; align-items: center; gap: 10px; }
.dsm-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.dsm-neo4j-icon { color: #a78bfa; }
.dsm-toolbar-right { display: flex; gap: 8px; }
.dsm-body { display: flex; flex: 1; gap: 16px; overflow: hidden; }
.dsm-sidebar { width: 260px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow-y: auto; flex-shrink: 0; }
.dsm-tree { padding: 8px 0; }
.dsm-tree-node { display: flex; align-items: center; gap: 6px; padding: 6px 12px; cursor: pointer; transition: background 0.15s; }
.dsm-tree-node:hover { background: var(--bg-hover); }
.dsm-tree-node.active { background: var(--brand-50); color: var(--brand-600); }
.dsm-tree-root { font-weight: 600; }
.dsm-tree-children { padding-left: 16px; }
.dsm-tree-icon { flex-shrink: 0; }
.dsm-tree-label { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); }
.dsm-tree-count { font-size: 11px; color: var(--text-tertiary); background: var(--bg-fill); padding: 1px 6px; border-radius: 10px; }
.dsm-content { flex: 1; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.dsm-info-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 14px 16px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); }
.dsm-info-row { display: flex; flex-direction: column; gap: 4px; }
.dsm-info-label { font-size: 12px; color: var(--text-tertiary); }
.dsm-info-value { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.dsm-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.dsm-stat-card { padding: 16px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); text-align: center; }
.dsm-stat-value { font-size: 24px; font-weight: 700; color: var(--brand-600); }
.dsm-stat-label { font-size: 12px; color: var(--text-tertiary); margin-top: 4px; }
.dsm-section { border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow: hidden; }
.dsm-section-title { padding: 10px 14px; font-size: 14px; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); }
.dsm-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--text-tertiary); }
.dsm-empty-icon { opacity: 0.3; }
.dsm-query-area { display: flex; flex-direction: column; gap: 12px; }
.dsm-query-editor { width: 100%; padding: 12px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 13px; border: 1px solid var(--border-default); border-radius: 6px; background: var(--bg-elevated); color: var(--text-primary); resize: vertical; outline: none; }
.dsm-query-editor:focus { border-color: var(--brand-400); box-shadow: var(--focus-ring); }
.dsm-query-result { border: 1px solid var(--border-subtle); border-radius: 6px; overflow: hidden; }
.dsm-query-header { padding: 8px 12px; font-size: 13px; font-weight: 500; color: var(--text-secondary); background: var(--bg-fill); border-bottom: 1px solid var(--border-subtle); }
</style>

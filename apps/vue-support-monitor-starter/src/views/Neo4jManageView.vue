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
        <!-- 视图切换 -->
        <div class="neo4j-view-tabs">
          <button class="nvt-btn" :class="{ active: neo4jView === 'overview' }" @click="neo4jView = 'overview'">概览</button>
          <button class="nvt-btn" :class="{ active: neo4jView === 'graph' }" @click="neo4jView = 'graph'">图可视化</button>
          <button class="nvt-btn" :class="{ active: neo4jView === 'nodes' }" @click="neo4jView = 'nodes'">节点列表</button>
          <button class="nvt-btn" :class="{ active: neo4jView === 'rels' }" @click="neo4jView = 'rels'">关系列表</button>
        </div>

        <!-- 概览视图 -->
        <div v-show="neo4jView === 'overview'">
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
          <ReTable :data="nodes" :columns="nodeColumns" :loading="loading" stripe border height="300px" @row-click="onNodeClick" />
        </div>
        </div>

        <!-- 图可视化视图 -->
        <div v-show="neo4jView === 'graph'" class="neo4j-graph-view">
          <div class="ngv-toolbar">
            <span>节点关系图（示意）</span>
            <ReButton size="small" @click="renderGraph">
              <template #icon><ReIcon name="Refresh" /></template>重新渲染
            </ReButton>
          </div>
          <svg class="ngv-svg" viewBox="0 0 800 500">
            <!-- 关系线 -->
            <line v-for="(rel, idx) in graphEdges" :key="'e'+idx"
              :x1="rel.x1" :y1="rel.y1" :x2="rel.x2" :y2="rel.y2"
              stroke="var(--border-default, #94a3b8)" stroke-width="1.5" stroke-dasharray="4,2" />
            <!-- 节点 -->
            <g v-for="(node, idx) in graphNodes" :key="'n'+idx" :transform="`translate(${node.x}, ${node.y})`" @click="onGraphNodeClick(node)" style="cursor:pointer">
              <circle r="30" :fill="node.color" stroke="var(--primary, #3b82f6)" stroke-width="2" />
              <text text-anchor="middle" dy="5" fill="white" font-size="11" font-weight="600">{{ node.label }}</text>
            </g>
            <!-- 关系标签 -->
            <text v-for="(rel, idx) in graphEdges" :key="'rl'+idx"
              :x="(rel.x1 + rel.x2) / 2" :y="(rel.y1 + rel.y2) / 2 - 5"
              text-anchor="middle" font-size="10" fill="var(--text-secondary, #64748b)">{{ rel.type }}</text>
          </svg>
          <div class="ngv-legend">
            <span v-for="(color, label) in nodeColors" :key="label" class="ngv-legend-item">
              <span class="ngv-legend-dot" :style="{ background: color }"></span>{{ label }}
            </span>
          </div>
        </div>

        <!-- 关系列表视图 -->
        <div v-show="neo4jView === 'rels'" class="neo4j-rels-view">
          <div class="dsm-section-title">
            关系类型列表
            <div class="dsm-title-actions">
              <ReButton size="small" type="primary" @click="openCreateRel">
                <template #icon><ReIcon name="Plus" /></template>新建关系
              </ReButton>
            </div>
          </div>
          <ReTable :data="relationshipTypes" :columns="relColumns" :loading="loading" stripe border height="400px">
            <template #col-count="{ row }">
              <ReTag size="small">{{ row.count || '—' }}</ReTag>
            </template>
          </ReTable>
        </div>

        <!-- 节点详情弹窗 -->
        <ReDialog v-model="nodeDetailVisible" title="节点详情" width="500px">
          <div v-if="selectedNode" class="node-detail">
            <div class="nd-row"><span class="nd-label">标签：</span><span class="nd-value">{{ selectedNode.label }}</span></div>
            <div class="nd-row"><span class="nd-label">ID：</span><span class="nd-value">{{ selectedNode.id }}</span></div>
            <div class="nd-row"><span class="nd-label">属性：</span></div>
            <pre class="nd-props">{{ JSON.stringify(selectedNode.properties || {}, null, 2) }}</pre>
          </div>
        </ReDialog>

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

  <!-- 新建节点弹窗 -->
  <ReDialog v-model="createNodeVisible" title="新建节点" width="500px">
    <ReForm label-width="100px">
      <ReFormItem label="节点标签" required>
        <ReInput v-model="newNodeLabel" placeholder="例如：Person、Movie" />
      </ReFormItem>
      <ReFormItem label="节点属性(JSON)">
        <ReTextarea v-model="newNodeProps" :rows="6" placeholder='{"name": "张三", "age": 25}' />
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="createNodeVisible = false">取消</ReButton>
      <ReButton type="primary" :loading="creatingNode" @click="createNode">创建</ReButton>
    </template>
  </ReDialog>

  <!-- 新建关系弹窗 -->
  <ReDialog v-model="createRelVisible" title="新建关系" width="500px">
    <ReForm label-width="100px">
      <ReFormItem label="关系类型" required>
        <ReInput v-model="newRelType" placeholder="例如：ACTED_IN、DIRECTED" />
      </ReFormItem>
      <ReFormItem label="起始节点ID" required>
        <ReInput v-model="newRelFrom" placeholder="起始节点的 ID" />
      </ReFormItem>
      <ReFormItem label="目标节点ID" required>
        <ReInput v-model="newRelTo" placeholder="目标节点的 ID" />
      </ReFormItem>
      <ReFormItem label="关系属性(JSON)">
        <ReTextarea v-model="newRelProps" :rows="4" placeholder='{"role": "主角", "year": 2023}' />
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="createRelVisible = false">取消</ReButton>
      <ReButton type="primary" :loading="creatingRel" @click="createRel">创建</ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * Neo4j 管理页
 *
 * 提供 Neo4j 图库的标签/关系类型浏览、连接测试与 Cypher 查询执行。
 * @author CH
 * @since 4.0.0
 */
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

// ==================== 图可视化 ====================
const neo4jView = ref<'overview' | 'graph' | 'nodes' | 'rels'>('overview');
const graphNodes = ref<any[]>([]);
const graphEdges = ref<any[]>([]);
const nodeDetailVisible = ref(false);
const selectedNode = ref<any>(null);
const nodeColors: Record<string, string> = {
  'Person': '#3b82f6',
  'Movie': '#8b5cf6',
  'Company': '#10b981',
  'Product': '#f59e0b',
  'Order': '#ef4444',
  'User': '#06b6d4',
  'default': '#64748b',
};

const renderGraph = () => {
  // 基于节点标签生成示意图
  const labels = nodeLabels.value.slice(0, 6);
  const centerX = 400, centerY = 250, radius = 150;
  graphNodes.value = labels.map((label, idx) => {
    const angle = (idx / labels.length) * Math.PI * 2 - Math.PI / 2;
    return {
      label: label.substring(0, 8),
      fullLabel: label,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      color: nodeColors[label] || nodeColors['default'],
      id: idx,
      properties: { label, sample: '...' },
    };
  });
  // 生成关系边（所有节点两两连接）
  graphEdges.value = [];
  for (let i = 0; i < graphNodes.value.length; i++) {
    for (let j = i + 1; j < graphNodes.value.length; j++) {
      graphEdges.value.push({
        x1: graphNodes.value[i].x,
        y1: graphNodes.value[i].y,
        x2: graphNodes.value[j].x,
        y2: graphNodes.value[j].y,
        type: relationshipTypes.value[(i + j) % relationshipTypes.value.length]?.substring(0, 6) || 'REL',
      });
    }
  }
};

const onNodeClick = (row: any) => {
  selectedNode.value = { ...row, properties: row };
  nodeDetailVisible.value = true;
};

const onGraphNodeClick = (node: any) => {
  selectedNode.value = node;
  nodeDetailVisible.value = true;
};

// ==================== 新建节点 ====================
const createNodeVisible = ref(false);
const newNodeLabel = ref("");
const newNodeProps = ref("{}");
const creatingNode = ref(false);

const openCreateNode = () => {
  newNodeLabel.value = "";
  newNodeProps.value = "{}";
  createNodeVisible.value = true;
};

const createNode = async () => {
  if (!newNodeLabel.value.trim()) {
    ElMessage.warning("请输入节点标签");
    return;
  }
  creatingNode.value = true;
  try {
    let props = {};
    try {
      props = JSON.parse(newNodeProps.value);
    } catch {
      ElMessage.error("属性 JSON 格式错误");
      return;
    }
    // 构建 Cypher 创建节点语句
    const propsStr = Object.entries(props).map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : v}`).join(", ");
    const cypher = `CREATE (n:${newNodeLabel.value} {${propsStr}}) RETURN n`;
    ElMessage.success("节点创建成功（Cypher: " + cypher.substring(0, 50) + "...)");
    createNodeVisible.value = false;
    // 刷新节点列表
    if (!nodeLabels.value.includes(newNodeLabel.value)) {
      nodeLabels.value.push(newNodeLabel.value);
    }
  } catch (e) {
    ElMessage.error(`创建失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    creatingNode.value = false;
  }
};

// ==================== 新建关系 ====================
const createRelVisible = ref(false);
const newRelType = ref("");
const newRelFrom = ref("");
const newRelTo = ref("");
const newRelProps = ref("{}");
const creatingRel = ref(false);

const openCreateRel = () => {
  newRelType.value = "";
  newRelFrom.value = "";
  newRelTo.value = "";
  newRelProps.value = "{}";
  createRelVisible.value = true;
};

const createRel = async () => {
  if (!newRelType.value.trim() || !newRelFrom.value.trim() || !newRelTo.value.trim()) {
    ElMessage.warning("请填写关系类型和节点ID");
    return;
  }
  creatingRel.value = true;
  try {
    let props = {};
    try {
      props = JSON.parse(newRelProps.value);
    } catch {
      ElMessage.error("属性 JSON 格式错误");
      return;
    }
    // 构建 Cypher 创建关系语句
    const propsStr = Object.entries(props).map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : v}`).join(", ");
    const cypher = `MATCH (a), (b) WHERE id(a) = ${newRelFrom.value} AND id(b) = ${newRelTo.value} CREATE (a)-[r:${newRelType.value} {${propsStr}}]->(b) RETURN r`;
    ElMessage.success("关系创建成功（Cypher: " + cypher.substring(0, 50) + "...)");
    createRelVisible.value = false;
    // 刷新关系类型列表
    if (!relationshipTypes.value.includes(newRelType.value)) {
      relationshipTypes.value.push(newRelType.value);
    }
  } catch (e) {
    ElMessage.error(`创建失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    creatingRel.value = false;
  }
};

// 关系列定义
const relColumns = [
  { prop: 'type', label: '关系类型', minWidth: 200 },
  { prop: 'count', label: '数量', width: 120, slot: 'count' },
];
const cypherQuery = ref('MATCH (n:Person)\nRETURN n.name, n.age\nLIMIT 10');
const queryResult = reactive({ columns: [] as string[], rows: [] as Record<string, unknown>[] });

/**
 * 展开/收起侧栏树节点
 * @param key 节点键
 */
function toggleNode(key: string) {
  if (expandedNodes.value.has(key)) expandedNodes.value.delete(key);
  else expandedNodes.value.add(key);
}

/**
 * 选中标签
 * @param label 标签名
 */
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

/**
 * 选中关系类型
 * @param rel 关系类型
 */
function selectRel(rel: string) {
  cypherQuery.value = `MATCH ()-[r:${rel}]->()\nRETURN count(r) as count`;
  cypherVisible.value = true;
}

/**
 * 刷新标签/关系类型列表
 */
function refresh() {
  loading.value = true;
  setTimeout(() => { loading.value = false; }, 500);
}

/**
 * 打开 Cypher 查询面板
 */
function openCypher() { cypherVisible.value = true; }

/**
 * 执行 Cypher 查询
 */
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

/* Neo4j 视图切换 */
.neo4j-view-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  padding-bottom: 8px;
}
.nvt-btn {
  padding: 6px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
}
.nvt-btn:hover { background: var(--bg-hover, #f1f5f9); }
.nvt-btn.active {
  background: var(--primary, #3b82f6);
  color: white;
}

/* 图可视化 */
.neo4j-graph-view {
  background: var(--bg-container, #ffffff);
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  border-radius: 8px;
  overflow: hidden;
}
.ngv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}
.ngv-svg {
  width: 100%;
  height: 450px;
  background: var(--bg-subtle, #f8fafc);
}
.ngv-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
}
.ngv-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary, #64748b);
}
.ngv-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* 节点详情 */
.node-detail { padding: 8px 0; }
.nd-row {
  display: flex;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.1));
}
.nd-label { width: 80px; color: var(--text-secondary, #64748b); font-size: 13px; }
.nd-value { flex: 1; font-size: 13px; font-family: monospace; }
.nd-props {
  background: var(--bg-subtle, #f8fafc);
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  border-radius: 6px;
  padding: 12px;
  font-family: monospace;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  margin-top: 8px;
}
.dsm-query-area { display: flex; flex-direction: column; gap: 12px; }
.dsm-query-editor { width: 100%; padding: 12px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 13px; border: 1px solid var(--border-default); border-radius: 6px; background: var(--bg-elevated); color: var(--text-primary); resize: vertical; outline: none; }
.dsm-query-editor:focus { border-color: var(--brand-400); box-shadow: var(--focus-ring); }
.dsm-query-result { border: 1px solid var(--border-subtle); border-radius: 6px; overflow: hidden; }
.dsm-query-header { padding: 8px 12px; font-size: 13px; font-weight: 500; color: var(--text-secondary); background: var(--bg-fill); border-bottom: 1px solid var(--border-subtle); }

/* 右键菜单 */
.influx-context-menu, .neo4j-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  background: var(--bg-container, #ffffff);
  border: 1px solid var(--border-default, rgba(148, 163, 184, 0.3));
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
  padding: 4px;
}
.icm-item, .n4j-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-primary, #1e293b);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.icm-item:hover, .n4j-item:hover { background: var(--bg-hover, #f1f5f9); }
.icm-item.icm-danger, .n4j-item.n4j-danger { color: #ef4444; }
.icm-item.icm-danger:hover, .n4j-item.n4j-danger:hover { background: rgba(239, 68, 68, 0.1); }
.icm-divider, .n4j-divider {
  height: 1px;
  margin: 4px 8px;
  background: var(--border-subtle, rgba(148, 163, 184, 0.2));
}
</style>


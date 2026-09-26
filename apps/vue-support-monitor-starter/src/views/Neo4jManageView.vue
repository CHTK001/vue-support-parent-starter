<template>
  <div class="dsm tel-page">
    <div class="dsm-toolbar">
      <div class="dsm-toolbar-left">
        <ReIcon name="Share" :size="18" class="dsm-title-icon dsm-neo4j-icon" />
        <span class="dsm-title">Neo4j 图数据库管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton size="small" @click="openCreateNode"><template #icon><ReIcon name="Plus" /></template>新建节点</ReButton>
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
          <div class="dsm-info-row"><span class="dsm-info-label">状态</span><ReTag :type="connected ? 'success' : 'danger'" size="small">{{ connected ? "已连接" : "未连接" }}</ReTag></div>
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
          <p>{{ emptyText }}</p>
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
 * 数据全部来自后端 `/ms/monitor/neo4j/*`，数据源由路由 `datasourceId` 指定。
 * @author CH
 * @since 4.0.0
 */
import { computed, ref, reactive, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  executeNeo4jQuery,
  fetchNeo4jLabels,
  fetchNeo4jRelationships,
  testNeo4jConnection,
  type Neo4jLabel,
  type Neo4jRelationship
} from "../monitorApi";
import { useExternalDatasource } from "../utils/externalDatasource";

const route = useRoute();
const { datasourceId, datasource, error: datasourceError } = useExternalDatasource(
  () => route.query,
  "neo4j",
  "Neo4j"
);

// 连接信息
const connectionName = computed(() => datasource.value?.name ?? "Neo4j 图数据库");
const connectionInfo = reactive({ host: "-", port: 0, database: "-", version: "-" });
const connected = ref(false);

const emptyText = computed(() =>
  datasourceError.value
    ? datasourceError.value
    : "从左侧选择节点标签或关系类型查看详情"
);

const expandedNodes = ref(new Set(["root", "nodes"]));
const activeLabel = ref("");
const loading = ref(false);

const labelList = ref<Neo4jLabel[]>([]);
const relList = ref<Neo4jRelationship[]>([]);
/** 侧栏树中的标签名 / 关系类型名 */
const nodeLabels = computed(() => labelList.value.map(l => l.name));
const relTypes = computed(() => relList.value.map(r => r.type));
/** 关系列表视图数据（关系类型 + 数量） */
const relationshipTypes = computed(() =>
  relList.value.map(r => ({ type: r.type, count: r.relationshipCount }))
);
const stats = reactive({ nodes: 0, relationships: 0 });

const nodes = ref<Record<string, unknown>[]>([]);
const nodeColumns = [
  { prop: "id", label: "ID", width: 80 },
  { prop: "name", label: "名称", minWidth: 150 },
  { prop: "properties", label: "属性", minWidth: 250 }
];

const cypherVisible = ref(false);
const cypherLoading = ref(false);
const cypherQuery = ref("MATCH (n)\nRETURN labels(n) AS labels, properties(n) AS properties\nLIMIT 10");
const queryResult = reactive({ columns: [] as string[], rows: [] as Record<string, unknown>[] });

// ==================== 图可视化 ====================
const neo4jView = ref<"overview" | "graph" | "nodes" | "rels">("overview");
const graphNodes = ref<any[]>([]);
const graphEdges = ref<any[]>([]);
const nodeDetailVisible = ref(false);
const selectedNode = ref<any>(null);
const nodeColors: Record<string, string> = {
  Person: "#3b82f6",
  Movie: "#8b5cf6",
  Company: "#10b981",
  Product: "#f59e0b",
  Order: "#ef4444",
  User: "#06b6d4",
  default: "#64748b"
};

/** 图布局常量（与模板中的 viewBox 对应） */
const GRAPH_CENTER_X = 400;
const GRAPH_CENTER_Y = 250;
const GRAPH_RADIUS = 180;

/**
 * 按真实采样数据渲染节点关系图
 *
 * <p>取一批真实边（{@code MATCH (a)-[r]->(b)}），节点按环形布局，
 * 只保留两端都在采样范围内的边。采样为空时退化为「标签环」示意。</p>
 */
const renderGraph = async () => {
  if (!datasourceId.value) {
    graphNodes.value = [];
    graphEdges.value = [];
    return;
  }
  try {
    const result = await executeNeo4jQuery(
      "MATCH (a)-[r]->(b) RETURN id(a) AS source, labels(a) AS sourceLabels, id(b) AS target, labels(b) AS targetLabels, type(r) AS type LIMIT 80",
      datasourceId.value
    );
    const rows = result?.rows ?? [];
    const labelOf = (value: unknown) => {
      const list = Array.isArray(value) ? value : [];
      return list.length > 0 ? String(list[0]) : "default";
    };
    const ids: number[] = [];
    for (const row of rows) {
      for (const key of ["source", "target"]) {
        const id = Number(row[key]);
        if (Number.isFinite(id) && !ids.includes(id)) ids.push(id);
      }
    }
    const positions = new Map<number, { x: number; y: number }>();
    graphNodes.value = ids.slice(0, 40).map((id, idx) => {
      const row = rows.find(r => Number(r.source) === id || Number(r.target) === id);
      const label = labelOf(row?.sourceLabels ?? row?.targetLabels);
      const angle = (idx / Math.max(1, Math.min(ids.length, 40))) * Math.PI * 2 - Math.PI / 2;
      const point = {
        x: GRAPH_CENTER_X + GRAPH_RADIUS * Math.cos(angle),
        y: GRAPH_CENTER_Y + GRAPH_RADIUS * Math.sin(angle)
      };
      positions.set(id, point);
      return {
        id,
        label: label.substring(0, 8),
        fullLabel: label,
        x: point.x,
        y: point.y,
        color: nodeColors[label] ?? nodeColors.default,
        properties: { neo4jId: id, label }
      };
    });
    graphEdges.value = rows
      .map(row => {
        const from = positions.get(Number(row.source));
        const to = positions.get(Number(row.target));
        if (!from || !to) return null;
        return { x1: from.x, y1: from.y, x2: to.x, y2: to.y, type: String(row.type ?? "") };
      })
      .filter((edge): edge is { x1: number; y1: number; x2: number; y2: number; type: string } => !!edge);
  } catch (e) {
    graphNodes.value = [];
    graphEdges.value = [];
    ElMessage.error(`图数据加载失败：${(e as Error)?.message ?? String(e)}`);
  }
};

/**
 * 节点列表行点击
 * @param row 节点行
 */
const onNodeClick = (row: any) => {
  selectedNode.value = { ...row, properties: row.properties };
  nodeDetailVisible.value = true;
};

/**
 * 图中节点点击
 * @param node 图节点
 */
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

/**
 * 解析 JSON 属性并转成 Cypher 属性字面量
 * @param text JSON 文本
 * @returns Cypher 属性字面量
 * @throws Error JSON 非法
 */
function toCypherProps(text: string): string {
  const parsed = JSON.parse(text || "{}");
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("属性必须是 JSON 对象");
  }
  return Object.entries(parsed)
    .map(([key, value]) => {
      const literal =
        typeof value === "string"
          ? `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`
          : JSON.stringify(value);
      return `${/\W/.test(key) ? `\`${key}\`` : key}: ${literal}`;
    })
    .join(", ");
}

/**
 * 通过 Cypher 创建节点
 */
const createNode = async () => {
  if (!newNodeLabel.value.trim()) {
    ElMessage.warning("请输入节点标签");
    return;
  }
  if (!datasourceId.value) {
    ElMessage.warning(datasourceError.value || "请先选择数据源");
    return;
  }
  creatingNode.value = true;
  try {
    const cypher = `CREATE (n:${newNodeLabel.value.trim()} {${toCypherProps(newNodeProps.value)}}) RETURN n`;
    await executeNeo4jQuery(cypher, datasourceId.value);
    ElMessage.success("节点创建成功");
    createNodeVisible.value = false;
    await loadLabels();
  } catch (e) {
    ElMessage.error(`创建失败: ${(e as Error)?.message ?? String(e)}`);
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

/**
 * 通过 Cypher 创建关系
 */
const createRel = async () => {
  if (!newRelType.value.trim() || !newRelFrom.value.trim() || !newRelTo.value.trim()) {
    ElMessage.warning("请填写关系类型和节点ID");
    return;
  }
  if (!datasourceId.value) {
    ElMessage.warning(datasourceError.value || "请先选择数据源");
    return;
  }
  creatingRel.value = true;
  try {
    const from = Number(newRelFrom.value);
    const to = Number(newRelTo.value);
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      ElMessage.warning("起始/目标节点ID必须是数字");
      return;
    }
    const cypher = `MATCH (a), (b) WHERE id(a) = ${from} AND id(b) = ${to} CREATE (a)-[r:${newRelType.value.trim()} {${toCypherProps(newRelProps.value)}}]->(b) RETURN r`;
    await executeNeo4jQuery(cypher, datasourceId.value);
    ElMessage.success("关系创建成功");
    createRelVisible.value = false;
    await loadRelationships();
  } catch (e) {
    ElMessage.error(`创建失败: ${(e as Error)?.message ?? String(e)}`);
  } finally {
    creatingRel.value = false;
  }
};

// 关系列定义
const relColumns = [
  { prop: "type", label: "关系类型", minWidth: 200 },
  { prop: "count", label: "数量", width: 120, slot: "count" }
];

/**
 * 展开/收起侧栏树节点
 * @param key 节点键
 */
function toggleNode(key: string) {
  if (expandedNodes.value.has(key)) expandedNodes.value.delete(key);
  else expandedNodes.value.add(key);
}

/**
 * 加载标签与关系类型
 */
async function loadLabels() {
  if (!datasourceId.value) return;
  labelList.value = (await fetchNeo4jLabels(datasourceId.value)) ?? [];
  stats.nodes = labelList.value.reduce((sum, item) => sum + (item.nodeCount ?? 0), 0);
}

/**
 * 加载关系类型
 */
async function loadRelationships() {
  if (!datasourceId.value) return;
  relList.value = (await fetchNeo4jRelationships(datasourceId.value)) ?? [];
  stats.relationships = relList.value.reduce(
    (sum, item) => sum + (item.relationshipCount ?? 0),
    0
  );
}

/**
 * 加载选中标签下的节点
 */
async function loadNodes() {
  if (!datasourceId.value || !activeLabel.value) {
    nodes.value = [];
    return;
  }
  loading.value = true;
  try {
    const cypher = `MATCH (n:\`${activeLabel.value.replace(/`/g, "")}\`) RETURN id(n) AS id, properties(n) AS properties LIMIT 200`;
    const result = await executeNeo4jQuery(cypher, datasourceId.value);
    nodes.value = (result?.rows ?? []).map(row => {
      const properties = (row.properties ?? {}) as Record<string, unknown>;
      const nameKey = ["name", "title", "label", "code", "id"].find(
        key => properties[key] !== undefined && properties[key] !== null
      );
      return {
        id: row.id,
        name: nameKey ? String(properties[nameKey]) : "-",
        properties: JSON.stringify(properties)
      };
    });
  } catch (e) {
    nodes.value = [];
    ElMessage.error(`节点加载失败：${(e as Error)?.message ?? String(e)}`);
  } finally {
    loading.value = false;
  }
}

/**
 * 选中标签
 * @param label 标签名
 */
function selectLabel(label: string) {
  activeLabel.value = label;
  loadNodes();
}

/**
 * 选中关系类型
 * @param rel 关系类型
 */
function selectRel(rel: string) {
  cypherQuery.value = `MATCH ()-[r:\`${rel}\`]->()\nRETURN count(r) AS count`;
  cypherVisible.value = true;
}

/**
 * 探测连通性并回填版本
 */
async function probeConnection() {
  const info = datasource.value;
  if (!info) {
    connected.value = false;
    connectionInfo.version = "-";
    return;
  }
  connectionInfo.host = info.host ?? "-";
  connectionInfo.port = info.port ?? 0;
  connectionInfo.database = info.database ?? "neo4j";
  try {
    const result = await testNeo4jConnection({
      host: info.host,
      port: info.port,
      username: info.username,
      password: info.password,
      database: info.database
    });
    connected.value = !!result?.connected;
    connectionInfo.version = result?.version || "-";
  } catch (e) {
    connected.value = false;
    connectionInfo.version = "-";
    ElMessage.error(`连接测试失败：${(e as Error)?.message ?? String(e)}`);
  }
}

/**
 * 刷新标签/关系类型列表
 */
async function refresh() {
  loading.value = true;
  try {
    await probeConnection();
    await Promise.all([loadLabels(), loadRelationships()]);
    if (activeLabel.value && !nodeLabels.value.includes(activeLabel.value)) {
      activeLabel.value = "";
    }
    if (!activeLabel.value && nodeLabels.value.length > 0) {
      activeLabel.value = nodeLabels.value[0];
    }
    await loadNodes();
    await renderGraph();
  } catch (e) {
    ElMessage.error(`刷新失败：${(e as Error)?.message ?? String(e)}`);
  } finally {
    loading.value = false;
  }
}

/**
 * 打开 Cypher 查询面板
 */
function openCypher() {
  cypherVisible.value = true;
}

/**
 * 执行 Cypher 查询
 */
async function executeCypher() {
  if (!cypherQuery.value.trim()) {
    ElMessage.warning("请输入 Cypher 查询语句");
    return;
  }
  if (!datasourceId.value) {
    ElMessage.warning(datasourceError.value || "请先选择数据源");
    return;
  }
  cypherLoading.value = true;
  try {
    const result = await executeNeo4jQuery(cypherQuery.value, datasourceId.value);
    queryResult.rows = result?.rows ?? [];
    const columns: string[] = [];
    for (const row of queryResult.rows) {
      for (const key of Object.keys(row)) if (!columns.includes(key)) columns.push(key);
    }
    queryResult.columns = columns;
    ElMessage.success(`查询成功，返回 ${result?.rowCount ?? queryResult.rows.length} 行`);
  } catch (e) {
    queryResult.rows = [];
    queryResult.columns = [];
    ElMessage.error(`查询失败：${(e as Error)?.message ?? String(e)}`);
  } finally {
    cypherLoading.value = false;
  }
}

// 数据源变化（含首次进入）时整体刷新
watch(
  [datasourceId, datasourceError],
  async ([id, err]) => {
    if (!id) {
      labelList.value = [];
      relList.value = [];
      nodes.value = [];
      graphNodes.value = [];
      graphEdges.value = [];
      activeLabel.value = "";
      stats.nodes = 0;
      stats.relationships = 0;
      connected.value = false;
      connectionInfo.version = "-";
      connectionInfo.host = "-";
      connectionInfo.port = 0;
      connectionInfo.database = "-";
      if (err) ElMessage.warning(err);
      return;
    }
    await refresh();
  },
  { immediate: true }
);
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

<template>
  <div class="dsm tel-page">
    <div class="dsm-toolbar re-surface">
      <div class="dsm-toolbar-left">
        <ReIcon name="Share" :size="18" class="dsm-title-icon dsm-neo4j-icon" />
        <span class="dsm-title">Neo4j 图数据库管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton layout="square" tip="测试连接" icon="Connection" data-testid="dsm-btn-test" :disabled="!source" :loading="testing" @click="testConnection" />
        <ReButton layout="square" tip="刷新" icon="Refresh" data-testid="dsm-btn-refresh" :loading="loading" @click="refresh" />
        <ReButton layout="square" tip="新建节点" icon="Plus" data-testid="dsm-btn-create" :disabled="!source" @click="openCreateNode" />
        <ReButton layout="square" type="primary" tip="Cypher 查询" icon="Search" data-testid="dsm-btn-query" :disabled="!source" @click="openCypher" />
      </div>
    </div>

    <MiddlewareGap :text="gap" @retry="refresh" />

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
              <div
                v-for="label in nodeLabels"
                :key="label.name"
                class="dsm-tree-node dsm-leaf-node"
                :class="{ active: activeLabel === label.name }"
                @click="selectLabel(label.name)"
                @contextmenu.prevent="onLabelContextMenu($event, label.name)"
              >
                <ReIcon name="Circle" size="12" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ label.name }}</span>
                <span class="dsm-tree-count">{{ label.nodeCount }}</span>
              </div>
              <div v-if="nodeLabels.length === 0" class="dsm-tree-node dsm-leaf-node">
                <span class="dsm-tree-label">{{ gap ? "未读取到标签" : "暂无标签" }}</span>
              </div>
            </div>
            <div class="dsm-tree-node" @click="toggleNode('rels')">
              <ReIcon :name="expandedNodes.has('rels') ? 'ArrowDown' : 'ArrowRight'" size="12" />
              <ReIcon name="Right" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">关系类型 (Rels)</span>
              <span class="dsm-tree-count">{{ relTypes.length }}</span>
            </div>
            <div v-if="expandedNodes.has('rels')" class="dsm-tree-children">
              <div
                v-for="rel in relTypes"
                :key="rel.type"
                class="dsm-tree-node dsm-leaf-node"
                @click="selectRel(rel.type)"
                @contextmenu.prevent="onRelContextMenu($event, rel.type)"
              >
                <ReIcon name="Right" size="12" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ rel.type }}</span>
                <span class="dsm-tree-count">{{ rel.relationshipCount }}</span>
              </div>
              <div v-if="relTypes.length === 0" class="dsm-tree-node dsm-leaf-node">
                <span class="dsm-tree-label">{{ gap ? "未读取到关系类型" : "暂无关系类型" }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dsm-content">
        <div class="neo4j-view-tabs">
          <button
            v-for="tab in viewTabs"
            :key="tab.key"
            class="nvt-btn"
            :class="{ active: neo4jView === tab.key }"
            @click="switchView(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="dsm-info-card">
          <div class="dsm-info-row"><span class="dsm-info-label">数据源</span><span class="dsm-info-value">{{ source ? source.name : "未选择" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">连接地址</span><span class="dsm-info-value mono">{{ source ? `http://${source.host}:${source.port || 7474}` : "—" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">数据库</span><span class="dsm-info-value mono">{{ source?.database || "neo4j" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">服务端版本</span><span class="dsm-info-value mono">{{ neo4jVersion || "未探测" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">版本类型</span><span class="dsm-info-value mono">{{ neo4jEdition || "未探测" }}</span></div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">状态</span>
            <ReTag :type="gap ? 'danger' : 'success'" >{{ gap ? "读取失败" : "正常" }}</ReTag>
          </div>
        </div>

        <!-- 概览 -->
        <div v-show="neo4jView === 'overview'">
          <div class="dsm-stats-row">
            <div class="dsm-stat-card">
              <div class="dsm-stat-value">{{ labelNodeTotal }}</div>
              <div class="dsm-stat-label">节点总数（按标签汇总）</div>
            </div>
            <div class="dsm-stat-card">
              <div class="dsm-stat-value">{{ relCountTotal }}</div>
              <div class="dsm-stat-label">关系总数（按类型汇总）</div>
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

          <div class="dsm-section">
            <div class="dsm-section-title">标签统计</div>
            <ReTable :data="nodeLabels" :columns="labelColumns" :loading="loading" stripe border height="260px" :config="{ pagination: { enable: false } }"/>
          </div>
        </div>

        <!-- 图可视化 -->
        <div v-show="neo4jView === 'graph'" class="neo4j-graph-view">
          <div class="ngv-toolbar">
            <span>{{ graphNote || "节点关系采样图（来自 Cypher 采样查询）" }}</span>
            <ReButton :loading="graphLoading" @click="loadGraph">
              <template #icon><ReIcon name="Refresh" /></template>重新采样
            </ReButton>
          </div>
          <ReRelationGraph
            v-if="graphEdges.length > 0"
            :nodes="relationNodes"
            :edges="relationEdges"
            layout="force"
            height="450px"
            highlight="both"
            :minimap="relationNodes.length > 3"
            :node-size="44"
            empty-text="采样图无关系可绘制"
            data-testid="dsm-neo4j-graph"
            @node-click="onGraphNodeClick"
          >
            <template #hover="{ node }">
              <div class="ngv-tip-title">{{ node.label }}</div>
              <div class="ngv-tip-row">id：{{ node.id }}</div>
            </template>
          </ReRelationGraph>
          <ReEmpty v-else :description="graphNote || '暂无采样数据'" />
          <div v-if="graphNodes.length > 0" class="ngv-legend">
            <span v-for="(color, label) in nodeColors" :key="label" class="ngv-legend-item">
              <span class="ngv-legend-dot" :style="{ background: color }"></span>{{ label }}
            </span>
          </div>
        </div>

        <!-- 节点列表 -->
        <div v-show="neo4jView === 'nodes'" class="dsm-section">
          <div class="dsm-section-title">
            {{ activeLabel ? `${activeLabel} 节点` : "节点列表" }}
            <ReButton text type="primary" :disabled="!activeLabel" @click="loadNodes">
              <template #icon><ReIcon name="Refresh" size="12" /></template>重新查询
            </ReButton>
          </div>
          <ReTable
            :data="nodes"
            :columns="nodeColumns"
            :loading="nodeLoading"
            stripe
            border
            height="400px"
            :context-menu="nodeTableMenu"
            @context-menu-select="onNodeTableMenuSelect"
            @row-click="onNodeClick"
            :config="{ pagination: { enable: false } }"
          />
          <div v-if="!activeLabel" class="ngv-hint">从左侧选择一个节点标签后查询其节点</div>
        </div>

        <!-- 关系列表 -->
        <div v-show="neo4jView === 'rels'" class="dsm-section">
          <div class="dsm-section-title">
            关系类型列表
            <ReButton type="primary" @click="openCreateRel">
              <template #icon><ReIcon name="Plus" /></template>新建关系
            </ReButton>
          </div>
          <ReTable :data="relTypes" :columns="relColumns" :loading="loading" stripe border height="400px" :config="{ pagination: { enable: false } }"/>
        </div>
      </div>
    </div>

    <!-- Cypher 查询：编辑器与结果区对齐 jdbc 查询页（工具栏方钮 + 三方编辑器 + 结果表） -->
    <ReDialog v-model="cypherVisible" title="Cypher 查询" width="760px">
      <div class="dsm-query-area">
        <div class="dsm-query-toolbar">
          <ReButton
            layout="square"
            type="primary"
            icon="VideoPlay"
            tip="执行（Ctrl+Enter）"
            data-testid="dsm-btn-exec"
            @click="executeCypher"
          />
          <ReButton
            layout="square"
            icon="Delete"
            tip="清空编辑器"
            data-testid="dsm-btn-clear"
            @click="cypherQuery = ''"
          />
          <span class="dsm-spacer" />
          <span class="dsm-query-hint">标签/关系类型与 Cypher 关键字输入即提示</span>
        </div>
        <DbSqlEditor
          v-model="cypherQuery"
          language="cypher"
          :keywords="cypherKeywords"
          data-testid="dsm-cypher-editor"
          @execute="executeCypher"
        />
        <div class="dsm-query-result">
          <div class="dsm-query-header">
            查询结果
            <span v-if="queryResult.rows.length > 0" class="dsm-query-meta">
              {{ queryResult.rows.length }} 行 · {{ cypherElapsed }} ms
              <span v-if="queryResult.truncated" class="dsm-query-warn">已截断，服务端共 {{ queryResult.totalRows }} 行，请加 LIMIT 收窄结果</span>
            </span>
          </div>
          <ReTable v-if="queryResult.columns.length > 0" :data="queryResult.rows" :columns="queryResult.columns" stripe border height="200px" :config="{ pagination: { enable: false } }"/>
          <ReEmpty v-else description="执行查询后显示结果" />
        </div>
      </div>
      <template #footer>
        <ReButton @click="cypherVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="cypherRunning" @click="executeCypher"><template #icon><ReIcon name="VideoPlay" /></template>执行查询</ReButton>
      </template>
    </ReDialog>

    <!-- 节点详情 -->
    <ReDialog v-model="nodeDetailVisible" title="节点详情" width="500px">
      <div v-if="selectedNode" class="node-detail">
        <div class="nd-row"><span class="nd-label">Element ID：</span><span class="nd-value">{{ selectedNode.id }}</span></div>
        <div class="nd-row"><span class="nd-label">标签：</span><span class="nd-value">{{ selectedNode.label || "—" }}</span></div>
        <div class="nd-row"><span class="nd-label">属性：</span></div>
        <pre class="nd-props">{{ selectedNode.properties }}</pre>
      </div>
    </ReDialog>

    <!-- 新建节点 -->
    <ReDialog v-model="createNodeVisible" title="新建节点" width="500px">
      <ReForm label-width="100px">
        <ReFormItem label="节点标签" required>
          <ReInput v-model="newNodeLabel" placeholder="例如：Person、Movie" />
        </ReFormItem>
        <ReFormItem label="节点属性(JSON)">
          <ReInput v-model="newNodeProps" type="textarea" :rows="6" placeholder='{"name": "张三", "age": 25}' />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="createNodeVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="creatingNode" @click="createNode">创建</ReButton>
      </template>
    </ReDialog>

    <!-- 新建关系 -->
    <ReDialog v-model="createRelVisible" title="新建关系" width="500px">
      <ReForm label-width="100px">
        <ReFormItem label="关系类型" required>
          <ReInput v-model="newRelType" placeholder="例如：ACTED_IN、DIRECTED" />
        </ReFormItem>
        <ReFormItem label="起始节点" required>
          <ReInput v-model="newRelFrom" placeholder="起始节点的 elementId，形如 4:abi:0" />
        </ReFormItem>
        <ReFormItem label="目标节点" required>
          <ReInput v-model="newRelTo" placeholder="目标节点的 elementId，形如 4:abi:0" />
        </ReFormItem>
        <ReFormItem label="关系属性(JSON)">
          <ReInput v-model="newRelProps" type="textarea" :rows="4" placeholder='{"role": "主角", "year": 2023}' />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="createRelVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="creatingRel" @click="createRel">创建</ReButton>
      </template>
    </ReDialog>
    <!-- 标签/关系类型行右键菜单（第九批统一 zk 模板） -->
    <DsmContextMenu
      v-model:visible="sideMenu.visible"
      :x="sideMenu.x"
      :y="sideMenu.y"
      :items="sideMenuItems"
      @select="onSideMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Neo4j 管理页
 *
 * <p>基于「数据源管理」登记的 neo4j 数据源，通过后端 neo4j 管理接口读取真实的标签、关系类型，
 * 并以 Cypher 查询驱动节点列表、关系采样图与节点/关系创建；接口缺失或连接失败时只展示失败
 * 原因，不回落任何演示数据。</p>
 * @author CH
 * @since 4.0.0
 */
// 卡片视觉统一底座（16px 圆角/透明边框/双层投影，见 packages/ui shared/re-surface.css）
import "@repo/ui/surface";
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";

import { View, CopyDocument } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReEmpty from "@repo/ui/re-empty";
import ReForm from "@repo/ui/re-form";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReRelationGraph from "@repo/ui/re-relation-graph";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import { ReFormItem } from "@repo/ui/re-kit";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import { copyToClipboard } from "../../utils/clipboard";
import DsmContextMenu from "../../components/console/DsmContextMenu.vue";
import DbSqlEditor from "../../components/console/DbSqlEditor.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import {
  executeNeo4jQuery,
  fetchNeo4jLabels,
  fetchNeo4jRelationships,
  testNeo4jConnection,
  type Neo4jLabel,
  type Neo4jRelationship,
} from "../../api/manageConsoles";

/** ReTable 列定义 */
type Column = { prop: string; label: string; width?: number | string; minWidth?: number; slot?: string; fixed?: boolean | "left" | "right"; formatter?: (row: any) => string };

/** 图上节点（坐标交由 ReRelationGraph/G6 布局，这里只存业务数据） */
interface GraphNode {
  id: string;
  label: string;
  color: string;
  properties: string;
}

/** 图上的边（端点 id + 关系类型，渲染坐标由图布局引擎计算） */
interface GraphEdge {
  from: string;
  to: string;
  type: string;
}

const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();

/** 侧栏根节点名称：真实数据源名 */
const connectionName = computed(() => (source.value ? source.value.name : "Neo4j 图数据库"));

const expandedNodes = ref(new Set(["root", "nodes", "rels"]));
const activeLabel = ref("");
const loading = ref(false);
const testing = ref(false);
const neo4jVersion = ref("");
const neo4jEdition = ref("");
const neo4jView = ref<"overview" | "graph" | "nodes" | "rels">("overview");
const viewTabs = [
  { key: "overview", label: "概览" },
  { key: "graph", label: "图可视化" },
  { key: "nodes", label: "节点列表" },
  { key: "rels", label: "关系列表" },
] as const;

const nodeLabels = ref<Neo4jLabel[]>([]);
const relTypes = ref<Neo4jRelationship[]>([]);

const labelNodeTotal = computed(() => nodeLabels.value.reduce((sum, l) => sum + (l.nodeCount || 0), 0));
const relCountTotal = computed(() => relTypes.value.reduce((sum, r) => sum + (r.relationshipCount || 0), 0));

const labelColumns: Column[] = [
  { prop: "name", label: "标签", minWidth: 180 },
  { prop: "nodeCount", label: "节点数", width: 120 },
  { prop: "propertyCount", label: "属性数", width: 120 },
];
const relColumns: Column[] = [
  { prop: "type", label: "关系类型", minWidth: 180 },
  { prop: "relationshipCount", label: "关系数", width: 120 },
  { prop: "propertyCount", label: "属性数", width: 120 },
];

const nodeLoading = ref(false);
const nodes = ref<Record<string, unknown>[]>([]);

/** 标签/关系类型行右键菜单（第九批统一 zk 模板） */
const sideMenu = reactive({ visible: false, x: 0, y: 0, kind: "label" as "label" | "rel", key: "" });
const sideMenuItems = computed(() =>
  sideMenu.kind === "label"
    ? [
        { key: "view", label: "查看该标签节点", icon: "Circle" },
        { key: "copy", label: "复制标签名", icon: "Document" },
      ]
    : [
        { key: "view", label: "查看该类型关系", icon: "Right" },
        { key: "copy", label: "复制类型名", icon: "Document" },
      ],
);
/** 节点列表表格行右键（ReTable 内置菜单，图标为组件引用） */
const nodeTableMenu = [
  { key: "view", label: "查看节点详情", icon: View },
  { key: "copy", label: "复制 elementId", icon: CopyDocument },
];
/** 打开侧栏标签行右键菜单 */
function onLabelContextMenu(e: MouseEvent, name: string) {
  Object.assign(sideMenu, { visible: true, x: e.clientX, y: e.clientY, kind: "label", key: name });
}
/** 打开侧栏关系类型行右键菜单 */
function onRelContextMenu(e: MouseEvent, type: string) {
  Object.assign(sideMenu, { visible: true, x: e.clientX, y: e.clientY, kind: "rel", key: type });
}
/** 侧栏菜单分发 */
function onSideMenuSelect(action: string) {
  const key = sideMenu.key;
  if (!key) return;
  if (action === "view") {
    if (sideMenu.kind === "label") selectLabel(key);
    else selectRel(key);
  } else if (action === "copy") {
    void copyToClipboard(key).then(ok => ok ? message.success("已复制") : message.error("复制失败"));
  }
}
/** 节点表格菜单分发 */
function onNodeTableMenuSelect(item: { key: string }, ctx: { row: Record<string, unknown> }) {
  if (item.key === "view") {
    onNodeClick(ctx.row);
  } else if (item.key === "copy") {
    void copyToClipboard(String(ctx.row.id ?? "")).then(ok => ok ? message.success("已复制 elementId") : message.error("复制失败"));
  }
}
const nodeColumns = ref<Column[]>([]);

const cypherVisible = ref(false);
const cypherRunning = ref(false);
const cypherElapsed = ref(0);
const cypherQuery = ref("");
/** Cypher 补全候选：节点标签 + 关系类型（输入即提示，随数据异步刷新） */
const cypherKeywords = computed(() => [
  ...nodeLabels.value.map(l => l.name),
  ...relTypes.value.map(r => r.type),
]);
const queryResult = ref<{ columns: Column[]; rows: Record<string, unknown>[]; truncated: boolean; totalRows: number }>({ columns: [], rows: [], truncated: false, totalRows: 0 });

const nodeDetailVisible = ref(false);
const selectedNode = ref<{ id: string; label: string; properties: string } | null>(null);

/** Cypher 标识字符合法性（标签/关系类型/属性名） */
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** elementId 白名单：形如 4:abi:0，通过校验才允许拼进 Cypher 字面量 */
const ELEMENT_ID = /^[A-Za-z0-9_:.-]+$/;

/**
 * 取错误信息
 * @param e 异常
 * @returns 文本
 */
function errText(e: unknown): string {
  return String((e as Error)?.message ?? e);
}

/**
 * 把返回行里的对象/数组值转成 JSON 文本，便于表格与详情展示
 * @param rows 原始行
 * @returns 展示行
 */
function stringifyRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return (rows || []).map(row => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = value !== null && typeof value === "object" ? JSON.stringify(value) : value;
    }
    return out;
  });
}

/**
 * 由返回行的键推导表格列
 * @param rows 行数据
 * @returns 列定义
 */
function toColumns(rows: Record<string, unknown>[]): Column[] {
  return (rows.length > 0 ? Object.keys(rows[0]) : []).map(key => ({ prop: key, label: key, minWidth: 140 }));
}

/**
 * 执行 Cypher 并返回展示行
 * @param cypher 语句
 * @returns 行数据与耗时
 */
async function runCypher(cypher: string): Promise<{ rows: Record<string, unknown>[]; elapsed: number; truncated: boolean; totalRows: number }> {
  const result = await executeNeo4jQuery(cypher, datasourceId.value);
  return {
    rows: stringifyRows(result?.rows || []),
    elapsed: result?.executionTimeMs ?? 0,
    truncated: !!result?.truncated,
    totalRows: result?.totalRows ?? (result?.rows?.length || 0),
  };
}

/**
 * 加载标签与关系类型
 */
async function refresh() {
  if (!source.value) {
    await bind("neo4j");
    if (!source.value) return;
  }
  loading.value = true;
  try {
    nodeLabels.value = (await fetchNeo4jLabels(datasourceId.value)) || [];
    ready();
  } catch (e) {
    nodeLabels.value = [];
    fail(e, "/ms/monitor/neo4j/labels");
  }
  try {
    relTypes.value = (await fetchNeo4jRelationships(datasourceId.value)) || [];
    ready();
  } catch (e) {
    relTypes.value = [];
    fail(e, "/ms/monitor/neo4j/relationships");
  } finally {
    loading.value = false;
  }
  if (activeLabel.value) await loadNodes();
  if (neo4jView.value === "graph") await loadGraph();
}

/**
 * 探测当前数据源的 Neo4j 连通性，回填服务端版本与版本类型
 */
async function testConnection() {
  testing.value = true;
  try {
    const result = await testNeo4jConnection({ datasourceId: datasourceId.value });
    if (result?.connected) {
      neo4jVersion.value = result.version || "";
      neo4jEdition.value = result.edition || "";
      ready();
      message.success(result.version ? `连接成功 · Neo4j ${result.version}` : "连接成功");
    } else {
      message.error(result?.message || "连接失败");
    }
  } catch (e) {
    fail(e, "/ms/monitor/neo4j/test");
  } finally {
    testing.value = false;
  }
}

/**
 * 展开/收起侧栏树节点
 * @param key 节点键
 */
function toggleNode(key: string) {
  if (expandedNodes.value.has(key)) expandedNodes.value.delete(key);
  else expandedNodes.value.add(key);
}

/**
 * 切换视图，图视图首次进入时自动采样
 * @param key 视图键
 */
function switchView(key: "overview" | "graph" | "nodes" | "rels") {
  neo4jView.value = key;
  if (key === "graph" && graphEdges.value.length === 0) void loadGraph();
}

/**
 * 选中标签并查询其节点
 * @param label 标签名
 */
function selectLabel(label: string) {
  activeLabel.value = label;
  neo4jView.value = "nodes";
  loadNodes();
}

/**
 * 用关系类型生成计数查询
 * @param rel 关系类型
 */
function selectRel(rel: string) {
  cypherQuery.value = `MATCH ()-[r:\`${rel}\`]->()\nRETURN count(r) AS count`;
  cypherVisible.value = true;
}

/**
 * 查询当前选中标签的节点
 */
async function loadNodes() {
  if (!activeLabel.value) {
    nodes.value = [];
    nodeColumns.value = [];
    return;
  }
  nodeLoading.value = true;
  try {
    const { rows } = await runCypher(
      `MATCH (n:\`${activeLabel.value}\`)\nRETURN elementId(n) AS id, labels(n) AS labels, properties(n) AS properties\nLIMIT 100`
    );
    nodes.value = rows;
    nodeColumns.value = toColumns(rows);
    ready();
  } catch (e) {
    nodes.value = [];
    nodeColumns.value = [];
    fail(e, "/ms/monitor/neo4j/query");
  } finally {
    nodeLoading.value = false;
  }
}

/**
 * 点击表格行查看节点详情
 * @param row 行数据
 */
function onNodeClick(row: Record<string, unknown>) {
  showNode(String(row.id ?? ""));
}

/**
 * 展示节点详情
 * @param id 节点 ID
 */
function showNode(id: string) {
  const row = nodes.value.find(n => String(n.id) === id);
  if (row) {
    selectedNode.value = {
      id,
      label: String(row.labels ?? "").replace(/[\[\]"]/g, ""),
      properties: String(row.properties ?? "{}"),
    };
    nodeDetailVisible.value = true;
    return;
  }
  const graph = graphNodes.value.find(n => n.id === id);
  if (graph) {
    selectedNode.value = { id, label: graph.label, properties: graph.properties };
    nodeDetailVisible.value = true;
  }
}

// ==================== 图采样 ====================
const graphLoading = ref(false);
const graphNote = ref("");
const graphNodes = ref<GraphNode[]>([]);
const graphEdges = ref<GraphEdge[]>([]);
const nodeColors = ref<Record<string, string>>({});

/** ReRelationGraph 节点：标签作分组（同标签高亮），配色沿用图例色板，属性进业务数据 */
const relationNodes = computed(() =>
  graphNodes.value.map(n => ({
    id: n.id,
    label: n.label,
    group: n.label,
    size: 44,
    style: { fill: n.color, stroke: "#ffffff", lineWidth: 2 },
    data: { properties: n.properties },
  })),
);

/** ReRelationGraph 边：关系类型作边标签，带方向箭头 */
const relationEdges = computed(() =>
  graphEdges.value.map((e, idx) => ({
    id: `e${idx}`,
    source: e.from,
    target: e.to,
    label: e.type,
    directed: true,
    group: e.type,
  })),
);

/**
 * 图上节点点击：复用节点详情弹窗（先查节点列表，再退回采样缓存）
 * @param node 图插件回传的节点（含 id）
 */
function onGraphNodeClick(node: { id: string }) {
  showNode(node.id);
}

/** 采样用的关系查询，列别名即渲染契约 */
const GRAPH_CYPHER =
  "MATCH (a)-[r]->(b)\nRETURN elementId(a) AS fromId, labels(a) AS fromLabel, properties(a) AS fromProps, " +
  "type(r) AS rel, elementId(b) AS toId, labels(b) AS toLabel, properties(b) AS toProps\nLIMIT 80";

const PALETTE = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#64748b"];

/**
 * 采样真实关系数据绘制节点关系图
 */
async function loadGraph() {
  graphLoading.value = true;
  graphNote.value = "";
  try {
    const { rows } = await runCypher(GRAPH_CYPHER);
    if (rows.length === 0) {
      graphNodes.value = [];
      graphEdges.value = [];
      graphNote.value = "采样查询未返回关系数据";
      ready();
      return;
    }
    const missing = ["fromId", "toId", "rel"].filter(k => !(k in rows[0]));
    if (missing.length > 0) {
      graphNodes.value = [];
      graphEdges.value = [];
      graphNote.value = `采样结果缺少列：${missing.join(", ")}，无法绘制关系图`;
      return;
    }
    const seen = new Map<string, GraphNode>();
    for (const row of rows) {
      for (const [idKey, labelKey, propsKey] of [
        ["fromId", "fromLabel", "fromProps"],
        ["toId", "toLabel", "toProps"],
      ] as const) {
        const key = String(row[idKey]);
        if (!seen.has(key)) {
          const label = String(row[labelKey] ?? "").replace(/[\[\]"]/g, "").split(",")[0] || "Node";
          seen.set(key, {
            id: key,
            label,
            color: "",
            properties: String(row[propsKey] ?? "{}"),
          });
        }
      }
    }
    const list = [...seen.values()].slice(0, 40);
    const labels = [...new Set(list.map(n => n.label))];
    const colorMap: Record<string, string> = {};
    labels.forEach((label, idx) => (colorMap[label] = PALETTE[idx % PALETTE.length]));
    list.forEach(node => {
      node.color = colorMap[node.label] || PALETTE[PALETTE.length - 1];
    });
    const inSample = new Set(list.map(n => n.id));
    const edges: GraphEdge[] = [];
    for (const row of rows) {
      const from = String(row.fromId);
      const to = String(row.toId);
      if (inSample.has(from) && inSample.has(to)) {
        edges.push({ from, to, type: String(row.rel ?? "") });
      }
    }
    graphNodes.value = list;
    graphEdges.value = edges;
    nodeColors.value = colorMap;
    graphNote.value = edges.length > 0 ? `采样 ${list.length} 个节点 / ${edges.length} 条关系` : "采样节点间无直接关系";
    ready();
  } catch (e) {
    graphNodes.value = [];
    graphEdges.value = [];
    graphNote.value = `采样失败：${errText(e)}`;
    fail(e, "/ms/monitor/neo4j/query");
  } finally {
    graphLoading.value = false;
  }
}

// ==================== Cypher 面板 ====================
/**
 * 打开 Cypher 查询面板，未编辑过时按当前标签预填
 */
function openCypher() {
  if (!cypherQuery.value && activeLabel.value) {
    cypherQuery.value = `MATCH (n:\`${activeLabel.value}\`)\nRETURN n\nLIMIT 25`;
  }
  cypherVisible.value = true;
}

/**
 * 执行面板里的 Cypher
 */
async function executeCypher() {
  if (!cypherQuery.value.trim()) {
    message.warning("请输入 Cypher 语句");
    return;
  }
  cypherRunning.value = true;
  try {
    const { rows, elapsed, truncated, totalRows } = await runCypher(cypherQuery.value);
    queryResult.value = { columns: toColumns(rows), rows, truncated, totalRows };
    cypherElapsed.value = elapsed;
    ready();
  } catch (e) {
    queryResult.value = { columns: [], rows: [], truncated: false, totalRows: 0 };
    fail(e, "/ms/monitor/neo4j/query");
  } finally {
    cypherRunning.value = false;
  }
}

// ==================== 新建节点 / 关系 ====================
const createNodeVisible = ref(false);
const newNodeLabel = ref("");
const newNodeProps = ref("{}");
const creatingNode = ref(false);

const createRelVisible = ref(false);
const newRelType = ref("");
const newRelFrom = ref("");
const newRelTo = ref("");
const newRelProps = ref("{}");
const creatingRel = ref(false);

/**
 * 打开新建节点弹窗
 */
function openCreateNode() {
  newNodeLabel.value = activeLabel.value || "";
  newNodeProps.value = "{}";
  createNodeVisible.value = true;
}

/**
 * 打开新建关系弹窗
 */
function openCreateRel() {
  newRelType.value = "";
  newRelFrom.value = "";
  newRelTo.value = "";
  newRelProps.value = "{}";
  createRelVisible.value = true;
}

/**
 * 把 JSON 属性转成 Cypher map 字面量
 * @param raw 用户输入的属性 JSON
 * @returns 字面量内容，非法时为 null
 */
function propsLiteral(raw: string): string | null {
  let parsed: unknown;
  try {
    parsed = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    message.error("属性必须是合法 JSON");
    return null;
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    message.error("属性必须是 JSON 对象");
    return null;
  }
  const parts: string[] = [];
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!IDENT.test(key)) {
      message.error(`属性名不合法: ${key}`);
      return null;
    }
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      parts.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      message.error(`属性 ${key} 仅支持字符串/数字/布尔/NULL`);
      return null;
    }
  }
  return parts.join(", ");
}

/**
 * 创建节点
 */
async function createNode() {
  const label = newNodeLabel.value.trim();
  if (!IDENT.test(label)) {
    message.warning("节点标签只能由字母、数字、下划线组成且不以数字开头");
    return;
  }
  const props = propsLiteral(newNodeProps.value);
  if (props === null) return;
  creatingNode.value = true;
  try {
    const { rows } = await runCypher(`CREATE (n:\`${label}\` {${props}})\nRETURN elementId(n) AS id, labels(n) AS labels`);
    if (rows.length === 0) throw new Error("后端未返回新建节点 ID");
    message.success(`节点已创建，Element ID=${rows[0].id}`);
    createNodeVisible.value = false;
    ready();
    await refresh();
  } catch (e) {
    fail(e, "/ms/monitor/neo4j/query");
  } finally {
    creatingNode.value = false;
  }
}

/**
 * 创建关系
 */
async function createRel() {
  const type = newRelType.value.trim();
  if (!IDENT.test(type)) {
    message.warning("关系类型只能由字母、数字、下划线组成且不以数字开头");
    return;
  }
  const fromId = newRelFrom.value.trim();
  const toId = newRelTo.value.trim();
  if (!ELEMENT_ID.test(fromId) || !ELEMENT_ID.test(toId)) {
    message.warning("起始/目标节点须填 elementId（形如 4:abi:0），可在节点列表里复制");
    return;
  }
  const props = propsLiteral(newRelProps.value);
  if (props === null) return;
  creatingRel.value = true;
  try {
    const { rows } = await runCypher(
      `MATCH (a), (b)\nWHERE elementId(a) = '${fromId}' AND elementId(b) = '${toId}'\n` +
        `CREATE (a)-[r:\`${type}\` {${props}}]->(b)\nRETURN elementId(r) AS id, type(r) AS type`
    );
    if (rows.length === 0) throw new Error("未匹配到起止节点，关系未创建");
    message.success(`关系已创建，Element ID=${rows[0].id}`);
    createRelVisible.value = false;
    ready();
    await refresh();
  } catch (e) {
    fail(e, "/ms/monitor/neo4j/query");
  } finally {
    creatingRel.value = false;
  }
}

onMounted(async () => {
  await bind("neo4j");
  if (source.value) {
    await refresh();
  }
});
</script>

<style scoped>
.dsm { display: flex; flex-direction: column; height: 100%; min-height: 100%; background: var(--bg-fill); }
/* 顶部工具条：视觉（圆角/边框/投影/底色/内距）由模板上的 re-surface 类统一提供
   （16px 圆角、透明边框 + 双层柔光投影），这里只留布局——不再自写一套卡片壳防漂移 */
.dsm-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.dsm-toolbar-left { display: flex; align-items: center; gap: 10px; }
.dsm-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.dsm-neo4j-icon { color: var(--brand-500, var(--apm-brand-500)); }
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
.dsm-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
.dsm-stat-card { padding: 16px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); text-align: center; }
.dsm-stat-value { font-size: 24px; font-weight: 700; color: var(--brand-600); }
.dsm-stat-label { font-size: 12px; color: var(--text-tertiary); margin-top: 4px; }
.dsm-section { border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow: hidden; }
.dsm-section-title { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; font-size: 14px; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); }
.ngv-hint { padding: 10px 14px; font-size: 12px; color: var(--text-tertiary); }

/* Neo4j 视图切换 */
.neo4j-view-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border-subtle, var(--apm-border-subtle));
  padding-bottom: 8px;
}
.nvt-btn {
  padding: 6px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary, var(--apm-text-secondary));
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
}
.nvt-btn:hover { background: var(--bg-hover, var(--apm-bg-hover)); }
.nvt-btn.active {
  background: var(--primary, #3b82f6);
  color: white;
}

/* 图可视化 */
.neo4j-graph-view {
  background: var(--bg-container, var(--apm-bg-container));
  border: 1px solid var(--border-subtle, var(--apm-border-subtle));
  border-radius: 8px;
  overflow: hidden;
}
.ngv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle, var(--apm-border-subtle));
  font-size: 13px;
  color: var(--text-secondary, var(--apm-text-secondary));
}
/* 图节点悬停提示（ReRelationGraph #hover 插槽） */
.ngv-tip-title { font-weight: 600; margin-bottom: 2px; }
.ngv-tip-row { font-size: 12px; opacity: 0.85; }
.ngv-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px solid var(--border-subtle, var(--apm-border-subtle));
}
.ngv-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary, var(--apm-text-secondary));
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
  border-bottom: 1px solid var(--border-subtle, var(--apm-border-subtle));
}
.nd-label { width: 80px; color: var(--text-secondary, var(--apm-text-secondary)); font-size: 13px; }
.nd-value { flex: 1; font-size: 13px; font-family: monospace; }
.nd-props {
  background: var(--bg-subtle, #f8fafc);
  border: 1px solid var(--border-subtle, var(--apm-border-subtle));
  border-radius: 6px;
  padding: 12px;
  font-family: monospace;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  margin-top: 8px;
}
.dsm-query-area { display: flex; flex-direction: column; gap: 12px; }
/* 查询工具栏：对齐 jdbc 查询页（方钮 + 弹性占位 + 提示文案） */
.dsm-query-toolbar { display: flex; align-items: center; gap: 8px; }
.dsm-spacer { flex: 1; }
.dsm-query-hint { font-size: 12px; color: var(--text-secondary, var(--apm-text-secondary)); }
.dsm-query-editor { width: 100%; padding: 12px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 13px; border: 1px solid var(--border-default); border-radius: 6px; background: var(--bg-elevated); color: var(--text-primary); resize: vertical; outline: none; }
.dsm-query-editor:focus { border-color: var(--brand-400); box-shadow: var(--focus-ring); }
.dsm-query-result { border: 1px solid var(--border-subtle); border-radius: 6px; overflow: hidden; }
.dsm-query-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 12px; font-size: 13px; font-weight: 500; color: var(--text-secondary); background: var(--bg-fill); border-bottom: 1px solid var(--border-subtle); }
.dsm-query-meta { font-size: 12px; font-weight: 400; color: var(--text-tertiary); }
.dsm-query-warn { margin-left: 8px; color: var(--status-warning, var(--apm-status-warning)); }
</style>

<template>
  <div class="designer-page">
    <el-card shadow="never" class="header-bar">
      <div class="flex items-center gap-3">
        <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>
        <div class="title">{{ flow.flowName || flowCode || '新建流程' }}</div>
        <el-tag v-if="flow.flowVersion" type="info">v{{ flow.flowVersion }}</el-tag>
        <el-tag v-if="flow.flowStatus === 0" type="warning">已禁用</el-tag>
        <div class="flex-1" />
        <el-button :icon="DocumentCopy" @click="validateFlow">校验</el-button>
        <el-button :icon="MagicStick" @click="autoLayout">自动布局</el-button>
        <el-button :icon="VideoPlay" type="success" :loading="running" @click="runFlow">运行</el-button>
        <el-button :icon="VideoPlay" type="primary" :loading="debugging" @click="debugFlow">调试</el-button>
        <el-button :icon="Check" type="primary" :loading="saving" @click="saveFlow">保存</el-button>
      </div>
    </el-card>

    <div class="designer-body">
      <aside class="left-panel">
        <div class="panel-title">节点类型</div>
        <draggable
          :list="palette"
          item-key="type"
          :group="{ name: 'spider-flow-node', pull: 'clone', put: false }"
          :sort="false"
          :clone="clonePaletteNode"
        >
          <template #item="{ element }">
            <div class="palette-item" :data-type="element.type">
              <el-icon class="mr-2">
                <component :is="element.icon" />
              </el-icon>
              <div>
                <div class="palette-name">{{ element.label }}</div>
                <div class="palette-type">{{ element.type }}</div>
              </div>
            </div>
          </template>
        </draggable>

        <div class="panel-title mt-4">已选节点</div>
        <div v-if="selectedNode" class="prop-form">
          <el-form label-width="80" size="small">
            <el-form-item label="key">
              <el-input :model-value="selectedNode.id" disabled />
            </el-form-item>
            <el-form-item label="类型">
              <el-input :model-value="selectedNode.type" disabled />
            </el-form-item>
            <el-form-item label="名称">
              <el-input :model-value="(selectedNode.data as any)?.name || ''" disabled />
            </el-form-item>
          </el-form>
          <el-button type="danger" size="small" class="mt-2" @click="removeSelected">删除节点</el-button>
        </div>
        <div v-else class="prop-empty">点击画布上的节点查看属性</div>

        <div class="panel-title mt-4">连线条件</div>
        <div v-if="selectedEdge" class="prop-form">
          <el-form label-width="80" size="small">
            <el-form-item label="from">
              <el-input :model-value="selectedEdge.from" disabled />
            </el-form-item>
            <el-form-item label="to">
              <el-input :model-value="selectedEdge.to" disabled />
            </el-form-item>
            <el-form-item label="标签">
              <el-input v-model="selectedEdge.text" />
            </el-form-item>
            <el-form-item label="变量名">
              <el-input v-model="selectedEdge.condField" placeholder="ctx 变量名（可选）" />
            </el-form-item>
            <el-form-item label="操作符">
              <el-select v-model="selectedEdge.condOp" placeholder="无条件" clearable>
                <el-option label="= (等于)" value="eq" />
                <el-option label="!= (不等于)" value="neq" />
                <el-option label="> (大于)" value="gt" />
                <el-option label=">= (大于等于)" value="gte" />
                <el-option label="< (小于)" value="lt" />
                <el-option label="<= (小于等于)" value="lte" />
                <el-option label="contains (包含)" value="contains" />
                <el-option label="empty (为空)" value="empty" />
                <el-option label="notEmpty (不为空)" value="notEmpty" />
              </el-select>
            </el-form-item>
            <el-form-item label="比较值">
              <el-input v-model="selectedEdge.condValue" placeholder="仅 =、!=、>、>=、<、<=、contains 需要" />
            </el-form-item>
            <el-form-item label="优先级">
              <el-input-number v-model="selectedEdge.priority" :min="0" :max="100" />
            </el-form-item>
          </el-form>
          <el-button type="danger" size="small" class="mt-2" @click="removeSelectedEdge">删除连线</el-button>
        </div>
        <div v-else class="prop-empty">点击画布上的连线编辑条件</div>
      </aside>

      <main class="canvas">
        <RelationGraph
          ref="graphRef"
          :initial-data="null"
          :options="graphOptions"
          @on-ready="onGraphReady"
          @on-node-click="onNodeClick"
          @on-line-click="onLineClick"
          @on-node-drag-end="onNodeDragEnd"
          @on-line-be-created="onLineBeCreated"
        />
      </main>

      <aside class="right-panel">
        <div class="panel-title">流程信息</div>
        <el-form label-width="80" size="small">
          <el-form-item label="编码">
            <el-input v-model="flow.flowCode" :disabled="!!flow.flowId" />
          </el-form-item>
          <el-form-item label="名称">
            <el-input v-model="flow.flowName" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="flow.flowRemark" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>

        <div class="panel-title mt-4">节点属性</div>
        <div v-if="selectedNode" class="prop-form">
          <component :is="NodeConfigEditor" :node="selectedNode" />
        </div>
        <div v-else class="prop-empty">点击画布节点编辑配置</div>
      </aside>
    </div>

    <el-dialog v-model="debugDialog" title="调试执行日志" width="720">
      <el-table :data="debugLogs" border stripe max-height="500">
        <el-table-column prop="flowNodeKey" label="节点" width="120" />
        <el-table-column prop="flowNodeType" label="类型" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.flowNodeStatus === 'SUCCESS' ? 'success' : row.flowNodeStatus === 'FAILED' ? 'danger' : 'info'">
              {{ row.flowNodeStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="flowNodeCostMs" label="耗时(ms)" width="100" />
        <el-table-column prop="flowNodeMessage" label="输出/异常" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 流程可视化编排页（RelationGraph）。
 *
 * <p>三栏布局：左侧节点面板 + 当前节点/连线属性，中间 RelationGraph 画布，右侧流程信息 + 节点配置。
 * 节点配置按类型动态展示（参考 magic-api / spider-flow 节点面板）。</p>
 */
import { computed, defineAsyncComponent, markRaw, onMounted, ref, shallowRef, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ArrowLeft,
  Check,
  Connection,
  DataAnalysis,
  DataLine,
  Document,
  DocumentCopy,
  Link,
  List,
  MagicStick,
  VideoPlay,
} from '@element-plus/icons-vue';
import draggable from 'vuedraggable';
import RelationGraph from '@relation-graph/vue3';
import '@relation-graph/vue3/style.css';
import { useRoute, useRouter } from 'vue-router';
import { spiderApi } from '../api/spiderApi';
import type {
  SpiderFlow,
  FlowNodeEntity,
  FlowEdgeEntity,
  FlowNodeLog,
  FlowNode,
  FlowEdge,
  SpiderNodeType,
} from '../api/types';

const route = useRoute();
const router = useRouter();
const flowCode = computed<string>(() => String(route.params.code ?? ''));

const flow = ref<SpiderFlow>({
  flowCode: flowCode.value,
  flowName: '',
  flowRemark: '',
  flowStatus: 1,
});
const nodes = ref<FlowNodeEntity[]>([]);
const edges = ref<FlowEdgeEntity[]>([]);

const graphRef = shallowRef<any>(null);
const graphReady = ref(false);
const saving = ref(false);
const running = ref(false);
const debugging = ref(false);
const debugDialog = ref(false);
const debugLogs = ref<FlowNodeLog[]>([]);
const selectedNode = shallowRef<any>(null);
const selectedEdge = shallowRef<any>(null);

/**
 * 调色板节点类型。
 */
const palette = ref<Array<{ type: SpiderNodeType; label: string; icon: any }>>([
  { type: 'start', label: '开始', icon: markRaw(VideoPlay) },
  { type: 'request', label: 'HTTP 请求', icon: markRaw(Connection) },
  { type: 'extract', label: '数据抽取', icon: markRaw(DataLine) },
  { type: 'loop', label: '循环', icon: markRaw(List) },
  { type: 'script', label: '脚本', icon: markRaw(DocumentCopy) },
  { type: 'db', label: '数据库', icon: markRaw(DataAnalysis) },
  { type: 'output', label: '输出', icon: markRaw(Document) },
  { type: 'function', label: '函数', icon: markRaw(Link) },
  { type: 'stop', label: '结束', icon: markRaw(Document) },
]);

/**
 * RelationGraph 数据。
 */
const graphData = ref<{ rootId?: string; nodes: any[]; lines: any[] }>({
  nodes: [],
  lines: [],
});

/**
 * RelationGraph 选项。
 */
const graphOptions = ref({
  defaultNodeShape: 0,
  defaultLineShape: 1,
  layout: { layoutName: 'force' },
  defaultNodeWidth: 140,
  defaultNodeHeight: 60,
  nodeResizable: true,
  lineLabel: { enabled: true, fontSize: 12 },
  defaultLineTextOnPath: true,
  nodeText: {
    color: '#1f2937',
    fontSize: 13,
    'font-weight': 500,
    offset: { x: 0, y: -2 },
  },
});

/**
 * 拖拽克隆节点。
 */
const clonePaletteNode = (item: any) => ({
  id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type: item.type,
  text: item.label,
  x: 0,
  y: 0,
  color: paletteColor(item.type),
  data: { type: item.type, name: item.label, config: '{}' },
});

function paletteColor(type: SpiderNodeType): string {
  const map: Record<string, string> = {
    start: '#67C23A',
    request: '#409EFF',
    extract: '#E6A23C',
    loop: '#9C27B0',
    script: '#F56C6C',
    db: '#13C2C2',
    output: '#909399',
    function: '#FF5722',
    stop: '#606266',
  };
  return map[type] || '#5B8FF9';
}

/**
 * 节点配置编辑器（按类型动态加载）。
 */
const NodeConfigEditor = defineAsyncComponent(
  () => import('../components/FlowNodeEditor.vue').then(m => m.default) as any
);

const goBack = () => {
  router.push('/spider/flow-list');
};

/**
 * 从服务端加载流程（含节点 + 边）。
 */
const loadFlow = async () => {
  if (!flowCode.value) return;
  try {
    const agg = await spiderApi.getFlow(flowCode.value);
    if (agg) {
      flow.value = { ...flow.value, ...agg.flow };
      nodes.value = agg.nodes || [];
      edges.value = agg.edges || [];
      rebuildGraph();
    } else {
      ElMessage.info('流程不存在，新建中...');
    }
  } catch (e) {
    ElMessage.error('加载失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

/**
 * 把 nodes/edges 同步到 graphData。
 */
const rebuildGraph = () => {
  const graphNodes = nodes.value.map(n => ({
    id: n.flowNodeKey,
    text: n.flowNodeName || n.flowNodeType,
    x: n.flowNodeX || 100,
    y: n.flowNodeY || 100,
    color: paletteColor(n.flowNodeType),
    data: {
      type: n.flowNodeType,
      name: n.flowNodeName,
      config: parseConfigSafe(n.flowNodeConfig),
    },
  }));
  // rootId 必须指向真实存在的节点，否则 relation-graph 报 custom rootNode not found 且不渲染
  const rootId = graphNodes.length ? graphNodes[0].id : 'root';
  graphData.value = {
    rootId,
    nodes: graphNodes,
    lines: edges.value.map(e => ({
      id: `line-${e.flowEdgeFrom}-${e.flowEdgeTo}`,
      from: e.flowEdgeFrom,
      to: e.flowEdgeTo,
      text: e.flowEdgeText || '',
      data: {
        condField: e.flowEdgeCondField,
        condOp: e.flowEdgeCondOp,
        condValue: e.flowEdgeCondValue,
        priority: e.flowEdgePriority,
      },
    })),
  };
  pushGraphData();
};

const onGraphReady = () => {
  graphReady.value = true;
  pushGraphData();
};

/**
 * 把当前 graphData 推送到 RelationGraph 实例。
 * <p>initialData 仅在挂载时读取一次，异步加载完成后必须主动 setJsonData 刷新画布。</p>
 */
const pushGraphData = () => {
  if (!graphReady.value) return;
  const g = graphRef.value?.getInstance?.();
  if (g && typeof g.setJsonData === 'function' && graphData.value?.nodes?.length) {
    g.setJsonData(graphData.value);
  }
};

/**
 * 把后端 config JSON 安全解析成对象。
 */
function parseConfigSafe(json?: string): Record<string, any> {
  if (!json) return {};
  try {
    const obj = JSON.parse(json);
    return typeof obj === 'object' && obj !== null ? obj : {};
  } catch {
    return {};
  }
}

/**
 * 保存流程。
 */
const saveFlow = async () => {
  if (!flow.value.flowCode) {
    ElMessage.warning('流程编码不能为空');
    return;
  }
  saving.value = true;
  try {
    // 从画布采集 nodes/edges（按当前画布状态）
    collectFromGraph();
    const aggregate = {
      flow: flow.value,
      nodes: nodes.value,
      edges: edges.value,
    };
    const version = await spiderApi.saveFlow(aggregate, 'Web 端保存', 'admin');
    flow.value.flowVersion = version;
    ElMessage.success(`保存成功，当前版本 v${version}`);
    await loadFlow();
  } catch (e) {
    ElMessage.error('保存失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    saving.value = false;
  }
};

/**
 * 从画布当前状态采集 nodes/edges（供保存）。
 */
const collectFromGraph = () => {
  const g = graphRef.value?.getInstance?.();
  if (!g) return;
  const graphNodes = g.getNodes();
  const graphLines = g.getLines();

  nodes.value = graphNodes.map((n: any) => ({
    flowNodeKey: n.id,
    flowNodeType: ((n.data && n.data.type) || 'script') as SpiderNodeType,
    flowNodeName: (n.data && n.data.name) || n.text || '',
    flowNodeX: Math.round(n.x || 0),
    flowNodeY: Math.round(n.y || 0),
    flowNodeConfig: JSON.stringify((n.data && n.data.config) || {}),
    flowNodeStatus: 1,
  }));
  edges.value = graphLines.map((e: any) => ({
    flowEdgeFrom: e.from,
    flowEdgeTo: e.to,
    flowEdgeText: e.text || '',
    flowEdgeCondField: e.data?.condField || '',
    flowEdgeCondOp: e.data?.condOp || '',
    flowEdgeCondValue: e.data?.condValue || '',
    flowEdgePriority: e.data?.priority ?? 0,
  }));
};

/**
 * 校验流程：必须有 start 和 stop，start 不能有入边。
 */
const validateFlow = async () => {
  collectFromGraph();
  const starts = nodes.value.filter(n => n.flowNodeType === 'start');
  const stops = nodes.value.filter(n => n.flowNodeType === 'stop');
  if (starts.length === 0) {
    ElMessage.warning('流程缺少起始节点（start）');
    return false;
  }
  if (starts.length > 1) {
    ElMessage.warning('流程只能有一个起始节点');
    return false;
  }
  if (stops.length === 0) {
    ElMessage.warning('建议至少包含一个结束节点（stop）');
  }
  ElMessage.success('校验通过');
  return true;
};

/**
 * 自动布局。
 */
const autoLayout = async () => {
  const g = graphRef.value?.getInstance?.();
  if (g && typeof g.layout?.force === 'function') {
    await g.layout.force(1500);
  }
};

/**
 * 同步运行。
 */
const runFlow = async () => {
  if (!(await validateFlow())) return;
  if (!flow.value.flowId) {
    ElMessage.warning('请先保存流程');
    return;
  }
  running.value = true;
  try {
    const executionNo = await spiderApi.runFlow(flow.value.flowCode);
    ElMessage.success(`执行成功，批次号: ${executionNo}`);
    router.push(`/spider/flow-debug/${flow.value.flowCode}?executionNo=${executionNo}`);
  } catch (e) {
    ElMessage.error('执行失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    running.value = false;
  }
};

/**
 * 调试运行：打开弹窗展示节点日志。
 */
const debugFlow = async () => {
  if (!(await validateFlow())) return;
  debugging.value = true;
  try {
    if (!flow.value.flowId) {
      await saveFlow();
    }
    const logs = await spiderApi.debugFlow(flow.value.flowCode);
    debugLogs.value = logs || [];
    debugDialog.value = true;
    if (!debugLogs.value.length) {
      ElMessage.info('无节点执行日志，请检查流程是否有节点');
    }
  } catch (e) {
    ElMessage.error('调试失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    debugging.value = false;
  }
};

const onNodeClick = (node: any) => {
  selectedNode.value = node;
  selectedEdge.value = null;
};

const onLineClick = (line: any) => {
  selectedEdge.value = line;
  selectedNode.value = null;
};

const onNodeDragEnd = (node: any) => {
  // 节点拖动结束时同步 nodes 数组
  const idx = nodes.value.findIndex(n => n.flowNodeKey === node.id);
  if (idx >= 0) {
    nodes.value[idx].flowNodeX = Math.round(node.x);
    nodes.value[idx].flowNodeY = Math.round(node.y);
  }
};

const onLineBeCreated = (e: any) => {
  // 新连线自动加进 edges（onLineBeCreated 事件参数: { lineJson, fromNode, toNode }）
  const line = e?.lineJson || e;
  if (!line) return;
  const from = line.from;
  const to = line.to;
  if (!from || !to) return;
  if (!edges.value.find(ed => ed.flowEdgeFrom === from && ed.flowEdgeTo === to)) {
    edges.value.push({
      flowEdgeFrom: from,
      flowEdgeTo: to,
      flowEdgeText: '',
      flowEdgeCondField: '',
      flowEdgeCondOp: '',
      flowEdgeCondValue: '',
      flowEdgePriority: edges.value.length,
    });
  }
};

const removeSelected = () => {
  if (!selectedNode.value) return;
  const id = selectedNode.value.id;
  // 不能删除 start
  if (selectedNode.value.data?.type === 'start') {
    ElMessage.warning('起始节点不可删除');
    return;
  }
  const g = graphRef.value?.getInstance?.();
  if (g && typeof g.removeNodesByIds === 'function') {
    g.removeNodesByIds([id]);
  }
  nodes.value = nodes.value.filter(n => n.flowNodeKey !== id);
  edges.value = edges.value.filter(e => e.flowEdgeFrom !== id && e.flowEdgeTo !== id);
  selectedNode.value = null;
};

const removeSelectedEdge = () => {
  if (!selectedEdge.value) return;
  const id = selectedEdge.value.id;
  const g = graphRef.value?.getInstance?.();
  if (g && typeof g.removeLineByIds === 'function') {
    g.removeLineByIds([id]);
  }
  edges.value = edges.value.filter(
    e => !(e.flowEdgeFrom === selectedEdge.value.from && e.flowEdgeTo === selectedEdge.value.to)
  );
  selectedEdge.value = null;
};

watch(
  () => flowCode.value,
  () => loadFlow(),
  { immediate: true }
);

onMounted(loadFlow);
</script>

<style scoped>
.designer-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}
.header-bar {
  flex-shrink: 0;
  border-radius: 0;
}
.header-bar :deep(.el-card__body) {
  padding: 10px 16px;
}
.title {
  font-weight: 600;
  font-size: 16px;
  margin-left: 8px;
}
.designer-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.left-panel {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  padding: 12px;
  overflow-y: auto;
}
.right-panel {
  width: 320px;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  padding: 12px;
  overflow-y: auto;
}
.canvas {
  flex: 1;
  background: #fafbfc;
  position: relative;
}
.panel-title {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #ebeef5;
}
.palette-item {
  display: flex;
  align-items: center;
  padding: 8px;
  margin-bottom: 6px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.2s;
}
.palette-item:hover {
  background: #ecf5ff;
  border-color: #409eff;
}
.palette-item .palette-name {
  font-size: 13px;
  font-weight: 500;
}
.palette-item .palette-type {
  font-size: 11px;
  color: #909399;
}
.prop-form {
  background: #fafbfc;
  padding: 8px;
  border-radius: 4px;
}
.prop-empty {
  color: #909399;
  font-size: 12px;
  padding: 12px;
  text-align: center;
  background: #fafbfc;
  border-radius: 4px;
}
</style>

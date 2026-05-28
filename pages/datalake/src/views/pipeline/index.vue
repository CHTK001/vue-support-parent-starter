<template>
  <div class="pipeline-graph-page">
    <!-- 顶部工具栏 -->
    <div class="graph-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" size="small" @click="handleCreate">
          <el-icon><Plus /></el-icon> 创建 Pipeline
        </el-button>
        <el-input
          v-model="searchText"
          placeholder="搜索 Pipeline..."
          clearable
          style="width: 200px"
          size="small"
        />
      </div>
      <div class="toolbar-right">
        <el-tag type="info" effect="dark" class="mr-2">
          总计 <b>{{ filteredList.length }}</b> 个 Pipeline
        </el-tag>
        <el-button size="small" :icon="Refresh" @click="loadData" circle />
      </div>
    </div>

    <!-- 主体：左侧列表 + 右侧编辑器 -->
    <div class="graph-layout">
      <!-- 左侧 Pipeline 列表 -->
      <div class="pipeline-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">流水线列表</span>
          <div class="stats-dots">
            <span class="dot running" title="运行中" />
            <span class="dot stopped" title="已停止" />
          </div>
        </div>
        <div class="sidebar-list">
          <div
            v-for="item in filteredList"
            :key="item.id"
            class="pipeline-item"
            :class="{ active: selectedId === item.id }"
            @click="selectPipeline(item)"
          >
            <div class="item-indicator" :class="getLifecycle(item.id).toLowerCase()" />
            <div class="item-info">
              <div class="item-name">{{ item.name || item.id }}</div>
              <div class="item-meta">
                <span>{{ item.nodes?.length || 0 }} 节点</span>
                <span class="dot-sep">·</span>
                <span :class="'status-' + getLifecycle(item.id).toLowerCase()">
                  {{ lifecycleText(item.id) }}
                </span>
              </div>
            </div>
            <div class="item-actions" @click.stop>
              <el-button
                size="small"
                :type="getLifecycle(item.id) === 'RUNNING' ? 'warning' : 'success'"
                :icon="getLifecycle(item.id) === 'RUNNING' ? VideoPause : VideoPlay"
                circle
                @click="handleLifecycle(item.id, getLifecycle(item.id) === 'RUNNING' ? 'stop' : 'start')"
              />
              <el-popconfirm title="确定删除?" @confirm="handleDelete(item.id)">
                <template #reference>
                  <el-button size="small" type="danger" :icon="Delete" circle />
                </template>
              </el-popconfirm>
            </div>
          </div>
          <div v-if="!filteredList.length" class="sidebar-empty">
            <el-empty description="暂无 Pipeline" :image-size="80" />
          </div>
        </div>
      </div>

      <!-- 右侧编辑器区域 -->
      <div class="graph-main">
        <div v-if="!selectedPipeline" class="graph-placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.3">
            <circle cx="12" cy="5" r="2.5" />
            <circle cx="5" cy="19" r="2.5" />
            <circle cx="19" cy="19" r="2.5" />
            <line x1="12" y1="7.5" x2="5" y2="16.5" />
            <line x1="12" y1="7.5" x2="19" y2="16.5" />
            <line x1="7.5" y1="19" x2="16.5" y2="19" />
          </svg>
          <p>请从左侧选择 Pipeline 查看节点流向图</p>
        </div>

        <div v-else class="graph-container">
          <!-- 信息头 -->
          <div class="graph-info-bar">
            <div class="info-left">
              <span class="info-name">{{ selectedPipeline.name || selectedPipeline.id }}</span>
              <el-tag size="small" effect="dark" type="info">v{{ selectedPipeline.version }}</el-tag>
              <el-tag size="small" effect="dark" :type="lifecycleTagType(selectedPipeline.id)">
                {{ lifecycleText(selectedPipeline.id) }}
              </el-tag>
            </div>
            <div class="info-right">
              <span v-if="!isEditing" class="info-desc">{{ selectedPipeline.description || '暂无描述' }}</span>
              <el-button v-if="!isEditing" size="small" type="warning" plain :icon="VideoPlay" @click="openTestDialog">
                测试管线
              </el-button>
              <el-button v-if="!isEditing" size="small" type="primary" :icon="Edit" @click="enterEditMode">
                编辑流程
              </el-button>
              <template v-if="isEditing">
                <span class="edit-hint">编辑模式下拖拽节点、连线调整流程</span>
                <el-button size="small" :loading="saving" type="success" @click="saveFlow">
                  保存流程
                </el-button>
                <el-button size="small" @click="cancelEdit">取消</el-button>
              </template>
            </div>
          </div>

          <!-- FlowEditor + 配置面板（通过 slot 内嵌） -->
          <div class="graph-wrapper">
            <ScFlowEditor
              :mode="isEditing ? 'edit' : 'preview'"
              :nodes="editorNodes"
              :edges="editorEdges"
              :palette="palette"
              :selected-node-id="selectedNodeId"
              @node-click="onNodeClick"
              @pane-click="onPaneClick"
              @node-drop="onNodeDrop"
              @node-remove="onNodeRemove"
              @edge-remove="onEdgeRemove"
              @edge-create="onEdgeCreate"
              @node-moved="onNodeMoved"
            >
              <template #property-panel="{ node, close }">
                <div class="graph-config-panel">
                  <div class="config-panel-header">
                    <span class="config-panel-title">节点配置</span>
                    <el-button size="small" :icon="Close" circle text @click="close" />
                  </div>

                  <div class="config-panel-body">
                    <!-- 节点基本信息 -->
                    <div class="config-section">
                      <div class="config-section-title">基本信息</div>
                      <div class="config-field">
                        <label>节点类型</label>
                        <el-tag size="small" :color="getNodeColor(node.type!)" effect="dark">
                          {{ node.label || node.type }}
                        </el-tag>
                      </div>
                      <div class="config-field">
                        <label>节点 ID</label>
                        <el-input size="small" :model-value="node.id" disabled />
                      </div>
                    </div>

                    <!-- SPI 选择 -->
                    <div class="config-section">
                      <div class="config-section-title">SPI 实现</div>
                      <div class="config-field">
                        <label>选择实现</label>
                        <el-select
                          v-model="selectedNodeSpi"
                          size="small"
                          placeholder="选择 SPI 实现"
                          style="width: 100%"
                          :disabled="!isEditing"
                          @change="onSpiChange"
                        >
                          <el-option
                            v-for="spi in currentSpis"
                            :key="spi.name"
                            :label="spi.name"
                            :value="spi.name"
                          />
                          <el-option label="（默认）" value="" />
                        </el-select>
                      </div>
                    </div>

                    <!-- 配置参数 -->
                    <div class="config-section">
                      <div class="config-section-title">
                        配置参数
                        <el-button v-if="isEditing" size="small" text :icon="Plus" @click="addConfigEntry" />
                      </div>
                      <div v-if="configEntries.length === 0" class="config-empty">
                        暂无配置
                      </div>
                      <div v-for="(entry, idx) in configEntries" :key="idx" class="config-kv-row">
                        <el-input
                          v-model="entry.key"
                          size="small"
                          placeholder="参数名"
                          :disabled="!isEditing"
                        />
                        <el-input
                          v-model="entry.value"
                          size="small"
                          placeholder="值"
                          :disabled="!isEditing"
                        />
                        <el-button
                          v-if="isEditing"
                          size="small"
                          :icon="Delete"
                          circle
                          text
                          @click="removeConfigEntry(idx)"
                        />
                      </div>
                    </div>

                    <!-- 输出 Sink 配置（sink 节点专属） -->
                    <div v-if="node.type === 'sink'" class="config-section">
                      <div class="config-section-title">输出目标</div>
                      <div class="config-field">
                        <label>Sink 名称</label>
                        <el-select
                          v-model="selectedNodeSinkName"
                          size="small"
                          placeholder="选择 Sink"
                          style="width: 100%"
                          :disabled="!isEditing"
                        >
                          <el-option
                            v-for="sink in sinkSpis"
                            :key="sink.name"
                            :label="sink.name"
                            :value="sink.name"
                          />
                        </el-select>
                      </div>
                    </div>
                  </div>

                  <!-- 底部操作 -->
                  <div v-if="isEditing" class="config-panel-footer">
                    <el-button size="small" type="primary" @click="applyNodeConfig">
                      应用配置
                    </el-button>
                  </div>
                </div>
              </template>
            </ScFlowEditor>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <SaveDialog ref="saveRef" @success="loadData" />

    <!-- 测试管线对话框 -->
    <el-dialog v-model="testDialogVisible" title="测试管线" width="640px" destroy-on-close>
      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        <template #title>
          <span>向管线 <b>{{ selectedPipeline?.name }}</b> 同步提交测试数据，返回执行结果。</span>
        </template>
      </el-alert>
      <el-form label-width="90px">
        <el-form-item label="数据格式">
          <el-radio-group v-model="testForm.formatType">
            <el-radio value="json">JSON</el-radio>
            <el-radio value="text">纯文本</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Payload">
          <el-input
            v-model="testForm.payload"
            type="textarea"
            :rows="8"
            placeholder="输入测试数据..."
            style="font-family: monospace;"
          />
        </el-form-item>
      </el-form>
      <!-- 执行结果 -->
      <div v-if="testResult" class="test-result-section">
        <div class="test-result-header">
          <el-tag :type="testResult.status === 'filtered' ? 'warning' : 'success'" effect="dark" size="small">
            {{ testResult.status === 'filtered' ? '已过滤' : '执行成功' }}
          </el-tag>
          <span v-if="testResult.traceId" class="trace-id">traceId: {{ testResult.traceId }}</span>
        </div>
        <el-input
          :model-value="JSON.stringify(testResult, null, 2)"
          type="textarea"
          :rows="10"
          readonly
          style="font-family: monospace; margin-top: 8px;"
        />
      </div>
      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="testLoading" @click="executeTest">
          执行测试
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import {
  Plus, Refresh, VideoPlay, VideoPause,
  Delete, Edit, Close,
} from "@element-plus/icons-vue";
import { ScFlowEditor, getLfNodeType } from "@repo/components/ScFlowEditor";
import type { FlowEditorNode, FlowEditorEdge, FlowEditorPaletteItem } from "@repo/components/ScFlowEditor";
import {
  fetchPipelineList,
  fetchDeletePipeline,
  fetchStartPipeline,
  fetchStopPipeline,
  fetchPipelineStatus,
  fetchUpdatePipeline,
  fetchPipelineSpis,
  fetchSubmitPipeline,
} from "../../api/pipeline";
import type { ScGraph as ScGraphType, ScGraphNode, PipelineLifecycle } from "../../types";
import SaveDialog from "./save.vue";

defineOptions({ name: "DatalakePipelinePage" });

// ==================== Palette 定义 ====================
const palette: FlowEditorPaletteItem[] = [
  { kind: "source",       title: "数据源",   detail: "外部数据输入",      icon: "ri:database-2-line", color: "#10b981" },
  { kind: "parse",        title: "解析",     detail: "数据格式解析",      icon: "ri:search-eye-line", color: "#3b82f6" },
  { kind: "clean",        title: "清洗",     detail: "数据清洗去噪",      icon: "ri:spider-line",     color: "#8b5cf6" },
  { kind: "standardize",  title: "标准化",   detail: "数据标准化转换",    icon: "ri:flow-chart",      color: "#06b6d4" },
  { kind: "transform",    title: "转换",     detail: "通用数据转换",      icon: "ri:git-branch-line", color: "#f59e0b" },
  { kind: "filter",       title: "过滤",     detail: "条件过滤数据",      icon: "ri:link",            color: "#ef4444" },
  { kind: "enrich",       title: "富化",     detail: "数据补充增强",      icon: "ri:user-heart-line", color: "#ec4899" },
  { kind: "router",       title: "路由",     detail: "条件分支路由",      icon: "ri:global-line",     color: "#f59e0b" },
  { kind: "aggregate",    title: "聚合",     detail: "数据聚合汇总",      icon: "ri:play-circle-line",color: "#14b8a6" },
  { kind: "delay",        title: "延迟",     detail: "数据延迟处理",      icon: "ri:stop-circle-line",color: "#64748b" },
  { kind: "sink",         title: "输出",     detail: "数据输出目标",      icon: "ri:download-2-line", color: "#ef4444" },
];

// ==================== 类型映射 ====================
/** 节点类型中文标签 */
const TYPE_LABELS: Record<string, string> = {
  source: "数据源", sink: "输出", filter: "过滤", transform: "转换",
  enrich: "富化", router: "路由", aggregate: "聚合", delay: "延迟",
  parse: "解析", clean: "清洗", standardize: "标准化",
};

/** 后端 type → ScFlowEditor kind (控制节点形状: source→圆形, sink→圆形, router→菱形, 其他→矩形) */
const TYPE_TO_KIND: Record<string, string> = {
  source: "START",
  sink: "END",
  router: "CONDITION",
};

/** Pipeline lifecycle → FlowEditor runtimeStatus */
const LIFECYCLE_TO_RUNTIME: Record<string, string> = {
  RUNNING: "RUNNING",
  PAUSED: "WAIT_MANUAL",
  ERROR: "FAILED",
  RELOADING: "WAITING",
  STOPPED: "PENDING",
};

// ==================== 状态 ====================
const loading = ref(false);
const searchText = ref("");
const list = ref<ScGraphType[]>([]);
const lifecycles = ref<Record<string, PipelineLifecycle>>({});
const selectedId = ref<string>("");
const selectedPipeline = ref<ScGraphType | null>(null);
const saveRef = ref();
let pollTimer: ReturnType<typeof setInterval> | null = null;

// FlowEditor 数据 & 编辑状态
const editorNodes = ref<FlowEditorNode[]>([]);
const editorEdges = ref<FlowEditorEdge[]>([]);
const selectedNodeId = ref<string | null>(null);
const isEditing = ref(false);
const saving = ref(false);
let originalNodesJson: string | null = null;
let originalEdgesJson: string | null = null;

// 配置面板状态
const spiCatalog = ref<Record<string, Array<{ name: string }>>>({});
const selectedNodeSpi = ref("");
const selectedNodeSinkName = ref("");
const configEntries = ref<Array<{ key: string; value: string }>>([]);

// 测试对话框状态
const testDialogVisible = ref(false);
const testLoading = ref(false);
const testResult = ref<any>(null);
const testForm = reactive({
  formatType: "json" as "json" | "text",
  payload: "",
});

/** Node ID → { spi, config, sinkName } 映射，持久化节点配置 */
interface NodeConfigMeta { spi: string; config: Record<string, any>; sinkName?: string; }
const nodeConfigMap = ref<Record<string, NodeConfigMeta>>({});

// ==================== 计算属性 ====================
const filteredList = computed(() => {
  if (!searchText.value) return list.value;
  const q = searchText.value.toLowerCase();
  return list.value.filter(
    (g) => g.id.toLowerCase().includes(q) || g.name?.toLowerCase().includes(q)
  );
});

// 配置面板计算属性
const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null;
  return editorNodes.value.find((n) => n.id === selectedNodeId.value) || null;
});

const currentSpis = computed(() => {
  if (!selectedNode.value?.type) return [];
  return spiCatalog.value[selectedNode.value.type] || [];
});

const sinkSpis = computed(() => {
  return spiCatalog.value["sink"] || [];
});

const getNodeColor = (type: string): string => {
  const colors: Record<string, string> = {
    source: "#10b981", parse: "#3b82f6", clean: "#8b5cf6",
    standardize: "#06b6d4", transform: "#f59e0b", filter: "#ef4444",
    enrich: "#ec4899", router: "#f59e0b", aggregate: "#14b8a6",
    delay: "#64748b", sink: "#ef4444",
  };
  return colors[type] || "#64748b";
};

// ==================== 生命周期辅助 ====================
const getLifecycle = (id: string) => lifecycles.value[id] || "STOPPED";

const lifecycleText = (id: string) => {
  const map: Record<string, string> = {
    RUNNING: "运行中", PAUSED: "已停用", STOPPED: "已停用",
    ERROR: "异常", RELOADING: "重载中",
  };
  return map[getLifecycle(id)] || "未知";
};

const lifecycleTagType = (id: string) => {
  const lc = getLifecycle(id);
  if (lc === "RUNNING") return "success";
  if (lc === "ERROR") return "danger";
  return "info";
};

// ==================== 数据转换 ====================
/** Pipeline → FlowEditor nodes + edges */
function pipelineToEditor(pipeline: ScGraphType): { nodes: FlowEditorNode[]; edges: FlowEditorEdge[] } {
  if (!pipeline.nodes?.length) return { nodes: [], edges: [] };

  const nodes: FlowEditorNode[] = pipeline.nodes.map((node, idx) => {
    const kind = TYPE_TO_KIND[node.type] || node.type;
    return {
      id: `${pipeline.id}-${idx}`,
      type: getLfNodeType(kind),
      label: TYPE_LABELS[node.type] || node.spi || node.type,
      kind,
      position: { x: 100 + idx * 280, y: 220 },
    };
  });

  // 同步 nodeConfigMap
  const configMap: Record<string, NodeConfigMeta> = {};
  pipeline.nodes.forEach((node, idx) => {
    const nodeId = `${pipeline.id}-${idx}`;
    configMap[nodeId] = {
      spi: node.spi || "",
      config: node.config || {},
      sinkName: node.type === "sink" ? node.spi : undefined,
    };
  });
  nodeConfigMap.value = { ...nodeConfigMap.value, ...configMap };

  const edges: FlowEditorEdge[] = [];
  // 顺序边
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `e-${nodes[i].id}-${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
    });
  }
  // 条件分支边
  pipeline.nodes.forEach((node, idx) => {
    if (node.conditions?.length) {
      node.conditions.forEach((cond) => {
        const targetIdx = pipeline.nodes.findIndex(
          (n, i) => i !== idx && (cond.target === n.spi || cond.target === n.type)
        );
        if (targetIdx >= 0) {
          edges.push({
            id: `e-${nodes[idx].id}-${nodes[targetIdx].id}-cond`,
            source: nodes[idx].id,
            target: nodes[targetIdx].id,
            label: cond.when,
          });
        }
      });
    }
  });

  return { nodes, edges };
}

/** FlowEditor nodes + edges → Pipeline 节点数组 */
function editorToPipeline(nodes: FlowEditorNode[], edges: FlowEditorEdge[]): ScGraphNode[] {
  // 按 x 坐标排序
  const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x);

  return sorted.map((node) => {
    const pipelineType = node.type || "transform";
    const meta = nodeConfigMap.value[node.id];
    const spi = meta?.spi || node.label || node.id;
    const config = meta?.config || {};

    const result: ScGraphNode = {
      type: pipelineType,
      spi,
      config,
    };
    // 收集条件分支边
    const condEdges = edges.filter((e) => e.source === node.id && e.label);
    if (condEdges.length > 0) {
      result.conditions = condEdges.map((e) => ({
        when: e.label!,
        target: nodes.find((n) => n.id === e.target)?.type || e.target,
      }));
    }
    return result;
  });
}

/** 为节点附加运行时状态 + tooltip 信息 */
function applyRuntimeStatus(nodes: FlowEditorNode[], lifecycle: PipelineLifecycle): FlowEditorNode[] {
  const status = LIFECYCLE_TO_RUNTIME[lifecycle] || "PENDING";
  return nodes.map((n) => {
    const node: FlowEditorNode = { ...n, runtimeStatus: status };
    if (lifecycle === "RUNNING") {
      node.displayInfo = "运行中";
    } else if (lifecycle === "ERROR") {
      node.errorMessage = "管线异常";
    } else if (lifecycle === "RELOADING") {
      node.displayInfo = "重载中";
    }
    return node;
  });
}

// ==================== 操作 ====================
const selectPipeline = (item: ScGraphType) => {
  if (isEditing.value) {
    ElMessage.warning("请先保存或取消当前编辑");
    return;
  }
  selectedId.value = item.id;
  selectedPipeline.value = item;
  const converted = pipelineToEditor(item);
  editorNodes.value = applyRuntimeStatus(converted.nodes, getLifecycle(item.id));
  editorEdges.value = converted.edges;
  selectedNodeId.value = null;
  isEditing.value = false;
};

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await fetchPipelineList();
    list.value = data || [];
    const statuses = await Promise.allSettled(
      list.value.map((g) => fetchPipelineStatus(g.id))
    );
    statuses.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value?.data?.lifecycle) {
        lifecycles.value[list.value[i].id] = result.value.data.lifecycle as PipelineLifecycle;
      }
    });
    if (selectedId.value && !list.value.find((g) => g.id === selectedId.value)) {
      selectedId.value = "";
      selectedPipeline.value = null;
      isEditing.value = false;
      editorNodes.value = [];
      editorEdges.value = [];
    } else if (selectedId.value) {
      const updated = list.value.find((g) => g.id === selectedId.value);
      if (updated) {
        selectedPipeline.value = updated;
        if (!isEditing.value) {
          const converted = pipelineToEditor(updated);
          editorNodes.value = applyRuntimeStatus(converted.nodes, getLifecycle(updated.id));
          editorEdges.value = converted.edges;
        } else {
          // 编辑模式下只刷新运行时状态
          const lifecycle = getLifecycle(updated.id);
          if (lifecycle) {
            editorNodes.value = applyRuntimeStatus(editorNodes.value, lifecycle);
          }
        }
      }
    }
  } catch {} finally {
    loading.value = false;
  }
};

const handleCreate = () => saveRef.value?.open();
const handleEdit = (row: ScGraphType) => saveRef.value?.open(row);

const handleDelete = async (id: string) => {
  try {
    await fetchDeletePipeline(id);
    ElMessage.success("删除成功");
    loadData();
  } catch (e: any) {
    ElMessage.error(e?.msg || "删除失败");
  }
};

const handleLifecycle = async (id: string, action: string) => {
  try {
    if (action === "start") {
      await fetchStartPipeline(id);
      ElMessage.success("已启动");
    } else {
      await fetchStopPipeline(id);
      ElMessage.success("已停用");
    }
    loadData();
  } catch (e: any) {
    ElMessage.error(e?.msg || "操作失败");
  }
};

// ==================== 测试管线 ====================
function openTestDialog() {
  testForm.payload = testForm.formatType === "json"
    ? '{\n  "sensor": "temp-01",\n  "value": 23.5\n}'
    : "";
  testResult.value = null;
  testDialogVisible.value = true;
}

async function executeTest() {
  if (!selectedPipeline.value) return;
  if (!testForm.payload.trim()) {
    ElMessage.warning("请输入测试数据");
    return;
  }
  testLoading.value = true;
  testResult.value = null;
  try {
    let payload: any;
    if (testForm.formatType === "json") {
      try {
        payload = JSON.parse(testForm.payload);
      } catch {
        ElMessage.error("JSON 格式不正确，请检查语法");
        testLoading.value = false;
        return;
      }
    } else {
      payload = testForm.payload;
    }
    const res = await fetchSubmitPipeline(selectedPipeline.value.id, {
      payload,
      formatType: testForm.formatType,
    });
    testResult.value = res.data || res;
    ElMessage.success("测试执行完成");
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || "测试执行失败");
    testResult.value = { error: e?.msg || e?.message || "执行失败" };
  } finally {
    testLoading.value = false;
  }
}

// ==================== FlowEditor 事件 ====================
function onNodeClick(nodeId: string) {
  selectedNodeId.value = nodeId;
  // 从 nodeConfigMap 恢复配置面板状态
  const meta = nodeConfigMap.value[nodeId];
  selectedNodeSpi.value = meta?.spi || "";
  selectedNodeSinkName.value = meta?.sinkName || "";
  configEntries.value = meta?.config
    ? Object.entries(meta.config).map(([k, v]) => ({ key: k, value: String(v) }))
    : [];
}

function onPaneClick() {
  selectedNodeId.value = null;
  selectedNodeSpi.value = "";
  selectedNodeSinkName.value = "";
  configEntries.value = [];
}

function onNodeDrop(payload: { kind: string; position: { x: number; y: number } }) {
  const id = `new-${Date.now()}`;
  const kind = TYPE_TO_KIND[payload.kind] || payload.kind;
  editorNodes.value = [...editorNodes.value, {
    id,
    type: getLfNodeType(kind),
    label: TYPE_LABELS[payload.kind] || payload.kind,
    kind,
    position: payload.position,
  }];
  // 自动选中新节点并显示配置面板
  onNodeClick(id);
}

function onNodeRemove(nodeId: string) {
  editorNodes.value = editorNodes.value.filter((n) => n.id !== nodeId);
  editorEdges.value = editorEdges.value.filter((e) => e.source !== nodeId && e.target !== nodeId);
  if (selectedNodeId.value === nodeId) selectedNodeId.value = null;
}

function onEdgeRemove(edgeId: string) {
  editorEdges.value = editorEdges.value.filter((e) => e.id !== edgeId);
}

function onEdgeCreate(payload: { source: string; target: string }) {
  const id = `e-${payload.source}-${payload.target}`;
  if (editorEdges.value.some((e) => e.id === id)) return;
  editorEdges.value = [...editorEdges.value, {
    id,
    source: payload.source,
    target: payload.target,
  }];
}

function onNodeMoved(payload: { nodeId: string; position: { x: number; y: number } }) {
  const node = editorNodes.value.find((n) => n.id === payload.nodeId);
  if (node) node.position = payload.position;
}

// ==================== 配置面板操作 ====================
function onSpiChange(spiName: string) {
  if (!selectedNodeId.value) return;
  nodeConfigMap.value = {
    ...nodeConfigMap.value,
    [selectedNodeId.value]: {
      ...(nodeConfigMap.value[selectedNodeId.value] || { spi: "", config: {} }),
      spi: spiName,
    },
  };
}

function addConfigEntry() {
  configEntries.value = [...configEntries.value, { key: "", value: "" }];
}

function removeConfigEntry(idx: number) {
  configEntries.value = configEntries.value.filter((_, i) => i !== idx);
}

function applyNodeConfig() {
  if (!selectedNodeId.value) return;
  const config: Record<string, any> = {};
  configEntries.value.forEach((e) => {
    if (e.key) config[e.key] = e.value;
  });
  const existing = nodeConfigMap.value[selectedNodeId.value] || { spi: "", config: {} };
  nodeConfigMap.value = {
    ...nodeConfigMap.value,
    [selectedNodeId.value]: {
      ...existing,
      spi: selectedNodeSpi.value,
      config,
      sinkName: selectedNodeSinkName.value || undefined,
    },
  };
  ElMessage.success("配置已应用");
}

// ==================== 编辑操作 ====================
const enterEditMode = () => {
  originalNodesJson = JSON.stringify(editorNodes.value);
  originalEdgesJson = JSON.stringify(editorEdges.value);
  isEditing.value = true;
};

const cancelEdit = () => {
  if (originalNodesJson) {
    editorNodes.value = JSON.parse(originalNodesJson);
  }
  if (originalEdgesJson) {
    editorEdges.value = JSON.parse(originalEdgesJson);
  }
  isEditing.value = false;
  originalNodesJson = null;
  originalEdgesJson = null;
};

const saveFlow = async () => {
  if (!selectedPipeline.value) return;
  saving.value = true;
  try {
    const nodes = editorToPipeline(editorNodes.value, editorEdges.value);
    const payload: Partial<ScGraphType> = {
      id: selectedPipeline.value.id,
      name: selectedPipeline.value.name,
      version: selectedPipeline.value.version,
      description: selectedPipeline.value.description,
      nodes,
    };
    await fetchUpdatePipeline(payload);
    ElMessage.success("流程已保存");

    // 更新本地状态
    selectedPipeline.value = { ...selectedPipeline.value, nodes };
    const listItem = list.value.find((g) => g.id === selectedPipeline.value!.id);
    if (listItem) listItem.nodes = nodes;

    isEditing.value = false;
    originalNodesJson = null;
    originalEdgesJson = null;
  } catch (e: any) {
    ElMessage.error(e?.msg || "保存失败");
  } finally {
    saving.value = false;
  }
};

// ==================== 生命周期 ====================
onMounted(() => {
  loadData();
  pollTimer = setInterval(loadData, 15000);
  // 加载 SPI 清单
  fetchPipelineSpis().then((res) => {
    if (res.data) spiCatalog.value = res.data;
  }).catch(() => {});
});

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped lang="scss">
.pipeline-graph-page {
  height: calc(100vh - 300px);
  min-height: 500px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.graph-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  backdrop-filter: blur(8px);

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.graph-layout {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
}

/* ── 左侧边栏 ── */
.pipeline-sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
  backdrop-filter: blur(8px);

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;

    .stats-dots {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      &.running { background: #67c23a; box-shadow: 0 0 6px #67c23a66; }
      &.stopped { background: #909399; box-shadow: 0 0 6px #90939966; }
    }
  }

  .sidebar-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  }
}

.pipeline-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  &.active {
    background: rgba(0, 255, 255, 0.08);
    border: 1px solid rgba(0, 255, 255, 0.15);
  }

  .item-indicator {
    width: 4px;
    height: 32px;
    border-radius: 2px;
    flex-shrink: 0;

    &.running { background: #67c23a; box-shadow: 0 0 8px #67c23a66; }
    &.stopped { background: #909399; }
    &.error { background: #f56c6c; }
    &.reloading { background: #409eff; }
  }

  .item-info {
    flex: 1;
    min-width: 0;

    .item-name {
      font-size: 13px;
      font-weight: 500;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-meta {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 4px;

      .dot-sep { opacity: 0.3; }
      .status-running { color: #67c23a; }
      .status-stopped { color: #909399; }
      .status-error { color: #f56c6c; }
    }
  }

  .item-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .item-actions {
    opacity: 1;
  }
}

.sidebar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

/* ── 右侧主区域 ── */
.graph-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.graph-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: rgba(255, 255, 255, 0.3);

  p {
    font-size: 14px;
    margin: 0;
  }
}

.graph-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.graph-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;

  .info-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .info-name {
      font-size: 14px;
      font-weight: 600;
      color: #e2e8f0;
    }
  }
  .info-right {
    display: flex;
    align-items: center;
    gap: 8px;

    .info-desc {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .edit-hint {
      font-size: 12px;
      color: rgba(0, 255, 255, 0.6);
    }
  }
}

.graph-wrapper {
  flex: 1;
  min-height: 0;
}

/* ── 节点配置面板 ── */
.graph-config-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.config-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.config-panel-title {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
}

.config-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-section-title {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-field label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.config-empty {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
  text-align: center;
  padding: 12px 0;
}

.config-kv-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.config-kv-row .el-input {
  flex: 1;
}

.config-panel-footer {
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

/* ── 测试结果面板 ── */
.test-result-section {
  margin-top: 12px;
  padding: 12px;
  background: rgba(6, 10, 20, 0.8);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.test-result-header {
  display: flex;
  align-items: center;
  gap: 8px;

  .trace-id {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.35);
    font-family: monospace;
  }
}
</style>

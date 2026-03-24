<template>
  <div class="sync-task-design system-container modern-bg">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <span class="task-name">{{ taskData?.syncTaskName || "加载中..." }}</span>
        <el-tag v-if="taskData" :type="getStatusType(taskData.syncTaskStatus)">
          {{ getStatusText(taskData.syncTaskStatus) }}
        </el-tag>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" :loading="saving" @click="handleSave">
          <el-icon><DocumentChecked /></el-icon>
          保存
        </el-button>
        <el-button @click="handleValidate">
          <el-icon><CircleCheck /></el-icon>
          验证
        </el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-wrapper">
      <!-- 左侧节点面板 -->
      <div class="node-panel">
        <el-collapse v-model="activeCollapse">
          <el-collapse-item title="输入节点" name="INPUT">
            <div class="node-list">
              <div
                v-for="spi in spiMap.INPUT"
                :key="spi.name"
                class="node-item input"
                draggable="true"
                @dragstart="handleDragStart($event, 'INPUT', spi)"
              >
                <el-icon><Download /></el-icon>
                <span>{{ spi.displayName }}</span>
              </div>
            </div>
          </el-collapse-item>
          <el-collapse-item title="输出节点" name="OUTPUT">
            <div class="node-list">
              <div
                v-for="spi in spiMap.OUTPUT"
                :key="spi.name"
                class="node-item output"
                draggable="true"
                @dragstart="handleDragStart($event, 'OUTPUT', spi)"
              >
                <el-icon><Upload /></el-icon>
                <span>{{ spi.displayName }}</span>
              </div>
            </div>
          </el-collapse-item>
          <el-collapse-item title="数据中心" name="DATA_CENTER">
            <div class="node-list">
              <div
                v-for="spi in spiMap.DATA_CENTER"
                :key="spi.name"
                class="node-item datacenter"
                draggable="true"
                @dragstart="handleDragStart($event, 'DATA_CENTER', spi)"
              >
                <el-icon><Connection /></el-icon>
                <span>{{ spi.displayName }}</span>
              </div>
            </div>
          </el-collapse-item>
          <el-collapse-item title="过滤器" name="FILTER">
            <div class="node-list">
              <div
                v-for="spi in spiMap.FILTER"
                :key="spi.name"
                class="node-item filter"
                draggable="true"
                @dragstart="handleDragStart($event, 'FILTER', spi)"
              >
                <el-icon><Filter /></el-icon>
                <span>{{ spi.displayName }}</span>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- ScReteEditor 组件 -->
      <div
        class="editor-container"
        @dragover="handleDragOver"
        @drop="handleDrop"
      >
        <ScReteEditor
          ref="editorRef"
          v-model="editorData"
          :show-toolbar="true"
          :show-node-panel="false"
          :show-property-panel="false"
          :show-statusbar="true"
          :minimap="true"
          :context-menu="false"
          :auto-arrange="true"
          background="dots"
          :zoom="{ min: 0.2, max: 2 }"
          :node-menu-items="[]"
          @node-selected="handleNodeSelected"
          @data-changed="handleDataChanged"
        >
          <template #toolbar-center>
            <span class="toolbar-title">同步任务设计器</span>
          </template>
        </ScReteEditor>
      </div>

      <!-- 右侧属性面板 -->
      <div class="property-panel" :class="{ open: selectedSyncNode }">
        <template v-if="selectedSyncNode">
          <div class="panel-header">
            <span>节点配置</span>
            <el-button text size="small" @click="selectedSyncNode = null">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div class="panel-content">
            <el-form label-position="top" size="small">
              <el-form-item label="节点名称">
                <el-input v-model="selectedSyncNode.syncNodeName" placeholder="请输入节点名称" />
              </el-form-item>
              <el-form-item label="节点类型">
                <el-input :value="getNodeTypeText(selectedSyncNode.syncNodeType)" disabled />
              </el-form-item>
              <el-form-item label="SPI类型">
                <el-input :value="selectedSyncNode.syncNodeSpiName" disabled />
              </el-form-item>

              <!-- 动态参数配置 -->
              <template v-if="selectedNodeParams.length > 0">
                <el-divider>参数配置</el-divider>
                <el-form-item
                  v-for="param in selectedNodeParams"
                  :key="param.name"
                  :label="param.label"
                >
                  <el-input
                    v-if="param.type === 'string'"
                    v-model="nodeConfig[param.name]"
                    :placeholder="param.placeholder || param.description"
                  />
                  <el-input
                    v-else-if="param.type === 'password'"
                    v-model="nodeConfig[param.name]"
                    type="password"
                    show-password
                    :placeholder="param.placeholder || param.description"
                  />
                  <el-input
                    v-else-if="param.type === 'textarea'"
                    v-model="nodeConfig[param.name]"
                    type="textarea"
                    :rows="3"
                    :placeholder="param.placeholder || param.description"
                  />
                  <el-input-number
                    v-else-if="param.type === 'number'"
                    v-model="nodeConfig[param.name]"
                    :min="param.min"
                    :max="param.max"
                  />
                  <el-switch
                    v-else-if="param.type === 'boolean'"
                    v-model="nodeConfig[param.name]"
                  />
                  <el-select
                    v-else-if="param.type === 'select'"
                    v-model="nodeConfig[param.name]"
                    :placeholder="param.placeholder"
                  >
                    <el-option
                      v-for="opt in param.options"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
              </template>

              <el-form-item>
                <el-button type="primary" @click="handleSaveNodeConfig">
                  保存配置
                </el-button>
                <el-button 
                  v-if="selectedSyncNode.syncNodeType === 'INPUT' || selectedSyncNode.syncNodeType === 'OUTPUT'" 
                  @click="handleTestConnection"
                >
                  测试连接
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </template>
        <el-empty v-else description="请选择节点" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  DocumentChecked,
  CircleCheck,
  Close,
  Download,
  Upload,
  Connection,
  Filter,
} from "@element-plus/icons-vue";
import { ScReteEditor, type EditorData, type NodeTypeName, type BaseNode } from "@repo/components";
import {
  getSyncTaskDesign,
  saveSyncTaskDesign,
  validateSyncTaskDesign,
  getAllSpiTypes,
  getSpiParameters,
  testSpiConnection,
  type SyncTask,
  type SyncNode,
  type SyncConnection,
  type SpiInfo,
  type SpiParameter,
} from "@/api/sync";

const route = useRoute();
const router = useRouter();

const taskId = computed(() => Number(route.params.taskId));

// 编辑器引用
const editorRef = ref<InstanceType<typeof ScReteEditor>>();

// 任务数据
const taskData = ref<SyncTask | null>(null);
const saving = ref(false);

// 编辑器数据 (ScReteEditor 格式)
const editorData = ref<EditorData>({
  nodes: [],
  connections: [],
});

// 同步节点数据（原始格式，用于属性面板和保存）
const syncNodes = ref<SyncNode[]>([]);
const syncConnections = ref<SyncConnection[]>([]);

// SPI 数据
const spiMap = reactive<{
  INPUT: SpiInfo[];
  OUTPUT: SpiInfo[];
  DATA_CENTER: SpiInfo[];
  FILTER: SpiInfo[];
}>({
  INPUT: [],
  OUTPUT: [],
  DATA_CENTER: [],
  FILTER: [],
});
const activeCollapse = ref(["INPUT", "OUTPUT", "DATA_CENTER", "FILTER"]);

// 选中状态
const selectedSyncNode = ref<SyncNode | null>(null);
const selectedNodeParams = ref<SpiParameter[]>([]);
const nodeConfig = reactive<Record<string, any>>({});

// 拖拽数据
let draggedSpi: { nodeType: string; spiName: string; displayName: string } | null = null;

// 生成唯一ID
const generateNodeKey = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 节点类型映射
const syncTypeToEditorType: Record<string, NodeTypeName> = {
  INPUT: "input",
  OUTPUT: "output",
  DATA_CENTER: "process",
  FILTER: "condition",
};

const editorTypeToSyncType: Record<string, string> = {
  input: "INPUT",
  output: "OUTPUT",
  process: "DATA_CENTER",
  condition: "FILTER",
};

// ============== 数据转换函数 ==============

/**
 * 将 SyncNode/SyncConnection 转换为 EditorData
 */
function convertToEditorData(nodes: SyncNode[], connections: SyncConnection[]): EditorData {
  return {
    nodes: nodes.map((node) => {
      let position = { x: 100, y: 100 };
      if (node.syncNodePosition) {
        try {
          position = JSON.parse(node.syncNodePosition);
        } catch (e) {}
      }
      
      return {
        id: node.syncNodeKey || `node_${node.syncNodeId || Date.now()}`,
        type: syncTypeToEditorType[node.syncNodeType] || "process",
        label: node.syncNodeName || node.syncNodeSpiName || "未命名节点",
        position,
        controls: {},
      };
    }),
    connections: connections.map((conn) => ({
      sourceId: conn.sourceNodeKey || "",
      sourceOutput: conn.sourceHandle || "output",
      targetId: conn.targetNodeKey || "",
      targetInput: conn.targetHandle || "input",
    })),
  };
}

/**
 * 将 EditorData 转换回 SyncNode/SyncConnection
 */
function convertFromEditorData(data: EditorData): { nodes: SyncNode[]; connections: SyncConnection[] } {
  const nodeMap = new Map(syncNodes.value.map((n) => [n.syncNodeKey, n]));
  
  const nodes: SyncNode[] = data.nodes.map((editorNode) => {
    const existing = nodeMap.get(editorNode.id);
    return {
      ...existing,
      syncNodeKey: editorNode.id,
      syncNodeType: (editorTypeToSyncType[editorNode.type] || "DATA_CENTER") as any,
      syncNodeName: editorNode.label,
      syncNodePosition: JSON.stringify(editorNode.position),
      syncNodeSpiName: existing?.syncNodeSpiName || "Unknown",
      syncNodeEnabled: 1,
    };
  });
  
  const connections: SyncConnection[] = data.connections.map((conn) => ({
    sourceNodeKey: conn.sourceId,
    sourceHandle: conn.sourceOutput,
    targetNodeKey: conn.targetId,
    targetHandle: conn.targetInput,
    connectionType: "DATA",
  }));
  
  return { nodes, connections };
}

// ============== 事件处理 ==============

// 拖拽开始
function handleDragStart(event: DragEvent, nodeType: string, spi: SpiInfo) {
  draggedSpi = { nodeType, spiName: spi.name, displayName: spi.displayName };
  event.dataTransfer?.setData("text/plain", JSON.stringify(draggedSpi));
}

// 拖拽悬停
function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
}

// 拖拽放下 - 创建新节点
function handleDrop(event: DragEvent) {
  event.preventDefault();
  
  if (!draggedSpi) return;
  
  // 获取放下位置相对于编辑器的坐标
  const editorContainer = event.currentTarget as HTMLElement;
  const rect = editorContainer.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // 创建新的 SyncNode
  const newNodeKey = generateNodeKey();
  const newSyncNode: SyncNode = {
    syncNodeKey: newNodeKey,
    syncNodeType: draggedSpi.nodeType as any,
    syncNodeSpiName: draggedSpi.spiName,
    syncNodeName: draggedSpi.displayName,
    syncNodePosition: JSON.stringify({ x, y }),
    syncNodeEnabled: 1,
    syncNodeConfig: "{}",
  };
  
  // 添加到 syncNodes
  syncNodes.value.push(newSyncNode);
  
  // 创建对应的编辑器节点
  const newEditorNode = {
    id: newNodeKey,
    type: syncTypeToEditorType[draggedSpi.nodeType] || "process",
    label: draggedSpi.displayName,
    position: { x, y },
    controls: {},
  };
  
  // 更新编辑器数据
  editorData.value = {
    ...editorData.value,
    nodes: [...editorData.value.nodes, newEditorNode],
  };
  
  // 清除拖拽数据
  draggedSpi = null;
  
  ElMessage.success(`已添加节点: ${newSyncNode.syncNodeName}`);
}

// 节点选中
async function handleNodeSelected(node: BaseNode | null) {
  if (!node) {
    selectedSyncNode.value = null;
    return;
  }
  
  const syncNode = syncNodes.value.find((n) => n.syncNodeKey === node.id);
  if (syncNode) {
    selectedSyncNode.value = syncNode;
    
    // 加载参数配置
    if (syncNode.syncNodeType && syncNode.syncNodeSpiName) {
      try {
        const res = await getSpiParameters(syncNode.syncNodeType, syncNode.syncNodeSpiName);
        if (res.data?.success) {
          selectedNodeParams.value = res.data.data || [];
        }
      } catch (e) {
        selectedNodeParams.value = [];
      }
    }
    
    // 解析现有配置
    Object.keys(nodeConfig).forEach((key) => delete nodeConfig[key]);
    if (syncNode.syncNodeConfig) {
      try {
        Object.assign(nodeConfig, JSON.parse(syncNode.syncNodeConfig));
      } catch (e) {}
    }
    
    // 设置默认值
    selectedNodeParams.value.forEach((param) => {
      if (nodeConfig[param.name] === undefined && param.defaultValue !== undefined) {
        nodeConfig[param.name] = param.defaultValue;
      }
    });
  }
}

// 数据变化
function handleDataChanged(data: EditorData) {
  // 更新连接
  const { connections } = convertFromEditorData(data);
  syncConnections.value = connections;
  
  // 更新节点位置和名称
  data.nodes.forEach((editorNode) => {
    const syncNode = syncNodes.value.find((n) => n.syncNodeKey === editorNode.id);
    if (syncNode) {
      syncNode.syncNodePosition = JSON.stringify(editorNode.position);
      syncNode.syncNodeName = editorNode.label;
    }
  });
  
  // 删除不存在的节点
  const editorNodeIds = new Set(data.nodes.map((n) => n.id));
  syncNodes.value = syncNodes.value.filter((n) => editorNodeIds.has(n.syncNodeKey || ""));
}

// ============== 业务操作 ==============

// 加载 SPI 列表
const loadSpiList = async () => {
  try {
    const res = await getAllSpiTypes();
    if (res.data?.success && res.data.data) {
      const data = res.data.data;
      spiMap.INPUT = data.input || [];
      spiMap.OUTPUT = data.output || [];
      spiMap.DATA_CENTER = data.dataCenter || [];
      spiMap.FILTER = data.filter || [];
    }
  } catch (e) {
    console.error(e);
  }
};

// 加载任务设计数据
const loadTaskDesign = async () => {
  try {
    const res = await getSyncTaskDesign(taskId.value);
    if (res.data?.success && res.data.data) {
      const design = res.data.data;
      taskData.value = design.task;
      syncNodes.value = design.nodes || [];
      syncConnections.value = design.connections || [];
      
      // 转换为编辑器数据
      editorData.value = convertToEditorData(syncNodes.value, syncConnections.value);
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("加载任务设计失败");
  }
};

// 保存任务设计
const handleSave = async () => {
  saving.value = true;
  try {
    const data = editorRef.value?.getData() || editorData.value;
    const { nodes, connections } = convertFromEditorData(data);
    
    // 保留原有的配置信息
    nodes.forEach((node) => {
      const original = syncNodes.value.find((n) => n.syncNodeKey === node.syncNodeKey);
      if (original) {
        node.syncNodeConfig = original.syncNodeConfig;
        node.syncNodeSpiName = original.syncNodeSpiName;
      }
    });
    
    const res = await saveSyncTaskDesign(taskId.value, {
      task: taskData.value || undefined,
      nodes,
      connections,
    });
    if (res.data?.success) {
      ElMessage.success("保存成功");
    } else {
      ElMessage.error(res.data?.msg || "保存失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
};

// 验证设计
const handleValidate = async () => {
  try {
    const data = editorRef.value?.getData() || editorData.value;
    const { nodes, connections } = convertFromEditorData(data);
    
    const res = await validateSyncTaskDesign({
      task: taskData.value || undefined,
      nodes,
      connections,
    });
    if (res.data?.success && res.data.data) {
      ElMessage.success("验证通过");
    } else {
      ElMessage.error(res.data?.msg || "验证失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("验证失败");
  }
};

// 返回
const handleBack = () => {
  router.push({ name: "SyncManagement" });
};

// 状态显示
const getStatusType = (status?: string) => {
  const map: Record<string, string> = {
    STOPPED: "info",
    RUNNING: "success",
    ERROR: "danger",
  };
  return map[status || ""] || "info";
};

const getStatusText = (status?: string) => {
  const map: Record<string, string> = {
    STOPPED: "已停止",
    RUNNING: "运行中",
    ERROR: "异常",
  };
  return map[status || ""] || status || "";
};

const getNodeTypeText = (type?: string) => {
  const map: Record<string, string> = {
    INPUT: "输入",
    OUTPUT: "输出",
    DATA_CENTER: "数据中心",
    FILTER: "过滤器",
  };
  return map[type || ""] || type || "";
};

// 保存节点配置
const handleSaveNodeConfig = () => {
  if (!selectedSyncNode.value) return;
  selectedSyncNode.value.syncNodeConfig = JSON.stringify(nodeConfig);
  ElMessage.success("配置已保存");
};

// 测试连接
const handleTestConnection = async () => {
  if (!selectedSyncNode.value) return;
  try {
    const res = await testSpiConnection(
      selectedSyncNode.value.syncNodeType!,
      selectedSyncNode.value.syncNodeSpiName!,
      nodeConfig
    );
    if (res.data?.success) {
      ElMessage.success(res.data.data || "连接成功");
    } else {
      ElMessage.error(res.data?.msg || "连接失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("测试失败");
  }
};

onMounted(() => {
  loadSpiList();
  if (taskId.value) {
    loadTaskDesign();
  }
});
</script>

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.sync-task-design {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .task-name {
        font-size: 16px;
        font-weight: 500;
      }
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }
  }

  .editor-wrapper {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;

    // 左侧节点面板
    .node-panel {
      width: 220px;
      background: var(--el-fill-color-lighter);
      border-right: 1px solid var(--el-border-color-lighter);
      overflow-y: auto;
      flex-shrink: 0;

      .node-list {
        padding: 8px;
      }

      .node-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        margin-bottom: 8px;
        border-radius: 6px;
        cursor: grab;
        transition: all 0.2s;

        &.input {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid #10b981;
          color: #10b981;
        }
        &.output {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid #f59e0b;
          color: #f59e0b;
        }
        &.datacenter {
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid #6366f1;
          color: #6366f1;
        }
        &.filter {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid #8b5cf6;
          color: #8b5cf6;
        }

        &:hover {
          transform: translateX(4px);
        }

        &:active {
          cursor: grabbing;
        }

        span {
          font-size: 13px;
          color: var(--el-text-color-primary);
        }
      }
    }

    // 编辑器容器
    .editor-container {
      flex: 1;
      display: flex;
      min-height: 0;
    }

    // ScReteEditor 样式覆盖
    :deep(.sc-rete-editor) {
      flex: 1;
      border-radius: 0;
      border: none;
      min-height: auto;
    }

    .toolbar-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    // 右侧属性面板
    .property-panel {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 0;
      background: var(--el-bg-color);
      border-left: 1px solid var(--el-border-color-lighter);
      overflow: hidden;
      transition: width 0.3s ease;
      z-index: 100;
      display: flex;
      flex-direction: column;

      &.open {
        width: 320px;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        font-weight: 600;
        font-size: 14px;
        color: var(--el-text-color-primary);
        border-bottom: 1px solid var(--el-border-color-lighter);
        flex-shrink: 0;
      }

      .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .el-empty {
        margin-top: 100px;
      }
    }
  }
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>

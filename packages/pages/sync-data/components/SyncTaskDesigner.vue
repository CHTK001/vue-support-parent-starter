<template>
  <div class="sync-task-designer">
    <div class="designer-toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button size="small" @click="handleZoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button size="small" @click="handleZoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button size="small" @click="handleResetZoom">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-button-group>
        <el-divider direction="vertical" />
        <el-button size="small" @click="handleClear">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
        <el-button size="small" @click="handleValidate">
          <el-icon><CircleCheck /></el-icon>
          验证
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button size="small" @click="handleCancel">取消</el-button>
        <el-button type="primary" size="small" :loading="saving" @click="handleSave">
          保存
        </el-button>
      </div>
    </div>

    <div class="designer-content">
      <!-- 节点面板 -->
      <div class="node-panel">
        <div class="panel-title">节点类型</div>
        <div class="node-types">
          <div
            v-for="nodeType in nodeTypes"
            :key="nodeType.type"
            class="node-type-item"
            draggable="true"
            @dragstart="handleDragStart($event, nodeType)"
          >
            <el-icon :class="nodeType.icon">
              <component :is="nodeType.iconComponent" />
            </el-icon>
            <span>{{ nodeType.label }}</span>
          </div>
        </div>
      </div>

      <!-- 画布区域 -->
      <div
        ref="canvasRef"
        class="designer-canvas"
        :style="{ transform: `scale(${zoom})`, transformOrigin: 'top left' }"
        @drop="handleDrop"
        @dragover.prevent
        @click="handleCanvasClick"
      >
        <!-- 节点 -->
        <div
          v-for="node in nodes"
          :key="node.syncNodeKey"
          class="designer-node"
          :class="{
            'node-selected': selectedNode?.syncNodeKey === node.syncNodeKey,
            [`node-type-${node.syncNodeType?.toLowerCase()}`]: true,
          }"
          :style="getNodeStyle(node)"
          @mousedown="handleNodeMouseDown($event, node)"
          @click.stop="handleNodeClick(node)"
        >
          <div class="node-header">
            <el-icon class="node-icon">
              <component :is="getNodeIcon(node.syncNodeType)" />
            </el-icon>
            <span class="node-title">{{ node.syncNodeName || node.syncNodeType }}</span>
            <el-button
              text
              size="small"
              class="node-delete"
              @click.stop="handleDeleteNode(node)"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div class="node-body">
            <div class="node-info">{{ node.syncNodeSpiName }}</div>
            <div v-if="node.syncNodeDesc" class="node-desc">{{ node.syncNodeDesc }}</div>
          </div>
          <!-- 连接点 -->
          <div class="node-handles">
            <div
              v-if="canHaveInput(node.syncNodeType)"
              class="node-handle node-handle-input"
              @mousedown.stop="handleConnectionStart($event, node, 'input')"
            >
              <div class="handle-dot"></div>
            </div>
            <div
              v-if="canHaveOutput(node.syncNodeType)"
              class="node-handle node-handle-output"
              @mousedown.stop="handleConnectionStart($event, node, 'output')"
            >
              <div class="handle-dot"></div>
            </div>
          </div>
        </div>

        <!-- 连线 -->
        <svg class="connections-layer" :width="canvasWidth" :height="canvasHeight">
          <path
            v-for="connection in connections"
            :key="`${connection.sourceNodeKey}-${connection.targetNodeKey}`"
            :d="getConnectionPath(connection)"
            class="connection-line"
            :class="{ 'connection-selected': isConnectionSelected(connection) }"
            @click.stop="handleConnectionClick(connection)"
          />
        </svg>

        <!-- 临时连线（拖拽中） -->
        <svg
          v-if="connecting"
          class="connections-layer"
          :width="canvasWidth"
          :height="canvasHeight"
        >
          <path :d="getTempConnectionPath()" class="connection-line connection-temp" />
        </svg>
      </div>
    </div>

    <!-- 节点配置面板 -->
    <el-drawer
      v-model="configDrawerVisible"
      title="节点配置"
      :size="400"
      :before-close="handleConfigClose"
    >
      <el-form
        v-if="selectedNode"
        ref="configFormRef"
        :model="nodeConfig"
        label-width="100px"
      >
        <el-form-item label="节点名称">
          <el-input v-model="nodeConfig.syncNodeName" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label="节点类型">
          <el-input v-model="nodeConfig.syncNodeType" disabled />
        </el-form-item>
        <el-form-item label="SPI名称">
          <el-input v-model="nodeConfig.syncNodeSpiName" placeholder="如: jdbc/csv/local" />
        </el-form-item>
        <el-form-item label="节点描述">
          <el-input
            v-model="nodeConfig.syncNodeDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入节点描述"
          />
        </el-form-item>
        <el-form-item label="配置参数">
          <el-input
            v-model="nodeConfig.syncNodeConfig"
            type="textarea"
            :rows="6"
            placeholder='请输入JSON配置，如: {"url":"jdbc:mysql://...","username":"root"}'
          />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch
            v-model="nodeConfig.syncNodeEnabled"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configDrawerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfigSave">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import {
  ZoomIn,
  ZoomOut,
  FullScreen,
  Delete,
  CircleCheck,
  Close,
  Box,
  Upload,
  Filter,
  Connection,
} from "@element-plus/icons-vue";
import type { SyncNode, SyncConnection, SyncTaskDesign } from "../api";
import { fetchSaveTaskDesign, fetchValidateTaskDesign } from "../api";

interface NodeType {
  type: string;
  label: string;
  icon: string;
  iconComponent: any;
}

const props = defineProps<{
  taskId?: number;
  design?: SyncTaskDesign;
}>();

const emit = defineEmits<{
  (e: "save", design: SyncTaskDesign): void;
  (e: "cancel"): void;
}>();

// 节点类型定义
const nodeTypes: NodeType[] = [
  { type: "INPUT", label: "数据源", icon: "database", iconComponent: Box },
  { type: "OUTPUT", label: "目标源", icon: "upload", iconComponent: Upload },
  { type: "FILTER", label: "过滤器", icon: "filter", iconComponent: Filter },
  { type: "DATA_CENTER", label: "数据中心", icon: "connection", iconComponent: Connection },
];

// 画布相关
const canvasRef = ref<HTMLElement>();
const canvasWidth = ref(2000);
const canvasHeight = ref(2000);
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);

// 节点和连线
const nodes = ref<SyncNode[]>([]);
const connections = ref<SyncConnection[]>([]);
const selectedNode = ref<SyncNode | null>(null);
const selectedConnection = ref<SyncConnection | null>(null);

// 拖拽相关
const draggingNode = ref<SyncNode | null>(null);
const dragOffset = ref({ x: 0, y: 0 });
const connecting = ref(false);
const connectionStart = ref<{ node: SyncNode; handle: string } | null>(null);
const connectionEnd = ref<{ x: number; y: number } | null>(null);

// 配置面板
const configDrawerVisible = ref(false);
const configFormRef = ref<FormInstance>();
const nodeConfig = reactive<Partial<SyncNode>>({});

// 保存状态
const saving = ref(false);

// 初始化
onMounted(() => {
  if (props.design) {
    nodes.value = props.design.nodes || [];
    connections.value = props.design.connections || [];
  }
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
});

onUnmounted(() => {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
});

// 节点位置解析
const parseNodePosition = (position?: string) => {
  if (!position) {
    return { x: 100, y: 100 };
  }
  try {
    return JSON.parse(position);
  } catch {
    return { x: 100, y: 100 };
  }
};

// 获取节点样式
const getNodeStyle = (node: SyncNode) => {
  const pos = parseNodePosition(node.syncNodePosition);
  return {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
  };
};

// 节点图标
const getNodeIcon = (type?: string) => {
  const nodeType = nodeTypes.find((nt) => nt.type === type);
  return nodeType?.iconComponent || Box;
};

// 判断节点是否有输入/输出
const canHaveInput = (type?: string) => {
  return type !== "INPUT";
};

const canHaveOutput = (type?: string) => {
  return type !== "OUTPUT";
};

// 拖拽开始
const handleDragStart = (e: DragEvent, nodeType: NodeType) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData("nodeType", JSON.stringify(nodeType));
  }
};

// 放置节点
const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  if (!canvasRef.value || !e.dataTransfer) {
    return;
  }

  const nodeTypeData = e.dataTransfer.getData("nodeType");
  if (!nodeTypeData) {
    return;
  }

  const nodeType: NodeType = JSON.parse(nodeTypeData);
  const rect = canvasRef.value.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom.value - panX.value;
  const y = (e.clientY - rect.top) / zoom.value - panY.value;

  const newNode: SyncNode = {
    syncNodeKey: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    syncNodeType: nodeType.type,
    syncNodeSpiName: "",
    syncNodeName: nodeType.label,
    syncNodePosition: JSON.stringify({ x, y }),
    syncNodeConfig: "{}",
    syncNodeEnabled: 1,
    syncNodeOrder: nodes.value.length,
  };

  nodes.value.push(newNode);
  selectedNode.value = newNode;
  handleNodeClick(newNode);
};

// 节点点击
const handleNodeClick = (node: SyncNode) => {
  selectedNode.value = node;
  selectedConnection.value = null;
  Object.assign(nodeConfig, { ...node });
  configDrawerVisible.value = true;
};

// 节点配置保存
const handleConfigSave = () => {
  if (!selectedNode.value) {
    return;
  }

  Object.assign(selectedNode.value, nodeConfig);
  ElMessage.success("节点配置已保存");
  configDrawerVisible.value = false;
};

// 配置面板关闭
const handleConfigClose = () => {
  configDrawerVisible.value = false;
};

// 节点鼠标按下
const handleNodeMouseDown = (e: MouseEvent, node: SyncNode) => {
  if (e.button !== 0) {
    return;
  }
  draggingNode.value = node;
  const pos = parseNodePosition(node.syncNodePosition);
  dragOffset.value = {
    x: e.clientX / zoom.value - pos.x,
    y: e.clientY / zoom.value - pos.y,
  };
};

// 连线开始
const handleConnectionStart = (e: MouseEvent, node: SyncNode, handle: string) => {
  e.stopPropagation();
  connecting.value = true;
  connectionStart.value = { node, handle };
  const pos = parseNodePosition(node.syncNodePosition);
  connectionEnd.value = {
    x: pos.x + (handle === "input" ? 0 : 200),
    y: pos.y + 40,
  };
};

// 鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (draggingNode.value) {
    const pos = {
      x: e.clientX / zoom.value - dragOffset.value.x,
      y: e.clientY / zoom.value - dragOffset.value.y,
    };
    draggingNode.value.syncNodePosition = JSON.stringify(pos);
  }

  if (connecting.value && connectionEnd.value && canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    connectionEnd.value = {
      x: (e.clientX - rect.left) / zoom.value,
      y: (e.clientY - rect.top) / zoom.value,
    };
  }
};

// 鼠标释放
const handleMouseUp = (e: MouseEvent) => {
  if (connecting.value && connectionStart.value && connectionEnd.value) {
    // 检查是否连接到目标节点
    const targetNode = nodes.value.find((node) => {
      const pos = parseNodePosition(node.syncNodePosition);
      const distance = Math.sqrt(
        Math.pow(connectionEnd.value!.x - pos.x - 100, 2) +
          Math.pow(connectionEnd.value!.y - pos.y - 40, 2)
      );
      return distance < 50;
    });

    if (targetNode && targetNode.syncNodeKey !== connectionStart.value.node.syncNodeKey) {
      // 创建连线
      const newConnection: SyncConnection = {
        sourceNodeKey: connectionStart.value.node.syncNodeKey,
        sourceHandle: connectionStart.value.handle,
        targetNodeKey: targetNode.syncNodeKey,
        targetHandle: "input",
        connectionType: "DATA",
      };
      connections.value.push(newConnection);
    }
  }

  draggingNode.value = null;
  connecting.value = false;
  connectionStart.value = null;
  connectionEnd.value = null;
};

// 获取连线路径
const getConnectionPath = (connection: SyncConnection) => {
  const sourceNode = nodes.value.find((n) => n.syncNodeKey === connection.sourceNodeKey);
  const targetNode = nodes.value.find((n) => n.syncNodeKey === connection.targetNodeKey);

  if (!sourceNode || !targetNode) {
    return "";
  }

  const sourcePos = parseNodePosition(sourceNode.syncNodePosition);
  const targetPos = parseNodePosition(targetNode.syncNodePosition);

  const x1 = sourcePos.x + 200;
  const y1 = sourcePos.y + 40;
  const x2 = targetPos.x;
  const y2 = targetPos.y + 40;

  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
};

// 临时连线路径
const getTempConnectionPath = () => {
  if (!connectionStart.value || !connectionEnd.value) {
    return "";
  }

  const sourcePos = parseNodePosition(connectionStart.value.node.syncNodePosition);
  const x1 = sourcePos.x + (connectionStart.value.handle === "input" ? 0 : 200);
  const y1 = sourcePos.y + 40;
  const x2 = connectionEnd.value.x;
  const y2 = connectionEnd.value.y;

  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
};

// 连线点击
const handleConnectionClick = (connection: SyncConnection) => {
  selectedConnection.value = connection;
  selectedNode.value = null;
};

// 判断连线是否选中
const isConnectionSelected = (connection: SyncConnection) => {
  return (
    selectedConnection.value?.sourceNodeKey === connection.sourceNodeKey &&
    selectedConnection.value?.targetNodeKey === connection.targetNodeKey
  );
};

// 删除节点
const handleDeleteNode = async (node: SyncNode) => {
  try {
    await ElMessageBox.confirm("确定要删除该节点吗？", "提示", {
      type: "warning",
    });
    nodes.value = nodes.value.filter((n) => n.syncNodeKey !== node.syncNodeKey);
    connections.value = connections.value.filter(
      (c) => c.sourceNodeKey !== node.syncNodeKey && c.targetNodeKey !== node.syncNodeKey
    );
    if (selectedNode.value?.syncNodeKey === node.syncNodeKey) {
      selectedNode.value = null;
    }
    ElMessage.success("节点已删除");
  } catch {
    // 取消删除
  }
};

// 缩放
const handleZoomIn = () => {
  zoom.value = Math.min(zoom.value + 0.1, 2);
};

const handleZoomOut = () => {
  zoom.value = Math.max(zoom.value - 0.1, 0.5);
};

const handleResetZoom = () => {
  zoom.value = 1;
};

// 清空
const handleClear = async () => {
  try {
    await ElMessageBox.confirm("确定要清空所有节点和连线吗？", "提示", {
      type: "warning",
    });
    nodes.value = [];
    connections.value = [];
    selectedNode.value = null;
    selectedConnection.value = null;
    ElMessage.success("已清空");
  } catch {
    // 取消
  }
};

// 验证
const handleValidate = async () => {
  const design: SyncTaskDesign = {
    nodes: nodes.value,
    connections: connections.value,
  };

  try {
    const res = await fetchValidateTaskDesign(design);
    if (res.data?.success) {
      ElMessage.success("验证通过");
    } else {
      ElMessage.error(res.data?.msg || "验证失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("验证失败");
  }
};

// 保存
const handleSave = async () => {
  if (!props.taskId) {
    ElMessage.warning("请先创建任务");
    return;
  }

  saving.value = true;
  try {
    const design: SyncTaskDesign = {
      nodes: nodes.value,
      connections: connections.value,
      layout: JSON.stringify({ zoom: zoom.value, panX: panX.value, panY: panY.value }),
    };

    const res = await fetchSaveTaskDesign(props.taskId, design);
    if (res.data?.success) {
      ElMessage.success("保存成功");
      emit("save", design);
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

// 取消
const handleCancel = () => {
  emit("cancel");
};

// 画布点击
const handleCanvasClick = () => {
  selectedNode.value = null;
  selectedConnection.value = null;
};
</script>

<style lang="scss" scoped>
.sync-task-designer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);
}

.designer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-bg-color-page);

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.designer-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.node-panel {
  width: 200px;
  border-right: 1px solid var(--el-border-color);
  background: var(--el-bg-color-page);
  overflow-y: auto;

  .panel-title {
    padding: 12px 16px;
    font-weight: 600;
    border-bottom: 1px solid var(--el-border-color);
  }

  .node-types {
    padding: 12px;
  }

  .node-type-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    margin-bottom: 8px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    cursor: move;
    background: var(--el-bg-color);
    transition: all 0.2s;

    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    .el-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }
}

.designer-canvas {
  flex: 1;
  position: relative;
  overflow: auto;
  background: #f5f5f5;
  background-image: radial-gradient(circle, #ddd 1px, transparent 1px);
  background-size: 20px 20px;
}

.designer-node {
  position: absolute;
  width: 200px;
  min-height: 80px;
  background: var(--el-bg-color);
  border: 2px solid var(--el-border-color);
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  &.node-selected {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--el-border-color);
    background: var(--el-bg-color-page);

    .node-icon {
      font-size: 16px;
      color: var(--el-color-primary);
    }

    .node-title {
      flex: 1;
      font-weight: 600;
      font-size: 14px;
    }

    .node-delete {
      padding: 4px;
    }
  }

  .node-body {
    padding: 12px;

    .node-info {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 4px;
    }

    .node-desc {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }

  .node-handles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .node-handle {
    position: absolute;
    width: 16px;
    height: 16px;
    pointer-events: all;
    cursor: crosshair;

    &.node-handle-input {
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
    }

    &.node-handle-output {
      right: -8px;
      top: 50%;
      transform: translateY(-50%);
    }

    .handle-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--el-color-primary);
      border: 2px solid var(--el-bg-color);
      transition: all 0.2s;
    }

    &:hover .handle-dot {
      width: 16px;
      height: 16px;
      background: var(--el-color-primary-light-3);
    }
  }
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.connection-line {
  fill: none;
  stroke: var(--el-color-primary);
  stroke-width: 2;
  pointer-events: stroke;
  cursor: pointer;
  transition: all 0.2s;

  &:hover,
  &.connection-selected {
    stroke: var(--el-color-primary-dark-2);
    stroke-width: 3;
  }

  &.connection-temp {
    stroke-dasharray: 5, 5;
    stroke: var(--el-color-warning);
  }
}
</style>

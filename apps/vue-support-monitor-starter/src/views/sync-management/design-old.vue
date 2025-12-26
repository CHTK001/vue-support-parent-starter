<template>
  <div class="sync-task-design" @keydown="handleKeyDown" tabindex="0">
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
      <div class="toolbar-center">
        <el-button-group>
          <el-tooltip content="撤销 (Ctrl+Z)">
            <el-button :disabled="!canUndo" @click="handleUndo">
              <el-icon><RefreshLeft /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="重做 (Ctrl+Y)">
            <el-button :disabled="!canRedo" @click="handleRedo">
              <el-icon><RefreshRight /></el-icon>
            </el-button>
          </el-tooltip>
        </el-button-group>
        <el-divider direction="vertical" />
        <el-tooltip content="自动布局">
          <el-button @click="handleAutoLayout">
            <el-icon><Grid /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="适应画布">
          <el-button @click="handleFitView">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-tooltip>
        <el-divider direction="vertical" />
        <el-tooltip content="缩小">
          <el-button @click="handleZoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
        </el-tooltip>
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <el-tooltip content="放大">
          <el-button @click="handleZoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
        </el-tooltip>
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

    <div class="design-container">
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

      <!-- 中间画布 -->
      <div
        ref="canvasRef"
        class="canvas"
        @dragover.prevent
        @drop="handleDrop"
        @click="handleCanvasClick"
        @wheel="handleWheel"
      >
        <div class="canvas-content" :style="canvasTransformStyle">
          <!-- 节点 -->
          <div
            v-for="node in nodes"
            :key="node.syncNodeKey"
            class="flow-node"
            :class="[
              node.syncNodeType?.toLowerCase(),
              { selected: selectedNodeKey === node.syncNodeKey },
              { copied: copiedNodes.some(n => n.syncNodeKey === node.syncNodeKey) }
            ]"
            :style="getNodeStyle(node)"
            @click.stop="handleNodeClick(node)"
            @mousedown="handleNodeMouseDown($event, node)"
          >
            <div class="node-header">
              <span class="node-type">{{ getNodeTypeText(node.syncNodeType) }}</span>
              <el-icon class="node-delete" @click.stop="handleDeleteNode(node)"><Close /></el-icon>
            </div>
            <div class="node-body">
              <div class="node-name">{{ node.syncNodeName || node.syncNodeSpiName }}</div>
            </div>
            <div class="node-port input-port" @mousedown.stop="handlePortMouseDown($event, node, 'input')"></div>
            <div class="node-port output-port" @mousedown.stop="handlePortMouseDown($event, node, 'output')"></div>
          </div>

          <!-- 连线 -->
          <svg class="connections-svg" :width="canvasWidth" :height="canvasHeight">
            <path
              v-for="conn in connections"
              :key="`${conn.sourceNodeKey}-${conn.targetNodeKey}`"
              :d="getConnectionPath(conn)"
              class="connection-path"
              :class="{ selected: isConnectionSelected(conn) }"
              @click.stop="handleConnectionClick(conn)"
            />
            <!-- 临时连线 -->
            <path
              v-if="tempConnection"
              :d="tempConnection"
              class="connection-path temp"
            />
          </svg>
        </div>

        <!-- 小地图 -->
        <div class="minimap" @click="handleMinimapClick">
          <div class="minimap-content">
            <div
              v-for="node in nodes"
              :key="'mini-' + node.syncNodeKey"
              class="minimap-node"
              :class="node.syncNodeType?.toLowerCase()"
              :style="getMinimapNodeStyle(node)"
            />
            <div class="minimap-viewport" :style="minimapViewportStyle" />
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="property-panel">
        <el-empty v-if="!selectedNode" description="请选择节点" />
        <template v-else>
          <h3>节点配置</h3>
          <el-form label-position="top" size="small">
            <el-form-item label="节点名称">
              <el-input v-model="selectedNode.syncNodeName" placeholder="请输入节点名称" />
            </el-form-item>
            <el-form-item label="节点类型">
              <el-input :value="getNodeTypeText(selectedNode.syncNodeType)" disabled />
            </el-form-item>
            <el-form-item label="SPI类型">
              <el-input :value="selectedNode.syncNodeSpiName" disabled />
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
              <el-button v-if="selectedNode.syncNodeType === 'INPUT' || selectedNode.syncNodeType === 'OUTPUT'" @click="handleTestConnection">
                测试连接
              </el-button>
            </el-form-item>
          </el-form>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  DocumentChecked,
  CircleCheck,
  Download,
  Upload,
  Connection,
  Filter,
  Close,
  RefreshLeft,
  RefreshRight,
  Grid,
  FullScreen,
  ZoomIn,
  ZoomOut,
} from "@element-plus/icons-vue";
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

// 画布相关
const canvasRef = ref<HTMLElement | null>(null);
const canvasWidth = ref(2000);
const canvasHeight = ref(1500);

// 缩放和平移
const zoomLevel = ref(1);
const panOffset = reactive({ x: 0, y: 0 });

// 任务数据
const taskData = ref<SyncTask | null>(null);
const nodes = ref<SyncNode[]>([]);
const connections = ref<SyncConnection[]>([]);
const saving = ref(false);

// 撤销重做
interface HistoryState {
  nodes: SyncNode[];
  connections: SyncConnection[];
}
const historyStack = ref<HistoryState[]>([]);
const historyIndex = ref(-1);
const maxHistorySize = 50;
const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1);

// 复制粘贴
const copiedNodes = ref<SyncNode[]>([]);
const copiedConnections = ref<SyncConnection[]>([]);

// SPI 数据
const spiMap = reactive<Record<string, SpiInfo[]>>({
  INPUT: [],
  OUTPUT: [],
  DATA_CENTER: [],
  FILTER: [],
});
const activeCollapse = ref(["INPUT", "OUTPUT"]);

// 选中状态
const selectedNodeKey = ref<string | null>(null);
const selectedNode = computed(() =>
  nodes.value.find((n) => n.syncNodeKey === selectedNodeKey.value)
);
const selectedNodeParams = ref<SpiParameter[]>([]);
const nodeConfig = reactive<Record<string, any>>({});

// 连线相关
const tempConnection = ref<string | null>(null);
const connectingPort = ref<{ node: SyncNode; type: "input" | "output" } | null>(null);

// 拖拽相关
const draggingNode = ref<SyncNode | null>(null);
const dragOffset = reactive({ x: 0, y: 0 });

// 画布变换样式
const canvasTransformStyle = computed(() => ({
  transform: `scale(${zoomLevel.value}) translate(${panOffset.x}px, ${panOffset.y}px)`,
  transformOrigin: '0 0',
}));

// 小地图相关
const minimapScale = 0.1;
const minimapViewportStyle = computed(() => {
  if (!canvasRef.value) return {};
  const rect = canvasRef.value.getBoundingClientRect();
  return {
    width: `${(rect.width / zoomLevel.value) * minimapScale}px`,
    height: `${(rect.height / zoomLevel.value) * minimapScale}px`,
    left: `${-panOffset.x * minimapScale}px`,
    top: `${-panOffset.y * minimapScale}px`,
  };
});

// 保存历史状态
const saveHistory = () => {
  const state: HistoryState = {
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    connections: JSON.parse(JSON.stringify(connections.value)),
  };
  // 如果在历史中间，删除后面的历史
  if (historyIndex.value < historyStack.value.length - 1) {
    historyStack.value = historyStack.value.slice(0, historyIndex.value + 1);
  }
  historyStack.value.push(state);
  if (historyStack.value.length > maxHistorySize) {
    historyStack.value.shift();
  }
  historyIndex.value = historyStack.value.length - 1;
};

// 恢复历史状态
const restoreHistory = (index: number) => {
  if (index < 0 || index >= historyStack.value.length) return;
  const state = historyStack.value[index];
  nodes.value = JSON.parse(JSON.stringify(state.nodes));
  connections.value = JSON.parse(JSON.stringify(state.connections));
  historyIndex.value = index;
};

// 撤销
const handleUndo = () => {
  if (canUndo.value) {
    restoreHistory(historyIndex.value - 1);
  }
};

// 重做
const handleRedo = () => {
  if (canRedo.value) {
    restoreHistory(historyIndex.value + 1);
  }
};

// 复制节点
const handleCopy = () => {
  if (!selectedNodeKey.value) return;
  const node = nodes.value.find(n => n.syncNodeKey === selectedNodeKey.value);
  if (node) {
    copiedNodes.value = [JSON.parse(JSON.stringify(node))];
    // 复制相关连线
    copiedConnections.value = connections.value.filter(
      c => c.sourceNodeKey === node.syncNodeKey || c.targetNodeKey === node.syncNodeKey
    ).map(c => JSON.parse(JSON.stringify(c)));
    ElMessage.success('已复制节点');
  }
};

// 粘贴节点
const handlePaste = () => {
  if (copiedNodes.value.length === 0) return;
  
  const keyMap = new Map<string, string>();
  const pastedNodes: SyncNode[] = [];
  
  copiedNodes.value.forEach(node => {
    const newKey = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    keyMap.set(node.syncNodeKey!, newKey);
    
    let pos = { x: 100, y: 100 };
    if (node.syncNodePosition) {
      try {
        pos = JSON.parse(node.syncNodePosition);
      } catch (e) {}
    }
    
    const newNode: SyncNode = {
      ...node,
      syncNodeKey: newKey,
      syncNodeName: `${node.syncNodeName} (副本)`,
      syncNodePosition: JSON.stringify({ x: pos.x + 50, y: pos.y + 50 }),
    };
    pastedNodes.push(newNode);
  });
  
  nodes.value.push(...pastedNodes);
  
  // 复制连线（仅复制节点之间的连线）
  copiedConnections.value.forEach(conn => {
    const newSource = keyMap.get(conn.sourceNodeKey!);
    const newTarget = keyMap.get(conn.targetNodeKey!);
    if (newSource && newTarget) {
      connections.value.push({
        ...conn,
        sourceNodeKey: newSource,
        targetNodeKey: newTarget,
      });
    }
  });
  
  saveHistory();
  ElMessage.success('已粘贴节点');
};

// 自动布局
const handleAutoLayout = () => {
  if (nodes.value.length === 0) return;
  
  // 按类型分组
  const groups: Record<string, SyncNode[]> = {
    INPUT: [],
    FILTER: [],
    DATA_CENTER: [],
    OUTPUT: [],
  };
  
  nodes.value.forEach(node => {
    if (node.syncNodeType && groups[node.syncNodeType]) {
      groups[node.syncNodeType].push(node);
    }
  });
  
  // 布局参数
  const startX = 100;
  const startY = 100;
  const nodeWidth = 180;
  const nodeHeight = 100;
  const gapX = 100;
  const gapY = 50;
  
  // 按列布局
  const columns = ['INPUT', 'FILTER', 'DATA_CENTER', 'OUTPUT'];
  let currentX = startX;
  
  columns.forEach(col => {
    const nodesInCol = groups[col];
    let currentY = startY;
    
    nodesInCol.forEach(node => {
      node.syncNodePosition = JSON.stringify({ x: currentX, y: currentY });
      currentY += nodeHeight + gapY;
    });
    
    if (nodesInCol.length > 0) {
      currentX += nodeWidth + gapX;
    }
  });
  
  saveHistory();
  ElMessage.success('自动布局完成');
};

// 适应画布
const handleFitView = () => {
  if (nodes.value.length === 0 || !canvasRef.value) return;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  nodes.value.forEach(node => {
    let pos = { x: 100, y: 100 };
    if (node.syncNodePosition) {
      try {
        pos = JSON.parse(node.syncNodePosition);
      } catch (e) {}
    }
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + 180);
    maxY = Math.max(maxY, pos.y + 80);
  });
  
  const rect = canvasRef.value.getBoundingClientRect();
  const contentWidth = maxX - minX + 100;
  const contentHeight = maxY - minY + 100;
  
  const scaleX = rect.width / contentWidth;
  const scaleY = rect.height / contentHeight;
  const newZoom = Math.min(scaleX, scaleY, 1.5);
  
  zoomLevel.value = Math.max(0.25, Math.min(newZoom, 2));
  panOffset.x = -minX + 50;
  panOffset.y = -minY + 50;
};

// 缩放
const handleZoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.1, 2);
};

const handleZoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.25);
};

const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomLevel.value = Math.max(0.25, Math.min(zoomLevel.value + delta, 2));
  }
};

// 小地图点击导航
const handleMinimapClick = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = (e.clientX - rect.left) / minimapScale;
  const y = (e.clientY - rect.top) / minimapScale;
  
  if (canvasRef.value) {
    const canvasRect = canvasRef.value.getBoundingClientRect();
    panOffset.x = -(x - canvasRect.width / (2 * zoomLevel.value));
    panOffset.y = -(y - canvasRect.height / (2 * zoomLevel.value));
  }
};

// 获取小地图节点样式
const getMinimapNodeStyle = (node: SyncNode) => {
  let pos = { x: 100, y: 100 };
  if (node.syncNodePosition) {
    try {
      pos = JSON.parse(node.syncNodePosition);
    } catch (e) {}
  }
  return {
    left: `${pos.x * minimapScale}px`,
    top: `${pos.y * minimapScale}px`,
  };
};

// 键盘快捷键
const handleKeyDown = (e: KeyboardEvent) => {
  // Ctrl+Z 撤销
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    handleUndo();
    return;
  }
  
  // Ctrl+Y 重做
  if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    handleRedo();
    return;
  }
  
  // Ctrl+C 复制
  if (e.ctrlKey && e.key === 'c') {
    e.preventDefault();
    handleCopy();
    return;
  }
  
  // Ctrl+V 粘贴
  if (e.ctrlKey && e.key === 'v') {
    e.preventDefault();
    handlePaste();
    return;
  }
  
  // Delete 删除选中节点
  if (e.key === 'Delete' && selectedNodeKey.value) {
    const node = nodes.value.find(n => n.syncNodeKey === selectedNodeKey.value);
    if (node) {
      handleDeleteNode(node);
    }
    return;
  }
  
  // Ctrl+S 保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    handleSave();
    return;
  }
};

// 加载 SPI 列表
const loadSpiList = async () => {
  try {
    const res = await getAllSpiTypes();
    if (res.data?.success && res.data.data) {
      Object.assign(spiMap, res.data.data);
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
      nodes.value = design.nodes || [];
      connections.value = design.connections || [];
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
    const res = await saveSyncTaskDesign(taskId.value, {
      task: taskData.value || undefined,
      nodes: nodes.value,
      connections: connections.value,
      layout: JSON.stringify({ canvasWidth: canvasWidth.value, canvasHeight: canvasHeight.value }),
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
    const res = await validateSyncTaskDesign({
      task: taskData.value || undefined,
      nodes: nodes.value,
      connections: connections.value,
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

// 拖拽开始
const handleDragStart = (event: DragEvent, nodeType: string, spi: SpiInfo) => {
  event.dataTransfer?.setData(
    "application/json",
    JSON.stringify({ nodeType, spiName: spi.name, displayName: spi.displayName })
  );
};

// 拖拽放置
const handleDrop = (event: DragEvent) => {
  const data = event.dataTransfer?.getData("application/json");
  if (!data) return;

  const { nodeType, spiName, displayName } = JSON.parse(data);
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const newNode: SyncNode = {
    syncNodeKey: `node_${Date.now()}`,
    syncNodeType: nodeType,
    syncNodeSpiName: spiName,
    syncNodeName: displayName,
    syncNodePosition: JSON.stringify({ x: (x - panOffset.x) / zoomLevel.value, y: (y - panOffset.y) / zoomLevel.value }),
    syncNodeEnabled: 1,
  };

  nodes.value.push(newNode);
  saveHistory();
};

// 节点样式
const getNodeStyle = (node: SyncNode) => {
  let pos = { x: 100, y: 100 };
  if (node.syncNodePosition) {
    try {
      pos = JSON.parse(node.syncNodePosition);
    } catch (e) {}
  }
  return {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
  };
};

// 节点点击
const handleNodeClick = async (node: SyncNode) => {
  selectedNodeKey.value = node.syncNodeKey || null;

  // 加载参数配置
  if (node.syncNodeType && node.syncNodeSpiName) {
    try {
      const res = await getSpiParameters(node.syncNodeType, node.syncNodeSpiName);
      if (res.data?.success) {
        selectedNodeParams.value = res.data.data || [];
      }
    } catch (e) {
      selectedNodeParams.value = [];
    }
  }

  // 解析现有配置
  Object.keys(nodeConfig).forEach((key) => delete nodeConfig[key]);
  if (node.syncNodeConfig) {
    try {
      Object.assign(nodeConfig, JSON.parse(node.syncNodeConfig));
    } catch (e) {}
  }

  // 设置默认值
  selectedNodeParams.value.forEach((param) => {
    if (nodeConfig[param.name] === undefined && param.defaultValue !== undefined) {
      nodeConfig[param.name] = param.defaultValue;
    }
  });
};

// 删除节点
const handleDeleteNode = (node: SyncNode) => {
  const idx = nodes.value.findIndex((n) => n.syncNodeKey === node.syncNodeKey);
  if (idx !== -1) {
    nodes.value.splice(idx, 1);
  }
  // 删除相关连线
  connections.value = connections.value.filter(
    (c) => c.sourceNodeKey !== node.syncNodeKey && c.targetNodeKey !== node.syncNodeKey
  );
  if (selectedNodeKey.value === node.syncNodeKey) {
    selectedNodeKey.value = null;
  }
  saveHistory();
};

// 节点拖动
const handleNodeMouseDown = (event: MouseEvent, node: SyncNode) => {
  if ((event.target as HTMLElement).classList.contains("node-delete")) return;
  if ((event.target as HTMLElement).classList.contains("node-port")) return;

  draggingNode.value = node;
  let pos = { x: 100, y: 100 };
  if (node.syncNodePosition) {
    try {
      pos = JSON.parse(node.syncNodePosition);
    } catch (e) {}
  }
  dragOffset.x = event.clientX - pos.x;
  dragOffset.y = event.clientY - pos.y;

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingNode.value) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    draggingNode.value.syncNodePosition = JSON.stringify({
      x: Math.max(0, newX),
      y: Math.max(0, newY),
    });
  };

  const handleMouseUp = () => {
    draggingNode.value = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

// 端口连线
const handlePortMouseDown = (event: MouseEvent, node: SyncNode, portType: "input" | "output") => {
  event.stopPropagation();
  connectingPort.value = { node, type: portType };

  const handleMouseMove = (e: MouseEvent) => {
    if (!connectingPort.value || !canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();
    const startPos = getPortPosition(connectingPort.value.node, connectingPort.value.type);
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    tempConnection.value = `M ${startPos.x} ${startPos.y} C ${startPos.x + 50} ${startPos.y}, ${endX - 50} ${endY}, ${endX} ${endY}`;
  };

  const handleMouseUp = (e: MouseEvent) => {
    // 检查是否在另一个端口上释放
    const target = e.target as HTMLElement;
    if (target.classList.contains("node-port") && connectingPort.value) {
      const targetNodeEl = target.closest(".flow-node") as HTMLElement;
      if (targetNodeEl) {
        const targetNodeKey = nodes.value.find((n) => {
          const style = getNodeStyle(n);
          return targetNodeEl.style.left === style.left && targetNodeEl.style.top === style.top;
        })?.syncNodeKey;

        if (targetNodeKey && targetNodeKey !== connectingPort.value.node.syncNodeKey) {
          const isInputPort = target.classList.contains("input-port");
          const sourceKey = connectingPort.value.type === "output" ? connectingPort.value.node.syncNodeKey : targetNodeKey;
          const targetKey = connectingPort.value.type === "output" ? targetNodeKey : connectingPort.value.node.syncNodeKey;

          // 避免重复连线
          const exists = connections.value.some(
            (c) => c.sourceNodeKey === sourceKey && c.targetNodeKey === targetKey
          );
          if (!exists) {
            connections.value.push({
              sourceNodeKey: sourceKey,
              targetNodeKey: targetKey,
              connectionType: "DATA",
            });
            saveHistory();
          }
        }
      }
    }

    tempConnection.value = null;
    connectingPort.value = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

// 获取端口位置
const getPortPosition = (node: SyncNode, portType: "input" | "output") => {
  let pos = { x: 100, y: 100 };
  if (node.syncNodePosition) {
    try {
      pos = JSON.parse(node.syncNodePosition);
    } catch (e) {}
  }
  const nodeWidth = 180;
  const nodeHeight = 80;
  return portType === "input"
    ? { x: pos.x, y: pos.y + nodeHeight / 2 }
    : { x: pos.x + nodeWidth, y: pos.y + nodeHeight / 2 };
};

// 获取连线路径
const getConnectionPath = (conn: SyncConnection) => {
  const sourceNode = nodes.value.find((n) => n.syncNodeKey === conn.sourceNodeKey);
  const targetNode = nodes.value.find((n) => n.syncNodeKey === conn.targetNodeKey);
  if (!sourceNode || !targetNode) return "";

  const start = getPortPosition(sourceNode, "output");
  const end = getPortPosition(targetNode, "input");
  const ctrlOffset = Math.abs(end.x - start.x) / 2;

  return `M ${start.x} ${start.y} C ${start.x + ctrlOffset} ${start.y}, ${end.x - ctrlOffset} ${end.y}, ${end.x} ${end.y}`;
};

// 连线点击
const handleConnectionClick = (conn: SyncConnection) => {
  // 删除连线
  const idx = connections.value.findIndex(
    (c) => c.sourceNodeKey === conn.sourceNodeKey && c.targetNodeKey === conn.targetNodeKey
  );
  if (idx !== -1) {
    connections.value.splice(idx, 1);
    saveHistory();
  }
};

const isConnectionSelected = (conn: SyncConnection) => false;

// 画布点击
const handleCanvasClick = () => {
  selectedNodeKey.value = null;
};

// 保存节点配置
const handleSaveNodeConfig = () => {
  if (!selectedNode.value) return;
  selectedNode.value.syncNodeConfig = JSON.stringify(nodeConfig);
  ElMessage.success("配置已保存");
};

// 测试连接
const handleTestConnection = async () => {
  if (!selectedNode.value) return;
  try {
    const res = await testSpiConnection(
      selectedNode.value.syncNodeType!,
      selectedNode.value.syncNodeSpiName!,
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
    loadTaskDesign().then(() => {
      // 初始化历史记录
      saveHistory();
    });
  }
});

onUnmounted(() => {
  // 清理
  historyStack.value = [];
});
</script>

<style scoped lang="scss">
.sync-task-design {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .task-name {
        font-size: 16px;
        font-weight: 500;
      }
    }

    .toolbar-center {
      display: flex;
      align-items: center;
      gap: 8px;

      .zoom-level {
        min-width: 50px;
        text-align: center;
        font-size: 12px;
        color: #606266;
      }
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
    }
  }

  .design-container {
    flex: 1;
    display: flex;
    overflow: hidden;

    .node-panel {
      width: 220px;
      background: #fff;
      border-right: 1px solid #e4e7ed;
      overflow-y: auto;

      .node-list {
        padding: 8px;
      }

      .node-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        margin-bottom: 8px;
        border-radius: 4px;
        cursor: grab;
        transition: all 0.2s;

        &.input {
          background: #e6f7e6;
          border: 1px solid #52c41a;
        }
        &.output {
          background: #e6f3ff;
          border: 1px solid #1890ff;
        }
        &.datacenter {
          background: #f5e6ff;
          border: 1px solid #722ed1;
        }
        &.filter {
          background: #fff7e6;
          border: 1px solid #faad14;
        }

        &:hover {
          transform: translateX(4px);
        }
      }
    }

    .canvas {
      flex: 1;
      position: relative;
      overflow: hidden;
      background:
        linear-gradient(90deg, #f0f0f0 1px, transparent 1px),
        linear-gradient(#f0f0f0 1px, transparent 1px);
      background-size: 20px 20px;

      .canvas-content {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .connections-svg {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;

        .connection-path {
          fill: none;
          stroke: #909399;
          stroke-width: 2;
          pointer-events: stroke;
          cursor: pointer;

          &.temp {
            stroke: #409eff;
            stroke-dasharray: 5, 5;
          }

          &.selected {
            stroke: #409eff;
          }
        }
      }

      .flow-node {
        position: absolute;
        width: 180px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        cursor: move;
        user-select: none;

        &.selected {
          box-shadow: 0 0 0 2px #409eff;
        }

        &.copied {
          box-shadow: 0 0 0 2px #67c23a;
        }

        &.input {
          border-top: 3px solid #52c41a;
        }
        &.output {
          border-top: 3px solid #1890ff;
        }
        &.data_center {
          border-top: 3px solid #722ed1;
        }
        &.filter {
          border-top: 3px solid #faad14;
        }

        .node-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid #eee;

          .node-type {
            font-size: 12px;
            color: #909399;
          }

          .node-delete {
            cursor: pointer;
            color: #909399;
            &:hover {
              color: #f56c6c;
            }
          }
        }

        .node-body {
          padding: 12px;

          .node-name {
            font-size: 14px;
            font-weight: 500;
          }
        }

        .node-port {
          position: absolute;
          width: 12px;
          height: 12px;
          background: #409eff;
          border: 2px solid #fff;
          border-radius: 50%;
          cursor: crosshair;

          &.input-port {
            left: -6px;
            top: 50%;
            transform: translateY(-50%);
          }

          &.output-port {
            right: -6px;
            top: 50%;
            transform: translateY(-50%);
          }
        }
      }

      // 小地图
      .minimap {
        position: absolute;
        right: 16px;
        bottom: 16px;
        width: 200px;
        height: 150px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        overflow: hidden;
        cursor: pointer;

        .minimap-content {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .minimap-node {
          position: absolute;
          width: 18px;
          height: 8px;
          border-radius: 2px;

          &.input {
            background: #52c41a;
          }
          &.output {
            background: #1890ff;
          }
          &.data_center {
            background: #722ed1;
          }
          &.filter {
            background: #faad14;
          }
        }

        .minimap-viewport {
          position: absolute;
          border: 2px solid #409eff;
          background: rgba(64, 158, 255, 0.1);
          pointer-events: none;
        }
      }
    }

    .property-panel {
      width: 300px;
      background: #fff;
      border-left: 1px solid #e4e7ed;
      padding: 16px;
      overflow-y: auto;

      h3 {
        margin: 0 0 16px;
        font-size: 16px;
      }
    }
  }
}
</style>

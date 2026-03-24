<template>
  <div class="spider-design-container system-container modern-bg">
    <!-- 工具栏 -->
    <div class="design-toolbar">
      <el-button-group>
        <el-button @click="handleSave" type="primary" :loading="saving">
          <el-icon><Check /></el-icon>
          保存设计
        </el-button>
        <el-button @click="handleValidate">
          <el-icon><CircleCheck /></el-icon>
          验证设计
        </el-button>
        <el-button @click="handleRun" type="success">
          <el-icon><VideoPlay /></el-icon>
          运行任务
        </el-button>
      </el-button-group>
      <el-button-group style="margin-left: 10px;">
        <el-button @click="handleClear">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
        <el-button @click="handleBack">
          <el-icon><Back /></el-icon>
          返回
        </el-button>
      </el-button-group>
      <div class="task-info" v-if="taskInfo">
        <span>任务: {{ taskInfo.spiderTaskName }}</span>
      </div>
    </div>

    <div class="design-content">
      <!-- 左侧组件面板 -->
      <div class="component-panel">
        <el-collapse v-model="activeCollapse">
          <el-collapse-item v-for="category in nodeCategories" :key="category.type" :name="category.type">
            <template #title>
              <div class="category-title">
                <el-icon :style="{ color: category.color }">
                  <component :is="category.icon" />
                </el-icon>
                <span>{{ category.label }}</span>
              </div>
            </template>
            <div class="component-list">
              <div
                v-for="spi in getSpiListByType(category.type)"
                :key="spi.name"
                class="component-item"
                draggable="true"
                @dragstart="handleDragStart($event, category.type, spi)"
              >
                <div class="component-icon" :style="{ backgroundColor: category.color }">
                  <el-icon><component :is="spi.icon || category.icon" /></el-icon>
                </div>
                <div class="component-info">
                  <div class="component-name">{{ spi.displayName }}</div>
                  <div class="component-desc">{{ spi.description }}</div>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 画布区域 -->
      <div 
        class="design-canvas" 
        ref="canvasRef"
        @drop="handleDrop"
        @dragover.prevent
        @click="handleCanvasClick"
      >
        <!-- 节点 -->
        <div
          v-for="node in nodes"
          :key="node.nodeId"
          class="flow-node"
          :class="{ selected: selectedNode?.nodeId === node.nodeId }"
          :style="getNodeStyle(node)"
          @mousedown="handleNodeMouseDown($event, node)"
          @click.stop="handleNodeClick(node)"
        >
          <div class="node-header" :style="{ backgroundColor: getNodeColor(node.nodeType) }">
            <el-icon><component :is="getNodeIcon(node.nodeType)" /></el-icon>
            <span>{{ node.nodeName }}</span>
          </div>
          <div class="node-body">
            <div class="node-spi">{{ node.spiName }}</div>
          </div>
          <div class="node-ports">
            <div 
              class="port input-port" 
              :class="{ 'port-active': connectingFrom && connectingFrom.nodeId !== node.nodeId }"
              @click.stop="handlePortClick(node, 'input')"
            ></div>
            <div 
              class="port output-port" 
              :class="{ 'port-active': !connectingFrom }"
              @click.stop="handlePortClick(node, 'output')"
            ></div>
          </div>
          <el-button
            class="node-delete"
            type="danger"
            circle
            size="small"
            @click.stop="handleDeleteNode(node)"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <!-- 连接线 -->
        <svg class="connections-layer">
          <path
            v-for="conn in connections"
            :key="conn.connectionId"
            :d="getConnectionPath(conn)"
            class="connection-line"
            @click="handleConnectionClick(conn)"
          />
          <!-- 正在绘制的连接线 -->
          <path
            v-if="connectingFrom"
            :d="getTempConnectionPath()"
            class="connection-line temp-line"
          />
        </svg>

        <!-- 空状态提示 -->
        <div v-if="nodes.length === 0" class="empty-tip">
          <el-icon :size="48"><Grid /></el-icon>
          <p>从左侧拖拽组件到画布开始设计</p>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="property-panel" v-if="selectedNode">
        <div class="panel-header">
          <span>节点属性</span>
          <el-button text @click="selectedNode = null">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="panel-content">
          <el-form label-position="top" size="small">
            <el-form-item label="节点名称">
              <el-input v-model="selectedNode.nodeName" />
            </el-form-item>
            <el-form-item label="节点类型">
              <el-tag>{{ getNodeTypeLabel(selectedNode.nodeType) }}</el-tag>
            </el-form-item>
            <el-form-item label="组件">
              <el-tag type="info">{{ selectedNode.spiName }}</el-tag>
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="selectedNode.nodeDescription" type="textarea" :rows="2" />
            </el-form-item>

            <!-- 参数配置 -->
            <el-divider content-position="left">参数配置</el-divider>
            <template v-if="currentNodeParameters.length > 0">
              <el-form-item
                v-for="param in currentNodeParameters"
                :key="param.name"
                :label="param.label"
                :required="param.required"
              >
                <template v-if="param.type === 'boolean'">
                  <el-switch v-model="nodeConfig[param.name]" />
                </template>
                <template v-else-if="param.type === 'number'">
                  <el-input-number v-model="nodeConfig[param.name]" :placeholder="param.description" style="width: 100%;" />
                </template>
                <template v-else-if="param.type === 'select'">
                  <el-select v-model="nodeConfig[param.name]" :placeholder="param.description" style="width: 100%;">
                    <el-option v-for="opt in param.options" :key="opt.value" :label="opt.label" :value="opt.value" />
                  </el-select>
                </template>
                <template v-else-if="param.type === 'textarea' || param.type === 'urls' || param.type === 'json'">
                  <el-input v-model="nodeConfig[param.name]" type="textarea" :rows="3" :placeholder="param.description" />
                </template>
                <template v-else-if="param.type === 'password'">
                  <el-input v-model="nodeConfig[param.name]" type="password" :placeholder="param.description" show-password />
                </template>
                <template v-else>
                  <el-input v-model="nodeConfig[param.name]" :placeholder="param.description" />
                </template>
                <div class="param-desc" v-if="param.description">{{ param.description }}</div>
              </el-form-item>
            </template>
            <el-empty v-else description="该组件无需配置参数" :image-size="60" />

            <el-form-item>
              <el-button type="primary" @click="handleSaveNodeConfig" :loading="savingNode">
                保存配置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 验证结果对话框 -->
    <sc-dialog v-model="validateDialogVisible" title="设计验证结果" width="500px" append-to-body>
      <template v-if="validateErrors.length === 0">
        <el-result icon="success" title="验证通过" sub-title="设计配置正确，可以运行任务" />
      </template>
      <template v-else>
        <el-alert
          v-for="(error, index) in validateErrors"
          :key="index"
          :title="error"
          type="error"
          show-icon
          :closable="false"
          style="margin-bottom: 10px;"
        />
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Check, CircleCheck, VideoPlay, Delete, Back, Close, Grid,
  Link, Download, Cpu, Connection, Filter, DataBoard, Timer, Setting, ChromeFilled, User
} from '@element-plus/icons-vue';
import {
  getSpiderTaskById,
  runSpiderTask,
  getAllSpiTypes,
  getTaskDesign,
  saveTaskDesign,
  validateTaskDesign,
  clearTaskDesign,
  addTaskNode,
  updateTaskNode,
  deleteTaskNode,
  updateNodePositions,
  addTaskConnection,
  deleteTaskConnection,
  getSpiParameters,
  type SpiderTask,
  type SpiderNode,
  type SpiderConnection,
  type SpiderSpiTypeList,
  type SpiderSpiInfo,
  type SpiderSpiParameter,
  NODE_TYPES,
} from '@/api/spider';

const route = useRoute();
const router = useRouter();

// 任务ID
const taskId = computed(() => Number(route.params.taskId));

// 数据状态
const taskInfo = ref<SpiderTask | null>(null);
const spiTypes = ref<SpiderSpiTypeList | null>(null);
const nodes = ref<SpiderNode[]>([]);
const connections = ref<SpiderConnection[]>([]);
const selectedNode = ref<SpiderNode | null>(null);
const nodeConfig = ref<Record<string, any>>({});
const currentNodeParameters = ref<SpiderSpiParameter[]>([]);

// UI状态
const saving = ref(false);
const savingNode = ref(false);
const activeCollapse = ref(['URL_SOURCE', 'DOWNLOADER', 'PROCESSOR', 'PIPELINE']);
const validateDialogVisible = ref(false);
const validateErrors = ref<string[]>([]);

// 画布引用
const canvasRef = ref<HTMLElement | null>(null);

// 拖拽状态
const dragData = ref<{ type: string; spi: SpiderSpiInfo } | null>(null);
const draggingNode = ref<SpiderNode | null>(null);
const dragOffset = ref({ x: 0, y: 0 });

// 连线状态
const connectingFrom = ref<{ nodeId: number; port: string } | null>(null);
const mousePosition = ref({ x: 0, y: 0 });

// 节点分类
const nodeCategories = [
  { type: 'URL_SOURCE', label: 'URL源', icon: 'Link', color: '#4CAF50' },
  { type: 'DOWNLOADER', label: '下载器', icon: 'Download', color: '#2196F3' },
  { type: 'PROCESSOR', label: '处理器', icon: 'Cpu', color: '#FF9800' },
  { type: 'MIDDLEWARE', label: '中间件', icon: 'Connection', color: '#9C27B0' },
  { type: 'DATA_FILTER', label: '数据过滤器', icon: 'Filter', color: '#00BCD4' },
  { type: 'PIPELINE', label: '数据输出', icon: 'DataBoard', color: '#E91E63' },
  { type: 'SCHEDULER', label: '调度器', icon: 'Timer', color: '#607D8B' },
  { type: 'SITE_CONFIG', label: '站点配置', icon: 'Setting', color: '#795548' },
  { type: 'PROXY_POOL', label: '代理池', icon: 'ChromeFilled', color: '#009688' },
  { type: 'UA_POOL', label: 'UA池', icon: 'User', color: '#673AB7' },
];

// 获取SPI列表
function getSpiListByType(type: string): SpiderSpiInfo[] {
  if (!spiTypes.value) return [];
  const typeMap: Record<string, keyof SpiderSpiTypeList> = {
    'URL_SOURCE': 'urlSource',
    'DOWNLOADER': 'downloader',
    'PROCESSOR': 'processor',
    'MIDDLEWARE': 'middleware',
    'DATA_FILTER': 'dataFilter',
    'PIPELINE': 'pipeline',
    'SCHEDULER': 'scheduler',
    'SITE_CONFIG': 'siteConfig',
    'PROXY_POOL': 'proxyPool',
    'UA_POOL': 'uaPool',
  };
  return spiTypes.value[typeMap[type]] || [];
}

// 获取节点样式
function getNodeStyle(node: SpiderNode) {
  return {
    left: `${node.positionX || 100}px`,
    top: `${node.positionY || 100}px`,
  };
}

// 获取节点颜色
function getNodeColor(type: string): string {
  return nodeCategories.find(c => c.type === type)?.color || '#666';
}

// 获取节点图标
function getNodeIcon(type: string): string {
  return nodeCategories.find(c => c.type === type)?.icon || 'Cpu';
}

// 获取节点类型标签
function getNodeTypeLabel(type: string): string {
  return nodeCategories.find(c => c.type === type)?.label || type;
}

// 获取连接路径
function getConnectionPath(conn: SpiderConnection): string {
  const sourceNode = nodes.value.find(n => n.nodeId === conn.sourceNodeId);
  const targetNode = nodes.value.find(n => n.nodeId === conn.targetNodeId);
  if (!sourceNode || !targetNode) return '';

  const x1 = (sourceNode.positionX || 0) + 200; // 节点宽度
  const y1 = (sourceNode.positionY || 0) + 40;  // 节点高度一半
  const x2 = targetNode.positionX || 0;
  const y2 = (targetNode.positionY || 0) + 40;

  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

// 拖拽开始
function handleDragStart(event: DragEvent, type: string, spi: SpiderSpiInfo) {
  dragData.value = { type, spi };
  event.dataTransfer?.setData('text/plain', JSON.stringify({ type, spi }));
}

// 放置节点
async function handleDrop(event: DragEvent) {
  event.preventDefault();
  if (!dragData.value || !canvasRef.value) return;

  const rect = canvasRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const newNode: SpiderNode = {
    nodeName: dragData.value.spi.displayName,
    nodeType: dragData.value.type,
    spiName: dragData.value.spi.name,
    nodeDescription: dragData.value.spi.description,
    positionX: x,
    positionY: y,
    nodeEnabled: true,
    nodeConfig: '{}',
  };

  try {
    const res = await addTaskNode(taskId.value, newNode);
    if (res.code === "00000") {
      newNode.nodeId = res.data;
      nodes.value.push(newNode);
      ElMessage.success('节点添加成功');
    }
  } catch (error) {
    ElMessage.error('添加节点失败');
  }

  dragData.value = null;
}

// 节点鼠标按下
function handleNodeMouseDown(event: MouseEvent, node: SpiderNode) {
  if (event.button !== 0) return;
  draggingNode.value = node;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingNode.value || !canvasRef.value) return;
    const rect = canvasRef.value.getBoundingClientRect();
    draggingNode.value.positionX = e.clientX - rect.left - dragOffset.value.x;
    draggingNode.value.positionY = e.clientY - rect.top - dragOffset.value.y;
  };

  const handleMouseUp = async () => {
    if (draggingNode.value) {
      // 保存位置
      await updateNodePositions(taskId.value, [{
        nodeId: draggingNode.value.nodeId!,
        x: draggingNode.value.positionX!,
        y: draggingNode.value.positionY!,
      }]);
    }
    draggingNode.value = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

// 节点点击
async function handleNodeClick(node: SpiderNode) {
  selectedNode.value = node;
  
  // 解析节点配置
  try {
    nodeConfig.value = node.nodeConfig ? JSON.parse(node.nodeConfig) : {};
  } catch {
    nodeConfig.value = {};
  }

  // 加载参数定义
  try {
    const res = await getSpiParameters(node.nodeType, node.spiName);
    if (res.code === "00000") {
      currentNodeParameters.value = res.data || [];
    }
  } catch {
    currentNodeParameters.value = [];
  }
}

// 画布点击
function handleCanvasClick() {
  selectedNode.value = null;
  // 取消连线
connectingFrom.value = null;
}

// 端口点击 - 创建连接
async function handlePortClick(node: SpiderNode, port: string) {
  if (port === 'output') {
    // 从输出端口开始连线
    connectingFrom.value = { nodeId: node.nodeId!, port };
    // 监听鼠标移动
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.value) return;
      const rect = canvasRef.value.getBoundingClientRect();
      mousePosition.value = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    document.addEventListener('mousemove', handleMouseMove);
    // 一次性点击取消
    const cleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
    // 在点击输入端口或取消时清理
    setTimeout(() => {
      document.addEventListener('click', () => {
        if (connectingFrom.value) {
          connectingFrom.value = null;
          cleanup();
        }
      }, { once: true });
    }, 100);
  } else if (port === 'input' && connectingFrom.value) {
    // 连接到输入端口
    if (connectingFrom.value.nodeId === node.nodeId) {
      ElMessage.warning('不能连接到自己');
      return;
    }
    
    // 检查是否已存在连接
    const exists = connections.value.some(
      c => c.sourceNodeId === connectingFrom.value!.nodeId && c.targetNodeId === node.nodeId
    );
    if (exists) {
      ElMessage.warning('连接已存在');
      connectingFrom.value = null;
      return;
    }
    
    // 创建连接
    try {
      const newConn: SpiderConnection = {
        sourceNodeId: connectingFrom.value.nodeId,
        targetNodeId: node.nodeId!,
        sourcePort: 'output',
        targetPort: 'input',
      };
      const res = await addTaskConnection(taskId.value, newConn);
      if (res.code === "00000") {
        newConn.connectionId = res.data;
        connections.value.push(newConn);
        ElMessage.success('连接创建成功');
      }
    } catch {
      ElMessage.error('创建连接失败');
    }
    connectingFrom.value = null;
  }
}

// 获取临时连接线路径
function getTempConnectionPath(): string {
  if (!connectingFrom.value) return '';
  const sourceNode = nodes.value.find(n => n.nodeId === connectingFrom.value!.nodeId);
  if (!sourceNode) return '';
  
  const x1 = (sourceNode.positionX || 0) + 200;
  const y1 = (sourceNode.positionY || 0) + 40;
  const x2 = mousePosition.value.x;
  const y2 = mousePosition.value.y;
  
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

// 删除节点
async function handleDeleteNode(node: SpiderNode) {
  try {
    await ElMessageBox.confirm('确定删除该节点？相关连接也将被删除', '确认');
    const res = await deleteTaskNode(node.nodeId!);
    if (res.code === "00000") {
      nodes.value = nodes.value.filter(n => n.nodeId !== node.nodeId);
      connections.value = connections.value.filter(
        c => c.sourceNodeId !== node.nodeId && c.targetNodeId !== node.nodeId
      );
      if (selectedNode.value?.nodeId === node.nodeId) {
        selectedNode.value = null;
      }
      ElMessage.success('节点已删除');
    }
  } catch {
    // 取消
  }
}

// 连接点击
async function handleConnectionClick(conn: SpiderConnection) {
  try {
    await ElMessageBox.confirm('确定删除该连接？', '确认');
    const res = await deleteTaskConnection(conn.connectionId!);
    if (res.code === "00000") {
      connections.value = connections.value.filter(c => c.connectionId !== conn.connectionId);
      ElMessage.success('连接已删除');
    }
  } catch {
    // 取消
  }
}

// 保存节点配置
async function handleSaveNodeConfig() {
  if (!selectedNode.value) return;
  savingNode.value = true;
  try {
    selectedNode.value.nodeConfig = JSON.stringify(nodeConfig.value);
    const res = await updateTaskNode(selectedNode.value.nodeId!, selectedNode.value);
    if (res.code === "00000") {
      ElMessage.success('配置已保存');
    }
  } catch {
    ElMessage.error('保存失败');
  } finally {
    savingNode.value = false;
  }
}

// 保存设计
async function handleSave() {
  saving.value = true;
  try {
    const res = await saveTaskDesign(taskId.value, {
      taskId: taskId.value,
      nodes: nodes.value,
      connections: connections.value,
    });
    if (res.code === "00000") {
      ElMessage.success('设计已保存');
    }
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
}

// 验证设计
async function handleValidate() {
  try {
    const res = await validateTaskDesign(taskId.value);
    if (res.code === "00000") {
      validateErrors.value = res.data || [];
      validateDialogVisible.value = true;
    }
  } catch {
    ElMessage.error('验证失败');
  }
}

// 运行任务
async function handleRun() {
  // 先验证
  const validateRes = await validateTaskDesign(taskId.value);
  if (validateRes.code === "00000" && validateRes.data && validateRes.data.length > 0) {
    validateErrors.value = validateRes.data;
    validateDialogVisible.value = true;
    return;
  }

  try {
    await ElMessageBox.confirm('确定运行该爬虫任务？', '确认');
    const res = await runSpiderTask(taskId.value);
    if (res.code === "00000") {
      ElMessage.success('任务已启动');
    }
  } catch {
    // 取消
  }
}

// 清空设计
async function handleClear() {
  try {
    await ElMessageBox.confirm('确定清空所有设计？此操作不可恢复', '警告', { type: 'warning' });
    const res = await clearTaskDesign(taskId.value);
    if (res.code === "00000") {
      nodes.value = [];
      connections.value = [];
      selectedNode.value = null;
      ElMessage.success('设计已清空');
    }
  } catch {
    // 取消
  }
}

// 返回
function handleBack() {
  router.push('/spider');
}

// 加载数据
async function loadData() {
  try {
    // 加载任务信息
    const taskRes = await getSpiderTaskById(taskId.value);
    if (taskRes.code === "00000") {
      taskInfo.value = taskRes.data;
    }

    // 加载SPI类型
    const spiRes = await getAllSpiTypes();
    if (spiRes.code === "00000") {
      spiTypes.value = spiRes.data;
    }

    // 加载设计
    const designRes = await getTaskDesign(taskId.value);
    if (designRes.code === "00000" && designRes.data) {
      nodes.value = designRes.data.nodes || [];
      connections.value = designRes.data.connections || [];
    }
  } catch (error) {
    ElMessage.error('加载数据失败');
  }
}

onMounted(() => {
  loadData();
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


.spider-design-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.design-toolbar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;

  .task-info {
    margin-left: auto;
    color: #606266;
    font-size: 14px;
  }
}

.design-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.component-panel {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;

  .category-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .component-list {
    padding: 8px;
  }

  .component-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    margin-bottom: 8px;
    background: #f5f7fa;
    border-radius: 6px;
    cursor: grab;
    transition: all 0.2s;

    &:hover {
      background: #ecf5ff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .component-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      color: #fff;
    }

    .component-info {
      flex: 1;
      min-width: 0;

      .component-name {
        font-size: 13px;
        font-weight: 500;
        color: #303133;
      }

      .component-desc {
        font-size: 11px;
        color: #909399;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.design-canvas {
  flex: 1;
  position: relative;
  overflow: auto;
  background: 
    linear-gradient(90deg, #e4e7ed 1px, transparent 1px),
    linear-gradient(#e4e7ed 1px, transparent 1px);
  background-size: 20px 20px;

  .empty-tip {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #909399;

    p {
      margin-top: 16px;
    }
  }
}

.flow-node {
  position: absolute;
  width: 200px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: move;
  user-select: none;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  &.selected {
    box-shadow: 0 0 0 2px #409eff, 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    border-radius: 8px 8px 0 0;
  }

  .node-body {
    padding: 12px;

    .node-spi {
      font-size: 12px;
      color: #909399;
    }
  }

  .node-ports {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    pointer-events: none;

    .port {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #409eff;
      border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      pointer-events: auto;
      cursor: crosshair;

      &.input-port {
        left: -6px;
      }

      &.output-port {
        right: -6px;
      }

      &.port-active {
        background: #67c23a;
        transform: scale(1.3);
        animation: pulse 1s infinite;
      }
    }
  }

  .node-delete {
    position: absolute;
    top: -8px;
    right: -8px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .node-delete {
    opacity: 1;
  }
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  .connection-line {
    fill: none;
    stroke: #409eff;
    stroke-width: 2;
    pointer-events: auto;
    cursor: pointer;

    &:hover {
      stroke: #f56c6c;
      stroke-width: 3;
    }

    &.temp-line {
      stroke: #67c23a;
      stroke-dasharray: 5, 5;
      pointer-events: none;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(103, 194, 58, 0);
  }
}

.property-panel {
  width: 320px;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #e4e7ed;
    font-weight: 500;
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;

    .param-desc {
      font-size: 11px;
      color: #909399;
      margin-top: 4px;
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

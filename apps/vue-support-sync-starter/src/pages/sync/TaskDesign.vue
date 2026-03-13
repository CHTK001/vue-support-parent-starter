<template>
  <div class="design-container">
    <el-card>
      <template #header>
        <div class="header-actions">
          <h3>任务设计器</h3>
          <div>
            <el-button @click="handleSave">保存</el-button>
            <el-button @click="handleBack">返回</el-button>
          </div>
        </div>
      </template>

      <div class="design-content">
        <!-- 左侧节点面板 -->
        <div class="node-panel">
          <h4>组件面板</h4>
          <div class="node-list">
            <div
              v-for="node in nodeTypes"
              :key="node.type"
              class="node-item"
              draggable="true"
              @dragstart="handleDragStart($event, node)"
            >
              <el-icon><component :is="node.icon" /></el-icon>
              <span>{{ node.label }}</span>
            </div>
          </div>
        </div>

        <!-- 中间画布 -->
        <div class="canvas-container">
          <div ref="canvasRef" class="canvas"></div>
        </div>

        <!-- 右侧属性面板 -->
        <div class="property-panel">
          <h4>属性配置</h4>
          <el-form v-if="selectedNode" label-width="100px">
            <el-form-item label="节点名称">
              <el-input v-model="selectedNode.text" />
            </el-form-item>
            <el-form-item label="节点类型">
              <el-input v-model="selectedNode.type" disabled />
            </el-form-item>
            <el-form-item v-if="selectedNode.type === 'datasource'" label="数据源类型">
              <el-select v-model="selectedNode.properties.dsType">
                <el-option label="MySQL" value="mysql" />
                <el-option label="PostgreSQL" value="postgresql" />
                <el-option label="MongoDB" value="mongodb" />
                <el-option label="Kafka" value="kafka" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="selectedNode.type === 'transform'" label="转换类型">
              <el-select v-model="selectedNode.properties.transformType">
                <el-option label="字段映射" value="mapping" />
                <el-option label="数据过滤" value="filter" />
                <el-option label="数据脱敏" value="masking" />
                <el-option label="脚本转换" value="script" />
              </el-select>
            </el-form-item>
          </el-form>
          <el-empty v-else description="请选择一个节点" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Database, Refresh, Upload } from '@element-plus/icons-vue';

/**
 * TODO: 集成LogicFlow流程图库
 * 
 * 安装步骤：
 * 1. 安装依赖：pnpm add @logicflow/core @logicflow/extension
 * 2. 导入样式：import '@logicflow/core/dist/style/index.css'
 * 3. 导入LogicFlow：import LogicFlow from '@logicflow/core'
 * 4. 初始化实例：
 *    lf = new LogicFlow({
 *      container: canvasRef.value!,
 *      grid: { size: 10, visible: true },
 *      background: { color: '#f7f9ff' },
 *      keyboard: { enabled: true },
 *    })
 * 5. 注册自定义节点类型
 * 6. 监听节点选中事件：lf.on('node:click', handleNodeClick)
 * 7. 实现保存/加载功能：lf.getGraphData() / lf.render(data)
 */

const router = useRouter();
const canvasRef = ref<HTMLElement>();
const selectedNode = ref<any>(null);
const nodes = ref<any[]>([]);
const edges = ref<any[]>([]);

const nodeTypes = [
  { type: 'datasource', label: '数据源', icon: Database },
  { type: 'transform', label: '数据转换', icon: Refresh },
  { type: 'target', label: '目标源', icon: Upload },
];

let graph: any = null;
let nodeIdCounter = 1;

const initCanvas = () => {
  if (!canvasRef.value) return;
  
  // 简化实现：使用原生Canvas绘制基础流程图
  // 生产环境应该使用LogicFlow或X6
  const canvas = document.createElement('canvas');
  canvas.width = canvasRef.value.clientWidth;
  canvas.height = canvasRef.value.clientHeight;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvasRef.value.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 绘制网格
    drawGrid(ctx, canvas.width, canvas.height);
    
    // 添加提示文字
    ctx.fillStyle = '#909399';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('拖拽左侧节点到此处创建流程图', canvas.width / 2, canvas.height / 2);
    ctx.fillText('(生产环境需要集成LogicFlow或X6)', canvas.width / 2, canvas.height / 2 + 25);
  }
  
  // 监听拖放事件
  canvas.addEventListener('dragover', handleDragOver);
  canvas.addEventListener('drop', handleDrop);
  canvas.addEventListener('click', handleCanvasClick);
  
  graph = { canvas, ctx };
};

const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const gridSize = 20;
  ctx.strokeStyle = '#e4e7ed';
  ctx.lineWidth = 0.5;
  
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};

const redrawCanvas = () => {
  if (!graph || !graph.ctx || !graph.canvas) return;
  
  const { ctx, canvas } = graph;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);
  
  // 绘制所有节点
  nodes.value.forEach(node => {
    drawNode(ctx, node);
  });
  
  // 绘制所有连线
  edges.value.forEach(edge => {
    drawEdge(ctx, edge);
  });
};

const drawNode = (ctx: CanvasRenderingContext2D, node: any) => {
  const { x, y, width, height, text, type } = node;
  
  // 绘制节点矩形
  ctx.fillStyle = node.selected ? '#ecf5ff' : '#ffffff';
  ctx.strokeStyle = node.selected ? '#409eff' : '#dcdfe6';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  
  // 绘制节点文字
  ctx.fillStyle = '#303133';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y + height / 2);
};

const drawEdge = (ctx: CanvasRenderingContext2D, edge: any) => {
  const { fromX, fromY, toX, toY } = edge;
  
  ctx.strokeStyle = '#909399';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  
  // 绘制箭头
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const arrowSize = 10;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - arrowSize * Math.cos(angle - Math.PI / 6),
    toY - arrowSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - arrowSize * Math.cos(angle + Math.PI / 6),
    toY - arrowSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = '#909399';
  ctx.fill();
};

const handleDragStart = (event: DragEvent, node: any) => {
  event.dataTransfer!.effectAllowed = 'copy';
  event.dataTransfer!.setData('nodeType', node.type);
  event.dataTransfer!.setData('nodeLabel', node.label);
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.dataTransfer!.dropEffect = 'copy';
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  
  const nodeType = event.dataTransfer!.getData('nodeType');
  const nodeLabel = event.dataTransfer!.getData('nodeLabel');
  
  if (!nodeType || !graph) return;
  
  const rect = graph.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const newNode = {
    id: `node_${nodeIdCounter++}`,
    type: nodeType,
    text: nodeLabel,
    x: x - 60,
    y: y - 30,
    width: 120,
    height: 60,
    selected: false,
    properties: {
      dsType: nodeType === 'datasource' ? 'mysql' : undefined,
      transformType: nodeType === 'transform' ? 'mapping' : undefined,
    },
  };
  
  nodes.value.push(newNode);
  redrawCanvas();
  ElMessage.success('节点已添加');
};

const handleCanvasClick = (event: MouseEvent) => {
  if (!graph) return;
  
  const rect = graph.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // 检查是否点击了某个节点
  let clickedNode = null;
  for (const node of nodes.value) {
    if (x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height) {
      clickedNode = node;
      break;
    }
  }
  
  // 更新选中状态
  nodes.value.forEach(node => {
    node.selected = node === clickedNode;
  });
  
  selectedNode.value = clickedNode;
  redrawCanvas();
};

const handleSave = () => {
  const graphData = {
    nodes: nodes.value,
    edges: edges.value,
  };
  
  console.log('保存流程图数据:', graphData);
  // TODO: 调用API保存到后端
  ElMessage.success('保存成功');
};

const handleBack = () => {
  router.push('/sync/tasks');
};

onMounted(() => {
  initCanvas();
});

onUnmounted(() => {
  // 清理资源
  if (graph && graph.canvas) {
    graph.canvas.removeEventListener('dragover', handleDragOver);
    graph.canvas.removeEventListener('drop', handleDrop);
    graph.canvas.removeEventListener('click', handleCanvasClick);
  }
});
</script>

<style scoped lang="scss">
.design-container {
  padding: 20px;
  height: calc(100vh - 40px);
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.design-content {
  display: flex;
  height: calc(100vh - 180px);
  gap: 10px;
}

.node-panel {
  width: 200px;
  border-right: 1px solid #dcdfe6;
  padding-right: 10px;
  overflow-y: auto;

  h4 {
    margin-bottom: 10px;
  }
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: move;
  background: #fff;

  &:hover {
    background: #f5f7fa;
    border-color: #409eff;
  }
}

.canvas-container {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fafafa;
  position: relative;
}

.canvas {
  width: 100%;
  height: 100%;
}

.property-panel {
  width: 300px;
  border-left: 1px solid #dcdfe6;
  padding-left: 10px;
  overflow-y: auto;

  h4 {
    margin-bottom: 10px;
  }
}
</style>

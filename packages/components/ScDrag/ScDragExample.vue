<template>
  <div class="sc-drag-example">
    <div class="example-header">
      <h2>ScDrag 可拖拽对话框组件示例</h2>
      <p>一个功能强大的可拖拽对话框组件，支持边缘吸附、最小化、科技风格等特性</p>
    </div>

    <!-- 基础用法 -->
    <div class="example-section">
      <h3>基础用法</h3>
      <p>最基本的可拖拽对话框</p>
      <div class="example-demo">
        <el-button type="primary" @click="basicVisible = true">
          打开基础对话框
        </el-button>
        <ScDrag
          v-model="basicVisible"
          title="基础对话框"
          width="400px"
          height="300px"
          @close="basicVisible = false"
          @refresh="handleRefresh"
        >
          <div class="p-4">
            <p>这是一个基础的可拖拽对话框内容。</p>
            <p>你可以拖拽标题栏来移动对话框。</p>
            <el-button @click="basicVisible = false">关闭</el-button>
          </div>
        </ScDrag>
      </div>
    </div>

    <!-- 科技风格 -->
    <div class="example-section">
      <h3>科技风格</h3>
      <p>启用科技风格的对话框</p>
      <div class="example-demo">
        <el-button type="primary" @click="techVisible = true">
          打开科技风格对话框
        </el-button>
        <ScDrag
          v-model="techVisible"
          title="科技风格对话框"
          :tech="true"
          :tech-config="techConfig"
          :tech-title="techTitle"
          width="500px"
          height="400px"
          @close="techVisible = false"
          @refresh="handleRefresh"
        >
          <div class="p-4 text-white">
            <h4 class="text-lg mb-4">科技风格内容</h4>
            <p class="mb-2">这是科技风格的对话框，具有炫酷的边框效果。</p>
            <p class="mb-4">适用于科技感强的应用场景。</p>
            <el-button type="primary" @click="techVisible = false">关闭</el-button>
          </div>
        </ScDrag>
      </div>
    </div>

    <!-- 边缘吸附 -->
    <div class="example-section">
      <h3>边缘吸附功能</h3>
      <p>拖拽到屏幕边缘时自动吸附并最小化</p>
      <div class="example-demo">
        <el-button type="primary" @click="miniVisible = true">
          打开边缘吸附对话框
        </el-button>
        <ScDrag
          v-model="miniVisible"
          title="边缘吸附对话框"
          :mini="true"
          :direction="['top', 'left', 'bottom', 'right']"
          width="450px"
          height="350px"
          @close="miniVisible = false"
          @refresh="handleRefresh"
        >
          <div class="p-4">
            <h4 class="text-lg mb-4">边缘吸附演示</h4>
            <p class="mb-2">将对话框拖拽到屏幕边缘试试看！</p>
            <p class="mb-2">支持上、下、左、右四个方向的边缘吸附。</p>
            <p class="mb-4">吸附后会自动最小化为小图标。</p>
            <el-button @click="miniVisible = false">关闭</el-button>
          </div>
        </ScDrag>
      </div>
    </div>

    <!-- 限制拖拽方向 -->
    <div class="example-section">
      <h3>限制拖拽方向</h3>
      <p>只允许水平或垂直方向拖拽</p>
      <div class="example-demo">
        <el-space>
          <el-button type="primary" @click="horizontalVisible = true">
            水平拖拽
          </el-button>
          <el-button type="primary" @click="verticalVisible = true">
            垂直拖拽
          </el-button>
        </el-space>
        
        <!-- 水平拖拽 -->
        <ScDrag
          v-model="horizontalVisible"
          title="水平拖拽"
          axis="x"
          width="350px"
          height="250px"
          @close="horizontalVisible = false"
        >
          <div class="p-4">
            <p>只能水平方向拖拽</p>
            <el-button @click="horizontalVisible = false">关闭</el-button>
          </div>
        </ScDrag>

        <!-- 垂直拖拽 -->
        <ScDrag
          v-model="verticalVisible"
          title="垂直拖拽"
          axis="y"
          width="350px"
          height="250px"
          @close="verticalVisible = false"
        >
          <div class="p-4">
            <p>只能垂直方向拖拽</p>
            <el-button @click="verticalVisible = false">关闭</el-button>
          </div>
        </ScDrag>
      </div>
    </div>

    <!-- 网格对齐 -->
    <div class="example-section">
      <h3>网格对齐</h3>
      <p>拖拽时按网格对齐</p>
      <div class="example-demo">
        <el-button type="primary" @click="gridVisible = true">
          打开网格对齐对话框
        </el-button>
        <ScDrag
          v-model="gridVisible"
          title="网格对齐"
          :grid="[20, 20]"
          width="400px"
          height="300px"
          @close="gridVisible = false"
        >
          <div class="p-4">
            <p class="mb-2">拖拽时会按20px的网格对齐</p>
            <p class="mb-4">移动更加规整有序</p>
            <el-button @click="gridVisible = false">关闭</el-button>
          </div>
        </ScDrag>
      </div>
    </div>

    <!-- 禁用拖拽 -->
    <div class="example-section">
      <h3>禁用拖拽</h3>
      <p>固定位置的对话框</p>
      <div class="example-demo">
        <el-button type="primary" @click="fixedVisible = true">
          打开固定对话框
        </el-button>
        <ScDrag
          v-model="fixedVisible"
          title="固定对话框"
          :draggable="false"
          width="400px"
          height="300px"
          @close="fixedVisible = false"
        >
          <div class="p-4">
            <p class="mb-2">这个对话框无法拖拽移动</p>
            <p class="mb-4">适用于需要固定位置的场景</p>
            <el-button @click="fixedVisible = false">关闭</el-button>
          </div>
        </ScDrag>
      </div>
    </div>

    <!-- 带遮罩层 -->
    <div class="example-section">
      <h3>带遮罩层</h3>
      <p>显示背景遮罩的对话框</p>
      <div class="example-demo">
        <el-button type="primary" @click="overlayVisible = true">
          打开带遮罩对话框
        </el-button>
        <ScDrag
          v-model="overlayVisible"
          title="带遮罩对话框"
          :overlay="true"
          width="400px"
          height="300px"
          @close="overlayVisible = false"
        >
          <div class="p-4">
            <p class="mb-2">背景有遮罩层效果</p>
            <p class="mb-4">突出对话框内容</p>
            <el-button @click="overlayVisible = false">关闭</el-button>
          </div>
        </ScDrag>
      </div>
    </div>

    <!-- 事件日志 -->
    <div class="example-section">
      <h3>事件日志</h3>
      <div class="event-log">
        <div v-for="(log, index) in eventLogs" :key="index" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-event">{{ log.event }}</span>
          <span class="log-detail">{{ log.detail }}</span>
        </div>
      </div>
    </div>

    <!-- API 文档 -->
    <div class="example-section">
      <h3>API 文档</h3>
      <div class="api-table">
        <h4>Props</h4>
        <table>
          <thead>
            <tr>
              <th>参数</th>
              <th>说明</th>
              <th>类型</th>
              <th>可选值</th>
              <th>默认值</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>v-model</td>
              <td>是否显示对话框</td>
              <td>boolean</td>
              <td>—</td>
              <td>false</td>
            </tr>
            <tr>
              <td>title</td>
              <td>对话框标题</td>
              <td>string</td>
              <td>—</td>
              <td>标题</td>
            </tr>
            <tr>
              <td>width</td>
              <td>对话框宽度</td>
              <td>string</td>
              <td>—</td>
              <td>60vh</td>
            </tr>
            <tr>
              <td>height</td>
              <td>对话框高度</td>
              <td>string</td>
              <td>—</td>
              <td>60vh</td>
            </tr>
            <tr>
              <td>draggable</td>
              <td>是否可拖拽</td>
              <td>boolean</td>
              <td>—</td>
              <td>true</td>
            </tr>
            <tr>
              <td>axis</td>
              <td>拖拽方向限制</td>
              <td>string</td>
              <td>x / y</td>
              <td>—</td>
            </tr>
            <tr>
              <td>grid</td>
              <td>网格对齐</td>
              <td>array</td>
              <td>—</td>
              <td>—</td>
            </tr>
            <tr>
              <td>mini</td>
              <td>是否启用边缘吸附</td>
              <td>boolean</td>
              <td>—</td>
              <td>false</td>
            </tr>
            <tr>
              <td>direction</td>
              <td>吸附方向</td>
              <td>array</td>
              <td>top/left/bottom/right</td>
              <td>['top', 'left', 'bottom', 'right']</td>
            </tr>
            <tr>
              <td>overlay</td>
              <td>是否显示遮罩</td>
              <td>boolean</td>
              <td>—</td>
              <td>false</td>
            </tr>
            <tr>
              <td>tech</td>
              <td>是否启用科技风格</td>
              <td>boolean</td>
              <td>—</td>
              <td>false</td>
            </tr>
            <tr>
              <td>tech-config</td>
              <td>科技风格配置</td>
              <td>object</td>
              <td>—</td>
              <td>—</td>
            </tr>
            <tr>
              <td>tech-title</td>
              <td>科技风格标题配置</td>
              <td>object</td>
              <td>—</td>
              <td>—</td>
            </tr>
            <tr>
              <td>z-index</td>
              <td>层级</td>
              <td>number</td>
              <td>—</td>
              <td>9</td>
            </tr>
            <tr>
              <td>mini-icon</td>
              <td>最小化图标</td>
              <td>object</td>
              <td>—</td>
              <td>Setting图标</td>
            </tr>
          </tbody>
        </table>

        <h4>Events</h4>
        <table>
          <thead>
            <tr>
              <th>事件名</th>
              <th>说明</th>
              <th>回调参数</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>close</td>
              <td>关闭对话框时触发</td>
              <td>—</td>
            </tr>
            <tr>
              <td>refresh</td>
              <td>点击刷新按钮时触发</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>

        <h4>Methods</h4>
        <table>
          <thead>
            <tr>
              <th>方法名</th>
              <th>说明</th>
              <th>参数</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>reset</td>
              <td>重置对话框位置</td>
              <td>—</td>
            </tr>
            <tr>
              <td>getPosition</td>
              <td>获取当前位置</td>
              <td>—</td>
            </tr>
            <tr>
              <td>disable</td>
              <td>禁用拖拽</td>
              <td>—</td>
            </tr>
            <tr>
              <td>enable</td>
              <td>启用拖拽</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>

        <h4>Slots</h4>
        <table>
          <thead>
            <tr>
              <th>插槽名</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>default</td>
              <td>对话框内容</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import ScDrag from './index.vue'

// 响应式数据
const basicVisible = ref(false)
const techVisible = ref(false)
const miniVisible = ref(false)
const horizontalVisible = ref(false)
const verticalVisible = ref(false)
const gridVisible = ref(false)
const fixedVisible = ref(false)
const overlayVisible = ref(false)

// 科技风格配置
const techConfig = reactive({
  backgroundColor: '#001529',
  borderColor: '#1890ff',
  decorationColor: ['#52c41a', '#faad14']
})

const techTitle = reactive({
  scale: 1.3,
  position: 'left',
  decorationColor: '#fff',
  fontWeight: 'bold',
  color: '#1890ff'
})

// 事件日志
const eventLogs = ref([])

// 添加日志
const addLog = (event, detail = '') => {
  const time = new Date().toLocaleTimeString()
  eventLogs.value.unshift({ time, event, detail })
  if (eventLogs.value.length > 10) {
    eventLogs.value.pop()
  }
}

// 事件处理
const handleRefresh = () => {
  addLog('refresh', '刷新按钮被点击')
  console.log('对话框刷新')
}
</script>

<style scoped>
.sc-drag-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--el-text-color-primary);
  border-radius: 10px;
}

.example-header h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: bold;
}

.example-header p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.example-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.example-section h3 {
  margin: 0 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  border-bottom: 2px solid #409eff;
  padding-bottom: 5px;
}

.example-section p {
  margin: 0 0 15px 0;
  color: var(--el-text-color-primary);
  line-height: 1.6;
}

.example-demo {
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.event-log {
  max-height: 300px;
  overflow-y: auto;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 10px;
}

.log-item {
  display: flex;
  padding: 5px 0;
  border-bottom: 1px solid #e9ecef;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-time {
  color: #6c757d;
  margin-right: 10px;
  min-width: 80px;
}

.log-event {
  color: #007bff;
  margin-right: 10px;
  min-width: 80px;
  font-weight: bold;
}

.log-detail {
  color: #28a745;
}

.api-table {
  margin-top: 20px;
}

.api-table h4 {
  margin: 20px 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.api-table table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.api-table th,
.api-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.api-table th {
  background: var(--el-bg-color-overlay);
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.api-table td {
  color: var(--el-text-color-primary);
}

.api-table tr:hover {
  background: var(--el-bg-color-overlay);
}

.api-table code {
  background: #f1f2f3;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #e74c3c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sc-drag-example {
    padding: 10px;
  }
  
  .example-header {
    padding: 15px;
  }
  
  .example-header h2 {
    font-size: 24px;
  }
  
  .example-section {
    padding: 15px;
  }
  
  .api-table {
    overflow-x: auto;
  }
  
  .api-table table {
    min-width: 600px;
  }
}
</style>
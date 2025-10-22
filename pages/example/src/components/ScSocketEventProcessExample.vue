<template>
  <div class="sc-socket-event-process-example">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>Socket事件进度条组件 (ScSocketEventProcess) - 增强版</h3>
          <p class="text-secondary">支持内嵌模式和弹框模式，支持多事件监听、自定义布局、拖拽缩放等功能</p>
        </div>
      </template>

      <!-- 模式切换 -->
      <div class="mode-selector mb-4">
        <h4>显示模式</h4>
        <el-segmented
          v-model="currentMode"
          :options="[
            { value: 'embed', label: '内嵌模式' },
            { value: 'dialog', label: '弹框模式' }
          ]"
        />
      </div>

      <!-- 内嵌模式示例 -->
      <div v-if="currentMode === 'embed'" class="embed-examples">
        <el-row :gutter="20">
          <!-- 示例1: Process布局 -->
          <el-col :span="12">
            <div class="example-card">
              <h4>示例1: Process布局（进度条）</h4>
              <ScSocketEventProcess
                :eventId="eventId1"
                title="数据同步进度"
                icon="ri:download-cloud-line"
                mode="embed"
                layout="process"
                dataType="default"
                ref="processRef1"
                @data="handleData"
              />

              <div class="action-buttons mt-3">
                <el-button-group>
                  <el-button size="small" type="primary" @click="simulateProgress(processRef1, 0)">开始</el-button>
                  <el-button size="small" type="success" @click="simulateProgress(processRef1, 100)">完成</el-button>
                  <el-button size="small" type="warning" @click="simulateProgress(processRef1, 50)">进行中</el-button>
                  <el-button size="small" type="danger" @click="simulateError(processRef1)">错误</el-button>
                  <el-button size="small" @click="processRef1?.resetProgress()">重置</el-button>
                </el-button-group>
              </div>

              <CodeDisplay :code="code1" language="vue" class="mt-3" />
            </div>
          </el-col>

          <!-- 示例2: Log布局 -->
          <el-col :span="12">
            <div class="example-card">
              <h4>示例2: Log布局（日志）</h4>
              <ScSocketEventProcess
                :eventId="eventId2"
                title="构建日志"
                icon="ri:file-list-3-line"
                mode="embed"
                layout="log"
                :height="250"
                dataType="default"
                ref="processRef2"
                @data="handleData"
              />

              <div class="action-buttons mt-3">
                <el-button-group>
                  <el-button size="small" type="primary" @click="addRandomLog(processRef2)">添加日志</el-button>
                  <el-button size="small" type="success" @click="simulateLogComplete(processRef2)">完成</el-button>
                  <el-button size="small" @click="processRef2?.clearLogs()">清空日志</el-button>
                  <el-button size="small" @click="processRef2?.resetProgress()">重置</el-button>
                </el-button-group>
              </div>

              <CodeDisplay :code="code2" language="vue" class="mt-3" />
            </div>
          </el-col>
        </el-row>

        <!-- 示例3: 自定义布局 -->
        <el-row :gutter="20" class="mt-4">
          <el-col :span="12">
            <div class="example-card">
              <h4>示例3: 自定义布局（Custom Slot）</h4>
              <ScSocketEventProcess
                :eventId="eventId3"
                title="自定义进度"
                mode="embed"
                layout="custom"
                dataType="default"
                ref="processRef3"
                @data="handleData"
              >
                <template #default="{ data, percentage, status }">
                  <div class="custom-layout">
                    <div class="custom-header">
                      <el-tag :type="getStatusType(status)" size="large">{{ status }}</el-tag>
                      <span class="custom-percentage">{{ percentage }}%</span>
                    </div>
                    <div class="custom-content">
                      <el-progress
                        :percentage="percentage"
                        :color="getProgressColor(percentage)"
                        :stroke-width="20"
                      />
                      <div class="custom-message" v-if="data.message">
                        {{ data.message }}
                      </div>
                      <div class="custom-data" v-if="Object.keys(data).length > 0">
                        <pre>{{ JSON.stringify(data, null, 2) }}</pre>
                      </div>
                    </div>
                  </div>
                </template>
              </ScSocketEventProcess>

              <div class="action-buttons mt-3">
                <el-button-group>
                  <el-button size="small" type="primary" @click="simulateProgress(processRef3, 30)">30%</el-button>
                  <el-button size="small" type="success" @click="simulateProgress(processRef3, 70)">70%</el-button>
                  <el-button size="small" @click="processRef3?.resetProgress()">重置</el-button>
                </el-button-group>
              </div>

              <CodeDisplay :code="code3" language="vue" class="mt-3" />
            </div>
          </el-col>

          <!-- 示例4: 多事件监听 -->
          <el-col :span="12">
            <div class="example-card">
              <h4>示例4: 多事件监听</h4>
              <p class="description">监听多个Socket事件：progress、build、deploy</p>
              <ScSocketEventProcess
                :event-id="eventId4"
                title="多事件监听"
                :event-name="(multiEvents as any)"
                mode="embed"
                layout="log"
                :height="250"
                data-type="socket"
                socket-key="custom"
                ref="processRef4"
                @data="handleData"
              />

              <CodeDisplay :code="code4" language="vue" class="mt-3" />
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 弹框模式示例 -->
      <div v-if="currentMode === 'dialog'" class="dialog-examples">
        <el-alert
          title="弹框模式说明"
          type="info"
          :closable="false"
          class="mb-4"
        >
          <p><strong>弹框模式使用说明：</strong></p>
          <ul>
            <li>✅ 使用 <code>v-model:visible</code> 控制显示/隐藏</li>
            <li>📍 四个角落定位（top-left, top-right, bottom-left, bottom-right）</li>
            <li>🖱️ 拖拽移动（鼠标拖动标题栏）</li>
            <li>↔️ 八个方向缩放（四个角和四条边）</li>
            <li>➖ 最小化/还原（点击最小化按钮）</li>
            <li>💾 位置和大小自动保存到localStorage（使用 storagePrefix + eventId 作为key）</li>
          </ul>
          <p class="mt-2"><strong>提示：</strong>点击下方按钮显示弹框，弹框支持拖拽移动和调整大小，刷新页面后位置会保持。</p>
        </el-alert>

        <el-row :gutter="20">
          <!-- 控制面板 -->
          <el-col :span="24">
            <div class="control-panel">
              <h4>🎮 控制面板</h4>
              <div class="control-section">
                <span class="control-label">显示/隐藏弹框：</span>
                <el-space wrap>
                  <el-button type="primary" @click="showDialog1 = !showDialog1">
                    <IconifyIconOnline :icon="showDialog1 ? 'ri:eye-off-line' : 'ri:eye-line'" class="mr-1" />
                    {{ showDialog1 ? '隐藏' : '显示' }} 右下角弹框
                  </el-button>
                  <el-button type="success" @click="showDialog2 = !showDialog2">
                    <IconifyIconOnline :icon="showDialog2 ? 'ri:eye-off-line' : 'ri:eye-line'" class="mr-1" />
                    {{ showDialog2 ? '隐藏' : '显示' }} 左上角弹框
                  </el-button>
                  <el-button type="warning" @click="showDialog3 = !showDialog3">
                    <IconifyIconOnline :icon="showDialog3 ? 'ri:eye-off-line' : 'ri:eye-line'" class="mr-1" />
                    {{ showDialog3 ? '隐藏' : '显示' }} 右上角弹框
                  </el-button>
                  <el-button type="info" @click="showDialog4 = !showDialog4">
                    <IconifyIconOnline :icon="showDialog4 ? 'ri:eye-off-line' : 'ri:eye-line'" class="mr-1" />
                    {{ showDialog4 ? '隐藏' : '显示' }} 左下角弹框
                  </el-button>
                </el-space>
              </div>
              
              <el-divider />
              
              <div class="control-section">
                <span class="control-label">测试进度更新：</span>
                <el-space wrap>
                  <el-button size="small" @click="simulateProgress(dialogRef1, 30)">更新弹框1进度</el-button>
                  <el-button size="small" @click="addRandomLog(dialogRef2)">添加弹框2日志</el-button>
                  <el-button size="small" @click="simulateProgress(dialogRef3, 70)">更新弹框3进度</el-button>
                  <el-button size="small" @click="simulateProgress(dialogRef4, 100)">完成弹框4</el-button>
                </el-space>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-4">
          <el-col :span="12">
            <CodeDisplay :code="code5" language="vue" title="右下角弹框代码" />
          </el-col>
          <el-col :span="12">
            <CodeDisplay :code="code6" language="vue" title="左上角弹框代码" />
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 弹框实例 -->
    <ScSocketEventProcess
      v-model:visible="showDialog1"
      :eventId="'dialog-1'"
      title="下载进度"
      icon="ri:download-line"
      mode="dialog"
      position="bottom-right"
      layout="process"
      :width="400"
      :dialogHeight="250"
      dataType="default"
      storagePrefix="demo"
      ref="dialogRef1"
      @data="handleData"
      @close="showDialog1 = false"
      @minimize="handleMinimize"
    />

    <ScSocketEventProcess
      v-model:visible="showDialog2"
      :eventId="'dialog-2'"
      title="构建日志"
      icon="ri:file-list-line"
      mode="dialog"
      position="top-left"
      layout="log"
      :width="500"
      :dialogHeight="400"
      :height="300"
      dataType="default"
      storagePrefix="demo"
      ref="dialogRef2"
      @data="handleData"
      @close="showDialog2 = false"
    />

    <ScSocketEventProcess
      v-model:visible="showDialog3"
      :eventId="'dialog-3'"
      title="部署状态"
      icon="ri:rocket-line"
      mode="dialog"
      position="top-right"
      layout="process"
      :width="450"
      :dialogHeight="300"
      dataType="default"
      storagePrefix="demo"
      ref="dialogRef3"
      @data="handleData"
      @close="showDialog3 = false"
    />

    <ScSocketEventProcess
      v-model:visible="showDialog4"
      :eventId="'dialog-4'"
      title="自定义布局弹框"
      icon="ri:settings-3-line"
      mode="dialog"
      position="bottom-left"
      layout="custom"
      :width="400"
      :dialogHeight="350"
      dataType="default"
      storagePrefix="demo"
      ref="dialogRef4"
      @data="handleData"
      @close="showDialog4 = false"
    >
      <template #default="{ data, percentage, status }">
        <div class="custom-dialog-content">
          <el-result
            :icon="getResultIcon(status)"
            :title="status"
            :sub-title="`进度: ${percentage}%`"
          >
            <template #extra>
              <el-progress
                type="circle"
                :percentage="percentage"
                :color="getProgressColor(percentage)"
              />
            </template>
          </el-result>
        </div>
      </template>
    </ScSocketEventProcess>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ScSocketEventProcess from "@repo/components/ScSocketEventProcess/index.vue";
import CodeDisplay from "./CodeDisplay.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 配置
const currentMode = ref("embed");
const eventId1 = "demo-event-1";
const eventId2 = "demo-event-2";
const eventId3 = "demo-event-3";
const eventId4 = "demo-event-4";
const multiEvents = ["progress", "build", "deploy"];

// 引用
const processRef1 = ref(null);
const processRef2 = ref(null);
const processRef3 = ref(null);
const processRef4 = ref(null);
const dialogRef1 = ref(null);
const dialogRef2 = ref(null);
const dialogRef3 = ref(null);
const dialogRef4 = ref(null);

// 弹框显示状态
const showDialog1 = ref(false);
const showDialog2 = ref(false);
const showDialog3 = ref(false);
const showDialog4 = ref(false);

// 模拟进度
const simulateProgress = (processRef: any, percentage: number) => {
  const message = percentage === 0 ? "开始处理..." : percentage === 100 ? "处理完成!" : `正在处理中: ${percentage}%`;
  const status = percentage === 0 ? "waiting" : percentage === 100 ? "success" : "processing";

  if (processRef) {
    processRef.updateProgress({
      message,
      percentage,
      status,
      step: Math.ceil(percentage / 10),
      total: 10
    });
  }
};

// 模拟错误
const simulateError = (processRef: any) => {
  if (processRef) {
    processRef.updateProgress({
      message: "处理失败: 连接超时",
      percentage: 75,
      status: "error",
      step: 7,
      total: 10
    });
  }
};

// 随机日志消息
const logMessages = [
  "启动构建任务...",
  "下载依赖包...",
  "编译源代码...",
  "运行单元测试...",
  "打包应用程序...",
  "生成文档...",
  "上传到服务器...",
  "清理临时文件...",
  "构建完成!"
];

// 添加随机日志
const addRandomLog = (processRef: any) => {
  if (processRef) {
    const randomIndex = Math.floor(Math.random() * logMessages.length);
    const randomMessage = logMessages[randomIndex];
    
    processRef.addLog(randomMessage);
    
    // 更新进度
    const currentProgress = Math.min(100, Math.floor(Math.random() * 100));
    processRef.updateProgress({
      message: randomMessage,
      percentage: currentProgress,
      status: currentProgress === 100 ? "success" : "processing"
    });
  }
};

// 模拟日志完成
const simulateLogComplete = (processRef: any) => {
  if (processRef) {
    processRef.addLog("========================================");
    processRef.addLog("构建成功完成!");
    processRef.updateProgress({
      message: "构建成功完成!",
      percentage: 100,
      status: "success"
    });
  }
};

// 数据回调
const handleData = (data: any) => {
  console.log("收到进度数据:", data);
};

// 最小化回调
const handleMinimize = (minimized: boolean) => {
  console.log("弹框最小化状态:", minimized);
};

// 工具函数
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    waiting: "info",
    processing: "warning",
    success: "success",
    error: "danger"
  };
  return map[status] || "info";
};

const getProgressColor = (percentage: number) => {
  if (percentage < 30) return "#f56c6c";
  if (percentage < 70) return "#e6a23c";
  return "#67c23a";
};

const getResultIcon = (status: string) => {
  const map: Record<string, string> = {
    waiting: "clock",
    processing: "warning",
    success: "success",
    error: "error"
  };
  return map[status] || "info";
};

// 代码示例
const code1 = `<ScSocketEventProcess
  eventId="demo-event-1"
  title="数据同步进度"
  icon="ri:download-cloud-line"
  mode="embed"
  layout="process"
  dataType="default"
  @data="handleData"
  ref="processRef"
/>

<!-- 手动更新进度 -->
<el-button @click="processRef.updateProgress({
  message: '正在同步...',
  percentage: 50,
  status: 'processing',
  step: 5,
  total: 10
})">更新进度</el-button>`;

const code2 = `<ScSocketEventProcess
  eventId="demo-event-2"
  title="构建日志"
  icon="ri:file-list-3-line"
  mode="embed"
  layout="log"
  :height="250"
  dataType="default"
  @data="handleData"
  ref="processRef"
/>

<!-- 添加日志 -->
<el-button @click="processRef.addLog('编译完成')">
  添加日志
</el-button>`;

const code3 = `<ScSocketEventProcess
  eventId="demo-event-3"
  title="自定义进度"
  mode="embed"
  layout="custom"
  dataType="default"
  @data="handleData"
>
  <template #default="{ data, percentage, status }">
    <div class="custom-layout">
      <el-tag :type="getStatusType(status)">{{ status }}</el-tag>
      <span>{{ percentage }}%</span>
      <el-progress :percentage="percentage" />
      <pre>{{ JSON.stringify(data, null, 2) }}</pre>
    </div>
  </template>
</ScSocketEventProcess>`;

const code4 = `<ScSocketEventProcess
  eventId="demo-event-4"
  title="多事件监听"
  :eventName="['progress', 'build', 'deploy']"
  mode="embed"
  layout="log"
  :height="250"
  dataType="socket"
  socketKey="custom"
  @data="handleData"
/>

<!-- 
  组件会自动监听三个socket事件：
  - progress: 进度更新
  - build: 构建事件
  - deploy: 部署事件
-->`;

const code5 = `<ScSocketEventProcess
  v-model:visible="showDialog"
  eventId="dialog-1"
  title="下载进度"
  icon="ri:download-line"
  mode="dialog"
  position="bottom-right"
  layout="process"
  :width="400"
  :dialogHeight="250"
  dataType="default"
  storagePrefix="demo"
  @data="handleData"
  @close="showDialog = false"
  @minimize="handleMinimize"
/>

<!-- 
  弹框模式特点：
  - 支持拖拽移动
  - 支持八方向缩放
  - 支持最小化/还原
  - 位置和大小自动保存
-->`;

const code6 = `<ScSocketEventProcess
  v-model:visible="showDialog"
  eventId="dialog-2"
  title="构建日志"
  mode="dialog"
  position="top-left"
  layout="log"
  :width="500"
  :dialogHeight="400"
  :height="300"
  storagePrefix="demo"
  @close="showDialog = false"
/>

<!-- 
  localStorage存储key格式：
  {storagePrefix}-{eventId}
  
  本例: demo-dialog-2
-->`;
</script>

<style scoped>
.sc-socket-event-process-example {
  padding: 20px 0;
}

.card-header h3 {
  margin: 0 0 8px 0;
  font-size: 22px;
}

.text-secondary {
  color: var(--el-text-color-secondary);
  margin: 0;
}

.mode-selector {
  margin-bottom: 20px;
}

h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.example-card {
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  margin-bottom: 20px;
}

.description {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.control-panel {
  padding: 20px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.control-section {
  margin-bottom: 12px;
}

.control-section:last-child {
  margin-bottom: 0;
}

.control-label {
  display: inline-block;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  font-size: 14px;
}

.mr-1 {
  margin-right: 4px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

/* 自定义布局样式 */
.custom-layout {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.custom-percentage {
  font-size: 24px;
  font-weight: bold;
}

.custom-content {
  margin-top: 16px;
}

.custom-message {
  margin-top: 12px;
  font-size: 14px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.custom-data {
  margin-top: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.custom-data pre {
  margin: 0;
  color: #a8dadc;
}

.custom-dialog-content {
  padding: 20px;
  text-align: center;
}
</style>

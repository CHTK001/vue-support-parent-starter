<template>
  <div class="socket-event-process-example">
    <sc-panel title="Socket事件进度条组件" type="card">
      <template #description> 用于监听Socket事件并显示进度条，支持两种布局方式：进度条布局和日志布局 </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础示例" name="basic">
          <div class="example-section">
            <sc-panel title="Process布局" type="border">
              <div class="example-card">
                <ScSocketEventProcess ref="processRef" eventId="demo-process-1" title="数据同步进度" eventName="sync-progress" dataType="default" layout="process" />

                <div class="example-controls">
                  <el-button type="primary" @click="simulateProcessProgress">模拟进度</el-button>
                  <el-button @click="resetProcess">重置</el-button>
                </div>
              </div>
            </sc-panel>

            <sc-panel title="Log布局" type="border">
              <div class="example-card">
                <ScSocketEventProcess ref="logRef" eventId="demo-log-1" title="数据导入日志" eventName="import-log" dataType="default" layout="log" :height="200" />

                <div class="example-controls">
                  <el-button type="primary" @click="simulateLogProgress">模拟日志</el-button>
                  <el-button @click="resetLog">重置</el-button>
                </div>
              </div>
            </sc-panel>
          </div>
        </el-tab-pane>

        <el-tab-pane label="配置面板" name="config">
          <div class="config-panel">
            <sc-panel title="组件配置" type="border">
              <el-form :model="config" label-width="120px" label-position="left">
                <el-form-item label="事件ID">
                  <el-input v-model="config.eventId" placeholder="请输入事件ID" />
                </el-form-item>

                <el-form-item label="事件名称">
                  <el-input v-model="config.eventName" placeholder="请输入事件名称" />
                </el-form-item>

                <el-form-item label="标题">
                  <el-input v-model="config.title" placeholder="请输入标题" />
                </el-form-item>

                <el-form-item label="数据来源">
                  <el-select v-model="config.dataType" style="width: 100%">
                    <el-option label="Socket" value="socket" />
                    <el-option label="默认" value="default" />
                  </el-select>
                </el-form-item>

                <el-form-item label="布局方式">
                  <el-select v-model="config.layout" style="width: 100%">
                    <el-option label="进度条布局" value="process" />
                    <el-option label="日志布局" value="log" />
                  </el-select>
                </el-form-item>

                <el-form-item label="日志高度" v-if="config.layout === 'log'">
                  <el-slider v-model="config.height" :min="100" :max="500" :step="10" show-input />
                </el-form-item>

                <el-divider>进度模拟</el-divider>

                <el-form-item label="消息内容">
                  <el-input v-model="config.message" placeholder="请输入消息内容" />
                </el-form-item>

                <el-form-item label="进度">
                  <el-slider v-model="config.percentage" :min="0" :max="100" show-input />
                </el-form-item>

                <el-form-item label="状态">
                  <el-select v-model="config.status" style="width: 100%">
                    <el-option label="等待中" value="waiting" />
                    <el-option label="处理中" value="processing" />
                    <el-option label="已完成" value="success" />
                    <el-option label="失败" value="error" />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="updateProgress">更新进度</el-button>
                  <el-button @click="resetConfigProgress">重置</el-button>
                </el-form-item>
              </el-form>
            </sc-panel>

            <sc-panel title="预览" type="border">
              <ScSocketEventProcess ref="configRef" :eventId="config.eventId" :title="config.title" :eventName="config.eventName" :dataType="config.dataType" :layout="config.layout" :height="config.height" />
            </sc-panel>
          </div>
        </el-tab-pane>

        <el-tab-pane label="API文档" name="api">
          <sc-panel title="属性" type="border">
            <el-table :data="propData" border stripe>
              <el-table-column prop="name" label="参数" width="180" />
              <el-table-column prop="type" label="类型" width="180" />
              <el-table-column prop="default" label="默认值" width="180" />
              <el-table-column prop="description" label="说明" />
            </el-table>
          </sc-panel>

          <sc-panel title="方法" type="border" class="mt-4">
            <el-table :data="methodData" border stripe>
              <el-table-column prop="name" label="方法名" width="180" />
              <el-table-column prop="params" label="参数" width="280" />
              <el-table-column prop="description" label="说明" />
            </el-table>
          </sc-panel>

          <sc-panel title="数据格式" type="border" class="mt-4">
            <pre class="code-block">
{
  name: string;       // 事件名称
  eventId: string | number; // 事件ID
  message: string;    // 消息
  step: number;       // 进度（>0表示实际进度，<=0表示进度子项）
  total: number;      // 总进度
  status?: string;    // 可选状态：waiting, processing, success, error
  percentage?: number; // 可选百分比
}
            </pre>
          </sc-panel>

          <sc-panel title="使用示例" type="border" class="mt-4">
            <pre class="code-block">
&lt;template&gt;
  &lt;div&gt;
    &lt;ScSocketEventProcess
      ref="progressRef"
      eventId="task-123"
      title="数据同步进度"
      eventName="sync-progress"
      dataType="socket"
      layout="process"
    /&gt;
    
    &lt;el-button @click="startSync"&gt;开始同步&lt;/el-button&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref } from 'vue';

const progressRef = ref();

const startSync = () => {
  // 显示进度条
  progressRef.value.show();
  
  // 如果使用默认数据源，可以手动更新进度
  progressRef.value.updateProgress({
    message: '正在同步数据...',
    percentage: 30,
    status: 'processing'
  });
  
  // Socket会自动接收服务端推送的进度更新
};
&lt;/script&gt;
            </pre>
          </sc-panel>
        </el-tab-pane>
      </el-tabs>
    </sc-panel>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import ScSocketEventProcess from "@repo/components/ScSocketEventProcess/index.vue";

// 当前激活的标签页
const activeTab = ref("basic");

// 组件引用
const processRef = ref();
const logRef = ref();
const configRef = ref();

// 配置面板数据
const config = reactive({
  eventId: "config-demo-1",
  eventName: "config-event",
  title: "配置示例进度",
  dataType: "default",
  layout: "process",
  height: 200,
  message: "正在处理数据...",
  percentage: 50,
  status: "processing",
});

// 模拟Process布局进度
const simulateProcessProgress = () => {
  const total = 100;
  let step = 0;

  processRef.value.resetProgress();
  processRef.value.show();

  const interval = setInterval(() => {
    step += 5;

    processRef.value.updateProgress({
      message: `正在处理数据，请稍候...`,
      step,
      total,
      status: step >= total ? "success" : "processing",
    });

    // 添加子步骤
    if (step % 20 === 0 && step < total) {
      processRef.value.updateProgress({
        message: `完成子任务: 处理第${step / 20}批数据`,
        step: -1, // 负数表示子步骤
        total,
      });
    }

    if (step >= total) {
      clearInterval(interval);
      processRef.value.updateProgress({
        message: "数据处理完成！",
        step: total,
        total,
        status: "success",
      });
    }
  }, 500);
};

// 重置Process布局进度
const resetProcess = () => {
  processRef.value.resetProgress();
};

// 模拟Log布局进度
const simulateLogProgress = () => {
  const total = 100;
  let step = 0;

  logRef.value.resetProgress();
  logRef.value.show();

  // 添加初始日志
  logRef.value.addLog("开始数据导入任务", 0);

  const interval = setInterval(() => {
    step += 10;

    // 更新进度条
    logRef.value.updateProgress({
      message: `正在导入数据 (${step}%)`,
      percentage: step,
      status: step >= total ? "success" : "processing",
    });

    // 添加主日志
    if (step % 20 === 0) {
      logRef.value.addLog(`完成 ${step}% 的数据导入`, 0);

      // 添加子日志
      logRef.value.addLog(`处理了 ${step / 2} 条记录`, 1);
      logRef.value.addLog(`验证了 ${step / 4} 个字段`, 1);
    }

    if (step >= total) {
      clearInterval(interval);
      logRef.value.addLog("数据导入任务完成！", 0);
      logRef.value.updateProgress({
        message: "导入完成",
        percentage: 100,
        status: "success",
      });
    }
  }, 500);
};

// 重置Log布局进度
const resetLog = () => {
  logRef.value.resetProgress();
};

// 更新配置面板的进度
const updateProgress = () => {
  configRef.value.show();
  configRef.value.updateProgress({
    message: config.message,
    percentage: config.percentage,
    status: config.status,
  });

  // 如果是日志布局，添加一条日志
  if (config.layout === "log") {
    configRef.value.addLog(config.message, 0);
  }
};

// 重置配置面板的进度
const resetConfigProgress = () => {
  configRef.value.resetProgress();
};

// 属性数据
const propData = [
  {
    name: "eventId",
    type: "String / Number",
    default: "-",
    description: "事件ID，用于标识和过滤数据",
  },
  {
    name: "title",
    type: "String",
    default: "同步进度",
    description: "进度条标题",
  },
  {
    name: "eventName",
    type: "String",
    default: "progress-event",
    description: "事件名称，用于Socket监听",
  },
  {
    name: "dataType",
    type: "String",
    default: "socket",
    description: "数据来源，可选值：socket、default",
  },
  {
    name: "layout",
    type: "String",
    default: "process",
    description: "布局方式，可选值：process、log",
  },
  {
    name: "height",
    type: "Number",
    default: "200",
    description: "日志容器高度，仅在layout为log时生效",
  },
];

// 方法数据
const methodData = [
  {
    name: "updateProgress",
    params: "data: ProgressData",
    description: "手动更新进度",
  },
  {
    name: "resetProgress",
    params: "-",
    description: "重置进度",
  },
  {
    name: "show",
    params: "-",
    description: "显示进度条",
  },
  {
    name: "hide",
    params: "-",
    description: "隐藏进度条",
  },
  {
    name: "addLog",
    params: "message: string, indent: number = 0",
    description: "添加日志，仅在layout为log时生效",
  },
  {
    name: "clearLogs",
    params: "-",
    description: "清空日志，仅在layout为log时生效",
  },
];
</script>

<style scoped>
.socket-event-process-example {
  padding: 16px;
}

.example-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.example-card {
  padding: 16px;
  border-radius: 8px;
}

.example-controls {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

.config-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.code-block {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
  font-family: monospace;
  white-space: pre-wrap;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.mt-4 {
  margin-top: 16px;
}

@media (max-width: 1200px) {
  .config-panel {
    grid-template-columns: 1fr;
  }
}
</style>

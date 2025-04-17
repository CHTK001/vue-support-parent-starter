<template>
  <div class="sc-socket-event-process-example">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>Socket事件进度条组件 (ScSocketEventProcess)</h3>
          <p class="text-secondary">一个实时显示Socket事件进度的组件，支持进度条和日志两种布局模式</p>
        </div>
      </template>

      <!-- 预览区域 -->
      <div class="preview-area">
        <h4>组件预览</h4>
        <div class="preview-container">
          <ScSocketEventProcess :eventId="eventId" :title="title" :layout="layout" :dataType="dataType" :height="height" :eventName="eventName" ref="processRef" />

          <div class="action-buttons mt-4">
            <el-button-group>
              <el-button type="primary" @click="simulateProgress(0)">模拟开始</el-button>
              <el-button type="success" @click="simulateProgress(100)">模拟完成</el-button>
              <el-button type="warning" @click="simulateProgress(50)">模拟进行中</el-button>
              <el-button type="danger" @click="simulateError">模拟错误</el-button>
              <el-button @click="resetProgress">重置</el-button>
              <el-button @click="addRandomLog">添加随机日志</el-button>
            </el-button-group>
          </div>
        </div>
      </div>

      <!-- 配置面板 -->
      <div class="config-panel mt-4">
        <h4>配置选项</h4>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form label-position="top" size="default">
              <el-form-item label="事件ID">
                <el-input v-model="eventId" placeholder="唯一标识此进度条的ID" />
              </el-form-item>

              <el-form-item label="标题">
                <el-input v-model="title" placeholder="进度条标题" />
              </el-form-item>

              <el-form-item label="事件名称">
                <el-input v-model="eventName" placeholder="Socket监听的事件名称" />
              </el-form-item>
            </el-form>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form label-position="top" size="default">
              <el-form-item label="布局类型">
                <el-segmented
                  v-model="layout"
                  class="w-100"
                  :options="[
                    { value: 'process', label: '进度条' },
                    { value: 'log', label: '日志' },
                  ]"
                />
              </el-form-item>

              <el-form-item label="数据类型">
                <el-segmented
                  v-model="dataType"
                  class="w-100"
                  :options="[
                    { value: 'socket', label: 'Socket事件' },
                    { value: 'default', label: '手动更新' },
                  ]"
                />
              </el-form-item>

              <el-form-item label="日志容器高度" v-if="layout === 'log'">
                <el-slider v-model="height" :min="100" :max="500" :step="50" show-stops />
                <div class="height-hint">{{ height }}px</div>
              </el-form-item>
            </el-form>
          </el-col>
        </el-row>
      </div>

      <!-- 代码示例 -->
      <div class="code-example mt-4">
        <h4>代码示例</h4>
        <el-alert type="info" :closable="false" class="mb-3">
          <div class="code-desc">根据当前配置生成的代码示例</div>
        </el-alert>
        <pre><code class="language-html">{{ codeExample }}</code></pre>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import ScSocketEventProcess from "@repo/components/ScSocketEventProcess/index.vue";

// 配置选项
const eventId = ref("demo-event-1");
const title = ref("同步进度");
const layout = ref("process");
const dataType = ref("default");
const height = ref(200);
const eventName = ref("progress-event");

// 组件引用
const processRef = ref(null);

// 模拟进度
const simulateProgress = (percentage) => {
  const message = percentage === 0 ? "开始处理..." : percentage === 100 ? "处理完成!" : `正在处理中: ${percentage}%`;

  const status = percentage === 0 ? "processing" : percentage === 100 ? "success" : "processing";

  if (processRef.value) {
    processRef.value.updateProgress({
      message,
      percentage,
      status,
      step: percentage === 100 ? 10 : Math.ceil(percentage / 10),
      total: 10,
    });
  }
};

// 模拟错误
const simulateError = () => {
  if (processRef.value) {
    processRef.value.updateProgress({
      message: "处理失败: 连接超时",
      percentage: 75,
      status: "error",
      step: 7,
      total: 10,
    });
  }
};

// 重置进度
const resetProgress = () => {
  if (processRef.value) {
    processRef.value.resetProgress();
  }
};

// 随机日志内容
const logMessages = ["启动数据同步任务", "连接数据库成功", "开始读取源数据", "处理第1批数据中...", "验证数据完整性", "应用业务规则转换", "写入目标系统", "处理数据关联关系", "更新索引", "同步完成，总计处理1000条记录"];

// 添加随机日志
const addRandomLog = () => {
  if (processRef.value) {
    const randomIndex = Math.floor(Math.random() * logMessages.length);
    const randomMessage = logMessages[randomIndex];
    const randomStep = Math.floor(Math.random() * 11) - 5; // -5到5的随机步骤
    const total = 10;
    const randomPercentage = Math.floor((randomStep / total) * 100);
    const randomStatus = randomStep === total ? "success" : "processing";

    // 按照ProgressData格式构建数据
    const progressData = {
      message: randomMessage,
      step: randomStep,
      total: total,
      percentage: randomPercentage,
      status: randomStatus,
      eventId: eventId.value,
    };

    // 更新进度
    processRef.value.updateProgress(progressData);

    // 如果是日志布局，确保滚动到底部
    if (layout.value === "log") {
      setTimeout(() => {
        const logContainer = document.querySelector(".log-container");
        if (logContainer) {
          logContainer.scrollTop = logContainer.scrollHeight;
        }
      }, 50);
    }
  }
};

// 生成代码示例
const codeExample = computed(() => {
  let code = `<template>
  <div>
    <ScSocketEventProcess
      eventId="${eventId.value}"
      title="${title.value}"
      ${layout.value !== "process" ? `layout="${layout.value}"` : ""}
      ${dataType.value !== "socket" ? `dataType="${dataType.value}"` : ""}
      ${layout.value === "log" && height.value !== 200 ? `height="${height.value}"` : ""}
      ${eventName.value !== "progress-event" ? `eventName="${eventName.value}"` : ""}
      ref="processRef"
    />
    
    <!-- 示例: 手动更新进度 -->
    <el-button @click="updateProgress">更新进度</el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ScSocketEventProcess from "@repo/components/ScSocketEventProcess/index.vue";

// 组件引用
const processRef = ref(null);

// 手动更新进度示例
const updateProgress = () => {
  if (processRef.value) {
    processRef.value.updateProgress({
      message: "正在处理中...",
      percentage: 75,
      status: "processing",
      step: 3,
      total: 4
    });
  }
};
<\/script>`;

  return code;
});
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
  color: #909399;
  margin: 0;
}

.preview-area,
.config-panel,
.code-example {
  margin-bottom: 20px;
}

h4 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  color: #303133;
}

.preview-container {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: var(--el-bg-color);
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.w-100 {
  width: 100%;
}

.mt-4 {
  margin-top: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}

pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
}

code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  color: #333;
}

.code-desc {
  margin-bottom: 8px;
}

.height-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  text-align: center;
}
</style>

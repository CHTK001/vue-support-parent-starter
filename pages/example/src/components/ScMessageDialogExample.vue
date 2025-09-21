<template>
  <div class="sc-message-dialog-example">
    <div class="example-header">
      <h2>ScMessageDialog 组件示例</h2>
      <p>实时消息对话框组件，支持多种位置、样式配置和交互功能</p>
    </div>

    <div class="example-section">
      <h3>基础用法</h3>
      <div class="button-group">
        <el-button type="primary" @click="showBasicDialog">基础对话框</el-button>
        <el-button type="success" @click="showAutoExpandDialog">自动展开对话框</el-button>
        <el-button type="warning" @click="showProgressDialog">进度条对话框</el-button>
      </div>
      <div class="button-group">
        <el-button type="info" @click="showUniqueProgressDialog">唯一进度条演示</el-button>
        <el-button type="primary" @click="showMarkdownDialog">Markdown解析演示</el-button>
      </div>
      <div class="button-group">
        <el-switch v-model="enableMarkdownParsing" active-text="启用Markdown解析" inactive-text="禁用Markdown解析" style="margin-right: 20px" />
      </div>
    </div>

    <div class="example-section">
      <h3>位置控制</h3>
      <div class="demo-buttons">
        <el-button @click="showPositionDialog('top-left')">左上角</el-button>
        <el-button @click="showPositionDialog('top-right')">右上角</el-button>
        <el-button @click="showPositionDialog('bottom-left')">左下角</el-button>
        <el-button @click="showPositionDialog('bottom-right')">右下角</el-button>
      </div>
    </div>

    <div class="example-section">
      <h3>样式配置</h3>
      <div class="demo-buttons">
        <el-button @click="showStyledDialog('small')">小尺寸</el-button>
        <el-button @click="showStyledDialog('medium')">中等尺寸</el-button>
        <el-button @click="showStyledDialog('large')">大尺寸</el-button>
        <el-button @click="showTransparentDialog">半透明</el-button>
      </div>
    </div>

    <div class="example-section">
      <h3>交互功能</h3>
      <div class="demo-buttons">
        <el-button @click="startRealTimeDemo">实时消息演示</el-button>
        <el-button @click="showTemplateDialog">模板消息</el-button>
        <el-button @click="clearAllMessages">清空所有消息</el-button>
      </div>
    </div>

    <!-- 基础对话框 -->
    <ScMessageDialog :visible="basicVisible" title="基础消息对话框" :data="basicMessages" position="top-right" width="400px" height="300px" @close="basicVisible = false" />

    <!-- 自动展开对话框 -->
    <ScMessageDialog :visible="autoExpandVisible" title="自动展开对话框" :data="autoExpandMessages" position="bottom-right" width="450px" height="350px" :auto-expand="true" :auto-scroll="true" @close="autoExpandVisible = false" />

    <!-- 进度条对话框 -->
    <ScMessageDialog :visible="progressVisible" title="进度监控" :data="progressMessages" position="top-left" width="500px" height="400px" :show-progress="true" @close="progressVisible = false" />

    <!-- 唯一进度条演示 -->
    <ScMessageDialog :visible="uniqueProgressVisible" title="唯一进度条演示" :data="uniqueProgressData" position="bottom-left" width="400px" height="300px" :progress-unique="true" @close="uniqueProgressVisible = false" />

    <!-- Markdown解析演示 -->
    <ScMessageDialog :visible="markdownVisible" title="Markdown解析演示" :markdown-content="markdownContent" position="top-right" width="500px" height="400px" :enable-markdown="enableMarkdownParsing" @close="markdownVisible = false" />

    <!-- 位置演示对话框 -->
    <ScMessageDialog :visible="positionVisible" title="位置演示" :data="positionMessages" :position="currentPosition" width="350px" height="250px" @close="positionVisible = false" />

    <!-- 样式演示对话框 -->
    <ScMessageDialog :visible="styledVisible" title="样式演示" :data="styledMessages" position="bottom-left" :width="styledWidth" :height="styledHeight" :opacity="styledOpacity" @close="styledVisible = false" />

    <!-- 实时消息对话框 -->
    <ScMessageDialog :visible="realTimeVisible" title="实时消息监控" :data="realTimeMessages" position="top-right" width="500px" height="450px" :auto-expand="true" :auto-scroll="true" :show-progress="true" @close="stopRealTimeDemo" />

    <!-- 模板消息对话框 -->
    <ScMessageDialog :visible="templateVisible" title="模板消息" :data="templateMessages" position="bottom-right" width="600px" height="400px" @close="templateVisible = false">
      <template #message="{ message }">
        <div class="custom-message">
          <div class="message-header">
            <span class="message-type" :class="`type-${message.type}`">{{ getTypeLabel(message.type) }}</span>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-content" v-html="message.content"></div>
          <div class="message-progress" v-if="message.progress !== undefined">
            <el-progress :percentage="message.progress" :status="getProgressStatus(message.progress)" />
          </div>
        </div>
      </template>
    </ScMessageDialog>
  </div>
</template>

<script setup>
import { ScMessageDialog } from "@repo/components";
import { ElButton, ElProgress } from "element-plus";
import { onUnmounted, ref } from "vue";

// 基础对话框
const basicVisible = ref(false);
const basicMessages = ref([
  {
    id: "1",
    type: "info",
    content: "这是一条基础信息消息",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    type: "success",
    content: "操作执行成功！",
    timestamp: new Date().toISOString(),
  },
  {
    id: "3",
    type: "warning",
    content: "请注意：这是一条警告消息",
    timestamp: new Date().toISOString(),
  },
]);

// 自动展开对话框
const autoExpandVisible = ref(false);
const autoExpandMessages = ref([
  {
    id: "1",
    type: "info",
    content: "自动展开功能已启用",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    type: "success",
    content: "消息将自动滚动到最新位置",
    timestamp: new Date().toISOString(),
  },
]);

// 进度条对话框
const progressVisible = ref(false);
const progressMessages = ref([
  {
    id: "1",
    type: "info",
    content: "开始执行任务...",
    timestamp: new Date().toISOString(),
    progress: 0,
  },
  {
    id: "2",
    type: "info",
    content: "正在处理数据...",
    timestamp: new Date().toISOString(),
    progress: 45,
  },
  {
    id: "3",
    type: "success",
    content: "任务执行完成！",
    timestamp: new Date().toISOString(),
    progress: 100,
  },
]);

// 位置演示
const positionVisible = ref(false);
const currentPosition = ref("top-right");
const positionMessages = ref([]);

// 样式演示
const styledVisible = ref(false);
const styledWidth = ref("400px");
const styledHeight = ref("300px");
const styledOpacity = ref(1);
const styledMessages = ref([]);

// 实时消息
const realTimeVisible = ref(false);
const realTimeMessages = ref([]);
let realTimeTimer = null;
let messageCounter = 0;

// 模板消息
const templateVisible = ref(false);
const templateMessages = ref([
  {
    id: "1",
    type: "info",
    content: "<strong>系统通知：</strong>这是一条使用自定义模板的消息",
    timestamp: new Date().toISOString(),
    progress: 30,
  },
  {
    id: "2",
    type: "error",
    content: "<strong>错误：</strong>连接超时，正在重试...",
    timestamp: new Date().toISOString(),
  },
  {
    id: "3",
    type: "success",
    content: "<strong>成功：</strong>数据同步完成",
    timestamp: new Date().toISOString(),
    progress: 100,
  },
]);

// 唯一进度条演示
const uniqueProgressVisible = ref(false);
const uniqueProgressData = ref([
  {
    id: "1",
    type: "info",
    content: "任务1开始执行",
    timestamp: new Date().toISOString(),
    progress: 25,
  },
  {
    id: "2",
    type: "info",
    content: "任务2开始执行",
    timestamp: new Date().toISOString(),
    progress: 50,
  },
  {
    id: "3",
    type: "success",
    content: "所有任务完成",
    timestamp: new Date().toISOString(),
    progress: 100,
  },
]);

// Markdown解析演示
const markdownVisible = ref(false);
const enableMarkdownParsing = ref(true);
const markdownContent = ref(`# Markdown 演示

这是一个 **Markdown** 解析演示。

## 功能特性

- 支持 *斜体* 和 **粗体**
- 支持 [链接](https://example.com)
- 支持代码块：\`console.log('Hello World')\`

### 列表示例

1. 第一项
2. 第二项
3. 第三项

> 这是一个引用块

\`\`\`javascript
function hello() {
  console.log('Hello, Markdown!');
}
\`\`\``);

/**
 * 显示基础对话框
 */
const showBasicDialog = () => {
  basicVisible.value = true;
};

/**
 * 显示自动展开对话框
 */
const showAutoExpandDialog = () => {
  autoExpandVisible.value = true;
  // 模拟新消息添加
  setTimeout(() => {
    if (autoExpandVisible.value) {
      autoExpandMessages.value.push({
        id: Date.now().toString(),
        type: "info",
        content: "这是一条新添加的消息",
        timestamp: new Date().toISOString(),
      });
    }
  }, 2000);
};

/**
 * 显示进度条对话框
 */
const showProgressDialog = () => {
  progressVisible.value = true;
};

/**
 * 显示位置演示对话框
 */
const showPositionDialog = (position) => {
  currentPosition.value = position;
  positionMessages.value = [
    {
      id: "1",
      type: "info",
      content: `当前位置：${position}`,
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      type: "success",
      content: "位置设置成功！",
      timestamp: new Date().toISOString(),
    },
  ];
  positionVisible.value = true;
};

/**
 * 显示样式演示对话框
 */
const showStyledDialog = (size) => {
  const sizeConfig = {
    small: { width: "300px", height: "200px", opacity: 1 },
    medium: { width: "450px", height: "350px", opacity: 1 },
    large: { width: "600px", height: "500px", opacity: 1 },
  };

  const config = sizeConfig[size];
  styledWidth.value = config.width;
  styledHeight.value = config.height;
  styledOpacity.value = config.opacity;

  styledMessages.value = [
    {
      id: "1",
      type: "info",
      content: `当前尺寸：${size}`,
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      type: "info",
      content: `宽度：${config.width}，高度：${config.height}`,
      timestamp: new Date().toISOString(),
    },
  ];
  styledVisible.value = true;
};

/**
 * 显示半透明对话框
 */
const showTransparentDialog = () => {
  styledWidth.value = "400px";
  styledHeight.value = "300px";
  styledOpacity.value = 0.8;

  styledMessages.value = [
    {
      id: "1",
      type: "info",
      content: "半透明效果演示",
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      type: "info",
      content: "透明度：80%",
      timestamp: new Date().toISOString(),
    },
  ];
  styledVisible.value = true;
};

/**
 * 开始实时消息演示
 */
const startRealTimeDemo = () => {
  realTimeVisible.value = true;
  realTimeMessages.value = [
    {
      id: "1",
      type: "info",
      content: "开始实时消息演示...",
      timestamp: new Date().toISOString(),
    },
  ];

  messageCounter = 1;
  realTimeTimer = setInterval(() => {
    if (realTimeVisible.value && messageCounter < 20) {
      messageCounter++;
      const types = ["info", "success", "warning", "error"];
      const type = types[Math.floor(Math.random() * types.length)];
      const progress = messageCounter <= 10 ? messageCounter * 10 : undefined;

      realTimeMessages.value.push({
        id: Date.now().toString(),
        type,
        content: `实时消息 #${messageCounter}：${getRandomMessage()}`,
        timestamp: new Date().toISOString(),
        progress,
      });

      // 限制消息数量
      if (realTimeMessages.value.length > 50) {
        realTimeMessages.value = realTimeMessages.value.slice(-50);
      }
    } else if (messageCounter >= 20) {
      stopRealTimeDemo();
    }
  }, 1000);
};

/**
 * 停止实时消息演示
 */
const stopRealTimeDemo = () => {
  realTimeVisible.value = false;
  if (realTimeTimer) {
    clearInterval(realTimeTimer);
    realTimeTimer = null;
  }
};

/**
 * 显示模板消息对话框
 */
const showTemplateDialog = () => {
  templateVisible.value = true;
};

/**
 * 显示唯一进度条演示
 */
const showUniqueProgressDialog = () => {
  uniqueProgressVisible.value = true;
};

/**
 * 显示Markdown解析演示
 */
const showMarkdownDialog = () => {
  markdownVisible.value = true;
};

/**
 * 清空所有消息
 */
const clearAllMessages = () => {
  basicMessages.value = [];
  autoExpandMessages.value = [];
  progressMessages.value = [];
  positionMessages.value = [];
  styledMessages.value = [];
  realTimeMessages.value = [];
  templateMessages.value = [];
  uniqueProgressData.value = [];
};

/**
 * 获取随机消息内容
 */
const getRandomMessage = () => {
  const messages = ["数据同步中...", "处理用户请求", "更新配置信息", "执行定时任务", "检查系统状态", "备份数据库", "清理临时文件", "发送通知邮件"];
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * 获取类型标签
 */
const getTypeLabel = (type) => {
  const labels = {
    info: "信息",
    success: "成功",
    warning: "警告",
    error: "错误",
  };
  return labels[type] || type;
};

/**
 * 格式化时间
 */
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString();
};

/**
 * 获取进度条状态
 */
const getProgressStatus = (progress) => {
  if (progress === 100) return "success";
  if (progress >= 80) return "warning";
  return undefined;
};

// 组件卸载时清理定时器
onUnmounted(() => {
  if (realTimeTimer) {
    clearInterval(realTimeTimer);
  }
});
</script>

<style scoped>
.sc-message-dialog-example {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--el-text-color-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.example-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.example-header p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.example-section {
  margin-bottom: 32px;
  padding: 24px;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
}

.example-section h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.demo-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.demo-buttons .el-button {
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.demo-buttons .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 自定义消息模板样式 */
.custom-message {
  padding: 12px;
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  border-left: 4px solid #007bff;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-info {
  background: #e3f2fd;
  color: #1976d2;
}

.type-success {
  background: #e8f5e8;
  color: #2e7d32;
}

.type-warning {
  background: #fff3e0;
  color: #f57c00;
}

.type-error {
  background: #ffebee;
  color: #d32f2f;
}

.message-time {
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.message-content {
  margin-bottom: 8px;
  line-height: 1.5;
}

.message-progress {
  margin-top: 8px;
}
</style>

<template>
  <div class="example-container">
    <h2 class="example-title">ScMessageDialog 消息对话框示例</h2>
    <p class="example-desc">
      用于显示操作进度、消息通知等，支持 interact.js 拖拽功能
    </p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="showDialog">
          <IconifyIconOnline icon="ri:message-3-line" class="mr-1" />
          显示对话框
        </el-button>
        <el-button @click="addOperation">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          添加操作
        </el-button>
        <el-button @click="simulateProgress" :disabled="!hasRunningOp">
          <IconifyIconOnline icon="ri:play-line" class="mr-1" />
          模拟进度
        </el-button>
        <el-button type="danger" plain @click="clearOperations">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清空
        </el-button>
      </div>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="100px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="位置">
              <el-select v-model="config.position" style="width: 100%">
                <el-option label="右下角" value="bottom-right" />
                <el-option label="左下角" value="bottom-left" />
                <el-option label="右上角" value="top-right" />
                <el-option label="左上角" value="top-left" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="主题色">
              <el-color-picker v-model="config.themeColor" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="标题">
              <el-input v-model="config.title" placeholder="对话框标题" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-divider content-position="left">代码示例</el-divider>

    <CodePreview :tabs="codeTabs" />

    <el-divider content-position="left">属性说明</el-divider>

    <el-table :data="propsData" border stripe class="props-table">
      <el-table-column prop="name" label="属性名" width="150" />
      <el-table-column prop="type" label="类型" width="200" />
      <el-table-column prop="default" label="默认值" width="150" />
      <el-table-column prop="description" label="说明" />
    </el-table>

    <!-- ScMessageDialog 组件实例 -->
    <ScMessageDialog
      ref="dialogRef"
      :title="config.title"
      :icon="config.icon"
      :position="config.position"
      :theme-color="config.themeColor"
      :operations="operations"
      @clear="handleClear"
      @close="handleDialogClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { message } from "@repo/utils";
import ScMessageDialog from "@repo/components/ScMessageDialog/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScMessageDialog 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

interface Operation {
  id: string;
  type: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  createdAt?: number;
}

const dialogRef = ref();
const operations = ref<Operation[]>([]);
let opId = 0;

const config = reactive({
  title: "操作监控",
  icon: "ri:terminal-box-line",
  position: "bottom-right" as const,
  themeColor: "#3b82f6",
});

// 属性说明
const propsData = [
  {
    name: "title",
    type: "string",
    default: "'操作监控'",
    description: "对话框标题",
  },
  {
    name: "icon",
    type: "string",
    default: "'ri:terminal-box-line'",
    description: "标题图标",
  },
  {
    name: "position",
    type: "'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'",
    default: "'bottom-right'",
    description: "初始位置（四个角落）",
  },
  {
    name: "themeColor",
    type: "string",
    default: "'#3b82f6'",
    description: "主题色",
  },
  {
    name: "operations",
    type: "Operation[]",
    default: "[]",
    description: "操作列表",
  },
  {
    name: "emptyText",
    type: "string",
    default: "'暂无操作'",
    description: "空状态文本",
  },
];

const hasRunningOp = computed(() =>
  operations.value.some((op) => op.status === "running")
);

// 代码示例标签页
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScMessageDialog
  ref="dialogRef"
  title="${config.title}"
  icon="${config.icon}"
  position="${config.position}"
  theme-color="${config.themeColor}"
  :operations="operations"
  @clear="handleClear"
  @close="handleClose"
/>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScMessageDialog from "@repo/components/ScMessageDialog/index.vue";

const dialogRef = ref();
const operations = ref([]);

// 显示对话框
function showDialog() {
  dialogRef.value?.show();
}

// 添加操作
function addOperation() {
  operations.value.push({
    id: \`op-\${Date.now()}\`,
    type: "download",
    title: "下载任务",
    description: "正在下载文件...",
    status: "running",
    progress: 0
  });
}

// 处理清除
function handleClear() {
  operations.value = operations.value.filter(
    op => op.status === "pending" || op.status === "running"
  );
}

// 处理关闭
function handleClose() {
  console.log("对话框已关闭");
}`,
  },
]);

function showDialog() {
  dialogRef.value?.show();
}

function addOperation() {
  const types = ["upload", "download", "build", "create", "start", "stop"];
  const type = types[Math.floor(Math.random() * types.length)];

  operations.value.push({
    id: `op-${++opId}`,
    type,
    title: `${type} 操作 #${opId}`,
    description: `这是一个 ${type} 类型的操作示例`,
    status: "running",
    progress: 0,
    createdAt: Date.now(),
  });

  message("已添加新操作", { type: "success" });
}

function simulateProgress() {
  const runningOps = operations.value.filter((op) => op.status === "running");
  if (runningOps.length === 0) return;

  runningOps.forEach((op) => {
    const interval = setInterval(() => {
      const idx = operations.value.findIndex((o) => o.id === op.id);
      if (idx === -1) {
        clearInterval(interval);
        return;
      }

      const current = operations.value[idx];
      const newProgress =
        (current.progress || 0) + Math.floor(Math.random() * 20) + 5;

      if (newProgress >= 100) {
        operations.value[idx] = {
          ...current,
          progress: 100,
          status: "completed",
        };
        clearInterval(interval);
        message(`操作 ${current.title} 完成`, { type: "success" });
      } else {
        operations.value[idx] = { ...current, progress: newProgress };
      }
    }, 500);
  });
}

function clearOperations() {
  operations.value = [];
  message("已清空所有操作", { type: "info" });
}

function handleClear() {
  operations.value = operations.value.filter(
    (op) => op.status === "pending" || op.status === "running"
  );
  message("已清除已完成的操作", { type: "success" });
}

function handleDialogClose() {
  message("对话框已关闭", { type: "info" });
}
</script>

<style scoped lang="scss">
.example-container {
  padding: 20px;
}

.example-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.example-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.demo-section {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.demo-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>

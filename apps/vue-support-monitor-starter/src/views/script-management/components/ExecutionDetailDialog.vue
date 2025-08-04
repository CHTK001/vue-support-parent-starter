<template>
  <el-dialog
    v-model="visible"
    title="执行详情"
    width="80%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="executionData" class="execution-detail">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h4>基本信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="执行ID">
            {{ executionData.id }}
          </el-descriptions-item>
          <el-descriptions-item label="脚本名称">
            {{ executionData.scriptName }}
          </el-descriptions-item>
          <el-descriptions-item label="执行状态">
            <el-tag :type="getStatusTagType(executionData.status)">
              <IconifyIconOnline :icon="getStatusIcon(executionData.status)" />
              {{ getStatusText(executionData.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="退出码">
            <span :class="getExitCodeClass(executionData.exitCode)">
              {{ executionData.exitCode ?? "无" }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatTime(executionData.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间">
            {{ formatTime(executionData.endTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="执行耗时">
            {{ formatDuration(executionData.duration) }}
          </el-descriptions-item>
          <el-descriptions-item label="执行人">
            {{ executionData.executor || "系统" }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 输出信息 -->
      <div class="detail-section">
        <h4>输出信息</h4>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="标准输出" name="stdout">
            <div class="output-container">
              <div class="output-toolbar">
                <el-button size="small" @click="copyOutput('stdout')">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                  复制
                </el-button>
                <el-button size="small" @click="downloadOutput('stdout')">
                  <IconifyIconOnline icon="ri:download-line" />
                  下载
                </el-button>
              </div>
              <div class="output-content">
                <pre v-if="executionData.stdout">{{
                  executionData.stdout
                }}</pre>
                <div v-else class="no-output">暂无标准输出</div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="错误输出" name="stderr">
            <div class="output-container">
              <div class="output-toolbar">
                <el-button size="small" @click="copyOutput('stderr')">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                  复制
                </el-button>
                <el-button size="small" @click="downloadOutput('stderr')">
                  <IconifyIconOnline icon="ri:download-line" />
                  下载
                </el-button>
              </div>
              <div class="output-content error">
                <pre v-if="executionData.stderr">{{
                  executionData.stderr
                }}</pre>
                <div v-else class="no-output">暂无错误输出</div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="executionData?.status === 'running'"
          type="danger"
          @click="handleStop"
        >
          停止执行
        </el-button>
        <el-button type="primary" @click="handleRerun"> 重新执行 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";

// Props
interface Props {
  modelValue: boolean;
  executionData?: any;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

// 响应式数据
const visible = ref(false);
const activeTab = ref("stdout");

// 监听器
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  }
);

watch(visible, (val) => {
  emit("update:modelValue", val);
});

// 方法
const handleClose = () => {
  visible.value = false;
};

const handleStop = () => {
  ElMessage.info("停止执行功能开发中");
};

const handleRerun = () => {
  ElMessage.info("重新执行功能开发中");
};

const copyOutput = async (type: "stdout" | "stderr") => {
  const content = props.executionData?.[type];
  if (!content) {
    ElMessage.warning("暂无内容可复制");
    return;
  }

  try {
    await navigator.clipboard.writeText(content);
    ElMessage.success("内容已复制到剪贴板");
  } catch (error) {
    ElMessage.error("复制失败");
  }
};

const downloadOutput = (type: "stdout" | "stderr") => {
  const content = props.executionData?.[type];
  if (!content) {
    ElMessage.warning("暂无内容可下载");
    return;
  }

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${props.executionData.scriptName}_${type}_${Date.now()}.txt`;
  link.click();
  URL.revokeObjectURL(url);

  ElMessage.success("下载成功");
};

// 工具函数
const formatTime = (date: Date | null) => {
  return date ? date.toLocaleString() : "无";
};

const formatDuration = (duration: number | null) => {
  if (!duration) return "无";

  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m${seconds}s`;
  }
};

const getStatusTagType = (status: string) => {
  const typeMap = {
    success: "success",
    failed: "danger",
    running: "warning",
    cancelled: "info",
  };
  return typeMap[status] || "default";
};

const getStatusIcon = (status: string) => {
  const iconMap = {
    success: "ri:check-line",
    failed: "ri:close-line",
    running: "ri:loader-line",
    cancelled: "ri:stop-line",
  };
  return iconMap[status] || "ri:question-line";
};

const getStatusText = (status: string) => {
  const textMap = {
    success: "执行成功",
    failed: "执行失败",
    running: "执行中",
    cancelled: "已取消",
  };
  return textMap[status] || "未知状态";
};

const getExitCodeClass = (exitCode: number | null) => {
  if (exitCode === null || exitCode === undefined) return "";
  return exitCode === 0 ? "exit-code-success" : "exit-code-error";
};
</script>

<style scoped lang="scss">
// 样式与之前的设计保持一致
.execution-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;

  h4 {
    margin: 0 0 16px 0;
    color: #111827;
    font-size: 16px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 8px;
  }
}

.exit-code-success {
  color: #059669;
  font-weight: 600;
}

.exit-code-error {
  color: #dc2626;
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// 其他样式省略
</style>

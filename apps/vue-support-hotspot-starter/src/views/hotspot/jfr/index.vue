<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { http } from "@repo/utils";
import { wsService } from "@/utils/websocket";

const loading = ref(false);
const recordings = ref<any[]>([]);
const status = ref<any>({});
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let unsubscribeStatus: (() => void) | null = null;
let unsubscribeStarted: (() => void) | null = null;
let unsubscribeStopped: (() => void) | null = null;

// WebSocket 连接状态
const wsConnected = computed(() => wsService.connected.value);

// 新建录制对话框
const showNewRecordingDialog = ref(false);
const newRecordingForm = reactive({
  name: "",
  duration: 60,
  maxSize: 100,
  preset: "default"
});

// 导出对话框
const showExportDialog = ref(false);
const exportForm = reactive({
  recordingId: 0,
  filename: "",
  recordingName: ""
});

// 预设配置
const presets = [
  { value: "default", label: "默认配置", duration: 60, maxSize: 100, desc: "通用性能分析" },
  { value: "short", label: "快速采样", duration: 30, maxSize: 50, desc: "快速问题定位" },
  { value: "long", label: "长时录制", duration: 300, maxSize: 500, desc: "深度性能分析" },
  { value: "continuous", label: "持续录制", duration: 0, maxSize: 200, desc: "无限时录制，手动停止" }
];

// API 基础路径
const apiBase = computed(() => (window.agentPath || "/agent") + "/api/jfr");

// 处理 WebSocket 状态更新
const handleStatusMessage = (message: any) => {
  if (message.event === "JFR_STATUS" && message.data) {
    const data = message.data;
    status.value = {
      available: data.available,
      activeRecordings: data.activeRecordings,
      runningRecordings: data.runningRecordings,
      stoppedRecordings: data.stoppedRecordings
    };
    if (data.recordings) {
      recordings.value = data.recordings;
    }
  }
};

// 处理录制启动事件
const handleStartedMessage = (message: any) => {
  if (message.event === "JFR_STARTED" && message.data) {
    ElMessage.success(`录制已启动: ${message.data.name}`);
  }
};

// 处理录制停止事件
const handleStoppedMessage = (message: any) => {
  if (message.event === "JFR_STOPPED" && message.data) {
    ElMessage.info(`录制已停止: ${message.data.name}`);
  }
};

// 获取JFR状态
const fetchStatus = async () => {
  try {
    const res = await http.get(apiBase.value + "?action=status");
    status.value = res || {};
  } catch (error) {
    console.error("获取JFR状态失败:", error);
  }
};

// 获取录制列表
const fetchRecordings = async () => {
  loading.value = true;
  try {
    const res = await http.get(apiBase.value + "?action=list");
    recordings.value = res?.recordings || [];
  } catch (error) {
    ElMessage.error("获取JFR录制列表失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 打开新建录制对话框
const openNewRecordingDialog = () => {
  newRecordingForm.name = `recording-${Date.now()}`;
  newRecordingForm.duration = 60;
  newRecordingForm.maxSize = 100;
  newRecordingForm.preset = "default";
  showNewRecordingDialog.value = true;
};

// 预设改变
const onPresetChange = (presetValue: string) => {
  const preset = presets.find(p => p.value === presetValue);
  if (preset) {
    newRecordingForm.duration = preset.duration;
    newRecordingForm.maxSize = preset.maxSize;
  }
};

// 开始录制
const startRecording = async () => {
  try {
    const params = new URLSearchParams();
    params.append("action", "start");
    params.append("name", newRecordingForm.name);
    if (newRecordingForm.duration > 0) {
      params.append("duration", String(newRecordingForm.duration));
    }
    if (newRecordingForm.maxSize > 0) {
      params.append("maxSize", String(newRecordingForm.maxSize));
    }

    const res = await http.get(apiBase.value + "?" + params.toString());
    if (res?.success) {
      ElMessage.success(`JFR录制已开始: ${newRecordingForm.name}`);
      showNewRecordingDialog.value = false;
      refreshAll();
    } else {
      ElMessage.error(res?.error || "开始录制失败");
    }
  } catch (error) {
    ElMessage.error("开始录制失败");
    console.error(error);
  }
};

// 停止录制
const stopRecording = async (recordingId: number) => {
  try {
    const res = await http.get(apiBase.value + `?action=stop&recordingId=${recordingId}`);
    if (res?.success) {
      ElMessage.success("录制已停止");
      refreshAll();
    } else {
      ElMessage.error(res?.error || "停止录制失败");
    }
  } catch (error) {
    ElMessage.error("停止录制失败");
    console.error(error);
  }
};

// 打开导出对话框
const openExportDialog = (row: any) => {
  exportForm.recordingId = row.recordingId;
  exportForm.recordingName = row.name;
  exportForm.filename = `${row.name}-${Date.now()}.jfr`;
  showExportDialog.value = true;
};

// 导出录制文件（保存到服务器）
const exportRecording = async () => {
  try {
    const params = new URLSearchParams();
    params.append("action", "dump");
    params.append("recordingId", String(exportForm.recordingId));
    if (exportForm.filename) {
      params.append("filename", exportForm.filename);
    }

    const res = await http.get(apiBase.value + "?" + params.toString());
    if (res?.success) {
      ElMessage.success(`录制文件已导出到服务器: ${res.filename}`);
      showExportDialog.value = false;
      refreshAll();
    } else {
      ElMessage.error(res?.error || "导出失败");
    }
  } catch (error) {
    ElMessage.error("导出录制失败");
    console.error(error);
  }
};

// 快速导出（不弹窗）
const quickExport = async (row: any) => {
  try {
    const params = new URLSearchParams();
    params.append("action", "dump");
    params.append("recordingId", String(row.recordingId));

    const res = await http.get(apiBase.value + "?" + params.toString());
    if (res?.success) {
      ElMessage.success(`文件已导出: ${res.filename}`);
    } else {
      ElMessage.error(res?.error || "导出失败");
    }
  } catch (error) {
    ElMessage.error("导出失败");
    console.error(error);
  }
};

// 删除录制（从内存中移除）
const deleteRecording = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除录制 "${row.name}" 吗？此操作将从内存中移除该录制，未导出的数据将丢失。`, "删除确认", { type: "warning" });
    // 先停止再从列表中移除
    if (row.state === "RUNNING") {
      await http.get(apiBase.value + `?action=stop&recordingId=${row.recordingId}`);
    }
    // 前端移除
    recordings.value = recordings.value.filter(r => r.recordingId !== row.recordingId);
    ElMessage.success("录制已删除");
    fetchStatus();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

// 格式化时间
const formatDuration = (seconds: number | null) => {
  if (!seconds || seconds === 0) return "无限制";
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
  return `${Math.floor(seconds / 3600)}时${Math.floor((seconds % 3600) / 60)}分`;
};

// 格式化大小
const formatSize = (bytes: number | null) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
};

// 获取状态颜色
const getStateType = (state: string) => {
  switch (state) {
    case "RUNNING":
      return "success";
    case "STOPPED":
      return "info";
    case "CLOSED":
      return "danger";
    default:
      return "info";
  }
};

// 获取状态文字
const getStateText = (state: string) => {
  switch (state) {
    case "RUNNING":
      return "录制中";
    case "STOPPED":
      return "已停止";
    case "CLOSED":
      return "已关闭";
    case "NEW":
      return "新建";
    default:
      return state;
  }
};

// 刷新所有数据
const refreshAll = () => {
  fetchStatus();
  fetchRecordings();
};

onMounted(() => {
  refreshAll();

  // 连接 WebSocket
  wsService.connect();

  // 订阅 JFR 状态更新
  unsubscribeStatus = wsService.subscribe("JFR", "JFR_STATUS", handleStatusMessage);
  unsubscribeStarted = wsService.subscribe("JFR", "JFR_STARTED", handleStartedMessage);
  unsubscribeStopped = wsService.subscribe("JFR", "JFR_STOPPED", handleStoppedMessage);

  // 每30秒刷新一次（作为 WebSocket 的备份）
  refreshTimer = setInterval(refreshAll, 30000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  // 取消 WebSocket 订阅
  if (unsubscribeStatus) unsubscribeStatus();
  if (unsubscribeStarted) unsubscribeStarted();
  if (unsubscribeStopped) unsubscribeStopped();
});
</script>

<template>
  <div class="page-container">
    <!-- 关键指标卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper success">
              <IconifyIconOnline icon="ri:record-circle-fill" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ status.runningRecordings || 0 }}</div>
              <div class="stat-label">录制中</div>
              <div class="stat-detail">活跃录制数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper info">
              <IconifyIconOnline icon="ri:stop-circle-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ status.stoppedRecordings || 0 }}</div>
              <div class="stat-label">已停止</div>
              <div class="stat-detail">可导出录制</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper primary">
              <IconifyIconOnline icon="ri:list-check-2" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ status.activeRecordings || 0 }}</div>
              <div class="stat-label">录制总数</div>
              <div class="stat-detail">所有录制任务</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon-wrapper" :class="status.available ? 'success' : 'danger'">
              <IconifyIconOnline icon="ri:checkbox-circle-line" class="stat-icon" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ status.available ? "JFR可用" : "不可用" }}</div>
              <div class="stat-label">JFR 状态</div>
              <div class="stat-detail">Java 11+</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 录制列表卡片 -->
    <el-card class="modern-card recordings-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:list-check-2" class="card-icon" />
            录制列表
          </span>
        </div>
      </template>
      <el-table v-loading="loading" :data="recordings" stripe class="modern-table" max-height="400">
        <el-table-column prop="recordingId" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="名称" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <IconifyIconOnline :icon="row.state === 'RUNNING' ? 'ri:record-circle-fill' : 'ri:file-chart-line'" :class="row.state === 'RUNNING' ? 'recording-icon' : 'text-primary'" />
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="state" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStateType(row.state)" effect="light">
              {{ getStateText(row.state) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="100" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column prop="maxSize" label="最大大小" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.maxSize">{{ formatSize(row.maxSize) }}</span>
            <span v-else class="text-placeholder">无限制</span>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="当前大小" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.size" type="info" effect="plain" size="small">
              {{ formatSize(row.size) }}
            </el-tag>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button v-if="row.state === 'RUNNING'" type="warning" size="small" @click="stopRecording(row.recordingId)">
                <IconifyIconOnline icon="ri:stop-circle-line" />
                停止
              </el-button>
              <el-button v-if="row.state === 'STOPPED'" type="primary" size="small" @click="quickExport(row)">
                <IconifyIconOnline icon="ri:download-line" />
                快速导出
              </el-button>
              <el-button v-if="row.state === 'STOPPED'" type="success" size="small" @click="openExportDialog(row)">
                <IconifyIconOnline icon="ri:save-line" />
                自定义导出
              </el-button>
              <el-button type="danger" size="small" @click="deleteRecording(row)">
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="recordings.length === 0" description="暂无录制记录，点击【新建录制】开始" />
    </el-card>

    <!-- 使用说明卡片 -->
    <el-card class="modern-card info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <IconifyIconOnline icon="ri:question-line" class="card-icon" />
            使用说明
          </span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-alert type="info" :closable="false" show-icon>
            <template #title><span class="alert-title">1. 创建录制</span></template>
            <template #default>
              <p class="alert-content">点击【新建录制】，选择预设配置或自定义参数，开始性能数据采集</p>
            </template>
          </el-alert>
        </el-col>
        <el-col :span="8">
          <el-alert type="success" :closable="false" show-icon>
            <template #title><span class="alert-title">2. 导出文件</span></template>
            <template #default>
              <p class="alert-content">录制完成后点击【导出】，将 .jfr 文件保存到服务器指定位置</p>
            </template>
          </el-alert>
        </el-col>
        <el-col :span="8">
          <el-alert type="warning" :closable="false" show-icon>
            <template #title><span class="alert-title">3. 分析数据</span></template>
            <template #default>
              <p class="alert-content">使用 JDK Mission Control 或 VisualVM 打开 .jfr 文件进行分析</p>
            </template>
          </el-alert>
        </el-col>
      </el-row>
    </el-card>

    <!-- 新建录制对话框 -->
    <sc-dialog v-model="showNewRecordingDialog" title="新建 JFR 录制" width="520px">
      <el-form :model="newRecordingForm" label-width="100px">
        <el-form-item label="录制名称">
          <el-input v-model="newRecordingForm.name" placeholder="请输入录制名称" />
        </el-form-item>
        <el-form-item label="预设配置">
          <el-select v-model="newRecordingForm.preset" style="width: 100%" @change="onPresetChange">
            <el-option v-for="p in presets" :key="p.value" :value="p.value" :label="p.label">
              <div class="preset-option">
                <span class="preset-name">{{ p.label }}</span>
                <span class="preset-desc">{{ p.desc }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="录制时长">
          <el-input-number v-model="newRecordingForm.duration" :min="0" :max="3600" :step="10" style="width: 200px" />
          <span class="form-hint">秒（0 表示无限制，需手动停止）</span>
        </el-form-item>
        <el-form-item label="最大文件">
          <el-input-number v-model="newRecordingForm.maxSize" :min="0" :max="1024" :step="50" style="width: 200px" />
          <span class="form-hint">MB（0 表示无限制）</span>
        </el-form-item>
        <el-form-item>
          <el-alert type="info" :closable="false" show-icon>
            <template #default>
              <p class="alert-content-small">将采集: CPU负载、GC事件、线程分配、对象分配、锁竞争等性能数据</p>
            </template>
          </el-alert>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewRecordingDialog = false">取消</el-button>
        <el-button type="primary" @click="startRecording">
          <IconifyIconOnline icon="ri:play-circle-line" class="mr-1" />
          开始录制
        </el-button>
      </template>
    </sc-dialog>

    <!-- 导出对话框 -->
    <sc-dialog v-model="showExportDialog" title="导出 JFR 文件" width="480px">
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="录制名称">
          <el-input :model-value="exportForm.recordingName" disabled />
        </el-form-item>
        <el-form-item label="文件名">
          <el-input v-model="exportForm.filename" placeholder="请输入导出文件名">
            <template #append>.jfr</template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-alert type="warning" :closable="false" show-icon>
            <template #default>
              <p class="alert-content-small">文件将保存到服务器当前工作目录</p>
            </template>
          </el-alert>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="exportRecording">
          <IconifyIconOnline icon="ri:save-line" class="mr-1" />
          导出
        </el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: var(--el-bg-color-page);
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  border: none;

  :deep(.el-card__body) {
    padding: 20px;
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.primary {
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), rgba(var(--el-color-primary-rgb), 0.05));
      .stat-icon {
        color: var(--el-color-primary);
      }
    }
    &.success {
      background: linear-gradient(135deg, rgba(var(--el-color-success-rgb), 0.1), rgba(var(--el-color-success-rgb), 0.05));
      .stat-icon {
        color: var(--el-color-success);
      }
    }
    &.warning {
      background: linear-gradient(135deg, rgba(var(--el-color-warning-rgb), 0.1), rgba(var(--el-color-warning-rgb), 0.05));
      .stat-icon {
        color: var(--el-color-warning);
      }
    }
    &.danger {
      background: linear-gradient(135deg, rgba(var(--el-color-danger-rgb), 0.1), rgba(var(--el-color-danger-rgb), 0.05));
      .stat-icon {
        color: var(--el-color-danger);
      }
    }
    &.info {
      background: linear-gradient(135deg, rgba(var(--el-color-info-rgb), 0.1), rgba(var(--el-color-info-rgb), 0.05));
      .stat-icon {
        color: var(--el-color-info);
      }
    }

    .stat-icon {
      font-size: 24px;
    }
  }

  .stat-info {
    flex: 1;

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .stat-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .stat-detail {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      margin-top: 2px;
    }
  }
}

.modern-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .card-header {
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .card-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }
    }
  }
}

.modern-table {
  :deep(th.el-table__cell) {
    background: var(--el-fill-color-lighter);
    font-weight: 600;
  }
}

.highlight-number {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-secondary);

  &.success {
    color: var(--el-color-success);
  }

  &.primary {
    color: var(--el-color-primary);
  }
}

.text-placeholder {
  color: var(--el-text-color-placeholder);
}

.recording-icon {
  color: var(--el-color-danger);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.alert-title {
  font-weight: 600;
}

.alert-content {
  margin: 8px 0 0 0;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.alert-content-small {
  margin: 0;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.preset-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .preset-name {
    font-weight: 500;
  }

  .preset-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.form-hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

// 深色主题适配
html.dark {
  .page-container {
    background: var(--el-bg-color-page);
  }

  .stat-card,
  .modern-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}
</style>

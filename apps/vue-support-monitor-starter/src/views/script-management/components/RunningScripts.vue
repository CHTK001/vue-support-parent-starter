<template>
  <div class="running-scripts">
    <!-- 工具�?-->
    <Toolbar>
      <template #left>
        <div class="running-count">
          <IconifyIconOnline icon="ri:play-circle-line" />
          <span>运行中脚�? {{ runningScripts.length }}</span>
        </div>
      </template>
      <template #right>
        <el-button size="small" @click="handleRefresh">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </el-button>
        <el-button
          size="small"
          type="danger"
          :disabled="runningScripts.length === 0"
          @click="handleStopAll"
        >
          <IconifyIconOnline icon="ri:stop-line" />
          停止全部
        </el-button>
      </template>
    </Toolbar>

    <!-- 运行中脚本列�?-->
    <div class="scripts-list" v-loading="loading">
      <div
        v-for="script in runningScripts"
        :key="script.id"
        class="script-item"
      >
        <!-- 脚本信息头部 -->
        <div class="script-header">
          <div class="script-info">
            <div class="script-name">{{ script.scriptName }}</div>
            <div class="script-meta">
              <span class="execution-id">执行ID: {{ script.id }}</span>
              <span class="start-time"
                >开始时�? {{ formatTime(script.startTime) }}</span
              >
            </div>
          </div>
          <div class="script-status">
            <el-tag type="warning" size="small">
              <IconifyIconOnline icon="ri:loader-line" class="rotating" />
              运行�?
            </el-tag>
          </div>
        </div>

        <!-- 执行进度 -->
        <div class="execution-progress">
          <div class="progress-info">
            <span class="duration"
              >运行时长: {{ formatRunningDuration(script.startTime) }}</span
            >
            <span class="progress-text">执行�?..</span>
          </div>
          <el-progress
            :percentage="getProgressPercentage(script)"
            :status="getProgressStatus(script)"
            :show-text="false"
            :stroke-width="6"
          />
        </div>

        <!-- 实时输出 -->
        <div class="output-section">
          <div class="output-header">
            <span>实时输出</span>
            <el-button size="small" type="text" @click="toggleOutput(script)">
              {{ script.showOutput ? "收起" : "展开" }}
            </el-button>
          </div>
          <div v-if="script.showOutput" class="output-content">
            <div class="output-text">
              {{ script.output || "等待输出..." }}
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="script-actions">
          <el-button size="small" @click="$emit('view-detail', script)">
            <IconifyIconOnline icon="ri:eye-line" />
            查看详情
          </el-button>
          <el-button size="small" type="danger" @click="$emit('stop', script)">
            <IconifyIconOnline icon="ri:stop-line" />
            停止执行
          </el-button>
        </div>
      </div>

      <!-- 空状�?-->
      <div v-if="runningScripts.length === 0 && !loading" class="empty-state">
        <IconifyIconOnline icon="ri:play-circle-line" class="empty-icon" />
        <p class="empty-text">暂无运行中的脚本</p>
        <p class="empty-desc">执行脚本后将在此处显�?/p>
      </div>
    </div>

    <!-- 上传对话�?-->
    <UploadToRunningScriptDialog
      :visible="uploadDialogVisible"
      :script-id="selectedScriptId as any"
      @update:visible="(v: boolean) => (uploadDialogVisible = v)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Toolbar from "./Toolbar.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getRunningScriptExecutions,
  stopScriptExecution,
} from "@/api/server/script";
import UploadToRunningScriptDialog from "./UploadToRunningScriptDialog.vue";
/**
 * 组件：运行中脚本
 * 职责：展示运行中执行列表、刷新、停止全部、查看详情�?
 * 注意�?
 *  - 轮询刷新频率�?s
 *  - 停止全部会逐个调用停止接口，失败不阻断
 */

// Emits
const emit = defineEmits<{
  stop: [script: any];
  "view-detail": [script: any];
}>();

// 响应式数�?
const loading = ref(false);
const runningScripts = ref<any[]>([]);

// 上传对话框状态（已移除上传按钮，这里也不再使用）
const uploadDialogVisible = ref(false);
const selectedScriptId = ref<number | string | null>(null);

import { usePolling } from "../composables/usePolling";

// 方法
const loadRunningScripts = async () => {
  loading.value = true;
  try {
    const resp = await getRunningScriptExecutions();
    if (resp.success && Array.isArray(resp.data)) {
      runningScripts.value = resp.data.map((ex: any) => ({
        id: ex.monitorSysGenScriptExecutionId,
        scriptName: ex.monitorSysGenScriptId
          ? `脚本#${ex.monitorSysGenScriptId}`
          : `执行记录 #${ex.monitorSysGenScriptExecutionId}`,
        startTime: ex.monitorSysGenScriptExecutionStartTime
          ? new Date(ex.monitorSysGenScriptExecutionStartTime)
          : new Date(),
        output: ex.monitorSysGenScriptExecutionStdout || "",
        showOutput: false,
        raw: ex,
      }));
    } else {
      runningScripts.value = [];
    }
  } catch (error) {
    ElMessage.error("加载运行中脚本失�?);
  } finally {
    loading.value = false;
  }
};

const { start: startAutoRefresh, stop: stopAutoRefresh } = usePolling(
  loadRunningScripts,
  3000
);

// 初始�?
onMounted(() => {
  loadRunningScripts();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});

const handleRefresh = () => {
  loadRunningScripts();
};

const handleStopAll = async () => {
  try {
    if (runningScripts.value.length === 0) return;
    await ElMessageBox.confirm(
      `确定要停止所有运行中的脚本吗？共 ${runningScripts.value.length} 个脚本。`,
      "停止确认",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    const ids = runningScripts.value.map((s) => s.id);
    for (const id of ids) {
      try {
        await stopScriptExecution(id);
      } catch (e) {
        // 忽略单个失败，继续尝试停止其�?
      }
    }

    ElMessage.success("停止指令已发�?);
    loadRunningScripts();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("停止脚本失败");
    }
  }
};

const toggleOutput = (script: any) => {
  script.showOutput = !script.showOutput;
};

const formatRunningDuration = (startTime: Date) => {
  const now = new Date();
  const duration = now.getTime() - startTime.getTime();

  if (duration < 60000) {
    return `${Math.floor(duration / 1000)}秒`;
  } else if (duration < 3600000) {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}�?{seconds}秒`;
  } else {
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    return `${hours}小时${minutes}分`;
  }
};

const getProgressPercentage = (script: any) => {
  // 基于运行时间估算进度（UI展示用）
  const duration = Date.now() - script.startTime.getTime();
  const maxDuration = 10 * 60 * 1000; // 假设最�?0分钟
  return Math.min((duration / maxDuration) * 100, 95);
};

const getProgressStatus = (script: any) => {
  const percentage = getProgressPercentage(script);
  if (percentage < 30) return "success";
  if (percentage < 70) return "warning";
  return "exception";
};

// 格式化时�?
const formatTime = (date: Date) => {
  return date.toLocaleString();
};
</script>

<style scoped lang="scss">
.running-scripts {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  background: transparent;
}

/* 顶部工具�?*/
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.7);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.85),
    rgba(255, 255, 255, 0.75)
  );
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);

  .running-count {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #334155;

    .count-badge {
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(99, 102, 241, 0.1);
      color: #4f46e5;
      font-weight: 700;
    }
  }

  :deep(.el-button) {
    border-radius: 10px;
    font-weight: 500;
  }
}

/* 列表区域 */
.scripts-list {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
}

/* 单条脚本卡片 */
.script-item {
  position: relative;
  border-radius: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.25),
      rgba(118, 75, 162, 0.25)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1);
  }
}

/* 头部信息 */
.script-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;

  .script-name {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    background: linear-gradient(135deg, #10b981 0%, #22c55e 60%, #84cc16 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.2;
  }

  .script-meta {
    margin-top: 4px;
    font-size: 12px;
    color: #64748b;
    display: flex;
    gap: 10px;

    .execution-id,
    .start-time {
      background: rgba(100, 116, 139, 0.08);
      padding: 2px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }
  }

  :deep(.el-tag) {
    border-radius: 10px;
    border: none;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;

    .rotating {
      animation: rotate 1.2s linear infinite;
    }
  }
}

/* 进度区域 */
.execution-progress {
  margin-top: 12px;

  .progress-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 6px;
  }

  :deep(.el-progress) {
    .el-progress-bar__outer {
      background: rgba(99, 102, 241, 0.08);
      border-radius: 999px;
    }
    .el-progress-bar__inner {
      background: linear-gradient(90deg, #22c55e, #10b981);
    }
  }
}

/* 输出区域 */
.output-section {
  margin-top: 12px;

  .output-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #334155;
  }

  :deep(.el-button.is-text) {
    color: #475569;
    &:hover {
      color: #0ea5e9;
    }
  }

  .output-content {
    margin-top: 8px;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      monospace;
    white-space: pre-wrap;
    background: #0b1220;
    color: #cbd5e1;
    border-radius: 12px;
    padding: 10px 12px;
    max-height: 160px;
    overflow: auto;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.15);
  }
}

/* 操作区域 */
.script-actions {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(226, 232, 240, 0.8);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  :deep(.el-button) {
    border-radius: 10px;
  }
}

/* 空状�?*/
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 32px 16px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.9),
    rgba(255, 255, 255, 0.75)
  );
  border: 1px dashed rgba(16, 185, 129, 0.25);
  border-radius: 16px;
  color: #64748b;

  .empty-icon {
    font-size: 28px;
    color: #10b981;
    margin-bottom: 6px;
  }

  .empty-text {
    margin: 4px 0 0;
    font-weight: 600;
  }
}

/* 旋转动画 */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

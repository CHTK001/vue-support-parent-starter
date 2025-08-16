<template>
  <el-dialog
    v-model="visible"
    title="执行脚本"
    width="70%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="execute-dialog">
      <!-- 脚本信息 -->
      <div class="script-info">
        <div class="info-header">
          <IconifyIconOnline :icon="getScriptIcon(normalizedType)" />
          <div class="script-details">
            <h3>
              {{
                scriptData?.name ||
                scriptData?.monitorSysGenScriptName ||
                "未知脚本"
              }}
            </h3>
            <p>
              {{
                scriptData?.description ||
                scriptData?.monitorSysGenScriptDescription ||
                "暂无描述"
              }}
            </p>
          </div>
          <el-tag :type="getScriptTypeTagType(normalizedType)" size="small">
            {{ scriptData?.type }}
          </el-tag>
        </div>

        <!-- 目标选择：基于上传成功记录 -->
        <div class="target-select">
          <h4>选择目标</h4>
          <el-radio-group v-model="targetType" size="small">
            <el-radio-button label="SERVER">服务器</el-radio-button>
            <el-radio-button label="NODE">节点</el-radio-button>
          </el-radio-group>

          <div class="target-row">
            <el-select
              v-if="targetType === 'SERVER'"
              v-model="selectedServerId"
              filterable
              clearable
              placeholder="选择最近上传成功的服务器"
              style="width: 100%"
            >
              <el-option
                v-for="srv in successServers"
                :key="srv.id"
                :label="srv.label"
                :value="srv.id"
              />
            </el-select>

            <el-select
              v-else
              v-model="selectedNodeId"
              filterable
              clearable
              placeholder="选择最近上传成功的节点"
              style="width: 100%"
            >
              <el-option
                v-for="node in successNodes"
                :key="node.id"
                :label="node.label"
                :value="node.id"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 执行参数配置 -->
      <div class="execute-config">
        <h4>执行配置</h4>
        <el-form :model="executeForm" label-width="100px">
          <el-form-item label="执行参数">
            <el-input
              v-model="executeForm.parameters"
              type="textarea"
              :rows="2"
              placeholder="请输入执行参数，多个参数用空格分隔"
            />
          </el-form-item>

          <el-form-item label="超时时间">
            <el-input-number
              v-model="executeForm.timeout"
              :min="1"
              :max="3600"
              placeholder="秒"
              style="width: 240px"
            />
          </el-form-item>

          <el-form-item label="执行选项">
            <el-checkbox v-model="executeForm.async">异步执行</el-checkbox>
            <el-checkbox v-model="executeForm.saveOutput">保存输出</el-checkbox>
          </el-form-item>
        </el-form>
      </div>

      <!-- 执行结果 -->
      <div v-if="executionResult" class="execution-result">
        <h4>执行结果</h4>
        <div class="result-header">
          <el-tag :type="getStatusTagType(executionResult.status)" size="large">
            <IconifyIconOnline :icon="getStatusIcon(executionResult.status)" />
            {{ getStatusText(executionResult.status) }}
          </el-tag>
          <span v-if="executionResult.duration" class="duration">
            耗时: {{ formatDuration(executionResult.duration) }}
          </span>
        </div>

        <el-tabs v-model="activeTab" class="result-tabs">
          <el-tab-pane label="标准输出" name="stdout">
            <div class="output-content">
              <pre v-if="executionResult.stdout">{{
                executionResult.stdout
              }}</pre>
              <div v-else class="no-output">暂无输出</div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="错误输出" name="stderr">
            <div class="output-content">
              <pre v-if="executionResult.stderr">{{
                executionResult.stderr
              }}</pre>
              <div v-else class="no-output">暂无错误输出</div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="executionResult?.status === 'running'"
          type="danger"
          @click="handleStop"
          :loading="stopping"
        >
          停止执行
        </el-button>
        <el-button
          type="primary"
          @click="handleExecute"
          :loading="executing"
          :disabled="!scriptData"
        >
          {{ executionResult?.status === "running" ? "执行中..." : "开始执行" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { executeServerScript, executeNodeScript } from "@/api/server/script";
import { fetchScriptUploadRecords } from "@/api/script-upload";

// Props
interface Props {
  modelValue: boolean;
  scriptData?: any;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

// 响应式数据
const visible = ref(false);

// 规范化脚本类型（小写），用于图标与标签样式
const normalizedType = computed(() => {
  const t =
    (props.scriptData?.type ||
      props.scriptData?.monitorSysGenScriptType ||
      "") + "";
  return t.toLowerCase();
});

const executing = ref(false);
const stopping = ref(false);
const activeTab = ref("stdout");
const executionResult = ref<any | null>(null);

// 目标选择
const targetType = ref<"SERVER" | "NODE">("SERVER");
const selectedServerId = ref<number | null>(null);
const selectedNodeId = ref<string | null>(null);
const successServers = ref<{ id: number; label: string }[]>([]);
const successNodes = ref<{ id: string; label: string }[]>([]);

const executeForm = reactive({
  parameters: "",
  timeout: 300,
  async: false,
  saveOutput: true,
});

// 加载最近上传成功的服务器/节点
const loadSuccessTargets = async () => {
  try {
    const query = { pageNum: 1, pageSize: 50 } as any;
    // 只取当前脚本的记录
    if (props.scriptData?.monitorSysGenScriptId) {
      query.scriptId = props.scriptData.monitorSysGenScriptId;
    }
    const resp = await fetchScriptUploadRecords(query);
    const list = (resp?.data?.records || []) as any[];
    const serverMap = new Map<number, string>();
    const nodeMap = new Map<string, string>();
    list
      .filter((r) => r.monitorSysGenScriptUploadStatus === "SUCCESS")
      .forEach((r) => {
        if (
          r.monitorSysGenScriptUploadType === "REMOTE" &&
          r.monitorSysGenScriptUploadServerId
        ) {
          const label = `${r.monitorSysGenScriptUploadServerId} (${r.monitorSysGenScriptUploadIp || "-"})`;
          serverMap.set(r.monitorSysGenScriptUploadServerId, label);
        }
        if (
          r.monitorSysGenScriptUploadType === "NODE" &&
          r.monitorSysGenScriptUploadNodeId
        ) {
          const label = `${r.monitorSysGenScriptUploadNodeId} (${r.monitorSysGenScriptUploadIp || "-"})`;
          nodeMap.set(r.monitorSysGenScriptUploadNodeId, label);
        }
      });
    successServers.value = Array.from(serverMap, ([id, label]) => ({
      id,
      label,
    }));
    successNodes.value = Array.from(nodeMap, ([id, label]) => ({ id, label }));
  } catch (e) {
    // ignore
  }
};

onMounted(() => {
  if (props.modelValue) {
    loadSuccessTargets();
  }
});

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      resetForm();
      loadSuccessTargets();
    }
  }
);

// 监听器
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
    if (val) {
      resetForm();
    }
  }
);

watch(visible, (val) => {
  emit("update:modelValue", val);
});

// 方法
const resetForm = () => {
  executeForm.parameters = "";
  executeForm.timeout = 300;
  executeForm.async = false;
  executeForm.saveOutput = true;
  executionResult.value = null;
};

const handleExecute = async () => {
  if (!props.scriptData) {
    ElMessage.warning("请选择要执行的脚本");
    return;
  }

  executing.value = true;
  try {
    // 构造参数
    const scriptId =
      props.scriptData.monitorSysGenScriptId || props.scriptData.id;
    const baseParams = {
      parameters: executeForm.parameters
        ? executeForm.parameters.split(/\s+/).filter(Boolean)
        : [],
      timeout: executeForm.timeout,
      async: executeForm.async,
      triggerType: "MANUAL",
    } as any;

    if (targetType.value === "SERVER") {
      const serverId =
        selectedServerId.value ||
        props.scriptData.monitorSysGenScriptServerId ||
        props.scriptData.serverId;
      if (!serverId) {
        ElMessage.warning("请选择服务器");
        return;
      }
      const resp = await executeServerScript({
        scriptId,
        serverId,
        ...baseParams,
      });

      if (resp.success && resp.data) {
        const ex = resp.data as any;
        executionResult.value = {
          id: ex.monitorSysGenScriptExecutionId,
          status: (ex.monitorSysGenScriptExecutionStatus || "RUNNING")
            .toString()
            .toLowerCase(),
          startTime: ex.monitorSysGenScriptExecutionStartTime,
          endTime: ex.monitorSysGenScriptExecutionEndTime,
          duration: ex.monitorSysGenScriptExecutionDuration,
          exitCode: ex.monitorSysGenScriptExecutionExitCode,
          stdout: ex.monitorSysGenScriptExecutionStdout,
          stderr: ex.monitorSysGenScriptExecutionStderr,
        };
        ElMessage.success("已提交执行");
        emit("success");
      } else {
        throw new Error(resp.msg || "执行失败");
      }
    } else {
      // 节点执行：直接传脚本内容
      const content =
        props.scriptData?.monitorSysGenScriptContent ||
        props.scriptData?.content;
      const scriptType =
        props.scriptData?.monitorSysGenScriptType ||
        props.scriptData?.type ||
        "SHELL";
      const nodeId = selectedNodeId.value;
      if (!nodeId) {
        ElMessage.warning("请选择节点");
        return;
      }
      const resp = await executeNodeScript({
        nodeId,
        script: content || "",
        scriptType,
        timeout: baseParams.timeout,
      });
      if (resp.success) {
        ElMessage.success("已提交执行");
        emit("success");
      } else {
        throw new Error(resp.msg || "执行失败");
      }
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "脚本执行失败");
  } finally {
    executing.value = false;
  }
};

const handleStop = async () => {
  stopping.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (executionResult.value) {
      executionResult.value.status = "cancelled";
      executionResult.value.endTime = new Date();
    }

    ElMessage.success("脚本执行已停止");
  } catch (error) {
    ElMessage.error("停止脚本失败");
  } finally {
    stopping.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
};

// 工具函数
const formatDuration = (duration: number | null) => {
  if (!duration) return "0s";

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

const getScriptIcon = (type: string) => {
  const iconMap = {
    shell: "ri:terminal-line",
    python: "ri:code-s-slash-line",
    powershell: "ri:windows-line",
    batch: "ri:file-text-line",
  };
  return iconMap[type] || "ri:file-text-line";
};

const getScriptTypeTagType = (type: string) => {
  const typeMap = {
    shell: "success",
    python: "warning",
    powershell: "info",
    batch: "primary",
  };
  return typeMap[type] || "default";
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
</script>

<style scoped lang="scss">
.execute-dialog {
  max-height: 70vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.script-info .info-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.script-details h3 {
  margin: 0;
  font-size: 16px;
}
.script-details p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
}

.target-select {
  background: var(--el-fill-color-lighter);
  padding: 12px;
  border-radius: 8px;
}
.target-select h4 {
  margin: 0 0 8px 0;
}
.target-row {
  margin-top: 8px;
}

.execute-config h4,
.execution-result h4 {
  margin: 0 0 8px 0;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.duration {
  color: var(--el-text-color-secondary);
}

.output-content {
  background: #0b1020;
  color: #d6e2ff;
  border-radius: 6px;
  padding: 12px;
  min-height: 160px;
}
.no-output {
  color: var(--el-text-color-secondary);
}
</style>

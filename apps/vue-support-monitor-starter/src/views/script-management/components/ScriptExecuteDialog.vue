<template>
  <el-dialog
    v-model="visible"
    title=""
    width="75%"
    :close-on-click-modal="false"
    class="modern-execute-dialog"
    @close="handleClose"
    :show-close="false"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="modern-dialog-header">
        <div class="header-left">
          <div class="header-icon">
            <IconifyIconOnline :icon="getScriptIcon(normalizedType)" />
          </div>
          <div class="header-content">
            <h2 class="dialog-title">执行脚本</h2>
            <p class="dialog-subtitle">配置并执行您的脚本任务</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="close-btn" @click="handleClose">
            <IconifyIconOnline icon="ri:close-line" />
          </button>
        </div>
      </div>
    </template>

    <div class="modern-execute-content">
      <!-- 脚本信息卡片 -->
      <div class="script-info-card">
        <div class="card-header">
          <div class="script-icon">
            <IconifyIconOnline :icon="getScriptIcon(normalizedType)" />
          </div>
          <div class="script-meta">
            <h3 class="script-name">
              {{
                scriptData?.name ||
                scriptData?.monitorSysGenScriptName ||
                "未知脚本"
              }}
            </h3>
            <p class="script-description">
              {{
                scriptData?.description ||
                scriptData?.monitorSysGenScriptDescription ||
                "暂无描述"
              }}
            </p>
          </div>
          <div class="script-type-badge">
            <el-tag :type="getScriptTypeTagType(normalizedType)" size="large" effect="dark">
              <IconifyIconOnline :icon="getScriptIcon(normalizedType)" />
              {{ scriptData?.type }}
            </el-tag>
          </div>
        </div>

        <!-- 目标选择区域 -->
        <div class="target-selection-section">
          <div class="section-header">
            <IconifyIconOnline icon="ri:server-line" />
            <h4>选择执行目标</h4>
          </div>
          
          <div class="target-type-selector">
            <el-radio-group v-model="targetType" size="large" class="modern-radio-group">
              <el-radio-button label="SERVER" class="target-option">
                <IconifyIconOnline icon="ri:server-line" />
                <span>服务器</span>
              </el-radio-button>
              <el-radio-button label="NODE" class="target-option">
                <IconifyIconOnline icon="ri:computer-line" />
                <span>节点</span>
              </el-radio-button>
            </el-radio-group>
          </div>

          <div class="target-selector">
            <div class="selector-wrapper">
              <el-select
                v-if="targetType === 'SERVER'"
                v-model="selectedServerId"
                filterable
                clearable
                placeholder="选择最近上传成功的服务器"
                class="modern-select"
                size="large"
              >
                <template #prefix>
                  <IconifyIconOnline icon="ri:server-line" />
                </template>
                <el-option
                  v-for="srv in successServers"
                  :key="srv.id"
                  :label="srv.label"
                  :value="srv.id"
                >
                  <div class="option-content">
                    <IconifyIconOnline icon="ri:server-line" />
                    <span>{{ srv.label }}</span>
                  </div>
                </el-option>
              </el-select>

              <el-select
                v-else
                v-model="selectedNodeId"
                filterable
                clearable
                placeholder="选择最近上传成功的节点"
                class="modern-select"
                size="large"
              >
                <template #prefix>
                  <IconifyIconOnline icon="ri:computer-line" />
                </template>
                <el-option
                  v-for="node in successNodes"
                  :key="node.id"
                  :label="node.label"
                  :value="node.id"
                >
                  <div class="option-content">
                    <IconifyIconOnline icon="ri:computer-line" />
                    <span>{{ node.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </div>
          </div>
        </div>
      </div>

      <!-- 执行配置区域 -->
      <div class="execute-config-card">
        <div class="section-header">
          <IconifyIconOnline icon="ri:settings-3-line" />
          <h4>执行配置</h4>
        </div>
        
        <el-form :model="executeForm" class="modern-form" label-position="top">
          <div class="form-grid">
            <el-form-item label="执行参数" class="form-item-full">
              <div class="input-wrapper">
                <div class="input-icon">
                  <IconifyIconOnline icon="ri:terminal-line" />
                </div>
                <el-input
                  v-model="executeForm.parameters"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入执行参数，多个参数用空格分隔"
                  class="modern-textarea"
                  resize="none"
                />
              </div>
            </el-form-item>

            <el-form-item label="超时时间（秒）" class="form-item-half">
              <div class="input-wrapper">
                <div class="input-icon">
                  <IconifyIconOnline icon="ri:time-line" />
                </div>
                <el-input-number
                  v-model="executeForm.timeout"
                  :min="1"
                  :max="3600"
                  placeholder="300"
                  class="modern-input-number"
                  size="large"
                  controls-position="right"
                />
              </div>
          </el-form-item>

          <el-form-item label="执行选项" class="form-item-full">
            <div class="options-wrapper">
              <div class="option-card">
                <el-checkbox v-model="executeForm.async" class="modern-checkbox">
                  <div class="checkbox-content">
                    <IconifyIconOnline icon="ri:time-line" />
                    <div class="checkbox-text">
                      <span class="title">异步执行</span>
                      <span class="desc">后台执行，不阻塞界面</span>
                    </div>
                  </div>
                </el-checkbox>
              </div>
              <div class="option-card">
                <el-checkbox v-model="executeForm.saveOutput" class="modern-checkbox">
                  <div class="checkbox-content">
                    <IconifyIconOnline icon="ri:save-line" />
                    <div class="checkbox-text">
                      <span class="title">保存输出</span>
                      <span class="desc">将执行结果保存到历史记录</span>
                    </div>
                  </div>
                </el-checkbox>
              </div>
            </div>
          </el-form-item>
        </div>
      </el-form>
    </div>

    <!-- 执行结果区域 -->
    <div v-if="executionResult" class="execution-result-card">
      <div class="result-header">
        <div class="header-left">
          <IconifyIconOnline icon="ri:file-text-line" />
          <h4>执行结果</h4>
        </div>
        <div class="result-status">
          <el-tag 
            :type="getStatusTagType(executionResult.status)"
            size="large"
            class="status-tag"
          >
            <IconifyIconOnline :icon="getStatusIcon(executionResult.status)" />
            {{ getStatusText(executionResult.status) }}
          </el-tag>
          <div v-if="executionResult.duration" class="duration-info">
            <IconifyIconOnline icon="ri:time-line" />
            <span>{{ formatDuration(executionResult.duration) }}</span>
          </div>
        </div>
      </div>

      <div class="result-content">
        <el-tabs v-model="activeTab" class="modern-tabs">
          <el-tab-pane name="stdout">
            <template #label>
              <div class="tab-label">
                <IconifyIconOnline icon="ri:terminal-line" />
                <span>标准输出</span>
              </div>
            </template>
            <div class="output-content stdout">
              <div class="output-header">
                <span class="output-title">Standard Output</span>
                <el-button size="small" text @click="copyToClipboard(executionResult.stdout)">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                  复制
                </el-button>
              </div>
              <pre v-if="executionResult.stdout" class="output-text">{{
                executionResult.stdout
              }}</pre>
              <div v-else class="no-output">暂无输出</div>
            </div>
          </el-tab-pane>

          <el-tab-pane name="stderr">
            <template #label>
              <div class="tab-label">
                <IconifyIconOnline icon="ri:error-warning-line" />
                <span>错误输出</span>
              </div>
            </template>
            <div class="output-content stderr">
              <div class="output-header">
                <span class="output-title">Standard Error</span>
                <el-button size="small" text @click="copyToClipboard(executionResult.stderr)">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                  复制
                </el-button>
              </div>
              <pre v-if="executionResult.stderr" class="output-text">{{
                executionResult.stderr
              }}</pre>
              <div v-else class="no-output">暂无错误输出</div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button 
            size="large" 
            class="cancel-btn"
            @click="handleClose"
          >
            <IconifyIconOnline icon="ri:close-line" />
            关闭
          </el-button>
        </div>
        
        <div class="footer-right">
          <el-button
            v-if="executionResult?.status === 'running'"
            size="large"
            type="danger"
            class="stop-btn"
            @click="handleStop"
            :loading="stopping"
          >
            <IconifyIconOnline icon="ri:stop-circle-line" />
            停止执行
          </el-button>
          
          <el-button
            size="large"
            type="primary"
            class="execute-btn"
            @click="handleExecute"
            :loading="executing"
            :disabled="!scriptData"
          >
            <IconifyIconOnline icon="ri:play-circle-line" />
            {{ executionResult?.status === "running" ? "执行中..." : "开始执行" }}
          </el-button>
        </div>
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

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text || '');
    ElMessage.success('已复制到剪贴板');
  } catch (err) {
    console.error('复制失败:', err);
    ElMessage.error('复制失败');
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
// 主弹框样式
:deep(.modern-execute-dialog) {
  .el-dialog {
    border-radius: 16px;
    overflow: hidden;
    backdrop-filter: blur(10px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    
    .el-dialog__header {
      padding: 0;
      margin: 0;
    }
    
    .el-dialog__body {
      padding: 0;
    }
    
    .el-dialog__footer {
      padding: 0;
    }
  }
}

// 自定义头部
.modern-dialog-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 32px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: 0.3;
  }
  
  .header-left {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 16px;
    
    .header-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      backdrop-filter: blur(10px);
    }
    
    .header-content {
      .dialog-title {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 4px 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .dialog-subtitle {
        font-size: 14px;
        opacity: 0.9;
        margin: 0;
      }
    }
  }
  
  .header-actions {
    position: relative;
    z-index: 1;
    
    .close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      cursor: pointer;
      
      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }
    }
  }
}

// 内容区域
.modern-execute-content {
  padding: 32px;
  background: #fafbfc;
  min-height: 400px;
}

// 脚本信息卡片
.script-info-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  }
  
  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    
    .script-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .script-meta {
      flex: 1;
      
      .script-name {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 8px 0;
        line-height: 1.2;
      }
      
      .script-description {
        color: #64748b;
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
      }
    }
    
    .script-type-badge {
      :deep(.el-tag) {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        color: white;
        border: none;
        font-weight: 600;
        font-size: 13px;
        padding: 8px 16px;
        border-radius: 20px;
        box-shadow: 0 2px 8px rgba(30, 41, 59, 0.3);
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  }
}

// 通用区域头部
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  
  .iconify {
    font-size: 20px;
    color: #667eea;
  }
  
  h4 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }
}

// 目标选择区域
.target-selection-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  .target-type-selector {
    margin-bottom: 20px;
    
    :deep(.modern-radio-group) {
      .el-radio-button {
        margin-right: 12px;
        
        .el-radio-button__inner {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 20px;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          
          .iconify {
            font-size: 18px;
          }
          
          &:hover {
            border-color: #667eea;
            background: #f1f5f9;
          }
        }
        
        &.is-active .el-radio-button__inner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
      }
    }
    
    .target-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .target-selector {
    .selector-wrapper {
      :deep(.modern-select) {
        .el-select__wrapper {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 4px 16px;
          transition: all 0.3s ease;
          
          &:hover {
            border-color: #667eea;
          }
          
          &.is-focused {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
        }
        
        .el-select__prefix {
          color: #667eea;
        }
      }
      
      :deep(.el-select-dropdown) {
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        
        .option-content {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .iconify {
            color: #667eea;
          }
        }
      }
    }
  }
}

// 执行配置卡片
.execute-config-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  :deep(.modern-form) {
    .form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      
      .form-item-half {
        grid-column: span 1;
      }
      
      .form-item-full {
        grid-column: span 1;
      }
    }
    
    .el-form-item {
      margin-bottom: 0;
      
      .el-form-item__label {
        font-weight: 600;
        color: #374151;
        font-size: 14px;
        margin-bottom: 8px;
      }
    }
    
    .input-wrapper {
      position: relative;
      
      .input-icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #667eea;
        z-index: 10;
        font-size: 18px;
      }
      
      .modern-textarea {
        :deep(.el-textarea__inner) {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 16px 16px 48px;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          transition: all 0.3s ease;
          
          &:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
        }
      }
      
      .modern-input-number {
        width: 100%;
        
        :deep(.el-input__wrapper) {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 4px 16px 4px 48px;
          transition: all 0.3s ease;
          
          &:hover {
            border-color: #667eea;
          }
          
          &.is-focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
        }
      }
    }
    
    .options-wrapper {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      
      .option-card {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        transition: all 0.3s ease;
        
        &:hover {
          border-color: #667eea;
          background: #f1f5f9;
        }
        
        :deep(.modern-checkbox) {
          .el-checkbox__input {
            .el-checkbox__inner {
              border-radius: 6px;
              border: 2px solid #d1d5db;
              
              &:hover {
                border-color: #667eea;
              }
            }
            
            &.is-checked .el-checkbox__inner {
              background: #667eea;
              border-color: #667eea;
            }
          }
          
          .el-checkbox__label {
            padding-left: 12px;
          }
        }
        
        .checkbox-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          
          .iconify {
            font-size: 20px;
            color: #667eea;
            margin-top: 2px;
          }
          
          .checkbox-text {
            .title {
              display: block;
              font-weight: 600;
              color: #374151;
              margin-bottom: 4px;
            }
            
            .desc {
              display: block;
              font-size: 12px;
              color: #6b7280;
              line-height: 1.4;
            }
          }
        }
      }
    }
  }
}

// 执行结果卡片
.execution-result-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .iconify {
        font-size: 20px;
        color: #667eea;
      }
      
      h4 {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
      }
    }
    
    .result-status {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .status-tag {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        padding: 8px 16px;
        border-radius: 20px;
        
        .iconify {
          font-size: 16px;
        }
      }
      
      .duration-info {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #6b7280;
        font-size: 14px;
        
        .iconify {
          font-size: 16px;
        }
      }
    }
  }
  
  .result-content {
    :deep(.modern-tabs) {
      .el-tabs__header {
        margin-bottom: 16px;
        
        .el-tabs__nav {
          border-radius: 12px;
          background: #f8fafc;
          padding: 4px;
          
          .el-tabs__item {
            border-radius: 8px;
            margin-right: 4px;
            padding: 12px 16px;
            transition: all 0.3s ease;
            
            &.is-active {
              background: white;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .tab-label {
              display: flex;
              align-items: center;
              gap: 8px;
              
              .iconify {
                font-size: 16px;
              }
            }
          }
        }
      }
      
      .el-tabs__content {
        .output-content {
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          
          .output-header {
            background: #f8fafc;
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            
            .output-title {
              font-size: 12px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .el-button {
              font-size: 12px;
              padding: 4px 8px;
            }
          }
          
          .output-text {
            background: #1e293b;
            color: #e2e8f0;
            padding: 16px;
            margin: 0;
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.6;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
            
            &::-webkit-scrollbar {
              width: 6px;
            }
            
            &::-webkit-scrollbar-track {
              background: #334155;
            }
            
            &::-webkit-scrollbar-thumb {
              background: #64748b;
              border-radius: 3px;
            }
          }
          
          &.stdout .output-text {
            background: #1e293b;
          }
          
          &.stderr .output-text {
            background: #7f1d1d;
            color: #fecaca;
          }
          
          .no-output {
            padding: 16px;
            text-align: center;
            color: #6b7280;
            font-style: italic;
          }
        }
      }
    }
  }
}

// 底部操作区域
.dialog-footer {
  background: #f8fafc;
  padding: 20px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e2e8f0;
  
  .footer-left, .footer-right {
    display: flex;
    gap: 12px;
  }
  
  .cancel-btn {
    background: white;
    border: 2px solid #e2e8f0;
    color: #6b7280;
    font-weight: 600;
    padding: 12px 24px;
    border-radius: 12px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    
    &:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }
    
    .iconify {
      margin-right: 6px;
    }
  }
  
  .stop-btn {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border: none;
    color: white;
    font-weight: 600;
    padding: 12px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.5);
    }
    
    .iconify {
      margin-right: 6px;
    }
  }
  
  .execute-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
    font-weight: 600;
    padding: 12px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    
    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }
    
    &:disabled {
      background: #d1d5db;
      box-shadow: none;
      cursor: not-allowed;
    }
    
    .iconify {
      margin-right: 6px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .modern-execute-content {
    padding: 20px;
  }
  
  .script-info-card,
  .target-selection-section,
  .execute-config-card,
  .execution-result-card {
    padding: 16px;
  }
  
  .execute-config-card {
    :deep(.modern-form) {
      .form-grid {
        .options-wrapper {
          grid-template-columns: 1fr;
        }
      }
    }
  }
  
  .dialog-footer {
    padding: 16px 20px;
    flex-direction: column;
    gap: 12px;
    
    .footer-left,
    .footer-right {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>

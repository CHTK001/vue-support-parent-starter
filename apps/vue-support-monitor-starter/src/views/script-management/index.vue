<template>
  <div class="script-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="page-title-section">
            <div class="title-icon">
              <IconifyIconOnline icon="ri:terminal-box-line" />
            </div>
            <div class="title-content">
              <h1 class="page-title">脚本管理中心</h1>
              <p class="page-subtitle">脚本编辑、执行、历史记录管理</p>
            </div>
          </div>
        </div>
        <div class="header-right">
          <div class="stats-overview">
            <div class="stat-item" :class="{ active: activeTab === 'list' }" @click="activeTab = 'list'">
              <div class="stat-number">
                <IconifyIconOnline icon="ri:file-code-line" />
              </div>
              <div class="stat-label">脚本库</div>
            </div>
            <div class="stat-item" :class="{ active: activeTab === 'running' }" @click="activeTab = 'running'">
              <div class="stat-number running">
                <IconifyIconOnline icon="ri:play-circle-line" />
              </div>
              <div class="stat-label">运行中</div>
            </div>
            <div class="stat-item" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
              <div class="stat-number">
                <IconifyIconOnline icon="ri:history-line" />
              </div>
              <div class="stat-label">执行历史</div>
            </div>
            <div class="stat-item" :class="{ active: activeTab === 'upload-records' }" @click="activeTab = 'upload-records'">
              <div class="stat-number">
                <IconifyIconOnline icon="ri:upload-cloud-2-line" />
              </div>
              <div class="stat-label">上传记录</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 脚本列表 -->
      <div v-show="activeTab === 'list'" class="tab-content">
        <ScriptList @execute="handleExecuteScript" @edit="handleEditScript" @create="handleCreateScript" />
      </div>

      <!-- 执行历史 -->
      <div v-show="activeTab === 'history'" class="tab-content">
        <ScriptHistory @view-detail="handleViewExecutionDetail" />
      </div>

      <!-- 上传记录 -->
      <div v-show="activeTab === 'upload-records'" class="tab-content">
        <ScriptUploadRecords />
      </div>

      <!-- 运行中脚本 -->
      <div v-show="activeTab === 'running'" class="tab-content">
        <RunningScripts @stop="handleStopScript" @view-detail="handleViewExecutionDetail" />
      </div>
    </div>

    <!-- 脚本编辑对话框 -->
    <ScriptEditDialog v-model:visible="editDialogVisible" :script-data="currentScript" @save="handleSaveScript" @test="handleTestScript" />

    <!-- 脚本执行对话框 -->
    <ScriptExecuteDialog v-model="executeDialogVisible" :script-data="currentScript" @success="handleExecuteSuccess" />

    <!-- 执行详情对话框 -->
    <ExecutionDetailDialog v-model="detailDialogVisible" :execution-data="currentExecution" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import ScriptList from "./components/ScriptList.vue";
import ScriptEditDialog from "./components/ScriptEditDialog.vue";
import ScriptHistory from "./components/ScriptHistory.vue";
import ScriptUploadRecords from "./components/ScriptUploadRecords.vue";
import RunningScripts from "./components/RunningScripts.vue";
import ScriptExecuteDialog from "./components/ScriptExecuteDialog.vue";
import ExecutionDetailDialog from "./components/ExecutionDetailDialog.vue";

// 响应式数据
const activeTab = ref("list");
const currentScript = ref(null);
const currentExecution = ref(null);
const editDialogVisible = ref(false);
const executeDialogVisible = ref(false);
const detailDialogVisible = ref(false);

// 初始化
onMounted(() => {
  console.log("脚本管理页面初始化");
});

// 事件处理
const handleRefresh = () => {
  ElMessage.success("刷新成功");
  // TODO: 刷新当前标签页的数据
};

const handleCreateScript = () => {
  currentScript.value = null;
  editDialogVisible.value = true;
};

const handleEditScript = (script: any) => {
  currentScript.value = script;
  editDialogVisible.value = true;
};

const handleExecuteScript = (script: any) => {
  currentScript.value = script;
  executeDialogVisible.value = true;
};

const handleSaveScript = (script: any) => {
  ElMessage.success("脚本保存成功");
  // TODO: 刷新脚本列表
};

const handleTestScript = (script: any) => {
  // 测试脚本 - 可以打开执行对话框进行测试
  currentScript.value = script;
  executeDialogVisible.value = true;
};

const handleExecuteSuccess = () => {
  ElMessage.success("脚本执行成功");
  executeDialogVisible.value = false;
  // 切换到运行中脚本标签页
  activeTab.value = "running";
};

const handleStopScript = (execution: any) => {
  ElMessage.success("脚本停止成功");
  // TODO: 停止脚本执行
};

const handleViewExecutionDetail = (execution: any) => {
  // 统一映射为 ExecutionDetailDialog 需要的结构
  const ex = execution?.raw || execution || {};
  currentExecution.value = {
    id: ex.monitorSysGenScriptExecutionId || execution.id,
    scriptName: ex.monitorSysGenScriptId ? `脚本#${ex.monitorSysGenScriptId}` : execution.scriptName,
    status: (ex.monitorSysGenScriptExecutionStatus || execution.status || "").toString().toLowerCase(),
    exitCode: ex.monitorSysGenScriptExecutionExitCode ?? execution.exitCode ?? null,
    startTime: ex.monitorSysGenScriptExecutionStartTime ? new Date(ex.monitorSysGenScriptExecutionStartTime) : execution.startTime,
    endTime: ex.monitorSysGenScriptExecutionEndTime ? new Date(ex.monitorSysGenScriptExecutionEndTime) : execution.endTime,
    duration: ex.monitorSysGenScriptExecutionDuration ?? execution.duration ?? null,
    stdout: ex.monitorSysGenScriptExecutionStdout ?? execution.stdout ?? "",
    stderr: ex.monitorSysGenScriptExecutionStderr ?? execution.stderr ?? "",
    executor: ex.createBy || execution.executor || ""
  } as any;
  detailDialogVisible.value = true;
};
</script>

<style scoped lang="scss">
.script-management-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 50%, #f8fafc 100%);

  // 页面头部
  .page-header {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    padding: 24px 32px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      .page-title-section {
        display: flex;
        align-items: center;
        gap: 16px;

        .title-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: white;
          box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
        }

        .title-content {
          .page-title {
            margin: 0 0 4px 0;
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .page-subtitle {
            margin: 0;
            color: #64748b;
            font-size: 14px;
          }
        }
      }
    }

    .header-right {
      .stats-overview {
        display: flex;
        gap: 12px;

        .stat-item {
          text-align: center;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          border: 2px solid transparent;
          min-width: 90px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          &.active {
            border-color: #8b5cf6;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);

            .stat-number {
              color: #8b5cf6;
            }

            .stat-label {
              color: #8b5cf6;
              font-weight: 600;
            }
          }

          .stat-number {
            font-size: 24px;
            color: #64748b;
            line-height: 1.2;
            transition: all 0.3s ease;

            &.running {
              animation: pulse 2s infinite;
            }
          }

          .stat-label {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
            transition: all 0.3s ease;
          }
        }
      }
    }
  }

  // 主内容区域
  .main-content {
    flex: 1;
    overflow: hidden;
    padding: 20px 32px;

    .tab-content {
      height: 100%;
      overflow: auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
  }
}

// 动画
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

// 响应式
@media (max-width: 768px) {
  .script-management-page {
    .page-header {
      padding: 16px;

      .header-content {
        flex-direction: column;
        gap: 16px;
      }

      .stats-overview {
        flex-wrap: wrap;
        justify-content: center;
      }
    }

    .main-content {
      padding: 12px 16px;
    }
  }
}
</style>

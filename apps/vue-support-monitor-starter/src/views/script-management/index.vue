<template>
  <div class="script-management-panel">
    <!-- 主内容区域 -->
    <div class="panel-content">
      <!-- 脚本列表 -->
      <div v-show="activeTab === 'list'" class="tab-content">
        <ScriptList
          @execute="handleExecuteScript"
          @edit="handleEditScript"
          @create="handleCreateScript"
        />
      </div>

      <!-- 执行历史 -->
      <div v-show="activeTab === 'history'" class="tab-content">
        <ScriptHistory @view-detail="handleViewExecutionDetail" />
      </div>

      <!-- 上传记录 -->
      <div v-show="activeTab === 'upload-records'" class="tab-content">
        <ScriptUploadRecords />
      </div>

      <!-- 运行中脚本（使用 v-if 避免非激活时持续轮询） -->
      <div v-if="activeTab === 'running'" class="tab-content">
        <RunningScripts
          @stop="handleStopScript"
          @view-detail="handleViewExecutionDetail"
        />
      </div>
    </div>

    <!-- 底部标签页导航 -->
    <div class="bottom-tabs">
      <div class="tab-nav">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'list' }"
          @click="activeTab = 'list'"
        >
          <div class="tab-icon">
            <IconifyIconOnline icon="ri:file-list-3-line" />
          </div>
          <div class="tab-label">主页</div>
        </div>

        <div
          class="tab-item"
          :class="{ active: activeTab === 'upload-records' }"
          @click="activeTab = 'upload-records'"
        >
          <div class="tab-icon">
            <IconifyIconOnline icon="ri:upload-cloud-2-line" />
          </div>
          <div class="tab-label">上传历史</div>
        </div>

        <div
          class="tab-item"
          :class="{ active: activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          <div class="tab-icon">
            <IconifyIconOnline icon="ri:history-line" />
          </div>
          <div class="tab-label">执行历史</div>
        </div>

        <div
          class="tab-item"
          :class="{ active: activeTab === 'running' }"
          @click="activeTab = 'running'"
        >
          <div class="tab-icon">
            <IconifyIconOnline icon="ri:play-circle-line" />
          </div>
          <div class="tab-label">运行中</div>
        </div>
      </div>
    </div>

    <!-- 脚本编辑对话框 -->
    <ScriptEditDialog
      v-model:visible="editDialogVisible"
      :script-data="currentScript"
      @save="handleSaveScript"
      @test="handleTestScript"
    />

    <!-- 脚本执行对话框 -->
    <ScriptExecuteDialog
      v-model="executeDialogVisible"
      :script-data="currentScript"
      @success="handleExecuteSuccess"
    />

    <!-- 执行详情对话框 -->
    <ExecutionDetailDialog
      v-model="detailDialogVisible"
      :execution-data="currentExecution"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@repo/utils";
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
  message("刷新成功", { type: "success" });
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
  message("脚本保存成功", { type: "success" });
  // TODO: 刷新脚本列表
};

const handleTestScript = (script: any) => {
  // 测试脚本 - 可以打开执行对话框进行测试
  currentScript.value = script;
  executeDialogVisible.value = true;
};

const handleExecuteSuccess = () => {
  message("脚本执行成功", { type: "success" });
  executeDialogVisible.value = false;
  // 切换到运行中脚本标签页
  activeTab.value = "running";
};

const handleStopScript = (execution: any) => {
  message("脚本停止成功", { type: "success" });
  // TODO: 停止脚本执行
};

const handleViewExecutionDetail = (execution: any) => {
  // 统一映射为 ExecutionDetailDialog 需要的结构
  const ex = execution?.raw || execution || {};
  currentExecution.value = {
    id: ex.monitorSysGenScriptExecutionId || execution.id,
    scriptName: ex.monitorSysGenScriptId
      ? `脚本#${ex.monitorSysGenScriptId}`
      : execution.scriptName,
    status: (ex.monitorSysGenScriptExecutionStatus || execution.status || "")
      .toString()
      .toLowerCase(),
    exitCode:
      ex.monitorSysGenScriptExecutionExitCode ?? execution.exitCode ?? null,
    startTime: ex.monitorSysGenScriptExecutionStartTime
      ? new Date(ex.monitorSysGenScriptExecutionStartTime)
      : execution.startTime,
    endTime: ex.monitorSysGenScriptExecutionEndTime
      ? new Date(ex.monitorSysGenScriptExecutionEndTime)
      : execution.endTime,
    duration:
      ex.monitorSysGenScriptExecutionDuration ?? execution.duration ?? null,
    stdout: ex.monitorSysGenScriptExecutionStdout ?? execution.stdout ?? "",
    stderr: ex.monitorSysGenScriptExecutionStderr ?? execution.stderr ?? "",
    executor: ex.createBy || execution.executor || "",
  } as any;
  detailDialogVisible.value = true;
};
</script>

<style scoped lang="scss">
.script-management-panel {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 1;
  }

  > * {
    position: relative;
    z-index: 2;
  }
}

.panel-content {
  flex: 1;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  margin-bottom: 80px; // 为底部导航留出空间

  .tab-content {
    height: 100%;
    overflow: auto;
    background: rgba(255, 255, 255, 0.6);
  }
}

// 底部标签页导航样式
.bottom-tabs {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  .tab-nav {
    display: flex;
    height: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;

    .tab-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      padding: 8px 12px;
      border-radius: 12px;
      margin: 8px 4px;

      &:hover {
        background: rgba(102, 126, 234, 0.05);
        transform: translateY(-2px);
      }

      &.active {
        background: linear-gradient(
          135deg,
          rgba(102, 126, 234, 0.1) 0%,
          rgba(118, 75, 162, 0.1) 100%
        );

        .tab-icon {
          color: #667eea;
          transform: scale(1.1);
        }

        .tab-label {
          color: #667eea;
          font-weight: 600;
        }

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 3px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 0 0 2px 2px;
        }
      }

      .tab-icon {
        font-size: 24px;
        color: #64748b;
        margin-bottom: 4px;
        transition: all 0.3s ease;
      }

      .tab-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
        transition: all 0.3s ease;
        text-align: center;
        line-height: 1.2;
      }
    }
  }
}
</style>

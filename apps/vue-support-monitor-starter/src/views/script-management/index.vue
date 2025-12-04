<template>
  <div class="script-management-page">
    <!-- 统计卡片导航 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div
          class="stat-item"
          :class="{ active: activeTab === 'list' }"
          @click="activeTab = 'list'"
        >
          <div class="stat-icon">
            <IconifyIconOnline icon="ri:file-code-line" />
          </div>
          <div class="stat-label">脚本�?/div>
        </div>
        <div
          class="stat-item"
          :class="{ active: activeTab === 'running' }"
          @click="activeTab = 'running'"
        >
          <div class="stat-icon running">
            <IconifyIconOnline icon="ri:play-circle-line" />
          </div>
          <div class="stat-label">运行�?/div>
        </div>
        <div
          class="stat-item"
          :class="{ active: activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          <div class="stat-icon">
            <IconifyIconOnline icon="ri:history-line" />
          </div>
          <div class="stat-label">执行历史</div>
        </div>
        <div
          class="stat-item"
          :class="{ active: activeTab === 'upload-records' }"
          @click="activeTab = 'upload-records'"
        >
          <div class="stat-icon">
            <IconifyIconOnline icon="ri:upload-cloud-2-line" />
          </div>
          <div class="stat-label">上传记录</div>
        </div>
      </div>
    </div>

    <!-- 主内容区�?-->
    <div class="main-content">
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

      <!-- 运行中脚�?-->
      <div v-show="activeTab === 'running'" class="tab-content">
        <RunningScripts
          @stop="handleStopScript"
          @view-detail="handleViewExecutionDetail"
        />
      </div>
    </div>

    <!-- 脚本编辑对话�?-->
    <ScriptEditDialog
      v-model:visible="editDialogVisible"
      :script-data="currentScript"
      @save="handleSaveScript"
      @test="handleTestScript"
    />

    <!-- 脚本执行对话�?-->
    <ScriptExecuteDialog
      v-model="executeDialogVisible"
      :script-data="currentScript"
      @success="handleExecuteSuccess"
    />

    <!-- 执行详情对话�?-->
    <ExecutionDetailDialog
      v-model="detailDialogVisible"
      :execution-data="currentExecution"
    />
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

// 响应式数�?
const activeTab = ref("list");
const currentScript = ref(null);
const currentExecution = ref(null);
const editDialogVisible = ref(false);
const executeDialogVisible = ref(false);
const detailDialogVisible = ref(false);

// 初始�?
onMounted(() => {
  console.log("脚本管理页面初始�?);
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
  // 测试脚本 - 可以打开执行对话框进行测�?
  currentScript.value = script;
  executeDialogVisible.value = true;
};

const handleExecuteSuccess = () => {
  ElMessage.success("脚本执行成功");
  executeDialogVisible.value = false;
  // 切换到运行中脚本标签�?
  activeTab.value = "running";
};

const handleStopScript = (execution: any) => {
  ElMessage.success("脚本停止成功");
  // TODO: 停止脚本执行
};

const handleViewExecutionDetail = (execution: any) => {
  // 统一映射�?ExecutionDetailDialog 需要的结构
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
.script-management-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.98) 0%,
    rgba(241, 245, 249, 0.95) 100%
  );

  // 统计卡片导航
  .stats-section {
    padding: 24px 32px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);

    // 装饰性波�?
    &::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(
        circle,
        rgba(255, 255, 255, 0.1) 0%,
        transparent 50%
      );
      animation: headerShimmer 4s ease-in-out infinite;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      position: relative;
      z-index: 1;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px 24px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        &.active {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);

          .stat-icon {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
          }

          .stat-label {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
          }
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          background: rgba(255, 255, 255, 0.3);
          color: #fff;
          transition: all 0.3s ease;
          flex-shrink: 0;

          &.running {
            animation: runningPulse 2s infinite;
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
          }
        }

        .stat-label {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          transition: all 0.3s ease;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }

  // 主内容区�?
  .main-content {
    flex: 1;
    overflow: hidden;
    padding: 20px 32px 24px;

    .tab-content {
      height: 100%;
      overflow: auto;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.98) 0%,
        rgba(248, 250, 252, 0.95) 100%
      );
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(226, 232, 240, 0.8);
      position: relative;
      overflow: hidden;

      // 装饰性顶部渐变条
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(
          90deg,
          #667eea 0%,
          #764ba2 50%,
          #f093fb 100%
        );
        border-radius: 16px 16px 0 0;
      }
    }
  }
}

// 动画
@keyframes headerShimmer {
  0%,
  100% {
    transform: translateX(-30%) translateY(-30%) rotate(0deg);
  }
  50% {
    transform: translateX(30%) translateY(30%) rotate(180deg);
  }
}

@keyframes runningPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.7);
  }
}

// 响应�?
@media (max-width: 768px) {
  .script-management-page {
    .stats-section {
      padding: 16px;

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;

        .stat-item {
          padding: 14px 16px;

          .stat-icon {
            width: 38px;
            height: 38px;
            font-size: 18px;
          }

          .stat-label {
            font-size: 13px;
          }
        }
      }
    }

    .main-content {
      padding: 16px;

      .tab-content {
        border-radius: 12px;
      }
    }
  }
}
</style>

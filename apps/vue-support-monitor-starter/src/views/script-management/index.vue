<template>
  <div class="script-management-panel">
    <!-- 标签页 -->
    <div class="panel-content">
      <el-tabs v-model="activeTab" class="script-tabs">
        <!-- 脚本列表 -->
        <el-tab-pane label="脚本列表" name="list">
          <ScriptList
            @execute="handleExecuteScript"
            @edit="handleEditScript"
            @create="handleCreateScript"
          />
        </el-tab-pane>

        <!-- 执行历史 -->
        <el-tab-pane label="执行历史" name="history">
          <ScriptHistory @view-detail="handleViewExecutionDetail" />
        </el-tab-pane>

        <!-- 运行中脚本 -->
        <el-tab-pane label="运行中脚本" name="running">
          <RunningScripts
            @stop="handleStopScript"
            @view-detail="handleViewExecutionDetail"
          />
        </el-tab-pane>
      </el-tabs>
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
import { ElMessage } from "element-plus";
import ScriptList from "./components/ScriptList.vue";
import ScriptEditDialog from "./components/ScriptEditDialog.vue";
import ScriptHistory from "./components/ScriptHistory.vue";
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
  currentExecution.value = execution;
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

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .header-left {
    flex: 1;
  }

  .page-info {
    display: flex;
    align-items: center;
    gap: 16px;

    .page-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .page-details {
      .page-name {
        margin: 0 0 6px 0;
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .page-description {
        margin: 0;
        font-size: 14px;
        color: #64748b;
        background: rgba(100, 116, 139, 0.1);
        padding: 4px 8px;
        border-radius: 6px;
        display: inline-block;
      }
    }
  }

  .header-right {
    display: flex;
    gap: 12px;

    .el-button {
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

.panel-content {
  flex: 1;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);

  .script-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.el-tabs__header) {
      margin: 0;
      padding: 0 32px;
      background: rgba(255, 255, 255, 0.9);
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      backdrop-filter: blur(20px);
    }

    :deep(.el-tabs__nav-wrap) {
      &::after {
        display: none;
      }
    }

    :deep(.el-tabs__item) {
      font-weight: 600;
      color: #64748b;
      border-radius: 8px 8px 0 0;
      margin-right: 8px;
      transition: all 0.3s ease;
      position: relative;

      &:hover {
        color: #667eea;
        background: rgba(102, 126, 234, 0.05);
      }

      &.is-active {
        color: #667eea;
        background: linear-gradient(
          135deg,
          rgba(102, 126, 234, 0.1) 0%,
          rgba(118, 75, 162, 0.1) 100%
        );

        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px 2px 0 0;
        }
      }
    }

    :deep(.el-tabs__content) {
      flex: 1;
      overflow: hidden;
      padding: 0;
      background: rgba(255, 255, 255, 0.6);
    }

    :deep(.el-tab-pane) {
      height: 100%;
      overflow: auto;
    }
  }
}
</style>

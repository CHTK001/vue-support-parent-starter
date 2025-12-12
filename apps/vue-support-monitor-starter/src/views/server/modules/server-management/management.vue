<template>
  <div class="server-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <IconifyIconOnline icon="ri:server-line" class="title-icon" />
          服务器管理
        </h1>
        <div class="page-breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>监控中心</el-breadcrumb-item>
            <el-breadcrumb-item>服务器管理</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAddServer">
          <IconifyIconOnline icon="ep:plus" class="mr-1" />
          新增服务器
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon total">
                <IconifyIconOnline icon="ri:server-line" />
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ statistics.totalServers }}</div>
                <div class="stats-label">总服务器数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon online">
                <IconifyIconOnline icon="ri:checkbox-circle-line" />
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ statistics.onlineServers }}</div>
                <div class="stats-label">在线服务器</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon offline">
                <IconifyIconOnline icon="ri:close-circle-line" />
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ statistics.offlineServers }}</div>
                <div class="stats-label">离线服务器</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon error">
                <IconifyIconOnline icon="ri:error-warning-line" />
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ statistics.errorServers }}</div>
                <div class="stats-label">异常服务器</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 功能标签页 -->
    <div class="main-content">
      <el-tabs v-model="activeTab" type="card" class="management-tabs">
        <el-tab-pane label="服务器列表" name="servers">
          <ServerList
            ref="serverListRef"
            @edit="handleEditServer"
            @config="handleServerConfig"
            @setting="handleServerSetting"
            @delete="handleDeleteServer"
            @connect="handleConnectServer"
            @monitor="handleMonitorServer"
            @files="handleFileManager"
            @script="handleScriptExecutor"
            @logs="handleServerLogs"
            @upload="handleFileUpload"
          />
        </el-tab-pane>

        <el-tab-pane label="连接状态" name="connections">
          <ServerConnectionStatusList
            ref="connectionStatusRef"
            @test="handleTestConnection"
            @batch-test="handleBatchTestConnection"
          />
        </el-tab-pane>

        <el-tab-pane label="文件上传" name="uploads">
          <FileUploadTasks
            ref="fileUploadRef"
            @create="handleCreateUploadTask"
            @start="handleStartUploadTask"
            @pause="handlePauseUploadTask"
            @cancel="handleCancelUploadTask"
          />
        </el-tab-pane>

        <el-tab-pane label="脚本管理" name="scripts">
          <ServerScripts
            ref="serverScriptsRef"
            @create="handleCreateScript"
            @edit="handleEditScript"
            @execute="handleExecuteScript"
            @delete="handleDeleteScript"
          />
        </el-tab-pane>

        <el-tab-pane label="日志管理" name="logs">
          <ServerLogs
            ref="serverLogsRef"
            @view="handleViewLog"
            @export="handleExportLogs"
            @cleanup="handleCleanupLogs"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 对话框组件 -->
    <ServerEditDialog ref="serverEditDialogRef" @success="handleServerSaved" />

    <ServerSettingDialog
      ref="serverSettingDialogRef"
      @success="handleServerSaved"
    />

    <ServerConfigDialog
      ref="serverConfigDialogRef"
      @success="handleServerSaved"
    />

    <ServerTerminalDialog ref="serverTerminalDialogRef" />

    <ServerMonitorDialog ref="serverMonitorDialogRef" />

    <!-- 文件管理对话框 -->
    <el-dialog
      v-model="fileManagerVisible"
      title="文件管理"
      width="90%"
      :before-close="handleFileManagerClose"
      append-to-body
      destroy-on-close
    >
      <FileManager
        :server="currentFileManagerServer"
        @close="handleFileManagerClose"
      />
    </el-dialog>

    <ScriptExecutorDialog ref="scriptExecutorDialogRef" />

    <FileUploadDialog
      ref="fileUploadDialogRef"
      @success="handleUploadSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/utils";
import { getServerStatistics } from "@/api/server";
// import { startFileUploadTask, pauseFileUploadTask, cancelFileUploadTask } from "@/api/server";

// 导入组件
import ServerList from "./components/ServerList.vue";
import ServerConnectionStatusList from "./components/ServerConnectionStatusList.vue";
import FileUploadTasks from "./components/FileUploadTasks.vue";
import ServerScripts from "./components/ServerScripts.vue";
import ServerLogs from "./components/ServerLogs.vue";

// 导入对话框组件
import ServerEditDialog from "./components/ServerEditDialog.vue";
import ServerSettingDialog from "./components/ServerSettingDialog.vue";
import ServerConfigDialog from "./components/ServerConfigDialog.vue";
import ServerTerminalDialog from "./components/ServerTerminalDialog.vue";
import ServerMonitorDialog from "./components/ServerMonitorDialog.vue";
import FileManager from "../file-management/index.vue";
import ScriptExecutorDialog from "./components/ScriptExecutorDialog.vue";
import FileUploadDialog from "./components/FileUploadDialog.vue";

// 路由实例
const router = useRouter();

// 组件引用
const serverListRef = ref();
const connectionStatusRef = ref();
const fileUploadRef = ref();
const serverScriptsRef = ref();
const serverLogsRef = ref();

// 对话框引用
const serverEditDialogRef = ref();
const serverSettingDialogRef = ref();
const serverConfigDialogRef = ref();
const serverTerminalDialogRef = ref();
const serverMonitorDialogRef = ref();
// 文件管理对话框状态
const fileManagerVisible = ref(false);
const currentFileManagerServer = ref(null);
const scriptExecutorDialogRef = ref();
const fileUploadDialogRef = ref();

// 响应式状态
const activeTab = ref("servers");
const statistics = reactive({
  totalServers: 0,
  onlineServers: 0,
  offlineServers: 0,
  errorServers: 0,
});

/**
 * 加载统计数据
 */
const loadStatistics = async () => {
  try {
    const res = await getServerStatistics();
    if (res.code === "00000") {
      Object.assign(statistics, res.data);
    }
  } catch (error) {
    console.error("加载统计数据失败:", error);
  }
};

/**
 * 处理新增服务器
 */
const handleAddServer = () => {
  serverEditDialogRef.value?.open("add");
};

/**
 * 处理编辑服务器
 */
const handleEditServer = (server: any) => {
  serverEditDialogRef.value?.open("edit");
  serverEditDialogRef.value?.setData(server);
};

/**
 * 处理服务器设置
 */
const handleServerSetting = (server: any) => {
  serverSettingDialogRef.value?.open(server.monitorSysGenServerId);
};

/**
 * 处理服务器配置管理
 */
const handleServerConfig = (server: any) => {
  serverConfigDialogRef.value?.open(server.monitorSysGenServerId);
};

/**
 * 处理删除服务器
 */
const handleDeleteServer = (server: any) => {
  // 删除逻辑由子组件处理
};

/**
 * 处理连接服务器
 */
const handleConnectServer = (server: any) => {
  serverTerminalDialogRef.value?.open(server);
};

/**
 * 处理监控服务器
 */
const handleMonitorServer = (server: any) => {
  serverMonitorDialogRef.value?.open(server);
};

/**
 * 处理文件管理（在当前页面打开）
 */
const handleFileManager = (server: any) => {
  currentFileManagerServer.value = server;
  fileManagerVisible.value = true;
};

/**
 * 在新页面中打开文件管理器
 */
const handleFileManagerNewPage = (server: any) => {
  if (!server?.monitorSysGenServerId) {
    message("服务器ID无效", { type: "warning" });
    return;
  }

  // 检查文件管理功能是否启用
  const fileManagementMode =
    server.fileManagementMode || server.monitorSysGenServerFileManagementMode;
  if (!fileManagementMode || fileManagementMode === "NONE") {
    message("该服务器未启用文件管理功能", { type: "warning" });
    return;
  }

  // 在新页面中打开文件管理器
  const routeData = router.resolve({
    name: "fileManager",
    params: {
      serverId: String(server.monitorSysGenServerId),
    },
  });

  window.open(routeData.href, "_blank");
};

/**
 * 关闭文件管理对话框
 */
const handleFileManagerClose = () => {
  fileManagerVisible.value = false;
  currentFileManagerServer.value = null;
};

/**
 * 处理脚本执行
 */
const handleScriptExecutor = (server: any) => {
  scriptExecutorDialogRef.value?.open(server);
};

/**
 * 处理服务器日志
 */
const handleServerLogs = (server: any) => {
  activeTab.value = "logs";
  serverLogsRef.value?.filterByServer(server.id);
};

/**
 * 处理文件上传
 */
const handleFileUpload = (server: any) => {
  fileUploadDialogRef.value?.open(server);
};

/**
 * 处理测试连接
 */
const handleTestConnection = (server: any) => {
  // 测试连接逻辑
};

/**
 * 处理批量测试连接
 */
const handleBatchTestConnection = (servers: any[]) => {
  // 批量测试连接逻辑
};

/**
 * 处理创建上传任务
 */
const handleCreateUploadTask = () => {
  fileUploadDialogRef.value?.open();
};

/**
 * 处理启动上传任务
 */
const handleStartUploadTask = async (task: any) => {
  try {
    const res = await startFileUploadTask(task.monitorSysGenFileUploadTaskId);
    if (res.code === "00000") {
      message.success("上传任务已启动");
      fileUploadRef.value?.refresh();
    } else {
      message.error(`启动失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("启动上传任务失败:", error);
    message.error("启动上传任务失败");
  }
};

/**
 * 处理暂停上传任务
 */
const handlePauseUploadTask = async (task: any) => {
  try {
    const res = await pauseFileUploadTask(task.monitorSysGenFileUploadTaskId);
    if (res.code === "00000") {
      message.success("上传任务已暂停");
      fileUploadRef.value?.refresh();
    } else {
      message.error(`暂停失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("暂停上传任务失败:", error);
    message.error("暂停上传任务失败");
  }
};

/**
 * 处理取消上传任务
 */
const handleCancelUploadTask = async (task: any) => {
  try {
    const res = await cancelFileUploadTask(task.monitorSysGenFileUploadTaskId);
    if (res.code === "00000") {
      message.success("上传任务已取消");
      fileUploadRef.value?.refresh();
    } else {
      message.error(`取消失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("取消上传任务失败:", error);
    message.error("取消上传任务失败");
  }
};

/**
 * 处理创建脚本
 */
const handleCreateScript = () => {
  // 创建脚本逻辑
};

/**
 * 处理编辑脚本
 */
const handleEditScript = (script: any) => {
  // 编辑脚本逻辑
};

/**
 * 处理执行脚本
 */
const handleExecuteScript = (script: any) => {
  // 执行脚本逻辑
};

/**
 * 处理删除脚本
 */
const handleDeleteScript = (script: any) => {
  // 删除脚本逻辑
};

/**
 * 处理查看日志
 */
const handleViewLog = (log: any) => {
  // 查看日志逻辑
};

/**
 * 处理导出日志
 */
const handleExportLogs = (params: any) => {
  // 导出日志逻辑
};

/**
 * 处理清理日志
 */
const handleCleanupLogs = (days: number) => {
  // 清理日志逻辑
};

/**
 * 处理服务器保存成功
 */
const handleServerSaved = () => {
  serverListRef.value?.refresh();
  loadStatistics();
  message.success("服务器保存成功");
};

/**
 * 处理上传成功
 */
const handleUploadSuccess = () => {
  fileUploadRef.value?.refresh();
  message.success("文件上传任务创建成功");
};

// 生命周期
onMounted(() => {
  loadStatistics();
});
</script>

<style scoped lang="scss">
.server-management {
  padding: 20px;
  background: var(--el-bg-color-overlay);
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px;
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .header-left {
      .page-title {
        display: flex;
        align-items: center;
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .title-icon {
          margin-right: 8px;
          color: #409eff;
        }
      }

      .page-breadcrumb {
         color: var(--el-text-color-primary);
      }
    }
  }

  .stats-cards {
    margin-bottom: 20px;

    .stats-card {
      .stats-content {
        display: flex;
        align-items: center;

        .stats-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-size: 24px;
          color: var(--el-text-color-primary);

          &.total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.online {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.offline {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.error {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
        }

        .stats-info {
          .stats-value {
            font-size: 28px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            line-height: 1;
          }

          .stats-label {
            font-size: 14px;
             color: var(--el-text-color-primary);
            margin-top: 4px;
          }
        }
      }
    }
  }

  .main-content {
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .management-tabs {
      :deep(.el-tabs__header) {
        margin: 0;
        border-bottom: 1px solid #e4e7ed;
      }

      :deep(.el-tabs__content) {
        padding: 20px;
      }
    }
  }
}
</style>

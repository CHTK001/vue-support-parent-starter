<template>
  <div class="server-management system-container modern-bg">
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
    <sc-dialog
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
    </sc-dialog>

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
import { getServerStatistics, checkRemoteDesktopAvailability } from "@/api/server";
// import { startFileUploadTask, pauseFileUploadTask, cancelFileUploadTask } from "@/api/server";

// 导入组件
import ServerList from "./components/ServerList.vue";
import ServerConnectionStatusList from "./components/ServerConnectionStatusList.vue";
import FileUploadTasks from "@/views/server/components/ServerFileUploadTasks.vue";
import ServerScripts from "./components/ServerScripts.vue";
import ServerLogs from "./components/ServerLogs.vue";

// 导入对话框组件
import ServerEditDialog from "./components/ServerEditDialog.vue";
import ServerSettingDialog from "./components/ServerSettingDialog.vue";
import ServerConfigDialog from "./components/ServerConfigDialog.vue";
import ServerTerminalDialog from "./components/ServerTerminalDialog.vue";
import ServerMonitorDialog from "./components/ServerMonitorDialog.vue";
import FileManager from "../file-management/index.vue";
import ScriptExecutorDialog from "@/views/server/components/dialogs/ScriptExecutorDialog.vue";
import FileUploadDialog from "@/views/file-manager/components/FileUploadDialog.vue";

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
 * 对于 REMOTE 协议，先检测远程桌面可用性，如果不可用则自动降级到 SSH
 */
const handleConnectServer = async (server: any) => {
  // 对于 REMOTE 协议，先检测远程桌面可用性
  if (server.monitorSysGenServerProtocol === 'REMOTE') {
    try {
      const res = await checkRemoteDesktopAvailability(String(server.monitorSysGenServerId));
      if (res.code === '00000' && res.data) {
        if (!res.data.available) {
          // 远程桌面不可用，自动降级到 SSH
          message(res.data.reason || '远程桌面不可用，已自动切换到 SSH 模式', { type: 'warning' });
          // 修改协议为推荐的协议（通常是 SSH）
          server = { ...server, monitorSysGenServerProtocol: res.data.recommendedProtocol || 'SSH' };
        }
      }
    } catch (error) {
      console.error('检测远程桌面可用性失败:', error);
      // 检测失败时默认降级到 SSH
      message('检测远程桌面失败，已自动切换到 SSH 模式', { type: 'warning' });
      server = { ...server, monitorSysGenServerProtocol: 'SSH' };
    }
  }
  
  serverTerminalDialogRef.value?.setData(server);
  serverTerminalDialogRef.value?.open();
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
  padding: 32px;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  
  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    padding: 24px 32px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 
      0 4px 24px rgba(0, 0, 0, 0.04),
      0 2px 8px rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 4px 12px rgba(0, 0, 0, 0.04);
    }

    .header-left {
      .page-title {
        display: flex;
        align-items: center;
        margin: 0 0 12px 0;
        font-size: 28px;
        font-weight: 700;
        background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;

        .title-icon {
          margin-right: 12px;
          color: var(--el-color-primary);
          font-size: 32px;
        }
      }

      .page-breadcrumb {
        color: var(--el-text-color-regular);
        font-size: 14px;
      }
    }
    
    .header-right {
      .el-button {
        border-radius: 12px;
        padding: 10px 20px;
        font-weight: 500;
        transition: all 0.2s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }

  .stats-cards {
    margin-bottom: 32px;

    .stats-card {
      border-radius: 16px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 
        0 2px 8px rgba(0, 0, 0, 0.06),
        0 1px 2px rgba(0, 0, 0, 0.04);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      height: 120px;
      
      &:hover {
        box-shadow: 
          0 8px 24px rgba(0, 0, 0, 0.12),
          0 4px 8px rgba(0, 0, 0, 0.08);
        transform: translateY(-4px);
      }
      
      .stats-content {
        display: flex;
        align-items: center;
        padding: 20px;
        height: 100%;

        .stats-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 20px;
          font-size: 28px;
          color: #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;

          &.total {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.online {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }

          &.offline {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          }

          &.error {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }
        }

        .stats-info {
          flex: 1;
          
          .stats-value {
            font-size: 32px;
            font-weight: 700;
            color: var(--el-text-color-primary);
            line-height: 1;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }

          .stats-label {
            font-size: 14px;
            color: var(--el-text-color-regular);
            margin-top: 0;
            font-weight: 500;
          }
        }
      }
    }
  }

  .main-content {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 20px;
    box-shadow: 
      0 4px 24px rgba(0, 0, 0, 0.06),
      0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.05);
    overflow: hidden;

    .management-tabs {
      :deep(.el-tabs__header) {
        margin: 0;
        padding: 0 24px;
        background: rgba(255, 255, 255, 0.5);
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      }
      
      :deep(.el-tabs__nav) {
        border: none;
      }
      
      :deep(.el-tabs__item) {
        padding: 16px 24px;
        font-weight: 500;
        transition: all 0.2s ease;
        border-radius: 8px 8px 0 0;
        
        &.is-active {
          color: var(--el-color-primary);
        }
      }

      :deep(.el-tabs__content) {
        padding: 24px;
      }
    }
  }
}
</style>

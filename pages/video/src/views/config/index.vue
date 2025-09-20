<template>
  <div class="video-config">
    <!-- 统计信息组件 -->
    <ConfigStats :stats="stats" class="mb-6" />

    <!-- 同步信息对话框 -->
    <ScMessageDialog :visible="showSyncDialog" title="同步信息监听" :data="syncMessages" position="bottom-right" width="450px" height="400px" :opacity="0.95" :auto-expand-on-data="true" :auto-scroll="true" :stop-auto-scroll-on-manual="true" @close="showSyncDialog = false" />

    <!-- 配置列表 -->
    <div class="config-list flex flex-col">
      <div class="list-header">
        <div class="list-header-content">
          <div class="list-title-section">
            <div class="list-icon">
              <IconifyIconOnline icon="ep:list" />
            </div>
            <h3 class="list-title">同步配置列表</h3>
          </div>

          <div class="list-actions">
            <div class="search-input">
              <el-input v-model="searchKeyword" placeholder="搜索配置名称" @input="handleSearch">
                <template #prefix>
                  <el-icon><IconifyIconOnline icon="ep:search" /></el-icon>
                </template>
              </el-input>
            </div>

            <div class="filter-select">
              <el-select v-model="statusFilter" placeholder="状态筛选" @change="handleFilter">
                <el-option label="全部" value="" />
                <el-option label="启用" value="enabled" />
                <el-option label="禁用" value="disabled" />
                <el-option label="同步中" value="syncing" />
                <el-option label="异常" value="error" />
              </el-select>
            </div>

            <div class="header-actions">
              <el-button type="primary" @click="showAddDialog = true" class="action-btn primary-action">
                <IconifyIconOnline icon="ep:plus" />
              </el-button>
              <el-button @click="refreshConfigs" class="action-btn secondary-action">
                <el-icon><IconifyIconOnline icon="ep:refresh" /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="list-content flex-[1]">
        <ScTable
          :url="getSyncConfigs"
          :params="{
            keyword: searchKeyword,
            status: statusFilter,
          }"
          layout="card"
          :page-size="pageSize"
          @selection-change="handleSelectionChange"
          @data-loaded="handleDataLoaded"
          class="config-cards"
          ref="tableRef"
        >
          <!-- 空状态模板 -->
          <template #empty>
            <div class="empty-state">
              <div class="empty-icon">
                <IconifyIconOnline icon="ep:video-camera" />
              </div>
              <div class="empty-title">暂无配置数据</div>
              <div class="empty-description">还没有创建任何视频同步配置，点击上方按钮开始创建</div>
              <el-button type="primary" @click="showAddDialog = true" class="empty-action">
                <IconifyIconOnline icon="ep:plus" class="mr-2" />
              </el-button>
            </div>
          </template>

          <!-- 卡片模板 -->
          <template #default="{ row }">
            <ConfigCard :config="row" @action="handleCommand" @copy-url="copyUrl" />
          </template>
        </ScTable>
      </div>

      <!-- 新增/编辑配置对话框 -->
      <ConfigForm v-model:visible="showAddDialog" :config="editingConfig" :editing="!!editingConfig" @success="handleConfigSuccess" @close="resetForm" />

      <!-- 同步日志对话框 -->
      <LogViewer v-model:visible="showLogsDialog" :logs="syncLogs" @refresh="refreshLogs" @clear="clearLogs" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 直接使用IconifyIconOnline组件，无需变量赋值
import ScTable from "@repo/components/ScTable/index.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { deleteSyncConfig, executeSyncConfig, getSyncConfigs, stopSyncTask, testSyncConfig, toggleSyncConfigStatus } from "../../api/config";
import type { VideoSyncConfig } from "../../api/types";

// 导入组件
//@ts-ignore
import { ScMessageDialog } from "@repo/components";
import { useGlobalSocket } from "@repo/core";
import { message } from "@repo/utils";
import ConfigCard from "./components/ConfigCard.vue";
import ConfigForm from "./components/ConfigForm.vue";
import ConfigStats from "./components/ConfigStats.vue";
import LogViewer from "./components/LogViewer.vue";

/**
 * 视频配置管理页面
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

// Socket连接
let socketInstance: any = useGlobalSocket();

// 页面状态
const loading = ref(false);
// 移除了saving变量，现在由ConfigForm组件内部管理
const searchKeyword = ref("");
const statusFilter = ref("");
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);

// 数据
const configList = ref<VideoSyncConfig[]>([]);
const selectedConfigs = ref<VideoSyncConfig[]>([]);
const syncLogs = ref<any[]>([]);

// 表格引用
const tableRef = ref(null);

// 统计信息
const stats = reactive({
  totalConfigs: 0,
  enabledConfigs: 0,
  syncingConfigs: 0,
  errorConfigs: 0,
});

// 对话框状态
const showAddDialog = ref(false);
const showLogsDialog = ref(false);
const showSyncDialog = ref(true); // 默认显示同步信息对话框
const editingConfig = ref<VideoSyncConfig | null>(null);

// 同步消息数据
const syncMessages = ref<any[]>([]);

// 移除了不再需要的表单相关变量，业务逻辑已移至ConfigForm组件内部

/**
 * 初始化Socket连接
 */
const initSocket = () => {
  if (!socketInstance) {
    return;
  }

  // 监听同步信息
  socketInstance.on("/topic/video-sync/global", (data) => {
    const dataObject = JSON.parse(data.data);
    const config = configList.value.find((c) => c.videoSyncConfigId === dataObject.videoSyncConfigId);
    // 添加同步消息到对话框
    const syncMessage = {
      title: `配置同步更新`,
      message: dataObject?.message || `配置ID: ${dataObject.videoSyncConfigId}\n状态: ${getStatusText(dataObject.type)}\n同步数量: ${dataObject.syncCount || 0}`,
      isHtml: true,
      time: new Date(),
      progress: dataObject.status === "syncing" ? Math.min((dataObject.syncCount || 0) * 10, 90) : dataObject.status === "completed" ? 100 : undefined,
    };

    syncMessages.value.push(syncMessage);

    // 保持最新的50条消息
    if (syncMessages.value.length > 50) {
      syncMessages.value = syncMessages.value.slice(-50);
    }

    if (config) {
      config.videoSyncConfigLastSyncTime = dataObject.lastSyncTime;
      config.syncVideoCount += 1;
    }
    updateStats();
  });
};

/**
 * 数据加载完成回调
 * @param data 加载的数据
 */
const handleDataLoaded = (data: any, total: number) => {
  configList.value = data || [];
  totalCount.value = total || 0;
  updateStats();
};

/**
 * 加载配置列表（保留原函数用于手动刷新）
 */
const loadConfigs = async () => {
  if (tableRef.value && tableRef.value.refresh) {
    tableRef.value.refresh();
  }
};

/**
 * 获取状态文本
 * @param status 状态值
 * @returns 状态文本
 */
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    SYNC_START: "同步开始",
    SYNC_COMPLETE: "同步完成",
    SYNC_ERROR: "同步异常",
    SYNC_PENDING: "同步等待中",
    enabled: "启用",
    disabled: "禁用",
    syncing: "同步中",
    completed: "同步完成",
    error: "异常",
    pending: "等待中",
  };
  return statusMap[status] || status;
};

/**
 * 更新统计信息
 */
const updateStats = () => {
  stats.totalConfigs = configList.value.length;
  stats.enabledConfigs = configList.value.filter((c) => c.videoSyncConfigEnable === true).length;
  stats.syncingConfigs = configList.value.filter((c) => c.videoSyncConfigStatus === "PROGRESS").length;
  stats.errorConfigs = configList.value.filter((c) => c.videoSyncConfigStatus === "ERROR").length;
};

/**
 * 添加测试同步消息（用于演示）
 */
const addTestSyncMessage = () => {
  const testMessage = {
    title: "测试同步消息",
    message: `这是一条测试消息\n时间: ${new Date().toLocaleString()}\n状态: 正常`,
    time: new Date(),
    progress: Math.floor(Math.random() * 100),
  };
  syncMessages.value.push(testMessage);
};

/**
 * 刷新配置
 */
const refreshConfigs = () => {
  if (tableRef.value && tableRef.value.refresh) {
    tableRef.value.refresh();
  }
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  if (tableRef.value && tableRef.value.refresh) {
    tableRef.value.refresh();
  }
};

/**
 * 处理筛选
 */
const handleFilter = () => {
  if (tableRef.value && tableRef.value.refresh) {
    tableRef.value.refresh();
  }
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: VideoSyncConfig[]) => {
  selectedConfigs.value = selection;
};

/**
 * 执行同步
 */
const handleSync = (config: VideoSyncConfig) => {
  (config as any).syncing = true;

  executeSyncConfig(config.videoSyncConfigId!)
    .then(() => {
      // 成功回调，不需要判断code
      ElMessage.success("同步任务已启动");
      config.videoSyncConfigStatus = "START"; // 同步中状态
      handleSearch();
    })
    .catch((error) => {
      message.error(error.message);
    })
    .finally(() => {
      (config as any).syncing = false;
    });
};

/**
 * 编辑配置
 */
const editConfig = (config: VideoSyncConfig) => {
  editingConfig.value = config;
  showAddDialog.value = true;
};

/**
 * 处理命令
 */
const handleCommand = (command: string, config: VideoSyncConfig) => {
  switch (command) {
    case "enable":
    case "disable":
      toggleConfigStatus(config, command === "enable");
      break;
    case "sync":
      handleSync(config);
      break;
    case "stop":
      handleStop(config);
      break;
    case "edit":
      editConfig(config);
      break;
    case "delete":
      deleteConfig(config);
      break;
    case "test":
      testConnection(config);
      break;
  }
};

/**
 * 停止同步
 * @param config 配置信息
 */
const handleStop = (config: VideoSyncConfig) => {
  ElMessageBox.confirm(`确定要停止配置 "${config.videoSyncConfigName}" 的同步任务吗？`, "确认停止", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      // 用户确认停止
      stopSyncTask(config.videoSyncConfigId!)
        .then(() => {
          // 成功回调，不需要判断code
          ElMessage.success("同步任务已停止");
          config.videoSyncConfigStatus = "STOP"; // 恢复为启用状态
          updateStats();
          handleSearch();
        })
        .catch((error) => {
          console.error("停止同步任务失败:", error);
          ElMessage.error("停止同步任务失败");
        });
    })
    .catch(() => {
      // 用户取消操作
    });
};

/**
 * 切换配置状态
 */
const toggleConfigStatus = (config: VideoSyncConfig, enable: boolean) => {
  toggleSyncConfigStatus(config.videoSyncConfigId!, enable ? 1 : 0)
    .then(() => {
      // 成功回调，不需要判断code
      config.videoSyncConfigEnable = enable ? !0 : !1;
      ElMessage.success(`${enable ? "启用" : "禁用"}成功`);
      updateStats();
    })
    .catch((error) => {
      console.error(`${enable ? "启用" : "禁用"}配置失败:`, error);
      ElMessage.error(`${enable ? "启用" : "禁用"}配置失败`);
    });
};

/**
 * 删除配置
 */
const deleteConfig = (config: VideoSyncConfig) => {
  ElMessageBox.confirm(`确定要删除配置 "${config.videoSyncConfigName}" 吗？`, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      // 用户确认删除
      deleteSyncConfig(config.videoSyncConfigId!)
        .then(() => {
          // 成功回调，不需要判断code
          ElMessage.success("删除成功");
          if (tableRef.value && tableRef.value.refresh) {
            tableRef.value.refresh();
          }
        })
        .catch((error) => {
          console.error("删除配置失败:", error);
          ElMessage.error("删除配置失败");
        });
    })
    .catch(() => {
      // 用户取消删除，不做任何处理
    });
};

/**
 * 测试连接
 */
const testConnection = (config: VideoSyncConfig) => {
  ElMessage.info("正在测试连接...");
  testSyncConfig(config)
    .then(() => {
      // 成功回调，不需要判断code
      ElMessage.success("连接测试成功");
    })
    .catch((error) => {
      console.error("测试连接失败:", error);
      ElMessage.error("测试连接失败");
    });
};

/**
 * 处理配置保存成功
 */
const handleConfigSuccess = () => {
  showAddDialog.value = false;
  if (tableRef.value && tableRef.value.refresh) {
    tableRef.value.refresh();
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  editingConfig.value = null;
};

/**
 * 复制URL
 */
const copyUrl = (url: string) => {
  navigator.clipboard
    .writeText(url)
    .then(() => {
      ElMessage.success("URL已复制到剪贴板");
    })
    .catch((error) => {
      ElMessage.error("复制失败");
    });
};

/**
 * 刷新日志
 */
const refreshLogs = () => {
  // TODO: 重新加载日志
};

/**
 * 清空日志
 */
const clearLogs = () => {
  syncLogs.value = [];
  ElMessage.success("日志已清空");
};

// 工具方法已移至各个组件内部

// 组件挂载
onMounted(() => {
  initSocket();
});

// 组件卸载
onUnmounted(() => {
  if (socketInstance) {
    // 移除事件监听
    socketInstance.off("/topic/video-sync/global");
  }
});
</script>

<style scoped>
.video-config {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100%;
}

/* 头部样式 */
.config-header {
  margin-bottom: 2rem;
}

.header-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: #409eff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.header-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.header-subtitle {
  font-size: 0.9rem;
  color: #909399;
  margin: 0;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
}

.primary-action {
  background: #409eff;
  color: white;
  border: 1px solid #409eff;
}

.primary-action:hover {
  background: #337ecc;
  border-color: #337ecc;
}

.secondary-action {
  background: white;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.secondary-action:hover {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

/* 配置列表样式 */
.config-list {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  flex: 1;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-header {
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  padding: 20px 24px;
}

.list-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.list-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.list-icon {
  width: 40px;
  height: 40px;
  background: #409eff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.list-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 200px;
}

.filter-select {
  width: 120px;
}

/* 卡片容器样式 */
.config-cards {
  width: 100%;
  padding: 20px 24px 24px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  color: #c0c4cc;
  margin-bottom: 24px;
  display: inline-block;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: #909399;
  line-height: 1.5;
  max-width: 400px;
  margin: 0 auto 32px;
}

.empty-action {
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  background: #409eff;
  border: 1px solid #409eff;
  color: white;
  transition: all 0.2s ease;
}

.empty-action::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.empty-action:hover {
  background: #337ecc;
  border-color: #337ecc;
}

@media (max-width: 768px) {
  .video-config {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
    padding: 20px;
  }

  .header-info {
    flex-direction: column;
    gap: 12px;
  }

  .header-title {
    font-size: 1.5rem;
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .list-header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .list-title-section {
    justify-content: center;
  }

  .list-actions {
    flex-direction: column;
    gap: 8px;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .config-cards {
    padding: 16px 20px 20px;
  }

  .empty-state {
    padding: 40px 16px;
  }
}
</style>

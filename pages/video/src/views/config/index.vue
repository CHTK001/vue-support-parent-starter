<template>
  <div class="video-config">
    <!-- 统计信息组件 -->
    <ConfigStats :stats="stats" class="mb-6" />

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

      <div class="list-content flex-1">
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
import { deleteSyncConfig, executeSyncConfig, getSyncConfigs, testSyncConfig, toggleSyncConfigStatus } from "../../api/config";
import type { VideoSyncConfig } from "../../api/types";
import { socket } from "@repo/core";

// 导入组件
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
let socketInstance: any = null;

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
const editingConfig = ref<VideoSyncConfig | null>(null);

// 移除了不再需要的表单相关变量，业务逻辑已移至ConfigForm组件内部

/**
 * 初始化Socket连接
 */
const initSocket = () => {
  // 使用封装的socket工厂函数创建连接
  const urls = [window.location.origin]; // 使用当前域名
  socketInstance = socket(urls, "/video-sync", {}, {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
  });

  // 监听连接成功
  socketInstance.on("connect", () => {
    console.log("Video Socket连接成功");
  });

  // 监听连接断开
  socketInstance.on("disconnect", () => {
    console.log("Video Socket连接断开");
  });

  // 监听连接错误
  socketInstance.on("connect_error", (error) => {
    console.error("Video Socket连接错误:", error);
  });

  // 监听同步状态更新
  socketInstance.on("sync-status", (data) => {
    const config = configList.value.find((c) => c.configId === data.configId);
    if (config) {
      config.configStatus = data.status;
      config.lastSyncTime = data.lastSyncTime;
      config.syncCount = data.syncCount;
    }
    updateStats();
  });

  // 监听同步日志
  socketInstance.on("sync-log", (log) => {
    syncLogs.value.unshift(log);
    if (syncLogs.value.length > 100) {
      syncLogs.value.pop();
    }
  });
};

/**
 * 数据加载完成回调
 * @param data 加载的数据
 */
const handleDataLoaded = (data: any) => {
  configList.value = data.data || [];
  totalCount.value = data.total || 0;
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
 * 更新统计信息
 */
const updateStats = () => {
  stats.totalConfigs = configList.value.length;
  stats.enabledConfigs = configList.value.filter((c) => c.configStatus === "enabled").length;
  stats.syncingConfigs = configList.value.filter((c) => c.configStatus === "syncing").length;
  stats.errorConfigs = configList.value.filter((c) => c.configStatus === "error").length;
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
      config.videoSyncConfigStatus = 2; // 同步中状态
    })
    .catch((error) => {
      console.error("执行同步失败:", error);
      ElMessage.error("执行同步失败");
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
 * 切换配置状态
 */
const toggleConfigStatus = (config: VideoSyncConfig, enable: boolean) => {
  toggleSyncConfigStatus(config.videoSyncConfigId!, enable ? 1 : 0)
    .then(() => {
      // 成功回调，不需要判断code
      config.videoSyncConfigStatus = enable ? 1 : 0;
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
    socketInstance.off("sync-status");
    socketInstance.off("sync-log");
    socketInstance.off("connect");
    socketInstance.off("disconnect");
    socketInstance.off("connect_error");
    // 断开连接
    socketInstance.close();
    socketInstance = null;
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
  gap: 12px;
}

.action-btn {
  padding: 10px 20px;
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
<template>
  <div class="system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-content">
        <IconifyIconOnline icon="ri:settings-3-line" class="page-header-icon" />
        <div>
          <h2 class="page-header-title">视频同步配置</h2>
          <p class="page-header-desc">管理视频同步源配置，监控同步状态和日志</p>
        </div>
      </div>
    </div>

    <!-- 统计信息组件 -->
    <ConfigStats :stats="stats" class="mb-6" />

    <!-- 同步信息监听 -->
    <ScSocketMessageDialog
      v-if="showSyncDialog"
      event-id="video-sync-global"
      title="同步信息监听"
      event-name="/topic/video-sync/global"
      mode="dialog"
      position="bottom-right"
      layout="log"
      data-type="socket"
      :dialog-height="400"
      :visible="showSyncDialog"
      @update:visible="showSyncDialog = $event"
      @close="showSyncDialog = false"
    />

    <!-- 配置列表 -->
    <div class="modern-table">
      <div class="table-header">
        <div class="table-header-content">
          <div class="table-title-section">
            <IconifyIconOnline icon="ri:list-check" class="table-icon" />
            <h3 class="table-title">同步配置列表</h3>
          </div>

          <div class="table-actions">
            <ScInput 
              v-model="searchKeyword"
              placeholder="搜索配置名称"
              clearable
              style="width: 200px"
              @input="handleSearch"
            >
              <template #prefix>
                <ScIcon><IconifyIconOnline icon="ep:search" /></ScIcon>
              </template>
            </ScInput>

            <ScSelect 
              v-model="statusFilter"
              placeholder="状态筛选"
              style="width: 120px"
              @change="handleFilter"
            >
              <ScOption label="全部" value="" />
              <ScOption label="启用" value="enabled" />
              <ScOption label="禁用" value="disabled" />
              <ScOption label="同步中" value="syncing" />
              <ScOption label="异常" value="error" />
            </ScSelect>

            <ScButton type="primary" @click="showAddDialog = true">
              <IconifyIconOnline icon="ep:plus" class="mr-1" />
              新增配置
            </ScButton>
            <ScButton @click="refreshConfigs">
              <ScIcon><IconifyIconOnline icon="ep:refresh" /></ScIcon>
            </ScButton>
          </div>
        </div>
      </div>

      <div class="table-content">
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
              <div class="empty-description">
                还没有创建任何视频同步配置，点击上方按钮开始创建
              </div>
              <ScButton 
                type="primary"
                @click="showAddDialog = true"
                class="empty-action"
              >
                <IconifyIconOnline icon="ep:plus" class="mr-2" />
              </ScButton>
            </div>
          </template>

          <!-- 卡片模板 -->
          <template #default="{ row }">
            <ConfigCard
              :config="row"
              @action="handleCommand"
              @copy-url="copyUrl"
            />
          </template>
        </ScTable>
      </div>

      <!-- 新增/编辑配置对话框 -->
      <ConfigForm
        v-model:visible="showAddDialog"
        :config="editingConfig"
        :editing="!!editingConfig"
        @success="handleConfigSuccess"
        @close="resetForm"
      />

      <!-- 同步日志对话框 -->
      <LogViewer
        v-model:visible="showLogsDialog"
        :logs="syncLogs"
        @refresh="refreshLogs"
        @clear="clearLogs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 直接使用IconifyIconOnline组件，无需变量赋值
import ScTable from "@repo/components/ScTable/index.vue";

import { onMounted, onUnmounted, reactive, ref } from "vue";
import {
  deleteSyncConfig,
  executeSyncConfig,
  getSyncConfigs,
  stopSyncTask,
  testSyncConfig,
  toggleSyncConfigStatus,
} from "../../api/config";
import type { VideoSyncConfig } from "../../api/types";

// 导入组件
import ScSocketMessageDialog from "@repo/components/ScSocketMessageDialog/index.vue";
import { useGlobalSocket } from "@repo/core";
import { message , ScMessageBox} from "@repo/utils";
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

// 移除了不再需要的表单相关变量，业务逻辑已移至ConfigForm组件内部

/**
 * 初始化Socket连接
 */
const initSocket = () => {
  if (!socketInstance) {
    return;
  }

  // 监听同步信息（仅用于更新配置列表和统计信息）
  socketInstance.on("/topic/video-sync/global", (data) => {
    const dataObject = JSON.parse(data.data);
    const config = configList.value.find(
      (c) => c.videoSyncConfigId === dataObject.videoSyncConfigId
    );

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
  stats.enabledConfigs = configList.value.filter(
    (c) => c.videoSyncConfigEnable === true
  ).length;
  stats.syncingConfigs = configList.value.filter(
    (c) => c.videoSyncConfigStatus === "PROGRESS"
  ).length;
  stats.errorConfigs = configList.value.filter(
    (c) => c.videoSyncConfigStatus === "ERROR"
  ).length;
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
      message("同步任务已启动", { type: "success" });
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
  ScMessageBox.confirm(
    `确定要停止配置 "${config.videoSyncConfigName}" 的同步任务吗？`,
    "确认停止",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(() => {
      // 用户确认停止
      stopSyncTask(config.videoSyncConfigId!)
        .then(() => {
          // 成功回调，不需要判断code
          message("同步任务已停止", { type: "success" });
          config.videoSyncConfigStatus = "STOP"; // 恢复为启用状态
          updateStats();
          handleSearch();
        })
        .catch((error) => {
          console.error("停止同步任务失败:", error);
          message("停止同步任务失败", { type: "error" });
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
      message(`${enable ? "启用" : "禁用"}成功`, { type: "success" });
      updateStats();
    })
    .catch((error) => {
      console.error(`${enable ? "启用" : "禁用"}配置失败:`, error);
      message(`${enable ? "启用" : "禁用"}配置失败`, { type: "error" });
    });
};

/**
 * 删除配置
 */
const deleteConfig = (config: VideoSyncConfig) => {
  ScMessageBox.confirm(
    `确定要删除配置 "${config.videoSyncConfigName}" 吗？`,
    "确认删除",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(() => {
      // 用户确认删除
      deleteSyncConfig(config.videoSyncConfigId!)
        .then(() => {
          // 成功回调，不需要判断code
          message("删除成功", { type: "success" });
          if (tableRef.value && tableRef.value.refresh) {
            tableRef.value.refresh();
          }
        })
        .catch((error) => {
          console.error("删除配置失败:", error);
          message("删除配置失败", { type: "error" });
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
  message("正在测试连接...", { type: "info" });
  testSyncConfig(config)
    .then(() => {
      // 成功回调，不需要判断code
      message("连接测试成功", { type: "success" });
    })
    .catch((error) => {
      console.error("测试连接失败:", error);
      message("测试连接失败", { type: "error" });
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
      message("URL已复制到剪贴板", { type: "success" });
    })
    .catch((error) => {
      message("复制失败", { type: "error" });
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
  message("日志已清空", { type: "success" });
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

<style scoped lang="scss">
/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.page-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-header-icon {
  font-size: 48px;
  opacity: 0.9;
}

.page-header-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-header-desc {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

/* 表格样式 */
.modern-table {
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  padding: 16px 20px;
}

.table-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-content {
  padding: 20px;
}

/* 卡片容器样式 */
.config-cards {
  width: 100%;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--el-text-color-primary);
}

.empty-icon {
  font-size: 64px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 24px;
  display: inline-block;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  max-width: 400px;
  margin: 0 auto 32px;
}

.empty-action {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

@media (max-width: 768px) {
  .page-header {
    padding: 20px;
  }

  .page-header-content {
    flex-direction: column;
    text-align: center;
  }

  .table-header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .table-title-section {
    justify-content: center;
  }

  .table-actions {
    flex-direction: column;
    gap: 8px;
  }

  .table-actions .el-input,
  .table-actions .el-select {
    width: 100%;
  }

  .table-content {
    padding: 16px;
  }

  .empty-state {
    padding: 40px 16px;
  }
}
</style>

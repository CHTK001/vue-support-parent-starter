<template>
  <div class="sync-container">
    <div class="sync-header">
      <div class="sync-title">
        <IconifyIconOnline icon="ep:connection" class="sync-title-icon" />
        <h2>视频同步管理</h2>
      </div>
      <div class="sync-actions">
        <el-input v-model="queryParams.keyword" placeholder="搜索同步名称" class="sync-search-input" @keyup.enter="handleSearch" clearable>
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </el-input>
        <el-select v-model="queryParams.type" placeholder="同步方式" clearable @change="handleSearch" class="sync-type-select">
          <el-option v-for="option in syncTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
        <el-tooltip content="添加同步配置" placement="top" :enterable="false">
          <el-button type="primary" @click="handleAdd" class="sync-add-btn btn-text">
            <IconifyIconOnline icon="ep:plus" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="刷新列表" placement="top" :enterable="false">
          <el-button @click="handleRefresh" class="btn-text">
            <IconifyIconOnline icon="ep:refresh" />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <div class="sync-content relative">
      <ScTable ref="tableRef" layout="card" :url="getVideoSyncList" :params="queryParams" row-key="syncId" class="sync-table">
        <template #default="{ row }">
          <div class="sync-item-card">
            <div class="sync-item-icon" :style="{ backgroundColor: getRandomColor(row.videoSyncConfigType) }">
              <IconifyIconOnline :icon="getSyncIcon(row.videoSyncConfigType)" class="sync-type-icon" />
            </div>
            <div class="sync-item-info">
              <div class="sync-item-header">
                <h3 class="sync-item-title">{{ row.videoSyncConfigName }}</h3>
                <el-tag :type="row.videoSyncConfigEnabled ? 'success' : 'info'" size="small" effect="light">
                  {{ row.videoSyncConfigEnabled ? "已启用" : "已禁用" }}
                </el-tag>
              </div>
              <div class="sync-item-meta">
                <el-tag size="small" class="sync-type-tag" effect="plain">{{ getSyncTypeName(row.videoSyncConfigType) }}</el-tag>
                <span class="sync-source-tag" v-if="row.videoSyncConfigSource">
                  <IconifyIconOnline icon="ep:platform" />
                  {{ row.videoSyncConfigSource }}
                </span>
              </div>
              <div class="sync-item-details">
                <div class="sync-item-detail">
                  <span class="sync-item-label">同步地址:</span>
                  <span class="sync-item-value sync-url">{{ row.videoSyncConfigUrl }}</span>
                </div>
              </div>
              <div class="sync-item-footer">
                <span class="sync-item-time">
                  <IconifyIconOnline icon="ep:calendar" />
                  {{ formatDateTime(row.createTime) }}
                </span>
                <div class="sync-item-actions">
                  <el-tooltip content="执行同步" placement="top" :enterable="false">
                    <el-button type="primary" size="small" @click="handleExecute(row)" :loading="row.loading">
                      <IconifyIconOnline icon="ep:video-play" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="编辑配置" placement="top" :enterable="false">
                    <el-button type="default" size="small" @click="handleEdit(row)">
                      <IconifyIconOnline icon="ep:edit" />
                    </el-button>
                  </el-tooltip>
                  <el-popconfirm title="确定要删除该同步配置吗?" @confirm="handleDelete(row)">
                    <template #reference>
                      <el-tooltip content="删除配置" placement="top" :enterable="false">
                        <el-button type="danger" size="small">
                          <IconifyIconOnline icon="ep:delete" />
                        </el-button>
                      </el-tooltip>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
            </div>
          </div>
        </template>
      </ScTable>
    </div>

    <!-- 使用拆分出的组件 -->
    <SyncFormDialog v-model:visible="dialogVisible" :isEdit="isEdit" :editId="currentEditId" @refresh="refreshTable" />
  </div>
</template>

<script setup lang="ts">
import { syncTypeOptions } from "./data/syncConfig";
import { deleteVideoSync, executeSyncTask, getVideoSyncList } from "@/api/video";
import { formatDateTime, message } from "@repo/utils";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import SyncFormDialog from "./components/SyncFormDialog.vue";

const router = useRouter();
const tableRef = ref();
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const currentEditId = ref("");

const queryParams = reactive({
  keyword: "",
  type: "",
  pageNum: 1,
  pageSize: 10,
});

// 获取同步类型图标
const getSyncIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    API: "ep:api",
    SPIDER: "ep:spider",
    RSS: "ep:rss",
    CUSTOM: "ep:code",
  };
  return iconMap[type] || "ep:connection";
};

// 获取同步类型名称
const getSyncTypeName = (type: string): string => {
  const nameMap: Record<string, string> = {
    API: "API接口",
    SPIDER: "爬虫",
    RSS: "RSS",
    CUSTOM: "自定义",
  };
  return nameMap[type] || type;
};

// 生成随机颜色
const getRandomColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    API: "var(--el-color-primary)",
    SPIDER: "var(--el-color-success)",
    RSS: "var(--el-color-warning)",
    CUSTOM: "var(--el-color-info)",
  };
  return colorMap[type] || "var(--el-color-primary)";
};

// 格式化额外参数
const formatExtra = (extra: string): string => {
  try {
    const obj = JSON.parse(extra);
    return Object.keys(obj)
      .map((key) => `${key}: ${obj[key]}`)
      .join(", ");
  } catch (e) {
    return extra;
  }
};

// 刷新表格
const refreshTable = async (): Promise<void> => {
  if (tableRef.value) {
    tableRef.value.refresh();
  }
};

// 刷新
const handleRefresh = async (): Promise<void> => {
  queryParams.keyword = "";
  queryParams.type = "";
  refreshTable();
};

// 搜索
const handleSearch = async (): Promise<void> => {
  refreshTable();
};

// 新增同步配置
const handleAdd = async (): Promise<void> => {
  isEdit.value = false;
  currentEditId.value = "";
  dialogVisible.value = true;
};

// 编辑同步配置
const handleEdit = async (row: any): Promise<void> => {
  const id = row.syncId || row.videoSyncConfigId || row.id;
  if (!id) {
    message("配置ID不存在", { type: "error" });
    return;
  }

  isEdit.value = true;
  currentEditId.value = String(id);
  dialogVisible.value = true;
};

// 执行同步
const handleExecute = async (row: any): Promise<void> => {
  const id = row.syncId || row.videoSyncConfigId || row.id;
  if (!id) {
    message("配置ID不存在", { type: "error" });
    return;
  }

  // 设置行的加载状态
  row.loading = true;
  try {
    const res = await executeSyncTask(id);
    if (res?.data?.code === 0) {
      message("同步任务已启动", { type: "success" });
    } else {
      message(res?.data?.message || "启动同步任务失败", { type: "error" });
    }
  } catch (error) {
    console.error("执行同步出错:", error);
    message("启动同步任务失败", { type: "error" });
  } finally {
    row.loading = false;
  }
};

// 删除同步配置
const handleDelete = async (row: any): Promise<void> => {
  const id = row.syncId || row.videoSyncConfigId || row.id;
  if (!id) {
    message("配置ID不存在", { type: "error" });
    return;
  }

  loading.value = true;
  try {
    const res = await deleteVideoSync(id);
    if (res?.data?.code === 0) {
      message("删除成功", { type: "success" });
      refreshTable();
    } else {
      message(res?.data?.message || "删除失败", { type: "error" });
    }
  } catch (error) {
    console.error("删除同步配置出错:", error);
    message("删除失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 生命周期钩子
onMounted(async () => {
  // 初始化加载数据
  refreshTable();
});
</script>

<style scoped>
.sync-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sync-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--el-bg-color);
  padding: 16px 24px;
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}

.sync-header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success), var(--el-color-warning));
}

.sync-title {
  display: flex;
  align-items: center;
}

.sync-title-icon {
  font-size: 24px;
  color: var(--el-color-primary);
  margin-right: 12px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.sync-title h2 {
  margin: 0;
  font-size: 20px;
  color: var(--el-text-color-primary);
  font-weight: 600;
  position: relative;
}

.sync-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sync-search-input {
  width: 240px;
  transition: all 0.3s ease;
}

.sync-search-input:focus-within {
  width: 280px;
  box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
}

.sync-type-select {
  width: 120px;
  transition: all 0.3s ease;
}

.btn-text {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  width: 36px;
  padding: 0;
  transition: all 0.3s ease;
}

.btn-text:hover {
  transform: rotate(15deg);
}

.sync-content {
  border-radius: var(--el-border-radius-base);
  height: calc(100% - 76px);
  background-color: var(--el-bg-color-page);
  padding: 16px;
  position: relative;
}

.sync-table {
  height: 100%;
}

.sync-item-card {
  display: flex;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-large, 10px);
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: var(--el-box-shadow-light);
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  padding: 0;
  position: relative;
}

.sync-item-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--el-box-shadow);
  border-color: var(--el-color-primary-light-7);
}

.sync-item-icon {
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-white);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.sync-item-icon::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.sync-item-card:hover .sync-item-icon::after {
  transform: translateX(100%);
}

.sync-type-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.sync-item-info {
  flex: 1;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
}

.sync-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.sync-item-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  position: relative;
  padding-bottom: 4px;
}

.sync-item-title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 2px;
  background-color: var(--el-color-primary);
  transition: width 0.3s ease;
}

.sync-item-card:hover .sync-item-title::after {
  width: 80px;
}

.sync-item-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.sync-type-tag {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-text-color-primary);
  border: none;
  transition: all 0.3s ease;
}

.sync-item-card:hover .sync-type-tag {
  transform: scale(1.05);
}

.sync-source-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-lighter);
  padding: 2px 8px;
  border-radius: 12px;
}

.sync-item-details {
  margin-bottom: 8px;
  background-color: var(--el-fill-color-light);
  padding: 8px 12px;
  border-radius: var(--el-border-radius-base);
  transition: all 0.3s ease;
}

.sync-item-card:hover .sync-item-details {
  background-color: var(--el-fill-color);
}

.sync-item-detail {
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
}

.sync-item-label {
  font-weight: 500;
  color: var(--el-text-color-secondary);
  width: 80px;
  flex-shrink: 0;
}

.sync-item-value {
  color: var(--el-text-color-primary);
}

.sync-url {
  color: var(--el-color-primary);
  word-break: break-all;
  position: relative;
  transition: all 0.3s ease;
}

.sync-url:hover {
  color: var(--el-color-primary-dark-2);
  text-decoration: underline;
}

.sync-item-extra {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.sync-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
}

.sync-item-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  background-color: var(--el-fill-color-lighter);
  padding: 4px 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.sync-item-card:hover .sync-item-time {
  background-color: var(--el-fill-color);
}

.sync-item-actions {
  display: flex;
  gap: 8px;
}

.sync-item-actions .el-button {
  transition: all 0.3s ease;
}

.sync-item-actions .el-button:hover {
  transform: translateY(-2px);
}
</style>

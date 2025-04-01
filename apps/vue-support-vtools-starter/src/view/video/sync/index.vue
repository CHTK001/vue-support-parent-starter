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
          <el-option label="全部类型" value="" />
          <el-option label="API接口" value="API" />
          <el-option label="爬虫" value="SPIDER" />
          <el-option label="RSS" value="RSS" />
          <el-option label="自定义" value="CUSTOM" />
        </el-select>
        <el-button type="primary" @click="handleAdd" class="sync-add-btn">
          <IconifyIconOnline icon="ep:plus" />
          新增配置
        </el-button>
        <el-button @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" />
        </el-button>
      </div>
    </div>

    <div class="sync-content relative">
      <ScTable ref="tableRef" layout="card" :url="getVideoSyncList" :params="queryParams" row-key="syncId" v-loading="loading" class="sync-table">
        <template #card="{ row }">
          <div class="sync-item-card">
            <div class="sync-item-icon">
              <IconifyIconOnline :icon="getSyncIcon(row.videoSyncConfigType)" class="sync-type-icon" />
            </div>
            <div class="sync-item-info">
              <div class="sync-item-header">
                <h3 class="sync-item-title">{{ row.videoSyncConfigName }}</h3>
                <el-tag :type="row.videoSyncConfigEnabled ? 'success' : 'info'" size="small">
                  {{ row.videoSyncConfigEnabled ? "已启用" : "已禁用" }}
                </el-tag>
              </div>
              <div class="sync-item-meta">
                <el-tag size="small" class="sync-type-tag">{{ getSyncTypeName(row.videoSyncConfigType) }}</el-tag>
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
              <div class="sync-item-extra" v-if="row.videoSyncConfigExtra">
                <span class="sync-item-label">额外参数:</span>
                <span class="sync-item-value">{{ formatExtra(row.videoSyncConfigExtra) }}</span>
              </div>
              <div class="sync-item-footer">
                <span class="sync-item-time">
                  <IconifyIconOnline icon="ep:calendar" />
                  {{ formatDateTime(row.createTime) }}
                </span>
                <div class="sync-item-actions">
                  <el-button type="success" size="small" @click="handleExecute(row)">
                    <IconifyIconOnline icon="ep:video-play" />
                    执行同步
                  </el-button>
                  <el-button type="primary" size="small" @click="handleEdit(row)">
                    <IconifyIconOnline icon="ep:edit" />
                    编辑
                  </el-button>
                  <el-popconfirm title="确定要删除该同步配置吗?" @confirm="handleDelete(row)">
                    <template #reference>
                      <el-button type="danger" size="small">
                        <IconifyIconOnline icon="ep:delete" />
                        删除
                      </el-button>
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
    await tableRef.value.refresh();
  }
};

// 刷新
const handleRefresh = async (): Promise<void> => {
  queryParams.keyword = "";
  queryParams.type = "";
  await refreshTable();
};

// 搜索
const handleSearch = async (): Promise<void> => {
  await refreshTable();
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

  loading.value = true;
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
    loading.value = false;
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
      await refreshTable();
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
  // 页面挂载时可以执行一些初始化操作
});
</script>

<style scoped>
.sync-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  padding: 16px 24px;
  border-radius: 8px;
}

.sync-title {
  display: flex;
  align-items: center;
}

.sync-title-icon {
  font-size: 24px;
  color: #409eff;
  margin-right: 12px;
}

.sync-title h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.sync-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.sync-search-input {
  width: 240px;
  transition: all 0.3s;
}

.sync-search-input:focus-within {
  width: 280px;
}

.sync-type-select {
  width: 120px;
}

.sync-content {
  border-radius: 8px;
  height: calc(100% - 60px);
}

.sync-table {
  height: 100%;
}

.sync-item-card {
  display: flex;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
  padding: 0;
}

.sync-item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.12);
  border-color: #c6e2ff;
}

.sync-item-icon {
  width: 80px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #409eff;
  color: white;
  flex-shrink: 0;
}

.sync-type-icon {
  font-size: 32px;
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
  color: #303133;
  line-height: 1.4;
}

.sync-item-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.sync-type-tag {
  background-color: #ecf5ff;
  color: #409eff;
  border: none;
}

.sync-source-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.sync-item-details {
  margin-bottom: 8px;
}

.sync-item-detail {
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
}

.sync-item-label {
  font-weight: 500;
  color: #606266;
  width: 80px;
  flex-shrink: 0;
}

.sync-item-value {
  color: #303133;
}

.sync-url {
  color: #409eff;
  word-break: break-all;
}

.sync-item-extra {
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.sync-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.sync-item-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.sync-item-actions {
  display: flex;
  gap: 8px;
}
</style>

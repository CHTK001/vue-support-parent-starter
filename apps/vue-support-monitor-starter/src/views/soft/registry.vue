﻿﻿﻿﻿﻿﻿﻿<template>
  <div class="registry-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:database-line" class="title-icon" />
          <span>软件仓库管理</span>
        </div>
        <div class="page-subtitle">配置和管理远程软件镜像仓库地址</div>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" @click="openCreateDialog">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          添加仓库
        </el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-left">
        <el-input v-model="searchParams.keyword" placeholder="搜索仓库名称或地址" class="search-input" clearable @keyup.enter="handleSearch">
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select v-model="searchParams.status" placeholder="状态" clearable class="filter-select" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="正常" value="active" />
          <el-option label="离线" value="offline" />
          <el-option label="错误" value="error" />
        </el-select>
        <el-select v-model="searchParams.type" placeholder="仓库类型" clearable class="filter-select" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="Docker Hub" value="docker_hub" />
          <el-option label="阿里云" value="aliyun" />
          <el-option label="Harbor" value="harbor" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </div>
      <div class="search-right">
        <el-button @click="handleSyncAll" :loading="syncAllLoading" type="success">
          <IconifyIconOnline icon="ri:refresh-2-line" class="mr-1" />
          同步全部
        </el-button>
        <el-button @click="handleBatchDelete" :disabled="selectedIds.length === 0" type="danger">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 仓库表格 -->
    <el-card class="registry-table-card">
      <el-table :data="registryList" stripe v-loading="loading" @selection-change="handleSelectionChange" class="registry-table">
        <el-table-column type="selection" width="55" />

        <el-table-column label="仓库名称" min-width="200">
          <template #default="{ row }">
            <div class="registry-name">
              <IconifyIconOnline :icon="getRegistryIcon(row.type)" class="registry-icon" :style="{ color: getRegistryIconColor(row.type) }" />
              <div>
                <div class="name-text">{{ row.name }}</div>
                <el-tag :type="getRegistryTypeTag(row.type)" size="small">
                  {{ getRegistryTypeText(row.type) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="仓库地址" min-width="300">
          <template #default="{ row }">
            <div class="registry-url">
              <el-link :href="row.url" target="_blank" type="primary">
                {{ row.url }}
              </el-link>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="认证信息" min-width="150">
          <template #default="{ row }">
            <div class="auth-info">
              <el-tag v-if="row.username" type="success" size="small">
                <IconifyIconOnline icon="ri:user-line" class="mr-1" />
                已配置
              </el-tag>
              <el-tag v-else type="info" size="small">
                <IconifyIconOnline icon="ri:user-forbid-line" class="mr-1" />
                公开访问
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="软件数量" width="100" align="center">
          <template #default="{ row }">
            <el-badge :value="row.softwareCount || 0" class="software-count">
              <IconifyIconOnline icon="ri:apps-line" />
            </el-badge>
          </template>
        </el-table-column>

        <el-table-column label="最后同步" min-width="160">
          <template #default="{ row }">
            <div class="sync-info">
              <div v-if="row.lastSyncTime">{{ formatTime(row.lastSyncTime) }}</div>
              <div v-else class="text-gray">从未同步</div>
              <div v-if="row.lastSyncStatus" class="sync-status">
                <el-tag :type="row.lastSyncStatus === 'success' ? 'success' : 'danger'" size="small">
                  {{ row.lastSyncStatus === "success" ? "成功" : "失败" }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" type="success" @click="handleSync(row.id)" :loading="syncLoadingMap[row.id]">
                <IconifyIconOnline icon="ri:refresh-2-line" class="mr-1" />
                同步
              </el-button>
              <el-button size="small" type="info" @click="testConnection(row)">
                <IconifyIconOnline icon="ri:wifi-line" class="mr-1" />
                测试
              </el-button>
              <el-button size="small" @click="openEditDialog(row)">
                <IconifyIconOnline icon="ri:edit-line" class="mr-1" />
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row.id)">
                <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 仓库编辑对话框 -->
    <RegistryDialog v-model:visible="dialogVisible" :registry-data="currentRegistry" @success="handleDialogSuccess" />

    <!-- 同步进度对话框 -->
    <SyncProgressDialog v-model:visible="syncProgressVisible" :progress="syncProgressData" />

    <!-- 批量操作底部工具栏 -->
    <div v-if="selectedIds.length > 0" class="batch-actions">
      <div class="batch-info">已选择 {{ selectedIds.length }} 个仓库</div>
      <el-button @click="clearSelection">取消选择</el-button>
      <el-button type="success" @click="handleBatchSync">批量同步</el-button>
      <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { registryApi, type SystemSoftRegistry } from "@/api/docker-management";
import { ElMessage, ElMessageBox } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import RegistryDialog from "./components/RegistryDialog.vue";
import SyncProgressDialog from "./components/SyncProgressDialog.vue";

/**
 * 软件仓库管理页面组件（重新实现）
 * @author CH
 * @version 2.0.0
 * @since 2025-09-20
 */

// 响应式数据
const loading = ref(false);
const syncAllLoading = ref(false);
const syncLoadingMap = ref({});
const dialogVisible = ref(false);
const syncProgressVisible = ref(false);
const tableRef = ref();
const selectedIds = ref([]);
const registryList = ref<SystemSoftRegistry[]>([]);
const total = ref(0);

// 搜索参数
const searchParams = reactive({
  keyword: "",
  status: "",
  type: "",
  page: 1,
  pageSize: 10,
});

// 当前编辑的仓库
const currentRegistry = ref<SystemSoftRegistry | null>(null);

// 同步进度数据
const syncProgressData = ref({});

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 加载仓库列表
const loadRegistries = async () => {
  try {
    loading.value = true;
    const params = {
      ...searchParams,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };

    // 清空空值参数
    Object.keys(params).forEach((key) => {
      if (params[key] === "" || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await registryApi.pageRegistry(params);
    if (response.code === "00000") {
      registryList.value = response.data.records || [];
      pagination.total = response.data.total || 0;
    } else {
      ElMessage.error(response.msg || "加载仓库列表失败");
    }
  } catch (error) {
    console.error("加载仓库列表失败:", error);
    ElMessage.error("加载仓库列表失败");
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const handleRefresh = () => {
  loadRegistries();
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadRegistries();
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchParams, {
    keyword: "",
    status: "",
    type: "",
  });
  pagination.page = 1;
  loadRegistries();
};

// 打开创建对话框
const openCreateDialog = () => {
  currentRegistry.value = null;
  dialogVisible.value = true;
};

// 打开编辑对话框
const openEditDialog = (registry: SystemSoftRegistry) => {
  currentRegistry.value = { ...registry };
  dialogVisible.value = true;
};

// 对话框成功回调
const handleDialogSuccess = () => {
  loadRegistries();
  ElMessage.success("操作成功");
};

// 同步单个仓库
const handleSync = async (registryId: number) => {
  syncLoadingMap.value[registryId] = true;

  try {
    const response = await registryApi.syncRegistry(registryId);

    if (response.code === "00000") {
      // 显示同步进度对话框
      syncProgressData.value = {
        registryId,
        operationId: response.data.operationId,
        title: "同步仓库软件信息",
        type: "registry_sync",
      };
      syncProgressVisible.value = true;
      ElMessage.success("开始同步");
    } else {
      ElMessage.error(response.msg || "同步失败");
    }
  } catch (error) {
    console.error("同步仓库失败:", error);
    ElMessage.error("同步失败");
  } finally {
    syncLoadingMap.value[registryId] = false;
  }
};

// 同步全部仓库
const handleSyncAll = async () => {
  syncAllLoading.value = true;

  try {
    const response = await registryApi.syncAllRegistries();

    if (response.code === "00000") {
      syncProgressData.value = {
        operationId: response.data.operationId,
        title: "同步全部仓库",
        type: "registry_sync_all",
      };
      syncProgressVisible.value = true;
      ElMessage.success("开始同步全部仓库");
    } else {
      ElMessage.error(response.msg || "同步失败");
    }
  } catch (error) {
    console.error("同步全部仓库失败:", error);
    ElMessage.error("同步失败");
  } finally {
    syncAllLoading.value = false;
  }
};

// 测试仓库连接
const testConnection = async (registry: SystemSoftRegistry) => {
  try {
    const response = await registryApi.testRegistryConnection({
      url: registry.url!,
      username: registry.username,
      password: registry.password,
    });

    if (response.code === "00000" && response.data.success) {
      ElMessage.success("连接测试成功");
    } else {
      ElMessage.error(response.data?.message || "连接测试失败");
    }
  } catch (error) {
    console.error("测试连接失败:", error);
    ElMessage.error("连接测试失败");
  }
};

// 删除仓库
const handleDelete = async (registryId: number) => {
  try {
    await ElMessageBox.confirm("删除仓库将同时删除相关的软件信息，此操作不可恢复。确认继续？", "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const response = await registryApi.deleteRegistry(registryId);

    if (response.code === "00000") {
      ElMessage.success("删除成功");
      loadRegistries();
    } else {
      ElMessage.error(response.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除仓库失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 批量同步
const handleBatchSync = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning("请选择要同步的仓库");
    return;
  }

  try {
    const response = await registryApi.batchSyncRegistries(selectedIds.value);

    if (response.code === "00000") {
      syncProgressData.value = {
        registryIds: selectedIds.value,
        operationId: response.data.operationId,
        title: "批量同步仓库",
        type: "registry_batch_sync",
      };
      syncProgressVisible.value = true;
      ElMessage.success("开始批量同步");
      clearSelection();
    } else {
      ElMessage.error(response.msg || "批量同步失败");
    }
  } catch (error) {
    console.error("批量同步失败:", error);
    ElMessage.error("批量同步失败");
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning("请选择要删除的仓库");
    return;
  }

  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 个仓库？此操作不可恢复。`, "确认批量删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const response = await registryApi.batchDeleteRegistries(selectedIds.value);

    if (response.code === "00000") {
      ElMessage.success("批量删除成功");
      loadRegistries();
      clearSelection();
    } else {
      ElMessage.error(response.msg || "批量删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error);
      ElMessage.error("批量删除失败");
    }
  }
};

// 选择变化处理
const handleSelectionChange = (selection: SystemSoftRegistry[]) => {
  selectedIds.value = selection.map((item) => item.id!);
};

// 清除选择
const clearSelection = () => {
  selectedIds.value = [];
};

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadRegistries();
};

const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadRegistries();
};

// 工具函数
const getRegistryIcon = (type?: string) => {
  const iconMap = {
    docker_hub: "ri:docker-line",
    aliyun: "ri:cloud-line",
    harbor: "ri:ship-line",
    custom: "ri:settings-3-line",
  };
  return iconMap[type] || "ri:database-line";
};

const getRegistryIconColor = (type?: string) => {
  const colorMap = {
    docker_hub: "#2496ED",
    aliyun: "#FF6A00",
    harbor: "#60B2FF",
    custom: "#67C23A",
  };
  return colorMap[type] || "#409EFF";
};

const getRegistryTypeTag = (type?: string) => {
  const tagMap = {
    docker_hub: "primary",
    aliyun: "success",
    harbor: "info",
    custom: "warning",
  };
  return tagMap[type] || "info";
};

const getRegistryTypeText = (type?: string) => {
  const textMap = {
    docker_hub: "Docker Hub",
    aliyun: "阿里云",
    harbor: "Harbor",
    custom: "自定义",
  };
  return textMap[type] || "未知";
};

const getStatusTag = (status?: string) => {
  const tagMap = {
    active: "success",
    offline: "info",
    error: "danger",
  };
  return tagMap[status] || "info";
};

const getStatusText = (status?: string) => {
  const textMap = {
    active: "正常",
    offline: "离线",
    error: "错误",
  };
  return textMap[status] || "未知";
};

const formatTime = (time?: string) => {
  return time ? new Date(time).toLocaleString() : "-";
};

// 生命周期
onMounted(() => {
  loadRegistries();
});
</script>

<style scoped>
.registry-management {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left .page-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.title-icon {
  margin-right: 8px;
  color: #409eff;
}

.page-subtitle {
  color: #6c757d;
  margin-top: 4px;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-left {
  display: flex;
  gap: 12px;
}

.search-right {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 120px;
}

.registry-table-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.registry-table {
  width: 100%;
}

.registry-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.registry-icon {
  font-size: 18px;
}

.name-text {
  font-weight: 500;
  margin-bottom: 4px;
  color: #303133;
}

.registry-url {
  word-break: break-all;
}

.auth-info,
.sync-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sync-status {
  margin-top: 2px;
}

.text-gray {
  color: #999;
  font-size: 12px;
}

.software-count {
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  border-top: 1px solid #f0f2f5;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.batch-info {
  color: #409eff;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .search-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-left {
    flex-direction: column;
    gap: 8px;
  }

  .search-right {
    justify-content: center;
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .registry-management {
    padding: 8px;
  }

  .page-header {
    padding: 12px;
  }

  .search-bar {
    padding: 12px;
  }

  .batch-actions {
    flex-direction: column;
    gap: 8px;
    width: calc(100% - 16px);
    transform: translateX(-50%);
  }
}
</style>

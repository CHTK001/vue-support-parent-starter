<template>
  <div class="images-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:image-line" class="title-icon" />
          <span>镜像管理</span>
        </div>
        <div class="page-subtitle">管理Docker镜像的拉取、启动和删除</div>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" @click="openPullDialog">
          <IconifyIconOnline icon="ri:download-line" class="mr-1" />
          拉取镜像
        </el-button>
      </div>
    </div>

    <!-- 搜索�?-->
    <div class="search-bar">
      <div class="search-left">
        <el-input v-model="searchParams.keyword" placeholder="搜索镜像名称或标�? class="search-input" clearable @keyup.enter="handleSearch">
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select v-model="searchParams.serverId" placeholder="服务�? clearable class="filter-select" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option v-for="server in serverOptions" :key="server.id" :label="server.name" :value="server.id" />
        </el-select>
        <el-select v-model="searchParams.status" placeholder="状�? clearable class="filter-select" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="可用" value="available" />
          <el-option label="拉取�? value="pulling" />
          <el-option label="错误" value="error" />
        </el-select>
      </div>
      <div class="search-right">
        <el-button @click="handleSyncAll" :loading="syncLoading" type="success">
          <IconifyIconOnline icon="ri:refresh-2-line" class="mr-1" />
          同步状�?
        </el-button>
        <el-button @click="handleBatchDelete" :disabled="selectedIds.length === 0" type="danger">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 镜像表格 -->
    <el-card class="images-table-card">
      <ScTable
        :url="imageApi.getImagePageList"
        :params="searchParams"
        stripe
        :loading="loading"
        @selection-change="handleSelectionChange"
        class="images-table"
        table-name="soft-images"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="镜像名称" min-width="200">
          <template #default="{ row }">
            <div class="image-info">
              <div class="image-name">{{ row.systemSoftImageName }}</div>
              <div class="image-tag">{{ row.systemSoftImageTag }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="完整名称" min-width="300">
          <template #default="{ row }">
            <div class="image-full-name">
              {{ row.systemSoftImageFullName || `${row.systemSoftImageName}:${row.systemSoftImageTag}` }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="服务�? width="180">
          <template #default="{ row }">
            <div class="server-info">
              <div class="server-name">{{ row.systemSoftImageServerName }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状�? width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.systemSoftImageStatus)" size="small">
              {{ getStatusText(row.systemSoftImageStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="大小" width="120">
          <template #default="{ row }">
            {{ formatSize(row.systemSoftImageSize) }}
          </template>
        </el-table-column>

        <el-table-column label="架构" width="100">
          <template #default="{ row }">
            {{ row.systemSoftImageArchitecture || "-" }}
          </template>
        </el-table-column>

        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.systemSoftImageCreated) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" type="primary" @click="openStartDialog(row)" :disabled="row.systemSoftImageStatus !== 'available'">
                <IconifyIconOnline icon="ri:play-line" class="mr-1" />
                启动
              </el-button>
              <el-button size="small" @click="viewImageDetail(row)">
                <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
                详情
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row.systemSoftImageId)">
                <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 拉取镜像对话�?-->
    <PullImageDialog v-model:visible="pullDialogVisible" @success="handleDialogSuccess" />

    <!-- 启动容器对话�?-->
    <StartContainerDialog v-model:visible="startDialogVisible" :image-data="currentImage" @success="handleDialogSuccess" />

    <!-- 批量操作底部工具�?-->
    <div v-if="selectedIds.length > 0" class="batch-actions">
      <div class="batch-info">已选择 {{ selectedIds.length }} 个镜�?/div>
      <el-button @click="clearSelection">取消选择</el-button>
      <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getServerList, imageApi, type SystemSoftImage } from "@/api/docker";
import ScTable from "@repo/components/ScTable/index.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import PullImageDialog from "./components/PullImageDialog.vue";
import StartContainerDialog from "./components/StartContainerDialog.vue";

// 响应式数�?
const loading = ref(false);
const syncLoading = ref(false);
const selectedIds = ref<number[]>([]);
const serverOptions = ref<any[]>([]);
const pullDialogVisible = ref(false);
const startDialogVisible = ref(false);
const currentImage = ref<SystemSoftImage | null>(null);

// 搜索参数
const searchParams = reactive({
  keyword: "",
  serverId: "",
  status: "",
  size: 10,
  page: 1
});

// 基础方法
const handleRefresh = () => {
  // ScTable会自动刷新数�?
};
const handleSearch = () => {
  // ScTable会自动根据搜索参数刷新数�?
};
const handleSelectionChange = (selection: SystemSoftImage[]) => {
  selectedIds.value = selection.map((item) => item.systemSoftImageId!);
};
const clearSelection = () => {
  selectedIds.value = [];
};

// 工具函数
const getStatusTag = (status?: string) => {
  const map = { available: "success", pulling: "warning", error: "danger" };
  return map[status] || "info";
};

const getStatusText = (status?: string) => {
  const map = { available: "可用", pulling: "拉取�?, error: "错误" };
  return map[status] || "未知";
};

const formatSize = (size?: number) => {
  if (!size) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0,
    s = size;
  while (s >= 1024 && i < 3) {
    s /= 1024;
    i++;
  }
  return `${s.toFixed(2)} ${units[i]}`;
};

const formatTime = (time?: string) => (time ? new Date(time).toLocaleString() : "-");

// 操作方法
const openPullDialog = () => {
  pullDialogVisible.value = true;
};

const openStartDialog = (image: SystemSoftImage) => {
  currentImage.value = image;
  startDialogVisible.value = true;
};

const viewImageDetail = (image: SystemSoftImage) => {
  ElMessage.info("镜像详情功能开发中...");
};

const handleDelete = async (imageId: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个镜像吗�?, "删除确认", {
      type: "warning",
    });

    const response = await imageApi.deleteImage(imageId);
    if (response.code === "00000" || response.success) {
      ElMessage.success("删除成功");
      // ScTable会自动刷新数�?
    } else {
      ElMessage.error(response.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除镜像失败");
    }
  }
};

const handleSyncAll = async () => {
  try {
    syncLoading.value = true;
    const response = await imageApi.syncImageStatus();
    if (response.code === "00000" || response.success) {
      ElMessage.success("同步状态成�?);
      // ScTable会自动刷新数�?
    } else {
      ElMessage.error(response.msg || "同步失败");
    }
  } catch (error) {
    ElMessage.error("同步镜像状态失�?);
  } finally {
    syncLoading.value = false;
  }
};

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning("请选择要删除的镜像");
    return;
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中�?${selectedIds.value.length} 个镜像吗？`, "批量删除确认", {
      type: "warning",
    });

    const response = await imageApi.batchDeleteImages(selectedIds.value);
    if (response.code === "00000" || response.success) {
      ElMessage.success("批量删除成功");
      selectedIds.value = [];
      // ScTable会自动刷新数�?
    } else {
      ElMessage.error(response.msg || "批量删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("批量删除镜像失败");
    }
  }
};

const handleDialogSuccess = () => {
  // ScTable会自动刷新数�?
};

// 加载服务器列�?
const loadServers = async () => {
  try {
    const response = await getServerList();
    if (response.code === "00000" || response.success) {
      serverOptions.value = response.data || [];
    } else {
      ElMessage.error(response.msg || "加载服务器列表失�?);
    }
  } catch (error) {
    console.error("加载服务器列表失�?", error);
    ElMessage.error("加载服务器列表失�?);
  }
};

onMounted(() => {
  loadServers();
});
</script>

<style scoped>
.images-management {
  padding: 20px;
  background: var(--app-bg-secondary);
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.title-icon {
  margin-right: 8px;
  color: var(--app-primary);
}

.page-subtitle {
  color: var(--app-text-secondary);
  margin-top: 8px;
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
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
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

.images-table-card {
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-name {
  font-weight: 500;
  color: var(--app-text-primary);
}

.image-tag {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.image-full-name {
  font-family: monospace;
  font-size: 12px;
  color: var(--app-text-secondary);
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.server-name {
  font-weight: 500;
  color: var(--app-text-primary);
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
  z-index: 1000;
}

.batch-info {
  color: var(--app-link);
  font-weight: 500;
}
</style>
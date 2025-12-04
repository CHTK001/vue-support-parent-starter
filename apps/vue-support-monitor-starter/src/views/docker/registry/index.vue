<template>
  <div class="registry-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <IconifyIconOnline icon="ri:database-line" class="title-icon" />
        <span>软件仓库管理</span>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-left">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索仓库名称或地址"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="searchParams.status"
          placeholder="状态"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="正常" value="active" />
          <el-option label="离线" value="offline" />
          <el-option label="错误" value="error" />
        </el-select>
        <el-select
          v-model="searchParams.type"
          placeholder="仓库类型"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="Docker Hub" value="docker_hub" />
          <el-option label="阿里云" value="aliyun" />
          <el-option label="Harbor" value="harbor" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </div>
      <div class="search-right">
        <el-button
          type="primary"
          circle
          :disabled="!canCreate"
          :title="canCreate ? '添加仓库' : '仅支持一个仓库'"
          @click="openCreateDialog"
        >
          <IconifyIconOnline icon="ri:add-line" />
        </el-button>
        <el-button
          @click="handleBatchDelete"
          :disabled="selectedIds.length === 0"
          type="danger"
          circle
          title="批量删除"
        >
          <IconifyIconOnline icon="ri:delete-bin-line" />
        </el-button>
      </div>
    </div>

    <!-- 仓库卡片 -->
    <ScTable
      ref="tableRef"
      :key="tableKey"
      :url="registryApi.pageRegistry"
      :params="searchParams"
      row-key="systemSoftRegistryId"
      layout="card"
      :col-size="3"
      :row-size="2"
      :page-size="6"
      table-name="docker-registry"
    >
      <template #default="{ row }">
        <div
          class="registry-card"
          :class="{
            'registry-card--disabled': row.systemSoftRegistryStatus !== 1,
          }"
        >
          <!-- 卡片头部 -->
          <div class="registry-card-header">
            <div
              class="registry-card-logo"
              :style="{
                background: getRegistryGradient(row.systemSoftRegistryType),
              }"
            >
              <IconifyIconOnline
                :icon="getRegistryIcon(row.systemSoftRegistryType)"
                class="logo-icon"
              />
            </div>
            <div class="registry-card-info">
              <div class="registry-card-title">
                <span class="name">{{ row.systemSoftRegistryName }}</span>
              </div>
              <el-tag
                :type="getRegistryTypeTag(row.systemSoftRegistryType)"
                size="small"
                effect="plain"
              >
                {{ getRegistryTypeText(row.systemSoftRegistryType) }}
              </el-tag>
            </div>
            <div class="registry-card-status">
              <el-switch
                :model-value="row.systemSoftRegistryStatus === 1"
                size="small"
                @change="(val: boolean) => handleToggleStatus(row, val)"
              />
            </div>
          </div>

          <!-- 仓库地址 -->
          <div class="registry-url-box">
            <div class="url-label">
              <IconifyIconOnline icon="ri:global-line" />
              仓库地址
            </div>
            <el-link
              :href="row.systemSoftRegistryUrl"
              target="_blank"
              type="primary"
              class="url-link"
            >
              {{ row.systemSoftRegistryUrl }}
            </el-link>
          </div>

          <!-- 状态信息 -->
          <div class="registry-stats">
            <div class="stat-item">
              <IconifyIconOnline icon="ri:shield-user-line" />
              <span v-if="row.systemSoftRegistryUsername">已配置认证</span>
              <span v-else class="text-muted">公开访问</span>
            </div>
            <div
              class="stat-item"
              v-if="row.systemSoftRegistrySupportSync === 1"
            >
              <IconifyIconOnline icon="ri:refresh-line" />
              <span>支持同步</span>
            </div>
            <div class="stat-item">
              <IconifyIconOnline icon="ri:time-line" />
              <span v-if="row.systemSoftRegistryLastConnectTime">{{
                formatTime(row.systemSoftRegistryLastConnectTime)
              }}</span>
              <span v-else class="text-muted">从未连接</span>
            </div>
          </div>

          <!-- 连接状态指示 -->
          <div
            class="registry-connect-status"
            v-if="row.systemSoftRegistryConnectStatus != null"
          >
            <div
              class="connect-dot"
              :class="
                row.systemSoftRegistryConnectStatus === 1 ? 'success' : 'error'
              "
            ></div>
            <span>{{
              row.systemSoftRegistryConnectStatus === 1
                ? "连接正常"
                : "连接失败"
            }}</span>
          </div>

          <!-- 操作按钮 -->
          <div class="registry-actions">
            <el-button
              size="small"
              @click="openEditDialog(row)"
              class="action-btn"
            >
              <IconifyIconOnline icon="ri:edit-line" class="mr-1" />编辑
            </el-button>
            <el-button
              size="small"
              type="info"
              plain
              @click="testConnection(row)"
              class="action-btn"
            >
              <IconifyIconOnline icon="ri:wifi-line" class="mr-1" />测试
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              @click="handleDelete(row.systemSoftRegistryId)"
              class="action-btn"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />删除
            </el-button>
          </div>
        </div>
      </template>
    </ScTable>

    <!-- 仓库编辑对话框 -->
    <RegistryDialog
      v-model:visible="dialogVisible"
      :registry-data="currentRegistry"
      @success="handleDialogSuccess"
    />

    <!-- 同步进度对话框 -->
    <SyncProgressDialog
      v-model:visible="syncProgressVisible"
      :progress="syncProgressData"
    />

    <!-- 批量操作底部工具栏 -->
    <div v-if="selectedIds.length > 0" class="batch-actions">
      <div class="batch-info">已选择 {{ selectedIds.length }} 个仓库</div>
      <el-button circle title="取消选择" @click="clearSelection">
        <IconifyIconOnline icon="ri:close-line" />
      </el-button>
      <el-button
        type="success"
        circle
        title="批量同步"
        @click="handleBatchSync"
      >
        <IconifyIconOnline icon="ri:refresh-2-line" />
      </el-button>
      <el-button
        type="danger"
        circle
        title="批量删除"
        @click="handleBatchDelete"
      >
        <IconifyIconOnline icon="ri:delete-bin-line" />
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { registryApi, type SystemSoftRegistry } from "@/api/docker";
import ScTable from "@repo/components/ScTable/index.vue";
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
const syncLoadingMap = ref<Record<number, boolean>>({});
const dialogVisible = ref(false);
const syncProgressVisible = ref(false);
const tableRef = ref();
const tableKey = ref(0);
const selectedIds = ref<number[]>([]);
const registryList = ref<SystemSoftRegistry[]>([]);
const total = ref(0);
// 仅支持单仓库：当存在仓库时禁用新增
const canCreate = ref(true);

// 搜索参数
const searchParams = reactive({
  keyword: "",
  status: "",
  type: "",
  page: 1,
  size: 10,
});

// 当前编辑的仓库
const currentRegistry = ref<SystemSoftRegistry | null>(null);

// 同步进度数据
const syncProgressData = ref({});

// 分页参数
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

// 刷新表格
const loadRegistries = async () => {
  tableKey.value++;
  await refreshCreateAbility();
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

// 计算是否允许新增（仅支持一个仓库）
const refreshCreateAbility = async () => {
  try {
    const res = await registryApi.getAllRegistries();
    if (res.code === "00000") {
      const list = res.data || [];
      canCreate.value = list.length === 0;
    }
  } catch (e) {
    canCreate.value = true;
  }
};

// 打开创建对话框
const openCreateDialog = async () => {
  await refreshCreateAbility();
  if (!canCreate.value) {
    // 若已有仓库，直接打开编辑第一个仓库
    try {
      const res = await registryApi.getAllRegistries();
      const list = res.code === "00000" ? res.data || [] : [];
      if (list.length > 0) {
        currentRegistry.value = list[0] as any;
        dialogVisible.value = true;
        return;
      }
    } catch {}
  }
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
        //@ts-ignore
        operationId: response.data?.operationId,
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
const handleSyncSelected = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning("请选择要同步的仓库");
    return;
  }
  syncAllLoading.value = true;
  try {
    for (const id of selectedIds.value) {
      await registryApi.syncRegistry(id);
    }
    ElMessage.success("已提交同步请求");
  } catch (e) {
    ElMessage.error("批量同步失败");
  } finally {
    syncAllLoading.value = false;
  }
};

// 测试仓库连接
const testConnection = async (registry: SystemSoftRegistry) => {
  try {
    const response = await registryApi.testRegistryConnection(
      registry.systemSoftRegistryId!
    );
    if (response.code === "00000" && response.data) {
      ElMessage.success(response.msg || "连接测试成功");
    } else {
      ElMessage.error(response.msg || "连接测试失败");
    }
  } catch (error) {
    console.error("测试连接失败:", error);
    ElMessage.error("连接测试失败");
  }
};

// 删除仓库
const handleDelete = async (registryId: number) => {
  try {
    await ElMessageBox.confirm(
      "删除仓库将同时删除相关的软件信息，此操作不可恢复。确认继续？",
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

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
    for (const id of selectedIds.value) {
      await registryApi.syncRegistry(id);
    }
    ElMessage.success("批量同步请求已提交");
    clearSelection();
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
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedIds.value.length} 个仓库？此操作不可恢复。`,
      "确认批量删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

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
  selectedIds.value = selection.map((item) => item.systemSoftRegistryId!);
};

// 清除选择
const clearSelection = () => {
  selectedIds.value = [];
};

// 分页变化

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

// 获取仓库渐变背景
const getRegistryGradient = (type?: string) => {
  const gradientMap = {
    docker_hub: "linear-gradient(135deg, #2496ED 0%, #1a7bc9 100%)",
    aliyun: "linear-gradient(135deg, #FF6A00 0%, #e55a00 100%)",
    harbor: "linear-gradient(135deg, #60B2FF 0%, #4a9ee6 100%)",
    custom: "linear-gradient(135deg, #67C23A 0%, #52a02e 100%)",
  };
  return (
    gradientMap[type] || "linear-gradient(135deg, #409EFF 0%, #337ecc 100%)"
  );
};

// 切换启用状态
const handleToggleStatus = async (
  row: SystemSoftRegistry,
  enabled: boolean
) => {
  try {
    const payload = { ...row, systemSoftRegistryStatus: enabled ? 1 : 0 };
    const res = await registryApi.updateRegistry(
      row.systemSoftRegistryId!,
      payload
    );
    if (res.code === "00000") {
      ElMessage.success(enabled ? "已启用" : "已禁用");
      loadRegistries();
    } else {
      ElMessage.error(res.msg || "操作失败");
    }
  } catch (e) {
    ElMessage.error("操作失败");
  }
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

const getRowStatus = (row: SystemSoftRegistry) => {
  if (row.systemSoftRegistryConnectStatus === 2) return "error";
  if (row.systemSoftRegistryStatus === 1) return "active";
  return "offline";
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
  // Global Socket已在App层面初始化
  loadRegistries();
});
</script>

<style scoped>
.registry-management {
  padding: 20px;
  background: var(--app-bg-secondary);
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.title-icon {
  margin-right: 8px;
  color: var(--app-primary);
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

/* 卡片样式 */
.registry-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--app-card-bg);
  border: 1px solid var(--app-card-border);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}

.registry-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
  border-color: var(--el-color-primary-light-5);
}

.registry-card--disabled {
  opacity: 0.6;
}

.registry-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.registry-card-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.registry-card-logo .logo-icon {
  font-size: 24px;
  color: #fff;
}

.registry-card-info {
  flex: 1;
  min-width: 0;
}

.registry-card-title {
  margin-bottom: 4px;
}

.registry-card-title .name {
  font-weight: 600;
  font-size: 16px;
  color: var(--app-text-primary);
}

.registry-card-status {
  flex-shrink: 0;
}

.registry-url-box {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 10px 12px;
}

.registry-url-box .url-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--app-text-tertiary);
  margin-bottom: 4px;
}

.registry-url-box .url-link {
  font-size: 13px;
  word-break: break-all;
}

.registry-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--app-text-secondary);
}

.stat-item .text-muted {
  color: var(--app-text-tertiary);
}

.registry-connect-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.connect-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.connect-dot.success {
  background: var(--el-color-success);
  box-shadow: 0 0 6px var(--el-color-success);
}

.connect-dot.error {
  background: var(--el-color-danger);
  box-shadow: 0 0 6px var(--el-color-danger);
}

.registry-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.action-btn {
  flex: 1;
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

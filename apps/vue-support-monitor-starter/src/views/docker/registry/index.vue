<template>
  <div class="registry-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:database-line" class="title-icon" />
          <span>镜像源配置</span>
        </div>
        <div class="page-subtitle">配置Docker镜像仓库用于检索软件</div>
      </div>
      <div class="header-right">
        <el-tooltip content="刷新" placement="top">
          <el-button circle @click="loadRegistries">
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip
          :content="canCreate ? '添加仓库' : '仅支持一个仓库'"
          placement="top"
        >
          <el-button
            type="primary"
            circle
            :disabled="!canCreate"
            @click="openCreateDialog"
          >
            <IconifyIconOnline icon="ri:add-line" />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 仓库列表 - 简洁表格模式 -->
    <ScTable
      ref="tableRef"
      :key="tableKey"
      :url="registryApi.pageRegistry"
      :params="searchParams"
      row-key="systemSoftRegistryId"
      layout="card"
      :col-size="4"
      :row-size="2"
      :page-size="4"
      table-name="docker-registry"
    >
      <template #default="{ row }">
        <div class="card-wrapper">
          <el-card
            class="registry-card"
            :class="{ 'is-disabled': row.systemSoftRegistryStatus !== 1 }"
            shadow="never"
          >
            <!-- 状态指示条 -->
            <div
              class="status-bar"
              :class="
                row.systemSoftRegistryStatus === 1 ? 'active' : 'inactive'
              "
            ></div>

            <!-- 卡片头部 -->
            <div class="card-header">
              <div
                class="icon-box"
                :style="{
                  background: getRegistryGradient(row.systemSoftRegistryType),
                }"
              >
                <IconifyIconOnline
                  :icon="getRegistryIcon(row.systemSoftRegistryType)"
                />
              </div>
              <div class="title-section">
                <h3 class="name">{{ row.systemSoftRegistryName }}</h3>
                <el-tag
                  :type="getRegistryTypeTag(row.systemSoftRegistryType)"
                  size="small"
                  effect="light"
                >
                  {{ getRegistryTypeText(row.systemSoftRegistryType) }}
                </el-tag>
              </div>
              <el-switch
                :model-value="row.systemSoftRegistryStatus === 1"
                size="small"
                @change="(val: boolean) => handleToggleStatus(row, val)"
              />
            </div>

            <!-- 仓库信息 -->
            <div class="card-body">
              <div class="info-row">
                <IconifyIconOnline icon="ri:global-line" class="info-icon" />
                <el-link
                  :href="row.systemSoftRegistryUrl"
                  target="_blank"
                  type="primary"
                  class="url-link"
                  >{{ row.systemSoftRegistryUrl }}</el-link
                >
              </div>
              <div class="info-row">
                <IconifyIconOnline
                  icon="ri:shield-user-line"
                  class="info-icon"
                />
                <span class="info-text">{{
                  row.systemSoftRegistryUsername ? "已配置认证" : "公开访问"
                }}</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="card-actions">
              <el-tooltip content="编辑" placement="top">
                <el-button size="small" circle @click="openEditDialog(row)"
                  ><IconifyIconOnline icon="ri:edit-line"
                /></el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button
                  size="small"
                  circle
                  type="danger"
                  plain
                  @click="handleDelete(row.systemSoftRegistryId)"
                  ><IconifyIconOnline icon="ri:delete-bin-line"
                /></el-button>
              </el-tooltip>
            </div>
          </el-card>
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
  </div>
</template>

<script setup lang="ts">
import { registryApi, type SystemSoftRegistry } from "@/api/docker";
import ScTable from "@repo/components/ScTable/index.vue";
import { message, messageBox } from "@repo/utils";
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
  message.success("操作成功");
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
      message.success("开始同步");
    } else {
      message.error(response.msg || "同步失败");
    }
  } catch (error) {
    console.error("同步仓库失败:", error);
    message.error("同步失败");
  } finally {
    syncLoadingMap.value[registryId] = false;
  }
};

// 同步全部仓库
const handleSyncSelected = async () => {
  if (selectedIds.value.length === 0) {
    message.warning("请选择要同步的仓库");
    return;
  }
  syncAllLoading.value = true;
  try {
    for (const id of selectedIds.value) {
      await registryApi.syncRegistry(id);
    }
    message.success("已提交同步请求");
  } catch (e) {
    message.error("批量同步失败");
  } finally {
    syncAllLoading.value = false;
  }
};

// 删除仓库
const handleDelete = async (registryId: number) => {
  try {
    await messageBox.confirm(
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
      message.success("删除成功");
      loadRegistries();
    } else {
      message.error(response.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除仓库失败:", error);
      message.error("删除失败");
    }
  }
};

// 批量同步
const handleBatchSync = async () => {
  if (selectedIds.value.length === 0) {
    message.warning("请选择要同步的仓库");
    return;
  }
  try {
    for (const id of selectedIds.value) {
      await registryApi.syncRegistry(id);
    }
    message.success("批量同步请求已提交");
    clearSelection();
  } catch (error) {
    console.error("批量同步失败:", error);
    message.error("批量同步失败");
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    message.warning("请选择要删除的仓库");
    return;
  }

  try {
    await messageBox.confirm(
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
      message.success("批量删除成功");
      loadRegistries();
      clearSelection();
    } else {
      message.error(response.msg || "批量删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error);
      message.error("批量删除失败");
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
      message.success(enabled ? "已启用" : "已禁用");
      loadRegistries();
    } else {
      message.error(res.msg || "操作失败");
    }
  } catch (e) {
    message.error("操作失败");
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
  loadRegistries();
});
</script>

<style scoped>
.registry-management {
  padding: 20px;
  background: var(--app-bg-secondary);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-left .page-title {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 600;
}

.title-icon {
  margin-right: 8px;
  color: var(--el-color-primary);
}

.page-subtitle {
  color: var(--app-text-secondary);
  font-size: 12px;
  margin-top: 4px;
}

.header-right {
  display: flex;
  gap: 8px;
}

/* 卡片包装器 */
.card-wrapper {
  height: 100%;
  transition: transform 0.25s ease;
}

.card-wrapper:hover {
  transform: translateY(-4px);
}

/* 卡片样式 - 参考 data-management */
.registry-card {
  position: relative;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.25s ease;
  background: var(--el-bg-color);
}

.registry-card :deep(.el-card__body) {
  padding: 0;
}

.registry-card.el-card {
  border: 1px solid var(--el-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.registry-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.registry-card.is-disabled {
  opacity: 0.5;
}

/* 状态指示条 */
.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.status-bar.active {
  background: linear-gradient(90deg, #10b981, #059669);
}

.status-bar.inactive {
  background: linear-gradient(90deg, #9ca3af, #6b7280);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 12px;
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  flex-shrink: 0;
}

.title-section {
  flex: 1;
  min-width: 0;
}

.title-section .name {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 卡片内容 */
.card-body {
  padding: 0 16px 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-icon {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

.url-link {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-text {
  color: var(--el-text-color-secondary);
}

/* 操作按钮 */
.card-actions {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-extra-light);
  background: var(--el-fill-color-lighter);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>

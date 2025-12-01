<template>
  <div class="registry-management">
    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">
            <IconifyIconOnline icon="ri:database-2-line" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ registryList.length }}</div>
            <div class="stat-label">仓库总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">
            <IconifyIconOnline icon="ri:checkbox-circle-line" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ activeCount }}</div>
            <div class="stat-label">已激活</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon online">
            <IconifyIconOnline icon="ri:wifi-line" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ onlineCount }}</div>
            <div class="stat-label">连接正常</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon error">
            <IconifyIconOnline icon="ri:error-warning-line" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ errorCount }}</div>
            <div class="stat-label">连接异常</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-section">
      <div class="toolbar-left">
        <el-input v-model="searchParams.keyword" placeholder="搜索仓库名称或地址" class="search-input" clearable @keyup.enter="handleSearch">
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select v-model="searchParams.type" placeholder="仓库类型" clearable class="filter-select" @change="handleSearch">
          <el-option label="全部类型" value="" />
          <el-option label="Docker Hub" value="docker_hub" />
          <el-option label="阿里云" value="aliyun" />
          <el-option label="Harbor" value="harbor" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button @click="loadRegistries">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" @click="openCreateDialog">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          添加仓库
        </el-button>
      </div>
    </div>

    <!-- 仓库卡片列表 -->
    <div class="registry-grid" v-loading="loading">
      <div v-for="registry in filteredRegistries" :key="registry.systemSoftRegistryId" class="registry-card" :class="{ active: registry.systemSoftRegistryActive === 1 }">
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="registry-icon-wrapper" :style="{ background: getRegistryIconBg(registry.systemSoftRegistryType) }">
            <IconifyIconOnline :icon="getRegistryIcon(registry.systemSoftRegistryType)" />
          </div>
          <div class="registry-info">
            <div class="registry-name">{{ registry.systemSoftRegistryName }}</div>
            <el-tag :type="getRegistryTypeTag(registry.systemSoftRegistryType)" size="small">
              {{ getRegistryTypeText(registry.systemSoftRegistryType) }}
            </el-tag>
          </div>
          <div class="registry-status">
            <el-tag v-if="registry.systemSoftRegistryActive === 1" type="success" size="small" effect="dark">
              <IconifyIconOnline icon="ri:check-line" class="mr-1" />
              已激活
            </el-tag>
            <el-tag v-else type="info" size="small">未激活</el-tag>
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="card-content">
          <div class="info-row">
            <IconifyIconOnline icon="ri:link" class="info-icon" />
            <el-link :href="registry.systemSoftRegistryUrl" target="_blank" type="primary" class="registry-url">
              {{ registry.systemSoftRegistryUrl }}
            </el-link>
          </div>
          <div class="info-row">
            <IconifyIconOnline icon="ri:user-line" class="info-icon" />
            <span v-if="registry.systemSoftRegistryUsername" class="info-text">{{ registry.systemSoftRegistryUsername }}</span>
            <span v-else class="info-text muted">公开访问</span>
          </div>
          <div class="info-row">
            <IconifyIconOnline icon="ri:time-line" class="info-icon" />
            <span class="info-text">{{ registry.systemSoftRegistryLastConnectTime ? formatTime(registry.systemSoftRegistryLastConnectTime) : '从未连接' }}</span>
            <el-tag v-if="registry.systemSoftRegistryConnectStatus === 1" type="success" size="small">成功</el-tag>
            <el-tag v-else-if="registry.systemSoftRegistryConnectStatus === 2" type="danger" size="small">失败</el-tag>
          </div>
        </div>

        <!-- 卡片底部 -->
        <div class="card-footer">
          <el-button size="small" @click="openEditDialog(registry)">
            <IconifyIconOnline icon="ri:edit-line" />
            编辑
          </el-button>
          <el-button size="small" @click="testConnection(registry)">
            <IconifyIconOnline icon="ri:wifi-line" />
            测试
          </el-button>
          <el-button size="small" :type="registry.systemSoftRegistryActive === 1 ? 'warning' : 'success'" @click="handleToggleActive(registry)">
            <IconifyIconOnline :icon="registry.systemSoftRegistryActive === 1 ? 'ri:toggle-fill' : 'ri:toggle-line'" />
            {{ registry.systemSoftRegistryActive === 1 ? '取消激活' : '激活' }}
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(registry.systemSoftRegistryId)">
            <IconifyIconOnline icon="ri:delete-bin-line" />
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredRegistries.length === 0 && !loading" class="empty-state">
        <IconifyIconOnline icon="ri:database-2-line" class="empty-icon" />
        <p class="empty-text">暂无仓库</p>
        <el-button type="primary" @click="openCreateDialog">添加仓库</el-button>
      </div>
    </div>

    <!-- 仓库编辑对话框 -->
    <RegistryDialog v-model:visible="dialogVisible" :registry-data="currentRegistry" @success="handleDialogSuccess" />

    <!-- 同步进度对话框 -->
    <SyncProgressDialog v-model:visible="syncProgressVisible" :progress="syncProgressData" />
  </div>
</template>

<script setup lang="ts">
import { registryApi, type SystemSoftRegistry } from "@/api/docker-management";
import { ElMessage, ElMessageBox } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import RegistryDialog from "./components/RegistryDialog.vue";
import SyncProgressDialog from "./components/SyncProgressDialog.vue";

/**
 * 软件仓库管理页面组件
 * @author CH
 * @version 3.0.0
 * @since 2025-12-01
 */

// 响应式数据
const loading = ref(false);
const dialogVisible = ref(false);
const syncProgressVisible = ref(false);
const registryList = ref<SystemSoftRegistry[]>([]);

// 搜索参数
const searchParams = reactive({
  keyword: "",
  type: "",
});

// 当前编辑的仓库
const currentRegistry = ref<SystemSoftRegistry | null>(null);

// 同步进度数据
const syncProgressData = ref({});

// 计算属性
const activeCount = computed(() => registryList.value.filter(r => r.systemSoftRegistryActive === 1).length);
const onlineCount = computed(() => registryList.value.filter(r => r.systemSoftRegistryConnectStatus === 1).length);
const errorCount = computed(() => registryList.value.filter(r => r.systemSoftRegistryConnectStatus === 2).length);

// 过滤后的仓库列表
const filteredRegistries = computed(() => {
  let result = registryList.value;
  if (searchParams.keyword) {
    const kw = searchParams.keyword.toLowerCase();
    result = result.filter(r => 
      r.systemSoftRegistryName?.toLowerCase().includes(kw) ||
      r.systemSoftRegistryUrl?.toLowerCase().includes(kw)
    );
  }
  if (searchParams.type) {
    result = result.filter(r => r.systemSoftRegistryType === searchParams.type);
  }
  return result;
});

// 加载仓库列表
const loadRegistries = async () => {
  loading.value = true;
  try {
    const res = await registryApi.getAllRegistries();
    if (res.code === "00000") {
      registryList.value = res.data || [];
    }
  } catch (e) {
    console.error("加载仓库列表失败:", e);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  // 前端过滤，无需重新请求
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

// 切换激活状态
const handleToggleActive = async (row: SystemSoftRegistry) => {
  try {
    const isActive = row.systemSoftRegistryActive === 1;
    const res = isActive
      ? await registryApi.deactivateRegistry(row.systemSoftRegistryId!)
      : await registryApi.activateRegistry(row.systemSoftRegistryId!);
    if (res.code === "00000") {
      ElMessage.success(isActive ? "已取消激活" : "已激活");
      loadRegistries();
    } else {
      ElMessage.error(res.msg || "操作失败");
    }
  } catch (e) {
    ElMessage.error("操作失败");
  }
};

// 测试仓库连接
const testConnection = async (registry: SystemSoftRegistry) => {
  try {
    const response = await registryApi.testRegistryConnection(registry.systemSoftRegistryId!);
    if (response.code === "00000" && response.data) {
      ElMessage.success(response.msg || "连接测试成功");
      loadRegistries();
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

const getRegistryIconBg = (type?: string) => {
  const bgMap = {
    docker_hub: "linear-gradient(135deg, #2496ED 0%, #1a7bc9 100%)",
    aliyun: "linear-gradient(135deg, #FF6A00 0%, #e55c00 100%)",
    harbor: "linear-gradient(135deg, #60B2FF 0%, #4a9ae6 100%)",
    custom: "linear-gradient(135deg, #67C23A 0%, #5aad33 100%)",
  };
  return bgMap[type] || "linear-gradient(135deg, #409EFF 0%, #3a8ee6 100%)";
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

<style scoped lang="scss">
.registry-management {
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 50%, #f8fafc 100%);
  min-height: 100vh;
  padding: 0;
}

// 统计卡片
.stats-section {
  padding: 20px 32px;

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;

        &.total { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
        &.active { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        &.online { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
        &.error { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
      }

      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }
        .stat-label {
          font-size: 13px;
          color: #64748b;
        }
      }
    }
  }
}

// 工具栏
.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px 20px;

  .toolbar-left {
    display: flex;
    gap: 12px;

    .search-input { width: 280px; }
    .filter-select { width: 140px; }
  }

  .toolbar-right {
    display: flex;
    gap: 12px;
  }
}

// 仓库卡片网格
.registry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  padding: 0 32px 32px;
}

.registry-card {
  background: white;
  border-radius: 16px;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: #10b981;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    border-bottom: 1px solid #f1f5f9;

    .registry-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
    }

    .registry-info {
      flex: 1;

      .registry-name {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 4px;
      }
    }
  }

  .card-content {
    padding: 16px 20px;

    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;

      &:last-child { margin-bottom: 0; }

      .info-icon {
        color: #94a3b8;
        font-size: 16px;
        flex-shrink: 0;
      }

      .info-text {
        font-size: 13px;
        color: #475569;

        &.muted { color: #94a3b8; }
      }

      .registry-url {
        font-size: 13px;
        word-break: break-all;
      }
    }
  }

  .card-footer {
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
  }
}

// 空状态
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  border: 1px dashed #e2e8f0;

  .empty-icon {
    font-size: 64px;
    color: #cbd5e1;
    margin-bottom: 16px;
  }

  .empty-text {
    font-size: 16px;
    color: #64748b;
    margin-bottom: 20px;
  }
}

// 响应式
@media (max-width: 1200px) {
  .stats-section .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-section {
    padding: 16px;
    .stats-grid { grid-template-columns: 1fr; }
  }

  .toolbar-section {
    flex-direction: column;
    gap: 12px;
    padding: 0 16px 16px;

    .toolbar-left, .toolbar-right { width: 100%; }
    .search-input { width: 100%; }
  }

  .registry-grid {
    grid-template-columns: 1fr;
    padding: 0 16px 16px;
  }
}
</style>

<template>
  <div class="soft-management">
    <div class="page-header">
      <div class="header-left">
        <h2>软件管理</h2>
        <p>管理系统中的软件安装、更新和配置</p>
      </div>
      
      <div class="header-actions">
        <el-button type="primary" @click="openCreate">
          <IconifyIconOnline icon="ri:add-fill" class="mr-1" />
          安装软件
        </el-button>
        
        <el-button @click="handleSync" :loading="syncing">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-section">
      <StatsCard 
        :stats="statsData" 
        :details="statsDetails"
        :show-toggle="true"
      />
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input 
          v-model="searchParams.systemSoftName" 
          placeholder="搜索软件名称/编码" 
          clearable 
          class="search-input" 
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select v-model="searchParams.systemSoftType" placeholder="软件类型" clearable style="width: 150px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="应用软件" value="APPLICATION" />
          <el-option label="系统软件" value="SYSTEM" />
          <el-option label="开发工具" value="DEVELOPMENT" />
          <el-option label="数据库" value="DATABASE" />
          <el-option label="中间件" value="MIDDLEWARE" />
        </el-select>
        <el-select v-model="searchParams.systemSoftStatus" placeholder="状态" clearable style="width: 120px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="启用" value="1" />
          <el-option label="禁用" value="0" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button @click="handleSearch">
          <IconifyIconOnline icon="ri:search-line" class="mr-1" /> 搜索
        </el-button>
        <el-button @click="resetSearch">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" /> 重置
        </el-button>
        <el-button type="info" @click="goToContainerManagement">
          <IconifyIconOnline icon="ri:container-line" class="mr-1" /> 容器管理
        </el-button>
        <el-button type="warning" @click="goToInstallRecords">
          <IconifyIconOnline icon="ri:history-line" class="mr-1" /> 安装记录
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="list.length === 0" description="暂无软件数据">
      <el-button type="primary" @click="handleSync">立即同步</el-button>
    </el-empty>

    <!-- 软件列表 -->
    <div v-else class="soft-grid">
      <el-card v-for="item in list" :key="item.systemSoftId" class="soft-card" @click="goDetail(item)">
        <div class="soft-card-header">
          <div class="soft-icon-container">
            <img v-if="item.systemSoftIcon" :src="item.systemSoftIcon" class="soft-icon" />
            <IconifyIconOnline v-else icon="ri:apps-line" class="soft-icon-default" />
          </div>
          <div class="soft-title">
            <div class="name">{{ item.systemSoftName }}</div>
            <div class="code">{{ item.systemSoftCode }}</div>
          </div>
          <div class="soft-status">
            <el-tag :type="item.systemSoftStatus === 1 ? 'success' : 'danger'" size="small">
              {{ item.systemSoftStatus === 1 ? '启用' : '禁用' }}
            </el-tag>
          </div>
        </div>
        <div class="desc" :title="item.systemSoftDesc">{{ item.systemSoftDesc || '暂无描述' }}</div>
        <div class="soft-info">
          <div class="info-item">
            <span class="info-label">类型:</span>
            <span class="info-value">{{ getSoftTypeLabel(item.systemSoftType) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">版本数:</span>
            <span class="info-value">{{ item.versionCount || 0 }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">容器数:</span>
            <span class="info-value">{{ item.containerCount || 0 }}</span>
          </div>
        </div>
        <div class="tags">
          <el-tag v-for="tag in (item.systemSoftTags || '').split(',').filter(Boolean)" :key="tag" size="small">{{ tag }}</el-tag>
        </div>
        <div class="card-actions" @click.stop>
          <el-button size="small" type="primary" @click="goDetail(item)">
            <IconifyIconOnline icon="ri:eye-line" class="mr-1" /> 详情
          </el-button>
          <el-button size="small" type="success" @click="handleInstall(item)">
            <IconifyIconOnline icon="ri:download-line" class="mr-1" /> 安装
          </el-button>
          <el-dropdown @command="(command) => handleCardAction(command, item)">
            <el-button size="small">
              <IconifyIconOnline icon="ri:more-line" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <IconifyIconOnline icon="ri:edit-line" class="mr-1" /> 编辑
                </el-dropdown-item>
                <el-dropdown-item command="versions">
                  <IconifyIconOnline icon="ri:git-branch-line" class="mr-1" /> 版本管理
                </el-dropdown-item>
                <el-dropdown-item command="containers">
                  <IconifyIconOnline icon="ri:container-line" class="mr-1" /> 容器列表
                </el-dropdown-item>
                <el-dropdown-item command="toggle" :divided="true">
                  <IconifyIconOnline :icon="item.systemSoftStatus === 1 ? 'ri:pause-line' : 'ri:play-line'" class="mr-1" />
                  {{ item.systemSoftStatus === 1 ? '禁用' : '启用' }}
                </el-dropdown-item>
                <el-dropdown-item command="delete" class="text-danger">
                  <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" /> 删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div v-if="list.length > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[12, 24, 48, 96]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue";
import { message } from "@repo/utils";
import { 
  getSoftPageList, 
  syncSoft, 
  updateSoft,
  deleteSoft,
  getRunningContainers,
  type SystemSoft 
} from "@/api/soft";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import StatsCard from "./components/StatsCard.vue";

const router = useRouter();
const loading = ref(false);
const syncing = ref(false);
const list = ref<SystemSoft[]>([]);

// 搜索参数
const searchParams = reactive({
  systemSoftName: "",
  systemSoftType: "",
  systemSoftStatus: ""
});

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
});

// 统计信息
const stats = reactive({
  enabled: 0,
  disabled: 0,
  runningContainers: 0
});

// 统计卡片数据
const statsData = computed(() => [
  {
    key: 'total',
    label: '总软件数',
    value: pagination.total,
    icon: 'ri:apps-line',
    type: 'primary',
    format: 'number',
    description: '系统中已安装的软件总数'
  },
  {
    key: 'enabled',
    label: '启用软件',
    value: stats.enabled,
    icon: 'ri:play-circle-line',
    type: 'success',
    format: 'number',
    description: '当前启用状态的软件数量'
  },
  {
    key: 'disabled',
    label: '禁用软件',
    value: stats.disabled,
    icon: 'ri:pause-circle-line',
    type: 'warning',
    format: 'number',
    description: '当前禁用状态的软件数量'
  },
  {
    key: 'containers',
    label: '运行容器',
    value: stats.runningContainers,
    icon: 'ri:container-line',
    type: 'info',
    format: 'number',
    description: '当前正在运行的容器数量'
  }
]);

// 统计详情数据
const statsDetails = computed(() => ({
  systemSoftware: list.value.filter(item => item.systemSoftType === 'SYSTEM').length,
  applicationSoftware: list.value.filter(item => item.systemSoftType === 'APPLICATION').length,
  developmentTools: list.value.filter(item => item.systemSoftType === 'DEVELOPMENT').length,
  databases: list.value.filter(item => item.systemSoftType === 'DATABASE').length,
  middleware: list.value.filter(item => item.systemSoftType === 'MIDDLEWARE').length,
  runningContainers: stats.runningContainers,
  totalContainers: list.value.reduce((sum, item) => sum + (item.containerCount || 0), 0),
  totalVersions: list.value.reduce((sum, item) => sum + (item.versionCount || 0), 0)
}));

// 软件类型标签映射
const softTypeMap = {
  'APPLICATION': '应用软件',
  'SYSTEM': '系统软件',
  'DEVELOPMENT': '开发工具',
  'DATABASE': '数据库',
  'MIDDLEWARE': '中间件'
};

const getSoftTypeLabel = (type: string) => {
  return softTypeMap[type] || type || '未知';
};

// 加载软件列表
const loadList = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams
    };
    
    // 清空空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });
    
    const res = await getSoftPageList(params);
    if (res.code === "00000") {
      list.value = res.data.records || [];
      pagination.total = res.data.total || 0;
      
      // 计算统计信息
      updateStats();
    }
  } catch (error) {
    message.error("加载软件列表失败");
  } finally {
    loading.value = false;
  }
};

// 更新统计信息
const updateStats = async () => {
  stats.enabled = list.value.filter(item => item.systemSoftStatus === 1).length;
  stats.disabled = list.value.filter(item => item.systemSoftStatus === 0).length;
  
  // 获取运行中容器数量
  try {
    const res = await getRunningContainers();
    if (res.code === "00000") {
      stats.runningContainers = res.data.length;
    }
  } catch (error) {
    console.error("获取运行中容器数量失败:", error);
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadList();
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchParams, {
    systemSoftName: "",
    systemSoftType: "",
    systemSoftStatus: ""
  });
  pagination.page = 1;
  loadList();
};

// 同步软件
const handleSync = async () => {
  try {
    syncing.value = true;
    const res = await syncSoft();
    if (res.code === "00000") {
      message.success("同步成功");
      await loadList();
    } else {
      message.error(res.message || "同步失败");
    }
  } catch (error) {
    message.error("同步失败");
  } finally {
    syncing.value = false;
  }
};

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadList();
};

const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadList();
};

// 新增软件
const openCreate = () => {
  message.info("新增功能开发中...");
};

// 跳转到详情页
const goDetail = (item: SystemSoft) => {
  router.push({ name: "softDetail", params: { id: item.systemSoftId } });
};

// 跳转到容器管理
const goToContainerManagement = () => {
  router.push({ name: "containerManagement" });
};

// 跳转到安装记录
const goToInstallRecords = () => {
  router.push({ name: "installRecords" });
};

// 安装软件
const handleInstall = (item: SystemSoft) => {
  router.push({ name: "softDetail", params: { id: item.systemSoftId }, query: { tab: "install" } });
};

// 卡片操作
const handleCardAction = async (command: string, item: SystemSoft) => {
  switch (command) {
    case 'edit':
      message.info("编辑功能开发中...");
      break;
    case 'versions':
      router.push({ name: "softDetail", params: { id: item.systemSoftId }, query: { tab: "versions" } });
      break;
    case 'containers':
      router.push({ name: "softDetail", params: { id: item.systemSoftId }, query: { tab: "containers" } });
      break;
    case 'toggle':
      await handleToggleStatus(item);
      break;
    case 'delete':
      await handleDelete(item);
      break;
  }
};

// 切换状态
const handleToggleStatus = async (item: SystemSoft) => {
  try {
    const newStatus = item.systemSoftStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? '启用' : '禁用';
    
    await ElMessageBox.confirm(
      `确定要${action}软件 "${item.systemSoftName}" 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const res = await updateSoft(item.systemSoftId, {
      ...item,
      systemSoftStatus: newStatus
    });
    
    if (res.code === "00000") {
      message.success(`${action}成功`);
      await loadList();
    } else {
      message.error(res.message || `${action}失败`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      message.error('操作失败');
    }
  }
};

// 删除软件
const handleDelete = async (item: SystemSoft) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除软件 "${item.systemSoftName}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    );
    
    const res = await deleteSoft(item.systemSoftId);
    
    if (res.code === "00000") {
      message.success('删除成功');
      await loadList();
    } else {
      message.error(res.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      message.error('删除失败');
    }
  }
};

onMounted(() => {
  loadList();
});
</script>

<style scoped>
.soft-management {
  padding: 16px;
  background: var(--el-bg-color-overlay);
  min-height: calc(100vh - 60px);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 600;
}

.header-left p {
  margin: 0;
   color: var(--el-text-color-primary);
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计区域 */
.stats-section {
  margin-bottom: 20px;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 280px;
}

/* 统计信息栏 */
.stats-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.stat-value {
  font-weight: 600;
  font-size: 16px;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.text-primary {
  color: #409eff;
}

/* 加载状态 */
.loading-container {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 软件网格 */
.soft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

/* 软件卡片 */
.soft-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  position: relative;
}

.soft-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.soft-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  position: relative;
}

.soft-icon-container {
  flex-shrink: 0;
}

.soft-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e4e7ed;
}

.soft-icon-default {
  width: 40px;
  height: 40px;
   color: var(--el-text-color-primary);
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e4e7ed;
}

.soft-title {
  flex: 1;
  min-width: 0;
}

.soft-title .name {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.soft-title .code {
   color: var(--el-text-color-primary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.soft-status {
  flex-shrink: 0;
}

/* 描述 */
.desc {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  height: 42px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 12px;
}

/* 软件信息 */
.soft-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 0;
  border-top: 1px solid #f0f2f5;
  border-bottom: 1px solid #f0f2f5;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.info-label {
   color: var(--el-text-color-primary);
  font-size: 12px;
}

.info-value {
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 14px;
}

/* 标签 */
.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  min-height: 24px;
}

/* 卡片操作 */
.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f0f2f5;
}

.card-actions .el-button {
  flex: 1;
}

.card-actions .el-dropdown {
  flex-shrink: 0;
}

/* 分页容器 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-left {
    flex-direction: column;
    gap: 8px;
  }
  
  .toolbar-right {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .search-input {
    width: 100%;
  }
  
  .stats-bar {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .soft-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .soft-page {
    padding: 8px;
  }
  
  .toolbar {
    padding: 12px;
  }
  
  .card-actions {
    flex-direction: column;
    gap: 6px;
  }
  
  .card-actions .el-button {
    width: 100%;
  }
}

/* 工具提示样式 */
.el-dropdown-menu__item.text-danger {
  color: #f56c6c;
}

.el-dropdown-menu__item.text-danger:hover {
  background-color: #fef0f0;
  color: #f56c6c;
}
</style>


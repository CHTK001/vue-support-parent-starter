<template>
  <div class="software-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:apps-line" class="title-icon" />
          <span>软件管理</span>
        </div>
        <div class="page-subtitle">管理Docker软件的信息、版本和安装</div>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="success" @click="handleSyncFromRegistry" :loading="syncLoading">
          <IconifyIconOnline icon="ri:download-cloud-line" class="mr-1" />
          同步软件
        </el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-left">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索软件名称或描述"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-select
          v-model="searchParams.category"
          placeholder="软件分类"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="数据库" value="database" />
          <el-option label="Web服务器" value="web" />
          <el-option label="缓存" value="cache" />
          <el-option label="消息队列" value="mq" />
          <el-option label="监控工具" value="monitor" />
          <el-option label="开发工具" value="dev" />
        </el-select>
        <el-select
          v-model="searchParams.registryId"
          placeholder="软件仓库"
          clearable
          class="filter-select"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="registry in registryOptions"
            :key="registry.id"
            :label="registry.name"
            :value="registry.id"
          />
        </el-select>
      </div>
      <div class="search-right">
        <el-button @click="handleBatchInstall" :disabled="selectedIds.length === 0" type="primary">
          <IconifyIconOnline icon="ri:download-line" class="mr-1" />
          批量安装
        </el-button>
      </div>
    </div>

    <!-- 软件表格 -->
    <el-card class="software-table-card">
      <el-table
        :data="softwareList"
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
        class="software-table"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="软件信息" min-width="250">
          <template #default="{ row }">
            <div class="software-info">
              <div class="software-icon">
                <img v-if="row.systemSoftIcon" :src="row.systemSoftIcon" alt="icon" />
                <IconifyIconOnline v-else icon="ri:apps-line" class="default-icon" />
              </div>
              <div class="software-details">
                <div class="software-name">{{ row.systemSoftName }}</div>
                <div class="software-desc">{{ row.systemSoftDesc || '暂无描述' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag type="info" size="small">
              {{ getCategoryText(row.systemSoftCategory) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="版本信息" min-width="180">
          <template #default="{ row }">
            <div class="version-info">
              <div class="latest-version">
                最新：<span class="version-tag">{{ row.systemSoftLatestVersion || 'unknown' }}</span>
              </div>
              <div class="version-count">
                版本数：{{ row.systemSoftVersionCount || 0 }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="标签" min-width="150">
          <template #default="{ row }">
            <div class="tags-container">
              <el-tag
                v-for="tag in (row.systemSoftTags || '').split(',').filter(Boolean).slice(0, 2)"
                :key="tag"
                size="small"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
              <span v-if="(row.systemSoftTags || '').split(',').filter(Boolean).length > 2" class="more-tags">
                +{{ (row.systemSoftTags || '').split(',').filter(Boolean).length - 2 }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="安装状态" width="120">
          <template #default="{ row }">
            <div class="install-status">
              <div class="status-item">
                <span class="status-label">镜像：</span>
                <span class="status-value">{{ row.systemSoftImageCount || 0 }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">容器：</span>
                <span class="status-value">{{ row.systemSoftContainerCount || 0 }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.systemSoftUpdatedTime) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                size="small" 
                type="primary" 
                @click="handleInstall(row)"
              >
                <IconifyIconOnline icon="ri:download-line" class="mr-1" />
                安装
              </el-button>
              <el-button 
                size="small" 
                @click="viewSoftwareDetail(row)"
              >
                <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
                详情
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 安装软件对话框 -->
    <InstallSoftwareDialog
      v-model:visible="installDialogVisible"
      :software-data="currentSoftware"
      @success="handleDialogSuccess"
    />

    <!-- 同步软件对话框 -->
    <SyncSoftwareDialog
      v-model:visible="syncDialogVisible"
      @success="handleDialogSuccess"
    />

    <!-- 批量操作底部工具栏 -->
    <div v-if="selectedIds.length > 0" class="batch-actions">
      <div class="batch-info">
        已选择 {{ selectedIds.length }} 个软件
      </div>
      <el-button @click="clearSelection">取消选择</el-button>
      <el-button type="primary" @click="handleBatchInstall">批量安装</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { softwareApi, registryApi, type SystemSoft } from '@/api/docker-management'
import InstallSoftwareDialog from '@/components/docker/InstallSoftwareDialog.vue'
import SyncSoftwareDialog from '@/components/docker/SyncSoftwareDialog.vue'

// 响应式数据
const loading = ref(false)
const syncLoading = ref(false)
const selectedIds = ref<number[]>([])
const softwareList = ref<SystemSoft[]>([])
const registryOptions = ref<any[]>([])
const installDialogVisible = ref(false)
const syncDialogVisible = ref(false)
const currentSoftware = ref<SystemSoft | null>(null)

// 搜索参数
const searchParams = reactive({
  keyword: '',
  category: '',
  registryId: ''
})

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 基础方法
const loadSoftwareList = async () => {
  try {
    loading.value = true
    const params = { ...searchParams, page: pagination.page, pageSize: pagination.pageSize }
    Object.keys(params).forEach(key => {
      if (params[key] === '') delete params[key]
    })
    
    const response = await softwareApi.getSoftwarePageList(params)
    if (response.code === '00000') {
      softwareList.value = response.data.records || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    ElMessage.error('加载软件列表失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => loadSoftwareList()
const handleSearch = () => { pagination.page = 1; loadSoftwareList() }
const handleSelectionChange = (selection: SystemSoft[]) => {
  selectedIds.value = selection.map(item => item.systemSoftId!)
}
const clearSelection = () => { selectedIds.value = [] }

// 工具函数
const getCategoryText = (category?: string) => {
  const map = {
    database: '数据库',
    web: 'Web服务器',
    cache: '缓存',
    mq: '消息队列',
    monitor: '监控工具',
    dev: '开发工具'
  }
  return map[category] || '其他'
}

const formatTime = (time?: string) => time ? new Date(time).toLocaleString() : '-'

// 操作方法
const handleSyncFromRegistry = () => {
  syncDialogVisible.value = true
}

const handleInstall = (software: SystemSoft) => {
  currentSoftware.value = software
  installDialogVisible.value = true
}

const viewSoftwareDetail = (software: SystemSoft) => {
  ElMessage.info('软件详情功能开发中...')
}

const handleBatchInstall = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要安装的软件')
    return
  }
  ElMessage.info('批量安装功能开发中...')
}

const handleDialogSuccess = () => {
  loadSoftwareList()
}

const handleSizeChange = (size: number) => { pagination.pageSize = size; loadSoftwareList() }
const handleCurrentChange = (page: number) => { pagination.page = page; loadSoftwareList() }

// 加载镜像仓库列表
const loadRegistries = async () => {
  try {
    const response = await registryApi.getRegistryList()
    if (response.code === '00000') {
      registryOptions.value = response.data || []
    }
  } catch (error) {
    console.error('加载镜像仓库列表失败:', error)
  }
}

onMounted(() => {
  loadSoftwareList()
  loadRegistries()
})
</script>

<style scoped>
<<<<<<< HEAD
.software-management {
  padding: 20px;
  background: #f5f7fa;
=======
.soft-management {
  padding: 16px;
  background: var(--el-bg-color-overlay);
>>>>>>> f41a2b14569952e9369b72ca2cb47746fc1a53ad
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

<<<<<<< HEAD
.page-title {
  display: flex;
  align-items: center;
=======
.header-left h2 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
>>>>>>> f41a2b14569952e9369b72ca2cb47746fc1a53ad
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

<<<<<<< HEAD
.title-icon {
  margin-right: 8px;
  color: #409eff;
}

.page-subtitle {
  color: #6c757d;
  margin-top: 8px;
=======
.header-left p {
  margin: 0;
   color: var(--el-text-color-primary);
>>>>>>> f41a2b14569952e9369b72ca2cb47746fc1a53ad
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
  background: var(--el-bg-color-overlay);
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

<<<<<<< HEAD
.filter-select {
  width: 140px;
}

.software-table-card {
  background: white;
=======
/* 统计信息栏 */
.stats-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--el-bg-color-overlay);
>>>>>>> f41a2b14569952e9369b72ca2cb47746fc1a53ad
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

<<<<<<< HEAD
.software-info {
=======
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
>>>>>>> f41a2b14569952e9369b72ca2cb47746fc1a53ad
  display: flex;
  align-items: center;
  gap: 12px;
}

.software-icon {
  width: 40px;
  height: 40px;
<<<<<<< HEAD
  border-radius: 6px;
  overflow: hidden;
=======
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
>>>>>>> f41a2b14569952e9369b72ca2cb47746fc1a53ad
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
}

.software-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-icon {
  font-size: 20px;
  color: #909399;
}

.software-details {
  flex: 1;
  min-width: 0;
}

<<<<<<< HEAD
.software-name {
  font-weight: 500;
  color: #303133;
=======
.soft-title .name {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
>>>>>>> f41a2b14569952e9369b72ca2cb47746fc1a53ad
  margin-bottom: 4px;
}

<<<<<<< HEAD
.software-desc {
=======
.soft-title .code {
   color: var(--el-text-color-primary);
>>>>>>> f41a2b14569952e9369b72ca2cb47746fc1a53ad
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

<<<<<<< HEAD
.latest-version {
  font-size: 12px;
  color: #606266;
}

.version-tag {
  color: #409eff;
  font-weight: 500;
}

.version-count {
  font-size: 12px;
  color: #909399;
}

.tags-container {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.tag-item {
  margin: 0;
}

.more-tags {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.install-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.status-label {
  color: #909399;
}

.status-value {
  color: #303133;
  font-weight: 500;
=======
.info-label {
   color: var(--el-text-color-primary);
  font-size: 12px;
}

.info-value {
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 14px;
>>>>>>> f41a2b14569952e9369b72ca2cb47746fc1a53ad
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
<<<<<<< HEAD
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
=======
  background: var(--el-bg-color-overlay);
>>>>>>> f41a2b14569952e9369b72ca2cb47746fc1a53ad
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.batch-info {
  color: #409eff;
  font-weight: 500;
}
</style>
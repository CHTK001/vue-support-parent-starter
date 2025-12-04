<template>
  <div class="container-monitoring-list">
    <ScTable
      :data="containers"
      :url="url"
      :params="params"
      stripe
      :loading="loading"
      class="monitoring-table"
      :total="pagination?.total || 0"
      :page-size="pagination?.pageSize || 10"
      :current-page="pagination?.page || 1"
      @size-change="onSizeChange"
      @current-change="onCurrentChange"
      table-name="container-monitoring"
    >
      <el-table-column label="容器信息" min-width="250">
        <template #default="{ row }">
          <div class="container-info">
            <div class="container-details">
              <div class="container-name">{{ row.systemSoftContainerName }}</div>
              <div class="container-id">{{ row.systemSoftContainerId?.substring(0, 12) }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="镜像信息" min-width="200">
        <template #default="{ row }">
          <div class="image-info">
            <div class="image-name">{{ row.systemSoftContainerImageName }}</div>
            <div class="image-tag">{{ row.systemSoftContainerImageTag }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="运行状�? width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.systemSoftContainerStatus)" size="small">
            {{ getStatusText(row.systemSoftContainerStatus) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="服务�? width="180">
        <template #default="{ row }">
          <div class="server-info">
            <div class="server-name">{{ row.systemSoftContainerServerName }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="CPU使用�? width="150">
        <template #default="{ row }">
          <ResourceUsageBar 
            :value="row.systemSoftContainerCpuPercent || row.systemSoftContainerCpuUsage || 0" 
            type="cpu"
          />
        </template>
      </el-table-column>

      <el-table-column label="内存使用�? width="150">
        <template #default="{ row }">
          <ResourceUsageBar 
            :value="row.systemSoftContainerMemoryPercent || row.systemSoftContainerMemoryUsage || 0" 
            type="memory"
          />
        </template>
      </el-table-column>

      <el-table-column label="磁盘IO" width="180">
        <template #default="{ row }">
          <IODataDisplay 
            :read-value="row.systemSoftContainerStatsDiskRead || row.systemSoftContainerDiskRead || 0"
            :write-value="row.systemSoftContainerStatsDiskWrite || row.systemSoftContainerDiskWrite || 0"
            read-label="读取"
            write-label="写入"
          />
        </template>
      </el-table-column>

      <el-table-column label="网络IO" width="180">
        <template #default="{ row }">
          <IODataDisplay 
            :read-value="row.systemSoftContainerStatsNetworkRxBytes || row.systemSoftContainerNetworkRx || 0"
            :write-value="row.systemSoftContainerStatsNetworkTxBytes || row.systemSoftContainerNetworkTx || 0"
            read-label="接收"
            write-label="发�?
          />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="onViewDetail(row)">
            <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </ScTable>
    
    <!-- 分页 -->
    <div class="pagination-container" v-if="showPagination && pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { type SystemSoftContainer } from '@/api/docker'
import IODataDisplay from './IODataDisplay.vue'
import ResourceUsageBar from './ResourceUsageBar.vue'
import ScTable from "@repo/components/ScTable/index.vue"
import { defineEmits, defineProps } from 'vue'

interface Pagination {
  page: number
  pageSize: number
  total: number
}

interface Props {
  containers?: SystemSoftContainer[]
  url?: Function
  params?: Record<string, any>
  loading?: boolean
  pagination?: Pagination
  showPagination?: boolean
}

interface Emits {
  (e: 'view-detail', container: SystemSoftContainer): void
  (e: 'size-change', size: number): void
  (e: 'current-change', page: number): void
}

const props = withDefaults(defineProps<Props>(), {
  containers: () => [],
  loading: false,
  pagination: () => ({ page: 1, pageSize: 10, total: 0 }),
  showPagination: true
})

const emit = defineEmits<Emits>()

// 工具函数
const getStatusType = (status?: string) => {
  const map = { running: 'success', stopped: 'warning', paused: 'info', restarting: 'warning', error: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status?: string) => {
  const map = { running: '运行�?, stopped: '已停�?, paused: '暂停', restarting: '重启�?, error: '错误' }
  return map[status] || '未知'
}

// 事件处理
const onViewDetail = (container: SystemSoftContainer) => {
  emit('view-detail', container)
}

const onSizeChange = (size: number) => {
  emit('size-change', size)
}

const onCurrentChange = (page: number) => {
  emit('current-change', page)
}
</script>

<style scoped>
.container-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.container-details {
  flex: 1;
  min-width: 0;
}

.container-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.container-id {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-name {
  font-weight: 500;
  color: #303133;
}

.image-tag {
  font-size: 12px;
  color: #909399;
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.server-name {
  font-weight: 500;
  color: #303133;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  border-top: 1px solid #f0f2f5;
}
</style>
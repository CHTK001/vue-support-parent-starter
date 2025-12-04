<template>
  <el-dialog
    v-model="dialogVisible"
    title="容器详情"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="containerData" class="container-detail">
      <el-tabs v-model="activeTab">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="容器名称">
              {{ containerData.systemSoftContainerName }}
            </el-descriptions-item>
            <el-descriptions-item label="容器ID">
              <span class="container-id">{{ containerData.systemSoftContainerId }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="镜像名称">
              {{ containerData.systemSoftContainerImageName }}
            </el-descriptions-item>
            <el-descriptions-item label="镜像标签">
              {{ containerData.systemSoftContainerImageTag }}
            </el-descriptions-item>
            <el-descriptions-item label="运行状�?>
              <el-tag :type="getStatusType(containerData.systemSoftContainerStatus)">
                {{ getStatusText(containerData.systemSoftContainerStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="服务�?>
              {{ containerData.systemSoftContainerServerName }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatTime(containerData.systemSoftContainerCreatedTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="启动时间">
              {{ formatTime(containerData.systemSoftContainerStartedTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="重启策略">
              {{ containerData.systemSoftContainerRestartPolicy || '默认' }}
            </el-descriptions-item>
            <el-descriptions-item label="自动删除">
              {{ containerData.systemSoftContainerAutoRemove ? '�? : '�? }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 网络配置 -->
        <el-tab-pane label="网络配置" name="network">
          <div class="network-section">
            <div class="section-title">端口映射</div>
            <div class="port-mappings">
              <div
                v-for="port in parsePortMappings(containerData.systemSoftContainerPorts)"
                :key="port"
                class="port-mapping-item"
              >
                <el-tag class="port-tag">{{ port }}</el-tag>
              </div>
              <div v-if="!containerData.systemSoftContainerPorts" class="no-data">
                暂无端口映射
              </div>
            </div>
            
            <div class="section-title">网络模式</div>
            <div class="network-mode">
              {{ containerData.systemSoftContainerNetworkMode || '默认桥接模式' }}
            </div>
            
            <div class="section-title">IP地址</div>
            <div class="ip-address">
              {{ containerData.systemSoftContainerIpAddress || '未分�? }}
            </div>
          </div>
        </el-tab-pane>

        <!-- 资源使用 -->
        <el-tab-pane label="资源监控" name="resources">
          <div class="resources-grid">
            <div class="resource-card">
              <div class="resource-title">CPU使用�?/div>
              <div class="resource-chart">
                <el-progress
                  type="circle"
                  :percentage="containerData.systemSoftContainerCpuPercent || containerData.systemSoftContainerCpuUsage || 0"
                  :color="getUsageColor(containerData.systemSoftContainerCpuPercent || containerData.systemSoftContainerCpuUsage || 0)"
                  :width="120"
                />
              </div>
              <div class="resource-value">
                {{ (containerData.systemSoftContainerCpuPercent || containerData.systemSoftContainerCpuUsage || 0).toFixed(2) }}%
              </div>
            </div>
            
            <div class="resource-card">
              <div class="resource-title">内存使用�?/div>
              <div class="resource-chart">
                <el-progress
                  type="circle"
                  :percentage="containerData.systemSoftContainerMemoryPercent || containerData.systemSoftContainerMemoryUsage || 0"
                  :color="getUsageColor(containerData.systemSoftContainerMemoryPercent || containerData.systemSoftContainerMemoryUsage || 0)"
                  :width="120"
                />
              </div>
              <div class="resource-value">
                {{ (containerData.systemSoftContainerMemoryPercent || containerData.systemSoftContainerMemoryUsage || 0).toFixed(2) }}%
              </div>
            </div>
            
            <div class="resource-card">
              <div class="resource-title">内存使用</div>
              <div class="resource-stats">
                <div class="stat-item">
                  <span class="stat-label">使用�?/span>
                  <span class="stat-value">{{ formatBytes(containerData.systemSoftContainerMemoryUsageBytes || containerData.systemSoftContainerMemoryUsage || 0) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">限制�?/span>
                  <span class="stat-value">{{ formatBytes(containerData.systemSoftContainerMemoryLimit || 0) }}</span>
                </div>
              </div>
            </div>
            
            <div class="resource-card">
              <div class="resource-title">磁盘IO</div>
              <div class="resource-stats">
                <div class="stat-item">
                  <span class="stat-label">读取�?/span>
                  <span class="stat-value">{{ formatBytes(containerData.systemSoftContainerStatsDiskRead || containerData.systemSoftContainerDiskRead || 0) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">写入�?/span>
                  <span class="stat-value">{{ formatBytes(containerData.systemSoftContainerStatsDiskWrite || containerData.systemSoftContainerDiskWrite || 0) }}</span>
                </div>
              </div>
            </div>
            
            <div class="resource-card">
              <div class="resource-title">网络IO</div>
              <div class="resource-stats">
                <div class="stat-item">
                  <span class="stat-label">接收�?/span>
                  <span class="stat-value">{{ formatBytes(containerData.systemSoftContainerStatsNetworkRxBytes || containerData.systemSoftContainerNetworkRx || 0) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">发送：</span>
                  <span class="stat-value">{{ formatBytes(containerData.systemSoftContainerStatsNetworkTxBytes || containerData.systemSoftContainerNetworkTx || 0) }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 环境变量 -->
        <el-tab-pane label="环境变量" name="environment">
          <div class="environment-section">
            <div v-if="containerData.systemSoftContainerEnvVars" class="env-vars">
              <pre class="env-code">{{ formatEnvVars(containerData.systemSoftContainerEnvVars) }}</pre>
            </div>
            <div v-else class="no-data">
              暂无环境变量配置
            </div>
          </div>
        </el-tab-pane>

        <!-- 卷挂�?-->
        <el-tab-pane label="存储挂载" name="volumes">
          <div class="volumes-section">
            <div v-if="containerData.systemSoftContainerVolumes" class="volumes-list">
              <div
                v-for="volume in parseVolumes(containerData.systemSoftContainerVolumes)"
                :key="volume"
                class="volume-item"
              >
                <el-tag class="volume-tag">{{ volume }}</el-tag>
              </div>
            </div>
            <div v-else class="no-data">
              暂无存储挂载配置
            </div>
          </div>
        </el-tab-pane>

        <!-- 启动配置 -->
        <el-tab-pane label="启动配置" name="config">
          <div class="config-section">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="容器名称">
                {{ containerData.systemSoftContainerName }}
              </el-descriptions-item>
              <el-descriptions-item label="镜像">
                {{ containerData.systemSoftContainerImage }}:{{ containerData.systemSoftContainerImageTag }}
              </el-descriptions-item>
              <el-descriptions-item label="命令">
                {{ containerData.systemSoftContainerCommand || '默认' }}
              </el-descriptions-item>
              <el-descriptions-item label="参数">
                {{ containerData.systemSoftContainerArgs || '�? }}
              </el-descriptions-item>
              <el-descriptions-item label="网络模式">
                {{ containerData.systemSoftContainerNetworks || '默认桥接' }}
              </el-descriptions-item>
              <el-descriptions-item label="重启策略">
                {{ containerData.systemSoftContainerAutoRestart ? '自动重启' : '不重�? }}
              </el-descriptions-item>
              <el-descriptions-item label="CPU限制">
                {{ containerData.systemSoftContainerCpuLimit ? `${containerData.systemSoftContainerCpuLimit} 核` : '无限�? }}
              </el-descriptions-item>
              <el-descriptions-item label="内存限制">
                {{ containerData.systemSoftContainerMemoryLimit ? formatBytes(containerData.systemSoftContainerMemoryLimit) : '无限�? }}
              </el-descriptions-item>
            </el-descriptions>
            
            <div v-if="containerData.systemSoftContainerConfig" class="config-json">
              <div class="section-title">完整配置（JSON�?/div>
              <pre class="config-code">{{ formatJson(containerData.systemSoftContainerConfig) }}</pre>
            </div>
          </div>
        </el-tab-pane>

        <!-- 性能图表 -->
        <el-tab-pane label="性能图表" name="charts">
          <div class="charts-section">
            <div class="chart-row">
              <div class="chart-item">
                <ContainerRealtimeChart 
                  :container-id="containerData.systemSoftContainerId!" 
                  title="CPU使用�? 
                  data-type="cpu" 
                />
              </div>
              <div class="chart-item">
                <ContainerRealtimeChart 
                  :container-id="containerData.systemSoftContainerId!" 
                  title="内存使用" 
                  data-type="memory" 
                />
              </div>
            </div>
            <div class="chart-row">
              <div class="chart-item">
                <ContainerRealtimeChart 
                  :container-id="containerData.systemSoftContainerId!" 
                  title="磁盘读取" 
                  data-type="diskRead" 
                />
              </div>
              <div class="chart-item">
                <ContainerRealtimeChart 
                  :container-id="containerData.systemSoftContainerId!" 
                  title="磁盘写入" 
                  data-type="diskWrite" 
                />
              </div>
            </div>
            <div class="chart-row">
              <div class="chart-item">
                <ContainerRealtimeChart 
                  :container-id="containerData.systemSoftContainerId!" 
                  title="网络接收" 
                  data-type="networkRx" 
                />
              </div>
              <div class="chart-item">
                <ContainerRealtimeChart 
                  :container-id="containerData.systemSoftContainerId!" 
                  title="网络发�? 
                  data-type="networkTx" 
                />
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleRefresh" :loading="refreshing">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新数据
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { containerApi, type SystemSoftContainer } from '@/api/docker'
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import ContainerRealtimeChart from '../../monitoring/components/ContainerRealtimeChart.vue'

interface Props {
  visible: boolean
  containerData?: SystemSoftContainer | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref('basic')
const refreshing = ref(false)

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible) {
    activeTab.value = 'basic'
  }
})

// 工具函数
const getStatusType = (status?: string) => {
  const map = { running: 'success', stopped: 'warning', paused: 'info', restarting: 'warning', error: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status?: string) => {
  const map = { running: '运行�?, stopped: '已停�?, paused: '暂停', restarting: '重启�?, error: '错误' }
  return map[status] || '未知'
}

const getUsageColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

const formatTime = (time?: string) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const parsePortMappings = (ports?: string) => {
  if (!ports) return []
  try {
    const mappings = JSON.parse(ports)
    if (Array.isArray(mappings)) {
      return mappings.map(p => `${p.hostPort}:${p.containerPort}`)
    }
    return []
  } catch {
    return ports.split(',').filter(Boolean)
  }
}

const parseVolumes = (volumes?: string) => {
  if (!volumes) return []
  try {
    const volumeList = JSON.parse(volumes)
    return Array.isArray(volumeList) ? volumeList : []
  } catch {
    return volumes.split(',').filter(Boolean)
  }
}

const formatEnvVars = (envVars?: string) => {
  if (!envVars) return '暂无环境变量'
  try {
    const vars = JSON.parse(envVars)
    if (typeof vars === 'object') {
      return Object.entries(vars)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')
    }
    return envVars
  } catch {
    return envVars
  }
}

const formatJson = (jsonStr?: string) => {
  if (!jsonStr) return '{}'
  try {
    const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
    return JSON.stringify(obj, null, 2)
  } catch {
    return jsonStr
  }
}

const handleRefresh = async () => {
  if (!props.containerData?.systemSoftContainerId) return
  
  try {
    refreshing.value = true
    // 修复方法调用错误，使用正确的API方法
    const response = await containerApi.getContainerById(props.containerData.systemSoftContainerId)
    if (response.code === '00000') {
      ElMessage.success('容器数据已刷�?)
      // 这里可以触发父组件更新数�?
    } else {
      ElMessage.error(response.message || '刷新失败')
    }
  } catch (error) {
    ElMessage.error('刷新容器数据失败')
  } finally {
    refreshing.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.container-detail {
  max-height: 600px;
  overflow-y: auto;
}

.container-id {
  font-family: monospace;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.network-section, .environment-section, .volumes-section {
  padding: 16px 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.port-mappings {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.port-mapping-item {
  margin-bottom: 8px;
}

.port-tag, .volume-tag {
  font-family: monospace;
  font-size: 12px;
}

.network-mode, .ip-address {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-family: monospace;
  margin-bottom: 24px;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.resource-card {
  text-align: center;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.resource-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 16px;
}

.resource-chart {
  margin-bottom: 16px;
}

.resource-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.resource-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.stat-value {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
}

.env-vars, .volumes-list {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.env-code {
  font-family: 'Consolas', 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #303133;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.volumes-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.volume-item {
  margin-bottom: 8px;
}

.no-data {
  text-align: center;
  color: #909399;
  padding: 40px;
  font-size: 14px;
}

.config-section {
  padding: 16px 0;
}

.config-json {
  margin-top: 24px;
}

.config-code {
  font-family: 'Consolas', 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #303133;
  margin: 0;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}

.charts-section {
  padding: 16px 0;
}

.chart-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-item {
  flex: 1;
  min-width: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .resources-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-row {
    flex-direction: column;
  }
}
</style>
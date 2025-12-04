<template>
  <div class="container-group-view">
    <ProgressMonitor />
    
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <IconifyIconOnline icon="ri:container-line" class="title-icon" />
          <span>容器管理（分组视图）</span>
        </div>
        <div class="page-subtitle">通过服务器或容器分组查看和管理Docker容器</div>
      </div>
      <div class="header-right">
        <el-radio-group v-model="groupMode" size="default" @change="handleGroupModeChange">
          <el-radio-button label="server">按服务器分组</el-radio-button>
          <el-radio-button label="software">按软件分�?/el-radio-button>
        </el-radio-group>
        <el-button @click="handleRefresh" :loading="loading">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索�?-->
    <div class="search-bar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索容器名称或镜�?.." 
        class="search-input" 
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="状态筛�? clearable @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="运行�? value="running" />
        <el-option label="已停�? value="stopped" />
        <el-option label="暂停" value="paused" />
      </el-select>
    </div>

    <!-- 分组展示区域 -->
    <div class="groups-container">
      <!-- 按服务器分组 -->
      <div v-if="groupMode === 'server'" class="server-groups">
        <el-collapse v-model="activeGroups" accordion>
          <el-collapse-item 
            v-for="group in serverGroups" 
            :key="group.serverId" 
            :name="group.serverId"
          >
            <template #title>
              <div class="group-header">
                <div class="group-title">
                  <IconifyIconOnline icon="ri:server-line" class="group-icon" />
                  <span class="group-name">{{ group.serverName || `服务�?#${group.serverId}` }}</span>
                  <el-tag size="small" class="group-count">{{ group.containers.length }} 个容�?/el-tag>
                </div>
                <div class="group-actions" @click.stop>
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="handleGroupStartAll(group.serverId)"
                    :disabled="!hasStoppedContainers(group.containers)"
                  >
                    <IconifyIconOnline icon="ri:play-line" class="mr-1" />
                    启动全部
                  </el-button>
                  <el-button 
                    size="small" 
                    type="warning" 
                    @click="handleGroupStopAll(group.serverId)"
                    :disabled="!hasRunningContainers(group.containers)"
                  >
                    <IconifyIconOnline icon="ri:stop-line" class="mr-1" />
                    停止全部
                  </el-button>
                </div>
              </div>
            </template>
            <div class="containers-grid">
              <ContainerCard 
                v-for="container in group.containers" 
                :key="container.systemSoftContainerId"
                :container="container"
                @start="handleStart"
                @stop="handleStop"
                @restart="handleRestart"
                @delete="handleDelete"
                @detail="handleDetail"
                @logs="handleLogs"
                @exec="handleExec"
              />
            </div>
          </el-collapse-item>
        </el-collapse>
        <el-empty v-if="serverGroups.length === 0" description="暂无容器数据" />
      </div>

      <!-- 按软件分�?-->
      <div v-else class="software-groups">
        <el-collapse v-model="activeGroups" accordion>
          <el-collapse-item 
            v-for="group in softwareGroups" 
            :key="group.softId" 
            :name="group.softId"
          >
            <template #title>
              <div class="group-header">
                <div class="group-title">
                  <IconifyIconOnline icon="ri:apps-line" class="group-icon" />
                  <span class="group-name">{{ group.softName || `软件 #${group.softId}` }}</span>
                  <el-tag size="small" class="group-count">{{ group.containers.length }} 个容�?/el-tag>
                </div>
                <div class="group-stats">
                  <el-tag 
                    v-if="getRunningCount(group.containers) > 0" 
                    type="success" 
                    size="small"
                  >
                    {{ getRunningCount(group.containers) }} 运行�?
                  </el-tag>
                  <el-tag 
                    v-if="getStoppedCount(group.containers) > 0" 
                    type="info" 
                    size="small"
                  >
                    {{ getStoppedCount(group.containers) }} 已停�?
                  </el-tag>
                </div>
              </div>
            </template>
            <div class="containers-grid">
              <ContainerCard 
                v-for="container in group.containers" 
                :key="container.systemSoftContainerId"
                :container="container"
                @start="handleStart"
                @stop="handleStop"
                @restart="handleRestart"
                @delete="handleDelete"
                @detail="handleDetail"
                @logs="handleLogs"
                @exec="handleExec"
              />
            </div>
          </el-collapse-item>
        </el-collapse>
        <el-empty v-if="softwareGroups.length === 0" description="暂无容器数据" />
      </div>
    </div>

    <!-- 容器详情对话�?-->
    <ContainerDetailDialog v-model:visible="detailDialogVisible" :container-data="currentContainer" />

    <!-- 容器日志对话�?-->
    <ContainerLogsDialog v-model:visible="logsDialogVisible" :container-data="currentContainer" />

    <!-- 终端对话�?-->
    <ServerTerminalDialog ref="terminalRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProgressMonitor from '@/components/ProgressMonitor.vue'
import ServerTerminalDialog from '@/views/server/modules/server-management/components/ServerTerminalDialog.vue'
import ContainerDetailDialog from './components/ContainerDetailDialog.vue'
import ContainerLogsDialog from './components/ContainerLogsDialog.vue'
import ContainerCard from './components/ContainerCard.vue'
import { containerApi, getServerList, type SystemSoftContainer } from '@/api/docker'
import { getServerInfo, sendServerData } from '@/api/server'

// 状�?
const groupMode = ref<'server' | 'software'>('server')
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('')
const activeGroups = ref<(number | string)[]>([])
const containerList = ref<SystemSoftContainer[]>([])
const serverList = ref<any[]>([])

// 对话框状�?
const detailDialogVisible = ref(false)
const logsDialogVisible = ref(false)
const currentContainer = ref<SystemSoftContainer | null>(null)
const terminalRef = ref()

// 分组数据
interface ServerGroup {
  serverId: number
  serverName: string
  containers: SystemSoftContainer[]
}

interface SoftwareGroup {
  softId: number
  softName: string
  containers: SystemSoftContainer[]
}

// 按服务器分组
const serverGroups = computed<ServerGroup[]>(() => {
  const groups = new Map<number, ServerGroup>()
  
  filteredContainers.value.forEach(container => {
    const serverId = container.systemServerId || 0
    if (!groups.has(serverId)) {
      const server = serverList.value.find(s => s.id === serverId)
      groups.set(serverId, {
        serverId,
        serverName: server?.name || `服务�?#${serverId}`,
        containers: []
      })
    }
    groups.get(serverId)!.containers.push(container)
  })
  
  return Array.from(groups.values())
})

// 按软件分�?
const softwareGroups = computed<SoftwareGroup[]>(() => {
  const groups = new Map<number, SoftwareGroup>()
  
  filteredContainers.value.forEach(container => {
    const softId = container.systemSoftId || 0
    if (!groups.has(softId)) {
      groups.set(softId, {
        softId,
        softName: container.systemSoftContainerImage || `软件 #${softId}`,
        containers: []
      })
    }
    groups.get(softId)!.containers.push(container)
  })
  
  return Array.from(groups.values())
})

// 过滤后的容器列表
const filteredContainers = computed(() => {
  let result = containerList.value
  
  // 关键词搜�?
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(c => 
      c.systemSoftContainerName?.toLowerCase().includes(keyword) ||
      c.systemSoftContainerImage?.toLowerCase().includes(keyword)
    )
  }
  
  // 状态筛�?
  if (statusFilter.value) {
    result = result.filter(c => c.systemSoftContainerStatus === statusFilter.value)
  }
  
  return result
})

// 工具函数
const hasRunningContainers = (containers: SystemSoftContainer[]) => {
  return containers.some(c => c.systemSoftContainerStatus === 'running')
}

const hasStoppedContainers = (containers: SystemSoftContainer[]) => {
  return containers.some(c => c.systemSoftContainerStatus === 'stopped' || c.systemSoftContainerStatus === 'exited')
}

const getRunningCount = (containers: SystemSoftContainer[]) => {
  return containers.filter(c => c.systemSoftContainerStatus === 'running').length
}

const getStoppedCount = (containers: SystemSoftContainer[]) => {
  return containers.filter(c => c.systemSoftContainerStatus === 'stopped' || c.systemSoftContainerStatus === 'exited').length
}

// 数据加载
const loadContainers = async () => {
  try {
    loading.value = true
    const response = await containerApi.getContainerPageList({ page: 1, size: 1000 })
    if (response.code === '00000') {
      containerList.value = response.data.records || []
    } else {
      ElMessage.error(response.msg || '加载容器列表失败')
    }
  } catch (error) {
    ElMessage.error('加载容器列表失败')
  } finally {
    loading.value = false
  }
}

const loadServers = async () => {
  try {
    const response = await getServerList()
    if (response.code === '00000') {
      serverList.value = response.data || []
    }
  } catch (error) {
    console.error('加载服务器列表失�?', error)
  }
}

// 事件处理
const handleRefresh = () => {
  loadContainers()
}

const handleSearch = () => {
  // 筛选逻辑由computed自动处理
}

const handleGroupModeChange = () => {
  activeGroups.value = []
}

// 组操�?
const handleGroupStartAll = async (serverId: number) => {
  const group = serverGroups.value.find(g => g.serverId === serverId)
  if (!group) return
  
  const stoppedContainers = group.containers.filter(c => 
    c.systemSoftContainerStatus === 'stopped' || c.systemSoftContainerStatus === 'exited'
  )
  
  if (stoppedContainers.length === 0) {
    ElMessage.warning('没有需要启动的容器')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要启动服务器 "${group.serverName}" 上的 ${stoppedContainers.length} 个已停止容器吗？`,
      '批量启动确认',
      { type: 'warning' }
    )
    
    const response = await containerApi.batchOperateContainers({
      containerIds: stoppedContainers.map(c => c.systemSoftContainerId!),
      operation: 'start'
    })
    
    if (response.code === '00000') {
      ElMessage.success(`批量启动完成，成�? ${response.data.success}，失�? ${response.data.failed}`)
      loadContainers()
    } else {
      ElMessage.error(response.msg || '批量启动失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量启动容器失败')
    }
  }
}

const handleGroupStopAll = async (serverId: number) => {
  const group = serverGroups.value.find(g => g.serverId === serverId)
  if (!group) return
  
  const runningContainers = group.containers.filter(c => c.systemSoftContainerStatus === 'running')
  
  if (runningContainers.length === 0) {
    ElMessage.warning('没有需要停止的容器')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要停止服务器 "${group.serverName}" 上的 ${runningContainers.length} 个运行中容器吗？`,
      '批量停止确认',
      { type: 'warning' }
    )
    
    const response = await containerApi.batchOperateContainers({
      containerIds: runningContainers.map(c => c.systemSoftContainerId!),
      operation: 'stop'
    })
    
    if (response.code === '00000') {
      ElMessage.success(`批量停止完成，成�? ${response.data.success}，失�? ${response.data.failed}`)
      loadContainers()
    } else {
      ElMessage.error(response.msg || '批量停止失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量停止容器失败')
    }
  }
}

// 容器操作
const handleStart = async (container: SystemSoftContainer) => {
  try {
    const response = await containerApi.startContainer(container.systemSoftContainerId!)
    if (response.code === '00000') {
      ElMessage.success('容器启动成功')
      loadContainers()
    } else {
      ElMessage.error(response.msg || '容器启动失败')
    }
  } catch (error) {
    ElMessage.error('容器启动失败')
  }
}

const handleStop = async (container: SystemSoftContainer) => {
  try {
    await ElMessageBox.confirm('确定要停止这个容器吗�?, '停止确认', { type: 'warning' })
    
    const response = await containerApi.stopContainer(container.systemSoftContainerId!)
    if (response.code === '00000') {
      ElMessage.success('容器停止成功')
      loadContainers()
    } else {
      ElMessage.error(response.msg || '容器停止失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('容器停止失败')
    }
  }
}

const handleRestart = async (container: SystemSoftContainer) => {
  try {
    const response = await containerApi.restartContainer(container.systemSoftContainerId!)
    if (response.code === '00000') {
      ElMessage.success('容器重启成功')
      loadContainers()
    } else {
      ElMessage.error(response.msg || '容器重启失败')
    }
  } catch (error) {
    ElMessage.error('容器重启失败')
  }
}

const handleDelete = async (container: SystemSoftContainer) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个容器吗？此操作不可恢复�?,
      '删除确认',
      { type: 'error' }
    )
    
    const response = await containerApi.deleteContainer(container.systemSoftContainerId!)
    if (response.code === '00000') {
      ElMessage.success('容器删除成功')
      loadContainers()
    } else {
      ElMessage.error(response.msg || '容器删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('容器删除失败')
    }
  }
}

const handleDetail = (container: SystemSoftContainer) => {
  currentContainer.value = container
  detailDialogVisible.value = true
}

const handleLogs = (container: SystemSoftContainer) => {
  currentContainer.value = container
  logsDialogVisible.value = true
}

const handleExec = async (container: SystemSoftContainer) => {
  try {
    const serverId = String(container.systemServerId || container.systemSoftContainerServerId)
    if (!serverId) {
      ElMessage.warning('缺少服务器ID')
      return
    }
    
    const { data, code, msg } = await getServerInfo(serverId)
    if (code !== 0 || !data) {
      ElMessage.error(msg || '获取服务器信息失�?)
      return
    }
    
    terminalRef.value?.setData?.(data)
    terminalRef.value?.open?.()
    
    const containerName = container.systemSoftContainerName || container.containerName
    const shell = '/bin/sh'
    setTimeout(() => {
      sendServerData(serverId, `docker exec -it ${containerName} ${shell}\n`).catch(() => {})
    }, 800)
  } catch (error) {
    console.error(error)
    ElMessage.error('进入容器失败')
  }
}

// 生命周期
onMounted(() => {
  loadContainers()
  loadServers()
})
</script>

<style scoped>
.container-group-view {
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

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 8px;
}

.title-icon {
  margin-right: 8px;
  color: var(--app-primary);
}

.page-subtitle {
  color: var(--app-text-secondary);
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.groups-container {
  background: var(--app-card-bg);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
  padding: 20px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 20px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
}

.group-icon {
  font-size: 20px;
  color: var(--app-primary);
}

.group-name {
  color: var(--app-text-primary);
}

.group-count {
  margin-left: 8px;
}

.group-actions {
  display: flex;
  gap: 8px;
}

.group-stats {
  display: flex;
  gap: 8px;
}

.containers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

:deep(.el-collapse-item__header) {
  height: auto;
  line-height: 1.5;
  padding: 12px 0;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 16px;
}

@media (max-width: 1400px) {
  .containers-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .container-group-view {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-right {
    width: 100%;
    flex-direction: column;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-input {
    max-width: 100%;
  }

  .containers-grid {
    grid-template-columns: 1fr;
  }

  .group-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .group-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>


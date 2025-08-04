<template>
  <el-dialog
    v-model="visible"
    title="节点日志配置"
    width="80%"
    :before-close="handleClose"
    append-to-body
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-info">
          <IconifyIconOnline icon="ri:settings-4-line" class="header-icon" />
          <div class="header-text">
            <h3>节点日志配置</h3>
            <p v-if="nodeInfo">
              {{ nodeInfo.nodeName || nodeInfo.applicationName }} 
              ({{ nodeInfo.ipAddress }}:{{ nodeInfo.port }})
            </p>
          </div>
        </div>
      </div>
    </template>

    <div class="logger-config-content">
      <!-- 搜索框 -->
      <div class="search-section">
        <el-input
          v-model="searchText"
          placeholder="搜索日志器名称"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-button
          type="primary"
          :loading="loading"
          @click="refreshLoggers"
          style="margin-left: 12px"
        >
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新配置
        </el-button>
      </div>

      <!-- 日志配置表格 -->
      <el-table
        :data="filteredLoggers"
        v-loading="loading"
        stripe
        border
        height="400"
        style="margin-top: 16px"
      >
        <el-table-column prop="pluginNodeLoggerConfigLoggerName" label="日志器名称" min-width="200">
          <template #default="{ row }">
            <div class="logger-name">
              <IconifyIconOnline 
                :icon="row.pluginNodeLoggerConfigLoggerName === 'ROOT' ? 'ri:home-line' : 'ri:folder-line'" 
                class="logger-icon"
              />
              <span>{{ row.pluginNodeLoggerConfigLoggerName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="pluginNodeLoggerConfigCurrentLevel" label="当前等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.pluginNodeLoggerConfigCurrentLevel)" size="small">
              {{ row.pluginNodeLoggerConfigCurrentLevel || 'INHERIT' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="pluginNodeLoggerConfigConfiguredLevel" label="配置等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.pluginNodeLoggerConfigConfiguredLevel)" size="small">
              {{ row.pluginNodeLoggerConfigConfiguredLevel || 'INHERIT' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="设置等级" width="150" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.newLevel"
              placeholder="选择等级"
              size="small"
              style="width: 100px"
            >
              <el-option label="INHERIT" value="" />
              <el-option
                v-for="level in logLevels"
                :key="level"
                :label="level"
                :value="level"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :loading="row.updating"
              @click="updateLoggerLevel(row)"
              :disabled="!row.newLevel && row.newLevel !== ''"
            >
              <IconifyIconOnline icon="ri:check-line" />
              应用
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { IconifyIconOnline } from '@/components/ReIcon'
import { 
  getNodeLoggers, 
  setLoggerLevel, 
  refreshNodeLoggers,
  encodeNodeUrl,
  getLevelTagType,
  type NodeLoggerConfig,
  type LogLevel
} from '@/api/node-logger-config'

// 定义组件属性
interface Props {
  modelValue: boolean
  nodeInfo?: {
    nodeName?: string
    applicationName: string
    ipAddress: string
    port: number
  } | null
}

// 定义事件
interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loggers = ref<NodeLoggerConfig[]>([])
const searchText = ref('')
const loading = ref(false)

// 日志等级选项
const logLevels: LogLevel[] = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']

// 计算属性
const filteredLoggers = computed(() => {
  if (!searchText.value) return loggers.value
  return loggers.value.filter(logger => 
    logger.pluginNodeLoggerConfigLoggerName.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 监听节点信息变化
watch(() => props.nodeInfo, (newNodeInfo) => {
  if (newNodeInfo && visible.value) {
    loadLoggers()
  }
}, { immediate: true })

// 监听弹框显示状态
watch(visible, (newVisible) => {
  if (newVisible && props.nodeInfo) {
    loadLoggers()
  } else if (!newVisible) {
    // 关闭时清理数据
    loggers.value = []
    searchText.value = ''
  }
})

// 方法
const loadLoggers = async () => {
  if (!props.nodeInfo) return
  
  loading.value = true
  try {
    const encodedNodeUrl = encodeNodeUrl(props.nodeInfo.ipAddress, props.nodeInfo.port)
    const response = await getNodeLoggers(encodedNodeUrl)
    
    if (response.success) {
      loggers.value = (response.loggers || []).map((logger: any) => ({
        ...logger,
        newLevel: logger.pluginNodeLoggerConfigConfiguredLevel || '',
        updating: false
      }))
    } else {
      ElMessage.error('获取日志配置失败')
      loggers.value = []
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
    loggers.value = []
  } finally {
    loading.value = false
  }
}

const refreshLoggers = async () => {
  if (!props.nodeInfo) return
  
  loading.value = true
  try {
    const encodedNodeUrl = encodeNodeUrl(props.nodeInfo.ipAddress, props.nodeInfo.port)
    const response = await refreshNodeLoggers(encodedNodeUrl)
    
    if (response.success) {
      await loadLoggers()
      ElMessage.success('日志配置刷新成功')
    } else {
      ElMessage.error('刷新日志配置失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

const updateLoggerLevel = async (logger: NodeLoggerConfig & { newLevel?: string; updating?: boolean }) => {
  if (!props.nodeInfo) return
  
  logger.updating = true
  try {
    const encodedNodeUrl = encodeNodeUrl(props.nodeInfo.ipAddress, props.nodeInfo.port)
    const response = await setLoggerLevel(
      encodedNodeUrl, 
      logger.pluginNodeLoggerConfigLoggerName, 
      logger.newLevel || ''
    )
    
    if (response.success) {
      logger.pluginNodeLoggerConfigConfiguredLevel = (logger.newLevel || undefined) as LogLevel
      logger.pluginNodeLoggerConfigCurrentLevel = (logger.newLevel || undefined) as LogLevel
      ElMessage.success('日志等级设置成功')
    } else {
      ElMessage.error('设置日志等级失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    logger.updating = false
  }
}

const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
.dialog-header {
  .header-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 24px;
      color: #409eff;
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }

      p {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: #909399;
      }
    }
  }
}

.logger-config-content {
  .search-section {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  .logger-name {
    display: flex;
    align-items: center;
    gap: 8px;

    .logger-icon {
      color: #409eff;
      font-size: 16px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

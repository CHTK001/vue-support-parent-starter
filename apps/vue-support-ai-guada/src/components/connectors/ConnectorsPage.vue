<template>
  <div class="connectors-page h-full flex flex-col">
    <!-- 页面标题 -->
    <div class="px-6 pt-6 pb-4">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-[#e8e9ed]">连接器</h1>
      <p class="text-sm text-gray-500 dark:text-[#8b8d95] mt-1">绑定第三方平台，让 AI 机器人接入你的常用工具</p>
    </div>

    <!-- 已绑定连接器区域 -->
    <div class="px-6 pb-4">
      <h2 class="text-base font-medium text-gray-900 dark:text-[#e8e9ed] mb-3">已绑定</h2>
      <div v-if="boundConnectors.length === 0" class="text-sm text-gray-400 dark:text-[#6b6d75] py-8 text-center bg-gray-50 dark:bg-[#1a1b1e] rounded-xl">
        暂无已绑定的连接器
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="connector in boundConnectors"
          :key="connector.id"
          class="connector-card cursor-pointer bg-white dark:bg-[#25262b] rounded-xl border border-gray-200 dark:border-[#3a3b40] p-4 hover:shadow-lg transition-shadow"
          @click="openBoundConnector(connector)"
        >
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="getConnectorIconBg(connector.type)">
              <span class="text-2xl">{{ getConnectorIcon(connector.type) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-[#e8e9ed] truncate">{{ connector.name }}</div>
              <div class="text-xs text-gray-500 dark:text-[#8b8d95] mt-1">{{ getConnectorTypeName(connector.type) }}</div>
              <div class="text-xs text-gray-400 dark:text-[#6b6d75] mt-2">
                模型: {{ connector.modelName || '默认模型' }}
              </div>
            </div>
            <el-button
              size="small"
              type="danger"
              plain
              @click.stop="unbindConnector(connector)"
            >解绑</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 可绑定连接器区域 -->
    <div class="px-6 pb-6">
      <h2 class="text-base font-medium text-gray-900 dark:text-[#e8e9ed] mb-3">可绑定</h2>
      <div v-if="availableConnectors.length === 0" class="text-sm text-gray-400 dark:text-[#6b6d75] py-8 text-center bg-gray-50 dark:bg-[#1a1b1e] rounded-xl">
        暂无可绑定的连接器
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="connector in availableConnectors"
          :key="connector.type"
          class="connector-card cursor-pointer bg-white dark:bg-[#25262b] rounded-xl border border-gray-200 dark:border-[#3a3b40] p-4 hover:shadow-lg transition-shadow"
          @click="openBindDialog(connector)"
        >
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="getConnectorIconBg(connector.type)">
              <span class="text-2xl">{{ getConnectorIcon(connector.type) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-[#e8e9ed]">{{ connector.name }}</div>
              <div class="text-xs text-gray-500 dark:text-[#8b8d95] mt-1">{{ connector.description }}</div>
            </div>
            <el-button type="primary" size="small">绑定</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 绑定对话框 -->
    <el-dialog
      v-model="bindDialogVisible"
      :title="currentConnector ? `绑定 ${currentConnector.name}` : '绑定连接器'"
      width="500px"
      @closed="resetBindForm"
    >
      <div v-if="currentConnector">
        <!-- 动态加载绑定表单组件 -->
        <component
          :is="bindFormComponent"
          v-model="bindForm"
        />

        <!-- 模型选择 -->
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-[#3a3b40]">
          <el-form label-position="top">
            <el-form-item label="使用模型">
              <el-select v-model="bindForm.modelName" placeholder="选择模型" class="w-full">
                <el-option label="默认模型" value="" />
                <el-option v-for="model in models" :key="model.id" :label="model.name" :value="model.modelId" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="binding" @click="handleBind">确认绑定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiService } from '@/services/ApiService'
import ILinkBindForm from './bind-forms/ILinkBindForm.vue'
import FeishuBindForm from './bind-forms/FeishuBindForm.vue'
import WecomBindForm from './bind-forms/WecomBindForm.vue'

// 状态
const boundConnectors = ref<any[]>([])
const availableConnectors = ref<any[]>([])
const models = ref<any[]>([])

// 绑定对话框
const bindDialogVisible = ref(false)
const currentConnector = ref<any>(null)
const binding = ref(false)
const bindForm = ref<Record<string, any>>({})

// 绑定表单组件映射
const bindFormComponents: Record<string, any> = {
  ilink: ILinkBindForm,
  feishu: FeishuBindForm,
  wecom: WecomBindForm
}

const bindFormComponent = computed(() => {
  if (!currentConnector.value) return null
  return bindFormComponents[currentConnector.value.type] || null
})

// 获取连接器列表
const fetchConnectors = async () => {
  try {
    const typesRes = await apiService.get('/v2/connectors/types')
    availableConnectors.value = typesRes.data || []

    const boundRes = await apiService.get('/v2/connectors/bound')
    boundConnectors.value = boundRes.data || []

    const modelsRes = await apiService.get('/v2/models')
    models.value = modelsRes.data || []
  } catch (error) {
    console.error('获取连接器列表失败:', error)
    // 使用模拟数据
    availableConnectors.value = [
      { type: 'ilink', name: '微信', description: '通过 iLink 扫码接入微信', icon: '💬' },
      { type: 'feishu', name: '飞书', description: '通过 App ID/Secret 接入飞书机器人', icon: '🐦' },
      { type: 'wecom', name: '企业微信', description: '通过 CorpID/Secret 接入企业微信', icon: '💼' },
    ]
    boundConnectors.value = []
  }
}

// 打开绑定对话框
const openBindDialog = (connector: any) => {
  currentConnector.value = connector
  bindForm.value = { modelName: '' }
  bindDialogVisible.value = true
}

// 重置绑定表单
const resetBindForm = () => {
  currentConnector.value = null
  bindForm.value = {}
}

// 处理绑定
const handleBind = async () => {
  if (!currentConnector.value) return
  binding.value = true
  try {
    await apiService.post('/v2/connectors/bind', {
      type: currentConnector.value.type,
      ...bindForm.value
    })
    ElMessage.success('绑定成功')
    bindDialogVisible.value = false
    fetchConnectors()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '绑定失败')
  } finally {
    binding.value = false
  }
}

// 解绑
const unbindConnector = async (connector: any) => {
  try {
    await ElMessageBox.confirm(`确定要解绑 ${connector.name} 吗？`, '确认解绑', {
      type: 'warning'
    })
    await apiService.delete(`/v2/connectors/${connector.id}`)
    ElMessage.success('解绑成功')
    fetchConnectors()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('解绑失败')
    }
  }
}

// 打开已绑定连接器
const openBoundConnector = (connector: any) => {
  window.location.href = `/connectors/chat/${connector.id}`
}

// 获取连接器图标
const getConnectorIcon = (type: string) => {
  const icons: Record<string, string> = {
    ilink: '💬',
    feishu: '🐦',
    wecom: '💼',
    dingtalk: '📌',
  }
  return icons[type] || '🔌'
}

// 获取连接器图标背景
const getConnectorIconBg = (type: string) => {
  const colors: Record<string, string> = {
    ilink: 'bg-green-100 dark:bg-green-900/30',
    feishu: 'bg-blue-100 dark:bg-blue-900/30',
    wecom: 'bg-teal-100 dark:bg-teal-900/30',
    dingtalk: 'bg-blue-100 dark:bg-blue-900/30',
  }
  return colors[type] || 'bg-gray-100 dark:bg-gray-800'
}

// 获取连接器类型名称
const getConnectorTypeName = (type: string) => {
  const names: Record<string, string> = {
    ilink: '微信 (iLink)',
    feishu: '飞书',
    wecom: '企业微信',
    dingtalk: '钉钉',
  }
  return names[type] || type
}

onMounted(() => {
  fetchConnectors()
})
</script>

<style scoped>
.connector-card {
  transition: all 0.2s ease;
}

.connector-card:hover {
  transform: translateY(-2px);
}
</style>

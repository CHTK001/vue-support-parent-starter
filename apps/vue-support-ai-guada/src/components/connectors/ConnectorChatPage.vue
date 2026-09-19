<template>
  <div class="connector-chat-page h-full flex flex-col bg-white dark:bg-[#1a1b1e]">
    <!-- 顶部导航 -->
    <div class="flex items-center px-4 py-3 border-b border-gray-200 dark:border-[#2e3035]">
      <el-button
        size="small"
        @click="goBack"
        class="mr-3"
      >
        <el-icon><ArrowLeft16Regular /></el-icon>
        返回
      </el-button>
      <div class="flex items-center gap-3 flex-1">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="iconBgClass">
          <span class="text-lg">{{ connectorIcon }}</span>
        </div>
        <div>
          <div class="font-medium text-gray-900 dark:text-[#e8e9ed]">{{ connectorName }}</div>
          <div class="text-xs text-gray-500 dark:text-[#8b8d95]">{{ connectorTypeName }}</div>
        </div>
      </div>
      <div v-if="modelName" class="text-sm text-gray-500 dark:text-[#8b8d95]">
        模型: {{ modelName }}
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="flex-1 overflow-y-auto px-4 py-6">
      <div class="max-w-3xl mx-auto space-y-6">
        <!-- 欢迎消息 -->
        <div v-if="messages.length === 0 && !loading" class="text-center py-12">
          <div class="text-4xl mb-4">{{ connectorIcon }}</div>
          <h2 class="text-xl font-medium text-gray-900 dark:text-[#e8e9ed] mb-2">
            欢迎使用 {{ connectorName }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-[#8b8d95]">
            在这里与 {{ connectorName }} 上的联系人聊天，AI 会自动回复消息
          </p>
        </div>

        <!-- 加载中 -->
        <div v-if="loading" class="text-center py-8">
          <el-icon class="is-loading" size="24">
            <LoadingOutlined />
          </el-icon>
        </div>

        <!-- 消息列表 -->
        <div
          v-for="message in messages"
          :key="message.id"
          class="flex gap-3"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div v-if="message.role === 'assistant'" class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <span class="text-sm">{{ connectorIcon }}</span>
          </div>
          <div
            class="max-w-[70%] rounded-2xl px-4 py-2.5"
            :class="message.role === 'user'
              ? 'bg-primary text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-[#2e3035] text-gray-900 dark:text-[#e8e9ed] rounded-tl-sm'
            "
          >
            <div class="text-sm whitespace-pre-wrap">{{ message.content }}</div>
            <div class="text-xs mt-1 opacity-70">{{ formatTime(message.createTime) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="border-t border-gray-200 dark:border-[#2e3035] px-4 py-3">
      <div class="max-w-3xl mx-auto">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          placeholder="输入消息..."
          @keydown.enter.prevent="sendMessage"
        />
        <div class="flex justify-end mt-2">
          <el-button
            type="primary"
            @click="sendMessage"
            :loading="sending"
          >发送</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft16Regular, LoadingOutlined } from '@fluentui/vue-icons'
import { apiService } from '@/services/ApiService'

const route = useRoute()
const router = useRouter()

// 连接器 ID
const connectorId = computed(() => route.params.id as string)

// 连接器信息
const connectorInfo = ref<any>({})
const messages = ref<any[]>([])
const inputMessage = ref('')
const sending = ref(false)
const loading = ref(false)

// 连接器类型相关
const connectorType = computed(() => connectorInfo.value.type || 'ilink')
const connectorName = computed(() => connectorInfo.value.name || '微信')
const connectorTypeName = computed(() => {
  const names: Record<string, string> = {
    ilink: '微信 (iLink)',
    feishu: '飞书',
    wecom: '企业微信',
  }
  return names[connectorType.value] || connectorType.value
})
const connectorIcon = computed(() => {
  const icons: Record<string, string> = {
    ilink: '💬',
    feishu: '🐦',
    wecom: '💼',
  }
  return icons[connectorType.value] || '🔌'
})
const iconBgClass = computed(() => {
  const colors: Record<string, string> = {
    ilink: 'bg-green-100 dark:bg-green-900/30',
    feishu: 'bg-blue-100 dark:bg-blue-900/30',
    wecom: 'bg-teal-100 dark:bg-teal-900/30',
  }
  return colors[connectorType.value] || 'bg-gray-100 dark:bg-gray-800'
})
const modelName = computed(() => connectorInfo.value.modelName || '')

// 格式化时间
const formatTime = (time: any) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleTimeString()
}

// 返回
const goBack = () => {
  router.push('/connectors')
}

// 获取连接器信息
const fetchConnectorInfo = async () => {
  try {
    const res = await apiService.get(`/v2/connectors/${connectorId.value}`)
    connectorInfo.value = res.data || {}
  } catch (error) {
    console.error('获取连接器信息失败:', error)
  }
}

// 获取历史消息
const fetchMessages = async () => {
  loading.value = true
  try {
    const res = await apiService.get(`/v2/connectors/${connectorId.value}/messages`, {
      params: { limit: 50 }
    })
    messages.value = res.data || []
  } catch (error) {
    console.error('获取历史消息失败:', error)
  } finally {
    loading.value = false
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return
  sending.value = true

  // 添加用户消息
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: inputMessage.value,
    createTime: new Date().toISOString()
  })

  const content = inputMessage.value
  inputMessage.value = ''

  try {
    // 发送消息到后端
    await apiService.post(`/v2/connectors/${connectorId.value}/send`, { content })

    // TODO: 等待 AI 回复（通过 SSE 或轮询）
    // 暂时模拟 AI 回复
    setTimeout(() => {
      messages.value.push({
        id: Date.now() + 1,
        role: 'assistant',
        content: `收到消息："${content}"，AI 正在回复...`,
        createTime: new Date().toISOString()
      })
    }, 1000)
  } catch (error) {
    ElMessage.error('发送失败')
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  fetchConnectorInfo()
  fetchMessages()
})
</script>

<style scoped>
.connector-chat-page {
  height: 100%;
}
</style>

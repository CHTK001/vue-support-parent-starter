<template>
  <RePage title="连接器" subtitle="绑定第三方平台，让 AI 机器人接入你的常用工具">

    <!-- 已绑定连接器区域 -->
    <section class="px-6 py-4">
      <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 tracking-wide">已绑定</h2>
      <div
        v-if="boundConnectors.length === 0"
        class="flex flex-col items-center justify-center gap-2 py-10 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-400"
      >
        <ConnectorIcon type="unknown" />
        <span class="text-sm">暂无已绑定的连接器</span>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <article
          v-for="connector in boundConnectors"
          :key="connector.id"
          class="connector-card group flex items-center gap-3 cursor-pointer bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200 hover:border-primary/60 hover:shadow-md"
          @click="openBoundConnector(connector)"
        >
          <div
            class="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-white"
            :class="getConnectorIconBg(normType(connector.type))"
          >
            <ConnectorIcon :type="normType(connector.type)" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ connector.name || getConnectorTypeName(normType(connector.type)) }}</div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="isOnline(connector.status) ? 'bg-green-500' : 'bg-gray-400'"></span>
              <span :class="isOnline(connector.status) ? 'text-green-600' : 'text-gray-400 dark:text-gray-400'">{{ isOnline(connector.status) ? '在线' : '离线' }}</span>
              <span class="text-gray-300 dark:text-gray-500">·</span>
              <span class="truncate">{{ getConnectorTypeName(normType(connector.type)) }}</span>
            </div>
          </div>
          <div
            class="bound-actions flex items-center gap-0.5 shrink-0"
            @click.stop
          >
            <button
              type="button"
              class="w-5 h-5 rounded-md flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              title="进入聊天"
              @click="openBoundConnector(connector)"
            >
              <MessageOutlined class="text-[12px]" />
            </button>
            <button
              type="button"
              class="w-5 h-5 rounded-md flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              title="编辑"
              @click="openEditDialog(connector)"
            >
              <EditOutlined class="text-[12px]" />
            </button>
            <button
              type="button"
              class="w-5 h-5 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
              title="解绑"
              @click="unbindConnector(connector)"
            >
              <DeleteOutlined class="text-[12px]" />
            </button>
          </div>
        </article>
      </div>
    </section>

    <!-- 可绑定连接器区域 -->
    <section class="px-6 py-4">
      <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 tracking-wide">可绑定</h2>
      <div
        v-if="availableConnectors.length === 0"
        class="flex flex-col items-center justify-center gap-2 py-10 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-400"
      >
        <span class="text-sm">暂无可绑定的连接器</span>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <article
          v-for="connector in availableConnectors"
          :key="connector.type"
          class="connector-card group flex items-center gap-3 cursor-pointer bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200 hover:border-primary/60 hover:shadow-md"
          @click="openBindDialog(connector)"
        >
          <div
            class="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-white"
            :class="getConnectorIconBg(connector.type)"
          >
            <ConnectorIcon :type="connector.type" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-gray-100 truncate">{{ connector.name }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{{ connector.description }}</div>
          </div>
          <el-button type="primary" round class="shrink-0" @click.stop="openBindDialog(connector)">绑定</el-button>
        </article>
      </div>
    </section>

    <!-- 绑定对话框 -->
    <ReDialog
      v-model="bindDialogVisible"
      :title="currentConnector ? `绑定 ${currentConnector.name}` : '绑定连接器'"
      width="440px"
      align-center
      :show-close="true"
      :close-on-click-modal="false"
      @closed="resetBindForm"
    >
      <div v-if="currentConnector">
        <!-- 动态加载绑定表单组件 -->
        <component :is="bindFormComponent" v-model="bindForm" @confirmed="onQrConfirmed" />

        <!-- 表单型绑定可在绑定时选择模型；扫码型绑定后通过「编辑」设置 -->
        <div v-if="!bindIsQr" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <el-form label-position="top">
            <el-form-item label="使用模型">
              <el-select v-model="bindForm.model" placeholder="跟随系统默认模型" class="w-full">
                <el-option label="跟随系统默认模型" value="" />
                <el-option v-for="m in models" :key="m" :label="m" :value="m" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <el-button v-if="!bindIsQr" type="primary" :loading="binding" @click="handleBind">确认绑定</el-button>
      </template>
    </ReDialog>

    <!-- 编辑对话框 -->
    <ReDialog v-model="editDialogVisible" title="编辑连接器" width="480px">
      <el-form label-position="top">
        <el-form-item label="名称">
          <el-input v-model="editForm.nickname" placeholder="请输入名称" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="使用模型">
          <el-select v-model="editForm.model" placeholder="跟随系统默认模型" class="w-full" filterable>
            <el-option label="跟随系统默认模型" value="" />
            <el-option v-for="m in models" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="系统提示词">
          <el-input
            v-model="editForm.systemPrompt"
            type="textarea"
            :rows="3"
            maxlength="2000"
            show-word-limit
            placeholder="留空则使用全局默认提示词；填写后仅对该 Bot 生效，用于定义角色、语气与行为边界"
          />
        </el-form-item>
        <el-form-item label="仅回复 @ 我的消息">
          <el-switch v-model="editForm.mentionOnly" />
          <span class="text-xs text-gray-400 dark:text-gray-400 ml-2">群聊中未 @ 我时不回复，私聊不受影响</span>
        </el-form-item>

        <el-divider content-position="left">随机冒泡</el-divider>
        <el-form-item label="启用随机冒泡">
          <el-switch v-model="editForm.randomReplyEnabled" />
          <span class="text-xs text-gray-400 dark:text-gray-400 ml-2">像群成员一样，按概率主动冒泡加入聊天</span>
        </el-form-item>
        <template v-if="editForm.randomReplyEnabled">
          <el-form-item label="携带上下文条数">
            <ReNumberInput v-model="editForm.randomContextCount" :min="1" :max="100" :step="1" controls-position="right" />
          </el-form-item>
          <el-form-item label="触发概率">
            <div class="w-full flex items-center gap-3">
              <el-slider v-model="editForm.randomProbability" :min="0" :max="100" :step="1" class="flex-1" />
              <span class="w-14 text-right text-sm text-gray-600 dark:text-gray-400">{{ editForm.randomProbability }}%</span>
            </div>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveEdit">保存</el-button>
      </template>
    </ReDialog>
  </RePage>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus';
import { EditOutlined, DeleteOutlined, MessageOutlined } from '@vicons/antd'
import { api } from '@/framework/context'
import RePage from '@/components/re/RePage.vue'
import ConnectorIcon from './ConnectorIcon.vue'
import ILinkBindForm from './bind-forms/ILinkBindForm.vue'
import FeishuBindForm from './bind-forms/FeishuBindForm.vue'
import WecomBindForm from './bind-forms/WecomBindForm.vue'
import QqBindForm from './bind-forms/QqBindForm.vue'


import ReDialog from '@repo/ui/re-dialog';
import ReNumberInput from '@/components/re/ReNumberInput.vue';

// 数据
const boundConnectors = ref<any[]>([])
const availableConnectors = ref<any[]>([])
const models = ref<string[]>([])

// 绑定对话框
const bindDialogVisible = ref(false)
const currentConnector = ref<any>(null)
const binding = ref(false)
const bindForm = ref<Record<string, any>>({})

// 编辑对话框
const editDialogVisible = ref(false)
const editId = ref<number | null>(null)
const saving = ref(false)
const editForm = ref<{
  nickname: string
  model: string
  systemPrompt: string
  mentionOnly: boolean
  randomReplyEnabled: boolean
  randomContextCount: number
  randomProbability: number
}>({
  nickname: '',
  model: '',
  systemPrompt: '',
  mentionOnly: false,
  randomReplyEnabled: false,
  randomContextCount: 10,
  randomProbability: 0,
})

// 绑定表单组件映射
const bindFormComponents: Record<string, any> = {
  ilink: ILinkBindForm,
  feishu: FeishuBindForm,
  wecom: WecomBindForm,
  qq: QqBindForm,
}

const bindFormComponent = computed(() => {
  if (!currentConnector.value) return null
  return bindFormComponents[currentConnector.value.type] || null
})

// 扫码型绑定（微信）：扫码成功即完成，模型绑定后通过「编辑」设置
const bindIsQr = computed(() => currentConnector.value?.bindType === 'qrcode')

const onQrConfirmed = () => {
  bindDialogVisible.value = false
  message.success('绑定成功')
  fetchConnectors()
}

const isOnline = (status?: string) => status === 'online'

// 已绑定记录返回的是平台名（wechat），统一归一化为页面使用的连接器类型（ilink）
const normType = (type?: string) => (type === 'wechat' ? 'ilink' : type || '')

// 获取连接器数据
const fetchConnectors = async () => {
  try {
    availableConnectors.value = (await api.get('/connectors/types')) || []
    boundConnectors.value = (await api.get('/connectors/bound')) || []
    models.value = (await api.get('/ai/bot-binding/models')) || []
  } catch (error) {
    console.error('获取连接器列表失败:', error)
  }
}

// 打开绑定对话框
const openBindDialog = (connector: any) => {
  currentConnector.value = connector
  bindForm.value = { model: '' }
  bindDialogVisible.value = true
}

const resetBindForm = () => {
  currentConnector.value = null
  bindForm.value = {}
}

// 表单型绑定
const handleBind = async () => {
  if (!currentConnector.value) return
  binding.value = true
  try {
    await api.post('/connectors/bind', {
      type: currentConnector.value.type,
      ...bindForm.value,
    })
    message.success('绑定成功')
    bindDialogVisible.value = false
    fetchConnectors()
  } catch (error: any) {
    message.error(error?.msg || error?.message || '绑定失败')
  } finally {
    binding.value = false
  }
}

// 打开编辑对话框
const openEditDialog = (connector: any) => {
  editId.value = connector.id
  editForm.value = {
    nickname: connector.name || '',
    model: connector.modelName || '',
    systemPrompt: connector.systemPrompt || '',
    mentionOnly: connector.mentionOnly !== false,
    randomReplyEnabled: !!connector.randomReplyEnabled,
    randomContextCount: connector.randomContextCount ?? 10,
    randomProbability: connector.randomProbability ?? 0,
  }
  editDialogVisible.value = true
}

const handleSaveEdit = async () => {
  if (editId.value == null) return
  saving.value = true
  try {
    await api.put(`/connectors/${editId.value}`, {
      nickname: editForm.value.nickname?.trim(),
      model: editForm.value.model || '',
      systemPrompt: editForm.value.systemPrompt || '',
      mentionOnly: editForm.value.mentionOnly,
      randomReplyEnabled: editForm.value.randomReplyEnabled,
      randomContextCount: editForm.value.randomContextCount,
      randomProbability: editForm.value.randomProbability,
    })
    message.success('已保存')
    editDialogVisible.value = false
    fetchConnectors()
  } catch (error: any) {
    message.error(error?.msg || error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 解绑
const unbindConnector = async (connector: any) => {
  try {
    await ElMessageBox.confirm(`确定要解绑 ${connector.name || getConnectorTypeName(connector.type)} 吗？`, '确认解绑', {
      type: 'warning',
    })
    await api.delete(`/connectors/${connector.id}`)
    message.success('解绑成功')
    fetchConnectors()
  } catch (error: any) {
    if (error !== 'cancel') {
      message.error(error?.msg || error?.message || '解绑失败')
    }
  }
}

// 进入连接器聊天
// 必须走 router.push：原来用 window.location.href 会整页刷新，
// 整个 SPA 冷启动（这个应用冷启要几十秒）并丢掉全部状态，
// 还会绕开 router.beforeEach 的鉴权与进度条流程。
const openBoundConnector = (connector: any) => {
  router.push(`/connectors/chat/${connector.id}`)
}

// 图标底色（品牌色浅底：真实 logo 为彩色实心图，需低饱和底才看得清）
const getConnectorIconBg = (type: string) => {
  const colors: Record<string, string> = {
    ilink: 'bg-[#e8f9ef] dark:bg-[#07c160]/15',
    feishu: 'bg-[#eef3ff] dark:bg-[#3370ff]/15',
    wecom: 'bg-[#e6f4fe] dark:bg-[#0082ef]/15',
    qq: 'bg-[#e6f6fe] dark:bg-[#12b7f5]/15',
    dingtalk: 'bg-[#e9f2ff] dark:bg-[#1677ff]/15',
  }
  return colors[type] || 'bg-gray-100 dark:bg-gray-800'
}

// 类型展示名
const getConnectorTypeName = (type: string) => {
  const names: Record<string, string> = {
    ilink: '微信',
    feishu: '飞书',
    wecom: '企业微信',
    qq: 'QQ',
    dingtalk: '钉钉',
  }
  return names[type] || '未知连接器'
}

const router = useRouter()

onMounted(fetchConnectors)
</script>

<style scoped>
/* 已绑定卡片右侧操作：默认隐藏，悬停卡片（或键盘聚焦其内按钮）时淡入 */
.bound-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.connector-card:hover .bound-actions,
.bound-actions:focus-within {
  opacity: 1;
}
</style>

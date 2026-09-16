<template>
  <div class="h-full overflow-hidden flex flex-col">
    <PageHeader :title="t('settings.models.title')" />
    <div class="flex-1 flex flex-col overflow-hidden">
      <template v-if="!showDetail">
        <!-- 标题区（固定不滚动） -->
        <div class="shrink-0 flex items-center justify-between gap-4 mb-8 mt-2 px-4 w-full md:max-w-260 md:mx-auto">
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{{ t('settings.models.providers') }}</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ t('settings.models.providersDesc') }}</p>
          </div>
          <el-button type="primary" size="large" round @click="handleCreateGroup">
            <template #icon><PlusOutlined /></template>
            {{ t('settings.models.addCustom') }}
          </el-button>
        </div>

        <!-- 内容区（独立滚动，满屏宽度） -->
        <div class="flex-1 overflow-auto" style="scrollbar-gutter: stable both-edges;">
          <div class="px-4 pb-4 w-full md:max-w-260 md:mx-auto">
            <ModelsProviderList :items="providers" :templates="availableTemplates"
              @item-click="handleItemClick"
              @item-edit="handleEditProvider"
              @item-delete="handleDeleteProviderFromList"
              @template-click="handleTemplateClick">
            </ModelsProviderList>
          </div>
        </div>
      </template>
      <template v-else>
        <ModelsProviderDetail
          :provider="currentProvider"
          :models="currentModels"
          :model-presets="modelPresets"
          @back="showDetail = false"
          @changed="reloadProvidersAndModels"
        />
      </template>

      <!-- 供应商编辑弹窗 -->
      <el-dialog v-model="showProviderModal" :title="getProviderModalTitle" width="500px" align-center append-to-body
        class="provider-modal dialog-with-scroll">
        <div class="dialog-content">
          <el-form ref="formRef" :label-width="80" :model="currentProviderEdit" :rules="providerRules" size="large"
            label-position="left" hide-required-asterisk>
            <el-form-item :label="t('settings.models.name')" prop="name">
              <el-input v-model="currentProviderEdit.name" :placeholder="t('settings.models.namePlaceholder')" :disabled="!isNameEditable" />
            </el-form-item>
            <el-form-item :label="t('settings.models.protocol')" prop="protocol">
              <el-select v-model="currentProviderEdit.protocol" :placeholder="t('settings.models.selectProtocol')" style="width: 100%"
                :disabled="!isProtocolEditable">
                <el-option label="OpenAI" value="openai" />
                <el-option label="OpenAI-Response" value="openai-response" />
                <el-option label="Gemini" value="gemini" />
                <el-option label="Anthropic" value="anthropic" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('settings.models.apiUrl')" prop="apiUrl">
              <el-input v-model="currentProviderEdit.apiUrl" placeholder="api_url" :disabled="!isCustomProvider" />
            </el-form-item>
            <el-form-item label="API KEY" prop="apiKey">
              <div class="space-y-2 w-full">
                <!-- 已配置key的提示（编辑模式时显示） -->
                <div v-if="isProviderEditMode && currentProviderEdit.existingKeyCount > 0" 
                     class="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded mb-2">
                  已配置 <strong>{{ currentProviderEdit.existingKeyCount }}</strong> 个Key
                  <span v-if="currentProviderEdit.existingKeyMask" class="ml-2 text-gray-400">
                    (示例: {{ currentProviderEdit.existingKeyMask }})
                  </span>
                  <span class="ml-2 text-blue-500">
                    如需修改请在下方输入新Key，留空则保留原有配置
                  </span>
                </div>
                <div v-for="(key, index) in apiKeyList" :key="index" class="flex gap-2">
                  <el-input v-model="apiKeyList[index]" placeholder="api_key" type="password" show-password class="flex-1" />
                  <el-button type="danger" link @click="removeApiKey(index)" :disabled="apiKeyList.length <= 1">
                    <el-icon><DeleteOutlined /></el-icon>
                  </el-button>
                </div>
                <!-- 测试连接结果 -->
                <div v-if="testResult" class="text-xs mt-1" :class="testResult.success ? 'text-green-500' : 'text-red-500'">
                  <span v-if="testingConnection">测试中...</span>
                  <span v-else>{{ testResult.message }}<span v-if="testResult.latency"> ({{ testResult.latency }}ms)</span></span>
                </div>
                <div class="flex items-center justify-between">
                  <el-button type="primary" link @click="addApiKey">
                    <el-icon class="mr-1"><PlusOutlined /></el-icon>
                    添加API KEY
                  </el-button>
                  <!-- API Key 获取链接（仅非自定义供应商显示） -->
                  <el-tooltip v-if="currentProviderEdit.provider !== 'custom'" content="获取 API Key" placement="top">
                    <el-button type="primary" link @click="handleOpenApiKeyUrl">
                      <el-icon><LinkOutlined /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </el-form-item>

            <!-- 高级设置折叠 -->
            <el-collapse v-model="advancedCollapse" class="mt-4">
              <el-collapse-item title="高级设置" name="advanced">
                <!-- 代理地址 -->
                <el-form-item label="代理地址" prop="proxyUrl">
                  <el-input v-model="currentProviderEdit.proxyUrl" placeholder="http://127.0.0.1:7890，留空不使用代理" />
                  <div class="text-xs text-gray-400 mt-1">需要代理的供应商（如Gemini）填写代理地址</div>
                </el-form-item>
                <!-- Key策略 -->
                <el-form-item label="Key策略" prop="loadStrategy">
                  <el-select v-model="currentProviderEdit.loadStrategy" placeholder="选择Key轮询策略" class="w-full">
                    <el-option v-for="strategy in keyStrategies" :key="strategy.name" :label="strategy.display_name" :value="strategy.name" />
                  </el-select>
                  <div class="text-xs text-gray-400 mt-1">多Key时的分配策略，支持限流自动切换</div>
                </el-form-item>
                <!-- 限流自动切换 -->
                <el-form-item label="限流自动切换" prop="autoSwitchOnRateLimit">
                  <el-switch v-model="currentProviderEdit.autoSwitchOnRateLimit" />
                  <div class="text-xs text-gray-400 mt-1">当前Key限流时自动切换到下一个可用Key</div>
                </el-form-item>
                <!-- 自定义请求头 -->
                <el-form-item :label="t('settings.models.customHeaders')" prop="headers">
                  <el-input
                    v-model="currentProviderEdit.headers"
                    type="textarea"
                    :rows="4"
                    class="w-full"
                    :placeholder="t('settings.models.customHeadersPlaceholder')"
                  />
                  <div class="text-xs text-gray-400 mt-1">{{ t('settings.models.customHeadersDesc') }}</div>
                </el-form-item>
              </el-collapse-item>
            </el-collapse>
          </el-form>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="handleTestConnection" :loading="testingConnection">测试连接</el-button>
            <el-button type="primary" @click="handleSaveProvider">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ModelsProviderList from '../setting/ModelsProviderList.vue'
import ModelsProviderDetail from './ModelsProviderDetail.vue'
import {
  PlusOutlined,
  LinkOutlined,
  DeleteOutlined
} from '@vicons/material'
import PageHeader from '@/components/PageHeader.vue'
import { apiService } from '../../services/ApiService'
import { usePopup } from '../../composables/usePopup'
import { openInExternalBrowser } from '@/utils/browserUtils'

// Element Plus 组件导入
import { ElInput, ElFormItem, ElForm, ElButton, ElSelect, ElOption, ElCollapse, ElCollapseItem } from 'element-plus'
import type { FormInstance } from 'element-plus'
import LDialog from '@/components/ui/LDialog.vue'

const { t } = useI18n()
const { notify, confirm } = usePopup()
const currentProviderId = ref<string | null>(null)

// 使用响应式数据替代伪数据
const providers = ref<any[]>([])
const models = ref<any[]>([])
const showDetail = ref(false)

// 供应商模板相关
const providerTemplates = ref<any[]>([])
// 模型预设库
const modelPresets = ref<any[]>([])

// Key策略列表（后台实际支持的负载均衡策略）
const keyStrategies = ref<any[]>([
  { name: 'failover', display_name: '故障转移（优先使用第一个可用Key）', description: '按序取第一个可用Key，失败后自动切换到下一个' },
  { name: 'round_robin', display_name: '轮询（依次使用所有Key）', description: '依次使用所有Key，实现负载均衡' },
  { name: 'weighted', display_name: '权重（按权重分配Key）', description: '按权重分配Key，权重越高被选中的概率越大' },
  { name: 'latency', display_name: '延迟（按响应速度分配）', description: '优先选择响应速度快的Key' },
  { name: 'cost', display_name: '成本（按成本最低分配）', description: '优先选择成本最低的Key' },
  { name: 'hybrid', display_name: '混合（综合延迟和成本）', description: '综合考虑延迟和成本，智能分配Key' }
])

// 计算可用的模板（过滤掉已添加的）
const availableTemplates = computed(() => {
  const addedProviderTypes = new Set(providers.value.map(p => p.provider))
  const result = providerTemplates.value.filter(t => !addedProviderTypes.has(t.id))
  console.log('availableTemplates:', result.length, providerTemplates.value.length, providers.value.length)
  return result
})

// 添加用于编辑的临时数据
const currentProviderEdit = ref<{
  name: string
  apiUrl: string
  apiKey: string
  provider: string
  protocol: string
  headers: string
  proxyUrl: string
  loadStrategy: string
  autoSwitchOnRateLimit: boolean
  attributes: {
    headers: Record<string, string>
  }
}>({
  name: "",
  apiUrl: "",
  apiKey: "",
  provider: "custom",
  protocol: "openai",
  headers: "",
  proxyUrl: "",
  loadStrategy: "failover",
  autoSwitchOnRateLimit: false,
  attributes: {
    headers: {} as Record<string, string>
  }
})

// 多API KEY列表
const apiKeyList = ref<string[]>([''])
const advancedCollapse = ref<string[]>([])

// 测试连接结果
const testResult = ref<{ success: boolean; message: string; latency?: number } | null>(null)

// 自动同步apiKeyList到currentProviderEdit.apiKey
watch(apiKeyList, (newList) => {
  currentProviderEdit.value.apiKey = newList.filter(k => k && k.trim()).join(',')
}, { deep: true })

const addApiKey = () => {
  apiKeyList.value.push('')
}

const removeApiKey = (index: number) => {
  if (apiKeyList.value.length > 1) {
    apiKeyList.value.splice(index, 1)
  }
}

// 判断是否为自定义供应商（只有 custom 类型才可编辑 name、protocol、apiUrl）
const isCustomProvider = computed(() => {
  // 自定义供应商才能改API地址，模板供应商（openai/anthropic等）不能改
  return currentProviderEdit.value.provider === 'custom'
})

const isNameEditable = computed(() => {
  return currentProviderEdit.value.provider === 'custom'
})

const isProtocolEditable = computed(() => {
  return currentProviderEdit.value.provider === 'custom'
})

// 动态获取弹窗标题
const getProviderModalTitle = computed(() => {
  if (isProviderEditMode.value) {
    return t('settings.models.editProvider')
  }
  const isFromTemplate = currentProviderEdit.value.provider !== 'custom'
  return isFromTemplate ? t('settings.models.addProvider', { name: currentProviderEdit.value.name || t('settings.models.provider') }) : t('settings.models.newGroup')
})

const isProviderEditMode = ref(false)

const showProviderModal = ref(false)
const testingConnection = ref(false)

// 供应商表单验证规则
const providerRules = computed(() => ({
  name: {
    required: true,
    message: t('settings.models.nameRequired'),
    trigger: ['blur', 'input']
  },
  protocol: {
    required: true,
    message: t('settings.models.protocolRequired'),
    trigger: ['change', 'blur']
  },
  apiUrl: {
    required: true,
    message: t('settings.models.apiUrlRequired'),
    trigger: ['blur', 'input']
  },
  // apiKey不做required验证，因为输入框绑定的是apiKeyList不是currentProviderEdit.apiKey
  // 验证逻辑在handleSaveProvider里手动处理
  headers: {
    validator: (rule: any, value: string, callback: any) => {
      const errors = validateHeadersText(value)
      if (errors.length > 0) {
        callback(new Error(errors.join('；')))
      } else {
        callback()
      }
    },
    trigger: ['blur', 'input']
  }
}))

// 初始化数据函数
const initData = async () => {
  try {
    const res = await fetch('/api/providers')
    const data = await res.json()
    const list = (data.data || []).map(p => ({
      ...p,
      provider: p.platform || p.provider,
      id: p.provider_id || p.id,
      apiUrl: p.base_url || p.apiUrl,
      protocol: p.auth_scheme || p.protocol
    }))
    providers.value = list
  } catch (e) {
    console.warn('初始化供应商列表失败:', e)
  }
}

// 重新加载供应商和模型数据
const reloadProvidersAndModels = async () => {
  try {
    const res = await fetch('/api/providers')
    const data = await res.json()
    console.log('providers raw data:', data.data)
    const list = (data.data || []).map(p => ({
      ...p,
      provider: p.platform || p.provider,
      id: p.provider_id || p.id,
      apiUrl: p.base_url || p.apiUrl,
      protocol: p.auth_scheme || p.protocol
    }))
    console.log('providers mapped:', list)
    providers.value = list

    // 从providers中提取models
    const allModels: any[] = []
    list.forEach(p => {
      console.log('provider:', p.name, 'models:', p.models ? p.models.length : 0)
      if (p.models && Array.isArray(p.models)) {
        p.models.forEach((m: any) => {
          // 映射后端字段到前端字段
          const capabilities = m.capabilities || []
          allModels.push({
            ...m,
            providerId: p.id,
            id: m.id || m.model_id || m.model,
            name: m.name || m.model,
            model: m.model,
            modelName: m.model,  // 后端是model，前端用modelName
            modelType: m.model_type || 'text',  // 默认对话模型
            isActive: m.enabled !== false,  // 后端是enabled，前端用isActive
            config: {
              inputCapabilities: capabilities.includes('text') || capabilities.length === 0 ? ['text'] : [],
              outputCapabilities: capabilities.includes('text') || capabilities.length === 0 ? ['text'] : [],
              features: []
            }
          })
        })
      }
    })
    models.value = allModels
    console.log('models loaded:', allModels.length)
  } catch (e) {
    console.warn('刷新供应商列表失败:', e)
  }
}

const currentProvider = computed(() => {
  const provider = providers.value.find(p => p.id === currentProviderId.value)
  if (!provider) {
    return { name: "", apiUrl: "", apiKey: "" }
  }
  return provider
})

const currentModels = computed(() => {
  console.log('currentModels filter:', models.value.length, 'models, providerId:', currentProviderId.value)
  return models.value.filter(m => {
    const pid = m.providerId || m.provider_id || m.providerId
    console.log('model pid:', pid, 'current:', currentProviderId.value, 'match:', pid === currentProviderId.value)
    return pid === currentProviderId.value;
  })
})

const formRef = ref<FormInstance | null>(null)

const handleCreateGroup = async () => {
  currentProviderId.value = null
  currentProviderEdit.value = {
    name: "",
    apiUrl: "",
    apiKey: "",
    provider: "custom",
    protocol: "openai",
    headers: '',
    attributes: {
      headers: {}
    }
  }
  formRef.value?.clearValidate?.()
  isProviderEditMode.value = false
  showProviderModal.value = true
}

const handleSaveProvider = async () => {
  try {
    // 先同步多API KEY到currentProviderEdit.apiKey
    const apiKeys = apiKeyList.value.filter(k => k && k.trim())
    currentProviderEdit.value.apiKey = apiKeys.join(',')

    // 手动清除apiKey的验证状态，因为输入框绑定的是apiKeyList不是currentProviderEdit.apiKey
    formRef.value?.clearValidate('apiKey')
    
    await formRef.value?.validate()

    const headers = parseHeaders(currentProviderEdit.value.headers)

    if (isProviderEditMode.value) {
      const updateData: any = {
        apiUrl: currentProviderEdit.value.apiUrl,
        attributes: {
          headers
        },
        extra: {
          load_strategy: currentProviderEdit.value.loadStrategy || 'failover'
        }
      }

      // 只有用户输入了新key才更新，否则保留原key
      const newApiKeys = apiKeyList.value.filter(k => k && k.trim())
      if (newApiKeys.length > 0) {
        updateData.apiKey = newApiKeys.join(',')
      }

      if (isNameEditable.value) {
        updateData.name = currentProviderEdit.value.name
        updateData.protocol = currentProviderEdit.value.protocol
      }

      if (!currentProviderId.value) {
        return
      }
      await apiService.updateProvider(currentProviderId.value, updateData)
      notify.success(t('common.updateSuccess'), t('settings.models.providerUpdated'), { duration: 2000 })

      const provider = providers.value.find(p => p.id === currentProviderId.value)
      if (provider) {
        // 如果更新了key，才更新本地显示
        if (newApiKeys.length > 0) {
          provider.apiKey = newApiKeys.join(',')
        }
        provider.apiUrl = currentProviderEdit.value.apiUrl
        if (isNameEditable.value) {
          provider.name = currentProviderEdit.value.name
          provider.protocol = currentProviderEdit.value.protocol
        }
        provider.attributes = { headers }
      }

      showProviderModal.value = false
    } else {
      // 拼接多API KEY
      const apiKeys = apiKeyList.value.filter(k => k && k.trim())
      // 构造后端需要的payload
      const payload: any = {
        platform: currentProviderEdit.value.provider || 'openai',
        name: currentProviderEdit.value.name,
        base_url: currentProviderEdit.value.apiUrl,
        auth_scheme: 'api_key',
        credentials: {
          api_key: apiKeys.join(',')
        },
        enabled: true,
        initial_model: {
          model: 'gpt-3.5-turbo',
          name: '默认模型'
        },
        extra: {
          load_strategy: currentProviderEdit.value.loadStrategy || 'failover'
        }
      }

      // 可选字段
      if (currentProviderEdit.value.proxyUrl && currentProviderEdit.value.proxyUrl.trim()) {
        payload.proxy = currentProviderEdit.value.proxyUrl.trim()
      }

      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await res.json()

      await reloadProvidersAndModels()

      const isFromTemplate = currentProviderEdit.value.provider !== 'custom'
      if (isFromTemplate) {
        notify.success('创建成功', `已添加 ${currentProviderEdit.value.name}`, { duration: 3000 })
      } else {
        notify.success('创建成功', '供应商已添加', { duration: 2000 })
      }

      showProviderModal.value = false
    }
  } catch (error) {
    console.error('编辑分组失败:', error)
  }
}

// 测试供应商连通性
const handleTestConnection = async () => {
  // 先同步多API KEY到currentProviderEdit.apiKey
  const apiKeys = apiKeyList.value.filter(k => k && k.trim())
  currentProviderEdit.value.apiKey = apiKeys.join(',')

  if (!currentProviderEdit.value.apiUrl) {
    testResult.value = { success: false, message: '请先填写API地址' }
    return
  }
  if (!currentProviderEdit.value.apiKey) {
    testResult.value = { success: false, message: '请先填写API Key' }
    return
  }

  testingConnection.value = true
  testResult.value = { success: false, message: '测试中...' }
  try {
    const result = await apiService.testProviderConnection({
      apiUrl: currentProviderEdit.value.apiUrl,
      apiKey: currentProviderEdit.value.apiKey,
      protocol: currentProviderEdit.value.protocol || 'openai',
      proxy: currentProviderEdit.value.proxyUrl,
      attributes: currentProviderEdit.value.attributes
    })

    console.log('test connection result:', result)

    if (result.data?.success) {
      testResult.value = {
        success: true,
        message: '连接成功',
        latency: result.data.latency
      }
    } else {
      testResult.value = {
        success: false,
        message: result.data?.message || '连接失败',
        latency: result.data?.latency
      }
    }
  } catch (error) {
    console.error('测试连通性失败:', error)
    testResult.value = { success: false, message: '测试失败，请检查网络' }
  } finally {
    testingConnection.value = false
  }
}

// 打开 API Key 获取页面
const handleOpenApiKeyUrl = () => {
  const template = providerTemplates.value.find(
    t => t.id === currentProviderEdit.value.provider
  )

  if (template?.apiKeyUrl) {
    openInExternalBrowser(template.apiKeyUrl)
  } else {
    notify.warning(t('settings.models.tip'), t('settings.models.noApiKeyUrl'), { duration: 2000 })
  }
}

// 解析 headers 文本为对象
const parseHeaders = (text: string): Record<string, string> => {
  const headers: Record<string, string> = {}
  const lines = text.trim().split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    const colonIndex = trimmedLine.indexOf(':')
    if (colonIndex === -1) {
      continue
    }
    
    const key = trimmedLine.substring(0, colonIndex).trim()
    const value = trimmedLine.substring(colonIndex + 1).trim()
    
    if (key) {
      headers[key] = value
    }
  }
  
  return headers
}

// 校验 headers 格式（返回错误数组，供表单验证器使用）
const validateHeadersText = (text: string): string[] => {
  const errors: string[] = []
  const lines = text.trim().split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) {
      errors.push(t('settings.models.headerFormatError', { line: i + 1 }))
    } else {
      const key = line.substring(0, colonIndex).trim()
      if (!key) {
        errors.push(t('settings.models.headerNameEmpty', { line: i + 1 }))
      }
    }
  }
  
  return errors
}

// 删除供应商的API调用
const deleteProvider = async (providerId: string) => {
  await apiService.deleteProvider(providerId)
  providers.value = providers.value.filter(p => p.id !== providerId)
}

const handleItemClick = (provider: any) => {
  showDetail.value = true
  currentProviderId.value = provider.id
}

// 编辑供应商配置
const handleEditProvider = (provider: any) => {
  currentProviderId.value = provider.id
  isProviderEditMode.value = true
  const existingHeaders = provider.attributes?.headers || {}
  const loadStrategy = provider.extra?.load_strategy || 'failover'

  currentProviderEdit.value = {
    name: provider.name || "",
    apiUrl: provider.apiUrl || "",
    apiKey: provider.apiKey || "",
    provider: provider.provider || "custom",
    protocol: provider.protocol || "openai",
    headers: Object.entries(existingHeaders)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n'),
    loadStrategy: loadStrategy,
    attributes: {
      headers: existingHeaders
    },
    // 保存已配置的key数量和掩码
    existingKeyCount: provider.api_key_count || 0,
    existingKeyMask: provider.api_key_mask || ""
  }

  // 编辑模式下填充已有的key列表
  if (provider.api_keys && provider.api_keys.length > 0) {
    apiKeyList.value = [...provider.api_keys]
  } else if (provider.api_key) {
    apiKeyList.value = provider.apiKey.split(',')
  } else {
    apiKeyList.value = []
  }

  formRef.value?.clearValidate()
  showProviderModal.value = true
}

// 处理模板点击（从网格中添加）
const handleTemplateClick = (template: any) => {
  currentProviderId.value = null
  isProviderEditMode.value = false

  // 重置API KEY列表，避免残留
  apiKeyList.value = ['']

  currentProviderEdit.value = {
    name: template.name || "",
    apiUrl: template.defaultApiUrl || template.defaultUrl || "",
    apiKey: "",
    provider: template.id,
    protocol: template.protocol || 'openai',
    headers: '',
    attributes: {
      headers: {}
    }
  }

  formRef.value?.clearValidate()
  showProviderModal.value = true
}

// 添加从列表中删除供应商的方法
const handleDeleteProviderFromList = async (provider: any) => {
  const result = await confirm(t('settings.models.deleteProvider'), t('settings.models.deleteProviderConfirm', { name: provider.name }))

  if (!result) {
    return
  }

  try {
    await deleteProvider(provider.id)
    models.value = models.value.filter(m => m.provider_id !== provider.id)

    if (providers.value.length > 0) {
      currentProviderId.value = providers.value[0].id
    } else {
      currentProviderId.value = ""
    }

    notify.success(t('common.deleteSuccess'), t('settings.models.providerDeleted', { name: provider.name }), { duration: 2000 })
  } catch (error) {
    notify.error(t('common.deleteFailed'), t('settings.models.deleteProviderError'), { duration: 2000 })
  }
}

onMounted(() => {
  reloadProvidersAndModels()
  if (providers.value.length > 0) {
    currentProviderId.value = providers.value[0].id
  }
  // 获取供应商模板列表用于网格展示
  apiService.getProviderTemplates().then(templates => {
    console.log('模板返回:', templates)
    providerTemplates.value = templates
  }).catch(error => {
    console.error('获取供应商模板失败:', error)
  })
    // 默认模板（从secrets.html提取）
    providerTemplates.value = [
      { id: 'openai', name: 'OpenAI', description: 'GPT系列模型官方API', protocol: 'openai', defaultApiUrl: 'https://api.openai.com/v1' },
      { id: 'anthropic', name: 'Anthropic', description: 'Claude系列模型官方API', protocol: 'openai', defaultApiUrl: 'https://api.anthropic.com/v1' },
      { id: 'gemini', name: 'Google Gemini', description: 'Google Gemini模型，需代理', protocol: 'openai', defaultApiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai' },
      { id: 'deepseek', name: 'DeepSeek', description: '深度求索大模型', protocol: 'openai', defaultApiUrl: 'https://api.deepseek.com/v1' },
      { id: 'qwen', name: '通义千问', description: '阿里通义千问大模型', protocol: 'openai', defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
      { id: 'zhipu', name: '智谱AI', description: '智谱GLM系列模型', protocol: 'openai', defaultApiUrl: 'https://open.bigmodel.cn/api/paas/v4' },
      { id: 'moonshot', name: 'Moonshot', description: '月之暗面Kimi模型', protocol: 'openai', defaultApiUrl: 'https://api.moonshot.cn/v1' },
      { id: 'ollama', name: 'Ollama', description: '本地Ollama模型', protocol: 'openai', defaultApiUrl: 'http://localhost:11434/v1' },
      { id: 'onnx', name: 'ONNX Runtime', description: '本地ONNX模型推理', protocol: 'openai', defaultApiUrl: 'http://localhost:8080/v1' },
      { id: 'siliconflow', name: 'SiliconFlow 硅基流动', description: '国内AI模型平台，支持DeepSeek、Qwen等', protocol: 'openai', defaultApiUrl: 'https://api.siliconflow.cn/v1' },
      { id: 'openrouter', name: 'OpenRouter', description: '聚合API，支持数百个模型', protocol: 'openai', defaultApiUrl: 'https://openrouter.ai/api/v1' },
      { id: 'modelscope', name: '魔搭 ModelScope', description: '阿里达摩院模型社区，免费使用多种开源模型', protocol: 'openai', defaultApiUrl: 'https://api-inference.modelscope.cn/v1' },
      { id: 'qianfan', name: '百度千帆', description: '百度智能云大模型平台', protocol: 'openai', defaultApiUrl: 'https://qianfan.baidubce.com/v2' },
      { id: 'sensenova', name: 'SenseNova 商汤', description: '商汤科技大模型平台', protocol: 'openai', defaultApiUrl: 'https://token.sensenova.cn/v1' },
      { id: 'nvidia', name: 'NVIDIA NIM', description: '英伟达AI推理平台，免费使用多种模型', protocol: 'openai', defaultApiUrl: 'https://integrate.api.nvidia.com/v1' },
      { id: 'agnes', name: 'Agnes AI', description: '聚合API，免费使用多种模型', protocol: 'openai', defaultApiUrl: 'https://apihub.agnes-ai.cn/v1' },
      { id: 'opencode', name: 'OpenCode', description: '免费开源API，支持多种模型', protocol: 'openai', defaultApiUrl: 'https://opencode.ai/zen/v1' },
      { id: 'huiqing', name: '慧清 AI', description: '免费AI模型平台', protocol: 'openai', defaultApiUrl: 'https://ai.huiqing.cyou/v1' },
      { id: 'bai', name: 'b.ai', description: '免费AI模型平台，支持DeepSeek等', protocol: 'openai', defaultApiUrl: 'https://api.b.ai/v1' },
      { id: 'custom', name: '自定义供应商', description: '自定义OpenAI兼容协议的供应商', protocol: 'openai', defaultApiUrl: '' },
    ]
  // 获取模型预设库
  apiService.getModelPresets().then(presets => {
    modelPresets.value = presets
  }).catch(error => {
    console.error('获取模型预设库失败:', error)
  })
})
</script>

<style scoped>
/* 统一输入框内容左对齐 */
:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  text-align: left !important;
}

/* API Key 输入框和按钮布局 */
.api-key-input-wrapper {
  display: flex;
  gap: 8px;
  width: 100%;
}

.api-key-input-wrapper :deep(.el-input) {
  flex: 1;
  min-width: 0;
}

/* 对话框美化 */
.provider-modal :deep(.el-dialog) {
  border-radius: 16px !important;
  overflow: hidden;
}

.provider-modal :deep(.el-dialog__header) {
  padding: 20px 24px 12px !important;
  margin-right: 0 !important;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.provider-modal :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
}

.provider-modal :deep(.el-dialog__body) {
  padding: 20px 24px !important;
}

.provider-modal :deep(.el-dialog__footer) {
  padding: 12px 24px 20px !important;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 表单项美化 */
:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* 折叠面板美化 */
:deep(.el-collapse) {
  border: none;
  background: transparent;
}

:deep(.el-collapse-item__header) {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 0 12px;
  font-weight: 500;
  border-bottom: none;
  margin-bottom: 8px;
}

:deep(.el-collapse-item__wrap) {
  border: none;
  background: transparent;
}

/* 按钮美化 */
.dialog-footer :deep(.el-button) {
  border-radius: 8px;
  padding: 8px 20px;
}

.dialog-footer :deep(.el-button--primary) {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

/* 下拉框美化 */
:deep(.el-select) {
  border-radius: 8px;
}

/* 输入框美化 */
:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
}
</style>
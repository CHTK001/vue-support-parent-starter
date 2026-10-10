<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Add24Regular, Link24Regular, Eye24Regular, EyeOff24Regular,
  Info24Regular, Key24Regular, Settings24Regular, CloudCheckmark24Regular,
  CloudArrowDown24Regular, Folder24Regular,
} from '@vicons/fluent'
import { useI18n } from 'vue-i18n'
import ReSelect from '@repo/ui/re-select'
import LDialog from '@/components/ui/LDialog.vue'
import ProviderLogo from './ProviderLogo.vue'
import { apiService } from '../../services/ApiService'
import { adminApi } from '@/framework/context'
import { KEY_STRATEGIES, AUTH_SCHEMES, DEFAULT_AUTH_SCHEME, deriveAuthMode } from './model.constants'
import { parseHeaders, validateHeadersText, resolveProviderBrand, headersToText } from './model.utils'

const { t } = useI18n()

const emit = defineEmits<{ saved: []; back: [] }>()

const dialogVisible = ref(false)
const isEditMode = ref(false)
const providerId = ref('')
const providerType = ref('')
const testing = ref(false)
const testResult = ref<null | { success: boolean; message: string }>(null)
const apiKeyList = ref<string[]>([])
const showKey = ref<Record<number, boolean>>({})

/** 本地推理提供商（ONNX）：apikey 语义是本地模型路径，而非远程密钥 */
const isLocalProvider = computed(() => (providerType.value || '').toLowerCase().includes('onnx'))
/** 本地模型路径（仅本地提供商使用，最终写入 apiKey 字段） */
const localModelPath = ref('')

const form = reactive({
  name: '',
  protocol: 'openai',
  apiUrl: '',
  apiKey: '',
  proxyUrl: '',
  loadStrategy: 'failover',
  autoSwitchOnRateLimit: true,
  customHeaders: '',
  existingKeyCount: 0,
  existingKeyMask: '',
  // 认证方式：UI 值（见 AUTH_SCHEMES），落库时拆成 auth_scheme + extra.auth_header/auth_prefix
  authMode: DEFAULT_AUTH_SCHEME,
  authHeader: 'api-key',
  authPrefix: '',
  // 推理设备（仅本地 ONNX 提供商）：auto / cpu / gpu，落库到 extra.device；云端提供商不涉及
  device: 'auto',
})

/** 编辑态下保留的原始 extra，保存时合并回去，避免覆盖掉本表单不管理的键 */
const origExtra = ref<Record<string, any>>({})

const selectedTemplate = ref<any>(null)

/** 当前认证方式对应的落库三元组 */
const resolvedAuth = computed(() => {
  const opt = AUTH_SCHEMES.find((s) => s.value === form.authMode) || AUTH_SCHEMES[0]
  // 「自定义请求头」用表单里手填的头名与前缀，其余方式用选项自带的固定值
  if (form.authMode === 'custom') {
    return { authScheme: opt.authScheme, authHeader: form.authHeader.trim(), authPrefix: form.authPrefix }
  }
  return { authScheme: opt.authScheme, authHeader: opt.authHeader, authPrefix: opt.authPrefix }
})

/** 当前选项的说明文案，用于表单下方提示 */
const authHint = computed(
  () => (AUTH_SCHEMES.find((s) => s.value === form.authMode) || AUTH_SCHEMES[0]).description,
)

/**
 * 组装供应商扩展配置。
 *
 * 自定义请求头的键名必须是 {@code custom_headers}：后端
 * ModelClientResolver / AiChatFacadeServiceImpl / AiBotChatService / SysAiAgentServiceImpl
 * 四处都只读这个键，历史上前端写的是 headers，导致请求头被静默丢弃。
 */
const buildExtra = () => {
  const auth = resolvedAuth.value
  const extra: Record<string, any> = {
    ...origExtra.value,
    load_strategy: form.loadStrategy,
    custom_headers: parseHeaders(form.customHeaders),
  }
  // 推理设备仅本地 ONNX 有意义：auto 视为默认不落库，避免把 auto 写进 extra
  if (isLocalProvider.value && form.device && form.device !== 'auto') extra.device = form.device
  else delete extra.device
  // 空值一律删除，避免把 auth_header='' 这种「覆盖成空头名」的脏数据写进库
  if (auth.authHeader) extra.auth_header = auth.authHeader
  else delete extra.auth_header
  if (auth.authPrefix) extra.auth_prefix = auth.authPrefix
  else delete extra.auth_prefix
  return extra
}

watch(apiKeyList, (list) => {
  form.apiKey = list.filter(k => k.trim()).join(',')
})

const resetForm = () => {
  Object.assign(form, {
    name: '', protocol: 'openai', apiUrl: '', apiKey: '', proxyUrl: '',
    loadStrategy: 'failover', autoSwitchOnRateLimit: true, customHeaders: '',
    existingKeyCount: 0, existingKeyMask: '',
    authMode: DEFAULT_AUTH_SCHEME, authHeader: 'api-key', authPrefix: '',
    device: 'auto',
  })
  apiKeyList.value = []
  localModelPath.value = ''
  testResult.value = null
  showKey.value = {}
  selectedTemplate.value = null
  origExtra.value = {}
}

const openCreate = () => {
  resetForm()
  isEditMode.value = false
  providerId.value = ''
  providerType.value = 'custom'
  apiKeyList.value = [''] // 默认展示一个 Key 输入框，贴合单 Key 主流程
  dialogVisible.value = true
}

const openFromTemplate = (template: any) => {
  resetForm()
  isEditMode.value = false
  providerId.value = ''
  providerType.value = template.id
  selectedTemplate.value = template
  form.name = template.name
  form.protocol = template.protocol
  form.apiUrl = template.defaultApiUrl || template.defaultUrl || ''
  // 模板可声明该供应商要求的认证方式（如 Dots Studio 只认 api-key 请求头）
  form.authMode = template.defaultAuthMode || DEFAULT_AUTH_SCHEME
  form.authHeader = template.defaultAuthHeader || 'api-key'
  form.authPrefix = template.defaultAuthPrefix || ''
  apiKeyList.value = [''] // 选模板后直接填自己的 Key
  dialogVisible.value = true
}

const openEdit = (provider: any) => {
  resetForm()
  isEditMode.value = true
  providerId.value = provider.id
  const brand = provider.provider || provider.platform || 'custom'
  providerType.value = brand
  form.name = provider.name
  form.protocol = provider.protocol || 'openai'
  form.apiUrl = provider.apiUrl || provider.base_url || provider.url || ''
  form.proxyUrl = provider.proxy || provider.proxyUrl || ''
  form.loadStrategy = provider.extra?.load_strategy || provider.loadStrategy || 'failover'
  form.autoSwitchOnRateLimit = provider.autoSwitchOnRateLimit !== false
  // 后端把自定义请求头存在 extra.custom_headers（不是 extra.headers），旧键名读不到任何东西
  form.customHeaders = provider.customHeaders || headersToText(provider.extra?.custom_headers) || ''
  // 认证方式回显：由 auth_scheme + extra.auth_header/auth_prefix 反推表单值
  origExtra.value = (provider.extra && typeof provider.extra === 'object') ? { ...provider.extra } : {}
  // 推理设备回显（仅本地 ONNX 用）：读 extra.device，默认 auto
  form.device = origExtra.value.device || 'auto'
  form.authMode = deriveAuthMode(
    provider.authScheme ?? provider.auth_scheme,
    provider.authHeader ?? provider.extra?.auth_header,
    provider.authPrefix ?? provider.extra?.auth_prefix,
  )
  form.authHeader = provider.authHeader || provider.extra?.auth_header || 'api-key'
  form.authPrefix = provider.authPrefix || provider.extra?.auth_prefix || ''
  form.existingKeyCount = provider.api_key_count ?? provider.api_keys?.length ?? 0
  form.existingKeyMask = provider.api_key_mask || provider.apiKeyMask || ''
  apiKeyList.value = [...(provider.api_keys || provider.apiKeyList || [])]
  // 本地推理（ONNX）：apikey 存的就是本地模型路径，回填到路径输入框
  if ((brand || '').toLowerCase().includes('onnx')) {
    localModelPath.value = provider.api_keys?.[0] || provider.apiKeyList?.[0] || ''
  } else {
    localModelPath.value = ''
  }
  dialogVisible.value = true
}

defineExpose({ openCreate, openFromTemplate, openEdit })

const addApiKey = () => apiKeyList.value.push('')
const removeApiKey = (index: number) => apiKeyList.value.splice(index, 1)
const toggleKey = (i: number) => { showKey.value[i] = !showKey.value[i] }

const handleTestConnection = async () => {
  if (!form.apiUrl.trim()) {
    testResult.value = { success: false, message: t('settings.models.apiUrlFirst') }
    return
  }
  const validKeys = apiKeyList.value.filter(k => k.trim())
  if (validKeys.length === 0) {
    testResult.value = { success: false, message: t('settings.models.apiKeyFirst') }
    return
  }
  testing.value = true
  testResult.value = null
  try {
    const result = await apiService.testProviderConnection({ url: form.apiUrl, apiKey: validKeys[0], protocol: form.protocol })
    testResult.value = {
      success: result.success,
      message: result.message || (result.success ? t('settings.models.connectionSuccess') : t('settings.models.connectionFailed')),
    }
  } catch (e: any) {
    testResult.value = { success: false, message: e?.message || t('settings.models.connectionFailed') }
  } finally {
    testing.value = false
  }
}

const handleOpenApiKeyUrl = () => {
  testResult.value = { success: false, message: t('settings.models.noApiKeyUrl') }
}

const handleBack = () => {
  dialogVisible.value = false
  emit('back')
}

const handleSave = async () => {
  if (!form.name.trim()) { ElMessage.warning(t('settings.models.nameRequired')); return }
  if (!form.apiUrl.trim()) { ElMessage.warning(t('settings.models.apiUrlRequired')); return }
  const headerErrors = validateHeadersText(form.customHeaders, t)
  if (headerErrors.length > 0) { ElMessage.warning(headerErrors[0]); return }
  // 自定义认证方式必须给出请求头名称，否则等于配了一个空头名
  if (form.authMode === 'custom' && !form.authHeader.trim()) {
    ElMessage.warning('请填写自定义认证的请求头名称'); return
  }
  // 本地推理（ONNX）：凭证就是本地模型路径，鉴权卡片整体不适用
  const effectiveApiKey = isLocalProvider.value
    ? localModelPath.value.trim()
    : (apiKeyList.value.map(k => k.trim()).filter(Boolean).join(','))
  const newApiKeys = isLocalProvider.value
    ? (localModelPath.value.trim() ? [localModelPath.value.trim()] : [])
    : apiKeyList.value.map(k => k.trim()).filter(Boolean)
  const auth = resolvedAuth.value

  if (isEditMode.value) {
    const updateData: any = {
      base_url: form.apiUrl,
      auth_scheme: auth.authScheme,
      extra: buildExtra(),
    }
    if (newApiKeys.length > 0) updateData.apiKey = newApiKeys.join(',')
    if (form.proxyUrl.trim()) updateData.proxy = form.proxyUrl.trim()
    // 管理员可编辑所有字段：始终提交名称与协议
    updateData.name = form.name
    updateData.protocol = form.protocol
    await apiService.updateProvider(providerId.value, updateData)
    ElMessage.success(t('settings.models.providerUpdated'))
  } else {
    // 依据名称 / 地址推断品牌，避免把自定义添加的 DeepSeek 等存成协议图标
    const inferred = resolveProviderBrand({ name: form.name, base_url: form.apiUrl })
    const platformVal = inferred !== 'custom' ? inferred : providerType.value
    const payload: any = {
      platform: platformVal, name: form.name, base_url: form.apiUrl,
      auth_scheme: isLocalProvider.value ? 'none' : auth.authScheme,
      credentials: { api_key: effectiveApiKey },
      enabled: true, initial_model: null,
      extra: buildExtra(),
    }
    if (form.proxyUrl.trim()) payload.proxy = form.proxyUrl.trim()
    await adminApi.post('/api/providers', payload)
    ElMessage.success(t('settings.models.providerAdded', { name: form.name }))
  }
  dialogVisible.value = false
  emit('saved')
}

const protocolOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'OpenAI Response', value: 'openai-response' },
  { label: 'Gemini', value: 'gemini' },
  { label: 'Anthropic Claude', value: 'anthropic' },
]
</script>

<template>
  <LDialog
    v-model="dialogVisible"
    :title="isEditMode ? t('settings.models.editProvider') : t('settings.models.addProvider', { name: form.name })"
    width="640px"
    align-center
    append-to-body
    :close-on-click-modal="false"
    class="provider-modal"
  >
    <template #header>
      <div class="pf-header">
        <button v-if="selectedTemplate" class="pf-back-btn" title="返回模板库" @click="handleBack">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <ProviderLogo v-else :pid="providerType" :name="form.name" size="sm" />
        <div class="pf-header-meta">
          <span class="pf-header-title">
            {{ isEditMode ? t('settings.models.editProvider') : t('settings.models.addProvider', { name: form.name }) }}
          </span>
          <span v-if="selectedTemplate" class="pf-badge">
            <el-icon :size="11"><Key24Regular /></el-icon>{{ selectedTemplate.name }}
          </span>
        </div>
      </div>
    </template>

    <div class="pf-body">
      <!-- 基本信息 -->
      <section class="pf-card">
        <header class="pf-card-head">
          <span class="pf-card-ico"><el-icon :size="16"><Info24Regular /></el-icon></span>
          <div class="pf-card-title-wrap">
            <h3 class="pf-card-title">基本信息</h3>
            <span class="pf-card-sub">供应商身份与接入协议</span>
          </div>
        </header>

        <el-form label-position="top" class="pf-form">
          <div class="pf-row">
            <el-form-item class="pf-col" :label="t('settings.models.name')" required>
              <el-input v-model="form.name" :placeholder="t('settings.models.namePlaceholder')"
                clearable />
            </el-form-item>
            <el-form-item class="pf-col" :label="t('settings.models.protocol')" required>
              <ReSelect v-model="form.protocol" class="w-full" :placeholder="t('settings.models.selectProtocol')"
                :data="protocolOptions" />
            </el-form-item>
          </div>
          <el-form-item :label="isLocalProvider ? '模型根目录' : t('settings.models.apiUrl')" required>
            <el-input v-model="form.apiUrl"
              :placeholder="isLocalProvider ? 'D:\\\\models\\\\onnx 或留空使用默认模型根目录' : 'https://api.example.com/v1'">
              <template #prefix><el-icon :size="14"><Link24Regular /></el-icon></template>
            </el-input>
          </el-form-item>
        </el-form>
      </section>

      <!-- 本地推理（ONNX）：无远程鉴权，凭证即本地模型路径 -->
      <section v-if="isLocalProvider" class="pf-card">
        <header class="pf-card-head">
          <span class="pf-card-ico ico-key"><el-icon :size="16"><Folder24Regular /></el-icon></span>
          <div class="pf-card-title-wrap">
            <h3 class="pf-card-title">本地模型路径</h3>
            <span class="pf-card-sub">填写服务器上的模型文件绝对路径；留空则使用模型根目录</span>
          </div>
        </header>
        <div class="key-list">
          <div class="auth-block">
            <div class="auth-block-head">
              <span class="auth-label">本地模型路径</span>
              <span class="auth-hint">支持单个绝对路径；多个用逗号分隔</span>
            </div>
            <el-input
              v-model="localModelPath"
              placeholder="D:\\.run\\ai-runtime\\models\\anime-face"
              clearable
            />
            <p class="auth-preview">
              该路径将作为本地推理的「apikey」保存：
              <code>{{ localModelPath || '（留空）' }}</code>
            </p>
          </div>

          <!-- 推理设备（本地模型专属）：云端提供商走远程 API，无 CPU/GPU 之分，故整卡仅本地显示 -->
          <div class="auth-block">
            <div class="auth-block-head">
              <span class="auth-label">推理设备</span>
              <span class="auth-hint">auto 按本机驱动自动判定；选 gpu 缺 CUDA 组件时自动回退 CPU</span>
            </div>
            <el-radio-group v-model="form.device">
              <el-radio-button value="auto">自动</el-radio-button>
              <el-radio-button value="cpu">CPU</el-radio-button>
              <el-radio-button value="gpu">GPU</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </section>

      <!-- API 鉴权（远程提供商） -->
      <section v-else class="pf-card">
        <header class="pf-card-head">
          <span class="pf-card-ico ico-key"><el-icon :size="16"><Key24Regular /></el-icon></span>
          <div class="pf-card-title-wrap">
            <h3 class="pf-card-title">API 鉴权</h3>
            <span class="pf-card-sub">支持多 Key 负载均衡与故障转移</span>
          </div>
          <el-button v-if="isEditMode && form.existingKeyCount > 0" class="pf-key-count" @click="addApiKey">
            <el-icon :size="13"><Add24Regular /></el-icon>已有 {{ form.existingKeyCount }} 个
          </el-button>
        </header>

        <div class="key-list">
          <!-- 认证方式：决定 Key 以哪个请求头发出去（Dots 等只认 api-key，不认 Authorization） -->
          <div class="auth-block">
            <div class="auth-block-head">
              <span class="auth-label">认证方式</span>
              <span class="auth-hint">{{ authHint }}</span>
            </div>
            <!-- 下拉用 ReSelect（@repo/ui），与全站下拉观感一致；
                 layout="default" 会透传默认插槽，因此可自定义「名称 + 说明」两行选项 -->
            <ReSelect
              v-model="form.authMode"
              layout="default"
              class="w-full auth-select"
              placeholder="选择认证方式"
            >
              <el-option v-for="s in AUTH_SCHEMES" :key="s.value" :label="s.label" :value="s.value">
                <span class="opt-two-line">
                  <span class="opt-main">{{ s.label }}</span>
                  <span class="opt-sub">{{ s.description }}</span>
                </span>
              </el-option>
            </ReSelect>

            <div v-if="form.authMode === 'custom'" class="auth-custom">
              <el-form-item label="请求头名称">
                <el-input v-model="form.authHeader" placeholder="api-key" />
              </el-form-item>
              <el-form-item label="值前缀">
                <el-input v-model="form.authPrefix" placeholder="留空表示不加前缀，例如 Bearer 加空格" />
              </el-form-item>
            </div>

            <p class="auth-preview">
              实际发送：
              <code v-if="form.authMode === 'bearer'">Authorization: Bearer &lt;你的 Key&gt;</code>
              <code v-else-if="form.authMode === 'none'">（不发送认证头）</code>
              <code v-else>{{ form.authHeader || 'api-key' }}: {{ form.authPrefix }}&lt;你的 Key&gt;</code>
            </p>
          </div>

          <div v-if="isEditMode && form.existingKeyCount > 0" class="key-exist-hint">
            <el-icon :size="14"><Key24Regular /></el-icon>
            <div>
              已配置 <strong>{{ form.existingKeyCount }}</strong> 个 Key
              <template v-if="form.existingKeyMask">（{{ form.existingKeyMask }}）</template>
              <span class="key-exist-tip">留空保留原配置，填写新值则替换</span>
            </div>
          </div>

          <div v-for="(key, index) in apiKeyList" :key="index" class="key-row">
            <el-input
              v-model="apiKeyList[index]"
              placeholder="sk-..."
              :type="showKey[index] ? 'text' : 'password'"
              :class="{ 'key-filled': key.trim() }"
            >
              <template #prefix><el-icon :size="14"><Key24Regular /></el-icon></template>
              <template #suffix>
                <button class="key-eye" type="button" @click="toggleKey(index)" :title="showKey[index] ? '隐藏' : '显示'">
                  <el-icon :size="15"><Eye24Regular v-if="!showKey[index]" /><EyeOff24Regular v-else /></el-icon>
                </button>
              </template>
            </el-input>
            <button class="key-remove" type="button" @click="removeApiKey(index)" title="删除">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /></svg>
            </button>
          </div>

          <div class="key-actions">
            <button class="add-key-btn" type="button" @click="addApiKey">
              <el-icon :size="14"><Add24Regular /></el-icon>添加 API KEY
            </button>
            <button class="get-key-btn" type="button" :title="t('settings.models.getApiKey')" @click="handleOpenApiKeyUrl">
              <el-icon :size="14"><Link24Regular /></el-icon>{{ t('settings.models.getApiKey') }}
            </button>
          </div>

          <div v-if="testResult" class="test-result" :class="testResult.success ? 'is-success' : 'is-error'">
            <el-icon :size="15"><CloudCheckmark24Regular v-if="testResult.success" /><CloudArrowDown24Regular v-else /></el-icon>
            <span>{{ testResult.message }}</span>
          </div>
        </div>
      </section>

      <!-- 高级设置 -->
      <section class="pf-card">
        <header class="pf-card-head">
          <span class="pf-card-ico ico-set"><el-icon :size="16"><Settings24Regular /></el-icon></span>
          <div class="pf-card-title-wrap">
            <h3 class="pf-card-title">高级设置</h3>
            <span class="pf-card-sub">代理、策略与自定义请求头</span>
          </div>
        </header>
        <div class="pf-adv">
          <el-form-item label="代理地址">
            <el-input v-model="form.proxyUrl" placeholder="http://127.0.0.1:7890，留空不使用代理" />
          </el-form-item>

          <el-form-item label="Key 策略">
            <ReSelect v-model="form.loadStrategy" class="w-full" layout="default" placeholder="选择 Key 轮询策略">
              <el-option v-for="s in KEY_STRATEGIES" :key="s.name" :label="s.display_name" :value="s.name">
                <span class="opt-two-line">
                  <span class="opt-main">{{ s.display_name }}</span>
                  <span class="opt-sub">{{ s.description }}</span>
                </span>
              </el-option>
            </ReSelect>
          </el-form-item>

          <div class="pf-switch-row">
            <div>
              <span class="pf-switch-label">自动限流</span>
              <span class="pf-switch-sub">触发限流时自动切换到下一个可用 Key</span>
            </div>
            <el-switch v-model="form.autoSwitchOnRateLimit" />
          </div>

          <el-form-item :label="t('settings.models.customHeaders')">
            <el-input v-model="form.customHeaders" type="textarea" :rows="3"
              :placeholder="t('settings.models.customHeadersPlaceholder')" />
          </el-form-item>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="pf-footer">
        <span v-if="testing" class="pf-testing">连接测试中…</span>
        <div class="pf-footer-btns">
          <el-button class="pf-foot-btn" @click="dialogVisible = false">取消</el-button>
          <el-button class="pf-foot-btn" :loading="testing" @click="handleTestConnection">测试连接</el-button>
          <el-button class="pf-foot-btn pf-foot-primary" type="primary" @click="handleSave">保存</el-button>
        </div>
      </div>
    </template>
  </LDialog>
</template>

<style scoped>
.pf-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pf-header-meta { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.pf-header-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}
.pf-back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--el-border-color-light);
  color: var(--el-text-color-regular);
  border-radius: var(--mp-radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.pf-back-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.pf-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 2px 8px;
  border-radius: var(--el-border-radius-round);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/*
 * 滚动交给外层 .l-dialog__body（LDialog 里已设 flex:1 / min-height:0 / overflow-y:auto）。
 * 这里不要再设 max-height + overflow，否则会形成「双层滚动容器」：
 * .pf-body 被硬卡在 64vh，而三张卡片作为 flex 子项默认 flex-shrink:1 会被压缩，
 * 卡片自身 overflow:hidden 再把内容裁掉（曾导致「添加 API Key」按钮只剩半截、
 * 「自定义请求头」textarea 整块不可见）。
 */
.pf-body {
  padding: 4px 4px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 卡片分区 */
.pf-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--mp-radius-lg);
  background: var(--el-bg-color-overlay);
  overflow: hidden;
  /* 禁止被 flex 压缩：卡片高度必须由内容决定 */
  flex-shrink: 0;
}
.pf-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: color-mix(in srgb, var(--el-border-color-light) 35%, var(--el-bg-color-overlay));
}
.pf-card-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--mp-radius);
  color: var(--el-color-white);
  background: var(--el-color-primary);
  flex-shrink: 0;
  box-shadow: 0 2px 6px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}
.pf-card-ico.ico-key { background: var(--el-color-warning); box-shadow: 0 2px 6px color-mix(in srgb, var(--el-color-warning) 30%, transparent); }
.pf-card-ico.ico-set { background: var(--el-color-info); box-shadow: 0 2px 6px color-mix(in srgb, var(--el-color-info) 30%, transparent); }
.pf-card-title-wrap { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.pf-card-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0;
  letter-spacing: .2px;
}
.pf-card-sub { font-size: 11px; color: var(--el-text-color-regular); }
.pf-key-count {
  height: 28px;
  padding: 0 10px;
  font-size: 11.5px;
  border-radius: var(--mp-radius);
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.pf-key-count:hover { color: var(--el-color-primary); border-color: var(--el-color-primary); }

/*
 * 表单纵向节奏统一用 flex gap 表达，不再用「相邻兄弟加 margin-top」：
 * 后者在 .pf-row 的两列网格内部也会命中，把第二列整体推下 14px（名字 / 协议类型 错位），
 * 而对 .pf-row 之后的「API 地址」又不生效（其前一个兄弟是 .pf-row 而非 .el-form-item），
 * 导致该行完全没有行间距。
 */
.pf-form {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
.pf-adv { padding: 14px 16px; display: flex; flex-direction: column; gap: 14px; }

.pf-form :deep(.el-form-item) { margin-bottom: 0; margin-top: 0; }
.pf-form :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  padding-bottom: 6px;
  line-height: 1.4;
}
.pf-adv :deep(.el-form-item) { margin-bottom: 0; }
.pf-adv :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  padding-bottom: 6px;
  line-height: 1.4;
}

/* ReSelect（@repo/ui）自带 modern 样式，用 :not(.re-select) 把它排除在本文件的
   通用输入框覆盖之外，避免两套圆角/边框规则互相打架 */
.pf-form :deep(.el-input__wrapper),
.pf-form :deep(.el-textarea__inner),
.pf-form :deep(.el-select:not(.re-select) .el-select__wrapper),
.pf-adv :deep(.el-input__wrapper),
.pf-adv :deep(.el-textarea__inner),
.pf-adv :deep(.el-select:not(.re-select) .el-select__wrapper) {
  border-radius: var(--mp-radius);
  box-shadow: 0 0 0 1px var(--el-border-color-light) inset;
  background: var(--el-bg-color-overlay);
  transition: box-shadow 0.18s ease;
}
.pf-form :deep(.el-input__prefix),
.pf-adv :deep(.el-input__prefix) { color: var(--el-text-color-disabled); }

/* 开关行 */
.pf-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--mp-radius);
  background: color-mix(in srgb, var(--el-border-color-light) 25%, var(--el-bg-color-overlay));
}
.pf-switch-label { font-size: 12.5px; font-weight: 600; color: var(--el-text-color-primary); display: block; }
.pf-switch-sub { font-size: 11px; color: var(--el-text-color-regular); display: block; margin-top: 2px; }

/* Key 管理 */
.key-list { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }

/* 认证方式 */
.auth-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--mp-radius);
  background: color-mix(in srgb, var(--el-border-color-light) 25%, var(--el-bg-color-overlay));
}
.auth-block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.auth-label { font-size: 12.5px; font-weight: 600; color: var(--el-text-color-primary); }
.auth-hint { font-size: 11px; color: var(--el-text-color-regular); text-align: right; }
.auth-custom :deep(.el-input__wrapper) {
  border-radius: var(--mp-radius);
  box-shadow: 0 0 0 1px var(--el-border-color-light) inset;
  background: var(--el-bg-color-overlay);
  transition: box-shadow 0.18s ease;
}
/* ReSelect 触发栏铺满容器（组件默认 display:block，这里只保证宽度） */
.auth-select { width: 100%; }
.auth-custom { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
.auth-custom :deep(.el-form-item) { margin-bottom: 0; margin-top: 0; }
.auth-custom :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  padding-bottom: 6px;
  line-height: 1.4;
}
.auth-preview {
  margin: 0;
  font-size: 11.5px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.auth-preview code {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 11px;
  padding: 1px 5px;
  border-radius: var(--mp-radius-sm);
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
  word-break: break-all;
}
.key-exist-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-color-warning-light-9);
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 30%, transparent);
  padding: 10px 12px;
  border-radius: var(--mp-radius);
  line-height: 1.6;
}
.key-exist-hint > .el-icon { color: var(--el-color-warning); flex-shrink: 0; margin-top: 2px; }
.key-exist-hint strong { color: var(--el-text-color-primary); }
.key-exist-tip { color: var(--el-color-warning); }

.key-row { display: flex; align-items: center; gap: 8px; }
.key-row .el-input { flex: 1; }
.key-filled :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-success-light-5) inset;
}
.key-eye {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-disabled);
  display: inline-flex;
  padding: 4px;
  border-radius: var(--mp-radius-sm);
  transition: all 0.15s ease;
}
.key-eye:hover { color: var(--el-text-color-primary); background: var(--el-fill-color-light); }
.key-remove {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-disabled);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--mp-radius-sm);
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.key-remove:hover { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }

.key-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.add-key-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px dashed var(--el-text-color-disabled);
  background: transparent;
  color: var(--el-text-color-regular);
  border-radius: var(--mp-radius);
  height: 36px;
  padding: 0 14px;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
}
.add-key-btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  border-style: solid;
  background: var(--el-color-primary-light-9);
}
.get-key-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: var(--mp-radius-sm);
  transition: all 0.15s ease;
}
.get-key-btn:hover { color: var(--el-color-primary); background: var(--el-color-primary-light-9); }

.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--mp-radius);
  font-size: 12.5px;
  animation: pf-fade-in 0.25s ease;
  border: 1px solid transparent;
}
.test-result.is-success {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success-dark-2);
  border-color: color-mix(in srgb, var(--el-color-success) 30%, transparent);
}
.test-result.is-error {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger-dark-2);
  border-color: color-mix(in srgb, var(--el-color-danger) 30%, transparent);
}

@keyframes pf-fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.opt-two-line { display: flex; flex-direction: column; gap: 2px; line-height: 1.3; }
.opt-main { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.opt-sub { font-size: 11px; color: var(--el-text-color-regular); }

/* 底部 */
.pf-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}
.pf-testing { font-size: 12px; color: var(--el-color-primary); }
.pf-footer-btns { display: flex; justify-content: flex-end; gap: 10px; margin-left: auto; }
.pf-foot-btn {
  border-radius: var(--mp-radius);
  min-width: 76px;
  transition: all 0.18s ease;
  cursor: pointer;
}
.pf-foot-btn:not(.el-button--primary) {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color-light);
  color: var(--el-text-color-primary);
}
.pf-foot-btn:not(.el-button--primary):hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.pf-foot-primary {
  background: var(--el-color-primary);
  border: none;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  font-weight: 600;
}
.pf-foot-primary:hover {
  background: var(--el-color-primary-light-3);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
}
</style>
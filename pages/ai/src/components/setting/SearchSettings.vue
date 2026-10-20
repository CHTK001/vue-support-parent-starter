<template>
  <div class="flex-1">
    <SettingsCard :title="t('settings.search.title')">
      <!-- 网络搜索插件开关 -->
      <SettingsRow
        :label="t('settings.search.webSearchPlugin')"
        :description="t('settings.search.webSearchPluginDesc')"
      >
        <el-switch
          v-model="pluginEnabled"
          :loading="pluginLoading"
          @update:model-value="handlePluginToggle"
        />
      </SettingsRow>

      <!-- 搜索供应商 -->
      <SettingsRow
        :label="t('settings.search.provider')"
        :description="t('settings.search.providerDesc')"
        control-width="220px"
      >
        <el-select v-model="selectedProvider" @update:model-value="handleProviderChange">
          <!-- 360 放最前并作为默认：它无需 API Key 即可用，是唯一「不配任何东西就能联网」
               的路径；后端 WebSearchService 的兜底也正是 360。此前页面没有这个选项，
               后端却默认走它，导致「页面显示的选中项」和「实际生效的搜索源」不是同一个。 -->
          <el-option label="360（免费，无需 API Key）" value="360" />
          <el-option :label="t('settings.search.bocha')" value="bocha" />
          <el-option label="Tavily" value="tavily" />
          <el-option :label="t('settings.search.metaso')" value="metaso" />
        </el-select>
      </SettingsRow>

      <!-- 秘塔 API Key -->
      <SettingsRow
        v-if="selectedProvider === 'metaso'"
        :label="t('settings.search.metasoApiKey')"
        control-flex
      >
        <template #description>
          {{ t('settings.search.metasoApiKeyDesc') }}
          <span class="key-link" @click="openMetasoUrl">{{ t('settings.search.getApiKey') }}</span>
        </template>
        <el-input v-model="providerKeys.metaso" type="password" show-password
          placeholder="mk-..." clearable />
      </SettingsRow>

      <!-- 博查 API Key -->
      <SettingsRow
        v-if="selectedProvider === 'bocha'"
        :label="t('settings.search.bochaApiKey')"
        control-flex
      >
        <template #description>
          {{ t('settings.search.bochaApiKeyDesc') }}
          <span class="key-link" @click="openBochaUrl">{{ t('settings.search.getApiKey') }}</span>
        </template>
        <el-input v-model="providerKeys.bocha" type="password" show-password
          placeholder="sk-..." clearable />
      </SettingsRow>

      <!-- Tavily API Key -->
      <SettingsRow
        v-if="selectedProvider === 'tavily'"
        label="Tavily API Key"
        control-flex
      >
        <template #description>
          {{ t('settings.search.tavilyApiKeyDesc') }}
          <span class="key-link" @click="openTavilyUrl">{{ t('settings.search.getApiKey') }}</span>
        </template>
        <el-input v-model="providerKeys.tavily" type="password" show-password
          placeholder="tvly-..." clearable />
      </SettingsRow>

      <!-- 提示信息。
           注意最后那个 v-else：它兜的是 metaso，所以新增搜索源必须显式加分支，
           否则选中新源时会显示秘塔的文案（这里之前就会把 360 显示成秘塔）。 -->
      <div class="search-tip">
        <template v-if="selectedProvider === '360'">
          360 搜索无需 API Key，开箱即用；返回网页结果，适合实时信息（天气、行情、新闻）。
          调用失败时后端会自动回落到该源，因此把它留在列表里总是安全的。
        </template>
        <template v-else-if="selectedProvider === 'bocha'">{{ t('settings.search.bochaTip') }}</template>
        <template v-else-if="selectedProvider === 'tavily'">{{ t('settings.search.tavilyTip') }}</template>
        <template v-else-if="selectedProvider === 'metaso'">{{ t('settings.search.metasoTip') }}</template>
        <template v-else>付费源的 Key 未填写或调用失败时，后端会自动回落到 360 免费搜索。</template>
      </div>
    </SettingsCard>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getLocale } from '@/locales'
import { useDebounceFn } from '@vueuse/core'
import { apiService } from '@/services/ApiService'
import { usePopup } from '@/composables/usePopup'
import { openInExternalBrowser } from '@/utils/browserUtils'

import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'

const { notify } = usePopup()
const { t } = useI18n()

// 当前选中的供应商。默认 360：与后端 WebSearchService 的 orElse("360") 兜底对齐，
// 也与 SearchGlobalSettingProvider 里 provider 的默认值一致，三处口径必须同一个。
const selectedProvider = ref('360')

// 各供应商 API Key 独立存储（切换供应商时不会丢失）
const providerKeys = reactive({
  bocha: '',
  tavily: '',
  metaso: '',
})

// 原始备份，用于检测变更
const originalSettings = ref<any>(null)

// 插件状态
const pluginEnabled = ref(false)
const pluginLoading = ref(false)

// 自动保存（防抖 500ms）
const debouncedSave = useDebounceFn(async () => {
  await handleSave()
}, 500)

// 监听 API Key 变化自动保存
watch(() => [providerKeys.bocha, providerKeys.tavily, providerKeys.metaso], () => {
  debouncedSave()
})

// 打开链接
const openBochaUrl = () => openInExternalBrowser('https://open.bochaai.com')
const openMetasoUrl = () => openInExternalBrowser('https://metaso.cn/search-api')
const openTavilyUrl = () => openInExternalBrowser('https://app.tavily.com')

// 切换供应商即时保存 + 触发插件重载以重新注册工具
const handleProviderChange = async (val: string) => {
  selectedProvider.value = val
  await handleSave()
  try {
    await apiService.reloadPlugin('web-search')
  } catch (error: any) {
    console.error('重新加载插件失败:', error)
  }
}

// 加载设置
const loadSettings = async () => {
  try {
    const response = await apiService.fetchGroupSettings('search')
    selectedProvider.value = response.provider || '360'
    providerKeys.bocha = response.bocha?.apiKey || ''
    providerKeys.tavily = response.tavily?.apiKey || ''
    providerKeys.metaso = response.metaso?.apiKey || ''
    originalSettings.value = JSON.parse(JSON.stringify({
      provider: selectedProvider.value,
      bocha: { apiKey: providerKeys.bocha },
      tavily: { apiKey: providerKeys.tavily },
      metaso: { apiKey: providerKeys.metaso },
    }))
  } catch (error) {
    console.error('获取搜索设置失败:', error)
    originalSettings.value = JSON.parse(JSON.stringify({
      provider: '360',
      bocha: { apiKey: '' },
      tavily: { apiKey: '' },
      metaso: { apiKey: '' },
    }))
  }

  // 加载插件状态
  try {
    const pluginsRes = await apiService.queryPlugins(undefined, getLocale())
    const plugin = pluginsRes.plugins?.find((p: any) => p.pluginId === 'web-search')
    if (plugin) {
      pluginEnabled.value = plugin.enabled
    }
  } catch (error) {
    console.error('获取插件状态失败:', error)
  }
}

// 保存设置
const handleSave = async () => {
  try {
    const dataToSave: Record<string, any> = {
      provider: selectedProvider.value,
      bocha: { apiKey: providerKeys.bocha || '' },
      tavily: { apiKey: providerKeys.tavily || '' },
      metaso: { apiKey: providerKeys.metaso || '' },
    }

    await apiService.updateGroupSettings('search', dataToSave)
    originalSettings.value = JSON.parse(JSON.stringify({
      provider: selectedProvider.value,
      bocha: { apiKey: providerKeys.bocha },
      tavily: { apiKey: providerKeys.tavily },
      metaso: { apiKey: providerKeys.metaso },
    }))
  } catch (error: any) {
    console.error('保存搜索设置失败:', error)
    notify.error(t('common.saveFailed'), error.message || t('common.error.unknown'))
  }
}

// 切换插件状态
const handlePluginToggle = async (val: string | number | boolean) => {
  const enabled = !!val
  pluginLoading.value = true
  try {
    const res = await apiService.updateGlobalToolStatus('web-search', enabled)
    if (res?.success) {
      pluginEnabled.value = enabled
      message.success(enabled ? t('settings.search.pluginEnabled') : t('settings.search.pluginDisabled'))
    }
  } catch (error: any) {
    pluginEnabled.value = !enabled
    console.error('切换插件状态失败:', error)
    notify.error(t('settings.search.pluginToggleFailed'), error.message || t('common.error.unknown'))
  } finally {
    pluginLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.key-link {
  color: var(--el-color-primary);
  cursor: pointer;
  margin-left: 2px;
}
.key-link:hover { text-decoration: underline; }

.search-tip {
  padding: 11px 16px;
  font-size: 12px; line-height: 1.6;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-top: 1px solid var(--color-surface-border, var(--el-border-color-lighter));
}
</style>

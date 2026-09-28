<template>
  <LDialog
    v-model="visible"
    :title="t('settings.providerDetail.fetchModelsTitle')"
    width="600px"
    align-center
    class="model-fetch-dialog"
    append-to-body
  >
    <div class="dialog-content">
      <div class="fetch-search">
        <el-input v-model="searchName" :placeholder="t('settings.providerDetail.searchModelName')" clearable>
          <template #prefix>
            <el-icon><SearchOutlined /></el-icon>
          </template>
        </el-input>
      </div>

      <div v-if="fetching" class="fetch-loading">
        <el-icon class="is-loading" style="font-size: 32px; color: var(--color-primary);">
          <Loading />
        </el-icon>
      </div>
      <div v-else class="pb-4">
        <div v-if="filtered.length > 0">
          <ul class="fetch-list">
            <li v-for="model in filtered" :key="model.modelName" class="fetch-row">
              <div class="fetch-id">
                <span class="fetch-name">{{ model.modelName }}</span>
                <span
                  v-if="model.modelType !== 'text'"
                  class="fetch-badge"
                >
                  {{ t('settings.providerDetail.embeddingBadge') }}
                </span>
                <template v-for="feature in model.config?.features || []" :key="feature">
                  <LTooltip :content="getLableName(feature)" placement="top">
                    <el-icon class="fetch-feature" :size="14">
                      <WrenchScrewdriver24Regular v-if="feature === 'tools'" />
                      <LightbulbFilament24Regular v-else-if="feature === 'thinking'" />
                      <ScienceOutlined v-else />
                    </el-icon>
                  </LTooltip>
                </template>
              </div>
              <el-button link type="primary" @click="handleSelect(model)">
                {{ t('settings.providerDetail.select') }}
              </el-button>
            </li>
          </ul>
        </div>
        <div v-else-if="loadError" class="fetch-error">
          <el-icon class="fetch-error-icon" :size="20"><CircleCloseFilled /></el-icon>
          <div class="fetch-error-text">
            <div class="fetch-error-title">获取失败</div>
            <div class="fetch-error-desc">{{ loadError }}</div>
          </div>
        </div>
        <div v-else class="fetch-empty">
          {{ t('settings.providerDetail.noMatchFound') }}
        </div>
      </div>
    </div>
  </LDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Model } from '@/types/api'
import LDialog from '@/components/ui/LDialog.vue'
import LTooltip from '../ui/LTooltip.vue'
import { SearchOutlined, ScienceOutlined } from '@vicons/material'
import { WrenchScrewdriver24Regular, LightbulbFilament24Regular } from '@vicons/fluent'
import { Loading, CircleCloseFilled } from '@element-plus/icons-vue'
import { apiService } from '../../services/ApiService'
import { usePopup } from '../../composables/usePopup'

const emit = defineEmits<{ select: [model: any] }>()

const { t } = useI18n()
const { notify } = usePopup()

const visible = ref(false)
const fetching = ref(false)
const searchName = ref('')
const fetched = ref<any[]>([])
const loadError = ref('')
let existingModels: any[] = []

const filtered = computed(() => {
  if (!searchName.value) return fetched.value
  const term = searchName.value.toLowerCase()
  return fetched.value.filter((m) => m.modelName.toLowerCase().includes(term))
})

const getLableName = (type: string) => {
  switch (type) {
    case 'visual':
      return t('settings.providerDetail.visual')
    case 'tools':
      return t('settings.providerDetail.toolCalling')
    case 'thinking':
      return t('settings.providerDetail.mixedThinking')
    default:
      return type
  }
}

const open = async (provider: any, models: any[]) => {
  // 本地推理（ONNX）无需 base_url 与 Key：模型目录由后端本地模型门面提供，
  // 不能沿用云端提供商的「必须配好地址和 Key 才允许拉取」的前置校验，否则加模型流程会被堵死
  const isLocalProvider =
    provider?.id === 'onnx' ||
    provider?.provider_id === 'onnx' ||
    String(provider?.platform || provider?.provider || '').toLowerCase().includes('onnx')

  if (!isLocalProvider) {
    const hasApiKey =
      provider.apiKey ||
      (provider.apiKeyList && provider.apiKeyList.length > 0) ||
      (provider.api_keys && provider.api_keys.length > 0)
    if (!provider.apiUrl || !hasApiKey) {
      notify.error(
        t('settings.providerDetail.configError'),
        t('settings.providerDetail.configApiError'),
        { duration: 2000 },
      )
      return
    }
  }

  existingModels = models || []
  searchName.value = ''
  fetched.value = []
  loadError.value = ''
  visible.value = true
  fetching.value = true
  try {
    const data = await apiService.fetchRemoteModels(provider.id)
    // 上游鉴权失败时后端返回 200 + success:false（避免被误判为会话过期而登出）
    if (data && data.success === false) {
      throw new Error(data.error || t('settings.providerDetail.fetchFailed'))
    }
    // 上游返回的模型列表可能落在三处：顶层 items、data.items、data 数组
    const dataField = data.data
    const apiModels: Model[] =
      data.items ??
      (Array.isArray(dataField) ? dataField : dataField?.items) ??
      []
    const enriched = apiModels.map((apiModel: any) => {
      const existing = existingModels.find((m: any) => m.modelName === apiModel.modelName)
      if (existing) {
        return { ...apiModel, id: existing.id, config: { ...existing.config } }
      }
      return { ...apiModel, config: apiModel.config || { features: [] } }
    })
    fetched.value = enriched
    notify.success(
      t('common.operationSuccess'),
      t('settings.providerDetail.fetchSuccess', { n: enriched.length }),
      { duration: 2000 },
    )
  } catch (error: any) {
    fetched.value = []
    loadError.value =
      error?.response?.data?.error ||
      error?.data?.error ||
      error?.error ||
      error?.message ||
      t('settings.providerDetail.fetchFailed')
    console.error('获取模型列表失败:', error)
  } finally {
    fetching.value = false
  }
}

defineExpose({ open })

const handleSelect = (model: any) => {
  visible.value = false
  emit('select', model)
}
</script>

<style scoped>
.fetch-search { position: sticky; top: 0; z-index: 10; margin-bottom: 12px; }
.fetch-loading { display: flex; justify-content: center; align-items: center; padding: 48px 0; }
.fetch-list {
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
}
.fetch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background 0.15s ease;
}
.fetch-row:last-child { border-bottom: none; }
.fetch-row:hover { background: var(--el-fill-color-light); }
.fetch-id { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; margin-right: 16px; }
.fetch-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fetch-badge {
  padding: 1px 6px;
  /* 原值 5px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  font-size: 11px;
  font-weight: 500;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.fetch-feature { color: var(--color-text-gray); cursor: pointer; transition: color 0.15s ease; }
.fetch-feature:hover { color: var(--color-primary); }
.fetch-empty { text-align: center; padding: 48px 0; font-size: 13px; color: var(--color-text-disabled); }
.fetch-error {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-top: 6px;
  padding: 14px 15px;
  /* 原值 11px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 30%, transparent);
}
.fetch-error-icon { color: var(--el-color-danger); flex-shrink: 0; margin-top: 1px; }
.fetch-error-text { min-width: 0; }
.fetch-error-title { font-size: 13px; font-weight: 700; color: var(--el-color-danger); }
.fetch-error-desc {
  font-size: 12px;
  color: var(--color-text-gray);
  margin-top: 3px;
  line-height: 1.5;
  word-break: break-word;
}

/* 动效降级：系统开启「减少动态效果」时，供应商行的悬停底色与特性链接的文字色直接到位。
   逐个列出，不写 `*` / .fetch-row * 通配，
   避免把 el-dialog / el-tag 内部 Element Plus 组件的合法过渡一起掐掉。
   这两个都只带 transition（无 animation），hover 态本身是静态样式，照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .fetch-row,
  .fetch-feature {
    transition: none;
  }
}
</style>

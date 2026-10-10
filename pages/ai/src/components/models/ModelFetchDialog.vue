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
        <el-input
          v-model="searchName"
          class="fetch-input"
          :placeholder="t('settings.providerDetail.searchModelName')"
          clearable
        >
          <template #prefix>
            <el-icon><SearchOutlined /></el-icon>
          </template>
        </el-input>
        <!--
          一键批量录入：整批走后端 POST /providers/{id}/models/import-all，
          后端负责调上游取目录 + 落库（已存在的跳过），用户不必逐条点「选择」。
        -->
        <el-button
          type="primary"
          :loading="importing"
          :disabled="fetched.length === 0 || fetching"
          @click="handleImportAll"
        >
          <template #icon><Download /></template>
          {{ importing
            ? t('settings.providerDetail.importing')
            : t('settings.providerDetail.importAll', { n: fetched.length }) }}
        </el-button>
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

      <!-- 逐条挑完就走；只想手工建一个（或供应商还没配好地址/Key）时走这里 -->
      <div class="fetch-foot">
        <el-button link type="primary" @click="handleManual">
          {{ t('settings.providerDetail.manualAdd') }}
        </el-button>
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
import { Loading, CircleCloseFilled, Download } from '@element-plus/icons-vue'
import { apiService } from '../../services/ApiService'
import { usePopup } from '../../composables/usePopup'

const emit = defineEmits<{
  /** 逐条挑一个模型 → 预填表单 */
  select: [model: any]
  /** 已经批量录入完成，父组件据此刷新供应商的模型列表 */
  imported: []
  /** 打开手动新建模型表单（列表看不看得到都行，这里是逃生口） */
  manual: []
}>()

const { t } = useI18n()
const { notify } = usePopup()

const visible = ref(false)
const fetching = ref(false)
const importing = ref(false)
const searchName = ref('')
const fetched = ref<any[]>([])
const loadError = ref('')
/** 当前供应商标识：批量录入要按它落库，open 时记下，避免再从 props 里猜 */
const providerId = ref('')
let existingModels: any[] = []
/**
 * 已知在库里的模型名（打开时来自既有模型，每次录入成功后并入返回的新行）。
 * 用来判断「上游这次没返回的，是不是本来就录过了」——否则上游短返回时会误报
 * 「部分录入」，让用户对着已经录全的列表反复点。
 */
const knownPresent = new Set<string>()
/** 拉取列表行的模型名（上游条目字段名不统一，modelName/name/id 三处都可能有） */
const fetchRowName = (m: any) => String(m?.modelName ?? m?.name ?? m?.id ?? '')

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

/**
 * 打开拉取列表。
 *
 * @param provider 供应商对象（含 id/apiUrl/apiKey）
 * @param models 该供应商已有的模型（用于「已有」标记）
 * @param fallbackToManual 拉不动时是否回退手工表单。**只有「添加模型」这个主入口
 *   才该回退**；从模型表单里点「获取」触发时不能回退——那会把用户已经填好的字段
 *   重置掉（openAdd 会清空表单）。
 */
const open = async (provider: any, models: any[], fallbackToManual = true) => {
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
      // 没配地址/Key 就拉不到目录，此时如果既不开列表也不开表单，
      // 用户会被卡死在「添加模型」按钮上 —— 主入口直接退回手工新建表单；
      // 表单内点「获取」的分支不回退（见 open 的 fallbackToManual）。
      if (fallbackToManual) {
        emit('manual')
      }
      return
    }
  }

  providerId.value = provider?.id || provider?.provider_id || ''
  existingModels = models || []
  knownPresent.clear()
  for (const m of existingModels) {
    const n = String(m?.model ?? m?.modelName ?? '')
    if (n) knownPresent.add(n)
  }
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

const close = () => { visible.value = false }
/** 点击「手动添加」：先关掉 fetchDialog，让表单-dialog 露出来。
 * 表单-dialog 在「添加模型」时就已打开，这里不能调 openAdd 重置用户内容。 */
const handleManual = () => {
  visible.value = false
  emit('manual')
}
defineExpose({ open, close })

const handleSelect = (model: any) => {
  visible.value = false
  emit('select', model)
}

/**
 * 一键批量录入：整个动作在后端一次完成（调上游取目录 + 写库），
 * 前端只负责把统计结果说清楚。
 *
 * <p>去重语义由后端保证（模型名已存在则跳过、不覆盖用户改过的参数），
 * 所以这里**不做本地预判**，重复点击只是把新出现的模型补录进来。</p>
 */
const handleImportAll = async () => {
  if (importing.value || !providerId.value || fetched.value.length === 0) return
  importing.value = true
  try {
    const res = await apiService.importAllModels(providerId.value)
    const imported = Number(res?.imported ?? 0)
    const skipped = Number(res?.skipped ?? 0)
    const total = Number(res?.total ?? imported + skipped)
    if (total === 0) {
      // 上游一个模型都没返回：不是故障，但必须说清楚，否则用户以为卡住
      notify.warning(
        t('settings.providerDetail.fetchModelsTitle'),
        t('settings.providerDetail.fetchSuccess', { n: 0 }),
        { duration: 3000 },
      )
      return
    }
    const processed = imported + skipped
    const expected = fetched.value.length // 弹窗列表来自 remote_models，是「该录全」的口径
    for (const row of res?.models || []) {
      const n = String(row?.model ?? row?.modelName ?? '')
      if (n) knownPresent.add(n)
    }
    // 上游网关在快速重复调用时会返回不完整目录（实测同一密钥连打会回短列表/401）。
    // 但只有「这次没返回的条目里确实还有库里没有的」才算缺口 —— 全录过之后再短返回
    // 不该报警，否则用户会对已录全的列表反复点。有缺口就明确告知并保留弹窗续点补录。
    const missingLocally = fetched.value.filter((m) => !knownPresent.has(fetchRowName(m))).length
    if (processed < expected && missingLocally > 0) {
      // 上游网关在快速重复调用时会返回不完整目录（实测同一密钥连打会回短列表/401）。
      // 这时若照常关弹窗，用户会以为录全了 —— 明确告知缺口、保留弹窗让他续点补录。
      notify.warning(
        t('settings.providerDetail.importPartial', { got: processed, expected }),
        t('settings.providerDetail.importPartialDesc', { got: processed, expected, imported, skipped }),
        { duration: 6000 },
      )
      emit('imported') // 已录进去的部分照样要让父组件刷新
      return
    }
    notify.success(
      t('common.operationSuccess'),
      t('settings.providerDetail.importDone', { imported, skipped }),
      { duration: 3000 },
    )
    emit('imported')
    visible.value = false
  } catch (error: any) {
    console.error('批量录入失败:', error)
    notify.error(
      t('settings.providerDetail.importFailed'),
      error?.data?.error || error?.message || String(error),
      { duration: 5000 },
    )
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.fetch-search {
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: 12px;
  /* 搜索框 + 「全部录入」并排：录入是主操作，不能藏在列表里 */
  display: flex;
  align-items: center;
  gap: 8px;
}
.fetch-input { flex: 1; min-width: 0; }
.fetch-foot {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}
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

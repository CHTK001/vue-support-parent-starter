<template>
  <!--
    模型管理嵌入页（/models/embed）：只渲染工作区，不带 MainLayout 的侧栏与页头，
    供其它系统 iframe 嵌入做模型配置。

    <p>复用 ModelsProviderDetail 做右栏：模型增删改查 / 启用 / 拉取 / 批量录入
    都在它内部闭环。嵌入页额外补齐原本在 ModelsPage 里的供应商级操作
    （新增 / 删除 / 模板库），达到「全功能」。</p>
  -->
  <div class="embed-models h-full overflow-hidden flex flex-col" data-page="models-embed">
    <!-- 嵌入页自己的顶栏：供应商选择 + 新增/模板库（替代 ModelsPage 的左栏） -->
    <div class="em-bar">
      <el-select
        v-model="currentProviderId"
        class="em-provider"
        placeholder="选择供应商"
        @change="onProviderChange"
      >
        <el-option
          v-for="p in providers"
          :key="p.id"
          :label="p.name"
          :value="p.id"
        />
      </el-select>
      <div class="em-actions">
        <el-button size="small" @click="openCatalog">模板库</el-button>
        <el-button size="small" type="primary" @click="handleCreate">新增供应商</el-button>
      </div>
    </div>

    <!-- 右栏：与 /models 同一组件 -->
    <div class="em-main flex-1 min-h-0">
      <ModelsProviderDetail
        v-if="currentProviderId && currentProvider"
        :provider="currentProvider"
        :models="currentModels"
        :model-presets="modelPresets"
        @changed="reload"
        @edit-provider="handleEditProvider"
        @delete-provider="handleDeleteProvider(currentProvider)"
      />
      <div v-else class="em-empty">
        <p class="em-empty-title">选择或添加一个供应商开始</p>
        <div class="em-empty-actions">
          <el-button type="primary" round @click="openCatalog">打开模板库</el-button>
          <el-button round @click="handleCreate">自定义添加</el-button>
        </div>
      </div>
    </div>

    <!-- 弹窗：原本挂在 ModelsPage 下，嵌入页自带一份 -->
    <ProviderFormDialog ref="formRef" @saved="handleSaved" @back="openCatalog" @goToChannelManagement="handleGoToChannelManagement" />
    <TemplateCatalogDialog ref="catalogRef" :templates="availableTemplates" @select="handleTemplateClick" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ModelsProviderDetail from './ModelsProviderDetail.vue'
import ProviderFormDialog from './ProviderFormDialog.vue'
import TemplateCatalogDialog from './TemplateCatalogDialog.vue'
import { apiService } from '../../services/ApiService'
import { adminApi } from '@/framework/context'
import { message } from '@repo/core'
import { usePopup } from '../../composables/usePopup'
import { PROVIDER_TEMPLATES } from './model.constants'
import { mapProvider, mapModel } from './model.utils'

const { t } = useI18n()
const { confirm } = usePopup()
const route = useRoute()
const router = useRouter()

const providers = ref<any[]>([])
const models = ref<any[]>([])
const modelPresets = ref<any[]>([])
const currentProviderId = ref<string | null>(null)
const formRef = ref<any>(null)
const catalogRef = ref<any>(null)

// 加载供应商与模型（与 ModelsPage.reload 同口径）
const reload = async () => {
  try {
    const body = await adminApi.get('/api/providers')
    const rawList = Array.isArray(body) ? body : body?.data || []
    const list = rawList.map(mapProvider)
    providers.value = list

    const allModels: any[] = []
    list.forEach((p: any) => {
      if (Array.isArray(p.models)) {
        p.models.forEach((m: any) => allModels.push(mapModel(m, p.id)))
      }
    })
    models.value = allModels

    // ?provider= 指定默认供应商；否则自动选中第一个 / 保持当前选中
    const wanted = String(route.query.provider || '')
    if (wanted && list.some((p: any) => p.id === wanted)) {
      currentProviderId.value = wanted
    } else if (!currentProviderId.value && list.length > 0) {
      currentProviderId.value = list[0].id
    } else if (currentProviderId.value && !list.some((p: any) => p.id === currentProviderId.value)) {
      currentProviderId.value = list.length > 0 ? list[0].id : null
    }
  } catch (e) {
    console.warn('加载供应商列表失败:', e)
  }
}

const currentProvider = computed(
  () => providers.value.find((p) => p.id === currentProviderId.value) || null,
)

const currentModels = computed(() =>
  models.value.filter((m) => m.providerId === currentProviderId.value),
)

// 可添加模板：过滤已添加类型（与 ModelsPage.availableTemplates 同口径）
const availableTemplates = computed(() => {
  const added = new Set(providers.value.map((p: any) => p.provider))
  return PROVIDER_TEMPLATES.filter((tpl: any) => !added.has(tpl.id))
})

const onProviderChange = () => {
  // el-select 已通过 v-model 写回 currentProviderId，这里仅占位
}

const handleCreate = () => formRef.value.openCreate()
const openCatalog = () => catalogRef.value.open()
const handleEditProvider = () => {
  if (currentProvider.value) formRef.value.openEdit(currentProvider.value)
}

// 删除供应商（与 ModelsPage.handleDeleteProvider 同守卫：只有内置 Agent 不可删；
// ONNX 由用户自己添加，可删）
const handleDeleteProvider = async (p: any) => {
  if (!p || p.id === 'agent') return
  const modelCount = Array.isArray(p.models) ? p.models.length : 0
  const ok = await confirm(
    '删除供应商',
    `确定删除供应商「${p.name}」吗？其下 ${modelCount} 个模型及连接配置将一并删除，删除后不可恢复。`,
    { type: 'error', confirmText: '删除' },
  )
  if (!ok) return
  try {
    await apiService.deleteProvider(p.id)
    message.success(`供应商「${p.name}」已删除`)
    if (currentProviderId.value === p.id) currentProviderId.value = null
    await reload()
  } catch (e: any) {
    console.error('删除供应商失败:', e)
    message.error(e?.message || '请稍后重试')
  }
}
const handleTemplateClick = (template: any) => formRef.value.openFromTemplate(template)

const handleSaved = async () => {
  await reload()
}

// 账号渠道 provider 跳转入口（嵌入页场景）
const handleGoToChannelManagement = () => {
  // 嵌入页无完整路由导航，提示用户到主应用系统设置页完成渠道管理
  message.info('请在主应用「系统设置 → 渠道管理」中完成账号绑定')
}

onMounted(async () => {
  await reload()
  try {
    modelPresets.value = await apiService.getModelPresets()
  } catch (error) {
    console.error('获取模型预设库失败:', error)
  }
})
</script>

<style scoped>
.embed-models { background: var(--el-bg-color); }
.em-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.em-provider { width: 240px; }
.em-actions { margin-left: auto; display: flex; gap: 8px; }
.em-main { min-width: 0; background: var(--el-bg-color); }
.em-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  text-align: center;
}
.em-empty-title { margin: 0 0 16px; font-size: 15px; font-weight: 600; color: var(--color-text); }
.em-empty-actions { display: flex; gap: 12px; justify-content: center; }
</style>

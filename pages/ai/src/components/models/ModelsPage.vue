<template>
  <div class="h-full overflow-hidden flex flex-col">
    <PageHeader :title="t('settings.models.title')" />
    <div class="flex-1 min-h-0">
      <div class="models-workspace h-full flex">
        <!-- 左侧：供应商导航 -->
        <aside class="mw-aside">
          <div class="mw-aside-head">
            <span class="mw-aside-title">{{ t('settings.models.providers') }}</span>
            <button class="mw-round" :title="t('settings.models.addCustom')" @click="handleCreate">
              <el-icon :size="18"><AddOutlined /></el-icon>
            </button>
          </div>

          <ul class="mw-list">
            <li
              v-for="p in providers"
              :key="p.id"
              class="mw-item"
              :class="{ active: p.id === currentProviderId }"
              @click="selectProvider(p)"
            >
              <ProviderLogo :pid="getProviderIcon(p)" :name="p.name" size="md" />
              <div class="mw-item-text">
                <span class="mw-item-name">{{ p.name }}</span>
                <span class="mw-item-meta">
                  {{ p.models?.length || 0 }} 模型 · {{ enabledOf(p) }} 启用
                </span>
              </div>
              <span class="mw-item-tail">
                <span class="mw-item-status" :class="enabledOf(p) > 0 ? 'on' : 'off'"></span>
                <button
                  v-if="p.id !== 'agent' && p.id !== 'onnx'"
                  class="mw-item-del"
                  type="button"
                  title="删除供应商"
                  @click.stop="handleDeleteProvider(p)"
                >
                  <el-icon :size="15"><DeleteOutlined /></el-icon>
                </button>
              </span>
            </li>
            <li v-if="providers.length === 0" class="mw-list-empty">
              暂无供应商，请从模板库添加
            </li>
          </ul>

          <button class="mw-store" @click="openCatalog">
            <el-icon :size="17"><StorefrontOutlined /></el-icon>
            <span class="mw-store-label">模板库</span>
            <span class="mw-store-count">{{ availableTemplates.length }}</span>
          </button>
        </aside>

        <!-- 右侧：工作区 -->
        <main class="mw-main">
          <ModelsProviderDetail
            v-if="currentProviderId && currentProvider"
            :provider="currentProvider"
            :models="currentModels"
            :model-presets="modelPresets"
            @changed="reload"
            @edit-provider="handleEditProvider"
            @delete-provider="handleDeleteProvider(currentProvider)"
          />
          <div v-else class="mw-main-empty">
            <div class="mw-empty-icon">
              <el-icon :size="30"><CloudOutlined /></el-icon>
            </div>
            <p class="mw-empty-title">选择或添加一个供应商开始</p>
            <p class="mw-empty-desc">在左侧选择供应商，或从模板库一键添加</p>
            <div class="flex gap-3 mt-5 justify-center">
              <el-button type="primary" round @click="openCatalog">
                <template #icon><StorefrontOutlined /></template>
                打开模板库
              </el-button>
              <el-button round @click="handleCreate">
                <template #icon><AddOutlined /></template>
                自定义添加
              </el-button>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- 弹窗 -->
    <ProviderFormDialog ref="formRef" @saved="handleSaved" @back="openCatalog" />
    <TemplateCatalogDialog ref="catalogRef" :templates="availableTemplates" @select="handleTemplateClick" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AddOutlined, CloudOutlined, StorefrontOutlined, DeleteOutlined } from '@vicons/material'
import PageHeader from '@/components/PageHeader.vue'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import ModelsProviderDetail from './ModelsProviderDetail.vue'
import ProviderFormDialog from './ProviderFormDialog.vue'
import TemplateCatalogDialog from './TemplateCatalogDialog.vue'
import { apiService } from '../../services/ApiService'
import { adminApi } from '@/framework/context'
import { usePopup } from '../../composables/usePopup'
import { PROVIDER_TEMPLATES } from './model.constants'
import ProviderLogo from './ProviderLogo.vue'
import { mapProvider, mapModel } from './model.utils'

const { t } = useI18n()
const { notify, confirm } = usePopup()

const providers = ref<any[]>([])
const models = ref<any[]>([])
const modelPresets = ref<any[]>([])
const currentProviderId = ref<string | null>(null)
const formRef = ref<any>(null)
const catalogRef = ref<any>(null)

const getProviderIcon = (item: any) => item.provider || item.id

const enabledOf = (p: any) =>
  (Array.isArray(p.models) ? p.models : []).filter((m: any) => m.enabled !== false).length

// 加载供应商与模型
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

    // 自动选中第一个 / 保持当前选中
    if (!currentProviderId.value && list.length > 0) {
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

// 可添加模板：过滤已添加类型
const availableTemplates = computed(() => {
  const added = new Set(providers.value.map((p) => p.provider))
  return PROVIDER_TEMPLATES.filter((tpl) => !added.has(tpl.id))
})

const selectProvider = (p: any) => {
  currentProviderId.value = p.id
}
const handleCreate = () => formRef.value.openCreate()
const openCatalog = () => catalogRef.value.open()
const handleEditProvider = () => {
  if (currentProvider.value) formRef.value.openEdit(currentProvider.value)
}

// 删除供应商（后端级联删除模型与连接）
const handleDeleteProvider = async (p: any) => {
  if (!p || p.id === 'agent' || p.id === 'onnx') return
  const modelCount = Array.isArray(p.models) ? p.models.length : 0
  const ok = await confirm(
    '删除供应商',
    `确定删除供应商「${p.name}」吗？其下 ${modelCount} 个模型及连接配置将一并删除，删除后不可恢复。`,
    { type: 'error', confirmText: '删除' },
  )
  if (!ok) return
  try {
    await adminApi.delete(`/api/providers/${p.id}`)
    notify.success('删除成功', `供应商「${p.name}」已删除`)
    if (currentProviderId.value === p.id) currentProviderId.value = null
    await reload()
  } catch (e: any) {
    console.error('删除供应商失败:', e)
    notify.error('删除失败', e?.message || '请稍后重试')
  }
}
const handleTemplateClick = (template: any) => formRef.value.openFromTemplate(template)

const handleSaved = async () => {
  await reload()
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
.models-workspace { gap: 0; }

/* 左侧栏 */
.mw-aside {
  display: flex;
  flex-direction: column;
  width: 264px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-surface-border);
  background: var(--color-surface);
}
.mw-aside-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
}
.mw-aside-title { font-size: 13px; font-weight: 700; color: var(--color-text); }
.mw-round {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: calc(var(--size-surface-radius) - 2px);
  color: var(--color-text-gray);
  background: var(--color-surface-border);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}
.mw-round:hover { color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 14%, transparent); }

.mw-list {
  list-style: none;
  margin: 0;
  padding: 0 10px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.mw-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 9px;
  border-radius: var(--size-surface-radius);
  cursor: pointer;
  transition: background 0.15s ease;
}
.mw-item:hover { background: var(--color-surface-border); }
.mw-item.active { background: color-mix(in srgb, var(--color-primary) 13%, transparent); }
.mw-item-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.mw-item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mw-item-meta { font-size: 11px; color: var(--color-text-gray); margin-top: 1px; }
.mw-item-tail {
  position: relative;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.mw-item-status { width: 8px; height: 8px; border-radius: 50%; transition: opacity 0.15s ease; }
.mw-item-status.on { background: var(--el-color-success); }
.mw-item-status.off { background: var(--color-text-disabled); }
.mw-item-del {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--color-text-gray);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.mw-item:hover .mw-item-status { opacity: 0; }
.mw-item:hover .mw-item-del { opacity: 1; }
.mw-item-del:hover {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}
.mw-list-empty {
  padding: 30px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-disabled);
}

.mw-store {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 10px;
  padding: 11px 13px;
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 calc(var(--size-surface-radius) + 2px)（=22px）→ xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.mw-store:hover {
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 50%, var(--el-border-color-lighter));
  background: color-mix(in srgb, var(--el-color-primary) 7%, transparent);
}
.mw-store-label { font-size: 13px; font-weight: 600; flex: 1; text-align: left; }
.mw-store-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  /* 原值 9px，18px 高的计数胶囊；用 full 令牌表达同一种形状 */
  border-radius: var(--el-radius-full, 9999px);
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-border-color-lighter);
}

/* 右侧工作区 */
.mw-main { flex: 1; min-width: 0; background: var(--el-bg-color); }
.mw-main-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  text-align: center;
}
/* 动效降级：系统开启「减少动态效果」时，左侧导航的底色、状态点/删除按钮显隐、
   供应商入口的文字与描边全部改为瞬间切换。逐个列出，不写 `*` / .mw-item * 通配，
   避免把 el-switch / el-dropdown / el-icon 内部 Element Plus 组件的合法过渡一起掐掉。
   这些都只带 transition（无 animation）；.mw-item-status / .mw-item-del 的
   opacity 0 与悬停时的 1 都是静态声明，停掉过渡后「悬停出删除按钮」照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .mw-round,
  .mw-item,
  .mw-item-status,
  .mw-item-del,
  .mw-store {
    transition: none;
  }
}

/* 键盘焦点可见性：模型导航项是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 侧栏底色是令牌化的表面色，一档主色描边足够可见。
   注意 .mw-item-del 平时 opacity: 0、只在 .mw-item:hover 时显形，
   键盘用户看不到删除入口；补 tabindex 时需一并处理显隐，
   本次授权仅限 style 块、不改模板，故此处只报告不改。 */
.mw-item {
  outline: none;
}

.mw-item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.mw-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  /* 原值 18px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  margin-bottom: 18px;
}
.mw-empty-title { margin: 0; font-size: 16px; font-weight: 700; color: var(--color-text); }
.mw-empty-desc { margin: 6px 0 0; font-size: 13px; color: var(--color-text-gray); }
</style>

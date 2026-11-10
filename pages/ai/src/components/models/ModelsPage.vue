<template>
  <div class="h-full overflow-hidden flex flex-col" data-page="models">
    <!--
      页头：独立路由（/models）渲染完整 PageHeader；嵌入到配置中心时（embedded=true）
      交出标题与窗口控制，只保留「多选 / 删除供应商」这排操作 —— 外层已经有页头，
      再来一个就是同一条标题栏画两遍。
    -->
    <PageHeader v-if="!embedded" :title="t('settings.models.title')">
      <template #actions>
        <!-- 供应商行多选/批删：与逐条删除分开，点供应商头像或名称进入该供应商的模型页。
             按钮组是独立组件（ModelsBatchActions），配置中心内嵌入口引的是同一个，
             两个入口的这排操作因此不会各写一份。
             canWrite=false（非管理员）时整排不渲染：批量删除是 admin-only 接口。 -->
        <ModelsBatchActions
          v-if="canWrite"
          :multi-select="multiSelect"
          :selected-count="selectedProviders.length"
          :deleting="batchDeleting"
          @start="multiSelect = true"
          @cancel="exitMultiSelect"
          @remove="batchDeleteProviders"
        />
      </template>
    </PageHeader>
    <!-- 内嵌模式（配置中心 → 模型管理）：外层已有页头，这里只保留那排操作 -->
    <div v-else-if="canWrite" class="mw-toolbar">
      <ModelsBatchActions
        :multi-select="multiSelect"
        :selected-count="selectedProviders.length"
        :deleting="batchDeleting"
        @start="multiSelect = true"
        @cancel="exitMultiSelect"
        @remove="batchDeleteProviders"
      />
    </div>
    <div class="flex-1 min-h-0">
      <div class="models-workspace h-full flex">
        <!-- 左侧：供应商导航 -->
        <aside class="mw-aside">
          <div class="mw-aside-head">
            <span class="mw-aside-title">{{ t('settings.models.providers') }}</span>
            <button v-if="canWrite" class="mw-round" :title="t('settings.models.addCustom')" @click="handleCreate">
              <el-icon :size="18"><AddOutlined /></el-icon>
            </button>
          </div>

          <ul class="mw-list">
            <li
              v-for="p in providers"
              :key="p.id"
              class="mw-item"
              :class="{ active: p.id === currentProviderId, selected: multiSelect && isSelected(p) }"
              @click="multiSelect ? toggleSelectProvider(p) : selectProvider(p)"
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
                  v-if="canWrite && p.id !== 'agent' && p.id !== 'onnx'"
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

          <button v-if="canWrite" class="mw-store" @click="openCatalog">
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
            :can-write="canWrite"
            @changed="reload"
            @edit-provider="handleEditProvider"
            @delete-provider="handleDeleteProvider(currentProvider)"
          />
          <div v-else class="mw-main-empty">
            <div class="mw-empty-icon">
              <el-icon :size="30"><CloudOutlined /></el-icon>
            </div>
            <!-- 空状态文案按权限分岔：非管理员没有「添加」这条路可走，
                 继续提示「从模板库一键添加」只会让人找不到入口 -->
            <template v-if="canWrite">
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
            </template>
            <template v-else>
              <p class="mw-empty-title">暂无供应商</p>
              <p class="mw-empty-desc">供应商由管理员配置，配置好后会出现在这里</p>
            </template>
          </div>
        </main>
      </div>
    </div>

    <!-- 弹窗 -->
    <ProviderFormDialog ref="formRef" @saved="handleSaved" @back="openCatalog" @goToChannelManagement="handleGoToChannelManagement" />
    <TemplateCatalogDialog ref="catalogRef" :templates="availableTemplates" @select="handleTemplateClick" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AddOutlined, CloudOutlined, StorefrontOutlined, DeleteOutlined } from '@vicons/material'
import PageHeader from '@/components/PageHeader.vue'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import ModelsProviderDetail from './ModelsProviderDetail.vue'
import ModelsBatchActions from './ModelsBatchActions.vue'
import ProviderFormDialog from './ProviderFormDialog.vue'
import TemplateCatalogDialog from './TemplateCatalogDialog.vue'
import { apiService } from '../../services/ApiService'
import { adminApi } from '@/framework/context'
import { message, isAdmin } from '@repo/core'
import { usePopup } from '../../composables/usePopup'
import { PROVIDER_TEMPLATES } from './model.constants'
import ProviderLogo from './ProviderLogo.vue'
import { mapProvider, mapModel } from './model.utils'

const { t } = useI18n()
const router = useRouter()
const { confirm } = usePopup()

/**
 * 是否作为「配置中心 → 模型管理」的内嵌块渲染。
 *
 * <p>true 时交出页头（外层 SystemSettings 已有 PageHeader 与标题），
 * 只保留「多选 / 删除供应商」这排操作，成为一个纯工作区。
 * 两个入口因此共用**同一份实现**：主页 /models 是 embedded=false 的整页，
 * 配置中心里是 embedded=true 的工作区，不各写一套。</p>
 */
withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false })

const providers = ref<any[]>([])
const models = ref<any[]>([])
const modelPresets = ref<any[]>([])
const currentProviderId = ref<string | null>(null)
const formRef = ref<any>(null)
const catalogRef = ref<any>(null)

/** 供应商行多选/批量删除 */
const multiSelect = ref(false)
const selectedProviders = ref<any[]>([])
const batchDeleting = ref(false)

/**
 * 写操作是否可用（新增 / 编辑 / 删除供应商与模型、拉模型、同步价格）。
 *
 * <p>模型管理对所有登录用户开放（读供应商与模型目录），但写接口在服务端逐条
 * {@code @Permission("admin")}。此前这两种口径打架：普通用户能进页面，看到一排
 * 按钮，点了必然 403 —— 用户只会认为「功能坏了」，看不出是没有权限。</p>
 *
 * <p>所以在页面上按真实权限渲染：非管理员进入后是**只读**视图（看不见写按钮），
 * 不再提供「点了就报错」的入口。服务端的权限判断保持不变 —— 前端这一层只是
 * 提前把不可能成功的操作从界面上撤掉，不承担任何安全职责。</p>
 *
 * <p>用 ref 而不是常量：登录后角色是异步写入用户信息的（见 stores/auth.ts），
 * setup 时读一次可能还是空角色，管理员会看到只读视图；onMounted 再取一次。</p>
 */
const canWrite = ref(isAdmin())

const isSelected = (p: any) => selectedProviders.value.some((x: any) => x.id === p.id)

const toggleSelectProvider = (p: any) => {
  const idx = selectedProviders.value.findIndex((x: any) => x.id === p.id)
  if (idx > -1) selectedProviders.value.splice(idx, 1)
  else selectedProviders.value.push(p)
}

const exitMultiSelect = () => {
  multiSelect.value = false
  selectedProviders.value = []
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
    await apiService.deleteProvider(p.id)
    message.success(`供应商「${p.name}」已删除`)
    if (currentProviderId.value === p.id) currentProviderId.value = null
    await reload()
  } catch (e: any) {
    console.error('删除供应商失败:', e)
    message.error(e?.message || '请稍后重试')
  }
}

// 批量删除供应商（级联删除其模型与连接，后端整批拦截）
const batchDeleteProviders = async () => {
  const ids = selectedProviders.value.map((p: any) => p.id).filter((s: any) => s)
  if (!ids.length) return
  const ok = await confirm(
    '批量删除供应商',
    `确定删除所选 ${ids.length} 个供应商吗？它们每个下的模型与连接配置将一并删除，删除后不可恢复。`,
    { type: 'error', confirmText: '删除' },
  )
  if (!ok) return
  batchDeleting.value = true
  try {
    const res: any = await apiService.batchDeleteProviders(ids)
    const deleted = res?.deletedCount ?? res?.data?.deletedCount ?? ids.length
    if (deleted > 0) message.success(`已删除 ${deleted} 个供应商`)
    else message.error(res?.data?.msg || '删除失败')
    await reload()
    exitMultiSelect()
  } catch (e: any) {
    console.error('批量删除供应商失败:', e)
    message.error(e?.message || '删除失败')
  } finally {
    batchDeleting.value = false
  }
}

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

// 可添加模板：过滤已添加类型。
// 路由组例外：同一平台允许建多个不同策略的组（后端对 router-group 不做平台+名称判重），
// 因此不按品牌去重，始终保留，用户可创建「主力组 / 备用组」等多个路由组。
const availableTemplates = computed(() => {
  const added = new Set(providers.value.map((p) => p.provider))
  return PROVIDER_TEMPLATES.filter((tpl) => tpl.id === 'router-group' || !added.has(tpl.id))
})

const selectProvider = (p: any) => {
  currentProviderId.value = p.id
}
const handleCreate = () => formRef.value.openCreate()
const openCatalog = () => catalogRef.value.open()

const handleEditProvider = () => {
  if (currentProvider.value) formRef.value.openEdit(currentProvider.value)
}

const handleTemplateClick = (template: any) => formRef.value.openFromTemplate(template)

const handleSaved = async () => {
  await reload()
}

// 账号渠道 provider 表单内「前往渠道管理页绑定账号」的跳转入口
const handleGoToChannelManagement = () => {
  router.push({ name: 'SystemSettings', params: { tab: 'channels' } })
}

onMounted(async () => {
  // 角色可能在上一次渲染后才补齐（登录流程异步写用户信息），进入页面时再确认一次权限
  canWrite.value = isAdmin()
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
  border-right: 1px solid var(--border-subtle, var(--color-surface-border));
  background: var(--color-surface);
}
.mw-aside-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px 10px;
}
.mw-aside-title {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--color-text-gray);
}
.mw-round {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius-md, 8px);
  color: var(--color-text-gray);
  background: var(--bg-fill, var(--color-surface-border));
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}
.mw-round:hover { color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 12%, transparent); }

.mw-list {
  list-style: none;
  margin: 0;
  padding: 0 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mw-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 9px;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease;
}
.mw-item:hover { background: var(--bg-hover, var(--color-surface-border)); }
/* 选中态：淡主色胶囊 + 左内侧一条主色线。
   不用整块深色填充 —— 侧栏有多个供应商时，深填充会让整列显得很重。 */
.mw-item.active {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  box-shadow: inset 2px 0 0 var(--color-primary);
}
.mw-item-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.mw-item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mw-item.active .mw-item-name { color: var(--color-primary); }
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
  margin: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border-default, var(--el-border-color-lighter));
  border-radius: var(--radius-lg, 12px);
  color: var(--color-text-gray);
  background: var(--color-surface);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
.mw-store:hover {
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 42%, var(--border-default, var(--el-border-color-lighter)));
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
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
.mw-main { flex: 1; min-width: 0; background: var(--color-surface); }
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

/* 多选模式下供应商项的勾选态 */
.mw-item.selected {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-surface-border));
}
.mw-item.selected .mw-item-name { color: var(--color-primary); }

/* 内嵌模式（配置中心 → 模型管理）的操作条：只放那排批删按钮，右对齐一行 */
.mw-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 8px 18px;
  border-bottom: 1px solid var(--color-surface-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

/* 全局配置弹窗：左侧说明 + 右侧开关 */
.gg-row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 4px 2px 8px;
}
.gg-text { flex: 1; min-width: 0; }
.gg-title { font-size: 14px; font-weight: 600; color: var(--color-text); }
.gg-desc {
  margin-top: 6px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--color-text-gray);
}
.gg-row .el-switch { flex-shrink: 0; margin-top: 2px; }

/* 动效降级 */
@media (prefers-reduced-motion: reduce) {
  .mw-round,
  .mw-item,
  .mw-item-status,
  .mw-item-del,
  .mw-store { transition: none; }
}
</style>

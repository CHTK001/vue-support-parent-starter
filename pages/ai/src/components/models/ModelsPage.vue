<template>
  <div class="h-full overflow-hidden flex flex-col" data-page="models">
    <!--
      页头：独立路由（/models）渲染完整 PageHeader；嵌入到配置中心时（embedded=true）
      交出标题与窗口控制，只保留供应商批量删除这排操作 —— 外层已经有页头，
      再来一个就是同一条标题栏画两遍。
    -->
    <PageHeader v-if="!embedded" :title="t('settings.models.title')">
      <template #actions>
        <!-- 供应商批量删除：勾选左侧供应商行后自动出现（不再有「多选」入口）。
             canWrite=false（非管理员）时整排不渲染：批量删除是 admin-only 接口。 -->
        <ModelsBatchActions
          v-if="canWrite"
          :selected-count="selectedProviders.length"
          :deleting="batchDeleting"
          @cancel="clearProviderSelection"
          @remove="batchDeleteProviders"
        />
      </template>
    </PageHeader>
    <!-- 内嵌模式（配置中心 → 模型管理）：外层已有页头，这里只保留那排操作；
         未选供应商时整条不渲染，避免留一条空操作条 -->
    <div v-else-if="canWrite && selectedProviders.length > 0" class="mw-toolbar">
      <ModelsBatchActions
        :selected-count="selectedProviders.length"
        :deleting="batchDeleting"
        @cancel="clearProviderSelection"
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

          <!--
            供应商搜索：供应商一多靠滚动找太慢。
            匹配名称 / 标识 / 平台三处——用户可能记得的是「doubao」而不是中文名。
          -->
          <div class="mw-aside-search">
            <el-input
              v-model="providerSearch"
              size="small"
              clearable
              placeholder="搜索供应商"
            >
              <template #prefix>
                <el-icon :size="13"><SearchOutlined /></el-icon>
              </template>
            </el-input>
          </div>

          <ul class="mw-list">
            <template v-for="group in visibleProviderGroups" :key="group.vendor">
            <!-- 多渠道厂商：先给一行厂商组头（可折叠），组内子菜单列各接入点；
                 单渠道供应商不生成组头，保持原样平铺，避免列表行数凭空翻倍 -->
            <li
              v-if="group.multi"
              class="mw-group-head"
              :class="{ open: isGroupOpen(group.vendor) }"
              tabindex="0"
              role="button"
              :aria-expanded="isGroupOpen(group.vendor)"
              :title="`展开/收起「${group.vendor}」的 ${group.providers.length} 个接入点`"
              @click="toggleGroup(group.vendor)"
              @keydown.enter.prevent="toggleGroup(group.vendor)"
            >
              <el-icon class="mw-group-caret" :size="14"><ExpandMoreOutlined /></el-icon>
              <span class="mw-group-name">{{ group.vendor }}</span>
              <span class="mw-group-count">{{ group.providers.length }}</span>
            </li>
            <template v-if="!group.multi || isGroupOpen(group.vendor)">
            <li
              v-for="p in group.providers"
              :key="p.id"
              class="mw-item"
              :class="{ 'is-child': group.multi, active: p.id === currentProviderId, selected: isSelected(p) }"
              tabindex="0"
              role="button"
              @click="selectProvider(p)"
              @keydown.enter.prevent="selectProvider(p)"
            >
              <div class="mw-item-row">
                <!-- 供应商勾选框：平时隐形（保留占位，避免悬停时整行左右跳），
                     悬停或已选中时显形；勾中任何一个后页头那排批删操作自动出现。 -->
                <span v-if="canWrite" class="mw-item-check" @click.stop>
                  <el-checkbox
                    :model-value="isSelected(p)"
                    :title="isSelected(p) ? '取消选择' : '选择该供应商'"
                    @change="toggleSelectProvider(p)"
                  />
                </span>
                <ProviderLogo :pid="getProviderIcon(p)" :name="p.name" size="md" />
                <div class="mw-item-text">
                  <span class="mw-item-name">{{ p.name }}</span>
                  <!-- 一条模型都没有：提示独占一行，不跟计数挤在一起；
                       右侧空状态里还有「从上游获取」入口。 -->
                  <span v-if="(p.models?.length || 0) === 0" class="mw-item-hint">待获取</span>
                  <!-- 有模型：一行模型名摘要（超出省略，title 给全量）。
                       启用数量与进度不再挤在这里 —— 挪到卡片右侧的竖向汇总，
                       与「余额」共用同一块位置，一屏只读一处结论。 -->
                  <span
                    v-else
                    class="mw-item-models"
                    :title="modelNamesOf(p).join('、')"
                  >
                    {{ modelNamesOf(p).join(' · ') }}
                  </span>
                  <!--
                    能力构成：这个供应商到底能干什么，一眼可见（文/图/视/音 + 各自条数）。
                    渠道覆盖 chat + image 之后，用户不用点进去才知道有没有出图模型。
                  -->
                  <span v-if="capsOf(p).length" class="mw-item-caps">
                    <span
                      v-for="c in capsOf(p)"
                      :key="c.key"
                      class="mw-cap"
                      :class="'kind-' + c.key"
                      :title="`${c.label} ${c.n} 个`"
                    >
                      <el-icon :size="11"><component :is="c.icon" /></el-icon>
                      <span class="mw-cap-n">{{ c.n }}</span>
                    </span>
                  </span>
                </div>
                <!--
                  卡片右侧汇总：标签/数值两行 + 竖向细条，贴在状态点左边。
                  有余额报余额与剩余占比（主色条），没有余额报启用模型数
                  与启用占比（绿色条）；一屏只读一处结论，卡片高度也不再变。
                -->
                <span
                  class="mw-item-stat"
                  :class="{ 'is-credit': cardStat(p).credit }"
                  :title="cardStat(p).title"
                >
                  <span class="mw-item-stat-text">
                    <span class="mw-item-stat-k">{{ cardStat(p).label }}</span>
                    <span class="mw-item-stat-v">{{ cardStat(p).value }}</span>
                  </span>
                  <span class="mw-item-stat-gauge" aria-hidden="true">
                    <i :style="{ height: cardStat(p).percent + '%' }"></i>
                  </span>
                </span>
                <!-- 余额低量告警：后端按 extra.credit_warn_threshold 判定，触发时行内透出；
                     阈值与当前余额的精确值在悬浮提示里，明细看右侧余额面板 -->
                <span
                  v-if="creditOf(p).warn?.triggered"
                  class="mw-item-warn"
                  :title="creditWarnTitle(p)"
                >低于阈值</span>
                <span class="mw-item-tail">
                  <span class="mw-item-status" :class="enabledOf(p) > 0 ? 'on' : 'off'"></span>
                  <button
                    v-if="canWrite && p.id !== 'agent'"
                    class="mw-item-del"
                    type="button"
                    title="删除供应商"
                    @click.stop="handleDeleteProvider(p)"
                  >
                    <el-icon :size="15"><DeleteOutlined /></el-icon>
                  </button>
                </span>
              </div>
            </li>
            </template>
            </template>
            <li v-if="providers.length === 0" class="mw-list-empty">
              暂无供应商，请从模板库添加
            </li>
            <li v-else-if="visibleProviders.length === 0" class="mw-list-empty">
              没有匹配「{{ providerSearch }}」的供应商
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
            :refresh-tick="creditRefreshTick"
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AddOutlined, CloudOutlined, StorefrontOutlined, DeleteOutlined, SearchOutlined, ExpandMoreOutlined } from '@vicons/material'
import {
  TextT24Regular, Image24Regular, Video24Regular, Speaker224Regular,
} from '@vicons/fluent'
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
import { PROVIDER_TEMPLATES, sortTemplatesByHot, resolveVendorName } from './model.constants'
import ProviderLogo from './ProviderLogo.vue'
import { mapProvider, mapModel, inferModelType } from './model.utils'

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

/** 供应商批量删除（勾选供应商行后，页头那排批删操作自动出现） */
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

const clearProviderSelection = () => {
  selectedProviders.value = []
}

// 删除供应商（后端级联删除模型与连接）
// ONNX 供应商由用户自己添加（platform=onnx），因此和其它供应商一样可删；
// 只有内置的 Agent 供应商不能删。
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
    clearProviderSelection()
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

/**
 * 供应商的模型名清单（左栏摘要用）。
 *
 * <p>只做展示：一行放不下由 CSS 省略，完整清单在 title 里；
 * 因此这里返回全量，不做截断。</p>
 *
 * @param p 供应商对象
 * @returns 模型名数组；无模型返回空数组
 */
const modelNamesOf = (p: any): string[] =>
  (Array.isArray(p?.models) ? p.models : [])
    .map((m: any) => String(m?.modelName || m?.model || '').trim())
    .filter(Boolean)

/**
 * 启用占比（0-100）：左栏进度条的长度。
 *
 * <p>分母是该供应商的全部模型（含停用），分子是已启用数——
 * 「开启了总量的多少」是用户在这里唯一想知道的结论。</p>
 *
 * @param p 供应商对象
 * @returns 百分比整数；无模型时为 0
 */
const enablePercentOf = (p: any): number => {
  const total = Array.isArray(p?.models) ? p.models.length : 0
  return total > 0 ? Math.round((enabledOf(p) / total) * 100) : 0
}

/** 左栏供应商搜索词（匹配名称 / 标识 / 平台） */
const providerSearch = ref('')

/**
 * 当前搜索命中的供应商。
 *
 * <p>没有搜索词时原样返回，保持后端给的顺序；搜索只做本地过滤，
 * 不重新请求 `/api/providers`（供应商数量是一屏级别，本地过滤足够）。</p>
 */
const visibleProviders = computed(() => {
  const keyword = providerSearch.value.trim().toLowerCase()
  if (!keyword) return providers.value
  return providers.value.filter((p: any) => [p.name, p.id, p.provider, p.rawPlatform]
    .some((field) => String(field ?? '').toLowerCase().includes(keyword)))
})

/**
 * 左栏厂商分组：同一厂商的多个接入点/套餐合并为一个可折叠条目。
 *
 * <p>只对「多渠道」厂商生成组头（单渠道供应商保持原样平铺，避免列表凭空多一倍行数）；
 * 分组只是展示组织 —— 勾选、删除、选中仍按供应商行逐条操作，不改任何数据口径。
 * 组的顺序沿用供应商列表的原有顺序（后端返回序 + 热门序），不做二次重排。</p>
 */
interface ProviderGroup {
  vendor: string
  providers: any[]
  multi: boolean
}

/** 收起的厂商组（整组折叠，只藏组内接入点，组头仍在） */
const collapsedVendors = ref<Set<string>>(new Set())

const visibleProviderGroups = computed<ProviderGroup[]>(() => {
  const groups: ProviderGroup[] = []
  const index = new Map<string, ProviderGroup>()
  for (const p of visibleProviders.value) {
    const vendor = resolveVendorName(p)
    let group = index.get(vendor)
    if (!group) {
      group = { vendor, providers: [], multi: false }
      index.set(vendor, group)
      groups.push(group)
    }
    group.providers.push(p)
  }
  for (const group of groups) group.multi = group.providers.length > 1
  return groups
})

const isGroupOpen = (vendor: string) => !collapsedVendors.value.has(vendor)

const toggleGroup = (vendor: string) => {
  const next = new Set(collapsedVendors.value)
  if (next.has(vendor)) next.delete(vendor)
  else next.add(vendor)
  collapsedVendors.value = next
}

// 搜索时自动展开全部厂商组：过滤后的结果本来就少，再折叠会让人以为丢了内容
watch(providerSearch, (keyword) => {
  if (keyword.trim()) collapsedVendors.value = new Set()
})

/** 能力徽标定义：顺序即展示顺序（文本 → 图片 → 视频 → 音频） */
const CAP_DEFS = [
  { key: 'text', label: '文本', icon: TextT24Regular },
  { key: 'image', label: '图片', icon: Image24Regular },
  { key: 'video', label: '视频', icon: Video24Regular },
  { key: 'audio', label: '音频', icon: Speaker224Regular },
]
/** 归到「音频」的模型类型（前端类型表里语音识别/合成是分开的） */
const AUDIO_TYPES = new Set(['audio', 'speech', 'tts', 'asr', 'voice', 'music'])
/** 不参与能力统计的类型：向量检索类模型对「这个渠道能干什么」没有解释力 */
const NON_CAP_TYPES = new Set(['embedding', 'rerank', 'vector'])

/**
 * 把模型类型折叠成四类能力之一。
 *
 * @param modelType 规范模型类型
 * @returns 能力 key；不参与统计时返回空串
 */
const capKeyOf = (modelType: string): string => {
  const type = String(modelType || '').toLowerCase()
  if (!type) return 'text'
  if (NON_CAP_TYPES.has(type)) return ''
  if (AUDIO_TYPES.has(type)) return 'audio'
  if (type === 'video') return 'video'
  if (type === 'image' || type === 'image_cv' || type === 'ocr' || type === 'detection' || type === 'face' || type === 'layout') {
    return 'image'
  }
  return 'text'
}

/**
 * 供应商的能力构成（每类模型各有多少条）。
 *
 * <p>渠道管理把 chat 与 image 模型放在同一个供应商下，只看「N 模型」无法回答
 * 「这个渠道能不能出图」；这里按模型类型折叠成文/图/视/音四类计数，
 * 左栏一行就能看出供应商覆盖了几种能力。</p>
 *
 * @param p 供应商对象
 * @returns 有模型的能力项（含条数），按固定顺序排列
 */
/**
 * 模型行声明的任务类型（顶层 tasks 或渠道落库的 metrics.tasks）。
 *
 * @param m 模型行
 * @returns 小写任务类型列表
 */
const tasksOf = (m: any): string[] => {
  const out: string[] = []
  for (const source of [m?.tasks, m?.metrics?.tasks]) {
    if (!Array.isArray(source)) continue
    for (const t of source) {
      const key = String(t ?? '').trim().toLowerCase()
      if (key && !out.includes(key)) out.push(key)
    }
  }
  return out
}

const capsOf = (p: any) => {
  const counts = new Map<string, number>()
  for (const m of (Array.isArray(p?.models) ? p.models : [])) {
    // 3D 模型（model_3d）在四类能力里没有位置，类型表也认不出它；
    // 硬算会把 Forge 这类图生 3D 渠道标成「文本」渠道，宁可不计入。
    if (tasksOf(m).includes('model_3d')) continue
    const key = capKeyOf(inferModelType(m))
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return CAP_DEFS
    .filter((def) => counts.get(def.key))
    .map((def) => ({ ...def, n: counts.get(def.key) ?? 0 }))
}

// 加载供应商与模型
const reload = async () => {
  try {
    // 与 model.api.ts fetchModels 同口径：显式 enabled_only=0 取全量，
    // 模型管理页要看到停用行才能重新开启（接口缺省只返回已开启的模型）
    const body = await adminApi.get('/api/providers?enabled_only=0')
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

/**
 * 卡片底部汇总是否该查余额：与详情页余额条同一判定。
 *
 * <p>本地推理（ONNX / ollama / web 浏览器推理）、路由组没有可查的上游余额；非管理员调
 * /credit 会 403。其余只要配了上游地址（或显式 credit_url）才查。</p>
 *
 * @param p 供应商对象
 * @returns 需要查余额时为 true
 */
const creditQueryable = (p: any): boolean => {
  if (!p || !canWrite.value) return false
  const plat = String(p.rawPlatform || '').toLowerCase()
  if (plat === 'router-group' || plat === 'onnx' || plat === 'ollama' || plat === 'agent' || plat === 'web') return false
  return !!(String(p.apiUrl || '').trim() || String(p.extra?.credit_url || '').trim())
}

/** 一个供应商的原始余额读数（remain=null 表示没有可展示的余额） */
type CreditReading = {
  remain: number | null
  total: number | null
  currency: string
  /** 余额低量告警判定（后端按 extra.credit_warn_threshold 在实时回源路径返回） */
  warn?: { threshold?: number | string; remain?: number | string; triggered?: boolean } | null
}

/** 币种码 -> 符号；未收录的币种原样带码显示，不猜符号 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥', RMB: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥', HKD: 'HK$',
}

/** 空值安全的数字转换：'12.3' / 12.3 都收，'' / null / 非数字返回 null */
const numOrNull = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** 余额读数按供应商 id 存放：每张卡片各报各的，不共用「当前选中」那一份 */
const creditMap = ref<Record<string, CreditReading>>({})

/**
 * 把余额读数转成展示文案 / 剩余占比 / 悬浮说明。
 *
 * <p>后端 total 可能是空（上游只给余额不给额度），此时只报金额、不画占比条，
 * 避免用「余额 / 0」算出假的 100%。金额格式与详情页余额条一致。</p>
 */
function toCreditView(st: CreditReading) {
  if (st.remain === null) {
    return {
      remain: null as number | null,
      text: '',
      short: '',
      percent: null as number | null,
      title: '',
      warn: null as CreditReading['warn'],
    }
  }
  const code = String(st.currency || '').toUpperCase()
  const symbol = CURRENCY_SYMBOLS[code]
  const abs = Math.abs(st.remain)
  const amount = abs >= 1000
    ? Math.round(abs).toLocaleString('zh-CN')
    : (Math.round(abs * 100) / 100).toFixed(2)
  // 已知币种写成 -¥0.10；上游自定义单位（如「墨点」）写成 56,259 墨点，
  // 不硬造符号，也不把单位塞到数字前面；负数把负号提到最前。
  const body = symbol ? `${symbol}${amount}` : code ? `${amount} ${code}` : amount
  const text = `${st.remain < 0 ? '-' : ''}${body}`
  // 卡片左侧那个窄列放不下 4 位以上金额：大额压成「5.6万 / 1亿」。
  // 单位不能丢 —— 已知币种仍用符号前缀（$1亿），上游自定义单位跟在
  // 数字后面（5.6万墨点）；精确金额与占比留在悬浮提示里。
  const compact = compactAmount(abs)
  const shortBody = symbol
    ? `${symbol}${compact}`
    : !code
      ? compact
      : /^[\u4e00-\u9fa5]+$/.test(code)
        ? `${compact}${code}`
        : `${compact} ${code}`
  const short = `${st.remain < 0 ? '-' : ''}${shortBody}`
  const percent = st.total && st.total > 0
    ? Math.max(0, Math.min(100, Math.round((st.remain / st.total) * 100)))
    : null
  return {
    remain: st.remain,
    text,
    short,
    percent,
    warn: st.warn ?? null,
    title: percent === null
      ? `剩余余额 ${text}（上游未给额度，无法算占比）`
      : `剩余 ${text}，占总额度 ${percent}%`,
  }
}

/**
 * 万 / 亿 级金额压缩成短标签。
 *
 * @param abs 金额绝对值
 * @returns 如 5.6万、1亿、100万、999、12.34
 */
function compactAmount(abs: number): string {
  /** 最多一位小数，整数不带 .0 */
  const trim1 = (n: number): string => {
    const s = n.toFixed(1)
    return s.endsWith('.0') ? s.slice(0, -2) : s
  }
  if (abs >= 1e8) return `${trim1(abs / 1e8)}亿`
  if (abs >= 1e4) {
    // 9999.6万 这种会被四舍五入成 1 万万的写法，直接进位到「亿」
    if (abs >= 9999.5e4) return `${trim1(abs / 1e8)}亿`
    return `${trim1(abs / 1e4)}万`
  }
  if (abs >= 100) return Math.round(abs).toLocaleString('zh-CN')
  return (Math.round(abs * 100) / 100).toFixed(2)
}

/** 没有读数时的统一空值（同一引用，避免每张卡片各建一个） */
const NO_CREDIT = Object.freeze(toCreditView({ remain: null, total: null, currency: '' }))

/** 渲染用的余额视图表：卡片按 id 取，不在模板里反复格式化数字 */
const creditViews = computed(() => {
  const out: Record<string, ReturnType<typeof toCreditView>> = {}
  for (const [key, st] of Object.entries(creditMap.value)) out[key] = toCreditView(st)
  return out
})

/**
 * 取某个供应商的余额视图。
 *
 * @param p 供应商对象
 * @returns 余额视图；没有读数时为 {@link NO_CREDIT}
 */
const creditOf = (p: any) => creditViews.value[String(p?.providerId || p?.id || '')] || NO_CREDIT

/**
 * 行内「低于阈值」徽标的悬浮说明：给全量数字，避免窄列省略号误读。
 *
 * @param p 供应商对象
 * @returns 告警说明文案
 */
const creditWarnTitle = (p: any): string => {
  const warn: any = creditOf(p).warn || {}
  return `当前余额 ${warn.remain ?? '—'} 已低于告警阈值 ${warn.threshold ?? '—'}，请及时充值或调整阈值`
}

/**
 * 卡片左侧汇总的读数：查到余额报余额，没有余额报启用模型数。
 *
 * @param p 供应商对象
 * @returns 标签 / 数值 / 竖向条高度（0~100）/ 悬浮说明
 */
const cardStat = (p: any) => {
  const c = creditOf(p)
  if (c.remain !== null) {
    return {
      credit: true,
      label: '余额',
      value: c.short,
      percent: c.percent ?? 0,
      title: c.title,
    }
  }
  const total = p?.models?.length || 0
  return {
    credit: false,
    label: '启用',
    value: `${enabledOf(p)}/${total}`,
    percent: enablePercentOf(p),
    title: `已启用 ${enabledOf(p)} / ${total}`,
  }
}

/** 已排队 / 正在查的供应商 id：重复 reload 不重复出网 */
const creditPending = new Set<string>()
const creditQueue: any[] = []
let creditActive = 0
/** 并发上限：/credit 会真出网探测上游计费页（后端 5 分钟内命中缓存），一次最多 3 个 */
const CREDIT_CONCURRENCY = 3

/**
 * 查一个供应商的余额并写入读数表。
 *
 * <p>查不到（ok=false / 上游 302 / 没有余额字段）就不写 —— 卡片继续显示
 * 启用模型汇总，绝不把占位 0 当成「余额 0.00」。</p>
 *
 * @param p 供应商对象
 */
async function loadCredit(p: any) {
  const key = String(p?.providerId || p?.id || '')
  if (!key || !creditQueryable(p)) return
  try {
    const res: any = await adminApi.get(`/api/providers/${encodeURIComponent(key)}/credit`)
    const data = res?.data ?? res
    // 后端 ok=false 表示这次没查成（上游 302 / 计费页解析失败 / 超时），
    // total 里那对 0 只是占位，不能当「余额 0.00」展示。
    const queried = data?.ok !== false
    let remain = queried ? numOrNull(data?.total?.remain) : null
    let total = queried ? numOrNull(data?.total?.total) : null
    let currency = String(data?.currency || '')
    if (remain === null && Array.isArray(data?.keys)) {
      // 单个 Key 的读数（多 Key 渠道汇总）：只合计查成功且有余额的行
      const okRows = data.keys.filter((k: any) => k && k.ok === true && numOrNull(k?.remain) !== null)
      if (okRows.length) {
        remain = okRows.reduce((sum: number, k: any) => sum + (numOrNull(k.remain) as number), 0)
        currency = currency || String(okRows[0]?.currency || '')
        if (total === null) total = numOrNull(okRows[0]?.total)
      }
    }
    if (remain === null) return
    creditMap.value = { ...creditMap.value, [key]: { remain, total, currency, warn: data?.warn ?? null } }
  } catch {
    // 单张卡片查不到余额不是页面错误：它继续显示启用模型汇总
  }
}

/** 排队 + 限流：避免一屏十几张卡片同时向上游发起计费查询 */
function queueCredit(p: any) {
  const key = String(p?.providerId || p?.id || '')
  if (!key || creditMap.value[key] || creditPending.has(key)) return
  creditPending.add(key)
  creditQueue.push(p)
  pumpCreditQueue()
}

/** 维持最多 {@link CREDIT_CONCURRENCY} 个余额请求在飞 */
function pumpCreditQueue() {
  while (creditActive < CREDIT_CONCURRENCY && creditQueue.length > 0) {
    const p = creditQueue.shift()
    creditActive += 1
    void loadCredit(p).finally(() => {
      creditActive -= 1
      creditPending.delete(String(p?.providerId || p?.id || ''))
      pumpCreditQueue()
    })
  }
}

// 供应商列表就绪 / 刷新后，给每张卡片补一次余额读数（后端 5 分钟内命中缓存）
watch(() => providers.value, (list) => {
  for (const p of list) if (creditQueryable(p)) queueCredit(p)
}, { immediate: true })

// 可添加模板：过滤已添加类型，热门供应商置顶（顺序见 HOT_PROVIDER_IDS）。
// 路由组例外：同一平台允许建多个不同策略的组（后端对 router-group 不做平台+名称判重），
// 因此不按品牌去重，始终保留，用户可创建「主力组 / 备用组」等多个路由组。
const availableTemplates = computed(() => {
  const added = new Set(providers.value.map((p) => p.provider))
  return sortTemplatesByHot(PROVIDER_TEMPLATES.filter((tpl) => tpl.id === 'router-group' || !added.has(tpl.id)))
})

const selectProvider = (p: any) => {
  currentProviderId.value = p.id
}
const handleCreate = () => formRef.value.openCreate()
const openCatalog = () => catalogRef.value.open()

const handleEditProvider = (opts?: { focusSection?: 'balance' }) => {
  if (currentProvider.value) formRef.value.openEdit(currentProvider.value, opts)
}

const handleTemplateClick = (template: any) => formRef.value.openFromTemplate(template)

// 供应商保存成功后递增，驱动余额面板强制重拉（改了密钥/口径/告警阈值后立即生效）
const creditRefreshTick = ref(0)

const handleSaved = async () => {
  await reload()
  creditRefreshTick.value++
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
/* 工作区：页面底色 + 两栏各一张卡片。
   以前两栏直接铺满内容区、底色与页面同值（都是 #fff），整页连成一片白，
   卡片、边框、投影全部看不出来（用户反馈「像没有样式」）。
   这里让页面底色露出来，左右两栏各自成为一张带描边与投影的卡片。 */
.models-workspace {
  gap: 12px;
  padding: 12px;
  background: var(--bg-page, var(--color-bg));
}

/* 左侧栏 */
.mw-aside {
  display: flex;
  flex-direction: column;
  /* 卡片右侧多了一列「竖向汇总」（细条 + 两行文字），需要比原来宽：
     320px 起步，宽屏按 22vw 放宽到 360px，名称不被挤成省略号；
     更窄的窗口维持 320px，优先保证右侧工作区可用。 */
  width: clamp(320px, 22vw, 360px);
  flex-shrink: 0;
  border: 1px solid var(--border-subtle, var(--color-surface-border));
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  background: var(--color-surface);
  overflow: hidden;
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
/* 供应商搜索：与列表左右内边距对齐，控件本身自带边框，不再加外框 */
.mw-aside-search { padding: 0 10px 8px; }
/* 一条模型都没有的供应商：提示独占一行（不与计数挤在一行），
   避免「0 模型 · 0 启用 待获取」挤成一串读不出重点 */
.mw-item-hint {
  align-self: flex-start;
  margin-top: 2px;
  padding: 0 5px;
  font-size: 10px;
  line-height: 15px;
  border-radius: 4px;
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
}
/* 模型名摘要：只占一行，超出省略；完整清单由 title 提供 */
.mw-item-models {
  margin-top: 2px;
  font-size: 11px;
  line-height: 15px;
  color: var(--color-text-gray);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 卡片右侧汇总：一条竖向细条 + 「标签 / 数值」两行，贴在状态点左边。
   竖向排是为了不占卡片高度：卡片仍是单行，图标与名称保持在同一基线。
   数值右对齐只能靠 justify-content: flex-end —— 前面的 .mw-item-text 是 flex: 1，
    已把剩余空间吃干，自由空间为 0 时 margin-left: auto 会算成 0，汇总块就贴在
    该列左边缘，金额长短不同便参差不齐。宽度固定 60px + 内容靠右才成一条竖线。
   有余额用主色条，没有余额用成功绿条（与启用占比同色）。 */
.mw-item-stat {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  flex-shrink: 0;
  width: 60px;
}
.mw-item-stat-gauge {
  position: relative;
  width: 3px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 2px;
  background: var(--bg-fill, var(--color-surface-border));
  overflow: hidden;
}
.mw-item-stat-gauge i {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  border-radius: 2px;
  background: var(--el-color-success);
  transition: height 0.2s ease;
}
/* 余额：读数是「还剩多少」，用主色区分于「启用占比」的成功绿 */
.mw-item-stat.is-credit .mw-item-stat-gauge i { background: var(--el-color-primary); }
/* 余额低量告警徽标：warning 色小胶囊，挤在汇总条与状态点之间；触发才出现 */
.mw-item-warn {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 9.5px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 45%, transparent);
  white-space: nowrap;
}
.mw-item-stat-text {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  min-width: 0;
  /* 数字列必须能收缩：否则超长金额会把图标和名称往左挤 */
  flex: 0 1 auto;
  overflow: hidden;
  text-align: right;
}
.mw-item-stat-k {
  font-size: 9.5px;
  line-height: 1.1;
  color: var(--color-text-disabled);
  white-space: nowrap;
}
.mw-item-stat-v {
  font-size: 11px;
  line-height: 1.1;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  /* 极端长单位（如 points）超出时省略，完整金额在 title 里 */
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 能力构成：文/图/视/音 + 条数，颜色与模型管理页的模态配色一致 */
.mw-item-caps {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
  flex-wrap: wrap;
}
.mw-cap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 14px;
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
.mw-cap-n { font-variant-numeric: tabular-nums; }
.mw-cap.kind-text { color: var(--el-color-primary); }
.mw-cap.kind-image { color: var(--el-color-warning); }
.mw-cap.kind-video { color: var(--el-color-danger); }
.mw-cap.kind-audio { color: var(--el-color-info); }

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
  /* 全局 tokens.css 的 `* { scrollbar-width: thin; scrollbar-color: ... }`
     会让 Chromium 忽略本应用自己那套 8px 经典滚动条（style.css / refactor.css
     的 ::-webkit-scrollbar 伪元素），退化成不占轨道、静止时几乎看不见的细覆盖条 ——
     供应商一多就像「内容被截断、没有滚动条」。这里把两个标准属性复位成 auto，
     让全局的经典滚动条样式重新生效；stable 预留轨道，避免供应商数量跨过
     一屏时列表宽度跳 8px。 */
  scrollbar-width: auto;
  scrollbar-color: auto;
  scrollbar-gutter: stable;
}
/* 卡片：勾选 / 图标 / 名称模型 / 右侧汇总 / 状态，全部在同一行。
   .mw-item-row 承担这一行的横向排版，卡片本身只管内边距。 */
.mw-item {
  display: flex;
  flex-direction: column;
  padding: 8px 9px;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease;
}
.mw-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
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

/* 供应商勾选框：平时隐形但保留 18px 占位，悬停 / 已选中 / 键盘聚焦时显形。
   保留占位是为了避免悬停时整行左右跳动。选中态不再依赖「多选模式」——
   勾中任意一个供应商，页头那排批删操作就自动接管（用户需求 4）。 */
.mw-item-check {
  width: 18px;
  height: 20px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.mw-item:hover .mw-item-check,
.mw-item.selected .mw-item-check,
.mw-item-check:focus-within { opacity: 1; }
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
/* 键盘焦点同样切换显隐（此前仅 hover 显形，键盘用户看不到删除入口） */
.mw-item:focus-visible .mw-item-status { opacity: 0; }
.mw-item:focus-visible .mw-item-del { opacity: 1; }
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
.mw-main {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--border-subtle, var(--color-surface-border));
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
  background: var(--color-surface);
  overflow: hidden;
}
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
  .mw-item-check,
  .mw-item-del,
  .mw-store {
    transition: none;
  }
}

/* 键盘焦点可见性：模型导航项是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 侧栏底色是令牌化的表面色，一档主色描边足够可见。
   .mw-item-del 平时 opacity: 0、在 .mw-item:hover / :focus-visible 时显形，
   键盘用户 Tab 聚焦导航项后同样能看到删除入口。 */
.mw-item {
  outline: none;
}

.mw-item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 厂商分组头：同一厂商的多个接入点合并为一行，可折叠。
   组头用小号次级文字 + 计数徽标，视觉上比供应商行低一档，
   让「厂商 → 接入点」的层级一眼可读；折叠箭头向右=收起、向下=展开。 */
.mw-group-head {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  padding: 5px 6px;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  user-select: none;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-gray);
  transition: background 0.15s ease, color 0.15s ease;
}
.mw-group-head:hover {
  color: var(--color-text);
  background: var(--bg-hover, var(--color-surface-border));
}
.mw-group-head:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  outline: none;
}
.mw-group-caret {
  flex-shrink: 0;
  opacity: 0.7;
  transform: rotate(-90deg);
  transition: transform 0.15s ease;
}
.mw-group-head.open .mw-group-caret { transform: rotate(0deg); }
.mw-group-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.02em;
}
.mw-group-count {
  flex-shrink: 0;
  font-size: 10px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: var(--el-border-radius-round, 999px);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  font-weight: 600;
}
/* 组内接入点行：向右缩进，落在厂商组头下方 */
.mw-item.is-child { padding-left: 25px; }

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

/* 供应商项的勾选态（勾中页头批删操作即接管） */
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
  .mw-item-check,
  .mw-item-del,
  .mw-store { transition: none; }
}
</style>

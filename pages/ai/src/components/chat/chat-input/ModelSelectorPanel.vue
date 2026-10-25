<template>
  <!-- 探索稿：?variant=catalog|briefing|terminal|aurora|ledger 时渲染变体容器 + 右下角浮动切换器。
       Phase 3 选定后删除本块与 ModelSelectorPanel.variants/ 目录。 -->
  <div v-if="explorationMode" class="mvp" :class="[`mvp--${variant}`, { 'mvp--inline': inlineStage }]">
    <div class="mvp__stage">
      <component :is="variantComponent" :key="variant" />
    </div>
    <VariantSwitcher :current="variant" />
  </div>

  <CustomPopover v-else :show="visible" @update:show="onMainShowChange" :width="320" :max-height="400" :anchor-el="anchorEl"
    popper-class="model-popover simple-model-popover">
    <div class="model-panel">
      <!-- 当前选中模型 -->
      <div v-if="currentModel" class="current-model-item" @click="closePanel"
        @mouseenter="onItemEnter(currentModel, $event)" @mouseleave="onItemLeave">
        <div class="w-6 h-6 shrink-0">
          <Avatar :src="getModelAvatarPath(currentModel.modelName, currentModelProviderName) || undefined"
            :name="getModelDisplayName(currentModel.modelName)" type="assistant" :round="false"
            class="w-full h-full" />
        </div>
        <span class="flex-1 text-sm font-medium truncate">{{ getModelDisplayName(currentModel.modelName) }}</span>
        <el-icon size="16" class="text-primary shrink-0">
          <Checkmark24Regular />
        </el-icon>
      </div>

      <!--
        模型检索框：按「显示名 / 裸模型名 / 供应商名」即时过滤（用户需求 2026-10-09）。
        上下文大小过滤已按用户要求移除（原 .ctx-filter 标签行）；
        行尾的上下文徽标（128K/1M）保留，仅展示不过滤。
      -->
      <div v-if="allModels.length > 1" class="model-search">
        <el-icon size="14" class="model-search__ico">
          <Search16Filled />
        </el-icon>
        <input ref="searchInputRef" v-model="searchKw" class="model-search__input" type="text"
          :placeholder="t('chat.input.modelSearchPlaceholder')" />
        <button v-if="searchKw" type="button" class="model-search__clear" :aria-label="t('common.clear')"
          @click="searchKw = ''">
          <el-icon size="12">
            <Dismiss16Regular />
          </el-icon>
        </button>
      </div>

      <!-- 所有模型列表 -->
      <div class="models-list" @scroll.passive="repositionInfoCard">
        <!-- 空状态：显示添加模型按钮 -->
        <div v-if="allModels.length === 0" class="empty-models">
          <div class="add-model-btn" @click="goToModelSettings">
            <el-icon size="16">
              <Add24Regular />
            </el-icon>
            <span>+ 添加模型</span>
          </div>
          <div class="empty-hint">暂无可用模型，请先添加模型供应商</div>
        </div>

        <!-- 筛选后无匹配 -->
        <div v-else-if="filteredModels.length === 0" class="ctx-no-match">
          {{ t('common.contextSize.noMatch') }}
        </div>

        <!-- 模型列表 -->
        <div v-for="model in filteredModels" :key="model.id"
          class="model-item"
          :class="{ 'model-item-active': currentModelId === model.id }"
          @click="handleSelect(model.id)"
          @mouseenter="onItemEnter(model, $event)" @mouseleave="onItemLeave">
          <div class="w-6 h-6 shrink-0">
            <Avatar :src="getModelAvatarPath(model.modelName, getModelProviderName(model)) || undefined"
              :name="getModelDisplayName(model.modelName)" type="assistant" :round="false" class="w-full h-full" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">{{ getModelDisplayName(model.modelName) }}</div>
            <div v-if="getModelProviderName(model) && getModelProviderName(model) !== getModelDisplayName(model.modelName)"
              class="text-xs text-gray-400 truncate">{{ getModelProviderName(model) }}</div>
          </div>
          <!-- 上下文徽标：128K / 1M；无数据显示空（不占位） -->
          <span v-if="formatContextSize(getModelContextWindow(model))" class="model-ctx">
            {{ formatContextSize(getModelContextWindow(model)) }}
          </span>
        </div>
      </div>

      <!-- 推理强度已合并到输入框工具条上的「思考等级」入口（用户需求 4.2），此处不再重复展示。 -->
    </div>
  </CustomPopover>

  <!-- 悬停模型 → 右侧信息卡（能力 / 模态 / 成本 / 限制 / 元数据） -->
  <ModelInfoCard :model="hoverModel" :position="hoverPos" :provider-name="hoverProviderName"
    :width="INFO_CARD_WIDTH" :max-height="INFO_CARD_HEIGHT" @mouseenter="onCardEnter" @mouseleave="onCardLeave"
    @close="closeHoverCard" />
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElIcon } from 'element-plus'
import { Checkmark24Regular, Add24Regular, Search16Filled, Dismiss16Regular } from '@vicons/fluent'
import CustomPopover from '../../ui/CustomPopover.vue'
import Avatar from '../../ui/Avatar.vue'
import ModelInfoCard from './ModelInfoCard.vue'
// 设计探索（Phase 2）：5 个变体 + 浮动切换器。选定后删除这些 import。
import VariantSwitcher from './ModelSelectorPanel.variants/VariantSwitcher.vue'
import Catalog from './ModelSelectorPanel.variants/Catalog.vue'
import Briefing from './ModelSelectorPanel.variants/Briefing.vue'
import Terminal from './ModelSelectorPanel.variants/Terminal.vue'
import Aurora from './ModelSelectorPanel.variants/Aurora.vue'
import Ledger from './ModelSelectorPanel.variants/Ledger.vue'
import {
  getModelDisplayName, getModelAvatarPath,
  getModelContextWindow, formatContextSize,
} from '@/utils/modelUtils'

interface Model {
  id: string
  modelName: string
  providerId?: string
  /** 后端 /api/providers 的原始字段：供应商 id */
  provider_id?: string
  model?: string
  modelType?: string
  description?: string
  /** 后端能力数组：{ task, traits }，用于派生模态与特性 */
  capabilities?: unknown
  context_window?: number | null
  max_tokens?: number | null
  config?: {
    inputCapabilities?: string[]
    outputCapabilities?: string[]
    features?: string[]
    contextWindow?: number | null
    maxOutputTokens?: number | null
  }
  /** 官方指标（sys_ai_model_metrics 快照合并进模型行） */
  metrics?: Record<string, any>
  isFavorite?: boolean
  thinkingEfforts?: string[]
}

interface Provider {
  id?: string
  /** 后端 /api/providers 的原始字段：供应商 id */
  provider_id?: string
  name: string
  models?: Model[]
}

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  models: Model[]
  providers: Provider[]
  currentModelId: string | null
  /**
   * 探索模式是否内联渲染（Phase 2 预览页用）。
   * 默认 false：浮层盖住页面；true 时交给父容器布局，避免 fixed 在卡片里塌成 0 高。
   */
  inlineStage?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [modelId: string]
  'favorite-changed': [modelId: string, isFavorite: boolean]
}>()

const { t } = useI18n()

/* ==================== 设计探索（Phase 2，选定后删除本段） ==================== */
/** 带 ?variant=xxx 参数进入「探索模式」：渲染 5 个变体之一 + 浮动切换器。 */
const VARIANTS = ['catalog', 'briefing', 'terminal', 'aurora', 'ledger'] as const
type VariantKey = (typeof VARIANTS)[number]

/** 启动时的 URL 参数（决定探索模式开/关与初始变体；切换器只改 variant，不退出探索） */
const initialVariant = ((): VariantKey => {
  if (typeof window === 'undefined') return 'catalog'
  const v = new URLSearchParams(window.location.search).get('variant') as string | null
  return v && (VARIANTS as readonly string[]).includes(v) ? (v as VariantKey) : 'catalog'
})()
const explorationMode = computed(() =>
  typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('variant'),
)
/** 当前变体：切换器通过 dispatchEvent 驱动，URL 同步供刷新/分享 */
const variant = ref<VariantKey>(initialVariant)
const variantComponent = computed(() => {
  const key = variant.value
  if (key === 'catalog') return Catalog
  if (key === 'briefing') return Briefing
  if (key === 'terminal') return Terminal
  if (key === 'aurora') return Aurora
  return Ledger
})

/** 切换器把 URL 改好后 dispatch 该事件；这里只更新本地响应式状态（URL 已由切换器同步） */
const mvpListener = (e: Event) => {
  const key = (e as CustomEvent<string>).detail as VariantKey
  if ((VARIANTS as readonly string[]).includes(key)) {
    variant.value = key
  }
}
onMounted(() => {
  if (explorationMode.value) window.addEventListener('mvp-variant-change', mvpListener)
})
onUnmounted(() => {
  window.removeEventListener('mvp-variant-change', mvpListener)
})
/* ==================== 设计探索结束 ==================== */

const currentModel = computed(() => {
  if (!props.currentModelId) return null
  // id 可能是「供应商id:模型名」或裸模型名：先精确匹配，再按后缀兜底，
  // 否则顶部的当前选中行直接不渲染，悬停卡自然也出不来。
  return props.models.find(m => m.id === props.currentModelId)
    || props.models.find(m => props.currentModelId!.endsWith(`:${m.modelName}`))
    || props.models.find(m => m.modelName === props.currentModelId)
    || null
})

const currentModelProviderName = computed(() => {
  if (!currentModel.value) return ''
  return getModelProviderName(currentModel.value)
})

const allModels = computed(() => {
  // 按收藏优先排序
  const favorites = props.models.filter(m => m.isFavorite)
  const others = props.models.filter(m => !m.isFavorite)
  return [...favorites, ...others]
})

/** 检索关键词：按显示名 / 裸模型名 / 供应商名匹配，不区分大小写（空 = 不过滤） */
const searchKw = ref('')

/** 检索命中的模型（只影响展示，不改数据源与收藏顺序） */
const filteredModels = computed(() => {
  const kw = searchKw.value.trim().toLowerCase()
  if (!kw) return allModels.value
  return allModels.value.filter((m) =>
    getModelDisplayName(m.modelName).toLowerCase().includes(kw)
    || (m.model || '').toLowerCase().includes(kw)
    || getModelProviderName(m).toLowerCase().includes(kw),
  )
})

/**
 * 供应商 id：模型侧优先 providerId（模型管理页映射后的字段）→ provider_id（后端原始字段）
 * → 复合主键 id 的前缀（后端为 providerId:model）。
 *
 * @param model 模型行
 * @returns 供应商 id，取不到时返回空串
 */
function providerIdOfModel(model: Model): string {
  if (!model) {
    return ''
  }
  if (model.providerId) {
    return model.providerId
  }
  if (model.provider_id) {
    return model.provider_id
  }
  const id = model.id || ''
  const idx = id.indexOf(':')
  return idx > 0 ? id.slice(0, idx) : ''
}

/**
 * 供应商 id：供应商侧 id → provider_id（后端原始字段）
 *
 * @param provider 供应商行
 * @returns 供应商 id，取不到时返回空串
 */
function providerIdOfProvider(provider: Provider): string {
  return provider?.id || provider?.provider_id || ''
}

/**
 * 模型所属供应商名
 *
 * @param model 模型行
 * @returns 供应商展示名，未关联到时返回空串
 */
function getModelProviderName(model: Model): string {
  const pid = providerIdOfModel(model)
  if (!pid) return ''
  const provider = props.providers.find(p => providerIdOfProvider(p) === pid)
  return provider ? provider.name : ''
}

function handleSelect(modelId: string) {
  emit('select', modelId)
  closePanel()
}

function closePanel() {
  emit('update:visible', false)
}

function goToModelSettings() {
  // 跳转到模型管理页面
  window.location.href = '/models'
}

function onMainShowChange(val: boolean) {
  emit('update:visible', val)
}

/* ==================== 悬停信息卡 ==================== */

/** 悬停中的模型（null = 不显示信息卡） */
const hoverModel = ref<Model | null>(null)
/** 信息卡的视口坐标（fixed），按条目位置算出 */
const hoverPos = ref<{ left: number; top: number } | null>(null)
/** 悬停条目元素：列表滚动时按它重新定位 */
const hoverTarget = ref<HTMLElement | null>(null)
/** 信息卡尺寸：定位计算与卡片渲染共用同一份，避免宽度不一致导致越界 */
const INFO_CARD_WIDTH = 252
const INFO_CARD_HEIGHT = 420
/** 延迟显示：沿列表快速划过时不逐个弹卡 */
const HOVER_OPEN_DELAY = 140
/** 延迟隐藏：条目与卡片之间有 8px 间隙，留出移动到卡片的时间 */
const HOVER_CLOSE_DELAY = 240
/** 卡片与条目的间距 / 视口留白 */
const CARD_GAP = 8
const VIEWPORT_PAD = 10

let openTimer: number | undefined
let closeTimer: number | undefined

const hoverProviderName = computed(() =>
  hoverModel.value ? getModelProviderName(hoverModel.value) : '',
)

/** 按条目位置把卡片放到条目右侧；右侧放不下则翻到左侧 */
function placeInfoCard(rect: DOMRect): { left: number; top: number } {
  let left = rect.right + CARD_GAP
  if (left + INFO_CARD_WIDTH > window.innerWidth - VIEWPORT_PAD) {
    left = rect.left - INFO_CARD_WIDTH - CARD_GAP
  }
  if (left < VIEWPORT_PAD) {
    left = VIEWPORT_PAD
  }
  // 贴近条目顶部；同时夹住视口上下边界，超高时由卡片内部滚动
  const top = Math.max(
    VIEWPORT_PAD,
    Math.min(rect.top, window.innerHeight - INFO_CARD_HEIGHT - VIEWPORT_PAD),
  )
  return { left, top }
}

/** 列表滚动后卡片跟随条目（条目被滚出可视区时直接收起） */
function repositionInfoCard() {
  if (!hoverModel.value || !hoverTarget.value) {
    return
  }
  const rect = hoverTarget.value.getBoundingClientRect()
  if (rect.bottom < 0 || rect.top > window.innerHeight) {
    closeHoverCard()
    return
  }
  hoverPos.value = placeInfoCard(rect)
}

/**
 * 指针进入模型条目：延迟后弹出信息卡
 *
 * @param model 悬停的模型行
 * @param event 鼠标事件（currentTarget 必须在同步段取出，回调里已被置空）
 */
function onItemEnter(model: Model, event: MouseEvent) {
  window.clearTimeout(closeTimer)
  // 同一行重复进入不重置计时，避免卡片反复重绘
  if (hoverModel.value?.id === model.id) {
    return
  }
  const target = event.currentTarget as HTMLElement | null
  window.clearTimeout(openTimer)
  openTimer = window.setTimeout(() => {
    hoverTarget.value = target
    hoverModel.value = model
    hoverPos.value = target ? placeInfoCard(target.getBoundingClientRect()) : null
  }, HOVER_OPEN_DELAY)
}

/** 指针离开模型条目：延迟收起，给移动到卡片留时间 */
function onItemLeave() {
  window.clearTimeout(openTimer)
  scheduleClose()
}

/** 指针进入信息卡：取消收起 */
function onCardEnter() {
  window.clearTimeout(closeTimer)
}

/** 指针离开信息卡：延迟收起 */
function onCardLeave() {
  scheduleClose()
}

/** 清空悬停态 */
function resetHover() {
  hoverModel.value = null
  hoverPos.value = null
  hoverTarget.value = null
}

function scheduleClose() {
  window.clearTimeout(closeTimer)
  closeTimer = window.setTimeout(resetHover, HOVER_CLOSE_DELAY)
}

/** 立即收起信息卡（面板关闭 / Esc / 点击外部 / 组件卸载） */
function closeHoverCard() {
  window.clearTimeout(openTimer)
  window.clearTimeout(closeTimer)
  resetHover()
}

onUnmounted(closeHoverCard)

/** 检索框元素：面板打开后自动聚焦，立即可输入 */
const searchInputRef = ref<HTMLInputElement | null>(null)

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    // 面板关闭：收起信息卡 + 清空检索词（下次打开回到完整列表）
    closeHoverCard()
    searchKw.value = ''
    return
  }
  // 打开即聚焦检索框（弹层内容可能晚一拍挂载 → 短重试兜底；
  // 单模型变体不渲染检索框，重试若干次后放弃即可）
  void nextTick(() => {
    if (searchInputRef.value) {
      searchInputRef.value.focus()
      return
    }
    let tries = 0
    const timer = setInterval(() => {
      tries++
      if (searchInputRef.value) {
        searchInputRef.value.focus()
        clearInterval(timer)
      } else if (tries >= 10) {
        clearInterval(timer)
      }
    }, 50)
  })
})

// 检索词变化后列表行被整体替换，旧悬停元素已失效 → 立即收起信息卡，避免卡片挂空行
watch(searchKw, () => {
  if (searchKw.value) {
    closeHoverCard()
  }
})
</script>

<style scoped>
.model-panel {
  display: flex;
  flex-direction: column;
  padding: 8px;
}

/* 当前选中模型 */
.current-model-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  transition: background 0.15s;
}

.current-model-item:hover {
  background: var(--el-fill-color-light);
}

/* 模型列表 */
.models-list {
  margin-top: 4px;
  max-height: 240px;
  overflow-y: auto;
}

.model-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  transition: background 0.15s;
}

.model-item:hover {
  background: var(--el-fill-color-light);
}

.model-item-active {
  background: var(--el-fill-color);
}

/* 模型检索框（原上下文过滤标签行已按用户要求移除，2026-10-09） */
.model-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 4px 0;
  padding: 5px 9px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  transition: border-color 0.15s, background 0.15s;
}

.model-search:focus-within {
  border-color: var(--el-color-primary);
  background: var(--el-bg-color-overlay);
}

.model-search__ico {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}

.model-search__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.model-search__input::placeholder {
  color: var(--el-text-color-placeholder);
}

.model-search__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.model-search__clear:hover {
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-primary);
}

/* 行尾上下文徽标：128K / 1M */
.model-ctx {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

/* 筛选后无匹配 */
.ctx-no-match {
  padding: 14px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 推理强度/分割线相关样式已随「思考等级」入口一起合并到 ChatInput 工具条（用户需求 4.2），此处不再保留。 */

/* 滚动条美化 */
.models-list::-webkit-scrollbar {
  width: 6px;
}

.models-list::-webkit-scrollbar-track {
  background: transparent;
}

.models-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color-lighter);
  /* 原值 3px，恰为 6px 宽的半径即胶囊；用 full 令牌表达同一种形状 */
  border-radius: var(--el-radius-full, 9999px);
}

.models-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-gray);
}

/* 动效降级：系统开启「减少动态效果」时，三类条目的悬停底色直接到位。
   逐个列出，不写 `*` / `.model-panel *` 通配，
   避免把 el-icon / Avatar / CustomPopover 内部组件的合法过渡一起掐掉。
   三者都只带 transition（无 animation），选中态底色是静态声明，照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .current-model-item,
  .model-item {
    transition: none;
  }
}

/* 键盘焦点可见性：模型行 / 推理强度行 / 「添加模型」入口都是带 @click 的 div
   （不是可聚焦控件），浏览器不给默认焦点环。
   前三者原有 cursor: pointer 已在上面声明，不重复写；
   .add-model-btn 在本文件原本连指针样式都没有（只有模板里的 class 名），
   属于「可点却看不出可点」，这里一并补上。 */
.current-model-item,
.model-item,
.add-model-btn {
  outline: none;
}

.add-model-btn {
  cursor: pointer;
}

.current-model-item:focus-visible,
.model-item:focus-visible,
.add-model-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 设计探索容器（Phase 2）：把变体渲染在页面中央舞台，脱离弹窗定位；
   变体自带的 fixed 信息卡（如 Terminal / Aurora）直接挂在 body 上。
   .mvp--inline 必须排在 .mvp 之后（同权重，靠顺序覆盖 fixed）。 */
.mvp {
  position: fixed;
  inset: 0;
  z-index: 4001;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--bg-page, #f6f7fb) 55%, transparent);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  padding: 16px;
}

/* 内联模式：独立预览页（VariantsPreviewPage）用。
   fixed 定位在预览卡片里会塌成 0 高（卡片只剩 2px 边框，实测 2026-10-23），
   故改为普通流式布局、去掉遮罩与居中。 */
.mvp--inline {
  position: static;
  inset: auto;
  z-index: auto;
  display: block;
  padding: 0;
  background: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.mvp__stage {
  width: 480px;
  max-width: 100%;
  max-height: 80vh;
  overflow: hidden;
  background: var(--bg-container, var(--el-bg-color, #fff));
  border: 1px solid var(--border-default, var(--el-border-color-lighter, #e3e6ef));
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--shadow-lg, 0 8px 24px rgba(15, 18, 33, 0.08));
}

/* 内联模式：舞台交给预览页的卡片承载，去掉重复的边框与阴影 */
.mvp--inline .mvp__stage {
  width: auto;
  max-width: none;
  max-height: none;
  overflow: visible;
  background: none;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

/* 终端变体自带深色底，舞台同步压暗，避免白框包深块 */
.mvp--terminal .mvp__stage {
  background: var(--terminal-bg, #0d1117);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 暗色主题：舞台底色跟随 koi 暗色令牌 */
html.dark .mvp {
  background: color-mix(in srgb, var(--bg-page, #0f1117) 55%, transparent);
}
html.dark .mvp__stage {
  background: var(--bg-container, #1a1d27);
  border-color: var(--border-default, rgba(255, 255, 255, 0.12));
}
html.dark .mvp--terminal .mvp__stage {
  background: var(--terminal-bg, #0d1117);
  border-color: rgba(255, 255, 255, 0.12);
}
</style>

<template>
  <CustomPopover :show="visible" @update:show="onMainShowChange" :width="340" :max-height="440" :anchor-el="anchorEl"
    popper-class="model-popover simple-model-popover">
    <!-- 键盘导航容器：焦点落在检索框时，↑↓/Enter/Esc 由这里统一接管 -->
    <div ref="panelRef" class="model-panel" tabindex="-1" @keydown="onKeydown">
      <!-- 顶部：检索框 + 「添加新提供商」（截图右上角的灰色链接） -->
      <div class="model-search-row">
        <div v-if="allModels.length > 1" class="model-search">
          <el-icon :size="14" class="model-search__ico">
            <Search16Filled />
          </el-icon>
          <input ref="searchInputRef" v-model="searchKw" class="model-search__input" type="text"
            :placeholder="t('chat.input.modelSearchPlaceholder')" />
          <button v-if="searchKw" type="button" class="model-search__clear" :aria-label="t('common.clear')"
            @click="searchKw = ''">
            <el-icon :size="12">
              <Dismiss16Regular />
            </el-icon>
          </button>
        </div>
        <button type="button" class="model-add" @click="goToModelSettings">
          <span aria-hidden="true">+</span>
          <span>{{ t('chat.input.addProvider') }}</span>
        </button>
      </div>

      <!-- 列表标题固定在滚动区外：滚动时它不动，读者始终知道这一段是什么 -->
      <div class="panel-caption panel-caption--list">
        <span>{{ t('chat.input.modelSectionTitle') }}</span>
        <span class="panel-caption__count">{{ filteredModels.length }}</span>
      </div>

      <!-- 所有模型列表 -->
      <div class="models-list" @scroll.passive="repositionInfoCard">
        <!-- 空状态：显示添加模型按钮 -->
        <div v-if="allModels.length === 0" class="empty-models">
          <div class="add-model-btn" @click="goToModelSettings">
            <el-icon :size="14">
              <Add24Regular />
            </el-icon>
            <span>{{ t('chat.input.addModel') }}</span>
          </div>
          <div class="empty-hint">{{ t('chat.input.noModelsHint') }}</div>
        </div>

        <!-- 筛选后无匹配 -->
        <div v-else-if="filteredModels.length === 0" class="ctx-no-match">
          {{ t('common.contextSize.noMatch') }}
        </div>

        <!-- 模型列表：一行一个模型（名称 + 上下文 + 选中勾），不再有「当前模型」分区 -->
        <template v-else>
          <div v-for="(model, i) in filteredModels" :key="model.id" class="model-item"
            :class="{ 'model-item-active': currentModelId === model.id, 'is-active': i === activeIndex }"
            :title="getModelProviderName(model) || undefined" @click="handleSelect(model.id)"
            @mouseenter="onItemEnter(model, $event)" @mouseleave="onItemLeave">
            <div class="model-avatar">
              <Avatar :src="getModelAvatarPath(model.modelName, getModelProviderName(model)) || undefined"
                :name="getModelDisplayName(model.modelName)" type="assistant" :round="false" class="w-full h-full" />
            </div>
            <span class="model-item__name">{{ model.alias || getModelDisplayName(model.modelName) }}</span>
            <!-- 上下文徽标：128K / 1M；无数据显示空（不占位） -->
            <span v-if="formatContextSize(getModelContextWindow(model))" class="model-ctx">
              {{ formatContextSize(getModelContextWindow(model)) }}
            </span>
            <el-icon v-if="currentModelId === model.id" :size="14" class="model-item__check">
              <Checkmark24Regular />
            </el-icon>
          </div>
        </template>
      </div>

      <div class="panel-foot">
        <span>{{ t('chat.input.hintNavigate') }}</span>
        <span>{{ t('chat.input.hintSelect') }}</span>
        <span>{{ t('chat.input.hintClose') }}</span>
      </div>
    </div>
  </CustomPopover>

  <!-- 悬停模型 → 右侧信息卡（能力 / 模态 / 成本 / 限制 / 元数据） -->
  <ModelInfoCard :model="hoverModel" :position="hoverPos" :provider-name="hoverProviderName"
    :width="INFO_CARD_WIDTH" :max-height="INFO_CARD_HEIGHT" @mouseenter="onCardEnter" @mouseleave="onCardLeave"
    @close="closeHoverCard" />
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElIcon } from 'element-plus'
import { Checkmark24Regular, Add24Regular, Search16Filled, Dismiss16Regular } from '@vicons/fluent'
import CustomPopover from '../../ui/CustomPopover.vue'
import Avatar from '../../ui/Avatar.vue'
import ModelInfoCard from './ModelInfoCard.vue'
import {
  getModelDisplayName, getModelAvatarPath,
  getModelContextWindow, formatContextSize,
} from '@/utils/modelUtils'

interface Model {
  id: string
  modelName: string
  /** 用户配置的模型别名：有则优先展示 */
  alias?: string
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
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [modelId: string]
  'favorite-changed': [modelId: string, isFavorite: boolean]
}>()

const { t } = useI18n()

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
    || (m.alias || '').toLowerCase().includes(kw)
    || (m.model || '').toLowerCase().includes(kw)
    || getModelProviderName(m).toLowerCase().includes(kw),
  )
})

/** 键盘高亮行：与「当前生效模型」分离，↑↓ 只移动高亮，Enter 才真正切换 */
const activeIndex = ref(0)
const panelRef = ref<HTMLElement | null>(null)

/**
 * 键盘导航：↑↓ 移动、Enter 选中、Esc 关闭。
 *
 * <p>检索框聚焦时事件从 input 冒泡到面板容器，因此这里统一接管，
 * 不需要额外给 input 挂监听。</p>
 *
 * @param e 键盘事件
 */
function onKeydown(e: KeyboardEvent): void {
  const len = filteredModels.value.length
  if (!len) {
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % len
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + len) % len
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const model = filteredModels.value[activeIndex.value]
    if (model) {
      handleSelect(model.id)
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    closePanel()
  }
}

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
  // 打开时键盘高亮落在「当前生效模型」上；找不到就落第一行
  const idx = filteredModels.value.findIndex(m => m.id === props.currentModelId)
  activeIndex.value = idx === -1 ? 0 : idx
  // 打开即聚焦检索框（弹层内容可能晚一拍挂载 → 短重试兜底；
  // 单模型变体不渲染检索框，重试耗尽后把焦点交给面板本身，键盘导航仍可用）
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
        panelRef.value?.focus()
      }
    }, 50)
  })
})

// 检索词变化后列表行被整体替换，旧悬停元素已失效 → 立即收起信息卡，避免卡片挂空行
watch(searchKw, () => {
  closeHoverCard()
  activeIndex.value = 0
})
</script>

<style scoped>
/* ===== 模型下拉面板（2026-11-08 目标 UI 对齐） =====
   面板本体的圆角与底色由 CustomPopover 外壳负责，这里只管内容排版。
   行高收到 30px、主行 13px、辅助 11px，与思考 / 智能体两个下拉完全同源。 */

.model-panel {
  display: flex;
  flex-direction: column;
  padding: 4px 4px 2px;
  outline: none;
}

/* 顶部一行：检索框在左、添加提供商在右，两者共用一条 28px 基线 */
.model-search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 4px 2px;
}

/* 分区标题：小号、字重 500、字距微收，只做定位不做强调 */
.panel-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 8px 4px;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: 0.02em;
  user-select: none;
}

.panel-caption__count {
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary, var(--el-text-color-secondary));
}

/* 头像统一 18px、4px 圆角：这是列表行里唯一的图形元素，不能再大 */
.model-avatar {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  overflow: hidden;
  border-radius: 4px;
}

/* ===== 检索框：无描边、无填充，只有放大镜与一行占位文字（目标 UI 的极简形态） ===== */
.model-search {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 0 4px;
  border: none;
  border-radius: 6px;
  background: transparent;
  transition: background-color 0.15s ease;
}

.model-search:focus-within {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 4%, transparent);
}

.model-search__ico {
  flex-shrink: 0;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}

.model-search__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  line-height: 18px;
  color: var(--text-primary, var(--el-text-color-primary));
}

.model-search__input::placeholder {
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}

.model-search__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.model-search__clear:hover {
  background: var(--bg-hover, var(--el-fill-color-dark));
  color: var(--text-primary, var(--el-text-color-primary));
}

/* 「添加新提供商」：右对齐的低对比文字链接，不抢列表的视觉权重 */
.model-add {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  height: 24px;
  padding: 0 4px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.model-add:hover {
  color: var(--text-primary, var(--el-text-color-primary));
  background: color-mix(in srgb, var(--text-primary, #0f172a) 5%, transparent);
}

/* ===== 模型列表 ===== */
.panel-caption--list {
  margin-top: 2px;
}

.models-list {
  padding: 0 2px 2px;
  max-height: 300px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* 行高 30px：与思考 / 智能体下拉同源，三个面板来回切不会跳高度 */
.model-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.model-item:hover,
.model-item.is-active {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 5%, transparent);
}

/* 选中项：底色再加一档，并保留行尾的勾（勾才是「这就是当前项」的硬信号） */
.model-item-active {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 7%, transparent);
}

.model-item__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary, var(--el-text-color-primary));
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
}

/* 行尾上下文：128K / 1M。目标 UI 里是纯灰文字，不做胶囊底 */
.model-ctx {
  flex-shrink: 0;
  color: var(--text-tertiary, var(--el-text-color-secondary));
  font-size: 11px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}

.model-item__check {
  flex-shrink: 0;
  color: var(--text-primary, var(--el-text-color-primary));
}

/* 页脚按键提示：与内容用一条极淡分割线隔开 */
.panel-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 2px;
  padding: 6px 8px 2px;
  border-top: 1px solid var(--border-default, var(--el-border-color-lighter));
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-size: 11px;
  line-height: 16px;
  user-select: none;
}

/* ===== 空态 ===== */
.empty-models {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 8px 16px;
  text-align: center;
}

.add-model-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px dashed var(--border-strong, var(--el-border-color));
  border-radius: 8px;
  color: var(--text-secondary, var(--el-text-color-secondary));
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
}

.add-model-btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 5%, transparent);
}

.empty-hint {
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-size: 12px;
  line-height: 18px;
}

/* 筛选后无匹配 */
.ctx-no-match {
  padding: 14px 12px;
  text-align: center;
  font-size: 12px;
  line-height: 18px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
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
  background: var(--border-default, var(--el-border-color-lighter));
  border-radius: 999px;
}

.models-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-gray);
}

/* 动效降级：系统开启「减少动态效果」时，悬停/聚焦底色直接到位。
   逐个列出，不写通配，避免把 el-icon / Avatar / CustomPopover 内部组件的合法过渡一起掐掉。 */
@media (prefers-reduced-motion: reduce) {
  .model-item,
  .model-search,
  .model-search__clear,
  .model-add,
  .add-model-btn {
    transition: none;
  }
}

/* 键盘焦点可见性：模型行 / 添加入口都是带 @click 的 div（不是可聚焦控件），
   浏览器不给默认焦点环，这里补一个与输入卡同色的光环。 */
.model-item,
.add-model-btn {
  outline: none;
}

.model-item:focus-visible,
.add-model-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}
</style>

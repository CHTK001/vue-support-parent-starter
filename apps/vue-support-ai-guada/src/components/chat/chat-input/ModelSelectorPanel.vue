<template>
  <CustomPopover :show="visible" @update:show="onMainShowChange" :width="320" :max-height="400" :anchor-el="anchorEl"
    popper-class="model-popover simple-model-popover">
    <div class="model-panel">
      <!-- 当前选中模型 -->
      <div v-if="currentModel" class="current-model-item" @click="closePanel">
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

      <!-- 所有模型列表 -->
      <div class="models-list">
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

        <!-- 模型列表 -->
        <div v-for="model in allModels" :key="model.id"
          class="model-item"
          :class="{ 'model-item-active': currentModelId === model.id }"
          @click="handleSelect(model.id)">
          <div class="w-6 h-6 shrink-0">
            <Avatar :src="getModelAvatarPath(model.modelName, getModelProviderName(model)) || undefined"
              :name="getModelDisplayName(model.modelName)" type="assistant" :round="false" class="w-full h-full" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">{{ getModelDisplayName(model.modelName) }}</div>
            <div v-if="getModelProviderName(model) && getModelProviderName(model) !== getModelDisplayName(model.modelName)"
              class="text-xs text-gray-400 truncate">{{ getModelProviderName(model) }}</div>
          </div>
        </div>
      </div>

      <!-- 分割线 -->
      <div class="divider"></div>

      <!-- 推理强度 -->
      <div v-if="thinkingEffortOptions.length > 0" class="thinking-effort-section">
        <div class="section-title">推理强度</div>
        <div class="effort-options">
          <div v-for="effort in thinkingEffortOptions" :key="effort"
            class="effort-item"
            :class="{ 'effort-item-active': thinkingEffortValue === effort }"
            @click="handleThinkingEffortSelect(effort)">
            <span>{{ getThinkingEffortLabel(effort) }}</span>
            <el-icon v-if="thinkingEffortValue === effort" size="14" class="text-primary">
              <Checkmark24Regular />
            </el-icon>
          </div>
        </div>
      </div>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElIcon } from 'element-plus'
import { Checkmark24Regular, Add24Regular } from '@vicons/fluent'
import CustomPopover from '../../ui/CustomPopover.vue'
import Avatar from '../../ui/Avatar.vue'
import { getModelDisplayName, getModelAvatarPath, getThinkingEffortLabel } from '@/utils/modelUtils'

interface Model {
  id: string
  modelName: string
  providerId: string
  modelType?: string
  description?: string
  config?: {
    inputCapabilities?: string[]
    outputCapabilities?: string[]
    features?: string[]
  }
  isFavorite?: boolean
  thinkingEfforts?: string[]
}

interface Provider {
  id: string
  name: string
  models?: Model[]
}

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  models: Model[]
  providers: Provider[]
  currentModelId: string | null
  thinkingEffortOptions: string[]
  thinkingEffortValue: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'select': [modelId: string]
  'favorite-changed': [modelId: string, isFavorite: boolean]
  'select-thinking-effort': [effort: string]
}>()

const { t } = useI18n()

const currentModel = computed(() => {
  if (!props.currentModelId) return null
  return props.models.find(m => m.id === props.currentModelId) || null
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

function getModelProviderName(model: Model): string {
  if (!model || !model.providerId) return ''
  const provider = props.providers.find(p => p.id === model.providerId)
  return provider ? provider.name : ''
}

function handleSelect(modelId: string) {
  emit('select', modelId)
  closePanel()
}

function handleThinkingEffortSelect(effort: string) {
  emit('select-thinking-effort', effort)
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

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    // 面板关闭时清理
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
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.current-model-item:hover {
  background: var(--color-sidebar-bg-hover);
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
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.model-item:hover {
  background: var(--color-sidebar-bg-hover);
}

.model-item-active {
  background: var(--color-sidebar-bg-active);
}

/* 分割线 */
.divider {
  height: 1px;
  background: var(--color-surface-border);
  margin: 8px 0;
}

/* 推理强度 */
.thinking-effort-section {
  padding-top: 4px;
}

.section-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-gray);
  padding: 4px 12px;
  margin-bottom: 4px;
}

.effort-options {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.effort-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 14px;
}

.effort-item:hover {
  background: var(--color-sidebar-bg-hover);
}

.effort-item-active {
  background: var(--color-sidebar-bg-active);
}

/* 滚动条美化 */
.models-list::-webkit-scrollbar {
  width: 6px;
}

.models-list::-webkit-scrollbar-track {
  background: transparent;
}

.models-list::-webkit-scrollbar-thumb {
  background: var(--color-surface-border);
  border-radius: 3px;
}

.models-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-gray);
}
</style>

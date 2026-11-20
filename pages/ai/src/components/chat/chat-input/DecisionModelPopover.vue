<template>
  <CustomPopover :show="visible" @update:show="(v) => emit('update:visible', v)"
    :width="300" :max-height="420" :anchor-el="anchorEl">
    <div class="dm-sel">
      <div class="dm-sel__header">
        <span class="dm-sel__title">{{ t('chat.input.decisionModelTitle') }}</span>
        <el-button link :disabled="!currentValue" @click="select('')">
          {{ t('chat.input.decisionModelClear') }}
        </el-button>
      </div>
      <div class="dm-sel__hint">{{ t('chat.input.decisionModelHint') }}</div>

      <div v-if="loading" class="dm-sel__loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>{{ t('chat.input.decisionModelLoading') }}</span>
      </div>

      <div v-else-if="!providers.length" class="dm-sel__empty">
        {{ t('chat.input.decisionModelEmpty') }}
      </div>

      <div v-else class="dm-sel__list">
        <div v-for="p in providers" :key="p.provider_id" class="dm-sel__item"
          :class="{ 'is-active': p.provider_id === currentValue }" @click="select(String(p.provider_id || ''))">
          <CardAvatar :name="p.name || p.provider_id || ''" />
          <div class="dm-sel__itembody">
            <div class="dm-sel__itemname">{{ p.name || p.provider_id }}</div>
            <div class="dm-sel__itemmeta">{{ metaLabel(p) }}</div>
          </div>
          <el-icon v-if="p.provider_id === currentValue" size="16" class="dm-sel__check">
            <Checkmark16Filled />
          </el-icon>
        </div>
      </div>
    </div>
  </CustomPopover>
</template>

<script setup lang="ts">
/**
 * 决策模型选择浮层（会话级配置）。
 *
 * <p>候选来自后端 /v2/decision-providers（已启用且平台为 system-one/decisions 的渠道）。
 * 单选：点选即替换，头部「不使用」清空（值为空串）。选择结果经 config-change 上报，
 * 由 ChatPanel 写入会话 settings.decisionProviderId 持久化。</p>
 */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElButton, ElIcon } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { Checkmark16Filled } from '@vicons/fluent'
import CustomPopover from '@/components/ui/CustomPopover.vue'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import { apiService } from '@/services/ApiService'
import type { DecisionProvider } from '@/services/modules/decision.api'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  /** 当前选中的 providerId；空串/undefined 表示未配置 */
  currentValue?: string | null
}>()

const emit = defineEmits<{
  'update:visible': [boolean]
  'select': [providerId: string]
}>()

const providers = ref<DecisionProvider[]>([])
const loading = ref(false)

function metaLabel(p: DecisionProvider): string {
  const model = p.model ? ` · ${p.model}` : ''
  return `${p.platform || ''}${model}`
}

async function loadProviders() {
  loading.value = true
  try {
    providers.value = await apiService.listDecisionProviders()
  } catch (e) {
    console.error('加载决策供应商失败:', e)
    providers.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) loadProviders()
  },
)

function select(providerId: string) {
  emit('select', providerId)
  emit('update:visible', false)
}
</script>

<style scoped>
.dm-sel {
  padding: 4px 4px 6px;
}
.dm-sel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dm-sel__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.dm-sel__hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin: 2px 0 8px;
  line-height: 1.5;
}
.dm-sel__loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  justify-content: center;
}
.dm-sel__empty {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 18px 6px;
  text-align: center;
  line-height: 1.6;
}
.dm-sel__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dm-sel__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  outline: none;
}
.dm-sel__item:hover { background: var(--el-fill-color-light); }
.dm-sel__item.is-active { background: var(--el-color-primary-light-9); }
.dm-sel__item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.dm-sel__itembody { flex: 1; min-width: 0; }
.dm-sel__itemname {
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}
.dm-sel__itemmeta {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}
.dm-sel__check {
  flex: none;
  color: var(--el-color-primary);
}
</style>

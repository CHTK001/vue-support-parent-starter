<template>
  <el-collapse v-model="activeNames" class="adv-collapse">
    <el-collapse-item name="vector-storage">
      <template #title>
        <div class="adv-head">
          <span class="adv-title">向量库配置</span>
          <span class="adv-badge">管理员专属 · 保存到全局</span>
          <el-icon class="adv-chevron"><ArrowDown /></el-icon>
        </div>
      </template>

      <SettingsRow label="向量库实现" :description="selectedDescriptor?.description">
        <el-select :model-value="selectedVectorStorage" class="w-full"
          @update:model-value="$emit('update:selected', $event)">
          <el-option v-for="desc in vectorStorageOptions" :key="desc.name"
            :label="desc.displayName || desc.name" :value="desc.name">
            <div class="vs-opt-row">
              <span>{{ desc.displayName || desc.name }}</span>
              <span class="vs-opt-sub">{{ desc.name }}</span>
            </div>
          </el-option>
        </el-select>
      </SettingsRow>

      <SettingsRow v-for="field in selectedVectorFields" :key="field.key"
        :label="field.label" :description="field.description"
        :tip="fieldTip(field)"
        :badge="field.required ? '必填' : undefined">
        <el-input v-if="field.secret || field.type === 'PASSWORD'"
          :model-value="fieldValues[field.key]"
          type="password" show-password clearable
          :placeholder="secretPlaceholder(field)"
          @update:model-value="updateField(field.key, $event)" />
        <ReNumberInput v-else-if="field.type === 'NUMBER'"
          :model-value="fieldValues[field.key]"
          @change="(val: any) => updateField(field.key, val)" />
        <el-switch v-else-if="field.type === 'BOOLEAN'"
          :model-value="fieldValues[field.key]"
          @update:model-value="updateField(field.key, $event)" />
        <el-select v-else-if="field.type === 'SELECT'" :model-value="fieldValues[field.key]"
          class="w-full" clearable
          @update:model-value="updateField(field.key, $event)">
          <el-option v-for="opt in (field.options || [])" :key="opt" :label="opt" :value="opt" />
        </el-select>
        <el-input v-else :model-value="fieldValues[field.key]"
          :placeholder="field.placeholder || ''" clearable
          @update:model-value="updateField(field.key, $event)" />
      </SettingsRow>

      <div class="vs-actions">
        <ReButton type="primary" :loading="saving" @click="$emit('save')">保存向量库配置</ReButton>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup lang="ts">
/**
 * 向量库配置（RAG 组 + 管理员）：描述器驱动的动态表单，保存到全局层。
 * 纯展示 + 双向值回调；数据与保存动作由父级托管。
 */
import { ref, computed } from 'vue'
import { ArrowDown } from "@element-plus/icons-vue"
import ReButton from '@/components/ui/ReButton.vue'
import ReNumberInput from '@/components/ui/ReNumberInput.vue'
import SettingsRow from '../SettingsRow.vue'

const props = defineProps<{
  vectorStorageOptions: any[]
  selectedVectorStorage: string
  selectedVectorFields: any[]
  fieldValues: Record<string, any>
  secretPlaceholder: (field: any) => string
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:selected': [value: string]
  update: [key: string, value: any]
  save: []
}>()

const activeNames = ref(['vector-storage'])

const selectedDescriptor = computed(() =>
  props.vectorStorageOptions.find((d) => d?.name === props.selectedVectorStorage) || null)

const fieldTip = (field: any) => {
  const label = String(field?.label ?? '').trim()
  if (!label || label.length <= 10) return ''
  return field.description ? `${label}：${field.description}` : label
}

function updateField(key: string, value: any) {
  emit('update', key, value)
}
</script>

<style scoped>
.ref-vs, .vs-actions { display: none; }
:deep(.adv-collapse) { border: none; }
:deep(.adv-collapse .el-collapse-item__wrap) {
  border-bottom: none;
  border-top: 1px solid var(--el-border-color-lighter);
}
:deep(.adv-collapse .el-collapse-item__header) {
  height: auto; min-height: 0; line-height: normal;
  border-bottom: none; background: transparent; padding: 0;
}
:deep(.adv-collapse .el-collapse-item__arrow) { display: none; }
:deep(.adv-collapse .el-collapse-item__header:hover) { background: transparent; }
:deep(.adv-collapse .el-collapse-item__content) { padding: 0; }

.adv-head {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; cursor: pointer;
  transition: background 0.16s ease;
}
.adv-head:hover { background: var(--el-fill-color-light); }
.adv-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-regular); }
.adv-badge {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
  margin-left: 8px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
:deep(.adv-chevron) {
  color: var(--el-text-color-secondary);
  transition: transform 0.22s ease;
}
:deep(.el-collapse-item__header.is-active .adv-chevron) { transform: rotate(180deg); }

.vs-opt-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.vs-opt-sub { font-size: 12px; color: var(--el-text-color-secondary); }
.vs-actions { display: flex; justify-content: flex-end; margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--el-border-color-extra-light); }

@media (prefers-reduced-motion: reduce) {
  .adv-head, :deep(.adv-chevron) { transition: none; }
}
</style>

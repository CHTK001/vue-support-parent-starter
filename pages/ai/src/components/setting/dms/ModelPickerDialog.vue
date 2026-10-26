<template>
  <ReDialog :close-on-click-modal="true" :model-value="visible" title="选择模型" width="600px"
    @update:model-value="$emit('update:visible', $event)">
    <div class="dms-mp-body">
      <el-input v-model="search" placeholder="搜索模型..." clearable>
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="dms-mp-list">
        <div v-for="provider in filteredProviders" :key="provider.id">
          <div class="dms-mp-provider">{{ provider.name }}</div>
          <div v-for="model in provider.models" :key="model.id" class="dms-mp-row"
            tabindex="0" @click="pick(model.id)" @keydown.enter="pick(model.id)">
            <div class="dms-mp-row-left">
              <img v-if="modelLogo(model)" :src="modelLogo(model)" alt=""
                class="w-4 h-4 object-contain shrink-0" />
              <span class="dms-mp-name">{{ model.model }}</span>
              <span class="dms-mp-tags">
                <ReTag v-for="tag in model.displayTags" :key="tag.value" :type="tag.tagType">
                  {{ tag.label }}
                </ReTag>
              </span>
            </div>
            <el-icon v-if="selectedId === model.id" class="dms-mp-check" :size="18">
              <CheckCircleFilled />
            </el-icon>
          </div>
        </div>

        <div v-if="filteredProviders.length === 0" class="dms-mp-empty">
          <div class="dms-mp-empty-main">{{ emptyText || '没有匹配的模型' }}</div>
          <div class="dms-mp-empty-sub">请先在「模型管理」中添加对应类型的模型</div>
        </div>
      </div>
    </div>
    <template #footer>
      <ReButton type="default" @click="$emit('clear')">清空（使用默认）</ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 模型选择对话框：搜索 + 按供应商分组 + 类型/子类型标签 + 清空。
 * 纯展示 + 本地搜索状态；命中结果与 logo 由父级注入。
 */
import { ref, computed } from 'vue'
import { Search } from "@element-plus/icons-vue"
import { CheckCircleFilled } from "@vicons/material"
import ReDialog from '@repo/ui/re-dialog'
import ReButton from '@/components/re/ReButton.vue'
import ReTag from '@/components/re/ReTag.vue'

const props = defineProps<{
  visible: boolean
  /** 最终可选的供应商列表（已按类型/子类型过滤、含 models） */
  providers: any[]
  /** 当前临时选中的模型 id */
  selectedId?: string | null
  emptyText?: string
  logoFor?: (model: any) => string | undefined | null
}>()

const emit = defineEmits<{
  'update:visible': [v: boolean]
  select: [modelId: string]
  clear: []
}>()

const search = ref('')

const filteredProviders = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.providers
  return props.providers
    .map((p) => ({ ...p, models: (p.models || []).filter((m: any) =>
      String(m.model || '').toLowerCase().includes(q) || String(m.modelName || '').toLowerCase().includes(q)) }))
    .filter((p) => p.models.length > 0)
})

const modelLogo = (model: any): string | undefined => (props.logoFor ? props.logoFor(model) ?? undefined : undefined)

function pick(id: string) {
  if (!id) return
  search.value = ''
  emit('select', id)
}
</script>

<style scoped>
.dms-mp-body { display: flex; flex-direction: column; gap: 14px; }
.dms-mp-list { max-height: 384px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.dms-mp-provider { font-size: 12px; font-weight: 600; color: var(--el-text-color-secondary); margin-bottom: 4px; }
.dms-mp-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 9px 12px; border-radius: var(--el-radius-lg, 12px); cursor: pointer;
  outline: none; transition: background 0.16s ease;
}
.dms-mp-row:hover { background: var(--el-fill-color-light); }
.dms-mp-row:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent); }
.dms-mp-row-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.dms-mp-name { font-size: 13px; color: var(--el-text-color-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dms-mp-tags { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.dms-mp-check { color: var(--el-color-primary); flex-shrink: 0; }
.dms-mp-empty { padding: 40px 0; text-align: center; }
.dms-mp-empty-main { font-size: 13px; color: var(--el-text-color-regular); }
.dms-mp-empty-sub { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }

@media (prefers-reduced-motion: reduce) {
  .dms-mp-row { transition: none; }
}
</style>

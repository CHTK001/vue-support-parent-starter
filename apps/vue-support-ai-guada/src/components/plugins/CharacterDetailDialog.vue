<template>
  <LDialog
    :model-value="modelValue"
    width="600px"
    align-center
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="detail-avatar">
        <img v-if="detail?.avatar" :src="detail.avatar" alt="" />
        <span v-else>{{ (detail?.title || item?.title || '?').charAt(0) }}</span>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <el-icon class="is-loading" size="30">
        <Loading />
      </el-icon>
    </div>
    <div v-else-if="error" class="py-10 text-center text-sm" style="color: var(--el-color-danger)">
      {{ error }}
    </div>
    <div v-else-if="detail" class="detail-body">
      <div class="detail-title">{{ detail.title }}</div>
      <div class="detail-desc">{{ detail.description || '（无描述）' }}</div>

      <!-- 擅长领域 -->
      <div v-if="detail.tags?.length" class="detail-section">
        <div class="detail-section-title">擅长领域</div>
        <div class="detail-chip-row">
          <span v-for="tag in detail.tags" :key="tag" class="detail-chip">{{ tag }}</span>
        </div>
      </div>

      <!-- 试试这样问我 -->
      <div v-if="detail.prompts?.length" class="detail-section">
        <div class="detail-section-title">试试这样问我</div>
        <div class="detail-prompt-list">
          <div
            v-for="(p, idx) in detail.prompts"
            :key="idx"
            class="detail-prompt-item"
            @click="handleUsePrompt(p)"
          >
            <span class="detail-prompt-text">{{ p }}</span>
            <ArrowRight24Regular class="detail-prompt-arrow" />
          </div>
        </div>
      </div>

      <!-- 内置技能 -->
      <div v-if="detail.skills?.length" class="detail-section">
        <div class="detail-section-title">内置技能 {{ detail.skills.length }}</div>
        <div class="detail-skill-list">
          <div v-for="sk in detail.skills" :key="sk.id" class="detail-skill-item">
            <div class="detail-skill-tile">
              <Apps20Regular />
            </div>
            <span class="detail-skill-name">{{ sk.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="detail-footer">
        <el-button v-if="detail?.added" type="success" disabled>已召唤</el-button>
        <el-button v-else type="primary" :loading="adding" @click="detail && emit('summon', detail)">
          召唤
        </el-button>
      </div>
    </template>
  </LDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ArrowRight24Regular, Apps20Regular } from '@vicons/fluent'
import LDialog from '@/components/ui/LDialog.vue'
import { apiService } from '@/services/ApiService'
import type { CharacterCatalogDetail } from '@/services/modules/character.api'

interface DetailTarget {
  id: string
  title: string
  description?: string
  avatar?: string
  added: boolean
}

const props = defineProps<{
  modelValue: boolean
  item: DetailTarget | null
  adding?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'summon', detail: CharacterCatalogDetail): void
  (e: 'use-prompt', detail: CharacterCatalogDetail, prompt: string): void
}>()

const loading = ref(false)
const error = ref('')
const detail = ref<CharacterCatalogDetail | null>(null)

async function load() {
  if (!props.item) return
  loading.value = true
  error.value = ''
  detail.value = null
  try {
    detail.value = await apiService.fetchBuiltinCharacterDetail(props.item.id)
  } catch (e: any) {
    console.error('加载角色详情失败:', e)
    error.value = e?.message || '加载详情失败'
  } finally {
    loading.value = false
  }
}

function handleUsePrompt(prompt: string) {
  if (detail.value) emit('use-prompt', detail.value, prompt)
}

watch(
  () => [props.modelValue, props.item?.id],
  ([v]) => {
    if (v) void load()
  },
)
</script>

<style scoped>
.detail-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
}
.detail-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.detail-avatar span {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-color-primary);
}
.detail-footer {
  display: flex;
  justify-content: flex-end;
}
.detail-body {
  display: flex;
  flex-direction: column;
  max-height: 60vh;
  overflow-y: auto;
}
.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.detail-desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.55;
}
.detail-section {
  margin-top: 16px;
}
.detail-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}
.detail-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.detail-chip {
  font-size: 12px;
  line-height: 1;
  padding: 7px 11px;
  border-radius: 999px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--color-surface-border, var(--el-border-color-lighter));
}
.detail-prompt-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detail-prompt-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.detail-prompt-item:hover {
  background: var(--el-fill-color);
}
.detail-prompt-item:hover .detail-prompt-arrow {
  color: var(--el-color-primary);
}
.detail-prompt-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}
.detail-prompt-arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  transition: color 0.2s ease;
}
.detail-skill-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detail-skill-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.detail-skill-tile {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}
.detail-skill-tile :deep(svg) {
  width: 17px;
  height: 17px;
}
.detail-skill-name {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>

<template>
  <LDialog
    v-model="visible"
    title="模板库"
    width="800px"
    align-center
    append-to-body
    :close-on-click-modal="false"
    class="template-catalog"
  >
    <template #header>
      <div class="tc-header">
        <div class="tc-header-ico">
          <el-icon :size="20"><StorefrontOutlined /></el-icon>
        </div>
        <div class="tc-header-text">
          <span class="tc-header-title">模板库</span>
          <span class="tc-header-sub">从预置供应商模板一键添加</span>
        </div>
      </div>
    </template>

    <div class="tc-search">
      <el-icon class="tc-search-icon" :size="17"><SearchOutlined /></el-icon>
      <input
        v-model="keyword"
        class="tc-search-input"
        type="text"
        placeholder="搜索供应商，如 DeepSeek、千问、Gemini…"
      />
      <button v-if="keyword" class="tc-search-clear" @click="keyword = ''">
        <el-icon :size="15"><CloseOutlined /></el-icon>
      </button>
    </div>

    <div class="tc-stats">
      <span class="tc-stat-item">
        <span class="tc-stat-num">{{ templates.length }}</span>
        <span class="tc-stat-label">全部</span>
      </span>
      <span class="tc-stat-item">
        <span class="tc-stat-num">{{ filtered.length }}</span>
        <span class="tc-stat-label">匹配</span>
      </span>
    </div>

    <div class="tc-grid">
      <article
        v-for="tpl in filtered"
        :key="`${tpl.id}|${tpl.name}`"
        class="tc-card"
        @click="choose(tpl)"
      >
        <div class="tc-logo">
          <ProviderLogo :pid="tpl.id" :name="tpl.name" size="md" />
        </div>
        <div class="tc-info">
          <span class="tc-name">{{ tpl.name }}</span>
          <span class="tc-desc">{{ tpl.description }}</span>
          <span v-if="tpl.keywords?.length" class="tc-tags">
            <span v-for="kw in tpl.keywords.slice(0, 3)" :key="kw" class="tc-tag">{{ kw }}</span>
          </span>
        </div>
        <span class="tc-add">
          <el-icon :size="14"><AddOutlined /></el-icon>添加
        </span>
      </article>
      <div v-if="filtered.length === 0" class="tc-no">
        <el-icon :size="40" style="opacity: 0.4"><SearchOutlined /></el-icon>
        <p>未找到匹配的供应商</p>
        <span>尝试其他关键词</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </LDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SearchOutlined, CloseOutlined, AddOutlined, StorefrontOutlined } from '@vicons/material'
import LDialog from '@/components/ui/LDialog.vue'
import ProviderLogo from './ProviderLogo.vue'

const props = defineProps<{ templates: any[] }>()
const emit = defineEmits<{ select: [template: any] }>()

const visible = ref(false)
const keyword = ref('')

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return props.templates
  return props.templates.filter(
    (t) =>
      t.name.toLowerCase().includes(k) ||
      (t.description || '').toLowerCase().includes(k) ||
      t.id.toLowerCase().includes(k) ||
      (t.keywords || []).some((kw: string) => kw.toLowerCase().includes(k)),
  )
})

const choose = (tpl: any) => {
  visible.value = false
  emit('select', tpl)
}

const open = () => {
  keyword.value = ''
  visible.value = true
}
defineExpose({ open })
</script>

<style scoped>
.tc-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.tc-header-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--mp-radius);
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  flex-shrink: 0;
}
.tc-header-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.tc-header-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.tc-header-sub {
  font-size: 11.5px;
  color: var(--el-text-color-regular);
}

.tc-search {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}
.tc-search-icon {
  position: absolute;
  left: 14px;
  color: var(--el-text-color-disabled);
  z-index: 1;
}
.tc-search-input {
  width: 100%;
  height: 42px;
  padding: 0 44px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--mp-radius-lg);
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.tc-search-input:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}
.tc-search-clear {
  position: absolute;
  right: 10px;
  display: inline-flex;
  border: none;
  background: transparent;
  color: var(--el-text-color-disabled);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--mp-radius-sm);
  transition: all 0.15s ease;
}
.tc-search-clear:hover { color: var(--el-text-color-primary); background: var(--el-fill-color-light); }

.tc-stats {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: var(--mp-radius);
}
.tc-stat-item {
  display: flex;
  align-items: baseline;
  gap: 5px;
}
.tc-stat-num {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-color-primary);
}
.tc-stat-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

/*
 * 滚动交给外层 .l-dialog__body（LDialog 已设 flex:1 / min-height:0 / overflow-y:auto）。
 * 这里不要再设 max-height + overflow，否则形成「双层滚动容器」：
 * 卡片被内层网格卡在 420px，外层再套一层滚动条，两端滚动条互相抢焦点。
 */
.tc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.tc-card {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--mp-radius-lg);
  background: var(--el-bg-color-overlay);
  cursor: pointer;
  transition: all 0.18s ease;
  position: relative;
}
.tc-card:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 55%, var(--el-border-color-light));
  box-shadow: var(--mp-shadow-pop);
  transform: translateY(-1px);
}
.tc-logo { flex-shrink: 0; }
.tc-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  gap: 3px;
}
.tc-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tc-desc {
  font-size: 11px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tc-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.tc-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--el-border-radius-round);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  white-space: nowrap;
}
.tc-add {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  padding: 4px 8px;
  border-radius: var(--mp-radius-sm);
  background: var(--el-color-primary-light-9);
  transition: all 0.15s ease;
}
.tc-card:hover .tc-add {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}
.tc-no {
  grid-column: 1 / -1;
  padding: 48px 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-disabled);
}
.tc-no p { margin: 0; font-size: 14px; font-weight: 600; }
.tc-no span { font-size: 12px; }
</style>